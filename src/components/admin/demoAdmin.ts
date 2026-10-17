import type { OrgSettings, PublicOrg, SettingsReply, AdminApi, AdminAuditEvent, AdminCenter, AdminChild, AdminInvoice, AdminUser, CenterType, InvoiceStatus, InvoiceTotals } from '../../api/client';

/**
 * The offline demo's stand-in for the administrator endpoints. Same shape as the real API, so every
 * admin screen works unchanged; the data lives in this browser only and is seeded with dummy people.
 */
interface Db { settings: OrgSettings; users: AdminUser[]; kids: AdminChild[]; centers: AdminCenter[]; invoices: AdminInvoice[]; events: AdminAuditEvent[]; n: number }
const KEY = 'nexia.demoAdmin.v1';

const user = (id: string, name: string, email: string, role: AdminUser['role'], title: string, centerId: string | null, childIds: string[], extra: Partial<AdminUser> = {}): AdminUser =>
  ({ id, name, email, role, title, phone: '', centerId, scope: 'assigned', childIds, disabled: false, ...extra });
const inv = (n: number, description: string, amount: number, status: InvoiceStatus, childId: string | null, centerId: string | null, dueDate: string | null): AdminInvoice =>
  ({ id: `inv-${n}`, number: `INV-${String(n).padStart(4, '0')}`, centerId, childId, description, amount, currency: 'SAR', status, dueDate, issuedAt: status === 'draft' ? null : '2026-09-01T09:00:00Z', paidAt: status === 'paid' ? '2026-09-12T09:00:00Z' : null, createdAt: '2026-09-01T09:00:00Z' });

const DEMO_SETTINGS: OrgSettings = {
  name: 'Al-Amal Development Center',
  plan: { name: 'Clinic Multidisciplinary Pro', seats: 20, billingCycle: 'annual', billedOn: '2026-10', renewalDate: '2027-10-15', status: 'active' },
  access: { staffSelfRegistration: true, familySignup: true },
  policy: { requireGoalApproval: true, parentMessaging: true, integrityMin: 80, ioaMin: 80, observationDays: 30, stalledDays: 14 },
  staffCode: 'DEMO1234',
};

const seed = (): Db => ({
  n: 10,
  settings: structuredClone(DEMO_SETTINGS),
  centers: [
    { id: 'center-riyadh', name: 'Riyadh Speech Center', type: 'speech_therapy', archived: false },
    { id: 'center-jeddah', name: 'Jeddah Clinic', type: 'clinic', archived: false },
  ],
  kids: [
    { id: 'child-lama', name: 'Lama Alharbi', inviteCode: '0AA50F5F', centerId: 'center-riyadh', archived: false },
    { id: 'child-2', name: 'Maya Al-Rashid', inviteCode: '06BC0EC7', centerId: 'center-riyadh', archived: false },
    { id: 'child-3', name: 'Tariq Al-Otaibi', inviteCode: '525276E5', centerId: 'center-jeddah', archived: false },
  ],
  users: [
    user('demo-admin', 'System Administrator', 'admin@nexiabridge.sa', 'admin', 'Clinic operations', null, []),
    user('u-tareq', 'Dr. Tareq Hassan', 'tareq.bcba@nexiabridge.sa', 'behavior', 'Board Certified Behavior Analyst (BCBA)', 'center-riyadh', ['child-lama', 'child-2'], { phone: '+966 50 111 2233' }),
    user('u-sarah', 'Dr. Sarah Alharbi', 'dr.sarah.slp@nexiabridge.sa', 'speech', 'Speech-Language Pathologist (SLP)', 'center-riyadh', ['child-lama', 'child-2'], { phone: '+966 50 222 3344' }),
    user('u-nora', 'Nora Fahad', 'nora.slp@nexiabridge.sa', 'speech', 'Speech Therapist', 'center-jeddah', ['child-3']),
    user('u-hana', 'Hana Al-Zahrani', 'hana.ot@nexiabridge.sa', 'ot', 'Occupational Therapist (OT)', 'center-jeddah', ['child-3']),
    user('u-reem', 'Reem Al-Ahmad', 'reem.ot@nexiabridge.sa', 'ot', 'Occupational Therapist (OT)', 'center-riyadh', ['child-lama']),
    user('u-omar', 'Mr. Omar Khaled', 'omar.remedial@nexiabridge.sa', 'remedial', 'Remedial & Special Education Specialist', 'center-jeddah', ['child-3']),
    user('u-layla', 'Ms. Layla Fahad', 'layla.teacher@nexiabridge.sa', 'teacher', 'Special-education teacher', 'center-riyadh', ['child-lama']),
    user('u-mona', 'Mona Saleh', 'mona.teacher@nexiabridge.sa', 'teacher', 'Special-education teacher', 'center-jeddah', ['child-3'], { disabled: true }),
    user('u-rebecca', 'Dr. Rebecca Hall', 'rebecca.director@nexiabridge.sa', 'supervisor', 'Clinical Director & Supervisor', 'center-riyadh', ['child-lama', 'child-2'], { scope: 'center' }),
    user('p-sarah', 'Sarah Alharbi', 'sarah.alharbi@example.com', 'parent', '', null, ['child-lama']),
    user('p-omar', 'Omar Al-Rashid', 'omar.rashid@example.com', 'parent', '', null, ['child-2']),
    user('p-fatima', 'Fatima Al-Otaibi', 'fatima.otaibi@example.com', 'parent', '', null, ['child-3']),
  ],
  invoices: [
    inv(1, 'Speech sessions, August', 1800, 'paid', 'child-lama', 'center-riyadh', '2026-09-10'),
    inv(2, 'Behavior programme, September', 2400, 'issued', 'child-2', 'center-riyadh', '2026-10-20'),
    inv(3, 'Initial assessment', 950, 'draft', 'child-3', 'center-jeddah', null),
  ],
  events: [
    { id: 'e1', at: '2026-10-14T08:30:00Z', userName: 'System Administrator', role: 'admin', action: 'admin.create_center', details: {} },
    { id: 'e2', at: '2026-10-14T08:41:00Z', userName: 'System Administrator', role: 'admin', action: 'admin.create_account', details: {} },
    { id: 'e3', at: '2026-10-15T10:05:00Z', userName: 'Dr. Tareq Hassan', role: 'behavior', action: 'record.write', details: { col: 'targets' } },
    { id: 'e4', at: '2026-10-15T14:20:00Z', userName: 'Dr. Rebecca Hall', role: 'supervisor', action: 'record.write', details: { col: 'savedSessions' } },
  ],
});

const load = (): Db => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) { const db = JSON.parse(raw) as Db; db.settings ??= structuredClone(DEMO_SETTINGS); db.settings.policy = { ...DEMO_SETTINGS.policy, ...db.settings.policy }; return db; }
  } catch { /* use seed */ }
  return seed();
};
const save = (db: Db) => { try { window.localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* storage unavailable: changes last for this visit only */ } };
const fail = (msg: string): never => { throw new Error(msg); };
const ok = <T,>(v: T) => Promise.resolve(structuredClone(v));
const code = () => Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
const stamp = (db: Db, action: string, details: Record<string, unknown> = {}) => { db.events.unshift({ id: `ev-${++db.n}`, at: new Date().toISOString(), userName: 'System Administrator', role: 'admin', action, details }); };

/** Same rule as the server: centre-wide staff follow their centre. */
const syncScope = (db: Db) => {
  for (const u of db.users) {
    if (u.role === 'admin') continue;
    if (u.scope === 'center' && u.centerId) u.childIds = db.kids.filter((k) => k.centerId === u.centerId && !k.archived).map((k) => k.id);
  }
};
const mutate = <T,>(fn: (db: Db) => T): Promise<T> => {
  try { const db = load(); const r = fn(db); syncScope(db); save(db); notifyChanged(); return ok(r); } catch (e) { return Promise.reject(e); }
};
/** The rest of the demo app listens for this to refresh its children and care teams. */
export const DEMO_ADMIN_EVENT = 'nexia-demo-admin';
const notifyChanged = () => { try { window.dispatchEvent(new Event(DEMO_ADMIN_EVENT)); } catch { /* no window */ } };

/** Who the demo organisation has right now: the single source the portals build their children and care teams from. */
export const demoRoster = () => { const db = load(); return { kids: db.kids, users: db.users }; };

const rows = <T,>(f: (db: Db) => T) => ok(f(load()));
const seatsUsed = (db: Db) => db.users.filter((u) => u.role !== 'parent' && u.role !== 'admin' && !u.disabled).length;
const reply = (db: Db): SettingsReply => ({ settings: db.settings, seatsUsed: seatsUsed(db), canEdit: true });

/** What the rest of the demo app needs to know about the organisation. */
export const demoOrg = (): PublicOrg => { const s = load().settings; return { name: s.name, requireGoalApproval: s.policy.requireGoalApproval, parentMessaging: s.policy.parentMessaging, integrityMin: s.policy.integrityMin, ioaMin: s.policy.ioaMin, observationDays: s.policy.observationDays, stalledDays: s.policy.stalledDays }; };

const MATRIX = [
  ['abcRecords', 'no', 'no', 'no'], ['bips', 'some', 'no', 'summary'], ['reinforcers', 'yes', 'no', 'no'], ['weeklyQuestions', 'yes', 'no', 'no'], ['sentenceTasks', 'yes', 'no', 'no'],
  ['articulationLogs', 'yes', 'no', 'no'], ['audioClips', 'some', 'no', 'no'], ['otChecklist', 'yes', 'no', 'no'], ['otTasks', 'yes', 'no', 'no'], ['otSensory', 'yes', 'no', 'no'],
  ['targets', 'yes', 'no', 'yes'], ['savedSessions', 'yes', 'no', 'summary'], ['homeTasks', 'yes', 'limited', 'yes'], ['messages', 'some', 'yes', 'no'],
].map(([col, parentRead, parentWrite, adminRead]) => ({ col, parentRead, parentWrite, clinicalRead: 'yes', clinicalWrite: 'yes', adminRead, adminWrite: 'no' }));

export const demoAdminApi: AdminApi = {
  settings: () => rows(reply),
  patchSettings: (b) => mutate((db) => {
    if (b.name !== undefined && b.name.trim().length < 2) fail('Check the settings: name is not valid.');
    if (b.plan?.seats !== undefined) {
      if (!Number.isInteger(b.plan.seats) || b.plan.seats < 1) fail('Check the settings: plan.seats is not valid.');
      if (b.plan.seats < seatsUsed(db)) fail(`${seatsUsed(db)} seats are in use. Switch people off first, or keep at least that many seats.`);
    }
    if (b.plan?.renewalDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(b.plan.renewalDate)) fail('Check the settings: plan.renewalDate is not valid.');
    const s = db.settings;
    if (b.name !== undefined) s.name = b.name.trim();
    s.plan = { ...s.plan, ...(b.plan ?? {}) };
    s.access = { ...s.access, ...(b.access ?? {}) };
    s.policy = { ...s.policy, ...(b.policy ?? {}) };
    stamp(db, 'admin.update_settings', { changed: Object.keys(b) });
    return reply(db);
  }),
  rotateStaffCode: () => mutate((db) => { db.settings.staffCode = code(); stamp(db, 'admin.rotate_staff_code'); return { staffCode: db.settings.staffCode }; }),
  users: () => rows((db) => db.users),
  createUser: (b) => mutate((db) => {
    if (b.name.trim().length < 2) fail('Enter a name (at least 2 letters).');
    if (!/^\S+@\S+\.\S+$/.test(b.email)) fail('Enter a valid email address.');
    if (b.password.length < 8) fail('The password must be at least 8 characters.');
    if (db.users.some((u) => u.email.toLowerCase() === b.email.toLowerCase())) fail('An account with this email already exists.');
    if (b.role !== 'parent' && b.role !== 'admin' && seatsUsed(db) >= db.settings.plan.seats) fail('All licence seats are in use. Add seats under Billing first.');
    const childIds = [...new Set(b.childIds ?? [])];
    if (b.role === 'parent' && childIds.length === 0) fail('Link the parent to their child.');
    const centerId = b.role === 'parent' ? null : b.centerId ?? null;
    if (b.role !== 'parent' && centerId) for (const id of childIds) { const k = db.kids.find((x) => x.id === id); if (k?.centerId && k.centerId !== centerId) fail('Staff can only be linked to children of their own centre. Transfer the child first.'); }
    const scope = b.role === 'parent' || b.role === 'admin' ? 'assigned' : b.scope ?? 'assigned';
    if (scope === 'center' && !centerId) fail('Centre-wide visibility needs a centre.');
    const u = user(`u-${++db.n}`, b.name.trim(), b.email.trim().toLowerCase(), b.role, b.title ?? '', centerId, b.role === 'admin' ? [] : childIds, { scope, phone: b.phone ?? '' });
    db.users.push(u);
    stamp(db, 'admin.create_account', { role: b.role });
    return u;
  }),
  patchUser: (id, b) => mutate((db) => {
    const u = db.users.find((x) => x.id === id) ?? fail('Account not found.');
    if (b.name !== undefined) { if (b.name.trim().length < 2) fail('Enter a name (at least 2 letters).'); u.name = b.name.trim(); }
    if (b.title !== undefined) u.title = b.title.trim();
    if (b.phone !== undefined) u.phone = b.phone.trim();
    if (b.password !== undefined && b.password.length < 8) fail('The password must be at least 8 characters.');
    if (b.disabled !== undefined) { if (id === 'demo-admin' && b.disabled) fail('You cannot switch off your own account.'); if (!b.disabled && u.disabled && u.role !== 'parent' && u.role !== 'admin' && seatsUsed(db) >= db.settings.plan.seats) fail('All licence seats are in use. Add seats under Billing first.'); u.disabled = b.disabled; }
    if (b.role !== undefined && b.role !== u.role) {
      if (id === 'demo-admin') fail('You cannot change your own role.');
      if ((b.role === 'parent') !== (u.role === 'parent')) fail('A parent account cannot become staff or the other way round. Create a new account.');
      u.role = b.role;
    }
    if (b.centerId !== undefined && u.role !== 'parent') {
      u.centerId = b.centerId;
      if (u.role !== 'admin') {
        u.childIds = u.childIds.filter((cid) => { const k = db.kids.find((x) => x.id === cid); return !b.centerId || !k?.centerId || k.centerId === b.centerId; });
        if (!b.centerId) u.scope = 'assigned';
      }
    }
    if (b.scope !== undefined) { if (b.scope === 'center' && !u.centerId) fail('Centre-wide visibility needs a centre.'); u.scope = b.scope; }
    if (b.childIds !== undefined) {
      if (u.role === 'parent' && b.childIds.length === 0) fail('A parent must stay linked to at least one child. Switch the account off instead.');
      if (u.role !== 'parent' && u.centerId) for (const cid of b.childIds) { const k = db.kids.find((x) => x.id === cid); if (k?.centerId && k.centerId !== u.centerId) fail('Staff can only be linked to children of their own centre. Transfer the child first.'); }
      u.childIds = [...new Set(b.childIds)];
    }
    stamp(db, 'admin.update_account', { targetName: u.name, ...(b.password !== undefined ? { passwordReset: true } : {}) });
    return u;
  }),
  deleteUser: (id) => mutate((db) => {
    const u = db.users.find((x) => x.id === id) ?? fail('Account not found.');
    if (id === 'demo-admin') fail('You cannot remove your own account.');
    db.users = db.users.filter((x) => x.id !== id);
    stamp(db, 'admin.remove_account', { targetName: u.name, role: u.role });
    return { ok: true as const };
  }),
  children: () => rows((db) => db.kids),
  createChild: (b) => mutate((db) => {
    if (b.name.trim().length < 2) fail('Enter the child’s name.');
    const k: AdminChild = { id: `child-${++db.n}`, name: b.name.trim(), inviteCode: code(), centerId: b.centerId ?? null, archived: false };
    db.kids.push(k);
    stamp(db, 'admin.create_child', { childId: k.id });
    return k;
  }),
  patchChild: (id, b) => mutate((db) => {
    const k = db.kids.find((x) => x.id === id) ?? fail('Child not found.');
    if (b.name !== undefined) { if (b.name.trim().length < 2) fail('Enter the child’s name.'); k.name = b.name.trim(); }
    if (b.centerId !== undefined && b.centerId !== k.centerId) {
      k.centerId = b.centerId;
      for (const u of db.users) if (u.role !== 'parent' && u.role !== 'admin' && u.centerId && u.centerId !== b.centerId) u.childIds = u.childIds.filter((x) => x !== id);
      stamp(db, 'admin.update_child', { childId: id, transferredTo: b.centerId });
    }
    if (b.archived !== undefined) { k.archived = b.archived; stamp(db, 'admin.update_child', { childId: id, archived: b.archived }); }
    return k;
  }),
  setTeam: (id, userIds) => mutate((db) => {
    const k = db.kids.find((x) => x.id === id) ?? fail('Child not found.');
    for (const uid of userIds) {
      const u = db.users.find((x) => x.id === uid) ?? fail('Unknown account in the list.');
      if (u.role === 'parent' || u.role === 'admin') fail('Only staff can be assigned to a child.');
      if (u.disabled) fail(`${u.name} is switched off.`);
      if (u.centerId && k.centerId && u.centerId !== k.centerId) fail(`${u.name} works in another centre.`);
    }
    for (const u of db.users) {
      if (u.role === 'parent' || u.role === 'admin') continue;
      if (u.scope === 'center' && u.centerId && u.centerId === k.centerId) continue;
      const has = u.childIds.includes(id), want = userIds.includes(u.id);
      if (want && !has) u.childIds.push(id);
      if (!want && has) u.childIds = u.childIds.filter((x) => x !== id);
    }
    stamp(db, 'admin.assign_team', { childId: id });
    return { ok: true as const };
  }),
  regenerateCode: (id) => mutate((db) => {
    const k = db.kids.find((x) => x.id === id) ?? fail('Child not found.');
    k.inviteCode = code();
    stamp(db, 'admin.regenerate_family_code', { childId: id });
    return k;
  }),
  centers: () => rows((db) => db.centers),
  createCenter: (b) => mutate((db) => {
    if (b.name.trim().length < 2) fail('Give the centre a name and choose its type.');
    const c: AdminCenter = { id: `center-${++db.n}`, name: b.name.trim(), type: b.type as CenterType, archived: false };
    db.centers.push(c);
    stamp(db, 'admin.create_center', { centerId: c.id });
    return c;
  }),
  patchCenter: (id, b) => mutate((db) => {
    const c = db.centers.find((x) => x.id === id) ?? fail('Centre not found.');
    if (b.name !== undefined) { if (b.name.trim().length < 2) fail('Give the centre a name.'); c.name = b.name.trim(); }
    if (b.type !== undefined) c.type = b.type;
    if (b.archived !== undefined) {
      if (b.archived && (db.kids.some((k) => k.centerId === id && !k.archived) || db.users.some((u) => u.centerId === id && !u.disabled && u.role !== 'admin'))) fail('Move or switch off this centre’s active children and staff first.');
      c.archived = b.archived;
    }
    stamp(db, 'admin.update_center', { centerId: id });
    return c;
  }),
  invoices: () => rows((db) => {
    const sum = (st: InvoiceStatus) => Math.round(db.invoices.filter((i) => i.status === st).reduce((a, i) => a + i.amount, 0) * 100) / 100;
    const totals: InvoiceTotals = { draft: sum('draft'), outstanding: sum('issued'), paid: sum('paid') };
    return { invoices: [...db.invoices].reverse(), totals };
  }),
  createInvoice: (b) => mutate((db) => {
    if (b.description.trim().length < 2 || !(b.amount > 0)) fail('Give the invoice a description and an amount above zero.');
    const kid = b.childId ? db.kids.find((k) => k.id === b.childId) : undefined;
    const n = db.invoices.length + 1;
    const i = inv(n, b.description.trim(), Math.round(b.amount * 100) / 100, 'draft', kid?.id ?? null, kid?.centerId ?? b.centerId ?? null, b.dueDate ?? null);
    i.id = `inv-${++db.n}`; i.createdAt = new Date().toISOString();
    db.invoices.push(i);
    stamp(db, 'admin.create_invoice', { number: i.number });
    return i;
  }),
  patchInvoice: (id, b) => mutate((db) => {
    const i = db.invoices.find((x) => x.id === id) ?? fail('Invoice not found.');
    if ((b.description !== undefined || b.amount !== undefined || b.dueDate !== undefined) && i.status !== 'draft') fail('Only a draft invoice can be edited.');
    if (b.description !== undefined) i.description = b.description.trim();
    if (b.amount !== undefined) { if (!(b.amount > 0)) fail('Amount must be above zero.'); i.amount = Math.round(b.amount * 100) / 100; }
    if (b.dueDate !== undefined) i.dueDate = b.dueDate;
    if (b.status !== undefined) {
      const next: Record<InvoiceStatus, InvoiceStatus[]> = { draft: ['issued', 'void'], issued: ['paid', 'void'], paid: [], void: [] };
      if (!next[i.status].includes(b.status)) fail(`A ${i.status} invoice cannot become ${b.status}.`);
      i.status = b.status;
      if (b.status === 'issued') i.issuedAt = new Date().toISOString();
      if (b.status === 'paid') i.paidAt = new Date().toISOString();
    }
    stamp(db, 'admin.update_invoice', { number: i.number, status: i.status });
    return i;
  }),
  audit: (limit = 100) => rows((db) => db.events.slice(0, limit)),
  access: () => ok(MATRIX as unknown),
};

/** Put the dummy data back (used by the "Reset demo data" button). */
export const resetDemoAdmin = () => { try { window.localStorage.removeItem(KEY); } catch { /* nothing stored */ } notifyChanged(); };
