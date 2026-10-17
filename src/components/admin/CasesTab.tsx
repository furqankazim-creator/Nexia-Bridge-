import React, { useState } from 'react';
import { Copy, Plus } from 'lucide-react';
import { type AdminChild } from '../../api/client';
import type { AdminData } from './useAdminData';
import { BTN, BTN_GHOST, BTN_DANGER, CARD, Chip, Empty, Field, INPUT, Pill, ROLE_LABEL, Sheet } from './adminUi';

interface Props { data: AdminData; orgWide: boolean; myCenterId: string | null; notify: (m: string) => void }

interface Ctx { data: AdminData; orgWide: boolean; myCenterId: string | null; notify: (m: string) => void; setAdding: (v: boolean) => void; setOpen: (k: AdminChild | null) => void }

export const CasesTab: React.FC<Props> = ({ data, orgWide, myCenterId, notify }) => {
  const { users, kids, centers, run, busy, loading, error } = data;
  const [showArchived, setShowArchived] = useState(false);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<AdminChild | null>(null);
  const centerName = (id: string | null) => centers.find((c) => c.id === id)?.name ?? 'No centre';
  const teamOf = (k: AdminChild) => users.filter((u) => u.role !== 'parent' && u.role !== 'admin' && u.childIds.includes(k.id));
  const parentsOf = (k: AdminChild) => users.filter((u) => u.role === 'parent' && u.childIds.includes(k.id));
  const list = kids.filter((k) => k.archived === showArchived);



  const ctx = { data, orgWide, myCenterId, notify, setAdding, setOpen };
  return (
    <div className="space-y-4 pb-28 md:pb-12 animate-in fade-in">
      <div className="flex items-center justify-between gap-2">
        <div><h2 className="font-heading text-2xl font-bold">Cases</h2><p className="text-sm text-[#6B6785]">Children, their teams and families</p></div>
        <button type="button" onClick={() => setAdding(true)} className={`${BTN} flex items-center gap-1`} data-testid="add-child"><Plus className="w-4 h-4" /> Add</button>
      </div>
      {error && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</p>}
      <div className="flex gap-2"><Chip on={!showArchived} onClick={() => setShowArchived(false)}>Active</Chip><Chip on={showArchived} onClick={() => setShowArchived(true)}>Archived</Chip></div>
      {list.length === 0 && !loading && <Empty>{showArchived ? 'No archived cases.' : 'No children yet. Add the first one.'}</Empty>}
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
      {list.map((k) => (
        <button key={k.id} type="button" onClick={() => setOpen(k)} className={`${CARD} w-full text-start space-y-1 flex flex-col justify-start`} data-testid="case-card" data-archived={k.archived ? 'true' : 'false'}>
          <span className="flex items-center justify-between gap-2"><b className="font-heading text-base">{k.name}</b><Pill tone={k.centerId ? 'indigo' : 'grey'}>{centerName(k.centerId)}</Pill></span>
          <span className="block text-xs text-[#6B6785]" data-testid="team-line">{teamOf(k).map((u) => u.name).join(' · ') || 'No therapist assigned'}</span>
          <span className="block text-[11px] text-[#6B6785]">{parentsOf(k).length} {parentsOf(k).length === 1 ? 'parent' : 'parents'} linked</span>
        </button>
      ))}
      </div>
      {adding && <AddForm ctx={ctx}  />}
      {open && <CaseSheet ctx={ctx} k={open} />}
    </div>
  );
};

const AddForm: React.FC<{ ctx: Ctx }> = ({ ctx }) => {
  const { data, orgWide, myCenterId, notify, setAdding, setOpen } = ctx;
  const { users, centers, run, busy } = data;
  const centerName = (id: string | null) => centers.find((c) => c.id === id)?.name ?? 'No centre';
  const teamOf = (k: AdminChild) => users.filter((u) => u.role !== 'parent' && u.role !== 'admin' && u.childIds.includes(k.id));
  const parentsOf = (k: AdminChild) => users.filter((u) => u.role === 'parent' && u.childIds.includes(k.id));
  const [name, setName] = useState('');
  const [centerId, setCenterId] = useState(myCenterId ?? '');
  const [tried, setTried] = useState(false);
  return (
    <Sheet title="Add a child" onClose={() => setAdding(false)}>
      <form noValidate className="space-y-3" onSubmit={async (e) => { e.preventDefault(); setTried(true); if (name.trim().length < 2) return; if (await run(() => data.api.createChild({ name: name.trim(), centerId: centerId || null }), `${name.trim()} added.`)) setAdding(false); }}>
        <Field label="Child’s name"><input aria-label="Child name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} dir="auto" /></Field>
        <Field label="Centre" hint="The child’s data stays within this centre."><select aria-label="Centre" disabled={!orgWide} value={centerId} onChange={(e) => setCenterId(e.target.value)} className={INPUT}><option value="">No centre</option>{centers.filter((c) => !c.archived).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        {tried && name.trim().length < 2 && <p role="alert" className="text-xs text-rose-700">Enter the child’s name.</p>}
        <div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setAdding(false)} className={BTN_GHOST}>Cancel</button><button type="submit" disabled={busy} className={BTN}>Add child</button></div>
      </form>
    </Sheet>
  );};

export const CaseSheet: React.FC<{ ctx: Ctx; k: AdminChild }> = ({ ctx, k }) => {
  const { data, orgWide, myCenterId, notify, setAdding, setOpen } = ctx;
  const { users, centers, run, busy } = data;
  const centerName = (id: string | null) => centers.find((c) => c.id === id)?.name ?? 'No centre';
  const teamOf = (k: AdminChild) => users.filter((u) => u.role !== 'parent' && u.role !== 'admin' && u.childIds.includes(k.id));
  const parentsOf = (k: AdminChild) => users.filter((u) => u.role === 'parent' && u.childIds.includes(k.id));
  const [mode, setMode] = useState<'main' | 'team' | 'transfer'>('main');
  const eligible = data.users.filter((u) => u.role !== 'parent' && u.role !== 'admin' && !u.disabled && (!u.centerId || !k.centerId || u.centerId === k.centerId));
  const [picked, setPicked] = useState(teamOf(k).map((u) => u.id));
  const [to, setTo] = useState(k.centerId ?? '');
  const auto = (id: string) => { const u = data.users.find((x) => x.id === id); return !!u && u.scope === 'center' && !!u.centerId && u.centerId === k.centerId; };
  return (
    <Sheet title={k.name} onClose={() => setOpen(null)}>
      {mode === 'main' && (
        <div className="space-y-3 text-sm">
          <p className="text-xs text-[#6B6785]">{centerName(k.centerId)}{k.archived ? ' · archived' : ''}</p>
          <div className="rounded-xl bg-[#FAF6F0] dark:bg-[#252044] p-3 space-y-1 text-xs">
            <p><b>Team:</b> {teamOf(k).map((u) => `${u.name} (${ROLE_LABEL[u.role]})`).join(' · ') || 'No one assigned'}</p>
            <p><b>Parents:</b> {parentsOf(k).map((u) => u.name).join(' · ') || 'None yet'}</p>
            <p className="flex items-center gap-2"><b>Family code:</b> <span className="font-mono tracking-wider" data-testid="family-code">{k.inviteCode}</span><button type="button" aria-label="Copy family code" onClick={async () => { try { await navigator.clipboard.writeText(k.inviteCode); notify('Code copied.'); } catch { notify('Copy is not available here.'); } }}><Copy className="w-3.5 h-3.5 text-[#4F46E5]" /></button></p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={BTN} disabled={k.archived} onClick={() => setMode('team')}>Reassign therapists</button>
            <button type="button" className={BTN_GHOST} disabled={!orgWide || k.archived} onClick={() => setMode('transfer')}>Transfer case</button>
            <button type="button" className={BTN_GHOST} disabled={busy} onClick={() => { if (window.confirm(`Replace the family code for ${k.name}? The old code stops working.`)) void run(() => data.api.regenerateCode(k.id), 'New family code created.').then((ok) => ok && setOpen(null)); }}>New family code</button>
            <button type="button" className={k.archived ? BTN : BTN_DANGER} disabled={busy} onClick={() => { if (k.archived || window.confirm(`Archive ${k.name}? The case becomes read-only and leaves the therapists’ lists.`)) void run(() => data.api.patchChild(k.id, { archived: !k.archived }), k.archived ? `${k.name} restored.` : `${k.name} archived.`).then((ok) => ok && setOpen(null)); }}>{k.archived ? 'Restore case' : 'Archive case'}</button>
          </div>
        </div>
      )}
      {mode === 'team' && (
        <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); if (await run(() => data.api.setTeam(k.id, picked.filter((id) => !auto(id))), `${k.name}: team updated.`)) setOpen(null); }}>
          <p className="text-xs text-[#6B6785]">Choose who works with {k.name}. Staff from other centres are not listed.</p>
          <div className="flex flex-wrap gap-2" data-testid="team-chips">{eligible.length === 0 ? <span className="text-xs text-[#6B6785]">No eligible staff.</span> : eligible.map((u) => <Chip key={u.id} on={auto(u.id) || picked.includes(u.id)} disabled={auto(u.id)} onClick={() => setPicked(picked.includes(u.id) ? picked.filter((x) => x !== u.id) : [...picked, u.id])}>{u.name}{auto(u.id) ? ' (whole centre)' : ''}</Chip>)}</div>
          <div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setMode('main')} className={BTN_GHOST}>Back</button><button type="submit" disabled={busy} className={BTN}>Save team</button></div>
        </form>
      )}
      {mode === 'transfer' && (
        <form className="space-y-3" onSubmit={async (e) => { e.preventDefault(); if ((to || null) === k.centerId) return setMode('main'); if (window.confirm(`Transfer ${k.name} to ${centerName(to || null)}? Staff of ${centerName(k.centerId)} lose access. Parents keep theirs.`) && await run(() => data.api.patchChild(k.id, { centerId: to || null }), `${k.name} transferred.`)) setOpen(null); }}>
          <Field label="New centre" hint="Staff of the old centre lose access to this case. Parents keep theirs."><select aria-label="New centre" value={to} onChange={(e) => setTo(e.target.value)} className={INPUT}><option value="">No centre</option>{centers.filter((c) => !c.archived).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3"><button type="button" onClick={() => setMode('main')} className={BTN_GHOST}>Back</button><button type="submit" disabled={busy} className={BTN}>Transfer</button></div>
        </form>
      )}
    </Sheet>
  );};
