import React from 'react';
import { MessageSquareWarning } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const THERAPY_ROLES = ['behavior', 'speech', 'ot', 'remedial', 'teacher'];
const TYPE = { live: 'Live observation', video: 'Video review', meeting: 'Meeting', training: 'Training' } as const;

/** Everything the supervisor has said to this therapist that they have not acknowledged yet. */
export function useSupervisorFeedback() {
  const app = useApp();
  const { role, currentUserName: me, targets, savedSessions, fidelityObservations } = app;
  const mine = !!role && THERAPY_ROLES.includes(role);
  const goals = !mine ? [] : targets.filter((t) => t.therapistName === me && (t.approvalStatus === 'needs_review' || t.approvalStatus === 'rejected') && !t.reviewAckAt);
  const sessions = !mine ? [] : savedSessions.filter((s) => s.therapistName === me && ((s.review && s.review.status !== 'signed' && !s.review.ackAt) || ((s.comments?.length ?? 0) > 0 && !s.commentsAckAt)));
  const obs = !mine ? [] : fidelityObservations.filter((o) => o.therapistName === me && (o.feedback || o.actionItems) && !o.ackAt);
  return { goals, sessions, obs, total: goals.length + sessions.length + obs.length };
}

/** What the supervisor said about this therapist's work, with an Acknowledge button for each item. It lives in the session plan. */
export const SupervisorFeedbackCard: React.FC = () => {
  const app = useApp();
  const { goals, sessions, obs, total } = useSupervisorFeedback();
  if (total === 0) return null;
  const btn = 'px-3 py-1.5 rounded-lg bg-[#4F46E5] text-white text-xs font-bold active:scale-95';

  return (
    <section className="max-w-md md:max-w-6xl mx-auto px-4 md:px-8 pt-3 md:pt-6" data-testid="supervisor-feedback" aria-label="Supervisor feedback">
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-3">
        <p className="text-sm font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2"><MessageSquareWarning className="w-4 h-4" /> Supervisor feedback · {total}</p>
        {goals.map((g) => (
          <div key={g.id} className="rounded-xl bg-white dark:bg-[#1F1B3A] p-3 space-y-1" data-testid="feedback-goal">
            <p className="text-xs font-bold" dir="auto">{g.approvalStatus === 'rejected' ? 'Goal rejected' : 'Goal returned'}: {g.name}</p>
            {g.reviewNote && <p className="text-xs text-[#6B6785]" dir="auto">{g.reviewNote}</p>}
            <button type="button" className={btn} onClick={() => app.acknowledgeGoalFeedback(g.id)}>Acknowledge</button>
          </div>
        ))}
        {sessions.map((s) => (
          <div key={s.id} className="rounded-xl bg-white dark:bg-[#1F1B3A] p-3 space-y-1" data-testid="feedback-session">
            <p className="text-xs font-bold" dir="auto">{s.review?.status === 'retrain' ? 'Flagged for re-training' : s.review?.status === 'changes' ? 'Correction requested' : 'Comment'}: {s.targetName}</p>
            {s.review?.note && <p className="text-xs text-[#6B6785]" dir="auto">{s.review.note}</p>}
            {s.comments?.map((c, i) => <p key={i} className="text-xs text-[#6B6785]" dir="auto">{c.by}: {c.text}</p>)}
            <button type="button" className={btn} onClick={() => app.acknowledgeSessionFeedback(s.id)}>Acknowledge</button>
          </div>
        ))}
        {obs.map((o) => (
          <div key={o.id} className="rounded-xl bg-white dark:bg-[#1F1B3A] p-3 space-y-1" data-testid="feedback-observation">
            <p className="text-xs font-bold">{TYPE[o.type]} · {o.date}{o.fidelity !== null ? ` · integrity ${o.fidelity}%` : ''}{o.ioa ? ` · IOA ${o.ioa.percent}%` : ''}</p>
            {o.feedback && <p className="text-xs text-[#6B6785]" dir="auto">{o.feedback}</p>}
            {o.actionItems && <p className="text-xs" dir="auto"><b>Action:</b> {o.actionItems}</p>}
            {o.recheckDate && <p className="text-[11px] text-indigo-700">Re-check {o.recheckDate}</p>}
            <button type="button" className={btn} onClick={() => app.acknowledgeFidelityObservation(o.id)}>Acknowledge</button>
          </div>
        ))}
      </div>
    </section>
  );
};
