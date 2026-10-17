import type { Child, HomeTask, BipPlan, SavedSession, Target } from '../types';
import { decide, parseMastery } from './decisionSupport';
import { primaryPercent } from './primaryPercent';

export const DAY = 24 * 60 * 60 * 1000;

export const DISCIPLINE_LABEL: Record<string, { en: string; ar: string }> = {
  behavior: { en: 'Behavior', ar: 'السلوك' },
  speech: { en: 'Speech', ar: 'النطق' },
  ot: { en: 'OT', ar: 'العلاج الوظيفي' },
  remedial: { en: 'Remedial', ar: 'التربية الخاصة' },
  teacher: { en: 'Classroom', ar: 'الفصل' },
};

/** Goals a therapist added or changed that a supervisor has not decided on yet. */
export const pendingGoals = (targets: Target[]): Target[] => targets.filter((t) => t.approvalStatus === 'awaiting_approval');

/** Goals sent back (or rejected) and now waiting on the therapist, not on the supervisor. */
export const returnedGoals = (targets: Target[]): Target[] => targets.filter((t) => t.approvalStatus === 'needs_review' || t.approvalStatus === 'rejected');

/** Sessions nobody has signed off or sent back yet. */
export const pendingSessions = (sessions: SavedSession[]): SavedSession[] => sessions.filter((s) => !s.review);

export const isSoapNote = (s: Pick<SavedSession, 'notes'>) => (s.notes ?? '').startsWith('[SOAP NOTE]');

/** The goal's main percentage per saved session, oldest first (SOAP notes repeat the datasheet, so they are skipped). */
export const goalScores = (goal: Target, sessions: SavedSession[]): number[] => {
  const own = sessions
    .filter((s) => s.targetId === goal.id && !isSoapNote(s))
    .sort((a, b) => a.savedAt.localeCompare(b.savedAt))
    .map((s) => primaryPercent(s.summary))
    .filter((x): x is number => x !== null);
  return own.length ? own : goal.lastThreeSessions.filter((x) => x > 0);
};

export type ChildStatus = 'needs_review' | 'needs_support' | 'on_track' | 'no_data';

export interface ChildOverview {
  child: Child;
  goals: Target[];
  byDiscipline: { role: string; goals: number; avg: number }[];
  pendingGoals: number;
  pendingSessions: number;
  sessions7d: number;
  lastSessionAt: string | null;
  status: ChildStatus;
  /** Goals where the decision rules say the teaching plan should be revised. */
  strugglingGoals: Target[];
}

export function childOverview(child: Child, targets: Target[], sessions: SavedSession[], now = Date.now()): ChildOverview {
  const goals = targets.filter((t) => t.childId === child.id);
  const mine = sessions.filter((s) => s.childId === child.id);
  const roles = Array.from(new Set(goals.map((g) => g.discipline)));
  const byDiscipline = roles.map((role) => {
    const gs = goals.filter((g) => g.discipline === role);
    return { role, goals: gs.length, avg: Math.round(gs.reduce((a, g) => a + g.currentPerformance, 0) / gs.length) };
  });
  const pg = pendingGoals(goals).length;
  const ps = pendingSessions(mine).length;
  const strugglingGoals = goals.filter((g) => {
    if (g.approvalStatus !== 'approved') return false;
    const m = parseMastery(g.masteryCriterion, g.criterionThreshold);
    return decide({ status: g.status, threshold: m.threshold, sessions: m.sessions, scores: goalScores(g, mine) }).action === 'adjust';
  });
  const last = mine.map((s) => s.savedAt).sort().pop() ?? null;
  const status: ChildStatus = goals.length === 0 ? 'no_data' : pg + ps > 0 ? 'needs_review' : strugglingGoals.length > 0 ? 'needs_support' : 'on_track';
  return { child, goals, byDiscipline, pendingGoals: pg, pendingSessions: ps, sessions7d: mine.filter((s) => now - Date.parse(s.savedAt) <= 7 * DAY).length, lastSessionAt: last, status, strugglingGoals };
}

export interface StaffStat {
  name: string;
  roles: string[];
  sessions: number;
  sessions7d: number;
  children: number;
  avgIntegrity: number | null;
  avgIoa: number | null;
  lastAt: string | null;
}

const mean = (xs: number[]) => (xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : null);

/** One row per therapist, from the sessions they saved. Integrity and IOA are averages over sessions that recorded them. */
export function staffStats(sessions: SavedSession[], now = Date.now()): StaffStat[] {
  const by = new Map<string, SavedSession[]>();
  for (const s of sessions.filter((x) => !isSoapNote(x))) by.set(s.therapistName, [...(by.get(s.therapistName) ?? []), s]);
  return [...by.entries()]
    .map(([name, ss]) => ({
      name,
      roles: Array.from(new Set(ss.map((s) => s.role))),
      sessions: ss.length,
      sessions7d: ss.filter((s) => now - Date.parse(s.savedAt) <= 7 * DAY).length,
      children: new Set(ss.map((s) => s.childId)).size,
      avgIntegrity: mean(ss.map((s) => s.summary.integrityPercent).filter((x): x is number => x != null)),
      avgIoa: mean(ss.map((s) => s.summary.ioaPercent).filter((x): x is number => x != null)),
      lastAt: ss.map((s) => s.savedAt).sort().pop() ?? null,
    }))
    .sort((a, b) => b.sessions - a.sessions || a.name.localeCompare(b.name));
}

export interface OrgStats {
  children: number;
  /** Goals of the children in scope. */
  goals: number;
  /** …of which approved by a supervisor: only these count towards the average. */
  approvedGoals: number;
  mastered: number;
  avgPerformance: number | null;
  sessions: number;
  sessions7d: number;
  sessions30d: number;
  byDiscipline: { role: string; sessions: number; goals: number }[];
  homeTasks: { total: number; done: number; percent: number | null };
  plans: { total: number; active: number; draft: number };
  pendingGoals: number;
  pendingSessions: number;
}

export function orgStats(input: { children: Child[]; targets: Target[]; sessions: SavedSession[]; homeTasks: HomeTask[]; bips: BipPlan[]; now?: number }): OrgStats {
  const now = input.now ?? Date.now();
  // One definition everywhere: goals and sessions of the children in scope, nothing else.
  const kidIds = new Set(input.children.map((c) => c.id));
  const targets = input.targets.filter((t) => kidIds.has(t.childId));
  const sessions = input.sessions.filter((s) => kidIds.has(s.childId));
  const approved = targets.filter((t) => t.approvalStatus === 'approved');
  const datasheets = sessions.filter((s) => !isSoapNote(s));
  const roles = Array.from(new Set([...targets.map((t) => t.discipline), ...datasheets.map((s) => s.role as string)]));
  const tasks = input.homeTasks.filter((h) => kidIds.has(h.childId));
  const done = tasks.filter((h) => h.done).length;
  return {
    children: input.children.length,
    goals: targets.length,
    approvedGoals: approved.length,
    mastered: targets.filter((t) => t.status === 'mastered' || t.currentPerformance >= t.criterionThreshold).length,
    avgPerformance: approved.length ? Math.round(approved.reduce((a, t) => a + t.currentPerformance, 0) / approved.length) : null,
    sessions: datasheets.length,
    sessions7d: datasheets.filter((s) => now - Date.parse(s.savedAt) <= 7 * DAY).length,
    sessions30d: datasheets.filter((s) => now - Date.parse(s.savedAt) <= 30 * DAY).length,
    byDiscipline: roles.map((role) => ({ role, sessions: datasheets.filter((s) => s.role === role).length, goals: targets.filter((t) => t.discipline === role).length })).sort((a, b) => b.sessions - a.sessions),
    homeTasks: { total: tasks.length, done, percent: tasks.length ? Math.round((done / tasks.length) * 100) : null },
    plans: { total: input.bips.filter((b) => kidIds.has(b.childId)).length, active: input.bips.filter((b) => kidIds.has(b.childId) && b.status === 'active').length, draft: input.bips.filter((b) => kidIds.has(b.childId) && b.status === 'draft').length },
    pendingGoals: pendingGoals(targets).length,
    pendingSessions: pendingSessions(sessions).length,
  };
}

/** Plain-text clinical audit for the last 30 days, ready to copy or send. */
export function monthlyAuditText(input: { orgName: string; children: Child[]; targets: Target[]; sessions: SavedSession[]; homeTasks: HomeTask[]; bips: BipPlan[]; now?: number }): string {
  const now = input.now ?? Date.now();
  const recent = input.sessions.filter((s) => now - Date.parse(s.savedAt) <= 30 * DAY);
  const o = orgStats({ ...input, sessions: input.sessions, now });
  const lines: string[] = [
    `MONTHLY CLINICAL AUDIT — ${input.orgName}`,
    `Period: ${new Date(now - 30 * DAY).toLocaleDateString('en-GB')} to ${new Date(now).toLocaleDateString('en-GB')}`,
    '',
    'ORGANISATION',
    `• ${o.children} children · ${o.goals} goals (${o.mastered} at or above criterion)`,
    `• Sessions in the last 30 days: ${o.sessions30d} (${o.sessions7d} in the last 7)`,
    `• Average goal performance: ${o.avgPerformance === null ? 'n/a' : o.avgPerformance + '%'}`,
    `• Home practice completed: ${o.homeTasks.percent === null ? 'n/a' : `${o.homeTasks.done} of ${o.homeTasks.total} (${o.homeTasks.percent}%)`}`,
    `• Behavior plans: ${o.plans.active} active, ${o.plans.draft} draft`,
    `• Waiting for supervisor: ${o.pendingGoals} goals, ${o.pendingSessions} sessions`,
    '',
    'BY DISCIPLINE',
    ...(o.byDiscipline.length ? o.byDiscipline.map((d) => `• ${DISCIPLINE_LABEL[d.role]?.en ?? d.role}: ${d.sessions} sessions, ${d.goals} goals`) : ['• No data yet.']),
    '',
    'CHILDREN',
    ...input.children.map((c) => {
      const ov = childOverview(c, input.targets, input.sessions, now);
      const label = { needs_review: 'needs review', needs_support: 'needs support', on_track: 'on track', no_data: 'no goals yet' }[ov.status];
      return `• ${c.name}: ${label}; ${ov.goals.length} goals${ov.byDiscipline.length ? ` (${ov.byDiscipline.map((d) => `${DISCIPLINE_LABEL[d.role]?.en ?? d.role} ${d.avg}%`).join(', ')})` : ''}`;
    }),
    '',
    'STAFF',
    ...(staffStats(recent, now).length ? staffStats(recent, now).map((s) => `• ${s.name}: ${s.sessions} sessions, ${s.children} children${s.avgIntegrity !== null ? `, treatment integrity ${s.avgIntegrity}%` : ''}${s.avgIoa !== null ? `, IOA ${s.avgIoa}%` : ''}`) : ['• No sessions saved in this period.']),
  ];
  return lines.join('\n');
}
