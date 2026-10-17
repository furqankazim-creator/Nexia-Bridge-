import React, { useState } from 'react';
import { Copy, Plus } from 'lucide-react';
import { type AdminInvoice, type InvoiceStatus } from '../../api/client';
import type { AdminData } from './useAdminData';
import { BTN, BTN_GHOST, BTN_DANGER, CARD, Chip, Empty, Field, INPUT, Pill, Sheet, longDate, money, monthYear } from './adminUi';

interface Props { data: AdminData; orgWide: boolean; myCenterId: string | null; notify: (m: string) => void }
const TONE: Record<InvoiceStatus, 'grey' | 'amber' | 'green' | 'red'> = { draft: 'grey', issued: 'amber', paid: 'green', void: 'red' };

interface Ctx { data: AdminData; orgWide: boolean; myCenterId: string | null; notify: (m: string) => void; setAdding: (v: boolean) => void; setOpen: (i: AdminInvoice | null) => void }

export const BillingTab: React.FC<Props> = ({ data, orgWide, myCenterId, notify }) => {
  const { invoices, totals, kids, centers, run, busy, loading, error } = data;
  const [filter, setFilter] = useState<'all' | InvoiceStatus>('all');
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<AdminInvoice | null>(null);
  const [planOpen, setPlanOpen] = useState(false);
  const kidName = (id: string | null) => kids.find((k) => k.id === id)?.name;
  const centerName = (id: string | null) => centers.find((c) => c.id === id)?.name;
  const list = invoices.filter((i) => filter === 'all' || i.status === filter);
  const text = (i: AdminInvoice) => [`${i.number} · ${i.description}`, kidName(i.childId) ? `Child: ${kidName(i.childId)}` : '', centerName(i.centerId) ? `Centre: ${centerName(i.centerId)}` : '', `Amount: ${money(i.amount, i.currency)}`, i.dueDate ? `Due: ${i.dueDate}` : '', `Status: ${i.status}`].filter(Boolean).join('\n');



  const ctx = { data, orgWide, myCenterId, notify, setAdding, setOpen };
  return (
    <div className="space-y-4 pb-28 md:pb-12 animate-in fade-in">
      <div className="flex items-center justify-between gap-2">
        <div><h2 className="font-heading text-2xl font-bold">Billing</h2><p className="text-sm text-[#6B6785]">Invoices by child and centre</p></div>
        <button type="button" onClick={() => setAdding(true)} className={`${BTN} flex items-center gap-1`} data-testid="add-invoice"><Plus className="w-4 h-4" /> New</button>
      </div>
      {error && <p role="alert" className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</p>}
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 items-start">
      {data.settings && (
        <div className={`${CARD} space-y-2`} data-testid="plan-card">
          <div className="flex items-start justify-between gap-2"><div><p className="text-[11px] font-bold uppercase tracking-wider text-[#4F46E5]">Subscription</p><b className="font-heading text-base block" data-testid="plan-name">{data.settings.plan.name}</b></div><Pill tone={data.settings.plan.status === 'active' ? 'green' : 'amber'}>{data.settings.plan.status === 'active' ? 'Active plan' : 'Paused'}</Pill></div>
          <div>
            <div className="flex justify-between text-xs mb-1"><span>Seats used</span><b data-testid="plan-seats">{data.seatsUsed} / {data.settings.plan.seats}</b></div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-[#252044] overflow-hidden"><div className={`h-full ${data.seatsUsed >= data.settings.plan.seats ? 'bg-rose-500' : 'bg-[#4F46E5]'}`} style={{ width: `${Math.min(100, Math.round((data.seatsUsed / Math.max(1, data.settings.plan.seats)) * 100))}%` }} /></div>
          </div>
          <p className="text-xs text-[#6B6785]">{data.settings.plan.billingCycle === 'annual' ? 'Annual' : 'Monthly'} · billed {monthYear(data.settings.plan.billedOn)} · renews {longDate(data.settings.plan.renewalDate)}</p>
          {data.canEditSettings && <button type="button" className={BTN_GHOST} onClick={() => setPlanOpen(true)} data-testid="edit-plan">Change plan and seats</button>}
        </div>
      )}
      <div className="grid grid-cols-3 gap-2" data-testid="billing-totals">
        {([['Draft', totals.draft], ['Outstanding', totals.outstanding], ['Paid', totals.paid]] as const).map(([l, v]) => <div key={l} className={`${CARD} !p-3 text-center`}><b className="block text-sm font-heading tabular-nums" data-testid={`total-${l.toLowerCase()}`}>{money(v)}</b><span className="text-[10px] text-[#6B6785]">{l}</span></div>)}
      </div>
      </div>
      <div className="flex gap-2 flex-wrap">{(['all', 'draft', 'issued', 'paid', 'void'] as const).map((f) => <Chip key={f} on={filter === f} onClick={() => setFilter(f)}>{f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}</Chip>)}</div>
      {list.length === 0 && !loading && <Empty>{invoices.length ? 'Nothing in this view.' : 'No invoices yet. Create the first draft.'}</Empty>}
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
      {list.map((i) => (
        <button key={i.id} type="button" onClick={() => setOpen(i)} className={`${CARD} w-full text-start flex items-center justify-between gap-3`} data-testid="invoice-card" data-status={i.status}>
          <span className="min-w-0"><b className="block text-sm truncate" dir="auto">{i.description}</b><span className="block text-xs text-[#6B6785] truncate">{i.number} · {kidName(i.childId) ?? centerName(i.centerId) ?? 'Organisation'}{i.dueDate ? ` · due ${i.dueDate}` : ''}</span></span>
          <span className="text-end shrink-0"><b className="block text-sm tabular-nums">{money(i.amount, i.currency)}</b><Pill tone={TONE[i.status]}>{i.status}</Pill></span>
        </button>
      ))}
      </div>
      <p className="text-[11px] text-[#6B6785]">Records and tracks invoices. It does not take payments; mark an invoice paid when the money arrives.</p>
      {planOpen && data.settings && <PlanSheet ctx={ctx} onClose={() => setPlanOpen(false)} />}
      {adding && <Sheet title="New invoice" onClose={() => setAdding(false)}><Form ctx={ctx}  /></Sheet>}
      {open && <InvoiceSheet ctx={ctx} i={open} />}
    </div>
  );
};

const Form: React.FC<{ ctx: Ctx; inv?: AdminInvoice }> = ({ ctx, inv }) => {
  const { data, orgWide, myCenterId, notify, setAdding, setOpen } = ctx;
  const { kids, centers, run, busy } = data;
  const kidName = (id: string | null) => kids.find((k) => k.id === id)?.name;
  const centerName = (id: string | null) => centers.find((c) => c.id === id)?.name;
  const text = (i: AdminInvoice) => [`${i.number} · ${i.description}`, kidName(i.childId) ? `Child: ${kidName(i.childId)}` : '', centerName(i.centerId) ? `Centre: ${centerName(i.centerId)}` : '', `Amount: ${money(i.amount, i.currency)}`, i.dueDate ? `Due: ${i.dueDate}` : '', `Status: ${i.status}`].filter(Boolean).join('\n');
  const [description, setDescription] = useState(inv?.description ?? '');
  const [amount, setAmount] = useState(inv ? String(inv.amount) : '');
  const [childId, setChildId] = useState(inv?.childId ?? '');
  const [centerId, setCenterId] = useState(inv?.centerId ?? myCenterId ?? '');
  const [dueDate, setDueDate] = useState(inv?.dueDate ?? '');
  const [tried, setTried] = useState(false);
  const num = Number(amount);
  const err = description.trim().length < 2 ? 'Describe what the invoice is for.' : !(num > 0) ? 'Enter an amount above zero.' : '';
  const close = () => (inv ? setOpen(null) : setAdding(false));
  return (
    <form noValidate className="space-y-3" onSubmit={async (e) => {
      e.preventDefault(); setTried(true); if (err) return;
      const ok = await run(() => (inv ? data.api.patchInvoice(inv.id, { description: description.trim(), amount: num, dueDate: dueDate || null }) : data.api.createInvoice({ description: description.trim(), amount: num, childId: childId || null, centerId: centerId || null, dueDate: dueDate || null })), inv ? 'Invoice updated.' : 'Invoice created.');
      if (ok) close();
    }}>
      <Field label="Description"><input aria-label="Description" value={description} onChange={(e) => setDescription(e.target.value)} className={INPUT} dir="auto" placeholder="e.g. Speech sessions, May" /></Field>
      <Field label="Amount (SAR)"><input aria-label="Amount" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={INPUT} /></Field>
      {!inv && <Field label="Child (optional)"><select aria-label="Child" value={childId} onChange={(e) => setChildId(e.target.value)} className={INPUT}><option value="">Not for one child</option>{kids.filter((k) => !k.archived).map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}</select></Field>}
      {!inv && !childId && orgWide && <Field label="Centre"><select aria-label="Centre" value={centerId} onChange={(e) => setCenterId(e.target.value)} className={INPUT}><option value="">Whole organisation</option>{centers.filter((c) => !c.archived).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>}
      <Field label="Due date (optional)"><input aria-label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={INPUT} /></Field>
      {tried && err && <p role="alert" className="text-xs text-rose-700">{err}</p>}
      <div className="grid grid-cols-2 gap-3"><button type="button" onClick={close} className={BTN_GHOST}>Cancel</button><button type="submit" disabled={busy} className={BTN}>{inv ? 'Save draft' : 'Create draft'}</button></div>
    </form>
  );};

const InvoiceSheet: React.FC<{ ctx: Ctx; i: AdminInvoice }> = ({ ctx, i }) => {
  const { data, orgWide, myCenterId, notify, setAdding, setOpen } = ctx;
  const { kids, centers, run, busy } = data;
  const kidName = (id: string | null) => kids.find((k) => k.id === id)?.name;
  const centerName = (id: string | null) => centers.find((c) => c.id === id)?.name;
  const text = (i: AdminInvoice) => [`${i.number} · ${i.description}`, kidName(i.childId) ? `Child: ${kidName(i.childId)}` : '', centerName(i.centerId) ? `Centre: ${centerName(i.centerId)}` : '', `Amount: ${money(i.amount, i.currency)}`, i.dueDate ? `Due: ${i.dueDate}` : '', `Status: ${i.status}`].filter(Boolean).join('\n');
  const set = async (status: InvoiceStatus, ok: string) => { if (await run(() => data.api.patchInvoice(i.id, { status }), ok)) setOpen(null); };
  return (
    <Sheet title={i.number} onClose={() => setOpen(null)}>
      {i.status === 'draft' ? <Form ctx={ctx} inv={i} /> : (
        <div className="space-y-1 text-sm"><p className="font-bold" dir="auto">{i.description}</p><p className="text-xs text-[#6B6785]">{kidName(i.childId) ?? centerName(i.centerId) ?? 'Organisation'}{i.dueDate ? ` · due ${i.dueDate}` : ''}</p><p className="text-xl font-heading font-bold tabular-nums">{money(i.amount, i.currency)}</p><Pill tone={TONE[i.status]}>{i.status}</Pill></div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        {i.status === 'draft' && <button type="button" disabled={busy} className={BTN} onClick={() => void set('issued', `${i.number} issued.`)}>Issue</button>}
        {i.status === 'issued' && <button type="button" disabled={busy} className={BTN} onClick={() => void set('paid', `${i.number} marked paid.`)}>Mark paid</button>}
        {(i.status === 'draft' || i.status === 'issued') && <button type="button" disabled={busy} className={BTN_DANGER} onClick={() => { if (window.confirm(`Void ${i.number}?`)) void set('void', `${i.number} voided.`); }}>Void</button>}
        <button type="button" className={`${BTN_GHOST} flex items-center gap-1`} onClick={async () => { try { await navigator.clipboard.writeText(text(i)); notify('Invoice text copied.'); } catch { notify('Copy is not available here.'); } }}><Copy className="w-3.5 h-3.5" /> Copy text</button>
      </div>
    </Sheet>
  );};

const PlanSheet: React.FC<{ ctx: Ctx; onClose: () => void }> = ({ ctx, onClose }) => {
  const { data } = ctx;
  const plan = data.settings!.plan;
  const [name, setName] = useState(plan.name);
  const [seats, setSeats] = useState(String(plan.seats));
  const [cycle, setCycle] = useState(plan.billingCycle);
  const [billedOn, setBilledOn] = useState(plan.billedOn);
  const [renewal, setRenewal] = useState(plan.renewalDate);
  const [tried, setTried] = useState(false);
  const n = Number(seats);
  const err = name.trim().length < 2 ? 'Give the plan a name.' : !Number.isInteger(n) || n < 1 ? 'Seats must be a whole number, 1 or more.' : n < data.seatsUsed ? `${data.seatsUsed} seats are in use. Switch people off first, or keep at least ${data.seatsUsed}.` : !/^\d{4}-\d{2}-\d{2}$/.test(renewal) ? 'Pick a renewal date.' : '';
  return (
    <Sheet title="Plan and seats" onClose={onClose}>
      <form noValidate className="space-y-3" onSubmit={async (e) => {
        e.preventDefault(); setTried(true); if (err) return;
        if (await data.run(() => data.api.patchSettings({ plan: { name: name.trim(), seats: n, billingCycle: cycle, billedOn, renewalDate: renewal } }), 'Plan updated.')) onClose();
      }}>
        <Field label="Plan name"><input aria-label="Plan name" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} /></Field>
        <Field label="Licence seats" hint={`${data.seatsUsed} in use. Each active therapist, teacher or supervisor uses one seat.`}><input aria-label="Seats" inputMode="numeric" value={seats} onChange={(e) => setSeats(e.target.value)} className={INPUT} /></Field>
        <Field label="Billing cycle"><div className="flex gap-2"><Chip on={cycle === 'annual'} onClick={() => setCycle('annual')}>Annual</Chip><Chip on={cycle === 'monthly'} onClick={() => setCycle('monthly')}>Monthly</Chip></div></Field>
        <Field label="Billed in"><input aria-label="Billed in" type="month" value={billedOn} onChange={(e) => setBilledOn(e.target.value)} className={INPUT} /></Field>
        <Field label="Renewal date"><input aria-label="Renewal date" type="date" value={renewal} onChange={(e) => setRenewal(e.target.value)} className={INPUT} /></Field>
        {tried && err && <p role="alert" className="text-xs text-rose-700">{err}</p>}
        <div className="grid grid-cols-2 gap-3"><button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button><button type="submit" disabled={data.busy} className={BTN}>Save plan</button></div>
      </form>
    </Sheet>
  );
};
