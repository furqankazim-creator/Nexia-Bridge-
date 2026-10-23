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
| Parent | Parent or caregiver | See progress, do home practice, keep medical records and choose who sees them, message the therapist, open Child Mode |
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
| Medical records | Read, add, edit, delete, choose who sees each one | Only the ones the parent shared with their role (view only) | Only the ones shared with supervisors (view only) | Never |
| Case notes and observations | No | Staff only | Staff only | No |
| Templates and reports | No | Staff | Staff | No |
| Accounts, centres, billing | No | No | No | Yes |

Messages marked as colleague-only are never sent to parents. A parent can only ever see their own child.

---

## 6. What each portal's pages do

### Parent
Home, Progress, Targets, Sessions, **Records** and Messages, plus Child Mode (a big, simple screen for the child), Arabic and English, and Settings. Notifications are in the bell on top.

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

## 7. Medical records (kept by the parent)

Parents can keep their child's medical history in the **Records** tab, even reports that are several years old.

**What a parent can do**
- **Add a record:** choose a category, give it a title, set the date of the report (old dates are fine), the doctor or centre, and optional notes.
- **Attach files:** up to five PDFs or photos per record (a phone camera photo works). On the server each file can be up to 8 MB.
- **Find things again:** search by title, doctor or notes, filter by category, and see records grouped by year with the newest first.
- **Choose who sees each record:** **Only me** (the default), **Choose people** (tick any of behavior, speech, OT, remedial, classroom teacher, supervisor) or **Whole care team**. The choice can be changed at any time, and turning sharing off removes the record from the therapist's screen.
- **Edit or delete:** deleting a record also deletes its files.

**Categories:** Diagnosis & assessments, Doctor visits, Neurology & EEG, Medication, Lab tests & scans, Past therapy reports, School & IEP, Vaccinations, Allergies & diet, Hospital & emergency, Insurance & papers, Other.

**What staff see:** therapists and teachers open **Family → Medical**, and supervisors open **Children → Medical records**. They only see records shared with their role, they can open the files, and they cannot change or delete anything.

**Privacy rules (enforced on the server, not only on screen)**
- Only the parent of that child can add, change or delete records and files.
- Staff can read a record and its files only while the parent has shared it with their role. The server checks this on every file request.
- Administrators never receive medical records or files.
- Each time a staff member opens a file, the server writes it to the audit log (who and when, never the content).
- Files are stored separately from normal records, and only PDF, JPG, PNG and WebP files whose contents match their type are accepted.

**Practice version:** the same screens work offline. Files are kept in the browser on that device (limit 3 MB each), and switching to a therapist portal on the same device applies the same sharing rules.

---

## 8. Home tasks and what the parent's screens show

- **Home tasks:** a therapist assigns a task in **Family → Home tasks**. The parent sees it on **Home**, gets a notification, ticks it off and can leave a note ("He did it twice!"). The therapist sees it done with the note and gets a notification. Parents can only tick a task and add a note; they cannot change or create tasks.
- **Parent Home, Progress and Sessions (real system):** these are built only from what the team saved. Home shows one row per discipline from the approved goals, recent updates (sessions, new home tasks, mastered goals), voice tips, the behavior plan, home tasks, a "This week" summary and quick actions. Progress lists each goal with its bar and last sessions. Sessions lists every saved session with its result. A new child with nothing saved shows friendly empty states.
- **Goals:** a therapist's new goal waits for the supervisor. The parent sees it in **Goals** marked as waiting (and a note on Home), and it moves into Home and Progress once the supervisor approves it. A goal returned with a comment shows a badge on the therapist's Today tab and the comment inside Edit plan.
- **Classroom notes:** what the teacher records in the classroom appears for the parent (Home updates and Sessions → From the classroom) and for the team. Nothing is invented: a child with no observations shows "No data yet".
- **Practice version:** keeps the sample schedule and sample figures so the client can see a full example.

---

## 8b. Notes, dictation and chat

- **Notes:** SOAP-style session notes with an archive. Dictation uses the browser's speech recognition, so it depends on the browser and is not available in the phone app.
- **Family chat:** a WhatsApp-style chat, text and voice notes only. There is one chat per role (speech, OT, behavior, teacher, supervisor). The parent's list shows the child's real team by name. Unread counts are kept on the server and follow the person to a new device, and the double ticks turn blue when the other side has opened the chat. A therapist writes to the family only in their own chat; a message in another role's chat is a note to colleagues that the parent never receives. Administrators cannot read chats. The supervisor opens a child's chat from **Children → Family chat**.
- **Home tasks:** the therapist sets a task, the parent ticks it off and can leave a note.

---

## 9. The UI in detail

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

## 10. Technology

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

## 11. Running it

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

## 12. Known limits

- Billing records invoices only and takes no payments.
- There is no calendar sync, and no push or WhatsApp reminders.
- PDF export opens the browser's print window.
- Dictation depends on the browser's speech service and is unavailable in the phone app.
- Chat attachments are small.
- Medical files are limited to PDF, JPG, PNG and WebP (8 MB each on the server, 3 MB in the practice version). There is no automatic text reading (OCR) of scanned reports.
- The demo's data stays on one device and is not shared.
