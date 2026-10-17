import type { Target } from '../types';

/** Clinically approved goal wording a supervisor can start from. Every item can be edited before it is added. */
export interface BankGoal {
  discipline: Target['discipline'];
  name: string;
  domain: string;
  operationalDefinition: string;
  masteryCriterion: string;
  promptLevel: string;
}

const HIER = 'Full physical → partial physical → model → gestural → independent';

export const GOAL_BANK: BankGoal[] = [
  { discipline: 'speech', name: 'Answering WH questions (who, what, where)', domain: 'Receptive and expressive language', operationalDefinition: 'Given a picture scene and a who, what or where question, the child answers with a correct word or phrase within 5 seconds without a prompt.', masteryCriterion: '80% across 3 sessions', promptLevel: HIER },
  { discipline: 'speech', name: 'Building 3-word sentences', domain: 'Expressive language', operationalDefinition: 'Given a picture and a sentence starter, the child says a grammatical 3-word sentence.', masteryCriterion: '80% across 3 sessions', promptLevel: 'Model → partial model → independent' },
  { discipline: 'speech', name: 'Requesting with AAC', domain: 'Communication', operationalDefinition: 'The child selects the correct AAC symbol to request a preferred item without a physical prompt.', masteryCriterion: '90% across 3 sessions', promptLevel: HIER },
  { discipline: 'ot', name: 'Fastening buttons on a vest', domain: 'Fine motor and dressing', operationalDefinition: 'The child pushes 5 buttons through slots on a vest independently, top to bottom.', masteryCriterion: '80% across 3 sessions', promptLevel: 'Hand-over-hand → touch cue → verbal → independent' },
  { discipline: 'ot', name: 'Washing hands with a task analysis', domain: 'Self-care', operationalDefinition: 'The child completes the 7-step hand-washing sequence with no more than one prompt.', masteryCriterion: '90% across 3 sessions', promptLevel: HIER },
  { discipline: 'ot', name: 'Tripod pencil grasp for 5 minutes', domain: 'Fine motor', operationalDefinition: 'The child holds a pencil with a functional tripod grasp while drawing for 5 minutes.', masteryCriterion: '80% across 3 sessions', promptLevel: 'Physical → gestural → independent' },
  { discipline: 'behavior', name: 'Requesting help instead of problem behavior', domain: 'Functional communication', operationalDefinition: 'When a task is difficult, the child says "help" or hands the help card within 3 seconds instead of crying or dropping to the floor.', masteryCriterion: '90% across 3 sessions', promptLevel: HIER },
  { discipline: 'behavior', name: 'Waiting for a preferred item (30 seconds)', domain: 'Self-regulation', operationalDefinition: 'The child waits 30 seconds with a calm body when told "wait" without grabbing the item.', masteryCriterion: '80% across 3 sessions', promptLevel: 'Visual timer → verbal → independent' },
  { discipline: 'remedial', name: 'Counting objects 1 to 10', domain: 'Early maths', operationalDefinition: 'The child touches each object once and says the final number for sets of 1 to 10.', masteryCriterion: '90% across 3 sessions', promptLevel: 'Model → partial → independent' },
  { discipline: 'remedial', name: 'Reading decodable text (words correct per minute)', domain: 'Reading fluency', operationalDefinition: 'The child reads grade-level decodable text at the target words correct per minute with fewer than 3 errors.', masteryCriterion: '80% across 3 sessions', promptLevel: 'Echo reading → paired reading → independent' },
  { discipline: 'teacher', name: 'Answering a peer question in circle time', domain: 'Classroom participation', operationalDefinition: 'The child answers a peer greeting or question within 5 seconds using words or a communication card.', masteryCriterion: '80% across 3 sessions', promptLevel: 'Peer prompt → gestural → independent' },
  { discipline: 'teacher', name: 'Following a 2-step classroom direction', domain: 'Receptive language', operationalDefinition: 'The child completes both steps of a classroom direction without repetition.', masteryCriterion: '80% across 3 sessions', promptLevel: 'Gestural → visual cue → independent' },
];
