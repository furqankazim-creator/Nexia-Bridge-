export type DecisionAction = 'collect_baseline' | 'advance' | 'continue' | 'adjust';

export interface Decision {
  action: DecisionAction;
  /** Short suggestion, e.g. "continue current target". */
  suggestion: string;
  /** Which rule produced it, shown to the therapist. */
  rule: string;
  /** The numbers behind it, in plain words. */
  reasons: string[];
  /** The scores that were looked at (oldest first). */
  scores: number[];
  latest: number | null;
}

export const parseMastery = (criterion: string, fallbackThreshold: number): { threshold: number; sessions: number } => {
  const pct = criterion.match(/(\d{1,3})\s*%/);
  const sess = criterion.match(/across\s+(\d{1,2})/i);
  return { threshold: pct ? Number(pct[1]) : fallbackThreshold, sessions: sess ? Math.max(1, Number(sess[1])) : 3 };
};

/**
 * A transparent, rule-based suggestion for what to do next with a goal.
 * `scores` are the goal's main percentage per session, oldest first.
 */
export function decide(input: { status: string; threshold: number; sessions: number; scores: number[] }): Decision {
  const { threshold: T, sessions: N } = input;
  const scores = input.scores.slice(-Math.max(N, 3));
  const latest = scores.length ? scores[scores.length - 1] : null;
  const base = { scores, latest };

  if (latest === null || input.status === 'baseline') {
    return {
      ...base,
      action: 'collect_baseline',
      suggestion: 'collect baseline data',
      rule: 'Baseline first',
      reasons: [scores.length ? `The goal is still in the baseline phase (${scores.length} session${scores.length === 1 ? '' : 's'} recorded).` : 'No sessions recorded for this goal yet.', 'Record at least 3 baseline sessions before starting teaching, so progress can be judged fairly.'],
    };
  }

  const lastN = scores.slice(-N);
  const met = lastN.length >= N && lastN.every((s) => s >= T);
  if (met) {
    return {
      ...base,
      action: 'advance',
      suggestion: 'mastery met: advance to the next target or start generalization',
      rule: 'Mastery criterion met',
      reasons: [`The last ${N} sessions were ${lastN.join('%, ')}%, all at or above the ${T}% criterion.`, 'Move to the next level, or probe the skill with new people and settings (generalization).'],
    };
  }

  const prev = scores.length > 1 ? scores[scores.length - 2] : null;
  const lastThree = scores.slice(-3);
  const flatOrFalling = lastThree.length === 3 && lastThree[1] <= lastThree[0] && lastThree[2] <= lastThree[1];
  if (flatOrFalling && latest < 60) {
    return {
      ...base,
      action: 'adjust',
      suggestion: 'review the teaching plan',
      rule: 'No progress and below 60%',
      reasons: [`The last three sessions were ${lastThree.join('%, ')}%: not improving, and the latest is below 60%.`, 'Check the prompt level, simplify the task or break it into smaller steps, and review the reinforcer.'],
    };
  }

  if (latest >= T) {
    const atCrit = lastN.filter((s) => s >= T).length;
    return {
      ...base,
      action: 'continue',
      suggestion: 'continue current target',
      rule: 'Criterion reached once',
      reasons: [`The latest session (${latest}%) reached the ${T}% criterion, but mastery needs ${N} sessions in a row (${atCrit} so far).`, 'Keep teaching the same target.'],
    };
  }
  if (latest >= T - 10) {
    return {
      ...base,
      action: 'continue',
      suggestion: 'continue current target and fade prompts',
      rule: 'Within 10 points of the criterion',
      reasons: [`The latest session (${latest}%) is ${T - latest} point${T - latest === 1 ? '' : 's'} below the ${T}% criterion.`, 'Continue, and begin fading prompts.'],
    };
  }
  if (prev !== null && latest > prev) {
    return {
      ...base,
      action: 'continue',
      suggestion: 'continue current target',
      rule: 'Improving',
      reasons: [`Scores rose from ${prev}% to ${latest}% since the previous session.`, `Still ${T - latest} points below the ${T}% criterion, so keep going.`],
    };
  }
  return {
    ...base,
    action: 'continue',
    suggestion: 'continue current target',
    rule: 'Below criterion, no clear trend yet',
    reasons: [`The latest session was ${latest}%, ${T - latest} points below the ${T}% criterion.`, 'There is not enough of a pattern to change anything yet. Review again after the next session.'],
  };
}
