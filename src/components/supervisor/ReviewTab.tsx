import React, { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { SavedSession, Target } from '../../types';
import { DISCIPLINE_LABEL, childOverview, isSoapNote, pendingGoals, pendingSessions, returnedGoals, type ChildStatus } from '../../utils/org';
import { ageDays, ageLabel } from '../../utils/supervision';
import { parseMastery } from '../../utils/decisionSupport';
import { primaryPercent } from '../../utils/primaryPercent';
import { BTN, BTN_DANGER, BTN_GHOST, CARD, Field, INPUT, NoteDialog, Pill, Sheet } from './ui';

const STATUS: Record<ChildStatus, { label: string; tone: 'amber' | 'red' | 'green' | 'grey'; border: string }> = {
  needs_review: { label: 'Needs review', tone: 'amber', border: 'border-2 border-amber-300 dark:border-amber-700/60' },
  needs_support: { label: 'Needs support', tone: 'red', border: 'border-2 border-rose-300 dark:border-rose-700/60' },
  on_track: { label: 'On track', tone: 'green', border: 'border border-[#E8E2D9] dark:border-[#38325E]' },
  no_data: { label: 'No goals yet', tone: 'grey', border: 'border border-[#E8E2D9] dark:border-[#38325E]' },
};
const disc = (r: string) => DISCIPLINE_LABEL[r]?.en ?? r;
const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** Independent / prompted / incorrect counts of one session. */
export const trialCounts = (s: SavedSession) => {
  const t = s.data.trials ?? [];
  const d = s.data.drill;
  return {
    independent: t.filter((x) => x === '+').length + (d?.independent ?? 0),
    prompted: t.filter((x) => x === 'P').length + (d?.prompted ?? 0),
    incorrect: t.filter((x) => x === '-').length + (d?.incorrect ?? 0),
  };
};
const AgeBadge: React.FC<{ iso?: string }> = ({ iso }) => {
  const d = ageDays(iso);
  if (d === null) return null;
  return <Pill tone={d > 7 ? 'red' : d > 3 ? 'amber' : 'grey'}>{ageLabel(iso)}</Pill>;
};

type Dlg =
  | { kind: 'goalBack' | 'goalReject' | 'goalEdit'; id: string }
  | { kind: 'sessionBack' | 'sessionRetrain'; id: string }
  | { kind: 'sessionOpen'; id: string }
  | null;

export const ReviewTab: React.FC = () => {
  const app = useApp();
  const { targets, savedSessions, childrenList } = app;
  const [filter, setFilter] = useState<'all' | 'goals' | 'sessions'>('all');
  const [fDisc, setFDisc] = useState('');
  const [fTher, setFTher] = useState('');
  const [fChild, setFChild] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [dlg, setDlg] = useState<Dlg>(null);
  const [showAll, setShowAll] = useState(false);

  const childName = (id: string) => childrenList.find((c) => c.id === id)?.name ?? 'Unknown child';
  const kidIds = useMemo(() => new Set(childrenList.map((c) => c.id)), [childrenList]);
  const scoped = (t: { childId: string }) => kidIds.has(t.childId);

  const waitingGoals = useMemo(() => pendingGoals(targets).filter(scoped).sort((a, b) => (a.submittedAt ?? '').localeCompare(b.submittedAt ?? '')), [targets, kidIds]);
  const returned = useMemo(() => returnedGoals(targets).filter(scoped), [targets, kidIds]);
  const waitingSessions = useMemo(() => pendingSessions(savedSessions).filter(scoped).sort((a, b) => a.savedAt.localeCompare(b.savedAt)), [savedSessions, kidIds]);

  const goalOk = (g: Target) => (!fDisc || g.discipline === fDisc) && (!fTher || g.therapistName === fTher) && (!fChild || g.childId === fChild);
  const sessOk = (s: SavedSession) => (!fDisc || s.role === fDisc) && (!fTher || s.therapistName === fTher) && (!fChild || s.childId === fChild);
  const goals = waitingGoals.filter(goalOk);
  const sessions = waitingSessions.filter(sessOk);
  const therapists = Array.from(new Set([...waitingGoals.map((g) => g.therapistName), ...waitingSessions.map((s) => s.therapistName)].filter(Boolean) as string[])).sort();
  const overviews = useMemo(() => childrenList.map((c) => childOverview(c, targets, savedSessions)), [childrenList, targets, savedSessions]);

  const dGoal = dlg && (dlg.kind === 'goalBack' || dlg.kind === 'goalReject' || dlg.kind === 'goalEdit') ? targets.find((t) => t.id === dlg.id) : undefined;
  const dSess = dlg && (dlg.kind === 'sessionBack' || dlg.kind === 'sessionRetrain' || dlg.kind === 'sessionOpen') ? savedSessions.find((s) => s.id === dlg.id) : undefined;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const chosen = picked.filter((id) => goals.some((g) => g.id === id));

  const shownSessions = showAll ? sessions : sessions.slice(0, 6);

  return (
    <div className="space-y-5 pb-28 md:pb-12 animate-in fade-in">
      <div>
        <h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white mb-1">Review</h2>
        <p className="text-sm text-[#6B6785] dark:text-[#A5A0C2]">Goals and sessions waiting for your decision</p>
      </div>

      <div className="space-y-2.5 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
        <button type="button" aria-pressed={filter === 'goals'} onClick={() => setFilter(filter === 'goals' ? 'all' : 'goals')} className={`w-full p-4 rounded-2xl bg-white dark:bg-[#1F1B3A] border flex items-center justify-between text-start shadow-card transition ${filter === 'goals' ? 'border-[#4F46E5]' : 'border-[#E8E2D9] dark:border-[#38325E]'}`}>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" /><span className="font-semibold text-sm" data-testid="goals-counter">Goals awaiting approval · {waitingGoals.length}</span></span>
          <ChevronDown className="w-4 h-4 text-[#6B6785]" />
        </button>
        <button type="button" aria-pressed={filter === 'sessions'} onClick={() => setFilter(filter === 'sessions' ? 'all' : 'sessions')} className={`w-full p-4 rounded-2xl bg-white dark:bg-[#1F1B3A] border flex items-center justify-between text-start shadow-card transition ${filter === 'sessions' ? 'border-[#4F46E5]' : 'border-[#E8E2D9] dark:border-[#38325E]'}`}>
          <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /><span className="font-semibold text-sm" data-testid="sessions-counter">Sessions to review · {waitingSessions.length}</span></span>
          <ChevronDown className="w-4 h-4 text-[#6B6785]" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4" data-testid="review-filters">
        <select aria-label="Filter by discipline" value={fDisc} onChange={(e) => setFDisc(e.target.value)} className={`${INPUT} !text-xs md:!text-sm !px-2 md:!px-3.5`}><option value="">All disciplines</option>{Object.keys(DISCIPLINE_LABEL).map((d) => <option key={d} value={d}>{disc(d)}</option>)}</select>
        <select aria-label="Filter by therapist" value={fTher} onChange={(e) => setFTher(e.target.value)} className={`${INPUT} !text-xs md:!text-sm !px-2 md:!px-3.5`}><option value="">All therapists</option>{therapists.map((t) => <option key={t} value={t}>{t}</option>)}</select>
        <select aria-label="Filter by child" value={fChild} onChange={(e) => setFChild(e.target.value)} className={`${INPUT} !text-xs md:!text-sm !px-2 md:!px-3.5`}><option value="">All children</option>{childrenList.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      </div>

      {filter !== 'sessions' && (goals.length > 0 || returned.length > 0) && (
        <section className="space-y-3" aria-label="Goals">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-heading font-bold text-base">Goals</h3>
            {goals.length > 1 && (
              <span className="flex items-center gap-2 text-xs">
                <button type="button" className="font-bold text-[#4F46E5]" onClick={() => setPicked(chosen.length === goals.length ? [] : goals.map((g) => g.id))} data-testid="select-all">{chosen.length === goals.length ? 'Clear' : 'Select all'}</button>
                <button type="button" disabled={chosen.length === 0} className={`${BTN} !py-1.5`} data-testid="bulk-approve" onClick={() => { if (window.confirm(`Approve ${chosen.length} goal${chosen.length === 1 ? '' : 's'}? You are signing off on each one.`)) { app.approveGoals(chosen); setPicked([]); } }}>Approve selected ({chosen.length})</button>
              </span>
            )}
          </div>
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
          {goals.map((g) => (
            <article key={g.id} className={`${CARD} space-y-2.5`} data-testid="goal-review" data-status={g.approvalStatus}>
              <div className="flex items-start gap-2">
                {goals.length > 1 && <input type="checkbox" aria-label={`Select ${g.name}`} checked={picked.includes(g.id)} onChange={() => toggle(g.id)} className="mt-1 w-4 h-4 accent-[#4F46E5]" />}
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-[#4F46E5]">{childName(g.childId)} · {disc(g.discipline)}</p>
                  <h4 className="font-heading font-bold text-sm" dir="auto">{g.name}</h4>
                  <p className="text-xs text-[#6B6785]" dir="auto">{g.domain}</p>
                </div>
                <span className="flex flex-col items-end gap-1 shrink-0"><Pill tone="amber">Submitted</Pill><AgeBadge iso={g.submittedAt} /></span>
              </div>
              {g.operationalDefinition?.trim() && g.operationalDefinition.trim() !== g.name.trim() && <p className="text-xs text-[#16302C] dark:text-gray-300" dir="auto">{g.operationalDefinition}</p>}
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs rounded-xl bg-[#FAF6F0] dark:bg-[#252044] p-3">
                <div><dt className="text-[#6B6785]">Therapist</dt><dd className="font-semibold">{g.therapistName ?? '—'}</dd></div>
                <div><dt className="text-[#6B6785]">Baseline</dt><dd className="font-semibold">{g.baseline != null ? `${g.baseline}%` : 'not recorded'}</dd></div>
                <div><dt className="text-[#6B6785]">Mastery criterion</dt><dd className="font-semibold">{g.masteryCriterion}</dd></div>
                <div><dt className="text-[#6B6785]">Target date</dt><dd className="font-semibold">{g.targetDate ?? 'not set'}</dd></div>
                <div className="col-span-2"><dt className="text-[#6B6785]">Prompt level</dt><dd className="font-semibold" dir="auto">{g.promptLevel ?? 'not set'}</dd></div>
              </dl>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={BTN} onClick={() => { app.approveTarget(g.id); app.triggerConfetti(); }}>Approve</button>
                <button type="button" className={BTN_GHOST} onClick={() => setDlg({ kind: 'goalEdit', id: g.id })}>Edit then approve</button>
                <button type="button" className={BTN_GHOST} onClick={() => setDlg({ kind: 'goalBack', id: g.id })}>Return with comment</button>
                <button type="button" className={BTN_DANGER} onClick={() => setDlg({ kind: 'goalReject', id: g.id })}>Reject</button>
              </div>
            </article>
          ))}
          </div>
          {returned.length > 0 && (
            <div className="space-y-2" data-testid="returned-goals">
              <p className="text-xs font-bold text-[#6B6785] pt-1">Returned or rejected, waiting for the therapist · {returned.length}</p>
              <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
              {returned.map((g) => (
                <div key={g.id} className={`${CARD} !p-3 space-y-1`} data-testid="returned-goal">
                  <div className="flex items-start justify-between gap-2"><b className="text-sm" dir="auto">{g.name}</b><Pill tone={g.approvalStatus === 'rejected' ? 'red' : 'amber'}>{g.approvalStatus === 'rejected' ? 'Rejected' : 'Returned'}</Pill></div>
                  <p className="text-xs text-[#6B6785]">{childName(g.childId)} · {g.therapistName ?? ''}</p>
                  {g.reviewNote && <p className="text-xs rounded-lg bg-rose-50 text-rose-800 px-2.5 py-1.5" dir="auto">{g.reviewNote}</p>}
                  <p className="text-[11px]">{g.reviewAckAt ? <span className="text-emerald-700 font-semibold">✓ Therapist acknowledged</span> : <span className="text-amber-700 font-semibold">Not acknowledged yet</span>}</p>
                </div>
              ))}
              </div>
            </div>
          )}
        </section>
      )}

      {filter !== 'goals' && sessions.length > 0 && (
        <section className="space-y-3" aria-label="Sessions">
          <h3 className="font-heading font-bold text-base">Sessions</h3>
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
          {shownSessions.map((s) => {
            const c = trialCounts(s);
            const main = primaryPercent(s.summary);
            const soap = isSoapNote(s);
            return (
              <article key={s.id} className={`${CARD} space-y-2 flex flex-col justify-between`} data-testid="session-review">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#4F46E5]">{childName(s.childId)} · {disc(s.role)} · {soap ? 'SOAP note' : 'Datasheet'}</p>
                      <h4 className="font-heading font-bold text-sm" dir="auto">{s.targetName}</h4>
                      <p className="text-xs text-[#6B6785]">{s.therapistName} · {shortDate(s.savedAt)}</p>
                    </div>
                    <span className="flex flex-col items-end gap-1 shrink-0">{main !== null && <Pill tone="green">{main}%</Pill>}<AgeBadge iso={s.savedAt} /></span>
                  </div>
                  {!soap && (c.independent + c.prompted + c.incorrect > 0) && (
                    <p className="text-xs flex gap-3" data-testid="trial-counts"><span><b>{c.independent}</b> independent</span><span><b>{c.prompted}</b> prompted</span><span><b>{c.incorrect}</b> incorrect</span></p>
                  )}
                  {(s.comments?.length ?? 0) > 0 && <p className="text-[11px] text-indigo-700">{s.comments!.length} comment(s) sent</p>}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="button" className={BTN_GHOST} onClick={() => setDlg({ kind: 'sessionOpen', id: s.id })}>Open</button>
                  <button type="button" className={BTN} onClick={() => app.reviewSession(s.id, 'signed')}>Sign off</button>
                  <button type="button" className={BTN_GHOST} onClick={() => setDlg({ kind: 'sessionBack', id: s.id })}>Request correction</button>
                  <button type="button" className={BTN_DANGER} onClick={() => setDlg({ kind: 'sessionRetrain', id: s.id })}>Flag for re-training</button>
                </div>
              </article>
            );
          })}
          </div>
          {sessions.length > 6 && <button type="button" onClick={() => setShowAll((v) => !v)} className={`${BTN_GHOST} w-full`}>{showAll ? 'Show fewer' : `Show all (${sessions.length})`}</button>}
        </section>
      )}

      {goals.length + returned.length + sessions.length === 0 && (
        <div className={`${CARD} flex items-center gap-3`}><CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" /><p className="text-sm">{waitingGoals.length + waitingSessions.length ? 'Nothing matches these filters.' : 'Nothing is waiting for you. New goals and sessions from the therapists will appear here.'}</p></div>
      )}

      <section className="space-y-3 pt-1" aria-label="Children">
        <h3 className="font-heading font-bold text-base">Children</h3>
        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
        {overviews.map((o) => {
          const st = STATUS[o.status];
          const first = o.goals[0];
          return (
            <div key={o.child.id} className={`p-4 rounded-2xl bg-white dark:bg-[#1F1B3A] shadow-card flex items-center justify-between gap-3 ${st.border}`} data-testid="child-status" data-status={o.status}>
              <div className="min-w-0"><h4 className="font-heading font-bold text-sm">{o.child.name}</h4><p className="text-xs text-[#6B6785] truncate" dir="auto">{first ? `${disc(first.discipline)} · ${first.name}` : 'No goals yet'}</p></div>
              <Pill tone={st.tone}>{st.label}</Pill>
            </div>
          );
        })}
        </div>
      </section>

      {dlg?.kind === 'goalBack' && dGoal && <NoteDialog title="Return goal with comment" prompt="What should the therapist change?" confirm="Return" onClose={() => setDlg(null)} onConfirm={(v) => { app.requestGoalChanges(dGoal.id, v); setDlg(null); }} />}
      {dlg?.kind === 'goalReject' && dGoal && <NoteDialog title="Reject goal" prompt="Why is this goal rejected?" confirm="Reject goal" onClose={() => setDlg(null)} onConfirm={(v) => { app.rejectGoal(dGoal.id, v); setDlg(null); }} />}
      {dlg?.kind === 'goalEdit' && dGoal && <EditApprove goal={dGoal} onClose={() => setDlg(null)} />}
      {dlg?.kind === 'sessionBack' && dSess && <NoteDialog title="Request correction" prompt="What should the therapist correct?" confirm="Send back" onClose={() => setDlg(null)} onConfirm={(v) => { app.reviewSession(dSess.id, 'changes', v); setDlg(null); }} />}
      {dlg?.kind === 'sessionRetrain' && dSess && <NoteDialog title="Flag for re-training" prompt="What does the therapist need to practise?" confirm="Flag" onClose={() => setDlg(null)} onConfirm={(v) => { app.reviewSession(dSess.id, 'retrain', v); setDlg(null); }} />}
      {dlg?.kind === 'sessionOpen' && dSess && <SessionSheet session={dSess} childName={childName(dSess.childId)} onClose={() => setDlg(null)} onDecide={(d) => setDlg(d)} />}
    </div>
  );
};

/** Edit the criterion, date and prompt level, then approve, in one step. */
const EditApprove: React.FC<{ goal: Target; onClose: () => void }> = ({ goal, onClose }) => {
  const app = useApp();
  const [criterion, setCriterion] = useState(goal.masteryCriterion);
  const [date, setDate] = useState(goal.targetDate ?? '');
  const [prompt, setPrompt] = useState(goal.promptLevel ?? '');
  const [tried, setTried] = useState(false);
  const m = parseMastery(criterion, 0);
  const err = !/(\d{1,3})\s*%/.test(criterion) || m.threshold < 1 || m.threshold > 100 ? 'Include a percentage from 1 to 100, e.g. 80% across 3 sessions.' : '';
  return (
    <Sheet title="Edit then approve" onClose={onClose}>
      <form noValidate className="space-y-3" onSubmit={(e) => {
        e.preventDefault(); setTried(true); if (err) return;
        // Record the edits first (with the reason), then approve the revised goal.
        const edited = app.editGoal(goal.id, { masteryCriterion: criterion, targetDate: date, promptLevel: prompt }, 'Edited while approving');
        void edited;
        app.approveTarget(goal.id);
        onClose();
      }}>
        <p className="text-xs text-[#6B6785]" dir="auto">{goal.name}</p>
        <Field label="Mastery criterion"><input aria-label="Mastery criterion" value={criterion} onChange={(e) => setCriterion(e.target.value)} className={INPUT} dir="auto" /></Field>
        <Field label="Target date"><input aria-label="Target date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={INPUT} /></Field>
        <Field label="Prompt hierarchy"><input aria-label="Prompt hierarchy" value={prompt} onChange={(e) => setPrompt(e.target.value)} className={INPUT} dir="auto" placeholder="Full physical → gestural → independent" /></Field>
        {tried && err && <p role="alert" className="text-xs text-rose-700">{err}</p>}
        <div className="grid grid-cols-2 gap-3"><button type="button" onClick={onClose} className={BTN_GHOST}>Cancel</button><button type="submit" className={BTN}>Save and approve</button></div>
      </form>
    </Sheet>
  );
};

/** One session in full: the note, the numbers, earlier comments, and a way to comment on a single line. */
const SessionSheet: React.FC<{ session: SavedSession; childName: string; onClose: () => void; onDecide: (d: Dlg) => void }> = ({ session: s, childName, onClose, onDecide }) => {
  const app = useApp();
  const [comment, setComment] = useState('');
  const c = trialCounts(s);
  const main = primaryPercent(s.summary);
  const lines = (s.notes ?? '').replace('[SOAP NOTE]', '').split('\n').map((l) => l.trim()).filter(Boolean);
  const live = app.savedSessions.find((x) => x.id === s.id) ?? s;
  return (
    <Sheet title={s.targetName} onClose={onClose}>
      <p className="text-xs text-[#6B6785]">{childName} · {DISCIPLINE_LABEL[s.role]?.en ?? s.role} · {s.therapistName} · {new Date(s.savedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
      <div className="grid grid-cols-4 gap-2 text-center text-xs" data-testid="session-figures">
        {[['Accuracy', main !== null ? `${main}%` : '—'], ['Independent', c.independent], ['Prompted', c.prompted], ['Incorrect', c.incorrect]].map(([l, v]) => <div key={String(l)} className="rounded-xl bg-[#FAF6F0] dark:bg-[#252044] py-2"><b className="block text-sm tabular-nums">{v}</b><span className="text-[10px] text-[#6B6785]">{l}</span></div>)}
      </div>
      <p className="text-xs text-[#6B6785]">Integrity {s.summary.integrityPercent ?? '—'}{s.summary.integrityPercent != null ? '%' : ''} · IOA {s.summary.ioaPercent ?? '—'}{s.summary.ioaPercent != null ? '%' : ''}</p>
      {lines.length === 0 && <p className="text-xs text-[#6B6785]">The therapist wrote no note.</p>}
      <div className="space-y-1.5" data-testid="note-lines">
        {lines.map((l, i) => (
          <div key={i} className="flex items-start gap-2 rounded-xl bg-[#FAF6F0] dark:bg-[#252044] px-3 py-2">
            <p className="text-xs flex-1" dir="auto">{l}</p>
            <button type="button" className="text-[11px] font-bold text-[#4F46E5] shrink-0" onClick={() => setComment(`On “${l.length > 60 ? `${l.slice(0, 60)}…` : l}”: `)}>Comment</button>
          </div>
        ))}
      </div>
      {(live.comments?.length ?? 0) > 0 && (
        <div className="space-y-1" data-testid="session-comments">
          <p className="text-xs font-bold">Comments</p>
          {live.comments!.map((cm, i) => <p key={i} className="text-xs rounded-lg bg-indigo-50 text-indigo-900 px-2.5 py-1.5" dir="auto"><b>{cm.by}:</b> {cm.text}</p>)}
          <p className="text-[11px]">{live.commentsAckAt ? <span className="text-emerald-700 font-semibold">✓ Therapist acknowledged</span> : <span className="text-amber-700 font-semibold">Not acknowledged yet</span>}</p>
        </div>
      )}
      <form noValidate className="space-y-2" onSubmit={(e) => { e.preventDefault(); if (comment.trim()) { app.commentOnSession(s.id, comment); setComment(''); } }}>
        <textarea aria-label="Add a comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Add a comment the therapist must acknowledge" className={INPUT} dir="auto" />
        <button type="submit" disabled={!comment.trim()} className={BTN_GHOST}>Send comment</button>
      </form>
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button type="button" className={BTN} onClick={() => { app.reviewSession(s.id, 'signed'); onClose(); }}>Sign off</button>
        <button type="button" className={BTN_GHOST} onClick={() => onDecide({ kind: 'sessionBack', id: s.id })}>Correction</button>
        <button type="button" className={BTN_DANGER} onClick={() => onDecide({ kind: 'sessionRetrain', id: s.id })}>Re-train</button>
      </div>
    </Sheet>
  );
};
