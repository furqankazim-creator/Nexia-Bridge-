/** Brown's stages of language development by mean length of utterance (in morphemes). */
export interface BrownStage {
  stage: string; // "I", "II", ...
  minMlu: number;
  maxMlu: number; // exclusive
  months: string; // typical age range
  note: string;
}

export const BROWN_STAGES: BrownStage[] = [
  { stage: 'I', minMlu: 1.0, maxMlu: 2.0, months: '12–26 months', note: 'Single words and early two-word combinations.' },
  { stage: 'II', minMlu: 2.0, maxMlu: 2.5, months: '27–30 months', note: 'Beginning grammatical morphemes (-ing, plural -s, in/on).' },
  { stage: 'III', minMlu: 2.5, maxMlu: 3.0, months: '31–34 months', note: 'Simple 3-element agent-action-object sentences.' },
  { stage: 'IV', minMlu: 3.0, maxMlu: 3.75, months: '35–40 months', note: 'Embedded phrases and early complex sentences.' },
  { stage: 'V', minMlu: 3.75, maxMlu: 4.5, months: '41–46 months', note: 'Coordinated clauses and varied sentence types.' },
  { stage: 'Post-V', minMlu: 4.5, maxMlu: Infinity, months: '47+ months', note: 'Complex, well-formed sentences.' },
];

/** The stage an MLU falls in, or null when there is no sample yet. Below 1.0 counts as Stage I. */
export const brownStage = (mlu: number | null): BrownStage | null => {
  if (mlu === null || !Number.isFinite(mlu)) return null;
  return BROWN_STAGES.find((s) => mlu < s.maxMlu) ?? BROWN_STAGES[BROWN_STAGES.length - 1];
};

/** How many utterances had 1, 2, 3 or 4+ morphemes. */
export const morphemeBuckets = (utterances: { morphemes: number }[]): { label: string; count: number }[] => {
  const counts = [0, 0, 0, 0];
  for (const u of utterances) counts[Math.min(4, Math.max(1, Math.round(u.morphemes))) - 1] += 1;
  return [
    { label: '1', count: counts[0] },
    { label: '2', count: counts[1] },
    { label: '3', count: counts[2] },
    { label: '4+', count: counts[3] },
  ];
};
