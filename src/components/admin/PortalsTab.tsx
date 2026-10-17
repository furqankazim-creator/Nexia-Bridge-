import React, { useEffect, useMemo, useState } from 'react';
import { Copy, Plus, Settings2 } from 'lucide-react';
import { type AdminApi, getApiUrl, type AdminChild, type AdminUser, type AuthUser, type StaffScope } from '../../api/client';
import { useApp } from '../../context/AppContext';
import { DAY, pendingGoals, pendingSessions } from '../../utils/org';
import type { AdminData } from './useAdminData';
import { CaseSheet, CasesTab } from './CasesTab';
import { BTN, BTN_DANGER, BTN_GHOST, CARD, Chip, Empty, Field, INPUT, Pill, ROLE_LABEL, Sheet, randomPassword } from './adminUi';

type Role = AuthUser['role'];
interface Group { id: string; label: string; roles: Role[]; discipline?: 'behavior' | 'speech' | 'ot' | 'remedial' | 'teacher' }
const GROUPS: Group[] = [
  { id: 'behavior', label: 'Behavior', roles: ['behavior'], discipline: 'behavior' },
  { id: 'speech', label: 'Speech', roles: ['speech'], discipline: 'speech' },
  { id: 'ot', label: 'OT', roles: ['ot'], discipline: 'ot' },
  { id: 'remedial', label: 'Remedial', roles: ['remedial'], discipline: 'remedial' },
  { id: 'teacher', label: 'Teacher', roles: ['teacher'], discipline: 'teacher' },
  { id: 'supervisor', label: 'Supervisor', roles: ['supervisor'] },
  { id: 'parent', label: 'Parents', roles: ['parent'] },
];

/** Where to land when another screen sends the administrator here (a portal pill, optionally with the add form open). */
export interface PortalIntent { group: string; add?: boolean }
interface Props { data: AdminData; orgWide: boolean; myCenterId: string | null; notify: (m: string) => void; intent?: PortalIntent | null; onIntentDone?: () => void }
interface Ctx extends Props { group: Group; setSheet: (s: SheetState | null) => void; setCreated: (c: Created | null) => void }
type SheetState = { kind: 'add' } | { kind: 'edit'; u: AdminUser };
interface Created { lines: string[]; text: string }

const DOT: Record<string, string> = { behavior: 'bg-indigo-500', speech: 'bg-sky-500', ot: 'bg-amber-500', remedial: 'bg-violet-500', teacher: 'bg-emerald-500', supervisor: 'bg-slate-600', parent: 'bg-rose-400' };

const sameSet = (a: string[], b: string[]) => a.slice().sort().join() === b.slice().sort().join();

/** Everything a new person needs to sign in, as one block the administrator can copy and hand over. */
const loginText = (u: { name: string; role: Role; title?: string; email: string; password?: string; centerName?: string; children?: string[] }) =>
  [`Nexia Bridge sign-in`, `Name: ${u.name}`, `Role: ${ROLE_LABEL[u.role]}`, u.title ? `Title: ${u.title}` : '', u.centerName ? `Centre: ${u.centerName}` : '', u.children?.length ? `Children: ${u.children.join(', ')}` : '', `Server: ${getApiUrl() || '(set in the app)'}`, `Email: ${u.email}`, u.password ? `Password: ${u.password}` : ''].filter(Boolean).join('\n');

const AccountSheet: React.FC<{ ctx: Ctx; u?: AdminUser }> = ({ ctx, u }) => {
  const { data, orgWide, myCenterId, notify, group, setSheet, setCreated } = ctx;
  const { kids, centers, run, busy } = data;
  const isParent = group.id === 'parent';
  const [name, setName] = useState(u?.name ?? '');
  const [email, setEmail] = useState(u?.email ?? '');
  const [title, setTitle] = useState(u?.title ?? '');
  const [phone, setPhone] = useState(u?.phone ?? '');
  const [password, setPassword] = useState(randomPassword());
  const [role, setRole] = useState<Role>(u?.role ?? group.roles[0]);
  const [centerId, setCenterId] = useState(u ? u.centerId ?? '' : myCenterId ?? '');
  const [scope, setScope] = useState<StaffScope>(u?.scope ?? 'assigned');
  const [childIds, setChildIds] = useState<string[]>(u?.childIds ?? []);
  const [tried, setTried] = useState(false);
  const close = () => setSheet(null);
  const eligible = kids.filter((k) => !k.archived && (isParent || !centerId || !k.centerId || k.centerId === centerId));
  const byCenter = !isParent && scope === 'center';
  const err = name.trim().length < 2 ? 'Enter a name.' : !u && !/^\S+@\S+\.\S+$/.test(email) ? 'Enter a valid email.' : !u && password.length < 8 ? 'Password needs 8 or more characters.' : isParent && childIds.length === 0 ? 'Choose the parent’s child.' : byCenter && !centerId ? 'Whole-centre visibility needs a centre.' : '';
  const centerName = centers.find((c) => c.id === centerId)?.name;
  const toggle = (id: string) => setChildIds(isParent ? [id] : childIds.includes(id) ? childIds.filter((x) => x !== id) : [...childIds, id]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (err) return;
    if (!u) {
      const ok = await run(() => data.api.createUser({ name: name.trim(), email: email.trim(), password, role, title: title.trim(), phone: phone.trim(), centerId: isParent ? null : centerId || null, scope: isParent ? undefined : scope, childIds: byCenter ? [] : childIds }), `${name.trim()} added.`);
      if (ok) {
        const kidNames = byCenter ? ['Every child in the centre'] : childIds.map((id) => kids.find((k) => k.id === id)?.name ?? id);
        const info = { name: name.trim(), role, title: title.trim(), email: email.trim(), password, centerName, children: kidNames };
        setCreated({ lines: [], text: loginText(info) });
        close();
      }
      return;
    }
    const body: Parameters<AdminApi['patchUser']>[1] = {};
    if (name.trim() !== u.name) body.name = name.trim();
    if (title.trim() !== (u.title ?? '')) body.title = title.trim();
    if (phone.trim() !== (u.phone ?? '')) body.phone = phone.trim();
    if (role !== u.role) body.role = role;
    if (!isParent && orgWide && (centerId || null) !== u.centerId) body.centerId = centerId || null;
    if (!isParent && scope !== u.scope) body.scope = scope;
    if (!byCenter && !sameSet(childIds, u.childIds)) body.childIds = childIds;
    if (Object.keys(body).length === 0) return close();
    if (await run(() => data.api.patchUser(u.id, body), `${name.trim()} updated.`)) close();
  };

  return (
    <Sheet title={u ? `${u.name} · settings` : isParent ? 'Add a parent' : `Add ${group.label.toLowerCase()} staff`} onClose={close}>
      <form noValidate className="space-y-3" onSubmit={save}>
        <Field label="Full name"><input aria-label="Full name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} dir="auto" /></Field>
        <Field label="Email (their sign-in)"><input aria-label="Email" type="email" readOnly={!!u} value={email} onChange={(e) => setEmail(e.target.value)} className={`${INPUT} ${u ? 'opacity-70' : ''}`} /></Field>
        {!isParent && <Field label="Title / credential" hint="Shown on their profile, e.g. Board Certified Behavior Analyst"><input aria-label="Title" value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT} dir="auto" /></Field>}
        <Field label="Phone (optional)"><input aria-label="Phone" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} /></Field>
        {!u && (
          <Field label="Temporary password" hint="Give it to them privately. They sign in with it.">
            <div className="flex gap-2"><input aria-label="Temporary password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${INPUT} font-mono`} /><button type="button" className={BTN_GHOST} onClick={() => setPassword(randomPassword())}>New</button></div>
          </Field>
        )}
        {group.roles.length > 1 && <Field label="Role"><select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value as Role)} className={INPUT}>{group.roles.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}</select></Field>}
        {!isParent && (
          <>
            <Field label="Centre"><select aria-label="Centre" disabled={!orgWide} value={centerId} onChange={(e) => { setCenterId(e.target.value); setChildIds([]); }} className={INPUT}><option value="">No centre</option>{centers.filter((c) => !c.archived || c.id === u?.centerId).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Visibility" hint={byCenter ? 'Sees every child in the centre, now and in future.' : 'Sees only the children chosen below.'}>
              <div className="flex gap-2"><Chip on={scope === 'assigned'} onClick={() => setScope('assigned')}>Assigned children</Chip><Chip on={scope === 'center'} disabled={!centerId} onClick={() => setScope('center')}>Whole centre</Chip></div>
            </Field>
          </>
        )}
        {!byCenter && (
          <Field label={isParent ? 'Their child' : 'Children they work with'}>
            <div className="flex flex-wrap gap-2" data-testid="child-chips">{eligible.length === 0 ? <span className="text-xs text-[#6B6785]">No children yet.</span> : eligible.map((k) => <Chip key={k.id} on={childIds.includes(k.id)} onClick={() => toggle(k.id)}>{k.name}</Chip>)}</div>
          </Field>
        )}
        {tried && err && <p role="alert" className="text-xs text-rose-700">{err}</p>}
        <div className="grid grid-cols-2 gap-3"><button type="button" onClick={close} className={BTN_GHOST}>Cancel</button><button type="submit" disabled={busy} className={BTN}>{u ? 'Save changes' : 'Create login'}</button></div>
      </form>

      {u && (
        <div className="space-y-2 pt-3 border-t border-[#E8E2D9] dark:border-[#38325E]" data-testid="account-actions">
          <p className="text-xs font-bold">Account</p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" disabled={busy} className={BTN_GHOST} onClick={async () => {
              const pw = randomPassword();
              if (!window.confirm(`Reset the password for ${u.name}? Their current password stops working.`)) return;
              if (await run(() => data.api.patchUser(u.id, { password: pw }), `${u.name}: password reset.`)) {
                setCreated({ lines: [], text: loginText({ name: u.name, role: u.role, title: u.title, email: u.email, password: pw }) });
                close();
              }
            }}>Reset password</button>
            <button type="button" disabled={busy} className={u.disabled ? BTN_GHOST : BTN_DANGER} onClick={async () => { if (await run(() => data.api.patchUser(u.id, { disabled: !u.disabled }), u.disabled ? `${u.name} switched on.` : `${u.name} switched off.`)) close(); }}>{u.disabled ? 'Switch on' : 'Deactivate'}</button>
          </div>
          <button type="button" disabled={busy} className={`${BTN_DANGER} w-full`} onClick={async () => { if (window.confirm(`Remove ${u.name} for good? Their login is deleted. Records they wrote stay with the child.`) && await run(() => data.api.deleteUser(u.id), `${u.name} removed.`)) close(); }}>Remove account</button>
          <button type="button" className={`${BTN_GHOST} w-full flex items-center justify-center gap-1`} onClick={async () => { try { await navigator.clipboard.writeText(loginText({ name: u.name, role: u.role, title: u.title, email: u.email, centerName: centers.find((c) => c.id === u.centerId)?.name })); notify('Sign-in details copied.'); } catch { notify('Copy is not available here.'); } }}><Copy className="w-3.5 h-3.5" /> Copy sign-in details</button>
        </div>
      )}
    </Sheet>
  );
};

export const PortalsTab: React.FC<Props> = (props) => {
  const { data, orgWide, myCenterId, notify } = props;
  const { users, kids, centers, loading, error } = data;
  const { targets, savedSessions } = useApp();
  const [pick, setPick] = useState<string>('children');
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [openCase, setOpenCase] = useState<AdminChild | null>(null);
  const [q, setQ] = useState('');
  useEffect(() => {
    if (!props.intent) return;
    setPick(props.intent.group);
    if (props.intent.add) setSheet({ kind: 'add' });
    props.onIntentDone?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.intent]);
  const group = GROUPS.find((g) => g.id === pick);
  const ctx: Ctx = { ...props, group: group ?? GROUPS[0], setSheet, setCreated };

  const members = useMemo(() => (group ? users.filter((u) => group.roles.includes(u.role)) : []), [users, group]);
  const shown = members.filter((u) => { const s = q.trim().toLowerCase(); return !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s); });
  const centerName = (id: string | null) => centers.find((c) => c.id === id)?.name ?? 'No centre';
  const childName = (id: string) => kids.find((k) => k.id === id)?.name ?? id;
  const myKidIds = new Set(kids.map((k) => k.id));

  // Figures an administrator may see: counts only, never notes.
  const figs = useMemo(() => {
    if (!group) return [];
    const active = members.filter((u) => !u.disabled).length;
    if (group.id === 'parent') return [['Families', members.length], ['Switched off', members.filter((u) => u.disabled).length]];
    const served = new Set(members.flatMap((u) => u.childIds).filter((id) => myKidIds.has(id))).size;
    if (group.id === 'supervisor') return [['Active', active], ['Goals waiting', pendingGoals(targets).filter((g) => myKidIds.has(g.childId)).length], ['Sessions waiting', pendingSessions(savedSessions).filter((s) => myKidIds.has(s.childId)).length]];
    const goals = targets.filter((t) => t.discipline === group.discipline && myKidIds.has(t.childId));
    const sess30 = savedSessions.filter((s) => s.role === group.discipline && myKidIds.has(s.childId) && Date.now() - new Date(s.savedAt).getTime() <= 30 * DAY).length;
    return [['Active staff', active], ['Children', served], ['Goals', goals.length], ['Sessions (30d)', sess30]];
  }, [group, members, targets, savedSessions, kids]);

  const served = group && group.id !== 'parent' ? kids.filter((k) => !k.archived && members.some((u) => u.childIds.includes(k.id))) : [];

  return (
    <div className="space-y-4 pb-28 md:pb-12 animate-in fade-in">
      <div>
        <h2 className="font-heading text-2xl font-bold">Portals</h2>
        <p className="text-sm text-[#6B6785]">Manage each portal’s people, children and settings</p>
      </div>
      <div className="flex flex-wrap gap-2" data-testid="portal-strip" role="tablist" aria-label="Portals">
        {[{ id: 'children', label: 'Children', dot: 'bg-slate-500', n: kids.filter((k) => !k.archived).length }, ...GROUPS.map((g) => ({ id: g.id, label: g.label, dot: DOT[g.id], n: users.filter((u) => g.roles.includes(u.role)).length }))].map((x) => {
          const on = pick === x.id;
          return (
            <button key={x.id} type="button" role="tab" aria-selected={on} data-pill={x.id} onClick={() => { setPick(x.id); setQ(''); }}
              className={`pl-2.5 pr-2 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition active:scale-95 ${on ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-card' : 'bg-white dark:bg-[#1F1B3A] text-[#1F1B3A] dark:text-gray-200 border-[#E8E2D9] dark:border-[#38325E]'}`}>
              <span className={`w-2 h-2 rounded-full ${on ? 'bg-white' : x.dot}`} />
              {x.label}
              <span className={`min-w-[18px] h-[18px] px-1 rounded-full text-[10px] flex items-center justify-center ${on ? 'bg-white/25 text-white' : 'bg-gray-100 dark:bg-[#252044] text-[#6B6785]'}`}>{x.n}</span>
            </button>
          );
        })}
      </div>
      {error && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</p>}

      {created && (
        <div className={`${CARD} space-y-2 border-emerald-300`} data-testid="created-note">
          <p className="text-sm font-bold">Login ready</p>
          <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed bg-[#FAF6F0] dark:bg-[#252044] rounded-xl p-3" data-testid="login-details">{created.text}</pre>
          <p className="text-[11px] text-[#6B6785]">The password is shown once. Share it privately.</p>
          <div className="flex gap-2">
            <button type="button" className={`${BTN} flex items-center gap-1`} onClick={async () => { try { await navigator.clipboard.writeText(created.text); notify('Sign-in details copied.'); } catch { notify('Copy is not available here.'); } }}><Copy className="w-3.5 h-3.5" /> Copy</button>
            <button type="button" className={BTN_GHOST} onClick={() => setCreated(null)}>Done</button>
          </div>
        </div>
      )}

      {pick === 'children' && <CasesTab {...props} />}

      {group && (
        <>
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading text-lg font-bold">{group.id === 'parent' ? 'Parents' : `${group.label} portal`}</h3>
            <button type="button" onClick={() => setSheet({ kind: 'add' })} className={`${BTN} flex items-center gap-1`} data-testid="add-person"><Plus className="w-4 h-4" /> Add {group.id === 'parent' ? 'parent' : 'staff'}</button>
          </div>
          <div className="grid gap-2 md:gap-4" style={{ gridTemplateColumns: `repeat(${Math.max(1, figs.length)}, minmax(0, 1fr))` }} data-testid="portal-figures">
            {figs.map(([l, v]) => <div key={String(l)} className={`${CARD} !p-2.5 text-center`}><b className="block text-base font-heading tabular-nums">{v}</b><span className="block text-[10px] leading-tight text-[#6B6785]">{l}</span></div>)}
          </div>
          {members.length > 4 && <input aria-label="Search people" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email" className={INPUT} />}
          {shown.length === 0 && !loading && <Empty>{members.length ? 'No one matches.' : `No ${group.id === 'parent' ? 'parents' : 'staff'} in this portal yet. Add the first one.`}</Empty>}
          <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
          {shown.map((u) => (
            <div key={u.id} className={`${CARD} flex items-center justify-between gap-3 ${u.disabled ? 'opacity-70' : ''}`} data-testid="person" data-role={u.role} data-disabled={u.disabled ? 'true' : 'false'}>
              <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 text-white ${DOT[group?.id ?? 'parent'] ?? 'bg-slate-500'}`} aria-hidden="true">{u.name.replace(/^(Dr\.?|Mr\.?|Ms\.?|Mrs\.?)\s+/i, '').trim().charAt(0).toUpperCase()}</span>
              <span className="min-w-0 flex-1">
                <b className="block font-heading text-sm truncate">{u.name}</b>
                <span className="block text-xs text-[#6B6785] truncate">{u.role === 'parent' ? u.childIds.map(childName).join(', ') : `${u.title || ROLE_LABEL[u.role]} · ${centerName(u.centerId)}`}</span>
                <span className="mt-1 flex gap-1.5 flex-wrap">
                  {u.disabled ? <Pill tone="red">Off</Pill> : <Pill tone="green">Active</Pill>}
                  {u.role !== 'parent' && <Pill tone="indigo">{u.scope === 'center' ? 'Whole centre' : `${u.childIds.length} ${u.childIds.length === 1 ? 'child' : 'children'}`}</Pill>}
                </span>
              </span>
              <button type="button" aria-label={`Settings for ${u.name}`} onClick={() => setSheet({ kind: 'edit', u })} className="p-2 rounded-xl border border-[#E8E2D9] dark:border-[#38325E] text-[#4F46E5] shrink-0" data-testid="person-settings"><Settings2 className="w-4 h-4" /></button>
            </div>
          ))}
          </div>
          {served.length > 0 && (
            <div className={`${CARD} space-y-2`} data-testid="served-children">
              <p className="text-xs font-bold">Children in this portal</p>
              <div className="flex flex-wrap gap-2">{served.map((k) => <Chip key={k.id} on={false} onClick={() => setOpenCase(k)}>{k.name}</Chip>)}</div>
            </div>
          )}
        </>
      )}

      {sheet?.kind === 'add' && <AccountSheet ctx={ctx} />}
      {sheet?.kind === 'edit' && <AccountSheet ctx={ctx} u={sheet.u} />}
      {openCase && <CaseSheet ctx={{ data, orgWide, myCenterId, notify, setAdding: () => undefined, setOpen: (k) => setOpenCase(k) }} k={openCase} />}
    </div>
  );
};
