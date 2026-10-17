import type { TemplateKind } from '../types';

/** Ready-made drafts a supervisor can load, edit and send for senior approval. */
export const STARTER_TEMPLATES: { kind: TemplateKind; title: string; body: string; steps: string[] }[] = [
  { kind: 'soap', title: 'SOAP note (Subjective, Objective, Assessment, Plan)', body: 'S: How the child arrived and what the family reported.\nO: Trials, prompt levels, accuracy, latency, observations.\nA: Progress against the goal and criterion.\nP: What changes next session.', steps: [] },
  { kind: 'dtt', title: 'Discrete-trial data sheet', body: 'Score each trial independent (+), prompted (P) or incorrect (−). Note the prompt level.', steps: ['Present the instruction', 'Wait 3 seconds', 'Prompt if needed', 'Score the trial', 'Reinforce'] },
  { kind: 'bip', title: 'Behavior intervention plan', body: 'Target behavior and operational definition.\nFunction (attention, escape, tangible, sensory).\nReplacement behavior and teaching strategy.\nReinforcement and crisis plan.\nData method (frequency, duration, permanent product) and review date.', steps: [] },
  { kind: 'task_analysis', title: 'Buttoning a shirt', body: 'Backward-chained task analysis.', steps: ['Hold the shirt flat', 'Pinch the button', 'Find the hole', 'Push the button through', 'Pull it through', 'Repeat for each button'] },
  { kind: 'task_analysis', title: 'Hand-washing', body: 'Seven-step task analysis for the sink.', steps: ['Turn on the water', 'Wet hands', 'Pump soap', 'Scrub for 20 seconds', 'Rinse', 'Turn off the water', 'Dry hands'] },
];
