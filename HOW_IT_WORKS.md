# Nexia Bridge: How It Works

Nexia Bridge is a therapy and education platform for autistic children. One child has one team (parent, therapists, teachers, supervisor), and everyone works on **one shared picture** of that child. Each person sees only their own portal.

This file explains how the system works and how the screens are built. For a picture-by-picture walkthrough in plain words, see `docs/Nexia-Bridge-Client-Guide.pdf`. For deeper detail per role, see `SUPERVISOR_AND_ADMIN_GUIDE.md`, `TEACHER_AND_REMEDIAL_GUIDE.md` and `FULL_APPLICATION_PAGE_BY_PAGE_REPORT.md`.

---

## 1. The big idea

| Idea | What it means |
|---|---|
| One child, one team | A child's record is shared by everyone assigned to that child. |
| One portal per role | A parent never sees therapist tools; a therapist never sees admin tools. |
| Plan drives the tools | A therapist chooses what to work on in the **Plan**; the Today screen then shows only those tools and datasheets. |
| Parents stay in control | Parents see progress, targets, home practice and messages. They never see raw clinical logs. |
| Works with or without a server | Without a server it runs as an offline **demo**. With a server it is the real system. |

---

## 2. The eight portals

| Portal | Who | Main job |
|---|---|---|
| Parent | Parent or caregiver | See progress, do home practice, message the therapist, open Child Mode |
| Behavior (ABA) | Behavior therapist | Datasheets, targets, graphs, BIP (ABC log, function, reinforcers), notes, Family |
| Speech (SLP) | Speech therapist | Plan, drills, goals, practice, graphs, notes, Family |
| OT | Occupational therapist | Plan, tools, checklists, goals, graphs, notes, Family |
| Remedial | Remedial teacher | Plan, goals, graphs, notes, Family |
| Teacher | Classroom teacher | Today, students, notes, Family |
| Supervisor | Clinical supervisor | Review goals and sessions, children, staff observation, reports, templates |
| Administrator | Centre or organisation manager | Home, Portals, Cases, Centers, Billing, Settings |

The bottom bar is on phones; on a computer it becomes a menu on the left. Behavior, Speech, OT, Remedial and Teacher all have a **Family** tab.

---

## 3. Two modes

### Demo mode (offline)
- Used when no server address is set (for example the Vercel link).
- All data is saved in the browser's local storage on that device only.
- The launch screen lets you open any portal in one tap, with sample children and staff.
- Good for showing the system. It is not shared between people or devices.

### Server mode (real system)
- Used when `VITE_API_URL` points to the API (or the app is opened once with `?api=http://host:4000`).
- People sign in or create an account. Staff use the staff invite code; parents use their child's invite code; administrators use the admin invite code.
- The server is the source of truth. Nothing clinical is kept in local storage.
- Records are synced through one generic sync (`useServerSync`) and each collection has its own access rule on the server.

---

## 4. How a typical day flows

1. **Parent** signs in, sees today's progress and home practice, ticks off home tasks and sends a message.
2. **Therapist** opens the child, builds or edits the **Plan** (goals and tools), runs the session from **Today**, saves a session summary, writes a note (typed or dictated) and replies in **Family**.
3. **Supervisor** reviews new goals and saved sessions, approves or sends feedback, observes staff and publishes reports.
4. **Administrator** manages accounts, centres, cases and billing. They see counts and summaries only, never clinical notes, ABC logs or messages.

---

## 5. Who can see what

| Data | Parent | Therapist / Teacher | Supervisor | Administrator |
|---|---|---|---|---|
| Targets and goals | Read | Read and write | Read and write | Read |
| Session summaries | Read | Read and write | Read and review | Summary only (no note text) |
| Home tasks | Read, tick off, add a note | Read and write | Read | Completion status |
| ABC events | No | Read and write | Read | No |
| Behavior plan (BIP) | Read once it is not a draft | Read and write | Read | Status |
| Messages | Family messages | Read and write | Read | No |
| Case notes and observations | No | Staff only | Staff only | No |
| Templates and reports | No | Staff | Staff | No |
| Accounts, centres, billing | No | No | No | Yes |

Messages marked as colleague-only are never sent to parents. A parent can only ever see their own child.

---

## 6. What each portal's pages do

### Parent
Home, Progress, Targets, Sessions and Messages, plus Child Mode (a big, simple screen for the child), Arabic and English, and Settings. Notifications are in the bell on top.

### Behavior therapist
- **Today:** plan-driven datasheets for the child.
- **Targets:** goals with mastery levels.
- **Graphs:** trends from the data.
- **BIP:** ABC log, Function, BIP and Reinforcers.
- **Notes:** session notes with dictation and a notes archive.
- **Family:** chat with the parents and home tasks.

### Speech therapist
Today, Goals, Practice (sentences, articulation, recordings), Graphs, Notes, Family. Speech exercises are chosen in the Plan and appear in Today.

### Occupational therapist
Today, Checklists, Goals, Graphs, Notes, Family. Tools such as the sensory diet and task analysis are chosen in the Plan.

### Remedial teacher and classroom teacher
Today, goals or students, graphs, notes and Family. The teacher view is about classroom progress and family communication.

### Supervisor
Review (goals and sessions waiting), Children, Staff (observation of staff and feedback), Reports, Templates. A supervisor can ask the administrator to change a case's team; the administrator answers it.

### Administrator
- **Home:** overview and quick actions.
- **Portals:** one card per portal; invite a new specialist for the chosen portal.
- **Cases:** children, team reassignment, transfers, archive.
- **Centers:** special education, speech therapy and clinic centres.
- **Billing:** invoices (draft, issued, paid, void). It records invoices only and takes no payments.
- **Settings:** organisation-wide settings, roles, audit log.

---

## 7. Notes, dictation and chat

- **Notes:** SOAP-style session notes with an archive. Dictation uses the browser's speech recognition, so it depends on the browser and is not available in the phone app.
- **Family chat:** a WhatsApp-style thread between the parent and a therapist, with message bubbles, read marks, a tall conversation area and small attachments. Chat stays in the app; there is no external sharing.
- **Home tasks:** the therapist sets a task, the parent ticks it off and can leave a note.

---

## 8. The UI in detail

### Layout
- **Mobile first.** The app is a single column that fits a phone (about 390 px wide). The Expo phone app wraps the same web app in a WebView.
- **Desktop.** From the medium breakpoint upward, the bottom bar becomes a left menu. Supervisor and Administrator are designed for a computer and use wider layouts with tables and side panels.
- **Frame.** The app sits in a centred frame (`app-frame`) with its own scroll area (`app-scroll`). The page never scrolls horizontally.
- **Safe areas.** Top and bottom padding respects phone notches and home bars.

### Look and feel
- **Fonts:** Sora for headings, Inter for body text, Noto Sans Arabic for Arabic.
- **Colours:** warm cream background (`#F4EEE6`), soft borders (`#E8E2D9`), dark ink text (`#1F1B3A`), indigo as the main action colour (`#4F46E5`), rose for alerts and badges. Each portal also has an accent chip (parent rose, behavior indigo, speech blue, OT amber, teacher green).
- **Shapes:** large rounded cards and buttons, soft shadows, 16 px minimum input text so phones do not zoom.
- **Icons:** the Lucide icon set.
- **Dark mode:** a moon button on the launch screen and in Settings switches to a deep purple theme (`#1F1B3A`, `#252044`, `#38325E`).
- **Languages:** English and Arabic. Arabic switches the whole layout to right-to-left.
- **Feedback:** toasts at the top for saved or sent actions, red number badges on tabs for unread items.

### Launch screen
The first screen in demo mode:
- Language and dark-mode buttons in the top-right corner.
- A row of **instant preview** chips (Parent, Behavior, Speech, OT, Teacher, and so on) to open a portal in one tap.
- The Nexia Bridge logo and the line "One child. One team. One shared picture."
- Four big role cards: Parent or caregiver, Therapist, Teacher, Supervisor or admin.
- **Sign in** and **Create an account** buttons.
- A privacy note: parents decide which professionals can see their child's information.

### Common building blocks
- **Header:** portal name, child switcher, language, bell, settings.
- **Bottom tab bar or left menu:** the tabs for the current role, with unread badges.
- **Cards and sheets:** forms open as bottom sheets on phones and centred panels on computers.
- **Modals:** Settings, Notifications, Share to team, goal editor, audit log.
- **Child Mode:** a full-screen, large-button schedule for the child, left with "Back to Adult Portal".

---

## 9. Technology

| Part | Choice |
|---|---|
| Web app | Vite + React 19 + TypeScript |
| Styling | Tailwind CSS v4 |
| Icons | lucide-react |
| Phone app | Expo with a WebView wrapper (`mobile/`, built by `vite.mobile.config.ts`) |
| Server | Express + MongoDB (Mongoose) in `server/` |
| Sign-in | Token-based, with invite codes by role |
| Demo data | Browser local storage |
| Tests | `npm run test:server` and `npm run test:unit` |

### Folders
```
src/components/   one folder per portal (parent, behavior, speech, ot, remedial,
                  teacher, supervisor, admin) plus common/ and launch/
src/context/      AppContext (app state), AuthContext (demo or server gate)
src/data/         catalogs, goal bank, plan config, seed and demo data
src/hooks/        datasheets, voice dictation
src/sync/         generic record sync with the server
src/utils/        reports, scoring and text helpers
server/           Express API, models, access policy, admin and settings
docs/             client guide PDF, screenshots and the guide generator
```

---

## 10. Running it

```bash
npm install
npm run dev          # web app (demo mode) on http://localhost:3000
npm run server       # API on http://localhost:4000
npm run build        # production build into dist/
npm run lint         # type check
```

- With no `MONGODB_URI`, the development server starts its own MongoDB and prints the family invite codes and the staff invite code.
- For production set `NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET` (32+ characters), `STAFF_INVITE_CODE`, `ADMIN_INVITE_CODE` and `CORS_ORIGIN`, and put it behind HTTPS.
- To point the web app at the server, set `VITE_API_URL`.

### Deploying the demo
`vercel.json` is included. On Vercel the framework is Vite, the build command is `npm run build` and the output folder is `dist`. That deployment runs the offline demo only; the Express and MongoDB server must be hosted separately.

---

## 11. Known limits

- Billing records invoices only and takes no payments.
- There is no calendar sync, and no push or WhatsApp reminders.
- PDF export opens the browser's print window.
- Dictation depends on the browser's speech service and is unavailable in the phone app.
- Chat attachments are small.
- The demo's data stays on one device and is not shared.
