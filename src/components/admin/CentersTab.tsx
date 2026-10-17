import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { type AdminCenter, type CenterType } from '../../api/client';
import type { AdminData } from './useAdminData';
import { BTN, BTN_GHOST, BTN_DANGER, CARD, CENTER_TYPE_LABEL, Empty, Field, INPUT, Pill, Sheet } from './adminUi';

interface Props { data: AdminData; orgWide: boolean }

interface Ctx { data: AdminData; setAdding: (v: boolean) => void; setEditing: (c: AdminCenter | null) => void }

export const CentersTab: React.FC<Props> = ({ data, orgWide }) => {
  const { users, kids, centers, run, busy, loading, error } = data;
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<AdminCenter | null>(null);
  const counts = (id: string) => ({
    staff: users.filter((u) => u.centerId === id && u.role !== 'admin' && !u.disabled).length,
    admins: users.filter((u) => u.centerId === id && u.role === 'admin').length,
    kids: kids.filter((k) => k.centerId === id && !k.archived).length,
  });


  const ctx = { data, setAdding, setEditing };
  return (
    <div className="space-y-4 pb-28 md:pb-12 animate-in fade-in">
      <div className="flex items-center justify-between gap-2">
        <div><h2 className="font-heading text-2xl font-bold">Centers</h2><p className="text-sm text-[#6B6785]">Separate staff, children and billing</p></div>
        {orgWide && <button type="button" onClick={() => setAdding(true)} className={`${BTN} flex items-center gap-1`} data-testid="add-center"><Plus className="w-4 h-4" /> Add</button>}
      </div>
      {error && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</p>}
      {!orgWide && <div className={`${CARD} text-xs text-[#6B6785]`}>You are a centre administrator: you see and manage this centre only.</div>}
      {centers.length === 0 && !loading && <Empty>No centres yet. Create one to separate staff and children by site.</Empty>}
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
      {centers.map((c) => {
        const n = counts(c.id);
        const body = (
          <>
            <span className="flex items-center justify-between gap-2"><b className="font-heading text-base">{c.name}</b><Pill tone={c.archived ? 'grey' : 'indigo'}>{c.archived ? 'Archived' : CENTER_TYPE_LABEL[c.type]}</Pill></span>
            <span className="block text-xs text-[#6B6785]" data-testid="center-counts">{n.staff} staff · {n.kids} children · {n.admins} {n.admins === 1 ? 'admin' : 'admins'}</span>
          </>
        );
        return orgWide
          ? <button key={c.id} type="button" onClick={() => setEditing(c)} className={`${CARD} w-full text-start space-y-1`} data-testid="center-card">{body}</button>
          : <div key={c.id} className={`${CARD} space-y-1`} data-testid="center-card">{body}</div>;
      })}
      </div>
      {adding && <Form ctx={ctx}  />}
      {editing && <Form ctx={ctx} c={editing} />}
    </div>
  );
};

const Form: React.FC<{ ctx: Ctx; c?: AdminCenter }> = ({ ctx, c }) => {
  const { data, setAdding, setEditing } = ctx;
  const { run, busy } = data;
  const [name, setName] = useState(c?.name ?? '');
  const [type, setType] = useState<CenterType>(c?.type ?? 'clinic');
  const [tried, setTried] = useState(false);
  const close = () => (c ? setEditing(null) : setAdding(false));
  return (
    <Sheet title={c ? c.name : 'Create a centre'} onClose={close}>
      <form noValidate className="space-y-3" onSubmit={async (e) => {
        e.preventDefault(); setTried(true); if (name.trim().length < 2) return;
        const ok = await run(() => (c ? data.api.patchCenter(c.id, { name: name.trim(), type }) : data.api.createCenter({ name: name.trim(), type })), c ? 'Centre updated.' : `${name.trim()} created.`);
        if (ok) close();
      }}>
        <Field label="Centre name"><input aria-label="Centre name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} dir="auto" /></Field>
        <Field label="Type"><select aria-label="Centre type" value={type} onChange={(e) => setType(e.target.value as CenterType)} className={INPUT}>{(Object.keys(CENTER_TYPE_LABEL) as CenterType[]).map((t) => <option key={t} value={t}>{CENTER_TYPE_LABEL[t]}</option>)}</select></Field>
        {!c && <p className="text-[11px] text-[#6B6785]">Each centre keeps its own staff and children. A centre administrator can be created under People.</p>}
        {tried && name.trim().length < 2 && <p role="alert" className="text-xs text-rose-700">Give the centre a name.</p>}
        <div className="grid grid-cols-2 gap-3">
          {c ? <button type="button" disabled={busy} className={c.archived ? BTN_GHOST : BTN_DANGER} onClick={async () => { if (await run(() => data.api.patchCenter(c.id, { archived: !c.archived }), c.archived ? 'Centre restored.' : 'Centre archived.')) close(); }}>{c.archived ? 'Restore' : 'Archive'}</button> : <button type="button" onClick={close} className={BTN_GHOST}>Cancel</button>}
          <button type="submit" disabled={busy} className={BTN}>{c ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </Sheet>
  );};
