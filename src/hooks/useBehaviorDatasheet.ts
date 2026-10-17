import { useState, useEffect, useCallback, useRef } from 'react';
import type { DatasheetData, SavedSession } from '../types';

export type TrialResult = '+' | 'P' | '-' | null;
export type PromptLevel = 'Independent' | 'Verbal' | 'Gesture' | 'Model' | 'Partial physical' | 'Full physical';
export const PROMPT_LEVELS: PromptLevel[] = ['Independent', 'Verbal', 'Gesture', 'Model', 'Partial physical', 'Full physical'];

/** Cueing hierarchy for speech, least to most support. */
export type CueLevel = 'Independent' | 'Visual cue' | 'Gestural cue' | 'Verbal cue' | 'Model' | 'Hand-over-hand';
export const CUE_LEVELS: CueLevel[] = ['Independent', 'Visual cue', 'Gestural cue', 'Verbal cue', 'Model', 'Hand-over-hand'];

export interface Utterance { text: string; morphemes: number }
export interface DrillState { independent: number; prompted: number; incorrect: number }
export interface AacEntry { word: string; spontaneous: boolean }
export type ProbeKind = 'wcpm' | 'digits_pm' | 'correct_incorrect_pm';
export interface Probe { kind: ProbeKind; correct: number; incorrect: number; seconds: number }
export interface ErrorTally { label: string; count: number }
export interface RubricRow { label: string; score: number | null } // 1 (beginning) to 4 (strong)
export interface WorkSample { caption: string; photo: string | null }
export const DEFAULT_ERROR_TYPES = ['Omission', 'Substitution', 'Reversal', 'Insertion', 'Self-corrected'];
export const DEFAULT_RUBRIC = ['Ideas', 'Organization', 'Word choice', 'Conventions'];

export const MASTERY_CRITERION = 90;
export const MASTERY_SESSIONS = 3;

export interface OperationalDefinition {
  name: string;
  definition: string;
  examples: string;
  nonExamples: string;
}
export interface PermanentProduct { label: string; correct: number; total: number }
export interface IntegrityStep { step: string; done: boolean | null }
export type BaselinePhase = 'Baseline' | 'Treatment';
export interface BaselineSession { phase: BaselinePhase; value: number }

export interface SheetState {
  trials: TrialResult[];
  promptLevel: PromptLevel;
  tokensEarned: number;
  frequency: number;
  definition: OperationalDefinition;
  rateResponses: number;
  rateSeconds: number;
  rateRunning: boolean;
  durationEpisodes: number[];
  durationCurrent: number;
  durationRunning: boolean;
  latencies: number[];
  latencyStartedAt: number | null;
  irts: number[];
  irtLastAt: number | null;
  partial: boolean[];
  whole: boolean[];
  mts: ('Yes' | 'No' | null)[];
  products: PermanentProduct[];
  photos: string[];
  pctCorrect: number;
  pctIncorrect: number;
  coldProbe: ('+' | '-' | null)[];
  accuracyCorrect: number;
  accuracyErrors: { label: string; count: number }[];
  baseline: BaselineSession[];
  baselinePhase: BaselinePhase;
  ioaOn: boolean;
  ioa1: number;
  ioa2: number;
  steps: IntegrityStep[];
  /** Speech: one entry per trial, the cue level it needed. */
  cueLog: CueLevel[];
  /** Speech language sample for MLU (mean length of utterance, in morphemes). */
  utterances: Utterance[];
  /** Speech: AAC core words the child selected, and whether each was spontaneous. */
  aacLog: AacEntry[];
  /** Remedial: timed fluency probes, error tallies, writing rubric, work samples. */
  probes: Probe[];
  errorTypes: ErrorTally[];
  rubric: RubricRow[];
  samples: WorkSample[];
  /** Speech: WH-question drill counters. */
  drill: DrillState;
}

/** The client mock-up's "sample data shown" values, so the sheet opens exactly like the PDF. */
const sampleSheet = (): SheetState => ({
  trials: ['+', '+', 'P', '+', '-', '+', '+', 'P', '+', null],
  promptLevel: 'Verbal',
  tokensEarned: 4,
  frequency: 4,
  definition: { name: '', definition: '', examples: '', nonExamples: '' },
  rateResponses: 4,
  rateSeconds: 750,
  rateRunning: false,
  durationEpisodes: [65, 134],
  durationCurrent: 0,
  durationRunning: false,
  latencies: [4, 7, 3],
  latencyStartedAt: null,
  irts: [12, 8, 15],
  irtLastAt: null,
  partial: [true, false, true, true, false, false, true, false, true, false],
  whole: [true, false, false, true, false, false, false, true, false, false],
  mts: ['Yes', 'No', 'No', 'Yes', 'No', 'Yes', 'Yes', 'No', null, null],
  products: [
    { label: 'Worksheet 1', correct: 8, total: 10 },
    { label: 'Worksheet 2', correct: 9, total: 10 },
  ],
  photos: [],
  pctCorrect: 17,
  pctIncorrect: 3,
  coldProbe: ['+', '-', '+', '+', '-'],
  accuracyCorrect: 8,
  accuracyErrors: [
    { label: 'Omission', count: 1 },
    { label: 'Substitution', count: 1 },
  ],
  baseline: [
    { phase: 'Baseline', value: 6 },
    { phase: 'Baseline', value: 7 },
    { phase: 'Baseline', value: 6 },
  ],
  baselinePhase: 'Baseline',
  ioaOn: false,
  ioa1: 8,
  ioa2: 9,
  steps: [
    { step: 'Give the instruction', done: true },
    { step: 'Wait 3 seconds', done: true },
    { step: 'Use the correct prompt', done: false },
    { step: 'Deliver reinforcement', done: true },
  ],
  cueLog: ['Independent', 'Independent', 'Independent', 'Independent', 'Independent', 'Visual cue', 'Visual cue', 'Verbal cue', 'Verbal cue', 'Model'],
  utterances: [
    { text: 'dog on bed', morphemes: 3 },
    { text: 'I want apple', morphemes: 3 },
    { text: 'more juice', morphemes: 2 },
    { text: 'go', morphemes: 1 },
    { text: 'cup in box please', morphemes: 4 },
    { text: 'mama come', morphemes: 2 },
    { text: 'big car', morphemes: 2 },
  ],
  aacLog: [
    { word: 'want', spontaneous: true }, { word: 'more', spontaneous: true }, { word: 'go', spontaneous: false },
    { word: 'want', spontaneous: true }, { word: 'help', spontaneous: false }, { word: 'all done', spontaneous: true },
    { word: 'more', spontaneous: true }, { word: 'like', spontaneous: false },
  ],
  probes: [
    { kind: 'wcpm', correct: 38, incorrect: 4, seconds: 60 },
    { kind: 'digits_pm', correct: 24, incorrect: 2, seconds: 60 },
    { kind: 'correct_incorrect_pm', correct: 30, incorrect: 5, seconds: 60 },
  ],
  errorTypes: [
    { label: 'Omission', count: 2 }, { label: 'Substitution', count: 3 }, { label: 'Reversal', count: 1 },
    { label: 'Insertion', count: 0 }, { label: 'Self-corrected', count: 1 },
  ],
  rubric: [
    { label: 'Ideas', score: 3 }, { label: 'Organization', score: 2 }, { label: 'Word choice', score: 3 }, { label: 'Conventions', score: null },
  ],
  samples: [],
  drill: { independent: 5, prompted: 2, incorrect: 1 },
});

/** A blank sheet for live recording. */
const blankSheet = (): SheetState => ({
  ...sampleSheet(),
  trials: Array(10).fill(null),
  promptLevel: 'Independent',
  tokensEarned: 0,
  frequency: 0,
  rateResponses: 0,
  rateSeconds: 0,
  durationEpisodes: [],
  latencies: [],
  irts: [],
  partial: Array(10).fill(false),
  whole: Array(10).fill(false),
  mts: Array(10).fill(null),
  products: [{ label: 'Worksheet 1', correct: 0, total: 10 }],
  pctCorrect: 0,
  pctIncorrect: 0,
  coldProbe: Array(5).fill(null),
  accuracyCorrect: 0,
  accuracyErrors: [
    { label: 'Omission', count: 0 },
    { label: 'Substitution', count: 0 },
  ],
  baseline: [],
  ioa1: 0,
  ioa2: 0,
  steps: sampleSheet().steps.map((s) => ({ ...s, done: null })),
  cueLog: [],
  utterances: [],
  aacLog: [],
  probes: [],
  errorTypes: DEFAULT_ERROR_TYPES.map((label) => ({ label, count: 0 })),
  rubric: DEFAULT_RUBRIC.map((label) => ({ label, score: null })),
  samples: [],
  drill: { independent: 0, prompted: 0, incorrect: 0 },
});

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

export interface PlanLike { procedureIds: string[]; measureIds: string[] }

/**
 * All live state for the behavior datasheet. `history` is the child's previous
 * percent-independent scores for this target (oldest first), used for trials-to-criterion.
 */
export function useBehaviorDatasheet(history: number[], role?: string) {
  const speech = role === 'speech';
  const [s, setS] = useState<SheetState>(sampleSheet);
  const [isSample, setIsSample] = useState(true);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const sRef = useRef(s);
  sRef.current = s;

  const set = useCallback((patch: Partial<SheetState> | ((prev: SheetState) => Partial<SheetState>)) => {
    setS((prev) => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }));
  }, []);

  // One-second clock for the rate and duration timers.
  useEffect(() => {
    if (!s.rateRunning && !s.durationRunning) return;
    const id = setInterval(() => {
      setS((p) => ({
        ...p,
        rateSeconds: p.rateRunning ? p.rateSeconds + 1 : p.rateSeconds,
        durationCurrent: p.durationRunning ? p.durationCurrent + 1 : p.durationCurrent,
      }));
    }, 1000);
    return () => clearInterval(id);
  }, [s.rateRunning, s.durationRunning]);

  // Fast clock so the latency stopwatch reads live while waiting for the response.
  useEffect(() => {
    if (s.latencyStartedAt === null) return;
    const id = setInterval(() => setNowMs(Date.now()), 100);
    return () => clearInterval(id);
  }, [s.latencyStartedAt]);

  const clearSample = useCallback(() => {
    setS(blankSheet());
    setIsSample(false);
  }, []);
  const restoreSample = useCallback(() => {
    setS(sampleSheet());
    setIsSample(true);
  }, []);

  // ---- Derived values ----
  const scored = s.trials.filter((t) => t !== null);
  const independent = s.trials.filter((t) => t === '+').length;
  const percentIndependent = pct(independent, scored.length);

  const ratePerMinute = s.rateSeconds > 0 ? s.rateResponses / (s.rateSeconds / 60) : 0;
  const durationTotal = sum(s.durationEpisodes);
  const durationMean = s.durationEpisodes.length ? durationTotal / s.durationEpisodes.length : 0;
  const latencyMean = s.latencies.length ? sum(s.latencies) / s.latencies.length : 0;
  const irtMean = s.irts.length ? sum(s.irts) / s.irts.length : 0;
  const latencyLive = s.latencyStartedAt === null ? 0 : Math.max(0, (nowMs - s.latencyStartedAt) / 1000);

  const partialYes = s.partial.filter(Boolean).length;
  const wholeYes = s.whole.filter(Boolean).length;
  const mtsScored = s.mts.filter((m) => m !== null).length;
  const mtsYes = s.mts.filter((m) => m === 'Yes').length;

  const pctTotal = s.pctCorrect + s.pctIncorrect;
  const percentage = pct(s.pctCorrect, pctTotal);

  const coldScored = s.coldProbe.filter((c) => c !== null).length;
  const coldCorrect = s.coldProbe.filter((c) => c === '+').length;

  const accuracyErrorTotal = sum(s.accuracyErrors.map((e) => e.count));
  const accuracyTotal = s.accuracyCorrect + accuracyErrorTotal;
  const accuracyPercent = pct(s.accuracyCorrect, accuracyTotal);

  const ioaPercent = Math.max(s.ioa1, s.ioa2) > 0 ? Math.round((Math.min(s.ioa1, s.ioa2) / Math.max(s.ioa1, s.ioa2)) * 100) : null;

  const stepsScored = s.steps.filter((x) => x.done !== null).length;
  const stepsDone = s.steps.filter((x) => x.done === true).length;
  const integrityPercent = stepsScored ? pct(stepsDone, stepsScored) : null;

  // Trials-to-criterion: the last two saved sessions plus today's live score.
  const prior = history.slice(-(MASTERY_SESSIONS - 1));
  const criterionSessions: { label: string; pct: number | null }[] = [
    ...prior.map((p, i) => ({ label: `${history.length - prior.length + i + 1}`, pct: p })),
    { label: `${history.length + 1}`, pct: scored.length ? percentIndependent : null },
  ];
  const sessionsAtCriterion = criterionSessions.filter((c) => c.pct !== null && c.pct >= MASTERY_CRITERION).length;

  // Speech: cueing and language sample
  const cueCounts = CUE_LEVELS.map((level) => ({ level, count: s.cueLog.filter((c) => c === level).length }));
  const cueIndependentPercent = s.cueLog.length ? pct(s.cueLog.filter((c) => c === 'Independent').length, s.cueLog.length) : null;
  const cueMeanLevel = s.cueLog.length ? sum(s.cueLog.map((c) => CUE_LEVELS.indexOf(c))) / s.cueLog.length : null;
  const morphemeTotal = sum(s.utterances.map((u) => u.morphemes));
  const mlu = s.utterances.length ? morphemeTotal / s.utterances.length : null;

  // Speech: WH-question drill
  const drillTotal = s.drill.independent + s.drill.prompted + s.drill.incorrect;
  const drillPercent = drillTotal ? pct(s.drill.independent, drillTotal) : null;

  // Speech: AAC core selections
  const aacSpontaneousPercent = s.aacLog.length ? pct(s.aacLog.filter((a) => a.spontaneous).length, s.aacLog.length) : null;
  const aacDistinct = new Set(s.aacLog.map((a) => a.word)).size;

  // Remedial: fluency probes (rates are per minute), errors, rubric
  // Pooled rate (all correct ÷ all minutes), so a very short probe cannot skew the figure.
  const probeRate = (kind: ProbeKind, field: 'correct' | 'incorrect' = 'correct') => {
    const ps = s.probes.filter((p) => p.kind === kind && p.seconds > 0);
    const minutes = sum(ps.map((p) => p.seconds)) / 60;
    return ps.length && minutes > 0 ? sum(ps.map((p) => p[field])) / minutes : null;
  };
  const errorCount = sum(s.errorTypes.map((e) => e.count));
  const rubricScored = s.rubric.filter((r) => r.score !== null);
  const rubricPercent = rubricScored.length ? Math.round((sum(rubricScored.map((r) => r.score as number)) / (rubricScored.length * 4)) * 100) : null;

  const baselineValues = s.baseline.filter((b) => b.phase === 'Baseline').map((b) => b.value);

  const isTrialGridActive = (plan: PlanLike) =>
    plan.procedureIds.includes('dtt') || plan.measureIds.includes('trial_by_trial');

  const buildSummary = (plan: PlanLike): SavedSession['summary'] => {
    const has = (id: string) => plan.measureIds.includes(id);
    return {
      percentIndependent: isTrialGridActive(plan) && scored.length ? percentIndependent : null,
      scoredTrials: scored.length,
      frequency: has('frequency') ? s.frequency : null,
      ratePerMinute: has('rate') && s.rateSeconds > 0 ? Number(ratePerMinute.toFixed(2)) : null,
      meanDurationSec: has('duration') && s.durationEpisodes.length ? Math.round(durationMean) : null,
      meanLatencySec: has('latency') && s.latencies.length ? Number(latencyMean.toFixed(1)) : null,
      meanIrtSec: has('irt') && s.irts.length ? Number(irtMean.toFixed(1)) : null,
      partialPercent: has('partial_interval') ? pct(partialYes, s.partial.length) : null,
      wholePercent: has('whole_interval') ? pct(wholeYes, s.whole.length) : null,
      mtsPercent: has('mts') && mtsScored ? pct(mtsYes, mtsScored) : null,
      ioaPercent: s.ioaOn || has('ioa') ? ioaPercent : null,
      integrityPercent: has('treatment_integrity') ? integrityPercent : null,
      coldProbePercent: has('cold_probe') && coldScored ? pct(coldCorrect, coldScored) : null,
      accuracyPercent: has('accuracy') && accuracyTotal ? accuracyPercent : null,
      percentageCorrect: has('percentage') && pctTotal ? percentage : null,
      cueIndependentPercent: has('cueing_level') ? cueIndependentPercent : null,
      mlu: has('mlu') && mlu !== null ? Number(mlu.toFixed(2)) : null,
      // AAC and the WH drill can also be used from the goal's own tool panel, so data counts even if not in the plan.
      aacSelections: (has('aac_core') || speech) && s.aacLog.length ? s.aacLog.length : null,
      aacSpontaneousPercent: has('aac_core') || (speech && s.aacLog.length) ? aacSpontaneousPercent : null,
      drillPercent: speech ? drillPercent : null,
      wcpm: has('wcpm') && probeRate('wcpm') !== null ? Number(probeRate('wcpm')!.toFixed(1)) : null,
      digitsPm: has('digits_pm') && probeRate('digits_pm') !== null ? Number(probeRate('digits_pm')!.toFixed(1)) : null,
      rubricPercent: has('writing_rubric') ? rubricPercent : null,
      errorCount: has('error_analysis') && errorCount > 0 ? errorCount : null,
    };
  };

  const buildData = (): DatasheetData => ({
    trials: s.trials,
    promptLevel: s.promptLevel,
    frequency: s.frequency,
    rateResponses: s.rateResponses,
    rateSeconds: s.rateSeconds,
    durationEpisodes: s.durationEpisodes,
    latencies: s.latencies,
    irts: s.irts,
    partialIntervals: s.partial,
    wholeIntervals: s.whole,
    mtsIntervals: s.mts,
    permanentProducts: s.products,
    percentageCorrect: s.pctCorrect,
    percentageTotal: pctTotal,
    trialsToCriterion: sessionsAtCriterion,
    coldProbe: s.coldProbe,
    accuracyErrors: s.accuracyErrors,
    baselineValues,
    ioaObserver1: s.ioa1,
    ioaObserver2: s.ioa2,
    integritySteps: s.steps,
    tokensEarned: s.tokensEarned,
    tokensGoal: 5,
    abc: [],
    operationalDefinition: s.definition,
    accuracyCorrect: s.accuracyCorrect,
    cueLog: s.cueLog,
    utterances: s.utterances,
    aacLog: s.aacLog,
    probes: s.probes,
    errorTypes: s.errorTypes,
    rubric: s.rubric,
    samples: s.samples,
    drill: s.drill,
  });

  return {
    s,
    set,
    isSample,
    clearSample,
    restoreSample,
    // derived
    scoredCount: scored.length,
    independentCount: independent,
    percentIndependent,
    ratePerMinute,
    durationTotal,
    durationMean,
    latencyMean,
    latencyLive,
    irtMean,
    partialYes,
    wholeYes,
    mtsScored,
    mtsYes,
    pctTotal,
    percentage,
    coldScored,
    coldCorrect,
    accuracyErrorTotal,
    accuracyTotal,
    accuracyPercent,
    ioaPercent,
    stepsScored,
    stepsDone,
    integrityPercent,
    criterionSessions,
    sessionsAtCriterion,
    cueCounts,
    cueIndependentPercent,
    cueMeanLevel,
    mlu,
    morphemeTotal,
    drillTotal,
    drillPercent,
    aacSpontaneousPercent,
    aacDistinct,
    probeRate,
    errorCount,
    rubricPercent,
    isTrialGridActive,
    buildSummary,
    buildData,
  };
}

export type BehaviorDatasheet = ReturnType<typeof useBehaviorDatasheet>;
