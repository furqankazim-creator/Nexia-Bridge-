import type { Chaining, StepLevel, TaskAnalysis } from '../types';
import { decide, type Decision } from './decisionSupport';

export const STEP_LEVELS: StepLevel[] = ['Independent', 'Verbal', 'Model', 'Physical'];
export const CHAINING_LABEL: Record<Chaining, { en: string; ar: string }> = {
  forward: { en: 'Forward Chaining', ar: 'التسلسل الأمامي' },
  backward: { en: 'Backward Chaining', ar: 'التسلسل الخلفي' },
  total: { en: 'Total Task', ar: 'المهمة الكلية' },
};

export const OT_DOMAINS_FULL = [
  'Self-Care & Daily Living (ADLs)',
  'Fine motor',
  'Visual-Motor Integration (VMI)',
  'Handwriting',
  'Gross motor',
  'Sensory processing',
  'Feeding',
  'Play & social participation',
];

export const OT_RULE_THRESHOLD = 75;
export const OT_RULE_SESSIONS = 3;

export interface TaskStats {
  total: number;
  scored: number;
  independent: number;
  /** Independent steps out of ALL steps: an unscored step counts as not independent yet. */
  percent: number;
}

export const stepStats = (t: Pick<TaskAnalysis, 'steps' | 'levels'>): TaskStats => {
  const total = t.steps.length;
  const scored = t.steps.filter((s) => t.levels[s.id]).length;
  const independent = t.steps.filter((s) => t.levels[s.id] === 'Independent').length;
  return { total, scored, independent, percent: total ? Math.round((independent / total) * 100) : 0 };
};

const SUPPORT_RANK: Record<StepLevel, number> = { Independent: 0, Verbal: 1, Model: 2, Physical: 3 };

/** Which step to work on next, and what to do about it, given the chaining method. */
export const coachNote = (t: Pick<TaskAnalysis, 'steps' | 'levels' | 'chaining'>): { focusStep: number | null; advice: string } => {
  const idx = t.steps.map((s, i) => ({ i, level: t.levels[s.id] as StepLevel | undefined }));
  const pending = idx.filter((x) => x.level !== 'Independent');
  if (t.steps.length === 0) return { focusStep: null, advice: 'Add steps to this task.' };
  if (pending.length === 0) return { focusStep: null, advice: 'Every step is independent. Ready to generalize to a new setting.' };
  let focus = pending[0]; // forward chaining: teach in order, so the first step that is not independent yet
  if (t.chaining === 'backward') focus = pending[pending.length - 1];
  if (t.chaining === 'total') focus = pending.reduce((a, b) => ((b.level ? SUPPORT_RANK[b.level] : 0) > (a.level ? SUPPORT_RANK[a.level] : 0) ? b : a));
  const n = focus.i + 1;
  const advice =
    focus.level === 'Physical' ? `Fade physical support on Step ${n}.`
    : focus.level === 'Model' ? `Fade modelling on Step ${n}.`
    : focus.level === 'Verbal' ? `Fade the verbal cue on Step ${n}.`
    : `Score Step ${n}.`;
  return { focusStep: n, advice };
};

export interface OtRecommendation {
  headline: string;
  ruleLine: string;
  action: string;
  decision: Decision;
}

/** Rule-based recommendation for one task: ≥75% across 3 consecutive sessions means advance. */
export const otRecommendation = (t: TaskAnalysis): OtRecommendation => {
  const live = stepStats(t);
  const past = t.history.map((h) => h.percent);
  // With no saved sessions yet, today's score is all there is to go on.
  const scores = past.length ? past : live.scored > 0 ? [live.percent] : [];
  const decision = decide({ status: scores.length < 1 ? 'baseline' : 'teaching', threshold: OT_RULE_THRESHOLD, sessions: OT_RULE_SESSIONS, scores });
  const note = coachNote(t);
  const headline =
    decision.action === 'advance' ? 'Advance to a harder variation and carry the skill into the classroom or home'
    : decision.action === 'adjust' ? 'Revise the task analysis: smaller steps or more support'
    : decision.action === 'collect_baseline' ? 'Collect baseline: score every step across sessions'
    : 'Continue the current chaining plan';
  return {
    headline,
    ruleLine: `Task Analysis ≥${OT_RULE_THRESHOLD}% across ${OT_RULE_SESSIONS} consecutive sessions.`,
    action: decision.action === 'advance' ? 'Introduce a smaller or harder variation, and assign a home carryover routine.' : note.advice,
    decision,
  };
};

/** "1. Hold pin" or "2) Insert pin" → "Hold pin". Blank lines are dropped. */
export const parseSteps = (text: string): string[] =>
  text.split('\n').map((l) => l.trim().replace(/^\d+\s*[.)\-:]\s*/, '').trim()).filter(Boolean);

export interface TaskTemplate {
  key: string;
  title: string;
  domain: string;
  chaining: Chaining;
  steps: string[];
}

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    key: 'buttoning', title: 'Buttoning Standard Shirt (4 buttons)', domain: 'Self-Care & Daily Living (ADLs)', chaining: 'forward',
    steps: ['Grasp edge of buttonhole with non-dominant hand', 'Pincer grasp on button with dominant thumb & index', 'Angle button edge halfway into buttonhole slot', 'Switch non-dominant hand to pull button through', 'Flatten shirt fabric and verify button is seated'],
  },
  {
    key: 'handwashing', title: 'Sequential Handwashing Routine (6 steps)', domain: 'Self-Care & Daily Living (ADLs)', chaining: 'total',
    steps: ['Turn on the tap to warm water', 'Wet both hands', 'Pump soap onto palm', 'Rub hands together for 20 seconds: palms, backs, between fingers', 'Rinse all the soap off', 'Turn off the tap and dry hands with the towel'],
  },
  {
    key: 'scissors', title: 'Scissor Cutting Along 10cm Line', domain: 'Visual-Motor Integration (VMI)', chaining: 'total',
    steps: ['Place thumb in the top hole and fingers in the bottom hole', 'Hold the paper steady with the helper hand', 'Open and close the scissors to snip forward', 'Cut along the line without leaving it', 'Rotate paper smoothly at corner boundary'],
  },
  {
    key: 'tripod', title: 'Dynamic Tripod Pencil Grasp on Writing Tools', domain: 'Fine motor', chaining: 'forward',
    steps: ['Pick up the pencil with thumb and index finger', 'Rest the pencil on the side of the middle finger', 'Keep a small open space between thumb and index', 'Rest the wrist lightly on the table', 'Trace three lines using the tripod grasp'],
  },
  {
    key: 'zipping', title: 'Zipping a Jacket', domain: 'Self-Care & Daily Living (ADLs)', chaining: 'backward',
    steps: ['Hold the bottom pin with the helper hand', 'Insert the pin into the zipper slide', 'Pull the tab up with the dominant hand', 'Pull the zipper all the way to the top', 'Fold the collar flat'],
  },
  {
    key: 'toothbrushing', title: 'Brushing Teeth', domain: 'Self-Care & Daily Living (ADLs)', chaining: 'forward',
    steps: ['Wet the toothbrush', 'Put a pea-sized amount of toothpaste on it', 'Brush the top teeth for 10 seconds', 'Brush the bottom teeth for 10 seconds', 'Spit and rinse the mouth', 'Rinse the toothbrush and put it away'],
  },
];
