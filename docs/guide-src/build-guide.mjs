// Builds docs/Nexia-Bridge-Client-Guide.pdf from the screenshots and the text in shots.mjs. Usage: node build-guide.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { CHROME } from './capture-lib.mjs';
import { SHOTS } from './shots.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = path.join(here, '..', 'screenshots');
const manifest = JSON.parse(fs.readFileSync(path.join(here, 'manifest.json'), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const img = (id) => `data:image/png;base64,${fs.readFileSync(path.join(SHOT_DIR, `${id}.png`)).toString('base64')}`;
const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

/* ------------------------------------------------------------------ chapter introductions */
const CHAPTERS = [
  { group: 'start', title: 'Getting in', color: '#475569', who: 'Everyone', intro: 'Before anyone sees any child’s information they say who they are. This chapter shows the welcome screen, how to sign in or create an account, and how to switch the language.' },
  { group: 'parent', title: 'The parent’s portal', color: '#E5533D', who: 'Mothers, fathers and carers', intro: 'Parents see how their child is doing in plain words, do the home practice the therapists ask for, and talk to the care team. They see only their own child. Everything is built for a phone.' },
  { group: 'behavior', title: 'The behavior therapist’s portal', color: '#4F46E5', who: 'Behavior analysts (ABA therapists)', intro: 'Behavior therapists teach new skills and work on challenging behaviour. They record each attempt with one tap, write behavior plans, draw graphs of progress and write the session note. Each therapist type has the same layout, so a person who knows one portal can find their way around the others.' },
  { group: 'speech', title: 'The speech therapist’s portal', color: '#0EA5E9', who: 'Speech-language therapists', intro: 'The speech therapist works on talking, understanding and communication. Besides the common pages (Today, Goals, Graphs, Notes, Family) there is a Practice page for weekly questions, sentence building, sound practice and recordings. Special speech tools (the question drill, the picture board that speaks, sound practice) can be added to the Today page from the plan.' },
  { group: 'ot', title: 'The occupational therapist’s portal', color: '#F59E0B', who: 'Occupational therapists (OT)', intro: 'The occupational therapist works on everyday skills: using hands, dressing, handwriting, and calming the body. There is a Checklists page for everyday skills, and two OT tools (task analysis and the sensory diet log) that appear on Today when they are put in the plan.' },
  { group: 'remedial', title: 'The remedial teacher’s portal', color: '#7C3AED', who: 'Learning-support (remedial) teachers', intro: 'Remedial teachers give extra one-to-one or small-group teaching in reading, maths and writing. Their datasheet uses school measures such as words read correctly per minute.' },
  { group: 'teacher', title: 'The classroom teacher’s portal', color: '#10B981', who: 'Classroom teachers', intro: 'The classroom teacher does not need clinical forms. They record how a child managed an activity in class in four taps and no clinical words. The result is shared with the therapists and, if the teacher chooses, the parents. This is how what the child learns in therapy is checked in the real classroom.' },
  { group: 'supervisor', title: 'The supervisor’s portal', color: '#334155', who: 'Clinical supervisors', intro: 'The supervisor makes sure the work is good. They decide on new goals, check session records, watch therapists at work, write reports and keep the centre’s standard forms. This portal works best on a computer screen, so the pictures here are from the web version.' },
  { group: 'admin', title: 'The administrator’s portal', color: '#0F172A', who: 'The person who runs the centre', intro: 'The administrator manages people and money, not the children’s clinical notes. They create staff logins, decide who works with which child, run several centres, keep invoices and set the rules for the whole app. They see counts and summaries only; they cannot read session notes, behavior logs or messages. This portal also works best on a computer screen.' },
];

const ROLES = [
  ['Parent or carer', 'Sees how their child is doing, does home practice, chats with the care team.', 'Only their own child'],
  ['Behavior therapist', 'Teaches skills, records behaviour, writes behavior plans and session notes.', 'The children they are assigned'],
  ['Speech therapist', 'Works on talking and communication; runs speech exercises.', 'The children they are assigned'],
  ['Occupational therapist', 'Works on everyday skills, movement and sensory needs.', 'The children they are assigned'],
  ['Remedial teacher', 'Extra teaching in reading, maths and writing.', 'The children they are assigned'],
  ['Classroom teacher', 'Records how the child manages in class.', 'The children in their class'],
  ['Supervisor', 'Approves goals, checks sessions, observes staff, writes reports.', 'Assigned children, or the whole centre'],
  ['Administrator', 'Creates logins, assigns teams, runs centres, billing and settings.', 'Counts and summaries only; the whole organization or one centre'],
];

const FLOWS = [
  {
    title: 'A new goal, from idea to the parent’s phone',
    steps: [['Therapist', 'writes a goal (Goals page)'], ['Supervisor', 'sees it in Review and approves, edits, returns or rejects it'], ['Therapist', 'sees the decision as a badge (and a note if it was sent back) and presses Acknowledge'], ['Parent', 'sees the approved goal on the Targets page and follows the progress']],
    note: 'The administrator can switch off the approval step (Settings → New goals need supervisor approval). Then goals are approved at once.',
  },
  {
    title: 'A session, from the therapy room to a signed record',
    steps: [['Therapist', 'records the session on Today and writes the note on Notes'], ['Supervisor', 'opens it in Review, comments on a sentence if needed, and signs it off or sends it back'], ['Therapist', 'sees the comment on the plan screen and presses Acknowledge'], ['Parent', 'can read the note the therapist chose to share']],
    note: 'Sessions waiting more than a week are flagged in red so none is forgotten.',
  },
  {
    title: 'Checking the therapist’s own work',
    steps: [['Supervisor', 'watches a session and ticks each step (Staff → Observe)'], ['App', 'works out the integrity % and the agreement (IOA) %'], ['Therapist', 'gets the feedback and presses Acknowledge'], ['Supervisor', 'sees it was read, and the app warns again if a re-check date passes']],
    note: 'The limits (for example 80%) and how often each therapist must be observed are set by the administrator in Settings.',
  },
  {
    title: 'Home, school and clinic talking to each other',
    steps: [['Teacher', 'records a class activity or sends good news'], ['Therapist', 'sees how the skill works in class and updates the plan'], ['Parent', 'reads the update, chats, and ticks off home practice'], ['Supervisor', 'reads everything and writes the monthly report']],
    note: 'Chats look like WhatsApp: ticks show delivered and read, and photos, voice notes and emoji can be sent.',
  },
  {
    title: 'A new person joins, and teams change',
    steps: [['Administrator', 'presses Add staff and creates the login'], ['New person', 'signs in with the email and temporary password and sees their own portal'], ['Supervisor', 'needs another therapist for a child: sends a team change request'], ['Administrator', 'changes the team and marks the request done (or declines with a reason)']],
    note: 'Staff only ever see the children they are assigned to, or their whole centre if the administrator gave them that.',
  },
];

const PRIVACY = [
  ['Goals and progress', 'yes', 'yes', 'yes', 'yes', 'counts and averages'],
  ['Session notes', 'only those shared', 'yes', 'yes', 'yes', 'figures only, never the text'],
  ['Behavior event logs (ABC)', 'no', 'yes', 'no', 'yes', 'no'],
  ['Behavior plan', 'when it is active', 'yes', 'no', 'yes', 'status only'],
  ['Chat messages', 'their own chats', 'yes', 'yes (own chats)', 'yes', 'no'],
  ['“Team only” messages', 'no', 'yes', 'yes', 'yes', 'no'],
  ['Supervisor observations and case notes', 'no', 'no', 'no', 'yes', 'no'],
  ['Standard forms and saved reports', 'no', 'yes', 'no', 'yes', 'no'],
  ['Accounts, centres, invoices, settings', 'no', 'no', 'no', 'no', 'yes'],
  ['Audit log (who did what)', 'no', 'no', 'no', 'no', 'yes'],
];

const GLOSSARY = [
  ['Goal / target', 'A skill the team is teaching, written so that everyone knows what “learned” means.'],
  ['Mastery rule (criterion)', 'The rule that says a skill is learned, for example “80% across 3 sessions”.'],
  ['Baseline', 'Where the child started before teaching began.'],
  ['Independent, prompted, incorrect', 'Three ways to score an attempt: the child did it alone, needed a hint (prompt), or got it wrong.'],
  ['Prompt', 'A hint or help, from a word to hand-over-hand. Teaching aims to reduce help over time (“fading”).'],
  ['SOAP note', 'The standard four-part session note: Subjective (how things seemed), Objective (the numbers), Assessment (what it means), Plan (what next).'],
  ['ABC log', 'A record of a behaviour: what happened Before, what the child Did, what happened After.'],
  ['Behavior plan (BIP)', 'A written plan for a challenging behaviour: why it happens and what to teach and do instead.'],
  ['Task analysis', 'Breaking a job (for example washing hands) into small steps and scoring each step.'],
  ['Discrete-trial teaching (DTT)', 'Teaching in short, separate attempts, each scored on its own.'],
  ['Sensory diet', 'A planned set of calming or alerting activities that help a child stay settled.'],
  ['Treatment integrity (fidelity)', 'How closely a therapist followed the plan: correct steps divided by steps scored.'],
  ['IOA (inter-observer agreement)', 'How closely two people watching the same session agree on the numbers.'],
  ['Generalization', 'Using a skill outside the therapy room, for example in class or at home.'],
  ['IEP', 'Individual Education Plan: the written plan of a child’s learning goals.'],
  ['Seat', 'One licence for one staff member. The plan has a fixed number of seats.'],
];

const LIMITS = [
  'Billing records what is owed and paid, and the invoices. It does not take card payments.',
  'Booking and attendance on the parent’s Sessions page are shown as examples; there is no calendar sync yet.',
  'The PDF button on reports opens your browser’s print window. It may not work inside the phone app; use Copy there.',
  'Voice writing (dictation) depends on the browser’s own speech service. It works best in Chrome. In the phone app it is not available.',
  'Photos and voice notes in chats are small (a short voice note, a reduced photo). There are no videos or documents.',
  'Reminders by push message or WhatsApp are not built. People see new items inside the app (the bell, the red numbers, the Acknowledge cards).',
  'The practice (demo) version keeps its data on one device only. Real accounts, shared data and sign-in need the server.',
];

/* ------------------------------------------------------------------ html pieces */
const legend = (shot) => {
  const placed = manifest[shot.id]?.placed ?? [];
  if (!placed.length) return '';
  return `<ol class="legend">${placed.map((idx, k) => { const [, title, text] = shot.marks[idx]; return `<li><span class="dot">${k + 1}</span><div><b>${esc(title)}</b><br>${esc(text)}</div></li>`; }).join('')}</ol>`;
};
const steps = (shot) => (shot.steps?.length ? `<div class="try"><h5>How to use this page</h5><ol>${shot.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol></div>` : '');

const entry = (shot, color) => {
  const mobile = (shot.device ?? 'm') === 'm';
  const body = mobile
    ? `<div class="cols"><figure class="phone"><img src="${img(shot.id)}" alt="${esc(shot.title)}"></figure><div class="text">${legend(shot)}${steps(shot)}</div></div>`
    : `<figure class="web"><img src="${img(shot.id)}" alt="${esc(shot.title)}"></figure><div class="below">${legend(shot)}${steps(shot)}</div>`;
  return `<section class="entry ${mobile ? 'is-mobile' : 'is-web'}" id="${shot.id}"><div class="entry-head" style="border-color:${color}"><span class="portal" style="color:${color}">${esc(shot.portal)}</span><h3>${esc(shot.title)}</h3></div><p class="lead">${esc(shot.lead)}</p>${body}</section>`;
};

const flowHtml = (f) => `<div class="flow"><h4>${esc(f.title)}</h4><div class="flow-row">${f.steps.map(([who, what], i) => `${i ? '<span class="arrow">→</span>' : ''}<div class="flow-step"><b>${esc(who)}</b><span>${esc(what)}</span></div>`).join('')}</div><p class="flow-note">${esc(f.note)}</p></div>`;

const chaptersHtml = CHAPTERS.map((c, ci) => {
  const items = SHOTS.filter((s) => s.group === c.group && manifest[s.id]);
  return `<section class="chapter" id="chapter-${c.group}"><div class="chapter-cover" style="background:${c.color}"><span class="chapter-no">Chapter ${ci + 3}</span><h2>${esc(c.title)}</h2><p class="who">For: ${esc(c.who)}</p></div><p class="chapter-intro">${esc(c.intro)}</p><h3 class="sub">Pages in this chapter</h3><div class="chapter-pages">${items.map((s) => `<a href="#${s.id}">${esc(s.title)}</a>`).join('')}</div>${items.map((s) => entry(s, c.color)).join('')}</section>`;
}).join('');

const tocPages = fs.existsSync(path.join(here, 'toc-pages.json')) ? JSON.parse(fs.readFileSync(path.join(here, 'toc-pages.json'), 'utf8')) : {};
const toc = [
  ['intro', '1. What Nexia Bridge is'], ['together', '2. How the pieces fit together'],
  ...CHAPTERS.map((c, i) => [`chapter-${c.group}`, `${i + 3}. ${c.title}`]),
  ['glossary', `${CHAPTERS.length + 3}. Words explained`], ['limits', `${CHAPTERS.length + 4}. Practice version, real system, and what is not included`],
];

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Nexia Bridge – a guide for everyone</title><style>
@page { size: A4; margin: 14mm 13mm 16mm; }
* { box-sizing: border-box; }
body { font-family: -apple-system, "Helvetica Neue", Helvetica, Arial, sans-serif; color: #1F1B3A; font-size: 10.5pt; line-height: 1.5; margin: 0; }
h1, h2, h3, h4, h5 { margin: 0; line-height: 1.2; }
.cover { height: 262mm; display: flex; flex-direction: column; justify-content: center; padding: 0 6mm; background: linear-gradient(160deg, #4F46E5 0%, #6D5FF2 55%, #00A884 140%); color: #fff; border-radius: 10px; page-break-after: always; }
.cover .brand { font-size: 13pt; letter-spacing: .14em; text-transform: uppercase; opacity: .85; }
.cover h1 { font-size: 40pt; margin: 8mm 0 4mm; }
.cover p { font-size: 15pt; max-width: 135mm; opacity: .95; margin: 0 0 3mm; }
.cover .meta { margin-top: 22mm; font-size: 10.5pt; opacity: .85; }
.h-page { page-break-before: always; }
.section-title { font-size: 21pt; margin: 0 0 4mm; padding-bottom: 3mm; border-bottom: 3px solid #4F46E5; }
h3.sub { font-size: 13pt; margin: 6mm 0 2mm; }
p { margin: 0 0 3mm; }
.note { background: #EEF2FF; border-left: 4px solid #4F46E5; padding: 3mm 4mm; border-radius: 4px; margin: 4mm 0; }
.warn { background: #FFF7E0; border-left: 4px solid #F59E0B; padding: 3mm 4mm; border-radius: 4px; margin: 4mm 0; }
table { border-collapse: collapse; width: 100%; margin: 3mm 0 5mm; font-size: 9.5pt; }
th, td { border: 1px solid #DDD8CF; padding: 2mm 2.5mm; text-align: left; vertical-align: top; }
th { background: #F4EEE6; }
.toc a { display: block; padding: 2mm 0; border-bottom: 1px dotted #C9C2B6; color: #1F1B3A; text-decoration: none; font-size: 11.5pt; }
.chapter { page-break-before: always; }
.chapter-cover { color: #fff; border-radius: 10px; padding: 14mm 9mm; margin-bottom: 8mm; }
.chapter-pages { margin-top: 6mm; } .chapter-pages a { display: block; padding: 2.2mm 0; border-bottom: 1px dotted #C9C2B6; color: #1F1B3A; text-decoration: none; font-size: 11pt; }
.chapter-no { text-transform: uppercase; letter-spacing: .14em; font-size: 9pt; opacity: .8; }
.chapter-cover h2 { font-size: 25pt; margin: 3mm 0 2mm; }
.chapter-cover .who { margin: 0; font-size: 11pt; opacity: .92; }
.chapter-intro { font-size: 11pt; margin-bottom: 6mm; }
.entry { page-break-before: always; page-break-inside: avoid; }

.entry-head { border-left: 5px solid; padding-left: 4mm; margin-bottom: 3mm; }
.portal { font-size: 9pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
.entry h3 { font-size: 16pt; margin-top: 1mm; }
.lead { font-size: 10.5pt; margin: 0 0 4mm; }
.cols { display: grid; grid-template-columns: 76mm 1fr; gap: 7mm; align-items: start; }
.phone { margin: 0; }
.phone img { width: auto; max-width: 76mm; max-height: 205mm; border-radius: 9px; border: 1px solid #CFC8BC; box-shadow: 0 2px 8px rgba(31,27,58,.18); display: block; }
.web { margin: 0 0 4mm; }
.web img { width: 100%; max-height: 118mm; object-fit: contain; object-position: top left; border-radius: 7px; border: 1px solid #CFC8BC; box-shadow: 0 2px 8px rgba(31,27,58,.18); display: block; }
.web.tall img { width: auto; max-width: 100%; }
.legend { list-style: none; margin: 0 0 4mm; padding: 0; }
.below .legend { columns: 2; column-gap: 8mm; } .below .legend li { margin-bottom: 2mm; font-size: 9.4pt; }
.legend li { display: flex; gap: 3mm; margin-bottom: 2.6mm; break-inside: avoid; font-size: 9.7pt; }
.dot { flex: 0 0 auto; width: 6.2mm; height: 6.2mm; border-radius: 50%; background: #E11D48; color: #fff; font-weight: 700; font-size: 8.6pt; display: flex; align-items: center; justify-content: center; margin-top: .4mm; }
.try { background: #F1FBF7; border: 1px solid #BFE9D8; border-radius: 6px; padding: 3mm 4mm; break-inside: avoid; }
.below .try ol { columns: 2; column-gap: 8mm; }
.try h5 { font-size: 10pt; color: #0B6B53; margin-bottom: 1.5mm; }
.try ol { margin: 0; padding-left: 5mm; font-size: 9.7pt; }
.flow { border: 1px solid #DDD8CF; border-radius: 8px; padding: 4mm; margin: 0 0 5mm; break-inside: avoid; }
.flow h4 { font-size: 11.5pt; margin-bottom: 3mm; color: #4F46E5; }
.flow-row { display: flex; align-items: stretch; gap: 1.5mm; }
.flow-step { flex: 1; background: #F7F5FF; border: 1px solid #DAD5FA; border-radius: 6px; padding: 2.5mm; font-size: 9pt; display: flex; flex-direction: column; gap: 1mm; }
.flow-step b { color: #3730A3; }
.arrow { align-self: center; font-size: 14pt; color: #4F46E5; }
.flow-note { font-size: 9pt; color: #5C5878; margin: 3mm 0 0; }
.ok { color: #0B7A55; font-weight: 600; } .no { color: #B91C1C; }
ul.plain { margin: 0 0 4mm; padding-left: 5mm; } ul.plain li { margin-bottom: 1.6mm; }
.glossary td:first-child { width: 48mm; font-weight: 600; }
.badge-eg { display: inline-flex; width: 5.5mm; height: 5.5mm; border-radius: 50%; background: #E11D48; color: #fff; font-size: 8pt; font-weight: 700; align-items: center; justify-content: center; vertical-align: middle; }
</style></head><body>

<section class="cover">
  <div class="brand">Nexia Bridge</div>
  <h1>A guide for everyone</h1>
  <p>How each page works, what each button does, and how the whole system fits together, in plain words, with pictures.</p>
  <p>Written for the people who will use Nexia Bridge and for the people who decide to buy it. No technical knowledge needed.</p>
  <div class="meta">Version of ${esc(today)} · Pictures come from the practice (demo) version with sample children and sample staff. All names are invented.</div>
</section>

<section class="h-page" id="how-to-read">
  <h2 class="section-title">How to read this guide</h2>
  <p>Each page of the system has one section here. A section has:</p>
  <ul class="plain">
    <li><b>A picture</b> of the real screen.</li>
    <li><b>Red numbers</b> <span class="badge-eg">1</span> on the picture. Find the same number in the list beside or below the picture to learn what that button or box is and what happens when you use it.</li>
    <li><b>“How to use this page”</b>: the steps, in order.</li>
  </ul>
  <p>The system has a different portal for each kind of person. A person only ever sees their own portal. The guide follows the same order as a typical day: how people get in, the parent’s view, the therapists, the teachers, then the supervisor and the administrator who look after quality and running the centre.</p>
  <div class="note"><b>Phone and computer.</b> Parents, therapists and teachers mostly use a phone, so those pictures are phone screens. The supervisor and administrator usually work on a computer, so their pictures are computer screens, with the menu on the left. The same system works on both; the layout adapts to the screen.</div>
  <h3 class="sub">Contents</h3>
  <div class="toc">${toc.map(([id, label]) => `<a href="#${id}" style="display:flex;justify-content:space-between"><span>${esc(label)}</span><span>${tocPages[id] ?? ''}</span></a>`).join('')}</div>
</section>

<section class="h-page" id="intro">
  <h2 class="section-title">1. What Nexia Bridge is</h2>
  <p>Children with autism and other developmental needs are helped by many people: a behavior therapist, a speech therapist, an occupational therapist, a learning-support teacher, a classroom teacher, a supervisor and, most of all, their parents. Normally each person keeps their own notes, so nobody sees the whole picture.</p>
  <p><b>Nexia Bridge puts everyone around one child in one place.</b> Each person records what they do in a way that is quick for them. The system then shares the right parts with the right people, checks the quality of the work, and shows the parents, in plain words, how their child is growing.</p>
  <h3 class="sub">Who uses it</h3>
  <table><tr><th>Who</th><th>What they do in the system</th><th>Which children they see</th></tr>${ROLES.map((r) => `<tr><td><b>${esc(r[0])}</b></td><td>${esc(r[1])}</td><td>${esc(r[2])}</td></tr>`).join('')}</table>
  <h3 class="sub">The big ideas</h3>
  <ul class="plain">
    <li><b>Goals are written once and shared.</b> A goal is a skill being taught. The supervisor approves it, every therapist works on it, and the parent sees it.</li>
    <li><b>Recording is by tapping.</b> A therapist records an attempt with one tap, not by typing. The percentages and graphs build themselves.</li>
    <li><b>Quality is checked.</b> The supervisor reviews goals and sessions, and watches therapists at work. The system warns when something is overdue or below the centre’s limits.</li>
    <li><b>Parents are partners.</b> They get home practice, see progress and chat with the team.</li>
    <li><b>Privacy is built in.</b> Each person sees only what their job needs (see the table in the next chapter).</li>
    <li><b>Two languages.</b> Every screen works in English and in Arabic, including right-to-left reading.</li>
  </ul>
</section>

<section class="h-page" id="together">
  <h2 class="section-title">2. How the pieces fit together</h2>
  <p>These pictures show how information moves between people. Each box is a person and what they do; the arrows show who sees it next.</p>
  ${FLOWS.map(flowHtml).join('')}
  <div style="page-break-before: always"></div><h3 class="sub" style="margin-top:0">Who can see what</h3>
  <table>
    <tr><th>Information</th><th>Parent</th><th>Therapists</th><th>Teachers</th><th>Supervisor</th><th>Administrator</th></tr>
    ${PRIVACY.map((r) => `<tr><td><b>${esc(r[0])}</b></td>${r.slice(1).map((c) => `<td class="${c === 'no' ? 'no' : 'ok'}">${esc(c)}</td>`).join('')}</tr>`).join('')}
  </table>
  <p style="font-size:9pt;color:#5C5878">“Therapists” means behavior, speech, occupational and remedial. Every person sees only the children they are assigned to (or, for a supervisor with whole-centre access, the children of their centre). In a centre-based organization, staff of one centre cannot see another centre’s children.</p>
</section>

${chaptersHtml}

<section class="h-page" id="glossary">
  <h2 class="section-title">${CHAPTERS.length + 3}. Words explained</h2>
  <table class="glossary">${GLOSSARY.map(([w, d]) => `<tr><td>${esc(w)}</td><td>${esc(d)}</td></tr>`).join('')}</table>
</section>

<section class="h-page" id="limits">
  <h2 class="section-title">${CHAPTERS.length + 4}. Practice version, real system, and what is not included</h2>
  <h3 class="sub">The practice (demo) version</h3>
  <p>When you open the app without signing in you get a practice version with sample children, staff and invoices. It is safe to try everything: nothing is shared with anyone, and it never touches real data. It keeps what you do on that one device. The administrator’s Settings page has a “Reset demo data” button to start again. Every picture in this guide comes from the practice version, except the sign-in and sign-up screens.</p>
  <h3 class="sub">The real system</h3>
  <p>The real system has a server and a database. People sign in with their own account. What one person records appears on the others’ screens within a few seconds. The administrator creates staff accounts; parents join with a code for their child; the centre’s invite code lets staff create their own account (this can be switched off).</p>
  <h3 class="sub">Quick start for each person</h3>
  <table>
    <tr><th>Who</th><th>First three things to do</th></tr>
    <tr><td><b>Administrator</b></td><td>1) Create the centres (Centers). 2) Add the children and staff (Portals). 3) Check the plan and seats (Billing) and the rules (Settings).</td></tr>
    <tr><td><b>Supervisor</b></td><td>1) Open Review and decide on waiting goals and sessions. 2) Open Staff and record a first observation. 3) Open Reports at the end of the month.</td></tr>
    <tr><td><b>Therapist or remedial teacher</b></td><td>1) Open Goals and add the child’s goals. 2) On Today press Edit plan and choose your methods. 3) Record a session and write the note.</td></tr>
    <tr><td><b>Classroom teacher</b></td><td>1) On Today tap the student, the goal, the activity and the result. 2) Check Students to see how the class is doing. 3) Send a good-news message on Family.</td></tr>
    <tr><td><b>Parent</b></td><td>1) Create an account with your child’s code. 2) Do the home practice on Home and tick it off. 3) Use Messages to talk to the team.</td></tr>
  </table>
  <h3 class="sub">What is not included yet</h3>
  <p>To avoid surprises, these are the limits of the version described here:</p>
  <ul class="plain">${LIMITS.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
  <div class="warn"><b>Where the numbers come from.</b> A goal’s percentage is always the latest recorded score. If no session has been saved yet, the page says “baseline” because the figure is the starting value. Averages count only goals a supervisor has approved.</div>
</section>

</body></html>`;

fs.writeFileSync(path.join(here, 'guide.html'), html);
const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const p = await b.newPage();
await p.setContent(html, { waitUntil: 'load', timeout: 120000 });
await p.emulateMediaType('print');
// Keep the PDF small: the screenshots become high-quality JPEGs inside the document.
await p.evaluate(async () => {
  for (const im of [...document.images]) {
    await im.decode();
    const c = document.createElement('canvas');
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(im, 0, 0);
    im.src = c.toDataURL('image/jpeg', 0.82);
    await im.decode();
  }
});
const out = path.join(here, '..', 'Nexia-Bridge-Client-Guide.pdf');
await p.pdf({
  path: out, format: 'A4', printBackground: true, outline: true, tagged: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="width:100%;font-size:8px;color:#8A8599;padding:0 13mm;display:flex;justify-content:space-between;font-family:Helvetica,Arial,sans-serif"><span>Nexia Bridge · a guide for everyone</span><span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span></div>',
  margin: { top: '14mm', bottom: '16mm', left: '13mm', right: '13mm' },
});
await b.close();
console.log('wrote', out, `${(fs.statSync(out).size / 1e6).toFixed(1)} MB`);
