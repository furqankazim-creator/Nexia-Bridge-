import type { ABCRecord, CaseNote, ClinicalTemplate, HomeTask, Observation, SavedReport, SavedSession, TeamRequest } from '../types';

/**
 * Dummy supervision data for the offline demo. Everything is dated relative to "now" so the screens
 * (waiting 9 days, no session for 3 weeks, this month's hours) always look alive.
 */
const DAY = 86400000;
const iso = (now: number, daysAgo: number, hour = 10) => { const d = new Date(now - daysAgo * DAY); d.setHours(hour, 15, 0, 0); return d.toISOString(); };
const ymd = (now: number, daysAgo: number) => new Date(now - daysAgo * DAY).toISOString().slice(0, 10);

const blankData = (trials: ('+' | 'P' | '-')[], extra: Partial<SavedSession['data']> = {}): SavedSession['data'] => ({
  trials, promptLevel: 'Partial', frequency: 0, rateResponses: 0, rateSeconds: 0, durationEpisodes: [], latencies: [], irts: [], partialIntervals: [], wholeIntervals: [], mtsIntervals: [],
  permanentProducts: [], percentageCorrect: 0, percentageTotal: 0, trialsToCriterion: 0, coldProbe: [], accuracyErrors: [], baselineValues: [], ioaObserver1: 0, ioaObserver2: 0,
  integritySteps: [], tokensEarned: 0, tokensGoal: 0, abc: [], ...extra,
});

interface Spec { day: number; child: string; role: SavedSession['role']; who: string; target: string; name: string; trials: ('+' | 'P' | '-')[]; integrity?: number; ioa?: number; review?: SavedSession['review']; comments?: SavedSession['comments']; notes?: string }

export function demoSessions(now = Date.now()): SavedSession[] {
  const T = (s: string) => s.split('').map((c) => (c === 'i' ? '+' : c === 'p' ? 'P' : '-')) as ('+' | 'P' | '-')[];
  const signed = (day: number): SavedSession['review'] => ({ status: 'signed', by: 'Dr. Rebecca Hall', at: iso(now, day - 1, 15) });
  const specs: Spec[] = [
    // Lama · speech: rising 60 → 70 → 85
    { day: 20, child: 'child-lama', role: 'speech', who: 'Dr. Sarah Alharbi', target: 'target-lama-1', name: 'Answering WH Questions (Where & What)', trials: T('iipppiipip'), integrity: 85, review: signed(20) },
    { day: 13, child: 'child-lama', role: 'speech', who: 'Dr. Sarah Alharbi', target: 'target-lama-1', name: 'Answering WH Questions (Where & What)', trials: T('iiiipiippi'), integrity: 90, ioa: 88, review: signed(13) },
    { day: 6, child: 'child-lama', role: 'speech', who: 'Dr. Sarah Alharbi', target: 'target-lama-1', name: 'Answering WH Questions (Where & What)', trials: T('iiiiiiipip'), integrity: 90, ioa: 90, notes: 'Responded to "where" questions with the target word; needed one model for "what".' },
    // Lama · OT: slow climb, one session waiting nine days
    { day: 16, child: 'child-lama', role: 'ot', who: 'Reem Al-Ahmad', target: 'target-lama-2', name: 'Fastening Vest Buttons & Tripod Grip', trials: T('iipppppppp'), integrity: 70, review: signed(16) },
    { day: 9, child: 'child-lama', role: 'ot', who: 'Reem Al-Ahmad', target: 'target-lama-2', name: 'Fastening Vest Buttons & Tripod Grip', trials: T('iiipppiippp'), integrity: 70, ioa: 75, notes: 'Tripod grasp held 3 minutes. Fatigue after the third button.' },
    // Lama · behavior (mastered goal, awaiting approval to close), plus a returned session with a comment
    { day: 8, child: 'child-lama', role: 'behavior', who: 'Dr. Tareq Hassan', target: 'target-lama-3', name: 'Requesting Help During Frustration', trials: T('iiiiiiiiip'), integrity: 95, ioa: 92, review: signed(8) },
    { day: 3, child: 'child-lama', role: 'behavior', who: 'Dr. Tareq Hassan', target: 'target-lama-3', name: 'Requesting Help During Frustration', trials: T('iiiiiiiiii'), integrity: 95, ioa: 92, notes: 'Help card used every time. Generalised to the classroom door.' },
    // Maya · speech
    { day: 11, child: 'child-2', role: 'speech', who: 'Dr. Sarah Alharbi', target: 'target-1', name: 'Answering WH Questions', trials: T('iiiipiiipi'), integrity: 90, review: { status: 'changes', by: 'Dr. Rebecca Hall', at: iso(now, 10, 14), note: 'Please record the prompt level for each trial and resubmit.' }, comments: [{ at: iso(now, 10, 14), by: 'Dr. Rebecca Hall', text: 'Trials 4 and 9: which prompt was used?' }] },
    { day: 4, child: 'child-2', role: 'speech', who: 'Dr. Sarah Alharbi', target: 'target-1', name: 'Answering WH Questions', trials: T('iiiiiipiii'), integrity: 90, ioa: 85 },
    // Tariq · OT: flat below criterion (stalled), then nothing for three weeks
    { day: 28, child: 'child-3', role: 'ot', who: 'Hana Al-Zahrani', target: 'target-3', name: 'Buttoning a Shirt (Task Analysis)', trials: T('iipppppp'), integrity: 60, review: signed(28) },
    { day: 24, child: 'child-3', role: 'ot', who: 'Hana Al-Zahrani', target: 'target-3', name: 'Buttoning a Shirt (Task Analysis)', trials: T('iippppp'), integrity: 60, review: signed(24) },
    { day: 21, child: 'child-3', role: 'ot', who: 'Hana Al-Zahrani', target: 'target-3', name: 'Buttoning a Shirt (Task Analysis)', trials: T('iipppppp'), integrity: 65, review: signed(21) },
  ];
  const out = specs.map((sp, i): SavedSession => {
    const trials = sp.trials;
    const scored = trials.length;
    const ind = trials.filter((t) => t === '+').length;
    const soap = sp.notes && sp.day === 6;
    return {
      id: `demo-ss-${i + 1}`,
      childId: sp.child,
      role: sp.role,
      therapistName: sp.who,
      targetId: sp.target,
      targetName: sp.name,
      savedAt: iso(now, sp.day),
      procedureIds: [],
      measureIds: [],
      data: blankData(trials),
      summary: { percentIndependent: Math.round((ind / scored) * 100), scoredTrials: scored, frequency: null, ratePerMinute: null, meanDurationSec: null, meanLatencySec: null, meanIrtSec: null, partialPercent: null, wholePercent: null, mtsPercent: null, ioaPercent: sp.ioa ?? null, integrityPercent: sp.integrity ?? null },
      notes: soap ? sp.notes! : sp.notes ?? '',
      ...(sp.review ? { review: sp.review } : {}),
      ...(sp.comments ? { comments: sp.comments } : {}),
    };
  });
  // One SOAP note for the review queue
  out.push({
    id: 'demo-ss-soap',
    childId: 'child-lama',
    role: 'speech',
    therapistName: 'Dr. Sarah Alharbi',
    targetId: 'target-lama-1',
    targetName: 'Answering WH Questions (Where & What)',
    savedAt: iso(now, 2),
    procedureIds: [],
    measureIds: [],
    data: blankData([]),
    summary: { percentIndependent: 80, scoredTrials: 10, frequency: null, ratePerMinute: null, meanDurationSec: null, meanLatencySec: null, meanIrtSec: null, partialPercent: null, wholePercent: null, mtsPercent: null, ioaPercent: null, integrityPercent: null },
    notes: '[SOAP NOTE]\nS: Lama arrived calm and told her mother she wanted to "play the question game".\nO: 10 trials of where/what questions: 8 independent, 1 prompted, 1 incorrect (80% independent). Latency under 4 seconds on 7 trials.\nA: Moving toward the 85% criterion. "What" questions remain harder than "where".\nP: Add a second picture scene next session; continue time delay for "what".',
  });
  return out;
}

export function demoObservations(now = Date.now()): Observation[] {
  const base = { observer: 'Dr. Rebecca Hall', observerRole: 'supervisor' };
  const steps = (xs: [string, 'correct' | 'incorrect' | 'na'][]) => xs.map(([label, score]) => ({ label, score }));
  return [
    { id: 'demo-ob-1', childId: 'child-lama', therapistName: 'Dr. Sarah Alharbi', goalId: 'target-lama-1', goalName: 'Answering WH Questions (Where & What)', date: ymd(now, 12), type: 'live', durationMin: 45, steps: steps([['Presents the picture and question clearly', 'correct'], ['Waits 4 seconds before prompting', 'correct'], ['Uses the least intrusive prompt', 'correct'], ['Delivers the reinforcer immediately', 'incorrect'], ['Records every trial', 'correct']]), fidelity: 80, ioa: { method: 'trial', percent: 90, a: 9, b: 10, trials: 10 }, feedback: 'Good pacing and clear questions. Reinforcement was delayed on two trials.', actionItems: 'Keep the reinforcer in hand before each trial.', recheckDate: ymd(now, -14), ...base, at: iso(now, 12), ackAt: iso(now, 11) },
    { id: 'demo-ob-2', childId: 'child-lama', therapistName: 'Dr. Tareq Hassan', goalId: 'target-lama-3', goalName: 'Requesting Help During Frustration', date: ymd(now, 18), type: 'live', durationMin: 30, steps: steps([['Waits for the help request', 'correct'], ['Honours the request within 3 seconds', 'correct'], ['Fades the help card', 'correct'], ['Records latency', 'correct']]), fidelity: 100, ioa: { method: 'count', percent: 92, a: 11, b: 12 }, feedback: 'Excellent fidelity.', actionItems: '', ...base, at: iso(now, 18), ackAt: iso(now, 17) },
    { id: 'demo-ob-3', childId: 'child-lama', therapistName: 'Reem Al-Ahmad', goalId: 'target-lama-2', goalName: 'Fastening Vest Buttons & Tripod Grip', date: ymd(now, 9), type: 'video', durationMin: 25, steps: steps([['Sets up the vest at chest height', 'correct'], ['Gives hand-over-hand only when needed', 'incorrect'], ['Fades prompts across the session', 'incorrect'], ['Reinforces independent buttons', 'correct'], ['Records prompt level', 'correct']]), fidelity: 60, ioa: { method: 'trial', percent: 70, a: 7, b: 10, trials: 10 }, feedback: 'Prompts were not faded. Hand-over-hand used for all buttons.', actionItems: 'Review the prompt hierarchy; practise most-to-least fading.', recheckDate: ymd(now, 2), ...base, at: iso(now, 9) },
    { id: 'demo-ob-4', childId: 'child-lama', therapistName: 'Dr. Sarah Alharbi', date: ymd(now, 40), type: 'training', durationMin: 60, steps: [], fidelity: null, ioa: null, feedback: 'Training on time-delay prompting.', actionItems: '', ...base, at: iso(now, 40), ackAt: iso(now, 39) },
  ];
}

export function demoCaseNotes(now = Date.now()): CaseNote[] {
  return [
    { id: 'demo-cn-1', childId: 'child-lama', kind: 'iep_review', text: 'IEP speech goal revised: WH-question criterion raised to 90% across 3 sessions. Parents agreed.', date: ymd(now, 14), nextReview: ymd(now, -60), author: 'Dr. Rebecca Hall', authorRole: 'supervisor', at: iso(now, 14) },
    { id: 'demo-cn-2', childId: 'child-lama', kind: 'meeting', text: 'Team meeting (speech, OT, behavior, teacher): align the help-card routine between clinic and classroom.', date: ymd(now, 7), author: 'Dr. Rebecca Hall', authorRole: 'supervisor', at: iso(now, 7) },
    { id: 'demo-cn-3', childId: 'child-3', kind: 'note', text: 'Buttoning has plateaued. Consider breaking the task into backward-chained steps.', date: ymd(now, 5), author: 'Dr. Rebecca Hall', authorRole: 'supervisor', at: iso(now, 5) },
  ];
}

export function demoTeamRequests(now = Date.now()): TeamRequest[] {
  return [
    { id: 'demo-tr-1', childId: 'child-2', kind: 'add', role: 'ot', staffName: '', note: 'Maya has no OT. Her fine-motor goals need a therapist.', requestedBy: 'Dr. Rebecca Hall', requestedByRole: 'supervisor', at: iso(now, 2), status: 'open' },
  ];
}

export function demoTemplates(now = Date.now()): ClinicalTemplate[] {
  const t = (id: string, kind: ClinicalTemplate['kind'], title: string, body: string, steps: string[], status: ClinicalTemplate['status'], approved = false): ClinicalTemplate => ({
    id, childId: 'org', kind, title, body, steps, status, version: 1, createdBy: 'Dr. Rebecca Hall', createdAt: iso(now, 30),
    ...(approved ? { approvedBy: 'Dr. Huda Salem', approvedAt: iso(now, 28) } : {}),
  });
  return [
    t('demo-tp-1', 'soap', 'Speech session SOAP note', 'S: How the child arrived and what the family reported.\nO: Trials, prompt levels, accuracy, latency.\nA: Progress against the goal and the criterion.\nP: What changes next session.', [], 'approved', true),
    t('demo-tp-2', 'dtt', 'Discrete-trial data sheet (10 trials)', 'Ten trials scored independent / prompted / incorrect, with the prompt level noted.', ['Present the instruction', 'Wait 3 seconds', 'Prompt if needed', 'Score the trial', 'Reinforce'], 'approved', true),
    t('demo-tp-3', 'bip', 'Behavior intervention plan', 'Target behavior, operational definition, function, replacement behavior, strategies, data method, review date.', [], 'submitted'),
    t('demo-tp-4', 'task_analysis', 'Buttoning a shirt', 'Backward-chained task analysis.', ['Hold the shirt flat', 'Pinch the button', 'Find the hole', 'Push the button through', 'Pull it through', 'Repeat for each button'], 'approved', true),
    t('demo-tp-5', 'task_analysis', 'Hand-washing', 'Seven-step task analysis for the sink.', ['Turn on the water', 'Wet hands', 'Pump soap', 'Scrub 20 seconds', 'Rinse', 'Turn off the water', 'Dry hands'], 'draft'),
  ];
}

export function demoReports(now = Date.now()): SavedReport[] {
  const lastMonth = new Date(now); lastMonth.setMonth(lastMonth.getMonth() - 1);
  const y = lastMonth.getFullYear(); const m = String(lastMonth.getMonth() + 1).padStart(2, '0');
  const last = new Date(Date.UTC(y, lastMonth.getMonth() + 1, 0)).getUTCDate();
  return [
    { id: 'demo-rp-1', childId: 'org', from: `${y}-${m}-01`, to: `${y}-${m}-${last}`, scope: 'All children, all disciplines', narrative: 'Clinical summary for last month.\n\nSessions were steady and speech accuracy improved. OT and classroom goals need attention.\n\nRecommendations: review the OT prompt hierarchy.', createdBy: 'Dr. Rebecca Hall', createdAt: iso(now, 14), signedBy: 'Dr. Rebecca Hall', signedAt: iso(now, 14), snapshot: { goals: 9, sessions: 6, avgPerformance: 68, integrity: 78, ioa: 80, mastered: 2 } },
  ];
}

export function demoHomeTasks(): HomeTask[] {
  return [
    { id: 'demo-ht-1', childId: 'child-lama', title: 'WH-question game (45 minutes)', instructions: 'Use the picture cards at snack time. Ask where and what. Note the mood.', frequency: 'Daily', dueDate: '', assignedBy: 'Dr. Rebecca Hall', done: true, doneAt: new Date().toISOString(), parentNote: 'Happy and eager.' },
    { id: 'demo-ht-2', childId: 'child-lama', title: 'Button practice on the vest', instructions: 'Five buttons after dinner. Fade help each day.', frequency: '5 days a week', dueDate: '', assignedBy: 'Reem Al-Ahmad', done: false, doneAt: null, parentNote: '' },
    { id: 'demo-ht-3', childId: 'child-2', title: 'Naming objects at home', instructions: 'Name five objects at breakfast.', frequency: 'Daily', dueDate: '', assignedBy: 'Dr. Sarah Alharbi', done: false, doneAt: null, parentNote: '' },
  ];
}

export function demoAbc(now = Date.now()): ABCRecord[] {
  const rec = (i: number, day: number, behavior: string, intensity: 1 | 2 | 3): ABCRecord => ({ id: `demo-abc-${i}`, childId: 'child-lama', at: iso(now, day), setting: 'Classroom', antecedent: 'Difficult task presented', behavior, consequence: 'Offered the help card', intensity, durationSec: 40, probableFunction: 'escape', observer: 'Dr. Tareq Hassan' });
  return [rec(1, 26, 'Cried and dropped to floor', 3), rec(2, 24, 'Cried', 2), rec(3, 19, 'Pushed materials away', 2), rec(4, 12, 'Vocalised "help"', 1), rec(5, 6, 'Handed the help card', 1)];
}
