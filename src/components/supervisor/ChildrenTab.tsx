import React, { useMemo, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Child, Target } from '../../types';
import { DISCIPLINE_LABEL, childOverview, isSoapNote, pendingGoals, returnedGoals, type ChildStatus } from '../../utils/org';
import { HEALTH_LABEL, goalHealth, type GoalHealth } from '../../utils/supervision';
import { parseMastery } from '../../utils/decisionSupport';
import { GOAL_BANK } from '../../data/goalBank';
import { trialCounts } from './ReviewTab';
import { BTN, BTN_GHOST, CARD, Chip, Empty, Field, INPUT, Pill, Sheet, Trend } from './ui';

const disc = (r: string) => DISCIPLINE_LABEL[r]?.en ?? r;
const STATUS: Record<ChildStatus, { label: string; tone: 'amber' | 'red' | 'green' | 'grey'; border: string }> = {
  needs_review: { label: 'Needs review', tone: 'amber', border: 'border-2 border-amber-300 dark:border-amber-700/60' },
  needs_support: { label: 'Needs support', tone: 'red', border: 'border-2 border-rose-300 dark:border-rose-700/60' },
  on_track: { label: 'On track', tone: 'green', border: 'border border-[#E8E2D9] dark:border-[#38325E]' },
  no_data: { label: 'No goals yet', tone: 'grey', border: 'border border-[#E8E2D9] dark:border-[#38325E]' },
};
const HEALTH_TONE: Record<GoalHealth, 'green' | 'amber' | 'red' | 'grey' | 'indigo'> = { new: 'grey', on_track: 'green', at_risk: 'amber', stalled: 'amber', mastered: 'indigo', regressed: 'red' };
const PHASES: Target['status'][] = ['baseline', 'teaching', 'generalizing', 'maintenance', 'mastered'];
const DISCIPLINES = ['speech', 'ot', 'behavior', 'remedial', 'teacher'] as const;
const dateOf = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

type Sheet =
  | { kind: 'goal' | 'edit'; id: string }
  | { kind: 'add' | 'bip' | 'home' | 'team' | 'notes'; childId: string }
  | null;

export const ChildrenTab: React.FC = () => {
  const { childrenList, targets, savedSessions, thresholds, caseNotes, teamRequests } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [rules, setRules] = useState(false);

  const kidIds = useMemo(() => new Set(childrenList.map((c) => c.id)), [childrenList]);
  const mine = useMemo(() => targets.filter((t) => kidIds.has(t.childId)), [targets, kidIds]);
  const approved = mine.filter((t) => t.approvalStatus === 'approved');
  const overviews = useMemo(() => childrenList.map((c) => childOverview(c, targets, savedSessions)), [childrenList, targets, savedSessions]);
  const avg = approved.length ? Math.round(approved.reduce((a, t) => a + t.currentPerformance, 0) / approved.length) : null;

  return (
    <div className="space-y-4 pb-28 md:pb-12 animate-in fade-in">
      <h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white">Caseload Overview</h2>
      <div className={`${CARD} space-y-1.5`} data-testid="caseload-summary">
        <p className="text-sm text-[#16302C] dark:text-gray-200" data-testid="caseload-total">Total active caseload: {childrenList.length} children • {mine.length} goals across all disciplines</p>
        <p className="text-xs text-[#6B6785]" data-testid="goal-breakdown">{approved.length} approved · {pendingGoals(mine).length} awaiting approval · {returnedGoals(mine).length} returned or rejected{avg !== null ? ` · average ${avg}% (approved goals only)` : ''}</p>
        <button type="button" className="text-xs font-bold text-[#4F46E5]" onClick={() => setRules((v) => !v)} aria-expanded={rules}>{rules ? 'Hide' : 'How are these numbers and statuses decided?'}</button>
        {rules && (
          <div className="text-xs text-[#16302C] dark:text-gray-300 space-y-1.5 pt-1" data-testid="status-rules">
            <p><b>Counts.</b> Only goals and sessions of the children listed here. A goal’s percentage is its latest recorded score; a goal with no saved session shows “baseline” because the number is its starting value.</p>
            <p><b>On track</b> — scores moving toward the criterion. <b>At risk</b> — the latest score is 20 or more points under the criterion, or three falling scores. <b>Stalled</b> — no session for {thresholds.stalledDays} days, or three flat scores below the criterion. <b>Mastered / Regressed</b> — a mastered goal stays mastered while at or above its criterion and becomes Regressed below it.</p>
            <p><b>Child status.</b> Needs review: something is waiting for you. Needs support: a goal should be revised. Otherwise on track.</p>
          </div>
        )}
      </div>

      {overviews.length === 0 && <Empty>No children are assigned to you yet.</Empty>}
      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4 items-start">
      {overviews.map((o) => {
        const st = STATUS[o.status];
        const isOpen = open === o.child.id;
        const health = o.goals.map((g) => ({ g, h: goalHealth(g, savedSessions, thresholds) }));
        const alerts = health.filter((x) => x.h.health === 'regressed' || x.h.health === 'at_risk' || x.h.health === 'stalled');
        const iep = caseNotes.filter((n) => n.childId === o.child.id && n.kind === 'iep_review' && n.nextReview).map((n) => n.nextReview!).sort().pop();
        const reqs = teamRequests.filter((r) => r.childId === o.child.id && r.status === 'open').length;
        return (
          <article key={o.child.id} className={`${CARD} ${st.border} space-y-3 ${isOpen ? 'md:col-span-2' : ''}`} data-testid="caseload-child">
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : o.child.id)} className="w-full flex items-center justify-between gap-3 text-start">
              <span className="min-w-0">
                <span className="block font-heading font-bold text-base">{o.child.name}</span>
                <span className="block text-xs text-[#6B6785]">{o.goals.length} goals · {o.sessions7d} sessions this week{o.lastSessionAt ? ` · last ${dateOf(o.lastSessionAt)}` : ''}</span>
                {iep && <span className="block text-[11px] text-indigo-700">IEP review {dateOf(iep)}</span>}
              </span>
              <span className="flex items-center gap-2 shrink-0"><Pill tone={st.tone}>{st.label}</Pill><ChevronDown className={`w-4 h-4 transition ${isOpen ? 'rotate-180' : ''}`} /></span>
            </button>
            {isOpen && (
              <div className="space-y-3 text-xs" data-testid="caseload-detail">
                {alerts.length > 0 && (
                  <div className="rounded-xl bg-rose-50 text-rose-900 p-3 space-y-1" data-testid="child-alerts">
                    <p className="font-bold">Needs your attention</p>
                    {alerts.map(({ g, h }) => <p key={g.id}>• {g.name}: {h.reason}</p>)}
                  </div>
                )}
                {o.child.assignedTeam.length > 0 && <p><b>Team:</b> {o.child.assignedTeam.map((m) => `${m.name} (${disc(m.role)})`).join(' · ')}</p>}
                <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
                {o.byDiscipline.map((d) => (
                  <div key={d.role} className="space-y-1">
                    <p className="font-bold">{disc(d.role)} · average {d.avg}%</p>
                    {health.filter(({ g }) => g.discipline === d.role).map(({ g, h }) => (
                      <button key={g.id} type="button" onClick={() => setSheet({ kind: 'goal', id: g.id })} className="w-full flex items-center justify-between gap-2 rounded-xl bg-[#FAF6F0] dark:bg-[#252044] px-3 py-2 text-start" data-testid="goal-row">
                        <span className="min-w-0"><span className="block truncate" dir="auto">{g.name}</span><span className="block text-[10px] text-[#6B6785]">{h.sessionCount ? `${h.sessionCount} session${h.sessionCount === 1 ? '' : 's'}` : 'baseline, no sessions yet'}{g.approvalStatus !== 'approved' ? ` · ${g.approvalStatus === 'awaiting_approval' ? 'awaiting approval' : g.approvalStatus === 'rejected' ? 'rejected' : 'returned'}` : ''}</span></span>
                        <span className="flex items-center gap-1.5 shrink-0"><Pill tone={HEALTH_TONE[h.health]}>{HEALTH_LABEL[h.health]}</Pill><b className="tabular-nums">{g.currentPerformance}%</b></span>
                      </button>
                    ))}
                  </div>
                ))}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-1" data-testid="child-actions">
                  <button type="button" className={`${BTN} flex items-center justify-center gap-1`} onClick={() => setSheet({ kind: 'add', childId: o.child.id })}><Plus className="w-3.5 h-3.5" /> Add goal</button>
                  <button type="button" className={BTN_GHOST} onClick={() => setSheet({ kind: 'bip', childId: o.child.id })}>Behavior plan</button>
                  <button type="button" className={BTN_GHOST} onClick={() => setSheet({ kind: 'home', childId: o.child.id })}>Home practice</button>
                  <button type="button" className={BTN_GHOST} onClick={() => setSheet({ kind: 'notes', childId: o.child.id })}>Case notes ({caseNotes.filter((n) => n.childId === o.child.id).length})</button>
                  <button type="button" className={`${BTN_GHOST} col-span-2 md:col-span-1`} onClick={() => setSheet({ kind: 'team', childId: o.child.id })}>Team change request{reqs ? ` (${reqs} open)` : ''}</button>
                </div>
              </div>
            )}
          </article>
        );
      })}
      </div>

      {sheet?.kind === 'goal' && <GoalDetail id={sheet.id} onClose={() => setSheet(null)} onEdit={() => setSheet({ kind: 'edit', id: sheet.id })} />}
      {sheet?.kind === 'edit' && <GoalEditor id={sheet.id} onClose={() => setSheet({ kind: 'goal', id: sheet.id })} />}
      {sheet?.kind === 'add' && <AddGoal childId={sheet.childId} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'bip' && <BipSheet child={childrenList.find((c) => c.id === sheet.childId)!} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'home' && <HomePractice child={childrenList.find((c) => c.id === sheet.childId)!} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'team' && <TeamRequestSheet child={childrenList.find((c) => c.id === sheet.childId)!} onClose={() => setSheet(null)} />}
      {sheet?.kind === 'notes' && <CaseNotesSheet child={childrenList.find((c) => c.id === sheet.childId)!} onClose={() => setSheet(null)} />}
    </div>
  );
};

/* ------------------------------------------------------------------ */

const GoalDetail: React.FC<{ id: string; onClose: () => void; onEdit: () => void }> = ({ id, onClose, onEdit }) => {
  const { targets, savedSessions, thresholds, childrenList } = useApp();
  const g = targets.find((t) => t.id === id);
  if (!g) return null;
  const h = goalHealth(g, savedSessions, thresholds);
  const own = savedSessions.filter((s) => s.targetId === g.id && !isSoapNote(s)).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  const prompt = own.reduce((a, s) => { const c = trialCounts(s); return { independent: a.independent + c.independent, prompted: a.prompted + c.prompted, incorrect: a.incorrect + c.incorrect }; }, { independent: 0, prompted: 0, incorrect: 0 });
  const total = prompt.independent + prompt.prompted + prompt.incorrect;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);
  return (
    <Sheet title={g.name} onClose={onClose}>
      <p className="text-xs text-[#6B6785]">{childrenList.find((c) => c.id === g.childId)?.name} · {disc(g.discipline)} · {g.domain}</p>
      <div className="flex flex-wrap gap-2 items-center"><Pill tone={HEALTH_TONE[h.health]}>{HEALTH_LABEL[h.health]}</Pill><Pill tone="indigo">Phase: {g.status}</Pill>{g.approvalStatus !== 'approved' && <Pill tone="amber">{g.approvalStatus.replace('_', ' ')}</Pill>}</div>
      <p className="text-xs" data-testid="goal-reason">{h.reason}</p>
      <Trend scores={h.scores} threshold={g.criterionThreshold} />
      <p className="text-[11px] text-[#6B6785]">{h.sessionCount ? `Based on ${h.sessionCount} saved session${h.sessionCount === 1 ? '' : 's'}.` : 'No saved sessions yet: the figure is the goal’s baseline or last recorded value.'} Dashed line = criterion.</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs rounded-xl bg-[#FAF6F0] dark:bg-[#252044] p-3">
        <div><dt className="text-[#6B6785]">Mastery criterion</dt><dd className="font-semibold">{g.masteryCriterion}</dd></div>
        <div><dt className="text-[#6B6785]">Baseline</dt><dd className="font-semibold">{g.baseline != null ? `${g.baseline}%` : '—'}</dd></div>
        <div><dt className="text-[#6B6785]">Target date</dt><dd className="font-semibold">{g.targetDate ?? 'not set'}</dd></div>
        <div><dt className="text-[#6B6785]">Therapist</dt><dd className="font-semibold">{g.therapistName ?? '—'}</dd></div>
        <div className="col-span-2"><dt className="text-[#6B6785]">Prompt hierarchy</dt><dd className="font-semibold" dir="auto">{g.promptLevel ?? 'not set'}</dd></div>
      </dl>
      {total > 0 && (
        <div className="space-y-1" data-testid="prompt-breakdown">
          <p className="text-xs font-bold">Prompt-level breakdown ({total} trials)</p>
          {([['Independent', prompt.independent, 'bg-emerald-500'], ['Prompted', prompt.prompted, 'bg-amber-400'], ['Incorrect', prompt.incorrect, 'bg-rose-500']] as const).map(([l, n, c]) => (
            <div key={l} className="flex items-center gap-2 text-xs"><span className="w-20">{l}</span><div className="flex-1 h-2 rounded-full bg-gray-100 dark:bg-[#252044] overflow-hidden"><div className={`h-full ${c}`} style={{ width: `${pct(n)}%` }} /></div><b className="w-14 text-end tabular-nums">{n} · {pct(n)}%</b></div>
          ))}
        </div>
      )}
      {own.length > 0 && (
        <div className="space-y-1" data-testid="goal-sessions">
          <p className="text-xs font-bold">Sessions</p>
          {own.slice(0, 8).map((s) => <p key={s.id} className="text-xs flex justify-between rounded-lg bg-[#FAF6F0] dark:bg-[#252044] px-2.5 py-1.5"><span>{dateOf(s.savedAt)} · {s.therapistName}</span><b>{s.summary.percentIndependent ?? '—'}{s.summary.percentIndependent != null ? '%' : ''}</b></p>)}
        </div>
      )}
      <div className="space-y-1" data-testid="goal-history">
        <p className="text-xs font-bold">History</p>
        {(g.history ?? []).length === 0 && <p className="text-xs text-[#6B6785]">No recorded changes yet.</p>}
        {[...(g.history ?? [])].reverse().map((e, i) => (
          <div key={i} className="text-xs rounded-lg bg-[#FAF6F0] dark:bg-[#252044] px-2.5 py-1.5">
            <p><b className="capitalize">{e.action}</b> · {e.by} · {dateOf(e.at)}</p>
            {e.changes?.map((c, j) => <p key={j} className="text-[#6B6785]" dir="auto">{c}</p>)}
            {e.note && <p className="text-[#6B6785]" dir="auto">“{e.note}”</p>}
          </div>
        ))}
      </div>
      <button type="button" className={`${BTN} w-full`} onClick={onEdit}>Edit goal</button>
    </Sheet>
  );
};

const GoalEditor: React.FC<{ id: string; onClose: () => void }> = ({ id, onClose }) => {
  const { targets, editGoal } = useApp();
  const g = targets.find((t) => t.id === id);
  const [name, setName] = useState(g?.name ?? '');
  const [def, setDef] = useState(g?.operationalDefinition ?? '');
  const [crit, setCrit] = useState(g?.masteryCriterion ?? '');
  const [date, setDate] = useState(g?.targetDate ?? '');
  const [prompt, setPrompt] = useState(g?.promptLevel ?? '');
  const [phase, setPhase] = useState<Target['status']>(g?.status ?? 'baseline');
  const [reason, setReason] = useState('');
  const [tried, setTried] = useState(false);
  if (!g) return null;
  const m = parseMastery(crit, 0);
  const err = name.trim().length < 3 ? 'Give the goal a name.' : !/(\d{1,3})\s*%/.test(crit) || m.threshold < 1 || m.threshold > 100 ? 'The criterion needs a percentage from 1 to 100.' : !reason.trim() ? 'Write the reason for the change. It goes in the history.' : '';
  return (
    <Sheet title="Edit goal" onClose={onClose}>
      <form noValidate className="space-y-3" onSubmit={(e) => { e.preventDefault(); setTried(true); if (err) return; if (editGoal(g.id, { name, operationalDefinition: def, masteryCriterion: crit, targetDate: date, promptLevel: prompt, status: phase }, reason)) onClose(); }}>
        <Field label="Goal"><input aria-label="Goal" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} dir="auto" /></Field>
        <Field label="Operational definition"><textarea aria-label="Operational definition" rows={3} value={def} onChange={(e) => setDef(e.target.value)} className={INPUT} dir="auto" /></Field>
        <Field label="Mastery criterion"><input aria-label="Mastery criterion" value={crit} onChange={(e) => setCrit(e.target.value)} className={INPUT} dir="auto" /></Field>
        <Field label="Target date"><input aria-label="Target date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT} /></Field>
        <Field label="Prompt hierarchy"><input aria-label="Prompt hierarchy" value={prompt} onChange={(e) => setPrompt(e.target.value)} className={INPUT} dir="auto" /></Field>
        <Field label="Phase"><div className="flex flex-wrap gap-2">{PHASES.map((p) => <Chip key={p} on={phase === p} onClick={() => setPhase(p)}>{p}</Chip>)}</div></Field>
        <Field label="Reason for the change (required)"><textarea aria-label="Reason for the change" rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className={INPUT} dir="auto" placeholder="e.g. Criterion raised after the IEP meeting" /></Field>
        {tried && err && <p role="alert" className="text-xs text-rose-700">{err}</p>}
        <div className="grid grid-cols-2 gap-3"><button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button><button type="submit" className={BTN}>Save with history</button></div>
      </form>
    </Sheet>
  );
};

const AddGoal: React.FC<{ childId: string; onClose: () => void }> = ({ childId, onClose }) => {
  const { createGoal, childrenList } = useApp();
  const [discipline, setDiscipline] = useState<Target['discipline']>('speech');
  const [bank, setBank] = useState(false);
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [def, setDef] = useState('');
  const [crit, setCrit] = useState('80% across 3 sessions');
  const [baseline, setBaseline] = useState('');
  const [date, setDate] = useState('');
  const [prompt, setPrompt] = useState('');
  const [tried, setTried] = useState(false);
  const m = parseMastery(crit, 0);
  const err = name.trim().length < 3 ? 'Give the goal a name.' : !/(\d{1,3})\s*%/.test(crit) || m.threshold < 1 || m.threshold > 100 ? 'The criterion needs a percentage from 1 to 100.' : baseline && (Number(baseline) < 0 || Number(baseline) > 100 || Number.isNaN(Number(baseline))) ? 'Baseline is a percentage from 0 to 100.' : '';
  return (
    <Sheet title={`Add goal · ${childrenList.find((c) => c.id === childId)?.name ?? ''}`} onClose={onClose}>
      <form noValidate className="space-y-3" onSubmit={(e) => { e.preventDefault(); setTried(true); if (err) return; createGoal({ childId, discipline, name, domain, operationalDefinition: def, masteryCriterion: crit, baseline: baseline ? Number(baseline) : undefined, targetDate: date, promptLevel: prompt }); onClose(); }}>
        <Field label="Discipline"><div className="flex flex-wrap gap-2">{DISCIPLINES.map((d) => <Chip key={d} on={discipline === d} onClick={() => setDiscipline(d)}>{disc(d)}</Chip>)}</div></Field>
        <button type="button" className={`${BTN_GHOST} w-full`} onClick={() => setBank((v) => !v)} aria-expanded={bank} data-testid="goal-bank-toggle">{bank ? 'Hide goal bank' : 'Pick from the goal bank (approved wording)'}</button>
        {bank && (
          <div className="space-y-1.5" data-testid="goal-bank">
            {GOAL_BANK.filter((b) => b.discipline === discipline).map((b) => (
              <button key={b.name} type="button" className="w-full text-start rounded-xl border border-[#E8E2D9] dark:border-[#38325E] p-2.5 text-xs" onClick={() => { setName(b.name); setDomain(b.domain); setDef(b.operationalDefinition); setCrit(b.masteryCriterion); setPrompt(b.promptLevel); setBank(false); }}>
                <b className="block" dir="auto">{b.name}</b><span className="text-[#6B6785]">{b.masteryCriterion} · {b.domain}</span>
              </button>
            ))}
          </div>
        )}
        <Field label="Goal"><input aria-label="Goal" value={name} onChange={(e) => setName(e.target.value)} className={INPUT} dir="auto" /></Field>
        <Field label="Domain"><input aria-label="Domain" value={domain} onChange={(e) => setDomain(e.target.value)} className={INPUT} dir="auto" /></Field>
        <Field label="Operational definition"><textarea aria-label="Operational definition" rows={3} value={def} onChange={(e) => setDef(e.target.value)} className={INPUT} dir="auto" /></Field>
        <Field label="Mastery criterion"><input aria-label="Mastery criterion" value={crit} onChange={(e) => setCrit(e.target.value)} className={INPUT} dir="auto" /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Baseline % (optional)"><input aria-label="Baseline" inputMode="numeric" value={baseline} onChange={(e) => setBaseline(e.target.value)} className={INPUT} /></Field>
          <Field label="Target date"><input aria-label="Target date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT} /></Field>
        </div>
        <Field label="Prompt hierarchy"><input aria-label="Prompt hierarchy" value={prompt} onChange={(e) => setPrompt(e.target.value)} className={INPUT} dir="auto" /></Field>
        {tried && err && <p role="alert" className="text-xs text-rose-700">{err}</p>}
        <div className="grid grid-cols-2 gap-3"><button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button><button type="submit" className={BTN}>Add and approve</button></div>
      </form>
    </Sheet>
  );
};

const BipSheet: React.FC<{ child: Child; onClose: () => void }> = ({ child, onClose }) => {
  const { bips, abcRecords } = useApp();
  const plan = bips.find((b) => b.childId === child.id);
  const since = Date.now() - 30 * 86400000;
  const events = abcRecords.filter((a) => a.childId === child.id && Date.parse(a.at) >= since).length;
  const row = (l: string, v: string) => v?.trim() ? <div key={l}><dt className="text-[#6B6785]">{l}</dt><dd className="font-semibold" dir="auto">{v}</dd></div> : null;
  return (
    <Sheet title={`Behavior plan · ${child.name}`} onClose={onClose}>
      {!plan ? (
        <p className="text-sm text-[#6B6785]" data-testid="no-plan">There is no behavior plan yet. The behavior therapist writes it in their portal; it appears here once it exists.</p>
      ) : (
        <>
          <div className="flex gap-2"><Pill tone={plan.status === 'active' ? 'green' : 'amber'}>{plan.status.replace('_', ' ')}</Pill><Pill tone="indigo">Version {plan.version}</Pill>{plan.reviewDate && <Pill tone="grey">Review {plan.reviewDate}</Pill>}</div>
          <dl className="space-y-2 text-xs rounded-xl bg-[#FAF6F0] dark:bg-[#252044] p-3" data-testid="plan-details">
            {row('Target behavior', plan.targetBehavior)}{row('Operational definition', plan.operationalDefinition)}{row('Function', plan.hypothesizedFunction)}{row('Replacement behavior', plan.replacementBehavior)}
            {row('Antecedent strategies', plan.antecedentStrategies)}{row('Teaching strategies', plan.teachingStrategies)}{row('Consequence strategies', plan.consequenceStrategies)}{row('Reinforcement', plan.reinforcement)}{row('Data method', plan.dataMethod)}
          </dl>
        </>
      )}
      <p className="text-xs text-[#6B6785]">{events} recorded behavior event{events === 1 ? '' : 's'} in the last 30 days.</p>
    </Sheet>
  );
};

const HomePractice: React.FC<{ child: Child; onClose: () => void }> = ({ child, onClose }) => {
  const { addHomeTask, homeTasks, currentUserName } = useApp();
  const tasks = homeTasks.filter((h) => h.childId === child.id);
  const [title, setTitle] = useState('');
  const [minutes, setMinutes] = useState('45');
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState('');
  const [instr, setInstr] = useState('');
  const [tried, setTried] = useState(false);
  const mins = Number(minutes);
  const err = title.trim().length < 3 ? 'Name the task.' : !(mins >= 5 && mins <= 240) ? 'Session length is 5 to 240 minutes.' : !to || to < from ? 'Pick an end date on or after the start date.' : instr.trim().length < 3 ? 'Write the instructions for the parent.' : '';
  return (
    <Sheet title={`Home practice · ${child.name}`} onClose={onClose}>
      <form noValidate className="space-y-3" onSubmit={(e) => { e.preventDefault(); setTried(true); if (err) return; addHomeTask({ childId: child.id, title: title.trim(), instructions: `${mins} minute session. ${instr.trim()}`, frequency: `${from} to ${to}`, dueDate: to, assignedBy: currentUserName }); setTitle(''); setInstr(''); setTried(false); }}>
        <Field label="Task"><input aria-label="Task" value={title} onChange={(e) => setTitle(e.target.value)} className={INPUT} dir="auto" /></Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Minutes"><input aria-label="Minutes" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} className={INPUT} /></Field>
          <Field label="From"><input aria-label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${INPUT} !px-2`} /></Field>
          <Field label="To"><input aria-label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} className={`${INPUT} !px-2`} /></Field>
        </div>
        <Field label="Instructions for the parent"><textarea aria-label="Instructions for the parent" rows={3} value={instr} onChange={(e) => setInstr(e.target.value)} className={INPUT} dir="auto" /></Field>
        {tried && err && <p role="alert" className="text-xs text-rose-700">{err}</p>}
        <button type="submit" className={`${BTN} w-full`}>Publish to the parent</button>
      </form>
      <div className="space-y-1.5" data-testid="home-tasks">
        <p className="text-xs font-bold">Assigned ({tasks.length})</p>
        {tasks.length === 0 && <p className="text-xs text-[#6B6785]">Nothing assigned yet.</p>}
        {tasks.map((t) => <div key={t.id} className="text-xs rounded-lg bg-[#FAF6F0] dark:bg-[#252044] px-2.5 py-2 flex items-start justify-between gap-2"><span><b dir="auto">{t.title}</b><span className="block text-[#6B6785]">{t.frequency}{t.parentNote ? ` · parent: “${t.parentNote}”` : ''}</span></span><Pill tone={t.done ? 'green' : 'grey'}>{t.done ? 'Done' : 'Open'}</Pill></div>)}
      </div>
    </Sheet>
  );
};

const TeamRequestSheet: React.FC<{ child: Child; onClose: () => void }> = ({ child, onClose }) => {
  const { addTeamRequest, teamRequests } = useApp();
  const [kind, setKind] = useState<'add' | 'remove' | 'swap'>('add');
  const [role, setRole] = useState<string>('speech');
  const [who, setWho] = useState('');
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);
  const mine = teamRequests.filter((r) => r.childId === child.id);
  const needsWho = kind !== 'add';
  const err = needsWho && !who ? 'Choose who the change is about.' : note.trim().length < 3 ? 'Say why.' : '';
  return (
    <Sheet title={`Team change · ${child.name}`} onClose={onClose}>
      <p className="text-xs text-[#6B6785]">The administrator assigns therapists. This sends them your request.</p>
      <form noValidate className="space-y-3" onSubmit={(e) => { e.preventDefault(); setTried(true); if (err) return; addTeamRequest({ childId: child.id, kind, role, staffName: needsWho ? who : '', note: note.trim() }); setNote(''); setWho(''); setTried(false); }}>
        <Field label="Request"><div className="flex gap-2">{(['add', 'remove', 'swap'] as const).map((k) => <Chip key={k} on={kind === k} onClick={() => setKind(k)}>{k === 'add' ? 'Add a therapist' : k === 'remove' ? 'Remove one' : 'Swap one'}</Chip>)}</div></Field>
        <Field label={kind === 'add' ? 'Discipline needed' : 'Discipline'}><div className="flex flex-wrap gap-2">{DISCIPLINES.map((d) => <Chip key={d} on={role === d} onClick={() => setRole(d)}>{disc(d)}</Chip>)}</div></Field>
        {needsWho && <Field label="Who"><select aria-label="Who" value={who} onChange={(e) => setWho(e.target.value)} className={INPUT}><option value="">Choose…</option>{child.assignedTeam.map((m) => <option key={m.name} value={m.name}>{m.name} ({disc(m.role)})</option>)}</select></Field>}
        <Field label="Reason"><textarea aria-label="Reason" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={INPUT} dir="auto" /></Field>
        {tried && err && <p role="alert" className="text-xs text-rose-700">{err}</p>}
        <button type="submit" className={`${BTN} w-full`}>Send to administrator</button>
      </form>
      <div className="space-y-1.5" data-testid="team-requests">
        <p className="text-xs font-bold">Requests ({mine.length})</p>
        {mine.map((r) => (
          <div key={r.id} className="text-xs rounded-lg bg-[#FAF6F0] dark:bg-[#252044] px-2.5 py-2 space-y-0.5" data-testid="team-request" data-status={r.status}>
            <div className="flex justify-between gap-2"><b>{r.kind === 'add' ? `Add ${disc(r.role)}` : `${r.kind === 'remove' ? 'Remove' : 'Swap'} ${r.staffName}`}</b><Pill tone={r.status === 'open' ? 'amber' : r.status === 'done' ? 'green' : 'red'}>{r.status === 'open' ? 'Open' : r.status === 'done' ? 'Done' : 'Declined'}</Pill></div>
            <p className="text-[#6B6785]" dir="auto">{r.note}</p>
            {r.adminNote && <p className="text-indigo-800" dir="auto">Administrator: {r.adminNote}</p>}
          </div>
        ))}
      </div>
    </Sheet>
  );
};

const CaseNotesSheet: React.FC<{ child: Child; onClose: () => void }> = ({ child, onClose }) => {
  const { caseNotes, addCaseNote, removeCaseNote } = useApp();
  const notes = caseNotes.filter((n) => n.childId === child.id).sort((a, b) => b.date.localeCompare(a.date));
  const [kind, setKind] = useState<'note' | 'meeting' | 'iep_review'>('note');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [next, setNext] = useState('');
  const [text, setText] = useState('');
  const [tried, setTried] = useState(false);
  const err = text.trim().length < 3 ? 'Write the note.' : kind === 'iep_review' && (!next || next <= date) ? 'Set the next review date, after this one.' : '';
  const LABEL = { note: 'Note', meeting: 'Team meeting', iep_review: 'IEP review' } as const;
  return (
    <Sheet title={`Case notes · ${child.name}`} onClose={onClose}>
      <form noValidate className="space-y-3" onSubmit={(e) => { e.preventDefault(); setTried(true); if (err) return; addCaseNote({ childId: child.id, kind, text, date, nextReview: kind === 'iep_review' ? next : undefined }); setText(''); setNext(''); setTried(false); }}>
        <Field label="Type"><div className="flex gap-2 flex-wrap">{(['note', 'meeting', 'iep_review'] as const).map((k) => <Chip key={k} on={kind === k} onClick={() => setKind(k)}>{LABEL[k]}</Chip>)}</div></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><input aria-label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT} /></Field>
          {kind === 'iep_review' && <Field label="Next review"><input aria-label="Next review" type="date" value={next} onChange={(e) => setNext(e.target.value)} className={INPUT} /></Field>}
        </div>
        <Field label="Note"><textarea aria-label="Note" rows={3} value={text} onChange={(e) => setText(e.target.value)} className={INPUT} dir="auto" /></Field>
        {tried && err && <p role="alert" className="text-xs text-rose-700">{err}</p>}
        <button type="submit" className={`${BTN} w-full`}>Save note</button>
      </form>
      <div className="space-y-1.5" data-testid="case-notes">
        {notes.length === 0 && <p className="text-xs text-[#6B6785]">No notes yet.</p>}
        {notes.map((n) => (
          <div key={n.id} className="text-xs rounded-lg bg-[#FAF6F0] dark:bg-[#252044] px-2.5 py-2 space-y-0.5" data-testid="case-note">
            <div className="flex justify-between gap-2"><b>{LABEL[n.kind]} · {n.date}</b><button type="button" className="text-rose-600 font-bold" aria-label="Delete note" onClick={() => { if (window.confirm('Delete this note?')) removeCaseNote(n.id); }}>Delete</button></div>
            <p dir="auto">{n.text}</p>
            <p className="text-[#6B6785]">{n.author}{n.nextReview ? ` · next review ${n.nextReview}` : ''}</p>
          </div>
        ))}
      </div>
    </Sheet>
  );
};

