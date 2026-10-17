import type { ABCRecord, BipPlan, Child, FidelityScore, HomeTask, Observation, SavedReport, SavedSession, Target } from '../types';
import { DAY, DISCIPLINE_LABEL, goalScores, isSoapNote } from './org';
import { primaryPercent } from './primaryPercent';

/* ------------------------------------------------------------------ */
/* Thresholds the administrator controls (Settings → Clinical policy)  */
/* ------------------------------------------------------------------ */

export interface Thresholds {
  /** Treatment integrity below this is flagged. */
  integrityMin: number;
  /** Inter-observer agreement below this is flagged. */
  ioaMin: number;
  /** A therapist with no supervisor observation for this many days is flagged. */
  observationDays: number;
  /** A goal with no session for this many days counts as stalled. */
  stalledDays: number;
}
export const DEFAULT_THRESHOLDS: Thresholds = { integrityMin: 80, ioaMin: 80, observationDays: 30, stalledDays: 14 };

export const ageDays = (iso: string | undefined | null, now = Date.now()): number | null => {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : Math.max(0, Math.floor((now - t) / DAY));
};
export const ageLabel = (iso: string | undefined | null, now = Date.now()): string => {
  const d = ageDays(iso, now);
  return d === null ? '' : d === 0 ? 'today' : d === 1 ? 'waiting 1 day' : `waiting ${d} days`;
};

const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

/* ------------------------------------------------------------------ */
/* Goal health: On track, At risk, Stalled, Mastered, Regressed        */
/* ------------------------------------------------------------------ */

export type GoalHealth = 'new' | 'on_track' | 'at_risk' | 'stalled' | 'mastered' | 'regressed';

export interface GoalHealthResult {
  health: GoalHealth;
  reason: string;
  scores: number[];
  /** Real saved sessions behind the score (0 means the figure is the goal's baseline or last recorded value). */
  sessionCount: number;
  lastAt: string | null;
}

/**
 * The rules, in the order they are checked:
 *  - Mastered goal: stays Mastered while the latest score is at or above the criterion, becomes Regressed below it.
 *  - No scores at all: New.
 *  - No session for `stalledDays` days, or three flat scores (within 3 points) below criterion: Stalled.
 *  - Latest score 20 or more points under criterion, or three falling scores below criterion: At risk.
 *  - Otherwise: On track.
 */
export function goalHealth(goal: Target, sessions: SavedSession[], th: Thresholds = DEFAULT_THRESHOLDS, now = Date.now()): GoalHealthResult {
  const own = sessions.filter((s) => s.targetId === goal.id && !isSoapNote(s));
  const scores = goalScores(goal, sessions);
  const lastAt = own.map((s) => s.savedAt).sort().pop() ?? null;
  const base = { scores, sessionCount: own.length, lastAt };
  const last = scores.length ? scores[scores.length - 1] : goal.currentPerformance;
  const threshold = goal.criterionThreshold;

  if (goal.status === 'mastered') {
    return last < threshold
      ? { ...base, health: 'regressed', reason: `Mastered goal fell to ${last}%, below the ${threshold}% criterion.` }
      : { ...base, health: 'mastered', reason: `Holding at ${last}% (criterion ${threshold}%).` };
  }
  if (scores.length === 0) return { ...base, health: 'new', reason: 'No data yet.' };

  const idle = ageDays(lastAt, now);
  if (own.length > 0 && idle !== null && idle > th.stalledDays) return { ...base, health: 'stalled', reason: `No session for ${idle} days.` };
  const last3 = scores.slice(-3);
  if (last3.length === 3 && Math.max(...last3) - Math.min(...last3) <= 3 && last < threshold) return { ...base, health: 'stalled', reason: `Flat at about ${last}% for three sessions.` };
  if (last < threshold - 20) return { ...base, health: 'at_risk', reason: `${last}% is more than 20 points under the ${threshold}% criterion.` };
  if (last3.length === 3 && last3[0] > last3[1] && last3[1] > last3[2] && last < threshold) return { ...base, health: 'at_risk', reason: `Scores falling: ${last3.join('% → ')}%.` };
  return { ...base, health: 'on_track', reason: `${last}% against a ${threshold}% criterion.` };
}

export const HEALTH_LABEL: Record<GoalHealth, string> = { new: 'New', on_track: 'On track', at_risk: 'At risk', stalled: 'Stalled', mastered: 'Mastered', regressed: 'Regressed' };

/* ------------------------------------------------------------------ */
/* Fidelity and inter-observer agreement                               */
/* ------------------------------------------------------------------ */

/** Treatment integrity: correct steps ÷ scored steps (N/A steps are left out). Null when nothing was scored. */
export function fidelityPercent(steps: { score: FidelityScore }[]): number | null {
  const scored = steps.filter((s) => s.score !== 'na');
  if (scored.length === 0) return null;
  return Math.round((scored.filter((s) => s.score === 'correct').length / scored.length) * 100);
}

/** Trial-by-trial IOA: agreements ÷ total trials × 100. Null when the numbers cannot be right. */
export function ioaTrialByTrial(agreements: number, trials: number): number | null {
  if (!Number.isFinite(agreements) || !Number.isFinite(trials) || trials <= 0 || agreements < 0 || agreements > trials) return null;
  return Math.round((agreements / trials) * 100);
}

/** Total-count IOA: smaller count ÷ larger count × 100. Two zero counts agree completely. */
export function ioaTotalCount(a: number, b: number): number | null {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a < 0 || b < 0) return null;
  if (a === 0 && b === 0) return 100;
  return Math.round((Math.min(a, b) / Math.max(a, b)) * 100);
}

/** Supervision minutes for one month (yyyy-mm), optionally for one therapist. */
export const supervisionMinutes = (obs: Observation[], month: string, therapist?: string): number =>
  obs.filter((o) => o.date.startsWith(month) && (!therapist || o.therapistName === therapist)).reduce((a, o) => a + (o.durationMin || 0), 0);

/* ------------------------------------------------------------------ */
/* Per-therapist cards and alerts                                      */
/* ------------------------------------------------------------------ */

export interface RosterMember { name: string; role: string }

export interface TherapistCard {
  name: string;
  roles: string[];
  sessions: number;
  caseload: number;
  notesPending: number;
  oldestPendingDays: number | null;
  integrity: number | null;
  integritySource: 'observed' | 'self' | null;
  ioa: number | null;
  ioaSource: 'observed' | 'self' | null;
  lastObserved: string | null;
  observations: number;
  minutesThisMonth: number;
  openFeedback: number;
}

export function therapistCards(input: { roster: RosterMember[]; assigned: Record<string, string[]>; sessions: SavedSession[]; observations: Observation[]; now?: number }): TherapistCard[] {
  const now = input.now ?? Date.now();
  const ym = new Date(now).toISOString().slice(0, 7);
  const datasheets = input.sessions.filter((s) => !isSoapNote(s));
  const names = new Map<string, Set<string>>();
  for (const m of input.roster) (names.get(m.name) ?? names.set(m.name, new Set()).get(m.name)!).add(m.role);
  for (const s of input.sessions) (names.get(s.therapistName) ?? names.set(s.therapistName, new Set()).get(s.therapistName)!).add(s.role);
  return [...names.entries()]
    .map(([name, roles]) => {
      const mine = datasheets.filter((s) => s.therapistName === name);
      const obs = input.observations.filter((o) => o.therapistName === name);
      const obsFid = obs.map((o) => o.fidelity).filter((x): x is number => x !== null);
      const obsIoa = obs.map((o) => o.ioa?.percent).filter((x): x is number => x != null);
      const selfFid = mine.map((s) => s.summary.integrityPercent).filter((x): x is number => x != null);
      const selfIoa = mine.map((s) => s.summary.ioaPercent).filter((x): x is number => x != null);
      const pending = input.sessions.filter((s) => s.therapistName === name && !s.review);
      const ages = pending.map((s) => ageDays(s.savedAt, now)).filter((x): x is number => x !== null);
      const children = new Set([...(input.assigned[name] ?? []), ...mine.map((s) => s.childId)]);
      return {
        name,
        roles: [...roles],
        sessions: mine.length,
        caseload: children.size,
        notesPending: pending.length,
        oldestPendingDays: ages.length ? Math.max(...ages) : null,
        integrity: obsFid.length ? mean(obsFid) : mean(selfFid),
        integritySource: obsFid.length ? ('observed' as const) : selfFid.length ? ('self' as const) : null,
        ioa: obsIoa.length ? mean(obsIoa) : mean(selfIoa),
        ioaSource: obsIoa.length ? ('observed' as const) : selfIoa.length ? ('self' as const) : null,
        lastObserved: obs.map((o) => o.date).sort().pop() ?? null,
        observations: obs.length,
        minutesThisMonth: supervisionMinutes(input.observations, ym, name),
        openFeedback: obs.filter((o) => (o.feedback || o.actionItems) && !o.ackAt).length,
      };
    })
    .sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name));
}

export interface SupervisionAlert { therapist: string; kind: 'integrity' | 'ioa' | 'no_observation' | 'overdue_review' | 'recheck'; text: string }

export function supervisionAlerts(cards: TherapistCard[], observations: Observation[], th: Thresholds = DEFAULT_THRESHOLDS, now = Date.now()): SupervisionAlert[] {
  const out: SupervisionAlert[] = [];
  const today = new Date(now).toISOString().slice(0, 10);
  for (const c of cards) {
    if (c.integrity !== null && c.integrity < th.integrityMin) out.push({ therapist: c.name, kind: 'integrity', text: `Treatment integrity ${c.integrity}% is below ${th.integrityMin}%.` });
    if (c.ioa !== null && c.ioa < th.ioaMin) out.push({ therapist: c.name, kind: 'ioa', text: `IOA ${c.ioa}% is below ${th.ioaMin}%.` });
    const active = c.sessions > 0 || c.caseload > 0;
    if (active) {
      const since = ageDays(c.lastObserved ? `${c.lastObserved}T00:00:00` : null, now);
      if (since === null) out.push({ therapist: c.name, kind: 'no_observation', text: 'Never observed.' });
      else if (since > th.observationDays) out.push({ therapist: c.name, kind: 'no_observation', text: `No observation for ${since} days (limit ${th.observationDays}).` });
    }
    if (c.oldestPendingDays !== null && c.oldestPendingDays > 7) out.push({ therapist: c.name, kind: 'overdue_review', text: `${c.notesPending} note(s) waiting for review, the oldest ${c.oldestPendingDays} days.` });
  }
  for (const o of observations) if (o.recheckDate && o.recheckDate <= today) {
    const later = observations.some((x) => x.therapistName === o.therapistName && x.date > o.date);
    if (!later) out.push({ therapist: o.therapistName, kind: 'recheck', text: `Re-check was due ${o.recheckDate}.` });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Reports                                                             */
/* ------------------------------------------------------------------ */

export interface ReportFilters { discipline?: string; therapist?: string; childId?: string }

export interface ReportInput {
  children: Child[];
  targets: Target[];
  sessions: SavedSession[];
  observations: Observation[];
  homeTasks: HomeTask[];
  bips: BipPlan[];
  abc: ABCRecord[];
  from: string; // yyyy-mm-dd
  to: string;
  filters?: ReportFilters;
  th?: Thresholds;
}

export interface ChildReportRow {
  childId: string;
  name: string;
  goals: number;
  started: number;
  mastered: number;
  stalled: number;
  sessions: number;
  avgAccuracy: number | null;
  prompt: { independent: number; prompted: number; incorrect: number };
  /** Average accuracy minus the previous period's, in points. Null when either period has no data. */
  trend: number | null;
}
export interface TherapistReportRow {
  name: string;
  sessions: number;
  integrity: number | null;
  ioa: number | null;
  noteCompletion: number | null;
  turnaroundDays: number | null;
}
export interface ReportStats {
  from: string;
  to: string;
  children: ChildReportRow[];
  therapists: TherapistReportRow[];
  disciplines: { role: string; sessions: number; goals: number }[];
  totals: { goals: number; mastered: number; sessions: number; avgPerformance: number | null; integrity: number | null; ioa: number | null };
  homePractice: { assigned: number; completed: number; percent: number | null; withParentNote: number };
  behavior: { events: number; perWeek: { week: string; count: number }[]; plans: { active: number; draft: number } };
}

const inRange = (iso: string, from: string, to: string) => {
  const d = iso.slice(0, 10);
  return d >= from && d <= to;
};
const shiftDays = (ymd: string, days: number) => new Date(Date.parse(`${ymd}T00:00:00Z`) + days * DAY).toISOString().slice(0, 10);
export const periodDays = (from: string, to: string) => Math.max(1, Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY) + 1);
const mondayOf = (ymd: string) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7;
  return new Date(d.getTime() - dow * DAY).toISOString().slice(0, 10);
};

export function reportStats(input: ReportInput, now = Date.now()): ReportStats {
  const th = input.th ?? DEFAULT_THRESHOLDS;
  const f = input.filters ?? {};
  const kids = input.children.filter((c) => !f.childId || c.id === f.childId);
  const kidIds = new Set(kids.map((c) => c.id));
  const goals = input.targets.filter((t) => kidIds.has(t.childId) && (!f.discipline || t.discipline === f.discipline));
  const goalIds = new Set(goals.map((g) => g.id));
  const allSessions = input.sessions.filter((s) => kidIds.has(s.childId) && (!f.discipline || s.role === f.discipline) && (!f.therapist || s.therapistName === f.therapist));
  const datasheets = allSessions.filter((s) => !isSoapNote(s));
  const current = datasheets.filter((s) => inRange(s.savedAt, input.from, input.to));
  const len = periodDays(input.from, input.to);
  const prevFrom = shiftDays(input.from, -len);
  const prevTo = shiftDays(input.from, -1);
  const previous = datasheets.filter((s) => inRange(s.savedAt, prevFrom, prevTo));
  const accuracy = (ss: SavedSession[]) => mean(ss.map((s) => primaryPercent(s.summary)).filter((x): x is number => x !== null));

  const childRows: ChildReportRow[] = kids.map((c) => {
    const cg = goals.filter((g) => g.childId === c.id);
    const cs = current.filter((s) => s.childId === c.id);
    const trials = cs.flatMap((s) => s.data.trials ?? []);
    const drill = cs.map((s) => s.data.drill).filter((x): x is NonNullable<typeof x> => !!x);
    const prompt = {
      independent: trials.filter((t) => t === '+').length + drill.reduce((a, d) => a + d.independent, 0),
      prompted: trials.filter((t) => t === 'P').length + drill.reduce((a, d) => a + d.prompted, 0),
      incorrect: trials.filter((t) => t === '-').length + drill.reduce((a, d) => a + d.incorrect, 0),
    };
    const now2 = accuracy(cs);
    const before = accuracy(previous.filter((s) => s.childId === c.id));
    const health = cg.map((g) => goalHealth(g, input.sessions, th, now).health);
    return {
      childId: c.id,
      name: c.name,
      goals: cg.length,
      started: cg.filter((g) => cs.some((s) => s.targetId === g.id)).length,
      mastered: cg.filter((g) => g.status === 'mastered').length,
      stalled: health.filter((h) => h === 'stalled' || h === 'at_risk' || h === 'regressed').length,
      sessions: cs.length,
      avgAccuracy: now2,
      prompt,
      trend: now2 !== null && before !== null ? now2 - before : null,
    };
  });

  const names = Array.from(new Set(current.map((s) => s.therapistName)));
  const obsIn = input.observations.filter((o) => inRange(o.date, input.from, input.to) && kidIds.has(o.childId) && (!f.therapist || o.therapistName === f.therapist));
  const therapistRows: TherapistReportRow[] = names.map((name) => {
    const ss = current.filter((s) => s.therapistName === name);
    const obs = obsIn.filter((o) => o.therapistName === name);
    const fid = obs.map((o) => o.fidelity).filter((x): x is number => x !== null);
    const ioa = obs.map((o) => o.ioa?.percent).filter((x): x is number => x != null);
    const turn = ss.filter((s) => s.review).map((s) => (Date.parse(s.review!.at) - Date.parse(s.savedAt)) / DAY).filter((x) => x >= 0);
    return {
      name,
      sessions: ss.length,
      integrity: fid.length ? mean(fid) : mean(ss.map((s) => s.summary.integrityPercent).filter((x): x is number => x != null)),
      ioa: ioa.length ? mean(ioa) : mean(ss.map((s) => s.summary.ioaPercent).filter((x): x is number => x != null)),
      noteCompletion: ss.length ? Math.round((ss.filter((s) => (s.notes ?? '').trim().length > 0).length / ss.length) * 100) : null,
      turnaroundDays: turn.length ? Math.round((turn.reduce((a, b) => a + b, 0) / turn.length) * 10) / 10 : null,
    };
  });

  const roles = Array.from(new Set([...goals.map((g) => g.discipline as string), ...current.map((s) => s.role as string)]));
  const tasks = input.homeTasks.filter((h) => kidIds.has(h.childId));
  const events = input.abc.filter((a) => kidIds.has(a.childId) && inRange(a.at, input.from, input.to));
  const weeks = new Map<string, number>();
  for (const e of events) weeks.set(mondayOf(e.at.slice(0, 10)), (weeks.get(mondayOf(e.at.slice(0, 10))) ?? 0) + 1);
  const allFid = therapistRows.map((t) => t.integrity).filter((x): x is number => x !== null);
  const allIoa = therapistRows.map((t) => t.ioa).filter((x): x is number => x !== null);
  const perfGoals = goals.filter((g) => g.approvalStatus === 'approved');

  return {
    from: input.from,
    to: input.to,
    children: childRows,
    therapists: therapistRows.sort((a, b) => b.sessions - a.sessions),
    disciplines: roles.map((role) => ({ role, sessions: current.filter((s) => s.role === role).length, goals: goals.filter((g) => g.discipline === role).length })).sort((a, b) => b.sessions - a.sessions),
    totals: {
      goals: goals.length,
      mastered: goals.filter((g) => g.status === 'mastered').length,
      sessions: current.length,
      avgPerformance: mean(perfGoals.map((g) => g.currentPerformance)),
      integrity: mean(allFid),
      ioa: mean(allIoa),
    },
    homePractice: { assigned: tasks.length, completed: tasks.filter((t) => t.done).length, percent: tasks.length ? Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100) : null, withParentNote: tasks.filter((t) => (t.parentNote ?? '').trim()).length },
    behavior: { events: events.length, perWeek: [...weeks.entries()].sort().map(([week, count]) => ({ week, count })), plans: { active: input.bips.filter((b) => kidIds.has(b.childId) && b.status === 'active').length, draft: input.bips.filter((b) => kidIds.has(b.childId) && b.status === 'draft').length } },
  };
}

export function reportNarrative(stats: ReportStats, orgName: string, scope: string): string {
  const t = stats.totals;
  const lines = [
    `Clinical summary for ${orgName}, ${stats.from} to ${stats.to}${scope ? ` (${scope})` : ''}.`,
    '',
    `Across ${stats.children.length} ${stats.children.length === 1 ? 'child' : 'children'} there are ${t.goals} goals, ${t.mastered} of them mastered. ${t.sessions} ${t.sessions === 1 ? 'session was' : 'sessions were'} recorded in the period${t.avgPerformance !== null ? `, and approved goals average ${t.avgPerformance}%` : ''}.`,
  ];
  for (const c of stats.children) {
    if (!c.goals) continue;
    const trend = c.trend === null ? '' : c.trend === 0 ? ', unchanged from the previous period' : `, ${c.trend > 0 ? 'up' : 'down'} ${Math.abs(c.trend)} points on the previous period`;
    lines.push(`• ${c.name}: ${c.sessions} session(s)${c.avgAccuracy !== null ? `, average accuracy ${c.avgAccuracy}%${trend}` : ''}. ${c.mastered} mastered${c.stalled ? `; ${c.stalled} need attention` : ''}.`);
  }
  if (stats.therapists.length) {
    lines.push('', 'Staff: ' + stats.therapists.map((x) => `${x.name} ${x.sessions} session(s)${x.integrity !== null ? `, integrity ${x.integrity}%` : ''}${x.ioa !== null ? `, IOA ${x.ioa}%` : ''}`).join('; ') + '.');
  }
  if (stats.homePractice.assigned) lines.push('', `Home practice: ${stats.homePractice.completed} of ${stats.homePractice.assigned} sheets completed (${stats.homePractice.percent}%).`);
  if (stats.behavior.events) lines.push(`Behavior: ${stats.behavior.events} recorded event(s) in the period.`);
  lines.push('', 'Recommendations: (supervisor to complete before signing).');
  return lines.join('\n');
}

export const snapshotOf = (s: ReportStats): SavedReport['snapshot'] => ({ goals: s.totals.goals, sessions: s.totals.sessions, avgPerformance: s.totals.avgPerformance, integrity: s.totals.integrity, ioa: s.totals.ioa, mastered: s.totals.mastered });

export const disciplineName = (role: string) => DISCIPLINE_LABEL[role]?.en ?? role;

/** First and last day (yyyy-mm-dd) of a month given as yyyy-mm. */
export const monthRange = (ym: string): { from: string; to: string } => {
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${ym}-01`, to: `${ym}-${String(last).padStart(2, '0')}` };
};
