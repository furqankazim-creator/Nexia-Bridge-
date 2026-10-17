import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { z } from 'zod';
import { User, Child, Center, Invoice, AuditLog, Counter, ROLES, CENTER_TYPES, INVOICE_STATUSES } from './models.js';
import { accessMatrix } from './policy.js';
import { getSettings, saveSettings, seatsUsed, settingsPatch } from './settings.js';

export const userRow = (u) => ({
  id: String(u._id), name: u.name, email: u.email, role: u.role, childIds: u.childIds, disabled: !!u.disabled,
  centerId: u.centerId ?? null, scope: u.scope ?? 'assigned', title: u.title ?? '', phone: u.phone ?? '', createdAt: u.createdAt,
});
const childRow = (c) => ({ id: c._id, name: c.name, inviteCode: c.inviteCode, centerId: c.centerId ?? null, archived: !!c.archived });
const centerRow = (c) => ({ id: c._id, name: c.name, type: c.type, archived: !!c.archived });
const invoiceRow = (i) => ({
  id: String(i._id), number: i.number, centerId: i.centerId ?? null, childId: i.childId ?? null, description: i.description, amount: i.amount,
  currency: i.currency, status: i.status, dueDate: i.dueDate ?? null, issuedAt: i.issuedAt ?? null, paidAt: i.paidAt ?? null, createdAt: i.createdAt,
});

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'center';
const OID = /^[a-f0-9]{24}$/i;

/**
 * Keep the access lists of scope-driven accounts correct. An organisation-wide administrator reaches every
 * child, a centre administrator the children of that centre, and a staff member with centre-wide visibility
 * the children of their centre. Everything else is a hand-picked list that is left alone.
 */
export async function syncScopedAccess() {
  const kids = await Child.find();
  const users = await User.find({ $or: [{ role: 'admin' }, { scope: 'center' }] });
  for (const u of users) {
    let ids;
    if (u.role === 'admin') ids = kids.filter((k) => !u.centerId || k.centerId === u.centerId).map((k) => k._id);
    else if (u.centerId) ids = kids.filter((k) => k.centerId === u.centerId && !k.archived).map((k) => k._id);
    else continue;
    if (ids.length !== u.childIds.length || ids.some((x) => !u.childIds.includes(x))) {
      u.childIds = ids;
      await u.save();
    }
  }
}

export function registerAdminRoutes(app, { requireAuth, requireAdmin, wrap, audit, staffInviteCode }) {
  const guard = [requireAuth, requireAdmin];
  const bad = (res, msg, code = 400) => res.status(code).json({ error: msg });

  // The centre an administrator is limited to (null = the whole organisation).
  const myCenter = (req) => req.user.centerId ?? null;
  const orgWide = (req) => !myCenter(req);
  const childInScope = (req, c) => orgWide(req) || c.centerId === myCenter(req);
  const userInScope = async (req, u) => {
    if (orgWide(req)) return true;
    if (u.role === 'parent') return (await Child.find({ _id: { $in: u.childIds } })).some((c) => c.centerId === myCenter(req));
    return u.centerId === myCenter(req);
  };
  const needOrgWide = (req, res) => (orgWide(req) ? false : (bad(res, 'Only an organisation-wide administrator can do this.', 403), true));

  /* ----- centres ----- */
  app.get('/api/admin/centers', ...guard, wrap(async (req, res) => {
    const all = await Center.find().sort({ createdAt: 1 });
    res.json({ centers: all.filter((c) => orgWide(req) || c._id === myCenter(req)).map(centerRow) });
  }));

  const centerBody = z.object({ name: z.string().trim().min(2).max(80), type: z.enum(CENTER_TYPES) });
  app.post('/api/admin/centers', ...guard, wrap(async (req, res) => {
    if (needOrgWide(req, res)) return;
    const p = centerBody.safeParse(req.body);
    if (!p.success) return bad(res, 'Give the centre a name and choose its type.');
    let id = `center-${slug(p.data.name)}`;
    if (await Center.exists({ _id: id })) id = `${id}-${crypto.randomBytes(2).toString('hex')}`;
    const c = await Center.create({ _id: id, ...p.data });
    await audit(req.user, 'admin.create_center', { centerId: c._id, type: c.type });
    res.status(201).json({ center: centerRow(c) });
  }));

  app.patch('/api/admin/centers/:id', ...guard, wrap(async (req, res) => {
    if (needOrgWide(req, res)) return;
    const c = await Center.findById(req.params.id);
    if (!c) return bad(res, 'Centre not found.', 404);
    const { name, type, archived } = req.body || {};
    if (name !== undefined) { if (typeof name !== 'string' || name.trim().length < 2) return bad(res, 'Give the centre a name.'); c.name = name.trim().slice(0, 80); }
    if (type !== undefined) { if (!CENTER_TYPES.includes(type)) return bad(res, 'Unknown centre type.'); c.type = type; }
    if (archived !== undefined) {
      if (typeof archived !== 'boolean') return bad(res, 'archived must be true or false.');
      if (archived && ((await Child.exists({ centerId: c._id, archived: { $ne: true } })) || (await User.exists({ centerId: c._id, disabled: { $ne: true }, role: { $ne: 'admin' } })))) {
        return bad(res, 'Move or switch off this centre’s active children and staff first.');
      }
      c.archived = archived;
    }
    await c.save();
    await audit(req.user, 'admin.update_center', { centerId: c._id });
    res.json({ center: centerRow(c) });
  }));

  /* ----- users ----- */
  app.get('/api/admin/users', ...guard, wrap(async (req, res) => {
    const all = await User.find().sort({ createdAt: 1 });
    const out = [];
    for (const u of all) if (await userInScope(req, u)) out.push(userRow(u));
    res.json({ users: out });
  }));

  const createUser = z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(160),
    password: z.string().min(8).max(128),
    role: z.enum(ROLES),
    title: z.string().trim().max(80).optional(),
    phone: z.string().trim().max(30).optional(),
    centerId: z.string().nullable().optional(),
    scope: z.enum(['assigned', 'center']).optional(),
    childIds: z.array(z.string()).optional(),
  });

  // Staff may only be linked to children of their own centre (a staff member with no centre can work anywhere).
  const checkLinks = async (req, res, { role, centerId, childIds }) => {
    const kids = await Child.find({ _id: { $in: childIds } });
    if (kids.length !== new Set(childIds).size) { bad(res, 'Unknown child in the list.'); return false; }
    if (!kids.every((k) => childInScope(req, k))) { bad(res, 'That child is outside your scope.', 403); return false; }
    if (role !== 'parent' && centerId && kids.some((k) => k.centerId && k.centerId !== centerId)) { bad(res, 'Staff can only be linked to children of their own centre. Transfer the child first.'); return false; }
    return true;
  };

  app.post('/api/admin/users', ...guard, wrap(async (req, res) => {
    const p = createUser.safeParse(req.body);
    if (!p.success) {
      const f = p.error.issues[0].path[0];
      return bad(res, { email: 'Enter a valid email address.', password: 'The password must be at least 8 characters.', name: 'Enter a name (at least 2 letters).', role: 'Choose a role.' }[f] || 'Check the details.');
    }
    const d = p.data;
    if (d.role === 'admin' && !orgWide(req)) return bad(res, 'Only an organisation-wide administrator can create administrators.', 403);
    let centerId = d.centerId ?? null;
    if (!orgWide(req)) centerId = myCenter(req);
    if (centerId && !(await Center.exists({ _id: centerId, archived: { $ne: true } }))) return bad(res, 'Unknown or archived centre.');
    if (d.role === 'parent') centerId = null;
    const childIds = d.role === 'admin' ? [] : [...new Set(d.childIds ?? [])];
    if (d.role === 'parent' && childIds.length === 0) return bad(res, 'Link the parent to their child.');
    if (!(await checkLinks(req, res, { role: d.role, centerId, childIds }))) return;
    if (await User.exists({ email: d.email })) return bad(res, 'An account with this email already exists.', 409);
    if (d.role !== 'parent' && d.role !== 'admin' && (await seatsUsed()) >= (await getSettings()).plan.seats) return bad(res, 'All licence seats are in use. Add seats under Billing first.', 409);
    const scope = d.role === 'parent' || d.role === 'admin' ? 'assigned' : d.scope ?? 'assigned';
    if (scope === 'center' && !centerId) return bad(res, 'Centre-wide visibility needs a centre.');
    const u = await User.create({ name: d.name, email: d.email, role: d.role, title: d.title ?? '', phone: d.phone ?? '', centerId, scope, childIds, passwordHash: await bcrypt.hash(d.password, 10) });
    await syncScopedAccess();
    await audit(req.user, 'admin.create_account', { target: String(u._id), targetName: u.name, role: u.role, centerId });
    res.status(201).json({ user: userRow(await User.findById(u._id)) });
  }));

  app.patch('/api/admin/users/:id', ...guard, wrap(async (req, res) => {
    const target = OID.test(req.params.id) ? await User.findById(req.params.id) : null;
    if (!target) return bad(res, 'Account not found.', 404);
    if (!(await userInScope(req, target))) return bad(res, 'That account is outside your scope.', 403);
    const self = String(target._id) === String(req.user._id);
    const { childIds, disabled, name, role, centerId, scope, title, phone, password } = req.body || {};
    if (title !== undefined) { if (typeof title !== 'string' || title.length > 80) return bad(res, 'Title is too long.'); target.title = title.trim(); }
    if (phone !== undefined) { if (typeof phone !== 'string' || phone.length > 30) return bad(res, 'Phone is too long.'); target.phone = phone.trim(); }
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 8 || password.length > 128) return bad(res, 'The password must be at least 8 characters.');
      target.passwordHash = await bcrypt.hash(password, 10);
    }
    if (name !== undefined) { if (typeof name !== 'string' || name.trim().length < 2) return bad(res, 'Enter a name (at least 2 letters).'); target.name = name.trim().slice(0, 80); }
    if (disabled !== undefined) {
      if (typeof disabled !== 'boolean') return bad(res, 'disabled must be true or false.');
      if (self && disabled) return bad(res, 'You cannot switch off your own account.');
      if (!disabled && target.disabled && target.role !== 'parent' && target.role !== 'admin' && (await seatsUsed()) >= (await getSettings()).plan.seats) return bad(res, 'All licence seats are in use. Add seats under Billing first.', 409);
      target.disabled = disabled;
    }
    if (role !== undefined) {
      if (!ROLES.includes(role)) return bad(res, 'Choose a role.');
      if (role !== target.role) {
        if (self) return bad(res, 'You cannot change your own role.');
        if ((role === 'admin' || target.role === 'admin') && !orgWide(req)) return bad(res, 'Only an organisation-wide administrator can change administrator roles.', 403);
        if ((role === 'parent') !== (target.role === 'parent')) return bad(res, 'A parent account cannot become staff or the other way round. Create a new account.');
        if (role === 'admin') { target.scope = 'assigned'; }
        target.role = role;
      }
    }
    if (centerId !== undefined) {
      if (!orgWide(req)) return bad(res, 'Only an organisation-wide administrator can move people between centres.', 403);
      if (centerId !== null && !(await Center.exists({ _id: centerId, archived: { $ne: true } }))) return bad(res, 'Unknown or archived centre.');
      if (target.role === 'parent') return bad(res, 'Parents belong to their child’s centre.');
      target.centerId = centerId;
      if (target.role !== 'admin') {
        // Moving to another centre drops links to children that stay behind.
        const kids = await Child.find({ _id: { $in: target.childIds } });
        target.childIds = target.childIds.filter((id) => { const k = kids.find((x) => x._id === id); return !centerId || !k?.centerId || k.centerId === centerId; });
        if (!centerId) target.scope = 'assigned';
      }
    }
    if (scope !== undefined) {
      if (!['assigned', 'center'].includes(scope)) return bad(res, 'Unknown visibility scope.');
      if (['parent', 'admin'].includes(target.role)) return bad(res, 'Visibility scopes apply to staff.');
      if (scope === 'center' && !target.centerId) return bad(res, 'Centre-wide visibility needs a centre.');
      target.scope = scope;
    }
    if (childIds !== undefined) {
      if (!Array.isArray(childIds) || !childIds.every((c) => typeof c === 'string')) return bad(res, 'childIds must be a list of child ids.');
      if (target.role === 'parent' && childIds.length === 0) return bad(res, 'A parent must stay linked to at least one child. Switch the account off instead.');
      if (!(await checkLinks(req, res, { role: target.role, centerId: target.centerId, childIds }))) return;
      target.childIds = [...new Set(childIds)];
    }
    await target.save();
    await syncScopedAccess();
    await audit(req.user, 'admin.update_account', {
      target: String(target._id), targetName: target.name,
      ...(childIds !== undefined ? { childIds: target.childIds } : {}), ...(disabled !== undefined ? { disabled } : {}),
      ...(role !== undefined ? { role } : {}), ...(password !== undefined ? { passwordReset: true } : {}), ...(centerId !== undefined ? { centerId } : {}), ...(scope !== undefined ? { scope } : {}),
    });
    res.json({ user: userRow(await User.findById(target._id)) });
  }));

  // Remove an account for good. Their records stay with the child; only the login goes.
  app.delete('/api/admin/users/:id', ...guard, wrap(async (req, res) => {
    const target = OID.test(req.params.id) ? await User.findById(req.params.id) : null;
    if (!target) return bad(res, 'Account not found.', 404);
    if (!(await userInScope(req, target))) return bad(res, 'That account is outside your scope.', 403);
    if (String(target._id) === String(req.user._id)) return bad(res, 'You cannot remove your own account.');
    if (target.role === 'admin' && !orgWide(req)) return bad(res, 'Only an organisation-wide administrator can remove administrators.', 403);
    if (target.role === 'admin' && !target.centerId && (await User.countDocuments({ role: 'admin', centerId: null, disabled: { $ne: true } })) <= 1) return bad(res, 'This is the last organisation-wide administrator.');
    await target.deleteOne();
    await audit(req.user, 'admin.remove_account', { target: String(target._id), targetName: target.name, role: target.role });
    res.json({ ok: true });
  }));

  /* ----- children / cases ----- */
  app.get('/api/admin/children', ...guard, wrap(async (req, res) => {
    res.json({ children: (await Child.find()).filter((c) => childInScope(req, c)).map(childRow) });
  }));

  app.post('/api/admin/children', ...guard, wrap(async (req, res) => {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (name.length < 2 || name.length > 80) return bad(res, 'Enter the child’s name.');
    let centerId = req.body?.centerId ?? null;
    if (!orgWide(req)) centerId = myCenter(req);
    if (centerId && !(await Center.exists({ _id: centerId, archived: { $ne: true } }))) return bad(res, 'Unknown or archived centre.');
    const c = await Child.create({ _id: `child-${crypto.randomBytes(4).toString('hex')}`, name, centerId, inviteCode: crypto.randomBytes(4).toString('hex').toUpperCase() });
    await syncScopedAccess();
    await audit(req.user, 'admin.create_child', { childId: c._id, centerId });
    res.status(201).json({ child: childRow(c) });
  }));

  app.patch('/api/admin/children/:id', ...guard, wrap(async (req, res) => {
    const c = await Child.findById(req.params.id);
    if (!c) return bad(res, 'Child not found.', 404);
    if (!childInScope(req, c)) return bad(res, 'That child is outside your scope.', 403);
    const { name, centerId, archived } = req.body || {};
    if (name !== undefined) { if (typeof name !== 'string' || name.trim().length < 2) return bad(res, 'Enter the child’s name.'); c.name = name.trim().slice(0, 80); }
    let transferred = false;
    if (centerId !== undefined && centerId !== (c.centerId ?? null)) {
      if (!orgWide(req)) return bad(res, 'Only an organisation-wide administrator can transfer a case to another centre.', 403);
      if (centerId !== null && !(await Center.exists({ _id: centerId, archived: { $ne: true } }))) return bad(res, 'Unknown or archived centre.');
      c.centerId = centerId;
      transferred = true;
    }
    if (archived !== undefined) {
      if (typeof archived !== 'boolean') return bad(res, 'archived must be true or false.');
      c.archived = archived;
      c.archivedAt = archived ? new Date() : undefined;
    }
    await c.save();
    if (transferred) {
      // Data separation: the previous centre's staff lose access to this child, parents keep theirs.
      const staff = await User.find({ childIds: c._id, role: { $nin: ['parent', 'admin'] } });
      for (const u of staff) if (u.centerId && u.centerId !== c.centerId) { u.childIds = u.childIds.filter((x) => x !== c._id); await u.save(); }
    }
    await syncScopedAccess();
    await audit(req.user, 'admin.update_child', { childId: c._id, ...(transferred ? { transferredTo: c.centerId } : {}), ...(archived !== undefined ? { archived } : {}) });
    res.json({ child: childRow(c) });
  }));

  // Who works with this child: the staff list is replaced as a whole ("reassign therapists").
  app.put('/api/admin/children/:id/staff', ...guard, wrap(async (req, res) => {
    const c = await Child.findById(req.params.id);
    if (!c) return bad(res, 'Child not found.', 404);
    if (!childInScope(req, c)) return bad(res, 'That child is outside your scope.', 403);
    const ids = req.body?.userIds;
    if (!Array.isArray(ids) || !ids.every((x) => typeof x === 'string' && OID.test(x))) return bad(res, 'userIds must be a list of account ids.');
    const picked = await User.find({ _id: { $in: ids } });
    if (picked.length !== new Set(ids).size) return bad(res, 'Unknown account in the list.');
    for (const u of picked) {
      if (u.role === 'parent' || u.role === 'admin') return bad(res, 'Only staff can be assigned to a child.');
      if (u.disabled) return bad(res, `${u.name} is switched off.`);
      if (u.centerId && c.centerId && u.centerId !== c.centerId) return bad(res, `${u.name} works in another centre.`);
      if (!(await userInScope(req, u))) return bad(res, `${u.name} is outside your scope.`, 403);
    }
    const want = new Set(ids);
    for (const u of await User.find({ role: { $nin: ['parent', 'admin'] } })) {
      if (u.scope === 'center' && u.centerId && u.centerId === c.centerId) continue; // follows the centre automatically
      if (!(await userInScope(req, u))) continue;
      const has = u.childIds.includes(c._id);
      if (want.has(String(u._id)) && !has) { u.childIds.push(c._id); await u.save(); }
      if (!want.has(String(u._id)) && has) { u.childIds = u.childIds.filter((x) => x !== c._id); await u.save(); }
    }
    await audit(req.user, 'admin.assign_team', { childId: c._id, count: ids.length });
    res.json({ ok: true });
  }));

  app.post('/api/admin/children/:id/regenerate-code', ...guard, wrap(async (req, res) => {
    const child = await Child.findById(req.params.id);
    if (!child) return bad(res, 'Child not found.', 404);
    if (!childInScope(req, child)) return bad(res, 'That child is outside your scope.', 403);
    child.inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    await child.save();
    await audit(req.user, 'admin.regenerate_family_code', { childId: child._id });
    res.json({ child: childRow(child) });
  }));

  /* ----- billing ----- */
  const invScope = (req, i) => orgWide(req) || i.centerId === myCenter(req);
  app.get('/api/admin/invoices', ...guard, wrap(async (req, res) => {
    const list = (await Invoice.find().sort({ createdAt: -1 })).filter((i) => invScope(req, i));
    const sum = (st) => Math.round(list.filter((i) => i.status === st).reduce((a, i) => a + i.amount, 0) * 100) / 100;
    res.json({ invoices: list.map(invoiceRow), totals: { draft: sum('draft'), outstanding: sum('issued'), paid: sum('paid') } });
  }));

  const invoiceBody = z.object({
    description: z.string().trim().min(2).max(200),
    amount: z.number().positive().max(10_000_000),
    centerId: z.string().nullable().optional(),
    childId: z.string().nullable().optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  });
  app.post('/api/admin/invoices', ...guard, wrap(async (req, res) => {
    const p = invoiceBody.safeParse(req.body);
    if (!p.success) return bad(res, 'Give the invoice a description and an amount above zero.');
    const d = p.data;
    let centerId = d.centerId ?? null;
    const child = d.childId ? await Child.findById(d.childId) : null;
    if (d.childId && !child) return bad(res, 'Unknown child.');
    if (child) { if (!childInScope(req, child)) return bad(res, 'That child is outside your scope.', 403); centerId = child.centerId ?? centerId; }
    if (!orgWide(req)) centerId = myCenter(req);
    if (centerId && !(await Center.exists({ _id: centerId }))) return bad(res, 'Unknown centre.');
    const n = (await Counter.findOneAndUpdate({ _id: 'invoice' }, { $inc: { n: 1 } }, { upsert: true, new: true })).n;
    const i = await Invoice.create({ number: `INV-${String(n).padStart(4, '0')}`, centerId, childId: child?._id ?? null, description: d.description, amount: Math.round(d.amount * 100) / 100, dueDate: d.dueDate ?? undefined, createdBy: String(req.user._id) });
    await audit(req.user, 'admin.create_invoice', { number: i.number, amount: i.amount });
    res.status(201).json({ invoice: invoiceRow(i) });
  }));

  // draft -> issued -> paid; a draft or issued invoice can be voided. Paid invoices are final.
  const NEXT = { draft: ['issued', 'void'], issued: ['paid', 'void'], paid: [], void: [] };
  app.patch('/api/admin/invoices/:id', ...guard, wrap(async (req, res) => {
    const i = OID.test(req.params.id) ? await Invoice.findById(req.params.id) : null;
    if (!i || !invScope(req, i)) return bad(res, 'Invoice not found.', 404);
    const { status, description, amount, dueDate } = req.body || {};
    if ((description !== undefined || amount !== undefined || dueDate !== undefined) && i.status !== 'draft') return bad(res, 'Only a draft invoice can be edited.');
    if (description !== undefined) { if (typeof description !== 'string' || description.trim().length < 2) return bad(res, 'Give the invoice a description.'); i.description = description.trim().slice(0, 200); }
    if (amount !== undefined) { if (typeof amount !== 'number' || !(amount > 0) || amount > 10_000_000) return bad(res, 'Amount must be above zero.'); i.amount = Math.round(amount * 100) / 100; }
    if (dueDate !== undefined) { if (dueDate !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) return bad(res, 'Use a date like 2026-12-31.'); i.dueDate = dueDate ?? undefined; }
    if (status !== undefined) {
      if (!INVOICE_STATUSES.includes(status) || !NEXT[i.status].includes(status)) return bad(res, `A ${i.status} invoice cannot become ${status}.`);
      i.status = status;
      if (status === 'issued') i.issuedAt = new Date();
      if (status === 'paid') i.paidAt = new Date();
    }
    await i.save();
    await audit(req.user, 'admin.update_invoice', { number: i.number, status: i.status });
    res.json({ invoice: invoiceRow(i) });
  }));

  /* ----- organisation settings and subscription ----- */
  app.get('/api/admin/settings', ...guard, wrap(async (req, res) => {
    const s = await getSettings();
    res.json({ settings: { ...s, staffCode: orgWide(req) ? s.staffCode || staffInviteCode : null }, seatsUsed: await seatsUsed(), canEdit: orgWide(req) });
  }));

  app.patch('/api/admin/settings', ...guard, wrap(async (req, res) => {
    if (needOrgWide(req, res)) return;
    const p = settingsPatch.safeParse(req.body);
    if (!p.success) return bad(res, 'Check the settings: ' + (p.error.issues[0]?.path.join('.') || 'value') + ' is not valid.');
    const cur = await getSettings();
    const d = p.data;
    if (d.plan?.seats !== undefined && d.plan.seats < (await seatsUsed())) return bad(res, `${await seatsUsed()} seats are in use. Switch people off first, or keep at least that many seats.`);
    const next = { ...cur, name: d.name ?? cur.name, plan: { ...cur.plan, ...(d.plan ?? {}) }, access: { ...cur.access, ...(d.access ?? {}) }, policy: { ...cur.policy, ...(d.policy ?? {}) } };
    await saveSettings(next);
    await audit(req.user, 'admin.update_settings', { changed: Object.keys(d) });
    res.json({ settings: { ...next, staffCode: next.staffCode || staffInviteCode }, seatsUsed: await seatsUsed(), canEdit: true });
  }));

  app.post('/api/admin/settings/staff-code', ...guard, wrap(async (req, res) => {
    if (needOrgWide(req, res)) return;
    const cur = await getSettings();
    const staffCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    await saveSettings({ ...cur, staffCode });
    await audit(req.user, 'admin.rotate_staff_code');
    res.json({ staffCode });
  }));

  /* ----- audit and access ----- */
  app.get('/api/admin/audit', ...guard, wrap(async (req, res) => {
    const limit = Math.min(500, Math.max(1, parseInt(String(req.query.limit ?? '100'), 10) || 100));
    let events = await AuditLog.find().sort({ at: -1 }).limit(orgWide(req) ? limit : 500);
    if (!orgWide(req)) {
      // A centre administrator sees the trail of people in their own scope only.
      const mine = new Set((await User.find({ centerId: myCenter(req) })).map((u) => String(u._id)));
      events = events.filter((e) => e.userId && mine.has(e.userId)).slice(0, limit);
    }
    res.json({ events: events.map((e) => ({ id: String(e._id), at: e.at, userName: e.userName ?? null, role: e.role ?? null, action: e.action, details: e.details })) });
  }));

  app.get('/api/admin/access', ...guard, (_req, res) => res.json({ matrix: accessMatrix() }));
}
