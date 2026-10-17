import { press, fill, pick, scrollTo, w } from './capture-lib.mjs';

const closeIt = async (p) => { await p.evaluate(() => document.querySelector('[aria-label=Close]')?.click()); await w(300); };
// Make sure the plan contains the given in-session tools. Selected chips start with a tick; one tap at a time.
export const toggleInOpenPlan = async (p, names) => {
  for (const n of names) {
    await p.evaluate((n) => { const b = [...document.querySelectorAll('button')].filter((x) => x.offsetParent !== null && x.innerText.includes(n)).pop(); if (b && !b.innerText.trim().startsWith('✓')) b.click(); }, n);
    await w(400);
  }
  await press(p, 'Save plan'); await w(900);
};
export const ensureInPlan = async (p, names) => { await press(p, 'Edit plan'); await w(600); await toggleInOpenPlan(p, names); };

export const THERAPIST_SHOTS = [
  /* ---------------------------------------------------------------- Behavior */
  {
    id: 'behavior-today', group: 'behavior', portal: 'Behavior therapist', title: 'Today – the session datasheet', device: 'm', role: 'Behavior therapist', tab: 'Today', height: 1000,
    lead: 'The therapist’s working page during a one-to-one session. It is built from the plan the therapist chose, so it only shows the tools that are needed. Tapping is faster than writing.',
    marks: [
      ['Edit plan', 'Edit plan', 'Opens the plan: the teaching methods and measurements this datasheet is built from.'],
      ['Report', 'Report', 'Builds a summary of the session that can be sent to the team or the parents.'],
      ['Datasheet', 'Page tabs', 'The datasheet is split into pages (Datasheet, Continuous, Interval and so on). Only the tools in the plan are live.'],
      ['Prompt fading', 'Plan chips', 'The teaching methods chosen in the plan.'],
      ['Target:', 'Today’s goal', 'Which goal this session is about.'],
      [{ sel: '[data-testid=trial-cell], button[aria-label*="Trial"]', nth: 0 }, 'Trial boxes', 'One box per attempt. Tap a box to cycle: + (did it alone), P (needed a prompt), − (got it wrong).'],
    ],
    steps: ['Choose the goal at the top.', 'After each attempt tap the matching box.', 'The percentage updates by itself.', 'Press “Report” at the end to share the session.'],
  },
  {
    id: 'behavior-today-2', group: 'behavior', portal: 'Behavior therapist', title: 'Today – prompt level and counters', device: 'm', role: 'Behavior therapist', tab: 'Today', height: 1000,
    setup: async (p) => { await scrollTo(p, 760); await w(400); },
    lead: 'Further down the same page: how much help the child needed, and the counters for behaviours.',
    marks: [
      ['Prompt level for this trial', 'Prompt level', 'How much help was given, from the least (just a word) to the most (hand over hand).'],
    ],
    steps: ['Pick the level of help that was used for the attempt.', 'Counters and timers below it record how often and how long a behaviour happens.'],
  },
  {
    id: 'behavior-plan', group: 'behavior', portal: 'Behavior therapist', title: 'Edit plan', device: 'm', role: 'Behavior therapist', tab: 'Today', height: 1000,
    setup: async (p) => { await press(p, 'Edit plan'); await w(600); },
    after: async (p) => { await press(p, 'Save plan'); await w(600); },
    lead: 'The plan decides what the Today page looks like. The therapist ticks the teaching methods and the ways of measuring they want, then saves. The datasheet rebuilds itself.',
    marks: [
      ['Plan the session', 'Plan the session', 'This screen sets up the datasheet. Choose what you will use today.'],
      ['Positive reinforcement', 'Teaching methods', 'Tap a method to tick it (a tick appears). Prompt fading and discrete-trial training are ticked here.'],
      ['Save plan', 'Save plan', 'Saves your choices and opens the datasheet. Measures further down the page are chosen the same way.'],
    ],
    steps: ['Press “Edit plan” on the Today page.', 'Tick the methods and measurements.', 'Press Save.'],
  },
  {
    id: 'behavior-targets', group: 'behavior', portal: 'Behavior therapist', title: 'Targets (goals)', device: 'm', role: 'Behavior therapist', tab: 'Targets', height: 1000,
    lead: 'Every goal for the child, written the same way: what it means, what is needed, the steps, and how it is going.',
    marks: [
      ['Add target', 'Add target', 'Write a new goal. It is sent to the supervisor for approval before it counts.'],
      ['Report', 'Report', 'A summary of the goals to share.'],
      ['Awaiting supervisor approval', 'Approval badge', 'Shows where the goal is: waiting, approved, sent back with comments, or rejected.'],
      ['Edit target', 'Edit target', 'Change the wording or the mastery rule. Changing the rule sends it back for approval.'],
      ['Clinical decision support', 'Decision support', 'The app compares the last sessions with the mastery rule and suggests what to do next.'],
    ],
    steps: ['Press “Add target”, fill in the form and save.', 'Watch the badge change once the supervisor decides.', 'Read the suggestion under “Clinical decision support”.'],
  },
  {
    id: 'behavior-graphs', group: 'behavior', portal: 'Behavior therapist', title: 'Graphs', device: 'm', role: 'Behavior therapist', tab: 'Graphs', height: 800,
    lead: 'Pictures of progress, built from the saved sessions. No extra typing is needed.',
    marks: [
      ['Target', 'Choose a goal', 'Pick which goal to draw.'],
      ['% independent', 'What to measure', 'Switch between measures such as % independent, how often, or rate per minute.'],
      ['Criterion', 'Mastery line', 'The dashed line is the finish line. Once the graph stays above it the goal is learned.'],
      ['Prompt level used per session', 'Prompt levels', 'How much help was used in each session.'],
    ],
    steps: ['Choose a goal.', 'Choose a measure.', 'Look for the line moving up toward the dashed finish line.'],
  },
  {
    id: 'behavior-bip', group: 'behavior', portal: 'Behavior therapist', title: 'Behavior plan – logging a behaviour (ABC)', device: 'm', role: 'Behavior therapist', tab: 'BIP', height: 1000,
    lead: 'Where the therapist records challenging behaviours and builds the behavior plan. ABC means: what happened Before, what the child Did, and what happened After.',
    marks: [
      ['ABC log', 'Sections', 'The behavior area has pages: ABC log, Function (why it happens), BIP (the plan), Reinforcers (rewards that work) and Home tasks.'],
      ['Setting', 'Setting', 'Where it happened.'],
      ['Antecedent', 'Before (Antecedent)', 'What happened right before the behaviour.'],
      ['Behavior:', 'Behavior', 'What the child did, described so anyone would agree on it.'],
      ['Consequence', 'After (Consequence)', 'What happened right after.'],
      ['Save ABC event', 'Save', 'Adds the event. After enough events the Function page shows a likely reason for the behaviour.'],
    ],
    steps: ['Fill in Before, Behavior and After.', 'Pick how strong it was and a likely reason, if known.', 'Save. Over time the “Function” page shows patterns.'],
  },
  {
    id: 'behavior-bip-plan', group: 'behavior', portal: 'Behavior therapist', title: 'Behavior plan – the plan page', device: 'm', role: 'Behavior therapist', tab: 'BIP', height: 1000,
    setup: async (p) => { await press(p, 'BIP', { exact: true, last: true }); await w(500); },
    lead: 'The written plan for a child’s challenging behaviour: what it is, why it happens, what to teach instead, and how to respond. Parents see the plan only when it is made active.',
    marks: [
      ['Target behavior', 'Target behavior', 'The behaviour the plan is about, named simply.'],
      ['Operational definition', 'Definition', 'A description so clear that two people would agree whether it happened.'],
      ['Function of the behavior', 'Why it happens', 'Pick the likely reason: attention, escaping something, getting something, or sensory.'],
      ['Replacement behavior', 'Replacement behavior', 'What the child should do instead (for example ask for a break).'],
      ['Insert suggested replacement', 'Suggestion link', 'Fills in a sensible replacement for the reason you picked.'],
      ['How it will be taught', 'How it will be taught', 'The teaching steps.'],
    ],
    steps: ['Fill in the plan, step by step.', 'Keep it as a draft while it is being written.', 'Make it active when it is ready. The supervisor can read it and the parents can see it.'],
  },
  {
    id: 'behavior-notes', group: 'behavior', portal: 'Behavior therapist', title: 'Notes – session notes with voice writing', device: 'm', role: 'Behavior therapist', tab: 'Notes', height: 1000,
    lead: 'Each session ends with a note in four parts called SOAP. The therapist can type, or press a microphone and speak.',
    marks: [
      ['Auto-Draft', 'Auto-Draft', 'Fills the note from the numbers already recorded in the session.'],
      ['Dictation language', 'Spoken language', 'Choose English, Arabic or Urdu before speaking.'],
      ['Dictate S', 'Dictate (microphone)', 'Press, speak, and the words appear in the box. Say “comma”, “full stop” or “new line” to add punctuation. Press again to stop.'],
      ['Subjective Observation', 'S – Subjective', 'How the child seemed and what the family said.'],
      ['Translate', 'Translate', 'Turns the text into another language.'],
      ['Objective Metrics', 'O – Objective', 'The numbers: trials, accuracy, time.'],
    ],
    steps: ['Press “Auto-Draft”.', 'Press a microphone and speak to add or fix a part.', 'Share the note with the family or the team.'],
  },

  /* ---------------------------------------------------------------- Speech */
  {
    id: 'speech-today', group: 'speech', portal: 'Speech therapist', title: 'Today – the session datasheet', device: 'm', role: 'Speech therapist', tab: 'Today', height: 1000,
    lead: 'The speech therapist’s session page. Like the behavior page it is built from the plan; speech adds extra tools that appear only when they are put in the plan.',
    marks: [
      ['Session Active Targets', 'Goals in this session', 'Tap another goal to switch quickly.'],
      ['Edit plan', 'Edit plan', 'Choose methods, measurements and the speech tools.'],
      ['Datasheet', 'Datasheet pages', 'Pages for different ways of measuring.'],
    ],
    steps: ['Pick the goal being practised.', 'Record the child’s answers.', 'Add speech tools in the plan if you want them on this page.'],
  },
  {
    id: 'speech-plan', group: 'speech', portal: 'Speech therapist', title: 'Plan – the speech tools', device: 'm', role: 'Speech therapist', tab: 'Today', height: 1100,
    setup: async (p) => { await press(p, 'Edit plan'); await w(600); await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.includes('WH-question drill')); b?.scrollIntoView({ block: 'center' }); }); await w(400); },
    after: async (p) => { await toggleInOpenPlan(p, ['WH-question drill']); },
    lead: 'Three speech tools can be added to the Today page from the plan. They only appear when ticked here, so the page stays simple.',
    marks: [
      ['WH-question drill', 'WH-question drill', 'A drill for “where, what, who…” questions with counters for independent, prompted and wrong answers.'],
      ['AAC pad with speech output', 'AAC pad', 'A board of picture buttons. The child taps pictures and the device says the words aloud.'],
      ['Articulation drill', 'Articulation drill', 'Practice and scoring of speech sounds.'],
    ],
    steps: ['Press “Edit plan”.', 'Tick the tool you want.', 'Press Save. The tool now appears at the top of the Today page, labelled “From your plan”.'],
  },
  {
    id: 'speech-drill', group: 'speech', portal: 'Speech therapist', title: 'Today – the WH-question drill', device: 'm', role: 'Speech therapist', tab: 'Today', height: 1000,
    setup: async (p) => { await ensureInPlan(p, ['WH-question drill']); },
    lead: 'Once the drill is in the plan it shows at the top of Today. The therapist asks the question, the child answers, and one tap records how it went.',
    marks: [
      ['From your plan', 'Where it comes from', 'The label tells you this tool is on the page because it is in the plan.'],
      ['Where', 'Question type', 'Choose where, what, who, why, when or how.'],
      ['Next prompt', 'Next prompt', 'Shows a new question to ask.'],
      ['Counters (', 'Three counters', 'Independent (the child answered alone), Prompted (needed a hint) and Incorrect. Tap + after each answer; tap − to fix a mistake. The percentage updates by itself.'],
    ],
    steps: ['Pick a question type.', 'Read the question to the child.', 'Tap + under Independent, Prompted or Incorrect.', 'The percentage shows next to “Counters”.'],
  },
  {
    id: 'speech-goals', group: 'speech', portal: 'Speech therapist', title: 'Goals', device: 'm', role: 'Speech therapist', tab: 'Goals', height: 1000,
    lead: 'Each speech goal is written as a small lesson: what it means, what you need, the steps, and what to do next.',
    marks: [
      ['Add goal', 'Add goal', 'Write a new goal. It goes to the supervisor for approval.'],
      ['Approved by supervisor', 'Approval badge', 'Shows if the supervisor has approved the goal, sent it back, or not decided yet.'],
      ['Edit goal', 'Edit goal', 'Change the wording or the rule for mastery.'],
      ['Clinical decision support', 'Suggestion', 'A suggestion for the next step based on recent sessions.'],
    ],
    steps: ['Press “Add goal”, fill in the form (name, how it is measured, steps, materials).', 'Save. The supervisor is told.', 'The badge changes when they decide.'],
  },
  {
    id: 'speech-practice', group: 'speech', portal: 'Speech therapist', title: 'Practice – weekly questions', device: 'm', role: 'Speech therapist', tab: 'Practice', height: 1000,
    lead: 'Speech exercises that go beyond the session: questions for the week, sentence building, sound practice and recordings.',
    marks: [
      ['Weekly questions', 'Four areas', 'Weekly questions, Sentence building, Articulation and Recordings.'],
      ['Add a question', 'Add a question', 'Choose the question word, type the question and the expected answer, then add it to the week.'],
      ['Send to parents', 'Send to parents', 'Sends the week’s questions to the parents so they can practise at home.'],
    ],
    steps: ['Add a few questions for the week.', 'Press “Send to parents”.', 'During the week, mark how the child answered.'],
  },
  {
    id: 'speech-graphs', group: 'speech', portal: 'Speech therapist', title: 'Graphs', device: 'm', role: 'Speech therapist', tab: 'Graphs', height: 800,
    lead: 'The speech goal’s progress as a line. The same page every therapist type has, with speech measures such as no-cue % and cold probe %.',
    marks: [
      ['Target', 'Choose a goal', 'Pick the goal to draw.'],
      ['% independent', 'Measure', 'Switch measure (independent, no-cue, cold probe and more).'],
      ['Criterion', 'Mastery line', 'The dashed finish line.'],
    ],
    steps: ['Choose a goal and a measure.', 'Check the line is rising toward the dashed line.'],
  },
  {
    id: 'speech-family', group: 'speech', portal: 'Speech therapist', title: 'Family – chat with the parents', device: 'm', role: 'Speech therapist', tab: 'Family', height: 900,
    lead: 'Every therapist has a family page: a chat with the child’s parents and a list of home tasks. It looks like WhatsApp.',
    marks: [
      ['Parent chat', 'Two pages', 'Parent chat and Home tasks.'],
      [{ sel: '[data-testid=chat-header]' }, 'Chat header', 'You are talking to the parents of the child shown.'],
      [{ sel: '[data-testid=chat-message][data-mine=true]', nth: 0 }, 'Your message', 'Green, on the right. Two blue ticks mean the parents have read it.'],
      [{ sel: '[data-testid=voice-start]' }, 'Voice note', 'Press to record a voice message. Use the picture and smiley buttons for photos and emoji.'],
    ],
    steps: ['Type a message and press Enter.', 'Open “Home tasks” to give the family something to practise.'],
  },
  {
    id: 'speech-hometasks', group: 'speech', portal: 'Speech therapist', title: 'Family – home tasks', device: 'm', role: 'Speech therapist', tab: 'Family', height: 1000,
    setup: async (p) => { await press(p, 'Home tasks'); await w(500); },
    after: async (p) => { await press(p, 'Parent chat'); },
    lead: 'The therapist gives the family small tasks and sees which ones have been done.',
    marks: [
      ['Assign a home task', 'Assign a task', 'Write the task, how to do it, how often and by when.'],
      ['Assign to family', 'Assign to family', 'Sends the task to the parents’ Home page.'],
      ['Family progress', 'Family progress', 'Shows which tasks the parents ticked off, with any note they wrote.'],
    ],
    steps: ['Write the task.', 'Press “Assign to family”.', 'Check back to see if it was done.'],
  },

  /* ---------------------------------------------------------------- OT */
  {
    id: 'ot-today', group: 'ot', portal: 'Occupational therapist', title: 'Today – the session datasheet', device: 'm', role: 'Occupational therapist', tab: 'Today', height: 1000,
    lead: 'The occupational therapist’s session page, built from the plan. Two OT tools can be added from the plan: task analysis and the sensory diet log.',
    marks: [
      ['Edit plan', 'Edit plan', 'Choose methods, measurements and the OT tools.'],
      ['Datasheet', 'Datasheet pages', 'Pages for the measures in the plan.'],
    ],
    steps: ['Choose the goal.', 'Record the activity on the datasheet.', 'Add the OT tools in the plan if you want them on this page.'],
  },
  {
    id: 'ot-plan', group: 'ot', portal: 'Occupational therapist', title: 'Plan – the OT tools', device: 'm', role: 'Occupational therapist', tab: 'Today', height: 1100,
    setup: async (p) => { await press(p, 'Edit plan'); await w(600); await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.innerText.includes('Task analysis activity')); b?.scrollIntoView({ block: 'center' }); }); await w(400); },
    after: async (p) => { await toggleInOpenPlan(p, ['Task analysis activity', 'Sensory diet & proprioceptive log']); },
    lead: 'The two OT tools are chosen here. They only appear on the Today page when ticked.',
    marks: [
      ['Task analysis activity', 'Task analysis activity', 'Breaks an everyday job (buttoning a shirt, washing hands) into small steps you score one by one.'],
      ['Sensory diet & proprioceptive log', 'Sensory diet log', 'A log of calming and alerting activities (for example deep pressure) and how the child felt before and after.'],
    ],
    steps: ['Press “Edit plan”.', 'Tick the OT tools you want.', 'Press Save.'],
  },
  {
    id: 'ot-tools', group: 'ot', portal: 'Occupational therapist', title: 'Today – task analysis and sensory diet', device: 'm', role: 'Occupational therapist', tab: 'Today', height: 1300,
    setup: async (p) => { await ensureInPlan(p, ['Task analysis activity', 'Sensory diet & proprioceptive log']); },
    lead: 'Once the tools are in the plan they appear at the top of Today, each labelled “From your plan”.',
    marks: [
      ['Task analysis activity', 'Task analysis', 'Start from a template (shirt buttons, hand washing…) or write your own, then score each step.'],
      ['New Task', 'New Task', 'Create a task with your own steps.'],
      ['Buttoning Standard Shirt', 'Ready-made templates', 'Tap one to start with the steps already filled in.'],
      ['Sensory diet & proprioceptive log', 'Sensory diet', 'Choose the activity (for example proprioceptive or deep pressure) and how the child was before and after.'],
    ],
    steps: ['Tap a template to start a task.', 'Score each step: did the child do it alone or with help.', 'Log the sensory activity and the child’s state before and after.'],
  },
  {
    id: 'ot-checklists', group: 'ot', portal: 'Occupational therapist', title: 'Checklists – everyday skills', device: 'm', role: 'Occupational therapist', tab: 'Checklists', height: 900,
    setup: async (p) => { await press(p, '+ Buttons a shirt'); await press(p, '+ Zips a jacket'); await w(400); },
    lead: 'A simple list of everyday skills (dressing, using a spoon…) scored by how much help the child needs.',
    marks: [
      ['Add a skill', 'Add a skill', 'Type a skill or tap one of the suggestions.'],
      ['+ Holds pencil', 'Suggestions', 'Tap a suggestion to add it.'],
    ],
    steps: ['Add the skills to watch.', 'For each skill choose how independent the child was.', 'The percentage independent shows in the session report.'],
  },
  {
    id: 'ot-goals', group: 'ot', portal: 'Occupational therapist', title: 'Goals', device: 'm', role: 'Occupational therapist', tab: 'Goals', height: 900,
    lead: 'The OT goals, written the same way as every other goal and approved by the supervisor.',
    marks: [
      ['Add', 'Add goal', 'Write a new goal for the supervisor to approve.'],
      ['Edit', 'Edit', 'Change a goal.'],
    ],
    steps: ['Add a goal.', 'Wait for the supervisor’s decision (shown as a badge).'],
  },
  {
    id: 'ot-family', group: 'ot', portal: 'Occupational therapist', title: 'Family', device: 'm', role: 'Occupational therapist', tab: 'Family', height: 900,
    lead: 'The same family page as every therapist: chat with the parents and home tasks.',
    marks: [
      [{ sel: '[data-testid=chat-header]' }, 'Chat', 'A WhatsApp-style chat with the child’s parents.'],
      ['Home tasks', 'Home tasks', 'Give the family tasks and see which were done.'],
    ],
    steps: ['Send a message or a photo.', 'Assign a home task.'],
  },

  /* ---------------------------------------------------------------- Remedial */
  {
    id: 'remedial-today', group: 'remedial', portal: 'Remedial teacher', title: 'Today – the session datasheet', device: 'm', role: 'Remedial teacher', tab: 'Today', height: 1000,
    lead: 'For one-to-one or small-group learning support (reading, maths, writing). The datasheet is built from the plan and uses school measures such as words per minute.',
    marks: [
      ['Edit plan', 'Edit plan', 'Choose teaching methods (for example explicit instruction, token economy) and measures (for example words correct per minute).'],
      ['Token economy', 'Token board', 'Stars the child earns toward a reward.'],
      ['Rate', 'Rate', 'How many correct answers per minute. Use +1 for each, Start for the timer.'],
      ['Percentage', 'Percentage', 'Correct answers as a percentage.'],
    ],
    steps: ['Choose the goal.', 'Use +1 and the timer, or the trial boxes.', 'Write the note and save.'],
  },
  {
    id: 'remedial-goals', group: 'remedial', portal: 'Remedial teacher', title: 'Goals', device: 'm', role: 'Remedial teacher', tab: 'Goals', height: 900,
    lead: 'Learning goals for reading, maths and writing, approved by the supervisor.',
    marks: [['Add', 'Add goal', 'Write a new goal.']],
    steps: ['Add a goal.', 'See its approval status.'],
  },
  {
    id: 'remedial-graphs', group: 'remedial', portal: 'Remedial teacher', title: 'Graphs', device: 'm', role: 'Remedial teacher', tab: 'Graphs', height: 800,
    lead: 'Progress lines for the learning goals, including words per minute.',
    marks: [['Target', 'Choose a goal', 'Pick the goal to draw.']],
    steps: ['Choose a goal and a measure.'],
  },
];
