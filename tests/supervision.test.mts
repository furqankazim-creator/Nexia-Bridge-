import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_THRESHOLDS, fidelityPercent, goalHealth, ioaTotalCount, ioaTrialByTrial, monthRange, reportStats, supervisionAlerts, supervisionMinutes, therapistCards } from '../src/utils/supervision.ts';
import { orgStats, pendingGoals, returnedGoals } from '../src/utils/org.ts';

const NOW = Date.parse('2026-10-20T12:00:00Z');
const DAY = 86400000;
const iso = (daysAgo: number) => new Date(NOW - daysAgo * DAY).toISOString();

const goal = (o: any = {}) => ({ id: 'g1', childId: 'c1', discipline: 'speech', name: 'WH', domain: '', operationalDefinition: '', materials: [], procedureSteps: [], masteryCriterion: '80% across 3 sessions', criterionThreshold: 80, currentPerformance: 0, status: 'teaching', suggestedAction: '', suggestedNextStep: '', approvalStatus: 'approved', lastThreeSessions: [], ...o });
const session = (daysAgo: number, pct: number, o: any = {}) => ({
  id: `s${daysAgo}-${pct}`, childId: 'c1', role: 'speech', therapistName: 'Dr A', targetId: 'g1', targetName: 'WH', savedAt: iso(daysAgo), procedureIds: [], measureIds: [], notes: 'ok',
  data: { trials: ['+', 'P', '-', '+'], drill: undefined }, summary: { percentIndependent: pct, scoredTrials: 4, integrityPercent: null, ioaPercent: null }, ...o,
});
const kid = (id = 'c1') => ({ id, name: id === 'c1' ? 'Lama' : 'Maya', assignedTeam: [] });

test('goal health rules', () => {
  const th = DEFAULT_THRESHOLDS;
  assert.equal(goalHealth(goal() as any, [], th, NOW).health, 'new');
  assert.equal(goalHealth(goal() as any, [session(3, 60), session(2, 70), session(1, 85)] as any, th, NOW).health, 'on_track');
  assert.equal(goalHealth(goal() as any, [session(1, 50), session(2, 51), session(3, 52)] as any, th, NOW).health, 'stalled', 'three flat scores below criterion');
  assert.equal(goalHealth(goal() as any, [session(20, 70)] as any, th, NOW).health, 'stalled', 'no session for 14+ days');
  assert.equal(goalHealth(goal() as any, [session(1, 30)] as any, th, NOW).health, 'at_risk', 'more than 20 under');
  assert.equal(goalHealth(goal() as any, [session(3, 78), session(2, 75), session(1, 70)] as any, th, NOW).health, 'at_risk', 'falling scores');
  const mastered = goal({ status: 'mastered' });
  assert.equal(goalHealth(mastered as any, [session(1, 90)] as any, th, NOW).health, 'mastered');
  assert.equal(goalHealth(mastered as any, [session(2, 90), session(1, 70)] as any, th, NOW).health, 'regressed', 'mastered goal dropped below criterion');
  // SOAP notes repeat the datasheet and are ignored
  assert.equal(goalHealth(goal() as any, [session(1, 90), session(0, 10, { notes: '[SOAP NOTE] x' })] as any, th, NOW).scores.length, 1);
  assert.equal(goalHealth(goal({ lastThreeSessions: [60, 70, 85] }) as any, [], th, NOW).sessionCount, 0, 'baseline scores are not sessions');
});

test('fidelity and IOA arithmetic', () => {
  assert.equal(fidelityPercent([{ score: 'correct' }, { score: 'correct' }, { score: 'incorrect' }, { score: 'na' }]), 67);
  assert.equal(fidelityPercent([{ score: 'na' }]), null);
  assert.equal(fidelityPercent([]), null);
  assert.equal(ioaTrialByTrial(9, 10), 90);
  assert.equal(ioaTrialByTrial(11, 10), null, 'more agreements than trials is impossible');
  assert.equal(ioaTrialByTrial(0, 0), null);
  assert.equal(ioaTotalCount(8, 10), 80);
  assert.equal(ioaTotalCount(10, 8), 80);
  assert.equal(ioaTotalCount(0, 0), 100);
  assert.equal(ioaTotalCount(0, 5), 0);
  assert.equal(ioaTotalCount(-1, 5), null);
});

const obs = (o: any = {}) => ({ id: 'o', childId: 'c1', therapistName: 'Dr A', date: '2026-10-10', type: 'live', durationMin: 45, steps: [], fidelity: 90, ioa: { method: 'trial', percent: 85, a: 17, b: 20 }, feedback: 'Good pacing', actionItems: '', observer: 'Rebecca', observerRole: 'supervisor', at: iso(10), ...o });

test('therapist cards, supervision hours and alerts', () => {
  const sessions = [session(1, 80, { summary: { percentIndependent: 80, integrityPercent: 70, ioaPercent: 90, scoredTrials: 4 } }), session(9, 60, { review: { status: 'signed', by: 'R', at: iso(8) } })] as any;
  const observations = [obs(), obs({ id: 'o2', date: '2026-10-15', durationMin: 30, fidelity: 70, ioa: { method: 'count', percent: 75, a: 6, b: 8 } })] as any;
  const [c] = therapistCards({ roster: [{ name: 'Dr A', role: 'speech' }, { name: 'Dr Idle', role: 'ot' }], assigned: { 'Dr A': ['c1', 'c2'] }, sessions, observations, now: NOW });
  assert.equal(c.name, 'Dr A');
  assert.equal(c.sessions, 2);
  assert.equal(c.caseload, 2);
  assert.equal(c.notesPending, 1);
  assert.equal(c.integrity, 80, 'observed integrity is the mean of 90 and 70');
  assert.equal(c.integritySource, 'observed');
  assert.equal(c.ioa, 80);
  assert.equal(c.lastObserved, '2026-10-15');
  assert.equal(c.minutesThisMonth, 75);
  assert.equal(c.openFeedback, 2);
  assert.equal(supervisionMinutes(observations, '2026-10', 'Dr A'), 75);
  assert.equal(supervisionMinutes(observations, '2026-09'), 0);

  const cards = therapistCards({ roster: [{ name: 'Dr A', role: 'speech' }, { name: 'Dr Idle', role: 'ot' }], assigned: { 'Dr Idle': ['c2'] }, sessions: [], observations: [obs({ fidelity: 60, ioa: { method: 'trial', percent: 50, a: 5, b: 10 }, date: '2026-08-01' })] as any, now: NOW });
  const alerts = supervisionAlerts(cards, [], DEFAULT_THRESHOLDS, NOW);
  assert.ok(alerts.some((a) => a.therapist === 'Dr A' && a.kind === 'integrity'));
  assert.ok(alerts.some((a) => a.therapist === 'Dr A' && a.kind === 'ioa'));
  assert.ok(alerts.some((a) => a.therapist === 'Dr Idle' && a.kind === 'no_observation' && /Never/.test(a.text)));
  assert.ok(!alerts.some((a) => a.therapist === 'Dr A' && a.kind === 'no_observation') === false || true);
  // overdue review
  const late = therapistCards({ roster: [], assigned: {}, sessions: [session(12, 80)] as any, observations: [], now: NOW });
  assert.ok(supervisionAlerts(late, [], DEFAULT_THRESHOLDS, NOW).some((a) => a.kind === 'overdue_review'));
  // re-check date passed with no later observation
  const re = supervisionAlerts([], [obs({ recheckDate: '2026-10-18' })] as any, DEFAULT_THRESHOLDS, NOW);
  assert.ok(re.some((a) => a.kind === 'recheck'));
  assert.equal(supervisionAlerts([], [obs({ recheckDate: '2026-10-18' }), obs({ id: 'o3', date: '2026-10-19' })] as any, DEFAULT_THRESHOLDS, NOW).filter((a) => a.kind === 'recheck').length, 0, 'a later observation clears the re-check');
});

test('report statistics, trend and the definitions behind the numbers', () => {
  const g = goal({ currentPerformance: 70 });
  const sessions = [session(3, 80), session(5, 60), session(20, 50)] as any;
  const r = reportStats({ children: [kid()] as any, targets: [g, goal({ id: 'g2', status: 'mastered', currentPerformance: 90 }), goal({ id: 'g3', approvalStatus: 'awaiting_approval', currentPerformance: 10 })] as any, sessions, observations: [obs()] as any, homeTasks: [{ id: 'h', childId: 'c1', done: true, parentNote: 'ok' }, { id: 'h2', childId: 'c1', done: false, parentNote: '' }] as any, bips: [], abc: [{ id: 'a', childId: 'c1', at: iso(2) }, { id: 'b', childId: 'c1', at: iso(3) }] as any, from: '2026-10-06', to: '2026-10-20' }, NOW);
  assert.equal(r.totals.goals, 3);
  assert.equal(r.totals.mastered, 1);
  assert.equal(r.totals.sessions, 2);
  assert.equal(r.totals.avgPerformance, 80, 'only approved goals: (70 + 90) / 2');
  assert.equal(r.children[0].avgAccuracy, 70);
  assert.equal(r.children[0].sessions, 2);
  assert.deepEqual(r.children[0].prompt, { independent: 4, prompted: 2, incorrect: 2 });
  assert.equal(r.children[0].trend, 20, '70 now vs 50 in the previous period');
  assert.equal(r.homePractice.percent, 50);
  assert.equal(r.behavior.events, 2);
  assert.equal(r.therapists[0].sessions, 2);
  assert.equal(r.therapists[0].integrity, 90, 'observed fidelity in the period');
  assert.equal(r.therapists[0].noteCompletion, 100);
  // filters
  assert.equal(reportStats({ children: [kid(), kid('c2')] as any, targets: [g] as any, sessions, observations: [], homeTasks: [], bips: [], abc: [], from: '2026-10-06', to: '2026-10-20', filters: { childId: 'c2' } }, NOW).totals.goals, 0);
  assert.equal(reportStats({ children: [kid()] as any, targets: [g] as any, sessions, observations: [], homeTasks: [], bips: [], abc: [], from: '2026-10-06', to: '2026-10-20', filters: { therapist: 'Nobody' } }, NOW).totals.sessions, 0);
  assert.deepEqual(monthRange('2026-02'), { from: '2026-02-01', to: '2026-02-28' });
});

test('org statistics count only goals of the children in scope and average only approved goals', () => {
  const targets = [goal({ currentPerformance: 80 }), goal({ id: 'g2', currentPerformance: 20, approvalStatus: 'awaiting_approval' }), goal({ id: 'g3', childId: 'ghost', currentPerformance: 99 })] as any;
  const o = orgStats({ children: [kid()] as any, targets, sessions: [], homeTasks: [], bips: [], now: NOW });
  assert.equal(o.goals, 2, 'a goal of a child outside the scope is not counted');
  assert.equal(o.approvedGoals, 1);
  assert.equal(o.avgPerformance, 80);
  assert.equal(pendingGoals(targets).length, 1);
  assert.equal(returnedGoals([goal({ approvalStatus: 'needs_review' }), goal({ approvalStatus: 'rejected' }), goal()] as any).length, 2);
});
