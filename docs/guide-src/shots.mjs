// What each page of the guide shows: which screen to photograph, which parts to number, and what to say about them.
// Written for people who do not use software for a living, so every sentence is plain.
import { press, fill, pick, scrollTo, w, tab } from './capture-lib.mjs';
import { THERAPIST_SHOTS } from './shots-therapists.mjs';
import { SCHOOL_SHOTS } from './shots-school.mjs';
import { WEB_SHOTS } from './shots-web.mjs';
import { EXTRA_SHOTS } from './shots-extra.mjs';

const closeSheet = async (p) => { await p.evaluate(() => document.querySelector('[aria-label=Close]')?.click()); await w(300); };

export const PARENT_SHOTS = [
  /* ---------------------------------------------------------------- 1. Getting in */
  {
    id: 'launch', group: 'start', portal: 'Getting in', title: 'The welcome screen', device: 'm', height: 900,
    setup: async (p) => {
      await p.evaluate(() => document.querySelector('header button[title="Switch role"]').click()); await w(250);
      await p.evaluate(() => [...document.querySelectorAll('header button')].find((x) => x.innerText.includes('Return to Launch')).click()); await w(900);
    },
    after: async (p) => { await press(p, 'Parent or caregiver'); await w(600); },
    lead: 'This is the first screen. Everyone starts here and says who they are. Each person only sees the part of the app that belongs to their job.',
    marks: [
      ['Parent or caregiver', 'Parent or caregiver', 'For mums, dads and carers. Shows how the child is doing and the home practice to do.'],
      ['Therapist', 'Therapist', 'For the behavior, speech and occupational therapists.'],
      ['Teacher', 'Teacher', 'For the classroom teacher and the remedial (learning-support) teacher.'],
      ['Supervisor or admin', 'Supervisor or admin', 'For the clinical supervisor, and for the person who runs the centre.'],
      ['Sign in', 'Sign in', 'For people who already have an account on the real system.'],
      ['Create an account', 'Create an account', 'For first-time users. Parents need the code for their child; staff need the centre’s invite code.'],
      ['العربية', 'Language button', 'Switches the whole app between English and Arabic. Arabic reads right-to-left.'],
    ],
    steps: ['Open the app.', 'Tap the card that matches your job.', 'On the real system you sign in with your email and password. In the practice (demo) version you go straight in with sample data.'],
  },

  {
    id: 'signin', group: 'start', portal: 'Getting in', title: 'Signing in (real system)', device: 'm', height: 900, server: true,
    lead: 'On the real system everyone has their own account. Staff accounts are created by the administrator; parents create theirs with a code for their child.',
    marks: [
      ['Sign in', 'Sign in / Create account', 'Switch between signing in and creating a new account.'],
      ['Email', 'Email', 'The email address of your account.'],
      ['Password', 'Password', 'Your password. Staff first sign in with the temporary password the administrator gave them.'],
      ['Server address', 'Server address', 'Where the system lives. Normally filled in for you.'],
      ['Try the offline demo', 'Try the offline demo', 'A practice version with sample data. Nothing you do there is shared with anyone.'],
    ],
    steps: ['Type your email and password.', 'Press Sign in. You go straight to your own portal.'],
  },
  {
    id: 'register', group: 'start', portal: 'Getting in', title: 'Creating an account', device: 'm', height: 900, server: true,
    lead: 'A parent needs the code for their child (the centre gives it to them). Staff need the centre’s invite code. Without a valid code nobody can join.',
    marks: [
      ['Full name', 'Full name', 'Your name as you want it to appear.'],
      ['I am a', 'Your role', 'Parent, a kind of therapist or teacher, supervisor or administrator.'],
      ['Password', 'Password', 'At least 8 characters.'],
      ['Invite code', 'Invite code', 'Parents: the child’s family code. Staff: the centre’s staff code. Administrators have their own separate code.'],
    ],
    steps: ['Fill in your details.', 'Enter the code you were given.', 'Press Create account.'],
  },
  /* ---------------------------------------------------------------- 2. Parent */
  {
    id: 'parent-home', group: 'parent', portal: 'Parent', title: 'Home', device: 'm', role: 'Parent portal', tab: 'Home',
    lead: 'The parent’s starting page. It answers three questions: how is my child doing, what is new, and what should I do at home today.',
    marks: [
      ['Child:', 'Child name', 'Shows which child you are looking at. If you have more than one child, tap here to switch.'],
      ['Notifications', 'Bell', 'New messages and updates. The number is how many you have not read yet.'],
      ['Settings & Privacy', 'Settings (gear)', 'Language, dark mode, who is on your child’s care team, and privacy choices.'],
      ['Fine motor', 'Skill chips', 'A quick status for each area (for example “Developing” or “Improving”). Tap one to see its goal.'],
      ['Recent updates', 'Recent updates', 'News from the team, such as “a goal is ready for review”.'],
      ['Home practice from your therapist', 'Home practice', 'Tasks the therapist wants you to try at home. Tap the circle when you have done one; you can add a note.'],
      ['Start home practice', 'Start home practice', 'A guided home session: it walks you through the activity.'],
    ],
    steps: ['Check the bell for anything new.', 'Read “Recent updates”.', 'Do today’s home practice and tick it off. The therapist sees that you did it.'],
  },
  {
    id: 'parent-progress', group: 'parent', portal: 'Parent', title: 'Progress', device: 'm', role: 'Parent portal', tab: 'Progress',
    lead: 'Shows how your child is growing in each area, in plain words. Nothing here needs a clinical background.',
    marks: [
      ['82%', 'Overall index', 'One number for overall progress across all the specialists and home practice.'],
      ['In teaching', 'In teaching', 'How many goals the team is teaching right now.'],
      ['Mastered', 'Mastered', 'Goals your child has learned.'],
      ['Sessions', 'Sessions', 'How many therapy sessions have been recorded.'],
      ['Communication & Speech', 'Area cards', 'One card per area (speech, movement, learning). It names the specialist leading it.'],
      ['Active Focus Target', 'Focus target', 'The one skill the team is working on right now in that area. Tap it to read more.'],
    ],
    steps: ['Look at the four numbers at the top for the big picture.', 'Scroll through the area cards.', 'Tap a focus target to see what it means and how your child is doing.'],
  },
  {
    id: 'parent-targets', group: 'parent', portal: 'Parent', title: 'Targets (goals)', device: 'm', role: 'Parent portal', tab: 'Targets',
    lead: 'A “target” is a skill the team is teaching. This page lists every one, where your child started, where they are now, and where they are aiming.',
    marks: [
      ['Search targets', 'Search box', 'Type a word (for example “buttons”) to find a goal quickly.'],
      ['All (', 'Filter buttons', 'Show all goals, only the ones being taught, or only those waiting for a supervisor’s check.'],
      ['Baseline:', 'Progress bar', 'Baseline is where your child started. Current is today. Goal is the finish line. The three small numbers are the last three sessions.'],
      ['Inspect Target', 'Inspect Target & History', 'Opens the full story of the goal: how it is taught and every session.'],
      ['Log Home Trial', 'Log Home Trial', 'Lets you record how it went when you practised at home.'],
    ],
    steps: ['Pick a goal.', 'Look at the bar to see how far your child has come.', 'Tap “Log Home Trial” after practising at home.'],
  },
  {
    id: 'parent-sessions', group: 'parent', portal: 'Parent', title: 'Sessions', device: 'm', role: 'Parent portal', tab: 'Sessions',
    lead: 'Your child’s therapy and school appointments, with notes from sessions that already happened.',
    marks: [
      ['Book', 'Book Session', 'Ask for a new appointment with a specialist.'],
      ['Term Attendance', 'Attendance', 'How regularly your child has attended. Regular attendance helps learning.'],
      ['Upcoming', 'Upcoming', 'Appointments still to come.'],
      ['Completed', 'Completed & Notes', 'Past sessions and what the therapist wrote.'],
      ['Reschedule', 'Reschedule', 'Ask to move an appointment.'],
    ],
    steps: ['Tap “Upcoming” to see what is next and what to bring.', 'Tap “Reschedule” if you cannot come.', 'Tap “Completed & Notes” to read what happened last time.'],
  },
  {
    id: 'parent-messages', group: 'parent', portal: 'Parent', title: 'Messages – the chat list', device: 'm', role: 'Parent portal', tab: 'Messages',
    lead: 'All your chats with the care team, like the chat list in WhatsApp. Each specialist has their own chat.',
    marks: [
      ['Search chats', 'Search', 'Find a chat or a message.'],
      ['Unread', 'Unread filter', 'Show only the chats you have not read.'],
      [{ sel: '[data-testid=chat-row]', nth: 0 }, 'A chat', 'Tap a chat to open it. You see the person’s name and job, the time, and the last message.'],
      [{ sel: '[data-testid=chat-unread]', nth: 0 }, 'Green number', 'How many new messages are waiting in that chat.'],
    ],
    steps: ['Open Messages.', 'Tap the specialist you want to talk to.'],
  },
  {
    id: 'parent-chat', group: 'parent', portal: 'Parent', title: 'Messages – one conversation', device: 'm', height: 760, role: 'Parent portal', tab: 'Messages',
    setup: async (p) => { await p.evaluate(() => document.querySelector('[data-testid=chat-row]').click()); await w(700); },
    after: async (p) => { await p.evaluate(() => document.querySelector('[data-testid=chat-header] button').click()); await w(400); },
    lead: 'A chat that looks and works like WhatsApp. Your messages are green on the right; the specialist’s are white on the left.',
    marks: [
      [{ sel: '[data-testid=chat-header]' }, 'Top bar', 'Who you are talking to. The three icons open this specialist’s goals, book a session, or start a video call.'],
      [{ sel: '[data-testid=chat-message][data-mine=false]', nth: 0 }, 'Their message', 'White, on the left, with the time. A small green strip shows which goal it is about.'],
      [{ sel: '[data-testid=chat-message][data-mine=true]', nth: 0 }, 'Your message', 'Green, on the right. The two ticks mean it was delivered; they turn blue once the specialist has read it.'],
      ['Type a message', 'Message box', 'Write here. Enter sends. Shift+Enter starts a new line.'],
      [{ sel: '[data-testid=emoji-toggle]' }, 'Smiley', 'Add an emoji.'],
      [{ sel: '[data-testid=voice-start]' }, 'Microphone', 'Press to record a voice message (up to 30 seconds). When you type, this turns into the send arrow.'],
    ],
    steps: ['Type your message and press Enter (or the green button).', 'Tap the microphone to leave a voice message instead.', 'Tap a photo in the chat to see it full screen.'],
  },
  {
    id: 'child-mode', group: 'parent', portal: 'Parent', title: 'Child Mode', device: 'm', role: 'Parent portal', tab: 'Home', height: 900,
    setup: async (p) => { await p.evaluate(() => { document.querySelector('button[title*="Picture Schedule"]')?.click(); }); await w(900); },
    after: async (p) => { await press(p, 'Back to Adult Portal'); await w(600); },
    lead: 'A simple, calm screen to hand to the child: a picture schedule, a “First – Then” board and a star board for rewards. It is opened from the sparkle button at the very top of the page.',
    marks: [
      ['Star bank', 'Star bank', 'Stars the child has earned. Collecting stars leads to a reward.'],
      ['First — Then Board', 'First – Then board', 'Shows the job to do first and the nice thing that comes after.'],
      ['Step-by-Step Schedule', 'Picture schedule', 'Today’s steps with pictures. The child taps a step when it is done and it gets a tick.'],
      ['Back to Adult Portal', 'Back to Adult Portal', 'A grown-up leaves Child Mode here.'],
    ],
    steps: ['Tap the sparkle button at the top.', 'Hand the device to the child.', 'A grown-up presses “Back to Adult Portal” to leave.'],
  },
  {
    id: 'arabic-home', group: 'start', portal: 'Getting in', title: 'The Arabic version', device: 'm', height: 900, role: 'Parent portal', tab: 'Home',
    setup: async (p) => { await p.evaluate(() => { [...document.querySelectorAll('header button')].find((b) => b.innerText.includes('العربية'))?.click(); }); await w(900); },
    after: async (p) => { await p.evaluate(() => { [...document.querySelectorAll('header button')].find((b) => /^EN$|English/.test(b.innerText.trim()))?.click(); }); await w(700); },
    lead: 'Every screen can switch between English and Arabic. In Arabic the whole page flips to read from right to left, and the buttons move to match.',
    marks: [],
    steps: ['Tap the language button at the top (“العربية” or “EN”).', 'Everything changes at once. Tap it again to go back.'],
  },
  {
    id: 'parent-settings', group: 'parent', portal: 'Parent', title: 'Settings & privacy', device: 'm', role: 'Parent portal', tab: 'Home',
    setup: async (p) => { await p.evaluate(() => document.querySelector('button[title="Settings & Privacy"]').click()); await w(600); },
    after: closeSheetAfter,
    lead: 'Opened with the gear at the top. Your preferences, who is on your child’s care team, and your privacy choices.',
    marks: [
      ['Application Language', 'Language', 'Switch between English and Arabic.'],
      ['Care Team', 'Care team', 'Everyone who works with your child, with a Message button for each.'],
      ['Saudi PDPL', 'Privacy', 'Information about how your child’s data is protected and what you allow professionals to see.'],
    ],
    steps: ['Tap the gear.', 'Choose your language.', 'Review who is on the care team.'],
  },
];

async function closeSheetAfter(p) { await p.evaluate(() => { document.querySelector('button svg.lucide-x')?.closest('button')?.click(); }); await w(500); }

// Extra pages are slotted in next to the page they belong with, so the guide reads in a natural order.
const after = (list, id, extra) => { const i = list.findIndex((s) => s.id === id); return i < 0 ? [...list, ...extra] : [...list.slice(0, i + 1), ...extra, ...list.slice(i + 1)]; };
let all = [...PARENT_SHOTS, ...THERAPIST_SHOTS, ...SCHOOL_SHOTS, ...WEB_SHOTS];
const X = Object.fromEntries(EXTRA_SHOTS.map((s) => [s.id, s]));
all = after(all, 'parent-chat', [X['parent-notifications']]);
all = after(all, 'parent-targets', [X['parent-target-detail']]);
all = after(all, 'behavior-targets', [X['behavior-add-target']]);
all = after(all, 'behavior-bip', [X['behavior-bip-function'], X['behavior-bip-reinforcers'], X['behavior-bip-home']]);
all = after(all, 'speech-goals', [X['speech-add-goal']]);
all = after(all, 'speech-practice', [X['speech-practice-sentence'], X['speech-practice-artic'], X['speech-practice-rec']]);
all = after(all, 'speech-graphs', [X['speech-notes']]);
all = after(all, 'ot-graphs', [X['ot-notes']]);
all = after(all, 'remedial-graphs', [X['remedial-notes']]);
all = after(all, 'remedial-notes', [X['remedial-family']]);
all = after(all, 'sup-children', [X['sup-case-notes']]);
all = after(all, 'admin-home', [X['admin-audit']]);
all = after(all, 'admin-settings', [X['admin-roles']]);
all = after(all, 'admin-portals', [X['admin-edit-person']]);
all = after(all, 'admin-billing', [X['admin-plan']]);
export const SHOTS = all;

