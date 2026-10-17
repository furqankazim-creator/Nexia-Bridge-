import React, { useMemo, useState } from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { FidelityScore, Observation } from '../../types';
import { DISCIPLINE_LABEL } from '../../utils/org';
import { fidelityPercent, ioaTotalCount, ioaTrialByTrial, supervisionAlerts, supervisionMinutes, therapistCards } from '../../utils/supervision';
import { stepsFor } from '../../data/fidelityChecklists';
import { BTN, BTN_GHOST, CARD, Chip, Empty, Field, INPUT, Pill, Sheet } from './ui';

const disc = (r: string) => DISCIPLINE_LABEL[r]?.en ?? r;
const COMPETENCIES = ['Prompt fading', 'Data accuracy', 'Reinforcement', 'Session pacing', 'Parent communication', 'Task analysis'];
const TYPE_LABEL: Record<Observation['type'], string> = { live: 'Live observation', video: 'Video review', meeting: 'Meeting', training: 'Training' };
const hrs = (m: number) => (m >= 60 ? `${Math.floor(m / 60)} h ${m % 60 ? `${m % 60} min` : ''}`.trim() : `${m} min`);
const dateOf = (ymd: string) => new Date(`${ymd}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

export const StaffTab: React.FC = () => {
  const app = useApp();
  const { childrenList, savedSessions, fidelityObservations, thresholds } = app;
  const [form, setForm] = useState<{ therapist?: string } | null>(null);
  const [log, setLog] = useState<string>('');

  // One roster for everyone: the staff on the children's teams, plus anyone who has saved a session.
  const { roster, assigned } = useMemo(() => {
    const roster: { name: string; role: string }[] = [];
    const assigned: Record<string, string[]> = {};
    for (const c of childrenList) for (const m of c.assignedTeam) {
      if (m.role === 'parent') continue;
      if (!roster.some((r) => r.name === m.name)) roster.push({ name: m.name, role: m.role });
      (assigned[m.name] ??= []).push(c.id);
    }
    return { roster, assigned };
  }, [childrenList]);

  const cards = useMemo(() => therapistCards({ roster, assigned, sessions: savedSessions, observations: fidelityObservations }), [roster, assigned, savedSessions, fidelityObservations]);
  const alerts = useMemo(() => supervisionAlerts(cards, fidelityObservations, thresholds), [cards, fidelityObservations, thresholds]);
  const ym = new Date().toISOString().slice(0, 7);
  const shownLog = fidelityObservations.filter((o) => !log || o.therapistName === log).sort((a, b) => b.date.localeCompare(a.date));
  const childName = (id: string) => childrenList.find((c) => c.id === id)?.name ?? '';

  return (
    <div className="space-y-4 pb-28 md:pb-12 animate-in fade-in">
      <div className="flex items-start justify-between gap-2">
        <div><h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white">Staff Fidelity &amp; Supervision</h2></div>
        <button type="button" className={`${BTN} flex items-center gap-1 shrink-0`} onClick={() => setForm({})} data-testid="record-observation"><Plus className="w-4 h-4" /> Observe</button>
      </div>
      <div className={`${CARD} space-y-1`}>
        <p className="text-xs text-[#6B6785]"><b>Treatment integrity</b> = correct steps ÷ scored steps, scored by you while observing. <b>IOA</b> = how closely two observers’ data match. Flags use your organisation’s limits: integrity {thresholds.integrityMin}%, IOA {thresholds.ioaMin}%, an observation at least every {thresholds.observationDays} days.</p>
      </div>

      {alerts.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/30 p-4 space-y-1.5" data-testid="supervision-alerts">
          <p className="text-sm font-bold text-rose-900 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> {alerts.length} alert{alerts.length === 1 ? '' : 's'}</p>
          {alerts.map((a, i) => <p key={i} className="text-xs text-rose-900" data-testid="alert-row"><b>{a.therapist}</b>: {a.text}</p>)}
        </div>
      )}

      {cards.length === 0 && <Empty>No staff yet. Staff appear here once they are on a child’s team.</Empty>}
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
      {cards.map((c) => (
        <article key={c.name} className={`${CARD} space-y-2.5`} data-testid="staff-card">
          <div className="flex items-start justify-between gap-2">
            <div><h4 className="font-heading font-bold text-sm">{c.name}</h4><p className="text-xs text-[#6B6785]">{c.roles.map(disc).join(' · ')}</p></div>
            <button type="button" className={BTN_GHOST} onClick={() => setForm({ therapist: c.name })}>Observe</button>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            {[['Sessions', c.sessions], ['Caseload', c.caseload], ['Notes pending', c.notesPending], ['Integrity', c.integrity === null ? '—' : `${c.integrity}%`]].map(([l, v]) => (
              <div key={String(l)} className="rounded-xl bg-[#FAF6F0] dark:bg-[#252044] py-2"><b className="text-base font-heading tabular-nums block">{v}</b><span className="text-[10px] text-[#6B6785]">{l}</span></div>
            ))}
          </div>
          <p className="text-xs text-[#6B6785]">IOA <b>{c.ioa === null ? '—' : `${c.ioa}%`}</b> · last observed <b>{c.lastObserved ? dateOf(c.lastObserved) : 'never'}</b> · this month <b>{hrs(c.minutesThisMonth)}</b>{c.integritySource === 'self' ? ' · figures are self-recorded' : ''}</p>
          <div className="flex flex-wrap gap-1.5">
            {c.integrity !== null && c.integrity < thresholds.integrityMin && <Pill tone="red">Integrity low</Pill>}
            {c.ioa !== null && c.ioa < thresholds.ioaMin && <Pill tone="red">IOA low</Pill>}
            {c.openFeedback > 0 && <Pill tone="amber">{c.openFeedback} feedback not acknowledged</Pill>}
            {c.oldestPendingDays !== null && c.oldestPendingDays > 7 && <Pill tone="amber">oldest note {c.oldestPendingDays} days</Pill>}
          </div>
        </article>
      ))}
      </div>

      <section className={`${CARD} space-y-2`} data-testid="hours-tally">
        <p className="text-xs font-bold">Supervision hours this month</p>
        {cards.map((c) => <div key={c.name} className="flex justify-between text-xs"><span>{c.name}</span><b className="tabular-nums">{hrs(supervisionMinutes(fidelityObservations, ym, c.name))}</b></div>)}
        <div className="flex justify-between text-xs border-t border-[#E8E2D9] dark:border-[#38325E] pt-1.5"><span>Total</span><b className="tabular-nums" data-testid="hours-total">{hrs(supervisionMinutes(fidelityObservations, ym))}</b></div>
      </section>

      <section className="space-y-2" aria-label="Supervision log">
        <div className="flex items-center justify-between gap-2"><h3 className="font-heading font-bold text-base">Supervision log</h3>
          <select aria-label="Filter log by therapist" value={log} onChange={(e) => setLog(e.target.value)} className={`${INPUT} !w-auto !text-xs !py-1.5`}><option value="">Everyone</option>{cards.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}</select></div>
        {shownLog.length === 0 && <Empty>Nothing logged yet.</Empty>}
        <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
        {shownLog.map((o) => (
          <article key={o.id} className={`${CARD} !p-3 space-y-1`} data-testid="log-entry">
            <div className="flex items-start justify-between gap-2"><div><b className="text-sm">{o.therapistName}</b><p className="text-xs text-[#6B6785]">{TYPE_LABEL[o.type]} · {dateOf(o.date)} · {o.durationMin} min{o.childId && childName(o.childId) ? ` · ${childName(o.childId)}` : ''}</p></div>
              <span className="flex flex-col items-end gap-1">{o.fidelity !== null && <Pill tone={o.fidelity < thresholds.integrityMin ? 'red' : 'green'}>Integrity {o.fidelity}%</Pill>}{o.ioa && <Pill tone={o.ioa.percent < thresholds.ioaMin ? 'red' : 'green'}>IOA {o.ioa.percent}%</Pill>}</span></div>
            {o.goalName && <p className="text-xs" dir="auto">Goal: {o.goalName}</p>}
            {o.feedback && <p className="text-xs" dir="auto"><b>Feedback:</b> {o.feedback}</p>}
            {o.actionItems && <p className="text-xs" dir="auto"><b>Action:</b> {o.actionItems}</p>}
            {o.competencies?.length ? <p className="text-[11px] text-[#6B6785]">Competencies: {o.competencies.join(', ')}</p> : null}
            <p className="text-[11px]">{o.recheckDate && <span className="text-indigo-700 font-semibold">Re-check {dateOf(o.recheckDate)} · </span>}{o.feedback || o.actionItems ? (o.ackAt ? <span className="text-emerald-700 font-semibold">✓ Therapist acknowledged</span> : <span className="text-amber-700 font-semibold">Waiting for acknowledgement</span>) : null}</p>
          </article>
        ))}
        </div>
      </section>

      {form && <ObservationForm initialTherapist={form.therapist} roster={cards.map((c) => ({ name: c.name, role: c.roles[0] }))} onClose={() => setForm(null)} />}
    </div>
  );
};

const ObservationForm: React.FC<{ initialTherapist?: string; roster: { name: string; role: string }[]; onClose: () => void }> = ({ initialTherapist, roster, onClose }) => {
  const { childrenList, targets, addFidelityObservation } = useApp();
  const [therapist, setTherapist] = useState(initialTherapist ?? '');
  const kids = childrenList;
  const mineKids = childrenList.filter((c) => c.assignedTeam.some((m) => m.name === therapist));
  const [childId, setChildId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [type, setType] = useState<Observation['type']>('live');
  const [minutes, setMinutes] = useState('45');
  const [steps, setSteps] = useState<{ label: string; score: FidelityScore }[]>(() => stepsFor(roster.find((r) => r.name === initialTherapist)?.role).map((label) => ({ label, score: 'correct' })));
  const [touched, setTouched] = useState(false);
  const [newStep, setNewStep] = useState('');
  const [method, setMethod] = useState<'trial' | 'count'>('trial');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [trials, setTrials] = useState('');
  const [useIoa, setUseIoa] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [action, setAction] = useState('');
  const [recheck, setRecheck] = useState('');
  const [comps, setComps] = useState<string[]>([]);
  const [tried, setTried] = useState(false);

  // The checklist follows the therapist's discipline, or the chosen goal's own procedure steps, until you edit it.
  const discipline = roster.find((r) => r.name === therapist)?.role;
  const loadSteps = (disciplineName: string | undefined, gid: string) => {
    const g = targets.find((t) => t.id === gid);
    setSteps(stepsFor(g?.discipline ?? disciplineName, g?.procedureSteps).map((label) => ({ label, score: 'correct' as FidelityScore })));
    setTouched(false);
  };
  const training = type === 'training' || type === 'meeting';
  const fidelity = training ? null : fidelityPercent(steps);
  const ioaPercent = !useIoa ? null : method === 'trial' ? ioaTrialByTrial(Number(a), Number(trials)) : ioaTotalCount(Number(a), Number(b));
  const activeChildId = childId || mineKids[0]?.id || '';
  const goals = targets.filter((t) => t.childId === activeChildId);
  const mins = Number(minutes);
  const err = !therapist ? 'Choose the therapist.' : !(mins >= 5 && mins <= 480) ? 'Duration is 5 to 480 minutes.' : !training && fidelity === null ? 'Score at least one step (not all N/A).' : useIoa && ioaPercent === null ? (method === 'trial' ? 'Agreements cannot be more than the trials, and trials must be above zero.' : 'Enter two counts of zero or more.') : !feedback.trim() && !action.trim() && !training ? 'Add feedback or an action item for the therapist.' : training && !feedback.trim() ? 'Write the notes.' : recheck && recheck < date ? 'The re-check date is after the observation.' : '';

  return (
    <Sheet title="Record an observation" onClose={onClose}>
      <form noValidate className="space-y-3" onSubmit={(e) => {
        e.preventDefault(); setTried(true); if (err) return;
        addFidelityObservation({
          childId: activeChildId || childrenList[0]?.id || '',
          therapistName: therapist, discipline: roster.find((r) => r.name === therapist)?.role, goalId: goalId || undefined, goalName: goals.find((g) => g.id === goalId)?.name,
          date, type, durationMin: mins, steps: training ? [] : steps, fidelity, competencies: comps.length ? comps : undefined,
          ioa: useIoa && ioaPercent !== null ? { method, percent: ioaPercent, a: Number(a), b: method === 'trial' ? Number(trials) : Number(b), ...(method === 'trial' ? { trials: Number(trials) } : {}) } : null,
          feedback: feedback.trim(), actionItems: action.trim(), recheckDate: recheck || undefined,
        });
        onClose();
      }}>
        <Field label="Therapist"><select aria-label="Therapist" value={therapist} onChange={(e) => { setTherapist(e.target.value); setChildId(''); setGoalId(''); if (!touched) loadSteps(roster.find((r) => r.name === e.target.value)?.role, ''); }} className={INPUT}><option value="">Choose…</option>{roster.map((n) => <option key={n.name} value={n.name}>{n.name}</option>)}</select></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Child"><select aria-label="Child" value={childId} onChange={(e) => { setChildId(e.target.value); setGoalId(''); }} className={INPUT}><option value="">{mineKids[0] ? `${mineKids[0].name} (default)` : 'Choose…'}</option>{(mineKids.length ? mineKids : kids).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
          <Field label="Goal"><select aria-label="Goal" value={goalId} onChange={(e) => { setGoalId(e.target.value); if (!touched) loadSteps(discipline, e.target.value); }} className={INPUT}><option value="">Not about one goal</option>{goals.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select></Field>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Date"><input aria-label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${INPUT} !px-2`} /></Field>
          <Field label="Minutes"><input aria-label="Minutes" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} className={INPUT} /></Field>
          <Field label="Re-check"><input aria-label="Re-check date" type="date" value={recheck} onChange={(e) => setRecheck(e.target.value)} className={`${INPUT} !px-2`} /></Field>
        </div>
        <Field label="Type"><div className="flex flex-wrap gap-2">{(Object.keys(TYPE_LABEL) as Observation['type'][]).map((t) => <Chip key={t} on={type === t} onClick={() => setType(t)}>{TYPE_LABEL[t]}</Chip>)}</div></Field>

        {!training && (
          <div className="space-y-2" data-testid="fidelity-checklist">
            <div className="flex items-center justify-between"><p className="text-xs font-bold" data-testid="checklist-title">Fidelity checklist{discipline ? ` · ${disc(discipline)}` : ''}</p><b className="text-sm tabular-nums" data-testid="fidelity-live">{fidelity === null ? '—' : `${fidelity}%`}</b></div>
            {steps.map((s, i) => (
              <div key={i} className="rounded-xl bg-[#FAF6F0] dark:bg-[#252044] p-2.5 space-y-1.5">
                <div className="flex items-start justify-between gap-2"><p className="text-xs" dir="auto">{s.label}</p><button type="button" aria-label={`Remove step ${i + 1}`} className="text-[11px] text-rose-600 font-bold" onClick={() => { setTouched(true); setSteps(steps.filter((_, j) => j !== i)); }}>×</button></div>
                <div className="grid grid-cols-3 gap-1.5">{(['correct', 'incorrect', 'na'] as const).map((k) => <button key={k} type="button" aria-pressed={s.score === k} data-step={i} data-score={k} onClick={() => { setTouched(true); setSteps(steps.map((x, j) => (j === i ? { ...x, score: k } : x))); }} className={`py-1 rounded-lg text-[11px] font-bold border ${s.score === k ? (k === 'correct' ? 'bg-emerald-600 text-white border-emerald-600' : k === 'incorrect' ? 'bg-rose-600 text-white border-rose-600' : 'bg-gray-500 text-white border-gray-500') : 'bg-white dark:bg-transparent border-[#E8E2D9] dark:border-[#38325E] text-[#6B6785]'}`}>{k === 'na' ? 'N/A' : k === 'correct' ? 'Correct' : 'Incorrect'}</button>)}</div>
              </div>
            ))}
            <div className="flex gap-2"><input aria-label="New step" value={newStep} onChange={(e) => setNewStep(e.target.value)} placeholder="Add a step" className={INPUT} dir="auto" /><button type="button" className={BTN_GHOST} onClick={() => { if (newStep.trim()) { setTouched(true); setSteps([...steps, { label: newStep.trim(), score: 'correct' }]); setNewStep(''); } }}>Add</button></div>
          </div>
        )}

        {!training && (
          <div className="space-y-2" data-testid="ioa-block">
            <label className="flex items-center gap-2 text-xs font-bold"><input type="checkbox" checked={useIoa} onChange={(e) => setUseIoa(e.target.checked)} className="w-4 h-4 accent-[#4F46E5]" /> Record a second set of data (IOA)</label>
            {useIoa && (
              <>
                <div className="flex gap-2"><Chip on={method === 'trial'} onClick={() => setMethod('trial')}>Trial-by-trial</Chip><Chip on={method === 'count'} onClick={() => setMethod('count')}>Total count</Chip></div>
                {method === 'trial' ? (
                  <div className="grid grid-cols-2 gap-3"><Field label="Trials where you agreed"><input aria-label="Agreements" inputMode="numeric" value={a} onChange={(e) => setA(e.target.value)} className={INPUT} /></Field><Field label="Total trials"><input aria-label="Total trials" inputMode="numeric" value={trials} onChange={(e) => setTrials(e.target.value)} className={INPUT} /></Field></div>
                ) : (
                  <div className="grid grid-cols-2 gap-3"><Field label="Therapist’s count"><input aria-label="Therapist count" inputMode="numeric" value={a} onChange={(e) => setA(e.target.value)} className={INPUT} /></Field><Field label="Your count"><input aria-label="Observer count" inputMode="numeric" value={b} onChange={(e) => setB(e.target.value)} className={INPUT} /></Field></div>
                )}
                <p className="text-xs">IOA: <b data-testid="ioa-live">{ioaPercent === null ? '—' : `${ioaPercent}%`}</b> <span className="text-[#6B6785]">({method === 'trial' ? 'agreements ÷ trials' : 'smaller ÷ larger'} × 100)</span></p>
              </>
            )}
          </div>
        )}

        {training && <Field label="Competencies covered"><div className="flex flex-wrap gap-2">{COMPETENCIES.map((c) => <Chip key={c} on={comps.includes(c)} onClick={() => setComps(comps.includes(c) ? comps.filter((x) => x !== c) : [...comps, c])}>{c}</Chip>)}</div></Field>}
        <Field label={training ? 'Notes' : 'Feedback for the therapist'}><textarea aria-label="Feedback" rows={3} value={feedback} onChange={(e) => setFeedback(e.target.value)} className={INPUT} dir="auto" /></Field>
        {!training && <Field label="Action items"><textarea aria-label="Action items" rows={2} value={action} onChange={(e) => setAction(e.target.value)} className={INPUT} dir="auto" /></Field>}
        {tried && err && <p role="alert" className="text-xs text-rose-700">{err}</p>}
        <div className="grid grid-cols-2 gap-3"><button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button><button type="submit" className={BTN}>Save observation</button></div>
      </form>
    </Sheet>
  );
};
