export type RoleType = 
  | 'parent' 
  | 'behavior' 
  | 'speech' 
  | 'ot' 
  | 'remedial' 
  | 'teacher' 
  | 'supervisor' 
  | 'admin';

export type StatusChipType = 'Mastered' | 'Improving' | 'Developing' | 'Needs support';

export interface Child {
  id: string;
  name: string;
  age: number;
  avatar: string;
  diagnosis: string;
  caregivers: string[];
  school: string;
  classroom: string;
  assignedTeam: {
    role: RoleType;
    name: string;
    title: string;
  }[];
  todayProgress: {
    area: string;
    status: StatusChipType;
    reason: string;
    score: number;
    criterion: number;
  }[];
  thisWeek: {
    whatWeWorkedOn: string;
    whatChildIsDoingWell: string;
    whatNeedsMorePractice: string;
    howToPracticeAtHome: {
      title: string;
      description: string;
      materials: string[];
      videoDuration: string;
      steps: string[];
    };
  };
}

export interface ConsentGrant {
  id: string;
  childId: string;
  professionalId: string;
  professionalName: string;
  role: RoleType;
  avatar: string;
  domains: {
    communication: boolean;
    math: boolean;
    fineMotor: boolean;
    dressing: boolean;
    attention: boolean;
    clinicalNotes: boolean;
  };
  expiryDate: string;
  lastViewed?: string;
}

export interface GoalHistoryEntry {
  at: string;
  by: string;
  action: 'submitted' | 'approved' | 'returned' | 'rejected' | 'edited' | 'created';
  note?: string;
  /** For edits: what changed, e.g. "Mastery criterion: 80% → 90%". */
  changes?: string[];
}

export interface Target {
  id: string;
  childId: string;
  discipline: 'behavior' | 'speech' | 'ot' | 'remedial' | 'teacher';
  name: string;
  domain: string;
  operationalDefinition: string;
  materials: string[];
  procedureSteps: string[];
  /** Free-text "how the lesson runs and what it needs" (speech goals). */
  procedureNotes?: string;
  masteryCriterion: string; // e.g., "90% across 3 sessions"
  criterionThreshold: number; // e.g. 90
  currentPerformance: number; // e.g. 85
  status: 'baseline' | 'teaching' | 'generalizing' | 'maintenance' | 'mastered';
  suggestedAction: string; // e.g., "Continue current target"
  suggestedNextStep: string; // e.g., "Review related prerequisite skill"
  approvalStatus: 'approved' | 'awaiting_approval' | 'needs_review' | 'rejected';
  lastThreeSessions: number[]; // e.g. [80, 85, 85]
  /** Supervisor's note when a goal was sent back for changes or rejected. */
  reviewNote?: string;
  /** When the therapist acknowledged the supervisor's note. */
  reviewAckAt?: string;
  /** When the goal was submitted (or resubmitted) for approval. */
  submittedAt?: string;
  targetDate?: string; // yyyy-mm-dd
  /** Prompt hierarchy the goal is taught with, e.g. "Full physical → partial → gestural → independent". */
  promptLevel?: string;
  /** Every decision and edit, newest last, so changes stay traceable. */
  history?: GoalHistoryEntry[];
  origin?: string; // Where target came from (e.g. "Aug 2026 IEP Clinical Baseline Assessment")
  therapistName?: string; // Assigned lead specialist
  baseline?: number; // Initial assessment score before therapy (e.g. 20%)
  contributingSessions?: {
    id: string;
    date: string;
    therapistName: string;
    scorePercent: number;
    notes: string;
    trialsRecorded?: string;
    source: 'Clinic Session' | 'Home Practice' | 'Classroom Observation' | 'Telehealth';
  }[];
}

export interface TrialData {
  trialNumber: number;
  result: '+' | 'P' | '-'; // + independent, P prompted, - incorrect
  promptLevel?: 'Independent' | 'Verbal' | 'Gesture' | 'Model' | 'Partial physical' | 'Full physical';
  timestamp: string;
}

export interface SessionRecord {
  id: string;
  childId: string;
  date: string;
  role: RoleType;
  therapistName: string;
  discipline: string;
  targetId: string;
  targetName: string;
  trials: TrialData[];
  frequencyCount: number;
  durationSeconds: number;
  latencySeconds: number;
  ratePerMinute: number;
  notes: string;
  ioaAgreementPercent?: number;
  treatmentIntegrityPercent?: number;
}

export interface ObservationRecord {
  id: string;
  studentId: string;
  studentName: string;
  goal: string;
  activity: string;
  result: 'Completed independently' | 'Needed help' | 'Partially completed' | 'Not completed';
  observation?: string;
  timestamp: string;
  teacherName: string;
  /** The child it is about (same as studentId): lets the note travel with the child's record. */
  childId?: string;
  /** When it was written (ISO). */
  at?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: RoleType;
  action: string;
  resource: string;
  ipAddress?: string;
}

export interface MessageAttachment {
  kind: 'image' | 'audio';
  /** data: URL */
  src: string;
  /** Length of a voice note, in seconds. */
  seconds?: number;
}

export interface MessageItem {
  id: string;
  childId: string;
  senderName: string;
  senderRole: RoleType;
  senderAvatar: string;
  contentEn: string;
  contentAr: string;
  timestamp: string;
  /** When it was sent (ISO). Older demo messages only have the text in `timestamp`. */
  at?: string;
  /** A photo or a voice note sent with (or instead of) text. Stored inline, kept small. */
  attachment?: MessageAttachment;
  goalTag?: string;
  isParent: boolean;
  /** "staff" messages are only visible to the clinical team, never to parents. */
  audience?: 'family' | 'staff';
}

export interface ChatContact {
  id: string;
  name: string;
  roleTitle: string;
  avatarInitial: string;
  avatarBg: string;
  avatarTextColor: string;
  online: boolean;
  timestamp: string;
  lastMessage: string;
  /** Messages from the therapist the parent has not read. */
  unreadCount?: number;
  /** Messages from the parents the therapist has not read. */
  unreadStaff?: number;
  category: 'therapists' | 'school' | 'circle';
  messages: MessageItem[];
}

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'goal' | 'message' | 'session' | 'consent' | 'system';
  read: boolean;
  badge?: string;
}

/** Therapist roles that plan sessions and fill datasheets. */
export type TherapyRole = 'behavior' | 'speech' | 'ot' | 'remedial';

/** The procedures and measurement methods a therapist chose on "Plan the session". */
export interface SessionPlan {
  childId: string;
  role: TherapyRole;
  procedureIds: string[];
  measureIds: string[];
  updatedAt: string;
}

/** Everything captured on a datasheet, keyed by what the plan switched on. */
export interface DatasheetData {
  trials: ('+' | 'P' | '-' | null)[];
  promptLevel: string;
  frequency: number;
  rateResponses: number;
  rateSeconds: number;
  durationEpisodes: number[]; // seconds
  latencies: number[]; // seconds
  irts: number[]; // seconds
  partialIntervals: (boolean | null)[];
  wholeIntervals: (boolean | null)[];
  mtsIntervals: ('Yes' | 'No' | null)[];
  permanentProducts: { label: string; correct: number; total: number }[];
  percentageCorrect: number;
  percentageTotal: number;
  trialsToCriterion: number;
  coldProbe: ('+' | '-' | null)[];
  accuracyErrors: { label: string; count: number }[];
  baselineValues: number[];
  ioaObserver1: number;
  ioaObserver2: number;
  integritySteps: { step: string; done: boolean | null }[];
  tokensEarned: number;
  tokensGoal: number;
  abc: { antecedent: string; behavior: string; consequence: string }[];
  /** Behavior therapist datasheet extras (optional so speech/OT sheets are unaffected). */
  operationalDefinition?: { name: string; definition: string; examples: string; nonExamples: string };
  accuracyCorrect?: number;
  /** Speech datasheet extras. */
  cueLog?: string[];
  utterances?: { text: string; morphemes: number }[];
  aacLog?: { word: string; spontaneous: boolean }[];
  /** Remedial datasheet extras. */
  probes?: { kind: string; correct: number; incorrect: number; seconds: number }[];
  errorTypes?: { label: string; count: number }[];
  rubric?: { label: string; score: number | null }[];
  samples?: { caption: string; photo: string | null }[];
  /** Speech WH-question drill counters. */
  drill?: { independent: number; prompted: number; incorrect: number };
}

/** One saved datasheet. Feeds Targets, Graphs and Notes pages. */
export interface SavedSession {
  id: string;
  childId: string;
  role: TherapyRole;
  therapistName: string;
  targetId: string;
  targetName: string;
  savedAt: string; // ISO
  procedureIds: string[];
  measureIds: string[];
  data: DatasheetData;
  /** Headline numbers computed at save time. */
  summary: {
    percentIndependent: number | null;
    scoredTrials: number;
    frequency: number | null;
    ratePerMinute: number | null;
    meanDurationSec: number | null;
    meanLatencySec: number | null;
    meanIrtSec: number | null;
    partialPercent: number | null;
    wholePercent: number | null;
    mtsPercent: number | null;
    ioaPercent: number | null;
    integrityPercent: number | null;
    /** Optional so older records stay valid. */
    coldProbePercent?: number | null;
    accuracyPercent?: number | null;
    percentageCorrect?: number | null;
    cueIndependentPercent?: number | null;
    mlu?: number | null;
    aacSelections?: number | null;
    aacSpontaneousPercent?: number | null;
    wcpm?: number | null;
    digitsPm?: number | null;
    rubricPercent?: number | null;
    errorCount?: number | null;
    drillPercent?: number | null;
    taskAnalysisPercent?: number | null;
  };
  notes: string;
  /** A supervisor's decision on this session. A missing review means it is still waiting. */
  review?: {
    status: 'signed' | 'changes' | 'retrain';
    by: string;
    at: string;
    note?: string;
    /** When the therapist acknowledged the decision. */
    ackAt?: string;
  };
  /** Comments the supervisor left on the session; the therapist acknowledges them. */
  comments?: { at: string; by: string; text: string }[];
  commentsAckAt?: string;
}


/* ---------- Behavior therapist clinical records ---------- */

export type BehaviorFunction = 'attention' | 'escape' | 'tangible' | 'sensory';

/** One Antecedent-Behavior-Consequence observation. */
export interface ABCRecord {
  id: string;
  childId: string;
  at: string; // ISO date-time of the event
  setting: string;
  antecedent: string;
  behavior: string;
  consequence: string;
  intensity: 1 | 2 | 3; // 1 mild, 2 moderate, 3 severe
  durationSec: number | null;
  probableFunction: BehaviorFunction | null;
  observer: string;
}

/** Behavior Intervention Plan (one per child). */
export interface BipPlan {
  childId: string;
  targetBehavior: string;
  operationalDefinition: string;
  hypothesizedFunction: BehaviorFunction | '';
  antecedentStrategies: string;
  replacementBehavior: string;
  teachingStrategies: string;
  consequenceStrategies: string;
  reinforcement: string;
  crisisPlan: string;
  dataMethod: string;
  reviewDate: string; // yyyy-mm-dd
  status: 'draft' | 'active' | 'under_review';
  version: number;
  updatedAt: string;
}

export interface Reinforcer {
  id: string;
  childId: string;
  name: string;
  category: 'edible' | 'tangible' | 'activity' | 'social' | 'sensory';
  preference: 1 | 2 | 3 | 4 | 5;
  lastAssessedAt: string;
}

export interface HomeTask {
  id: string;
  childId: string;
  title: string;
  instructions: string;
  frequency: string;
  dueDate: string; // yyyy-mm-dd or ''
  assignedBy: string;
  done: boolean;
  doneAt: string | null;
  parentNote: string;
  /** When the therapist assigned it (ISO). Older tasks do not have it. */
  createdAt?: string;
}

/* ---------- Speech therapist records ---------- */

export type WhType = 'who' | 'what' | 'where' | 'when' | 'why' | 'how';

export interface WeeklyQuestion {
  id: string;
  type: WhType;
  text: string;
  /** What a correct answer sounds like (for the therapist and for family practice). */
  answer: string;
  /** + independent, P prompted, - incorrect, null not asked yet */
  result: '+' | 'P' | '-' | null;
}

/** The set of questions practised in one week (weekStart is that week's Monday, yyyy-mm-dd). */
export interface WeeklyQuestionSet {
  id: string;
  childId: string;
  weekStart: string;
  questions: WeeklyQuestion[];
  sentHome: boolean;
}

export interface SentenceAttempt {
  id: string;
  at: string; // ISO
  produced: string;
  promptLevel: string;
  correct: boolean; // matches the target sentence
  independent: boolean; // correct with no prompt
}

export interface SentenceTask {
  id: string;
  childId: string;
  target: string; // the sentence the child should build, e.g. "The dog is on the bed"
  createdAt: string; // ISO
  attempts: SentenceAttempt[];
  /** Optional small picture (data URL) to cue the sentence. */
  image?: string;
}

/** One block of articulation practice: a sound, where it sits in the word, and how it went. */
export type ArticulationLevel = 'isolation' | 'syllable' | 'word' | 'phrase' | 'sentence' | 'conversation';
export type SoundPosition = 'initial' | 'medial' | 'final';
export interface ArticulationLog {
  id: string;
  childId: string;
  at: string; // ISO
  sound: string; // e.g. "s", "r", "ك"
  position: SoundPosition;
  level: ArticulationLevel;
  correct: number;
  approximated: number; // close but not accurate
  incorrect: number;
  note?: string;
}

/** A short recording of the child speaking (stored small, so it can be saved and synced). */
export interface AudioClip {
  id: string;
  childId: string;
  at: string; // ISO
  label: string;
  durationSec: number;
  mime: string;
  data: string; // data URL
  /** "tip" = a spoken tip recorded for the parents; "sample" = the child speaking (staff only). */
  kind?: 'sample' | 'tip';
  note?: string;
  /** About 24 loudness values (0-1) for drawing the waveform. */
  peaks?: number[];
}

/** An OT skills-checklist item (e.g. "Buttons a shirt") and how the child did on it. */
export type ChecklistScore = 'Independent' | 'Prompted' | 'Physical help';
export interface ChecklistItem {
  id: string;
  childId: string;
  name: string;
  score: ChecklistScore | null;
  history: { at: string; score: ChecklistScore }[];
}

/* ---------- Occupational therapist: task analyses and sensory diet ---------- */

/** How much help a step needed, least to most. */
export type StepLevel = 'Independent' | 'Verbal' | 'Model' | 'Physical';
export type Chaining = 'forward' | 'backward' | 'total';

export interface TaskStep {
  id: string;
  text: string;
}

/** One activity broken into ordered steps (e.g. buttoning a shirt) and how the child does on each step. */
export interface TaskAnalysis {
  id: string;
  childId: string;
  title: string;
  domain: string; // OT scope, e.g. "Self-Care & Daily Living (ADLs)"
  chaining: Chaining;
  steps: TaskStep[];
  /** The level scored for each step in the session in progress. A missing step is not scored yet. */
  levels: Record<string, StepLevel>;
  /** One entry per saved session: how many steps were independent. */
  history: { at: string; percent: number; independent: number; total: number }[];
  createdAt: string;
}

export type SensoryActivity = 'proprioceptive' | 'vestibular' | 'tactile' | 'deep_pressure';
export interface SensoryLog {
  id: string;
  childId: string;
  at: string; // ISO
  activity: SensoryActivity;
  pre: 'lethargic' | 'optimal' | 'elevated';
  post: 'regulated' | 'calmed' | 'needs_time';
  strategies: string[];
  note: string;
}


/* ---------- Supervision ---------- */

/** A supervisor asking the administrator to change who works on a case (the admin owns assignment). */
export interface TeamRequest {
  id: string;
  childId: string;
  kind: 'add' | 'remove' | 'swap';
  role: string; // discipline wanted, e.g. "speech"
  staffName: string; // who to remove or swap out ('' when adding)
  note: string;
  requestedBy: string;
  requestedByRole: string;
  at: string;
  status: 'open' | 'done' | 'declined';
  adminNote?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface CaseNote {
  id: string;
  childId: string;
  kind: 'note' | 'meeting' | 'iep_review';
  text: string;
  date: string; // yyyy-mm-dd
  nextReview?: string; // yyyy-mm-dd, for IEP reviews
  author: string;
  authorRole: string;
  at: string;
}

export type FidelityScore = 'correct' | 'incorrect' | 'na';

export interface Observation {
  id: string;
  childId: string;
  therapistName: string;
  goalId?: string;
  goalName?: string;
  date: string; // yyyy-mm-dd
  type: 'live' | 'video' | 'meeting' | 'training';
  durationMin: number;
  steps: { label: string; score: FidelityScore }[];
  /** Treatment integrity: correct steps ÷ scored steps, or null when nothing was scored. */
  fidelity: number | null;
  ioa: { method: 'trial' | 'count'; percent: number; a: number; b: number; trials?: number } | null;
  feedback: string;
  actionItems: string;
  recheckDate?: string;
  observer: string;
  observerRole: string;
  at: string;
  /** The therapist acknowledged this feedback. */
  ackAt?: string;
  /** Competencies the supervisor observed or trained (e.g. "Prompt fading"). */
  competencies?: string[];
}

export type TemplateKind = 'soap' | 'dtt' | 'bip' | 'task_analysis';
export interface ClinicalTemplate {
  id: string;
  childId: 'org';
  kind: TemplateKind;
  title: string;
  /** Free text for SOAP/BIP, or the ordered steps for DTT sheets and task analyses. */
  body: string;
  steps: string[];
  status: 'draft' | 'submitted' | 'approved';
  version: number;
  createdBy: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface SavedReport {
  id: string;
  childId: 'org';
  from: string; // yyyy-mm-dd
  to: string;
  scope: string; // human description of the filters
  narrative: string;
  createdBy: string;
  createdAt: string;
  signedBy?: string;
  signedAt?: string;
  /** Headline numbers frozen when saved, so two months can be compared later. */
  snapshot: { goals: number; sessions: number; avgPerformance: number | null; integrity: number | null; ioa: number | null; mastered: number };
}

/* ---------- Medical records (kept by the parent) ---------- */

export type MedicalCategory = 'diagnosis' | 'doctor' | 'neuro' | 'medication' | 'lab' | 'therapy' | 'school' | 'vaccine' | 'allergy' | 'hospital' | 'insurance' | 'other';
export type ShareRole = 'behavior' | 'speech' | 'ot' | 'remedial' | 'teacher' | 'supervisor';

export interface MedicalFileRef {
  id: string;
  name: string;
  mime: string;
  size: number;
}

/** Who may see a record besides the parent. Private by default. */
export interface MedicalSharing {
  mode: 'private' | 'team' | 'roles';
  roles: ShareRole[];
}

export interface MedicalRecord {
  id: string;
  childId: string;
  category: MedicalCategory;
  title: string;
  date: string; // yyyy-mm-dd: the date of the report, which can be years ago
  provider: string; // doctor, hospital or centre
  notes: string;
  files: MedicalFileRef[];
  sharing: MedicalSharing;
  createdAt: string;
  updatedAt: string;
}

/** Where a person left off in a chat (server mode): messages from others after `at` are unread. */
export interface ReadMark {
  id: string; // `${userId}:${contactId}:${childId}`
  childId: string;
  userId: string;
  contactId: string;
  at: string; // ISO time of the newest message that was read
}
