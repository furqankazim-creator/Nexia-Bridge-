import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import crypto from 'node:crypto';
import { User, Child, Center, RecordDoc, AuditLog, MedicalFile, nextSeq, ROLES } from './models.js';
import { registerAdminRoutes } from './admin.js';
import { getSettings, seatsUsed, publicOrg } from './settings.js';
import { POLICY, isStaff, isAdmin, isClinical, canRead, canSeeRecord, shapeData, accessMatrix, hasChild, normalizeSharing, MEDICAL_CATEGORIES } from './policy.js';

// Record changes worth keeping in the audit trail (routine chat/practice sync is not).
const AUDITED_COLS = new Set(['targets', 'savedSessions', 'bips', 'teamRequests', 'templates', 'medicalRecords']);
const ORG_CHILD = 'org';

const MAX_DATA_BYTES = 256 * 1024;
const MAX_MEDICAL_FILE = 8 * 1024 * 1024;
const MAX_MEDICAL_FILES_PER_CHILD = 300;
const MEDICAL_MIMES = {
  'application/pdf': (b) => b.subarray(0, 4).toString('latin1') === '%PDF',
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8,
  'image/png': (b) => b.subarray(1, 4).toString('latin1') === 'PNG',
  'image/webp': (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
};
const clip = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

/** Keep only the known fields of a medical record, in a known shape. Returns an error text if it cannot be saved. */
async function cleanMedicalRecord(data, childId) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(data.date || '')) ? data.date : null;
  if (!date) return { error: 'Choose the date of the report.' };
  const title = clip(data.title, 120);
  if (title.length < 2) return { error: 'Give the record a title.' };
  if (!MEDICAL_CATEGORIES.includes(data.category)) return { error: 'Choose a category.' };
  const files = [];
  for (const f of Array.isArray(data.files) ? data.files.slice(0, 5) : []) {
    if (!f || !/^[\w-]{6,64}$/.test(String(f.id))) return { error: 'One attached file is not valid.' };
    const doc = await MedicalFile.findOne({ _id: f.id, childId }, 'name mime size');
    if (!doc) return { error: 'One attached file was not uploaded.' };
    files.push({ id: doc._id, name: doc.name, mime: doc.mime, size: doc.size });
  }
  return {
    next: {
      id: data.id, childId, category: data.category, title, date,
      provider: clip(data.provider, 120), notes: clip(data.notes, 2000),
      sharing: normalizeSharing(data.sharing), files,
      createdAt: typeof data.createdAt === 'string' ? data.createdAt.slice(0, 40) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
}

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email().max(160),
  password: z.string().min(8).max(128),
  role: z.enum(ROLES),
  code: z.string().trim().min(1).max(64),
});
const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(128),
});

const publicUser = (u) => ({ id: String(u._id), name: u.name, email: u.email, role: u.role, childIds: u.childIds, centerId: u.centerId ?? null, scope: u.scope ?? 'assigned', title: u.title ?? '', phone: u.phone ?? '' });

export function createApp({ jwtSecret, staffInviteCode, adminInviteCode = null, corsOrigin = true, authLimit = 30 }) {
  if (!jwtSecret || jwtSecret.length < 16) throw new Error('JWT secret must be at least 16 characters');
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: '1mb' }));

  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: authLimit, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Try again in a few minutes.' } });

  const sign = (u) => jwt.sign({ sub: String(u._id) }, jwtSecret, { expiresIn: '30d' });
  const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

  const audit = async (user, action, details = {}) => {
    try {
      await AuditLog.create({ userId: user ? String(user._id) : undefined, userName: user?.name, role: user?.role, action, details });
    } catch (e) {
      console.error('audit write failed', e.message); // never block the request because the trail failed
    }
  };

  const requireAuth = wrap(async (req, res, next) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Sign in required.' });
    let payload;
    try {
      payload = jwt.verify(token, jwtSecret);
    } catch {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: 'Account not found.' });
    if (user.disabled) return res.status(401).json({ error: 'This account has been switched off. Contact your administrator.' });
    req.user = user;
    next();
  });

  const requireAdmin = (req, res, next) => (isAdmin(req.user) ? next() : res.status(403).json({ error: 'Administrators only.' }));

  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  /* ---------------- auth ---------------- */
  app.post('/api/auth/register', authLimiter, wrap(async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const field = parsed.error.issues[0].path[0];
      const msg = { email: 'Enter a valid email address.', password: 'Password must be at least 8 characters.', name: 'Enter your name (at least 2 letters).', role: 'Choose a role.', code: 'Enter the invite code.' }[field];
      return res.status(400).json({ error: msg || 'Check your details and try again.' });
    }
    const { name, email, password, role, code } = parsed.data;

    let childIds;
    if (role === 'parent') {
      if (!(await getSettings()).access.familySignup) return res.status(403).json({ error: 'Family sign-up is switched off. Ask your administrator.' });
      const child = await Child.findOne({ inviteCode: code.toUpperCase() });
      if (!child) return res.status(403).json({ error: 'That child invite code is not valid.' });
      childIds = [child._id];
    } else if (role === 'admin') {
      // Administrators have their own code: the staff code must never be enough to become one.
      if (!adminInviteCode || code !== adminInviteCode) return res.status(403).json({ error: 'That administrator invite code is not valid.' });
      childIds = (await Child.find({}, '_id')).map((c) => c._id);
    } else {
      const cfg = await getSettings();
      if (!cfg.access.staffSelfRegistration) return res.status(403).json({ error: 'Staff sign-up is switched off. Ask your administrator to create your account.' });
      if (code !== (cfg.staffCode || staffInviteCode)) return res.status(403).json({ error: 'That staff invite code is not valid.' });
      if ((await seatsUsed()) >= cfg.plan.seats) return res.status(409).json({ error: 'All licence seats are in use. Ask your administrator to add seats.' });
      // Children already placed in a centre are reached through that centre, not by a shared code.
      childIds = (await Child.find({ centerId: null, archived: { $ne: true } }, '_id')).map((c) => c._id);
    }

    if (await User.exists({ email })) return res.status(409).json({ error: 'An account with this email already exists.' });
    const user = await User.create({ name, email, role, childIds, passwordHash: await bcrypt.hash(password, 10) });
    await audit(user, 'account.register', { role });
    res.status(201).json({ token: sign(user), user: publicUser(user) });
  }));

  // Parents may join an additional child with that child's code.
  app.post('/api/me/children', requireAuth, wrap(async (req, res) => {
    if (req.user.role !== 'parent') return res.status(403).json({ error: 'Only parents can join with a code.' });
    if (!(await getSettings()).access.familySignup) return res.status(403).json({ error: 'Family sign-up is switched off. Ask your administrator.' });
    const child = await Child.findOne({ inviteCode: String(req.body?.code || '').trim().toUpperCase() });
    if (!child) return res.status(403).json({ error: 'That child invite code is not valid.' });
    if (!req.user.childIds.includes(child._id)) {
      req.user.childIds.push(child._id);
      await req.user.save();
    }
    res.json({ user: publicUser(req.user) });
  }));

  app.post('/api/auth/login', authLimiter, wrap(async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Enter your email and password.' });
    const user = await User.findOne({ email: parsed.data.email });
    // Same message for unknown email and wrong password, so accounts cannot be probed.
    const ok = user && (await bcrypt.compare(parsed.data.password, user.passwordHash));
    if (!ok) {
      await audit(user ?? null, 'auth.login_failed', { email: parsed.data.email });
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    if (user.disabled) return res.status(403).json({ error: 'This account has been switched off. Contact your administrator.' });
    await audit(user, 'auth.login');
    res.json({ token: sign(user), user: publicUser(user) });
  }));

  app.get('/api/me', requireAuth, wrap(async (req, res) => {
    let children = await Child.find({ _id: { $in: req.user.childIds } });
    if (isStaff(req.user)) children = children.filter((c) => !c.archived); // closed cases leave the clinical team's lists
    const staffOn = await User.find({ childIds: { $in: children.map((c) => c._id) }, role: { $nin: ['parent', 'admin'] }, disabled: { $ne: true } });
    const teamOf = (id) => staffOn.filter((u) => u.childIds.includes(id)).map((u) => ({ id: String(u._id), name: u.name, role: u.role, title: u.title || '' }));
    const center = req.user.centerId ? await Center.findById(req.user.centerId) : null;
    res.json({
      user: { ...publicUser(req.user), centerName: center?.name ?? null },
      org: publicOrg(await getSettings()),
      // Invite codes are for staff to hand to families; parents never see them.
      children: children.map((c) => ({ id: c._id, name: c.name, team: teamOf(c._id), ...(isStaff(req.user) ? { inviteCode: c.inviteCode } : {}) })),
    });
  }));

  /* ---------------- sync ---------------- */
  app.get('/api/sync', requireAuth, wrap(async (req, res) => {
    const since = Math.max(0, parseInt(String(req.query.since ?? '0'), 10) || 0);
    const cols = Object.keys(POLICY).filter((c) => canRead(req.user, c));
    const orgCols = cols.filter((c) => POLICY[c].org);
    const docs = await RecordDoc.find({ seq: { $gt: since }, col: { $in: cols }, $or: [{ childId: { $in: req.user.childIds } }, { childId: ORG_CHILD, col: { $in: orgCols } }] }).sort({ seq: 1 }).limit(2000);
    const records = [];
    for (const d of docs) {
      const visible = !d.deleted && canSeeRecord(req.user, d.col, d.data);
      // Items whose visibility can change (e.g. a plan moved back to draft) are sent as a removal,
      // so they also disappear from a device that already had them. Messages never change
      // visibility, so a hidden message is omitted completely: its existence is not revealed.
      if (!visible && !d.deleted && POLICY[d.col].createOnly) continue;
      records.push({ col: d.col, rid: d.rid, childId: d.childId, data: visible ? shapeData(req.user, d.col, d.data) : null, deleted: !visible, seq: d.seq });
    }
    const latest = docs.length ? docs[docs.length - 1].seq : since;
    res.json({ records, latest, more: docs.length === 2000 });
  }));

  const validate = (req, res) => {
    const { col, rid } = req.params;
    if (!POLICY[col]) return res.status(400).json({ error: `Unknown collection "${col}".` });
    if (!/^[\w:.-]{1,120}$/.test(rid)) return res.status(400).json({ error: 'Invalid id.' });
    return null;
  };

  app.put('/api/records/:col/:rid', requireAuth, wrap(async (req, res) => {
    if (validate(req, res)) return;
    const { col, rid } = req.params;
    const policy = POLICY[col];
    const { childId, data } = req.body || {};
    if (isAdmin(req.user)) {
      // An administrator manages accounts, not clinical records. The one exception: answering a team-change request.
      if (!policy.adminFields) return res.status(403).json({ error: 'Administrators manage accounts, not records.' });
      if (typeof childId !== 'string' || !hasChild(req.user, childId)) return res.status(403).json({ error: 'You do not have access to this child.' });
      const was = await RecordDoc.findOne({ col, rid });
      if (!was || was.deleted || was.childId !== childId) return res.status(404).json({ error: 'Request not found.' });
      const merged = { ...was.data };
      for (const f of policy.adminFields) if (f in (data || {})) merged[f] = data[f];
      if (!['open', 'done', 'declined'].includes(merged.status)) return res.status(400).json({ error: 'Unknown status.' });
      merged.resolvedBy = req.user.name;
      const aseq = await nextSeq();
      was.set({ data: merged, seq: aseq, updatedBy: String(req.user._id), updatedAt: new Date() });
      await was.save();
      if (AUDITED_COLS.has(col)) await audit(req.user, 'record.write', { col, rid, childId });
      return res.json({ ok: true, seq: aseq });
    }
    if (policy.org ? childId !== ORG_CHILD : typeof childId !== 'string' || !hasChild(req.user, childId)) return res.status(403).json({ error: policy.org ? 'This belongs to the whole organisation (childId "org").' : 'You do not have access to this child.' });
    if (!data || typeof data !== 'object' || Array.isArray(data)) return res.status(400).json({ error: 'data must be an object.' });
    if (Buffer.byteLength(JSON.stringify(data)) > MAX_DATA_BYTES) return res.status(413).json({ error: 'That record is too large.' });

    if (childId !== ORG_CHILD && (await Child.exists({ _id: childId, archived: true })) && isClinical(req.user)) return res.status(409).json({ error: 'This case is archived and read-only.' });

    const staff = isStaff(req.user);
    const clinical = isClinical(req.user);
    if (policy.write === 'parent' && req.user.role !== 'parent') return res.status(403).json({ error: 'Only the parent can change this.' });
    const existing = await RecordDoc.findOne({ col, rid });
    if (existing && existing.childId !== childId) return res.status(409).json({ error: 'That id belongs to another child.' });

    let next = { ...data, childId };
    if (policy.write === 'staff' && !clinical) {
      // Parents may only change the allowed fields of a task that already exists.
      if (!policy.parentFields || !existing || existing.deleted) return res.status(403).json({ error: 'Only staff can change this.' });
      next = { ...existing.data };
      for (const f of policy.parentFields) if (f in data) next[f] = data[f];
    }
    if (col === 'medicalRecords') {
      const cleaned = await cleanMedicalRecord({ ...data, id: rid }, childId);
      if (cleaned.error) return res.status(400).json({ error: cleaned.error });
      next = cleaned.next;
      // Files taken off the record are removed for good.
      const keep = new Set(next.files.map((f) => f.id));
      const dropped = ((existing && !existing.deleted && existing.data?.files) || []).filter((f) => !keep.has(f.id)).map((f) => f.id);
      if (dropped.length) await MedicalFile.deleteMany({ _id: { $in: dropped }, childId });
    }
    if (col === 'messages' && !staff && !(await getSettings()).policy.parentMessaging) return res.status(403).json({ error: 'Messaging for families is switched off by your administrator.' });
    if (col === 'messages' && next.attachment !== undefined) {
      // A photo or voice note travels inside the message. Keep it to a small, real media data URL.
      const at = next.attachment;
      const okKind = at && typeof at === 'object' && ['image', 'audio'].includes(at.kind);
      const okSrc = okKind && typeof at.src === 'string' && new RegExp(`^data:${at.kind}/[\\w.+-]+(;[\\w=.+-]+)*;base64,`).test(at.src) && at.src.length <= 230_000;
      if (!okSrc) return res.status(400).json({ error: 'That attachment is not a small photo or voice note.' });
      next.attachment = { kind: at.kind, src: at.src, ...(Number.isFinite(at.seconds) ? { seconds: Math.max(0, Math.min(600, Math.round(at.seconds))) } : {}) };
    }
    if (policy.createOnly) {
      if (existing && !existing.deleted) return res.json({ ok: true, seq: existing.seq, duplicate: true }); // retry-safe
      next.senderId = String(req.user._id); // cannot be forged
      next.senderRole = req.user.role;
      next.senderName = req.user.name;
      // Only staff may mark a message staff-only; parents' messages are always family-visible.
      if (!staff) next.audience = 'family';
      if (!next.createdAt) next.createdAt = new Date().toISOString();
    }

    const seq = await nextSeq();
    await RecordDoc.findOneAndUpdate(
      { col, rid },
      { $set: { childId, data: next, deleted: false, seq, updatedBy: String(req.user._id), updatedAt: new Date() } },
      { upsert: true }
    );
    if (AUDITED_COLS.has(col)) await audit(req.user, 'record.write', { col, rid, childId });
    res.json({ ok: true, seq });
  }));

  app.delete('/api/records/:col/:rid', requireAuth, wrap(async (req, res) => {
    if (validate(req, res)) return;
    const { col, rid } = req.params;
    const policy = POLICY[col];
    const allowed = policy.write === 'parent' ? req.user.role === 'parent' : isClinical(req.user);
    if (!allowed || policy.createOnly) return res.status(403).json({ error: 'You cannot delete this.' });
    const existing = await RecordDoc.findOne({ col, rid });
    if (!existing) return res.json({ ok: true });
    if (col === 'medicalRecords' && existing.data?.files?.length) {
      if (!hasChild(req.user, existing.childId)) return res.status(403).json({ error: 'You do not have access to this child.' });
      await MedicalFile.deleteMany({ _id: { $in: existing.data.files.map((f) => f.id) }, childId: existing.childId });
    }
    if (!(policy.org && existing.childId === ORG_CHILD) && !hasChild(req.user, existing.childId)) return res.status(403).json({ error: 'You do not have access to this child.' });
    if (policy.write !== 'parent' && existing.childId !== ORG_CHILD && (await Child.exists({ _id: existing.childId, archived: true }))) return res.status(409).json({ error: 'This case is archived and read-only.' });
    const seq = await nextSeq();
    existing.set({ data: null, deleted: true, seq, updatedBy: String(req.user._id), updatedAt: new Date() });
    await existing.save();
    if (AUDITED_COLS.has(col)) await audit(req.user, 'record.delete', { col, rid, childId: existing.childId });
    res.json({ ok: true, seq });
  }));

  /* ---------------- medical files ---------------- */
  const fileId = (req, res) => (/^[\w-]{6,64}$/.test(req.params.id) ? true : (res.status(400).json({ error: 'Invalid id.' }), false));

  app.put('/api/medical-files/:id', requireAuth, express.raw({ type: () => true, limit: MAX_MEDICAL_FILE }), wrap(async (req, res) => {
    if (!fileId(req, res)) return;
    if (req.user.role !== 'parent') return res.status(403).json({ error: 'Only the parent can add medical files.' });
    const childId = String(req.query.childId || '');
    if (!hasChild(req.user, childId)) return res.status(403).json({ error: 'You do not have access to this child.' });
    const mime = String(req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    const body = req.body;
    if (!MEDICAL_MIMES[mime]) return res.status(415).json({ error: 'Only PDF, JPG, PNG or WebP files can be saved.' });
    if (!Buffer.isBuffer(body) || body.length < 16) return res.status(400).json({ error: 'That file is empty.' });
    if (!MEDICAL_MIMES[mime](body)) return res.status(415).json({ error: 'That file does not look like a real ' + mime.split('/')[1].toUpperCase() + '.' });
    const was = await MedicalFile.findById(req.params.id, 'childId');
    if (was && was.childId !== childId) return res.status(409).json({ error: 'That id belongs to another child.' });
    if (!was && (await MedicalFile.countDocuments({ childId })) >= MAX_MEDICAL_FILES_PER_CHILD) return res.status(409).json({ error: 'This child has reached the file limit.' });
    const name = clip(String(req.query.name || 'report'), 160) || 'report';
    await MedicalFile.findOneAndUpdate({ _id: req.params.id }, { $set: { childId, uploadedBy: String(req.user._id), name, mime, size: body.length, data: body } }, { upsert: true });
    res.json({ ok: true, id: req.params.id, name, mime, size: body.length });
  }));

  app.get('/api/medical-files/:id', requireAuth, wrap(async (req, res) => {
    if (!fileId(req, res)) return;
    if (isAdmin(req.user)) return res.status(403).json({ error: 'Administrators cannot open medical files.' });
    const file = await MedicalFile.findById(req.params.id);
    if (!file || !hasChild(req.user, file.childId)) return res.status(404).json({ error: 'File not found.' });
    if (req.user.role !== 'parent') {
      // Staff open a file only while a record that the parent shared with them still points to it.
      const rec = await RecordDoc.findOne({ col: 'medicalRecords', childId: file.childId, deleted: false, 'data.files.id': file._id });
      if (!rec || !canSeeRecord(req.user, 'medicalRecords', rec.data)) return res.status(404).json({ error: 'File not found.' });
      await audit(req.user, 'medical.view', { childId: file.childId, rid: rec.rid });
    }
    res.set({
      'Content-Type': file.mime,
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Cache-Control': 'private, no-store',
    });
    res.send(file.data);
  }));

  app.delete('/api/medical-files/:id', requireAuth, wrap(async (req, res) => {
    if (!fileId(req, res)) return;
    if (req.user.role !== 'parent') return res.status(403).json({ error: 'Only the parent can remove medical files.' });
    const file = await MedicalFile.findById(req.params.id, 'childId');
    if (!file) return res.json({ ok: true });
    if (!hasChild(req.user, file.childId)) return res.status(403).json({ error: 'You do not have access to this child.' });
    if (await RecordDoc.exists({ col: 'medicalRecords', childId: file.childId, deleted: false, 'data.files.id': file._id })) return res.status(409).json({ error: 'Remove the file from its record first.' });
    await MedicalFile.deleteOne({ _id: file._id });
    res.json({ ok: true });
  }));

  registerAdminRoutes(app, { requireAuth, requireAdmin, wrap, audit, staffInviteCode });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found.' }));
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });
  return app;
}
