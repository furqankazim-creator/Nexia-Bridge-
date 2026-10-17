import { press, fill, pick, scrollTo, w } from './capture-lib.mjs';

const nav = async (p, label) => { await p.evaluate((l) => { [...document.querySelectorAll('nav button')].find((x) => x.innerText.trim().split('\n').map((t) => t.trim()).includes(l)).click(); }, label); await w(800); await p.evaluate(() => document.querySelectorAll('.app-scroll').forEach((e) => { e.scrollTop = 0; })); await w(200); };
const closeIt = async (p) => { await p.evaluate(() => document.querySelector('[aria-label=Close]')?.click()); await w(400); };
const openChild = async (p, name) => { await p.evaluate((n) => { const b = [...document.querySelectorAll('[data-testid=caseload-child] button[aria-expanded]')].find((x) => x.innerText.includes(n)); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }, name); await w(400); };

const SUP = { role: 'Supervisor', device: 'd', height: 900 };
const ADM = { role: 'Administrator', device: 'd', height: 900 };

export const WEB_SHOTS = [
  /* ---------------------------------------------------------------- Supervisor */
  {
    ...SUP, id: 'sup-review', group: 'supervisor', portal: 'Supervisor', title: 'Review – goals waiting for a decision', tab: 'Review',
    lead: 'The supervisor’s inbox. Everything the therapists have written that needs a decision shows up here, oldest first.',
    marks: [
      ['Goals awaiting approval', 'Goal counter', 'How many new goals are waiting. Tap to show only goals.'],
      ['Sessions to review', 'Session counter', 'How many session records are waiting to be signed off.'],
      ['Filter by discipline', 'Filters', 'Narrow the list by speech, OT, behavior…, by therapist, or by child.'],
      ['Submitted', 'Waiting badge', 'Shows how long the item has been waiting (turns amber, then red, the longer it waits).'],
      ['Approve', 'Approve', 'Accepts the goal as written.'],
      ['Edit then approve', 'Edit then approve', 'Change the mastery rule, the date or the prompt steps, then approve in one go.'],
      ['Return with comment', 'Return with comment', 'Sends it back with what to change. The therapist sees it on their Today page.'],
      ['Reject', 'Reject', 'Says no, with a reason (required).'],
    ],
    steps: ['Read the goal card.', 'Choose Approve, Edit then approve, Return with comment, or Reject.', 'Several goals can be ticked and approved together.'],
  },
  {
    ...SUP, id: 'sup-review-sessions', group: 'supervisor', portal: 'Supervisor', title: 'Review – sessions and notes', tab: 'Review', height: 900,
    setup: async (p) => { await p.evaluate(() => { const e = document.querySelector('[data-testid=session-review]'); e?.scrollIntoView({ block: 'start' }); }); await w(500); },
    lead: 'Below the goals are the therapy sessions waiting for a check. The supervisor reads them and either signs them off or sends them back.',
    marks: [
      [{ sel: '[data-testid=trial-counts]', nth: 0 }, 'Trial counts', 'How many tries were done alone, with a prompt, or wrong.'],
      ['Open', 'Open', 'Opens the full session: the note, the numbers, and a box to leave a comment.'],
      ['Sign off', 'Sign off', 'Says the record is correct and complete.'],
      ['Request correction', 'Request correction', 'Sends it back with what to fix.'],
      ['Flag for re-training', 'Flag for re-training', 'Tells the therapist they need more practice with this skill. A note is required.'],
    ],
    steps: ['Press “Open” to read a session.', 'Press “Comment” beside a sentence to point at it.', 'Then sign off, or send it back.'],
  },
  {
    ...SUP, id: 'sup-session-open', group: 'supervisor', portal: 'Supervisor', title: 'Review – one session open', tab: 'Review', height: 900,
    setup: async (p) => { await p.evaluate(() => { [...document.querySelectorAll('[data-testid=session-review] button')].find((b) => b.innerText === 'Open')?.click(); }); await w(700); },
    after: closeIt,
    lead: 'The full session in one place. Comments are attached to the exact sentence they are about, and the therapist must acknowledge them.',
    marks: [
      [{ sel: '[data-testid=session-figures]' }, 'The numbers', 'Accuracy, and the counts of independent, prompted and incorrect tries.'],
      [{ sel: '[data-testid=note-lines] button', nth: 0 }, 'Comment', 'Press beside a sentence to quote it in your comment.'],
      ['Add a comment', 'Comment box', 'Write what you want the therapist to know, then press Send comment.'],
      ['Correction', 'Decision buttons', 'Sign off, Correction (send back) or Re-train (flag).'],
    ],
    steps: ['Read the note.', 'Press “Comment” next to a sentence, write, and send.', 'Choose a decision.'],
  },
  {
    ...SUP, id: 'sup-children', group: 'supervisor', portal: 'Supervisor', title: 'Children – the whole caseload', tab: 'Children',
    setup: async (p) => { await openChild(p, 'Lama'); },
    lead: 'Every child on the caseload, with how each goal is going and what needs attention.',
    marks: [
      ['How are these numbers', 'How numbers are decided', 'Explains in plain words how the counts and the “On track / At risk / Stalled” labels are worked out.'],
      [{ sel: '[data-testid=caseload-child]', nth: 0 }, 'A child', 'Tap to open. The coloured label shows if something is waiting for you or the child needs support.'],
      [{ sel: '[data-testid=child-alerts]' }, 'Needs your attention', 'Goals that have slowed down, dropped, or have not been practised lately.'],
      [{ sel: '[data-testid=goal-row]', nth: 0 }, 'A goal', 'Shows the score and a label (On track, At risk, Stalled, Mastered, Regressed). Tap it for the full story.'],
      ['Add goal', 'Add goal', 'Write a goal yourself (it is approved straight away) or pick one from the goal bank.'],
      ['Behavior plan', 'Behavior plan', 'Read the child’s behavior plan.'],
      ['Home practice', 'Home practice', 'Give the parents a home task with a length and dates.'],
      ['Case notes', 'Case notes', 'Notes, team meetings and IEP review dates.'],
      ['Team change request', 'Team change request', 'Ask the administrator to add, remove or swap a therapist.'],
    ],
    steps: ['Open a child.', 'Read “Needs your attention”.', 'Tap a goal to see the graph and history.', 'Use the buttons at the bottom for the plan, home practice, notes and team requests.'],
  },
  {
    ...SUP, id: 'sup-goal', group: 'supervisor', portal: 'Supervisor', title: 'Children – one goal in detail', tab: 'Children', height: 1000,
    setup: async (p) => { await openChild(p, 'Lama'); await p.evaluate(() => { [...document.querySelectorAll('[data-testid=goal-row]')].find((b) => b.innerText.includes('Answering WH'))?.click(); }); await w(700); },
    after: closeIt,
    lead: 'Everything about one goal: how it is going, the graph, how much help was needed, and a record of every change.',
    marks: [
      [{ sel: '[data-testid=goal-reason]' }, 'Status in words', 'Why the goal is labelled the way it is.'],
      [{ sel: 'svg[role=img]' }, 'Graph', 'The scores over time. The dashed green line is the finish line (the mastery rule).'],
      [{ sel: '[data-testid=prompt-breakdown]' }, 'Help needed', 'How many tries were done alone, with a prompt, or wrong.'],
      [{ sel: '[data-testid=goal-history]' }, 'History', 'Every approval and every change with who did it and why.'],
      ['Edit goal', 'Edit goal', 'Change the wording, rule, date or steps. A reason is required and goes in the history.'],
    ],
    steps: ['Look at the graph.', 'Read the history.', 'Press “Edit goal” if the goal needs changing (write why).'],
  },

  {
    ...SUP, id: 'sup-add-goal', group: 'supervisor', portal: 'Supervisor', title: 'Children – adding a goal from the goal bank', tab: 'Children', height: 1500,
    setup: async (p) => { await openChild(p, 'Lama'); await press(p, 'Add goal'); await w(500); await press(p, 'Pick from the goal bank'); await w(500); },
    after: closeIt,
    lead: 'The supervisor can write a goal directly. It is approved straight away and the therapist is told. A goal bank offers ready-made wording that has been approved before.',
    marks: [
      ['Discipline', 'Discipline', 'Choose which discipline the goal is for.'],
      [{ sel: '[data-testid=goal-bank]' }, 'Goal bank', 'Tap an entry to fill in the form with approved wording. You can still change it.'],
      ['Mastery criterion', 'Mastery criterion', 'The rule for “learned”, for example “80% across 3 sessions”.'],
      ['Add and approve', 'Add and approve', 'Adds the goal, already approved.'],
    ],
    steps: ['Choose the discipline.', 'Open the goal bank and tap a goal, or type your own.', 'Press “Add and approve”.'],
  },
  {
    ...SUP, id: 'sup-home-practice', group: 'supervisor', portal: 'Supervisor', title: 'Children – giving the parents home practice', tab: 'Children', height: 1100,
    setup: async (p) => { await openChild(p, 'Lama'); await press(p, 'Home practice'); await w(500); },
    after: closeIt,
    lead: 'The supervisor describes a home task, how long it takes and for which dates. It appears on the parents’ Home page.',
    marks: [
      ['Task', 'Task', 'What to do.'],
      ['Minutes', 'Minutes', 'How long the session should last (for example 45).'],
      ['Instructions for the parent', 'Instructions', 'Plain steps for the parent.'],
      ['Publish to the parent', 'Publish', 'Sends it to the parent. Below you can see what is assigned and what has been done.'],
    ],
    steps: ['Describe the task and the dates.', 'Press “Publish to the parent”.', 'Check later to see if it was done and read the parent’s note.'],
  },
  {
    ...SUP, id: 'sup-team-request', group: 'supervisor', portal: 'Supervisor', title: 'Children – asking the administrator to change the team', tab: 'Children', height: 900,
    setup: async (p) => { await openChild(p, 'Maya'); await press(p, 'Team change request'); await w(500); },
    after: closeIt,
    lead: 'The supervisor cannot change who works with a child. They send a request, and the administrator answers it.',
    marks: [
      ['Add a therapist', 'What kind of change', 'Add, remove or swap a therapist.'],
      ['Discipline needed', 'Which discipline', 'Speech, OT, behavior, remedial or classroom.'],
      ['Send to administrator', 'Send to administrator', 'Sends the request. It appears on the administrator’s home page.'],
      [{ sel: '[data-testid=team-request]', nth: 0 }, 'Earlier requests', 'Shows if it is still open, done or declined, and the administrator’s answer.'],
    ],
    steps: ['Choose the kind of change and the discipline.', 'Say why.', 'Press “Send to administrator” and watch the status here.'],
  },
  {
    ...SUP, id: 'sup-staff', group: 'supervisor', portal: 'Supervisor', title: 'Staff – checking the quality of the therapists’ work', tab: 'Staff', height: 1900,
    lead: 'This page is about the therapists, not the children. It shows how well each one is following the plan, and warns when someone needs attention.',
    marks: [
      ['Observe', 'Observe', 'Record that you watched a session (see the next page).'],
      [{ sel: '[data-testid=supervision-alerts]' }, 'Alerts', 'Warnings: low integrity, low agreement, nobody has observed a therapist for too long, notes waiting too long, or a re-check that is due.'],
      [{ sel: '[data-testid=staff-card]', nth: 0 }, 'A therapist', 'Sessions, caseload, notes waiting, integrity, agreement, last observed and hours this month.'],
      [{ sel: '[data-testid=hours-tally]' }, 'Hours this month', 'How much supervision time each therapist has had.'],
      [{ sel: '[data-testid=log-entry]', nth: 0 }, 'Supervision log', 'Each observation, with feedback, and whether the therapist has read it.'],
    ],
    steps: ['Check the alerts at the top.', 'Press “Observe” on a therapist’s card to record a visit.', 'Later, check the log to see the therapist has acknowledged your feedback.'],
  },
  {
    ...SUP, id: 'sup-observe', group: 'supervisor', portal: 'Supervisor', title: 'Staff – recording an observation', tab: 'Staff', height: 1300,
    setup: async (p) => { await press(p, 'Observe', { exact: true, last: false }); await w(500); await pick(p, 'Therapist', 'Dr. Sarah'); await w(500); await p.evaluate(() => document.querySelector('[data-step="1"][data-score="incorrect"]')?.click()); await w(300); },
    after: closeIt,
    lead: 'The supervisor watches a session and ticks off, step by step, whether the therapist did it right. The app does the sums.',
    marks: [
      ['Therapist', 'Therapist', 'Who you watched.'],
      ['Live observation', 'Type of visit', 'Live, video review, meeting or training.'],
      [{ sel: '[data-testid=checklist-title]' }, 'Checklist', 'The steps follow the therapist’s own job (speech steps for speech, OT steps for OT…).'],
      [{ sel: '[data-testid=fidelity-live]' }, 'Integrity %', 'Correct steps divided by steps scored. Steps marked N/A are left out.'],
      [{ sel: '[data-testid=ioa-block]' }, 'Agreement (IOA)', 'Tick this to record a second set of numbers and see how closely you and the therapist agree.'],
      ['Feedback', 'Feedback', 'What you want the therapist to hear. They get it on their screen and must press Acknowledge.'],
      ['Save observation', 'Save', 'Saves the visit and sends the feedback.'],
    ],
    steps: ['Choose the therapist and the type of visit.', 'Mark each step Correct, Incorrect or N/A.', 'Write feedback and save.'],
  },
  {
    ...SUP, id: 'sup-reports', group: 'supervisor', portal: 'Supervisor', title: 'Reports – monthly clinical audit', tab: 'Reports', height: 1000,
    lead: 'The numbers for a month (or any dates you choose), for the whole centre or one child, therapist or discipline.',
    marks: [
      ['This month', 'Period', 'This month, last month, the last 30 days, or your own dates.'],
      ['Report discipline', 'Filters', 'Show one discipline, one therapist or one child.'],
      [{ sel: '[data-testid=org-figures]' }, 'The big numbers', 'Children, goals, sessions, average progress, integrity, agreement, home practice done, and how much is waiting for you.'],
      [{ sel: '[data-testid=child-rows]' }, 'By child', 'Sessions, accuracy, whether it went up or down against the previous period, and how many goals need attention.'],
      [{ sel: '[data-testid=therapist-rows]' }, 'By therapist', 'Sessions, integrity, agreement, how complete the notes are, and how quickly you reviewed them.'],
    ],
    steps: ['Choose the dates.', 'Optionally choose a child, therapist or discipline.', 'Read the numbers, then scroll to the narrative.'],
  },
  {
    ...SUP, id: 'sup-reports-2', group: 'supervisor', portal: 'Supervisor', title: 'Reports – the written summary', tab: 'Reports', height: 1100,
    setup: async (p) => { await pick(p, 'Report child', 'Lama'); await w(300); await p.evaluate(() => { document.querySelector('[data-testid=narrative-box]')?.scrollIntoView({ block: 'start' }); }); await w(500); },
    lead: 'The app writes a first draft from the numbers. The supervisor edits it, signs it, and can save, print or share it.',
    marks: [
      [{ sel: '[data-testid=narrative-box] textarea' }, 'The draft', 'Written for you from the numbers. Change anything you like.'],
      ['Rewrite from the numbers', 'Rewrite', 'Starts the draft again from the latest numbers.'],
      ['Save draft', 'Save draft', 'Keeps it in “Saved reports”.'],
      ['Sign and save', 'Sign and save', 'Puts your name on it. Saved reports can be compared month to month.'],
      ['Export PDF', 'Export PDF', 'Opens your browser’s print window so you can save it as a PDF.'],
      ['Share with the parents', 'Share with the parents', 'Sends a one-child summary to that child’s parents, after you confirm the family agreed.'],
    ],
    steps: ['Read and edit the draft.', 'Press “Sign and save”.', 'Pick one child and press “Share with the parents” if the family wants it.'],
  },
  {
    ...SUP, id: 'sup-templates', group: 'supervisor', portal: 'Supervisor', title: 'Templates', tab: 'Templates', height: 1000,
    lead: 'Standard forms the centre uses: SOAP notes, data sheets, behavior plans and task analyses.',
    marks: [
      ['New', 'New', 'Write a new template.'],
      [{ sel: '[data-testid=template-card]', nth: 0 }, 'A template', 'Each shows its type, its version and who approved it.'],
      ['Send for approval', 'Send for approval', 'A draft becomes “Awaiting approval” until the supervisor approves it.'],
      ['Approve', 'Approve', 'Makes it the approved standard.'],
    ],
    steps: ['Press “New” and write the form.', 'Send it for approval.', 'Approve it. Editing an approved template makes a new version that needs approval again.'],
  },

  /* ---------------------------------------------------------------- Administrator */
  {
    ...ADM, id: 'admin-home', group: 'admin', portal: 'Administrator', title: 'Home – the organization at a glance', tab: 'Home', height: 1300,
    lead: 'The administrator runs the centre: staff accounts, centres, children’s teams and billing. The home page gives the overview and what needs doing.',
    marks: [
      [{ sel: '[data-testid=admin-figures]' }, 'Overview', 'Children, centres, money owed, sessions in the last 30 days, average progress and home practice done. Tap a tile to open the matching page.'],
      [{ sel: '[data-testid=billing-card]' }, 'Billing & subscription', 'The plan, seats used out of seats bought, how often you are billed, and the renewal date.'],
      ['Manage Seats', 'Manage Seats & Invoices', 'Opens the Billing page.'],
      [{ sel: '[data-testid=staff-card]' }, 'Staff accounts', 'How many staff use a seat, and the first few people.'],
      ['Invite New Specialist', 'Invite New Specialist', 'Choose a portal, then create the person’s login.'],
      [{ sel: '[data-testid=requests-card]' }, 'Team change requests', 'Requests from supervisors to add, remove or swap a therapist. Mark them done or decline with a reason.'],
      [{ sel: '[data-testid=audit-card]' }, 'Audit log', 'A record of who did what (sign-ins, new accounts, changes) for privacy rules.'],
    ],
    steps: ['Look at the overview.', 'Answer any team change requests.', 'Use “Invite New Specialist” to add someone.'],
  },
  {
    ...ADM, id: 'admin-portals', group: 'admin', portal: 'Administrator', title: 'Portals – all the children', tab: 'Portals', height: 800,
    setup: async (p) => { await p.evaluate(() => document.querySelector('[data-pill=children]')?.click()); await w(500); },
    lead: 'One page for each part of the organization. “Children” lists every child with their team.',
    marks: [
      [{ sel: '[data-testid=portal-strip]' }, 'Portal buttons', 'One button per group with how many people it holds: Children, Behavior, Speech, OT, Remedial, Teacher, Supervisor, Parents.'],
      ['Add', 'Add', 'Add a child.'],
      ['Archived', 'Active / Archived', 'Switch between current cases and closed (archived) ones.'],
      [{ sel: '[data-testid=case-card]', nth: 0 }, 'A child', 'Tap to change their therapists, move them to another centre, archive them, or get the family code.'],
    ],
    steps: ['Pick a portal button.', 'For children, tap a child to open their options.'],
  },
  {
    ...ADM, id: 'admin-case', group: 'admin', portal: 'Administrator', title: 'Portals – one child’s options', tab: 'Portals', height: 800,
    setup: async (p) => { await p.evaluate(() => document.querySelector('[data-pill=children]')?.click()); await w(400); await p.evaluate(() => document.querySelector('[data-testid=case-card]')?.click()); await w(600); },
    after: closeIt,
    lead: 'What the administrator can do for one child.',
    marks: [
      ['Reassign therapists', 'Reassign therapists', 'Choose exactly which therapists work with this child.'],
      ['Transfer case', 'Transfer case', 'Move the child to another centre. The old centre’s staff lose access; parents keep theirs.'],
      ['New family code', 'New family code', 'Makes a new code for the parents to sign up with. The old code stops working.'],
      ['Archive case', 'Archive case', 'Closes the case. It becomes read-only and leaves the therapists’ lists.'],
      [{ sel: '[data-testid=family-code]' }, 'Family code', 'The code a parent enters to link their account to their child.'],
    ],
    steps: ['Tap a child.', 'Pick what you want to change.'],
  },
  {
    ...ADM, id: 'admin-speech', group: 'admin', portal: 'Administrator', title: 'Portals – a group of staff (Speech)', tab: 'Portals', height: 800,
    setup: async (p) => { await p.evaluate(() => document.querySelector('[data-pill=speech]')?.click()); await w(600); },
    lead: 'Each staff group has its own page: who is in it, how busy they are, and buttons to add or change people.',
    marks: [
      ['Add staff', 'Add staff', 'Create a new staff login for this group.'],
      [{ sel: '[data-testid=portal-figures]' }, 'Figures', 'Active staff, children, goals and sessions in the last 30 days. Counts only: administrators do not see clinical notes.'],
      [{ sel: '[data-testid=person]', nth: 0 }, 'A person', 'Name, title and centre, whether they are active, and how many children they see.'],
      [{ sel: '[data-testid=person-settings]', nth: 0 }, 'Settings', 'Edit the person, reset their password, switch them off, or remove them.'],
    ],
    steps: ['Press “Add staff”.', 'Fill in their details (see the next page).', 'Give them the sign-in details.'],
  },
  {
    ...ADM, id: 'admin-add-staff', group: 'admin', portal: 'Administrator', title: 'Portals – creating a staff login', tab: 'Portals', height: 1300,
    setup: async (p) => { await p.evaluate(() => document.querySelector('[data-pill=speech]')?.click()); await w(500); await press(p, 'Add staff'); await w(500); await fill(p, 'Full name', 'Dana Hamdan'); await fill(p, 'Email', 'dana@example.com'); await fill(p, 'Title', 'Speech-Language Pathologist'); await fill(p, 'Phone', '+966 50 000 0000'); },
    after: closeIt,
    lead: 'The administrator creates the login. The person signs in with the email and the temporary password; the details entered here are shown on their profile.',
    marks: [
      ['Full name', 'Name', 'The person’s name.'],
      ['Email (their sign-in)', 'Email', 'This is their username.'],
      ['Title / credential', 'Title', 'Shown on their profile, for example “Board Certified Behavior Analyst”.'],
      ['Temporary password', 'Temporary password', 'Made for you. Give it to the person privately. You can press “New” for another.'],
      ['Visibility', 'Visibility', 'Assigned children: only the children you pick. Whole centre: every child in the centre, now and later.'],
      ['Create login', 'Create login', 'Creates the account. A card then shows the sign-in details to copy.'],
    ],
    steps: ['Fill in the details.', 'Choose the centre and the children.', 'Press “Create login”.', 'Copy the card that appears and send it to the person.'],
  },

  {
    ...ADM, id: 'admin-login-ready', group: 'admin', portal: 'Administrator', title: 'Portals – the sign-in card', tab: 'Portals', height: 1000,
    setup: async (p) => { await p.evaluate(() => document.querySelector('[data-pill=speech]')?.click()); await w(500); await press(p, 'Add staff'); await w(500); await fill(p, 'Full name', 'Dana Hamdan'); await fill(p, 'Email', 'dana@example.com'); await fill(p, 'Title', 'Speech-Language Pathologist'); await press(p, 'Create login'); await w(900); },
    lead: 'After “Create login” the app shows everything the new person needs. Copy it and send it to them privately.',
    marks: [
      [{ sel: '[data-testid=login-details]' }, 'Sign-in details', 'Name, role, title, centre, children, the server address, email and the temporary password. The password is shown only once.'],
      ['Copy', 'Copy', 'Copies the whole block so you can paste it into a message.'],
    ],
    steps: ['Press Copy.', 'Send it to the person.', 'They sign in and see their own portal. Their profile shows the title and phone you entered.'],
  },
  {
    ...ADM, id: 'admin-centers', group: 'admin', portal: 'Administrator', title: 'Centers', tab: 'Centers', height: 700,
    lead: 'If the organization has more than one site, each is a centre. Staff and children belong to one centre, and that keeps their information separate.',
    marks: [
      ['Add', 'Add', 'Create a centre and choose its type: special education, speech therapy or clinic.'],
      [{ sel: '[data-testid=center-card]', nth: 0 }, 'A centre', 'Shows its type and how many staff and children it has. Tap to rename or archive it.'],
    ],
    steps: ['Press “Add”.', 'Name it and choose the type.', 'Put staff and children in it from the Portals page.'],
  },
  {
    ...ADM, id: 'admin-billing', group: 'admin', portal: 'Administrator', title: 'Billing', tab: 'Billing', height: 900,
    lead: 'Keeps the subscription and the invoices. It records what is owed and paid; it does not take payments.',
    marks: [
      [{ sel: '[data-testid=plan-card]' }, 'Subscription', 'The plan and a bar showing seats used out of seats bought. “Change plan and seats” edits them.'],
      [{ sel: '[data-testid=billing-totals]' }, 'Totals', 'Money in draft, money owed (issued) and money paid.'],
      ['New', 'New', 'Create an invoice (optionally for one child), with a description, amount and due date.'],
      [{ sel: '[data-testid=invoice-card]', nth: 0 }, 'An invoice', 'Tap to issue it, mark it paid, void it or copy it as text.'],
    ],
    steps: ['Press “New” to make a draft.', 'Issue it when ready.', 'Mark it paid when the money arrives.'],
  },
  {
    ...ADM, id: 'admin-settings', group: 'admin', portal: 'Administrator', title: 'Settings – how the whole app is run', tab: 'Settings', height: 1500,
    lead: 'Rules for the whole organization. They apply to every portal straight away.',
    marks: [
      ['Organization name', 'Organization name', 'Shown at the top of every portal.'],
      ['Staff can sign up', 'Staff sign-up', 'On: staff can create their own account with the invite code. Off: only you can.'],
      ['Families can sign up', 'Family sign-up', 'On: parents can join with their child’s code.'],
      [{ sel: '[data-testid=staff-code-box]' }, 'Staff invite code', 'The code staff use to sign up. Show it, copy it, or replace it.'],
      ['New goals need supervisor approval', 'Goal approval', 'On: new goals wait for the supervisor. Off: they are approved at once.'],
      ['Parents can message', 'Parent messaging', 'Off: parents can read messages but not send them.'],
      ['Minimum treatment integrity', 'Supervision limits', 'The limits that decide when a supervisor is warned about a therapist.'],
    ],
    steps: ['Change a switch.', 'It takes effect for everyone straight away.'],
  },
];
