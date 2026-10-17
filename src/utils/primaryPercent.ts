import type { SavedSession } from '../types';

/**
 * The one percentage that says how the goal is going in a session: independent trials when the sheet
 * has them, otherwise accuracy, percent correct, cold probe or cueing. Null when none was recorded.
 */
export const primaryPercent = (s: SavedSession['summary']): number | null =>
  s.percentIndependent ?? s.taskAnalysisPercent ?? s.drillPercent ?? s.accuracyPercent ?? s.percentageCorrect ?? s.coldProbePercent ?? s.cueIndependentPercent ?? null;
