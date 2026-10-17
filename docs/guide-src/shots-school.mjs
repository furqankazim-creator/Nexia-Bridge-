import { press, fill, pick, scrollTo, w } from './capture-lib.mjs';

export const SCHOOL_SHOTS = [
  {
    id: 'teacher-today', group: 'teacher', portal: 'Classroom teacher', title: 'Today – record an activity in four taps', device: 'm', role: 'Teacher', tab: 'Today', height: 1000,
    lead: 'Made for a busy classroom. A teacher records how a child managed an activity in under 15 seconds: Student, Goal, Activity, Result. No clinical words.',
    marks: [
      ['New classroom goal', 'New classroom goal', 'Add a goal for the classroom, such as “takes turns in circle time”.'],
      ['1. Student in class', 'Step 1 – Student', 'Tap the child.'],
      ['Goal', 'Step 2 – Goal', 'Choose which goal this activity relates to (one of the child’s clinical goals, or a classroom goal).'],
      ['Activity', 'Step 3 – Activity', 'Type what was happening or tap one of the quick choices (Morning circle, Small-group reading…).'],
      ['Completed independently', 'Step 4 – Result', 'Tap the result. Four choices: completed independently, needed help, partially completed, not completed.'],
    ],
    steps: ['Tap the student.', 'Choose the goal.', 'Choose or type the activity.', 'Tap the result. That is all; a note is optional.'],
  },
  {
    id: 'teacher-today-2', group: 'teacher', portal: 'Classroom teacher', title: 'Today – note, voice and the classroom passport', device: 'm', role: 'Teacher', tab: 'Today', height: 1000,
    setup: async (p) => { await scrollTo(p, 900); await w(400); },
    lead: 'Below the four results: an optional note (typed or spoken), quick phrases, and the “passport” of what works for this child in class.',
    marks: [
      ['Dictate', 'Dictate', 'Speak instead of typing. Works in English or Arabic.'],
      ['+ Raised hand', 'Quick phrases', 'Tap a phrase to add it to the note.'],
      ['Save', 'Save', 'Saves the observation. It also adds a classroom entry to the child’s goal history for the therapists to see.'],
      ['Classroom Passport', 'Classroom passport', 'A reminder of what works best for this child in class, taken from what the therapists recommend.'],
    ],
    steps: ['Add a short note if you like (or press Dictate).', 'Press Save. The therapists and (if you choose) the parents can see it.'],
  },
  {
    id: 'teacher-students', group: 'teacher', portal: 'Classroom teacher', title: 'Students', device: 'm', role: 'Teacher', tab: 'Students', height: 1000,
    lead: 'Every child in the class on one page, with how independent they have been in class.',
    marks: [
      ['100% Indep', 'Independence %', 'How often the child managed alone in class.'],
      ['Focus classroom goal', 'Focus goal', 'The goal being watched for this child.'],
      ['Indep', 'Four boxes', 'How many recorded activities were Independent, Partial, needed Help, or Not yet.'],
      ['Record Activity', 'Record Activity', 'Jumps to the Today page for this child.'],
      ['Logs (', 'Logs', 'Opens the child’s recorded observations.'],
    ],
    steps: ['Find the child.', 'Press “Record Activity” to log something now.', 'Press “Logs” to read what has been recorded.'],
  },
  {
    id: 'teacher-notes', group: 'teacher', portal: 'Classroom teacher', title: 'Notes – classroom logs', device: 'm', role: 'Teacher', tab: 'Notes', height: 800,
    lead: 'Everything recorded in class, newest first. Parents and the therapy team can see these.',
    marks: [
      ['All students', 'Filter by child', 'Show one child at a time.'],
      ['All outcomes', 'Filter by result', 'Show only, for example, the times the child needed help.'],
      ['Share with care team', 'Share with care team', 'Send this observation to the parents, therapists or supervisor.'],
    ],
    steps: ['Filter if you need to.', 'Press “Share with care team” to pass on a good moment or a concern.'],
  },
  {
    id: 'teacher-family', group: 'teacher', portal: 'Classroom teacher', title: 'Family – the school–home bridge', device: 'm', role: 'Teacher', tab: 'Family', height: 900,
    lead: 'A direct WhatsApp-style chat with the child’s parents, for passing on school news and home-practice ideas.',
    marks: [
      [{ sel: '[data-testid=chat-header]' }, 'Chat', 'You are talking to the parents of the child shown at the top.'],
      [{ sel: '[data-testid=chat-message][data-mine=true]', nth: 0 }, 'Your message', 'Green, on the right. Blue ticks mean the parents have read it.'],
      [{ sel: '[data-testid=voice-start]' }, 'Voice note', 'Record a voice message. The picture button sends a photo.'],
    ],
    steps: ['Write a good-news message.', 'Send a photo of the child’s work if you like.'],
  },
];
