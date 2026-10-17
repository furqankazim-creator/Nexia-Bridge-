import type { SavedSession, Target } from '../types';

export interface TherapyReportInput {
  heading: string; // e.g. "SPEECH & LANGUAGE SESSION REPORT"
  goalsHeading: string; // e.g. "SPEECH GOALS"
  childName: string;
  age?: number;
  therapist: string;
  targetName: string;
  summary: SavedSession['summary'];
  /** Extra sections (already formatted, one string each), e.g. weekly questions. */
  extra: string[];
  goals: Target[];
}

/** One line per measure that was actually recorded; unrecorded measures are left out. */
export const summaryLines = (s: SavedSession['summary']): string[] => {
  const out: string[] = [];
  if (s.percentIndependent !== null) out.push(`Independent: ${s.percentIndependent}% (${s.scoredTrials} trials)`);
  if (s.taskAnalysisPercent != null) out.push(`Task analysis: ${s.taskAnalysisPercent}% of steps independent`);
  if (s.drillPercent != null) out.push(`WH-question drill: ${s.drillPercent}% independent`);
  if (s.cueIndependentPercent != null) out.push(`Trials with no cue: ${s.cueIndependentPercent}%`);
  if (s.meanLatencySec !== null) out.push(`Response latency: ${s.meanLatencySec}s average`);
  if (s.coldProbePercent != null) out.push(`Cold probe: ${s.coldProbePercent}%`);
  if (s.accuracyPercent != null) out.push(`Accuracy: ${s.accuracyPercent}%`);
  if (s.percentageCorrect != null) out.push(`Percent correct: ${s.percentageCorrect}%`);
  if (s.mlu != null) out.push(`MLU: ${s.mlu} morphemes`);
  if (s.aacSelections != null) out.push(`AAC core selections: ${s.aacSelections}${s.aacSpontaneousPercent != null ? ` (${s.aacSpontaneousPercent}% spontaneous)` : ''}`);
  if (s.wcpm != null) out.push(`Words correct per minute: ${s.wcpm}`);
  if (s.digitsPm != null) out.push(`Digits correct per minute: ${s.digitsPm}`);
  if (s.rubricPercent != null) out.push(`Writing rubric: ${s.rubricPercent}%`);
  if (s.errorCount != null) out.push(`Errors tallied: ${s.errorCount}`);
  if (s.meanDurationSec !== null) out.push(`Mean duration: ${s.meanDurationSec}s`);
  if (s.frequency !== null) out.push(`Frequency: ${s.frequency}`);
  if (s.ratePerMinute !== null) out.push(`Rate: ${s.ratePerMinute}/min`);
  if (s.partialPercent !== null) out.push(`Partial interval: ${s.partialPercent}%`);
  if (s.wholePercent !== null) out.push(`Whole interval: ${s.wholePercent}%`);
  if (s.mtsPercent !== null) out.push(`MTS: ${s.mtsPercent}%`);
  if (s.ioaPercent !== null) out.push(`IOA: ${s.ioaPercent}%`);
  if (s.integrityPercent !== null) out.push(`Treatment integrity: ${s.integrityPercent}%`);
  return out;
};

export const therapyReportText = (r: TherapyReportInput): string => {
  const parts: string[] = [
    `${r.heading} — ${r.childName}${r.age ? ` (${r.age} yrs)` : ''}`,
    `Therapist: ${r.therapist}`,
    `Goal: ${r.targetName}`,
  ];
  const lines = summaryLines(r.summary);
  parts.push('', 'THIS SESSION', ...(lines.length ? lines.map((l) => `• ${l}`) : ['• No measures recorded yet.']));
  for (const section of r.extra) if (section.trim()) parts.push('', section);
  if (r.goals.length) {
    parts.push('', r.goalsHeading);
    for (const g of r.goals) parts.push(`• ${g.name}: ${g.currentPerformance}% (criterion ${g.masteryCriterion}) — ${g.status}`);
  }
  return parts.join('\n');
};
