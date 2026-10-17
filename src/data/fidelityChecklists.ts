/**
 * What a supervisor checks while watching a session. Each discipline teaches differently, so each has its own steps.
 * If the goal itself lists its procedure steps, those are used instead.
 */
export const FIDELITY_STEPS: Record<string, string[]> = {
  speech: [
    'Chooses the right WH question (where, what, who…) and asks it clearly',
    'Waits about 4 seconds before prompting',
    'Uses the least intrusive prompt (model, then partial)',
    'Scores every answer as independent, prompted or incorrect',
    'Gives the reinforcer straight after a correct answer',
  ],
  ot: [
    'Sets up the materials at the right height and position',
    'Gives hand-over-hand help only when needed',
    'Fades the prompts across the session (most to least)',
    'Follows the task-analysis steps in order',
    'Records the prompt level for each step',
  ],
  behavior: [
    'Gives the instruction once, clearly',
    'Waits for the response and notes the latency',
    'Uses the planned prompt level',
    'Reinforces correct responses immediately',
    'Records every trial (independent, prompted, incorrect)',
  ],
  remedial: [
    'Presents the item or text as planned',
    'Times the probe correctly',
    'Marks each error by type',
    'Gives corrective feedback after an error',
    'Records the correct and incorrect counts',
  ],
  teacher: [
    'Gives the direction the planned way',
    'Uses the visual support or peer prompt',
    'Waits before helping',
    'Records the child’s response',
    'Reinforces participation',
  ],
};
export const GENERIC_STEPS = ['Sets up materials and the environment', 'Gives the instruction clearly', 'Uses the planned prompt level', 'Delivers reinforcement correctly', 'Records every trial or response'];

export const stepsFor = (discipline: string | undefined, goalSteps?: string[]): string[] => {
  const own = (goalSteps ?? []).map((s) => s.trim()).filter(Boolean);
  if (own.length >= 2) return own;
  return (discipline && FIDELITY_STEPS[discipline]) || GENERIC_STEPS;
};
