# Nexia Bridge — Complete Page-by-Page & Section-by-Section Functional Specification

> **Purpose:** Exhaustive technical, clinical, and functional documentation of every screen, portal, tab, section, modal, and data workflow in **Nexia Bridge** ("One child. One team. One shared picture."). Designed for executive client reports, technical handoffs, and slide deck generation.

---

## Table of Contents
1. [System Overview & Responsive Architecture (Web vs. Mobile)](#1-system-overview--responsive-architecture-web-vs-mobile)
2. [Global Shell: Launch Screen, Authentication, Header & Global Modals](#2-global-shell-launch-screen-authentication-header--global-modals)
3. [Portal 1: Parent / Caregiver Portal (`parent`)](#3-portal-1-parent--caregiver-portal-parent)
4. [Portal 2: Behavior Therapist (ABA / BCBA) Portal (`behavior`)](#4-portal-2-behavior-therapist-aba--bcba-portal-behavior)
5. [Portal 3: Speech-Language Pathologist (SLP) Portal (`speech`)](#5-portal-3-speech-language-pathologist-slp-portal-speech)
6. [Portal 4: Occupational Therapist (OT) Portal (`ot`)](#6-portal-4-occupational-therapist-ot-portal-ot)
7. [Portal 5: Remedial & Special Education Specialist Portal (`remedial`)](#7-portal-5-remedial--special-education-specialist-portal-remedial)
8. [Portal 6: General / Inclusive Classroom Teacher Portal (`teacher`)](#8-portal-6-general--inclusive-classroom-teacher-portal-teacher)
9. [Portal 7: Clinical Supervisor Portal (`supervisor`)](#9-portal-7-clinical-supervisor-portal-supervisor)
10. [Portal 8: Clinic / Organization Administrator Portal (`admin`)](#10-portal-8-clinic--organization-administrator-portal-admin)
11. [Overlay Mode: Child Picture Schedule & First-Then Mode (`ChildScheduleMode`)](#11-overlay-mode-child-picture-schedule--first-then-mode-childschedulemode)
12. [Backend Server, Offline-First Sync & Saudi PDPL Privacy Architecture](#12-backend-server-offline-first-sync--saudi-pdpl-privacy-architecture)

---

## 1. System Overview & Responsive Architecture (Web vs. Mobile)

**Nexia Bridge** is a bilingual (**English LTR** / **Arabic `العربية` RTL**), offline-capable multidisciplinary care platform that unites **8 distinct roles** around a single shared child record:
1. **Parent / Caregiver (`parent`)**
2. **Behavior Therapist — ABA / BCBA (`behavior`)**
3. **Speech-Language Pathologist — SLP (`speech`)**
4. **Occupational Therapist — OT (`ot`)**
5. **Remedial & Special Education Specialist (`remedial`)**
6. **General / Inclusive Classroom Teacher (`teacher`)**
7. **Clinical Supervisor (`supervisor`)**
8. **Clinic / Organization Administrator (`admin`)**

### Adaptive Desktop Web vs. Mobile App Layout
- **On Desktop Web (`>= 768px`):**
  - Renders as a **full-width, multi-column desktop web application** (`max-w-6xl` workspace containers, 2-column and 4-column KPI/card grids).
  - Features a persistent **left vertical navigation sidebar** (`BottomTabBar` in `md:static md:w-60 lg:w-64` mode), a full-width top bar with desktop brand badge, and centered modal dialogs (`Sheet`).
- **On Mobile Screens (`< 768px`) & Native Expo Mobile App:**
  - Renders as a **touch-optimized mobile application** (`max-w-md` single-column stack) with safe-area insets, a fixed bottom navigation bar, and slide-up bottom sheets.

---

## 2. Global Shell: Launch Screen, Authentication, Header & Global Modals

### Page 2.1: Launch & Role Selection Screen (`LaunchScreen.tsx`)
The entry landing screen when exploring or switching roles in demo mode.
- **Section 1 — Top Utility Bar:**
  - Status pill (`All 8 Portals Ready`), instant **Language Toggle (`العربية` / `EN`)**, and **Light/Dark Theme Toggle (`☀️` / `🌙`)**.
- **Section 2 — Instant 1-Tap Portal Preview Bar:**
  - Horizontal quick-jump pills for all roles (`Parent`, `Behavior (ABA)`, `Speech (SLP)`, `OT`, `Teacher`, `Supervisor`, `Admin`).
- **Section 3 — Brand Hero & Tagline:**
  - Nexia Bridge logo, bilingual headline (*"One child. One team. One shared picture."* / *"طفل واحد. فريق واحد. رؤية واحدة مشتركة."*), and subtitle (*"Assessment, therapy, school and home progress, together in one place."*).
- **Section 4 — Role Selection Cards ("I am a…"):**
  - Responsive 2-column grid on desktop / vertical stack on mobile:
    1. **Parent or caregiver:** Opens `ParentPortal` directly.
    2. **Therapist:** Opens sub-discipline picker for **Behavior Therapist (ABA / BCBA)**, **Speech-Language Pathologist (SLP)**, or **Occupational Therapist (OT)**.
    3. **Teacher:** Opens sub-role picker for **General Classroom Teacher (`teacher`)** or **Remedial & Special Ed Specialist (`remedial`)**.
    4. **Supervisor or admin:** Opens sub-role picker for **Clinical Supervisor (`supervisor`)** or **Clinic / Organization Admin (`admin`)**.
- **Section 5 — Footer Actions & Privacy Guarantee:**
  - `Sign in` and `Create an account` buttons + the signature privacy banner: *"Parents decide which professionals can see their child's information."*

### Page 2.2: Server Authentication Screen (`AuthScreen.tsx`)
Displayed when connected to the live Node/Express + MongoDB server (`?api=http://host:4000`).
- **Section 1 — Mode Switcher Tablist:** Toggle between `Sign in` and `Create account`.
- **Section 2 — Credentials & Role Registration Form:**
  - **Sign In Mode:** Email + Password.
  - **Create Account Mode:** Full Name, Role selector (`Parent`, `Behavior therapist`, `Speech therapist`, `Occupational therapist`, `Remedial teacher`, `Classroom teacher`, `Supervisor`, `Administrator`), Email, Password (8+ characters), and **Role-Specific Invite Code**:
    - *Parent:* 8-character **Child Family Invite Code** (links parent to that specific child).
    - *Clinical/School Staff:* **Organization Staff Invite Code** (`staffCode`).
    - *Administrator:* **Administrator Secret Code** (`ADMIN_INVITE_CODE`).
- **Section 3 — Server URL & Offline Demo Fallback:**
  - Expandable `Server address` input and `Try the offline demo` link.

### Section 2.3: Global Top Header (`Header.tsx`)
Present at the top of every portal once signed in.
- **Top Micro-Bar (Simulator & Environment Controls):**
  - **Desktop Brand Pill:** Nexia Bridge icon and name.
  - **Role Switcher Dropdown:** Switch between any of the 8 portals in demo mode or return to the Launch Screen.
  - **Child Mode Button (`Child Mode`):** Launches the full-screen `ChildScheduleMode` visual schedule overlay.
  - **Offline / Synced Simulator Button:** Toggles offline mode (`Offline (N queued)` vs. `Synced`); going back online flushes queued records.
  - **Sign Out / Sign In Button:** Ends server session or switches from demo to server login.
  - **Language Toggle (`العربية` / `EN`):** Switches entire UI and document direction (`dir="rtl"` vs. `dir="ltr"`).
  - **Prompt & PDF Compliance Audit Button:** Opens `PromptAuditModal`.
  - **Dark Mode Toggle:** Switches light/dark clinical theme.
- **Main Profile & Context Bar:**
  - **User Avatar & Role Badge:** Shows active user's name and credential badge (`Mother`, `BCBA`, `SLP`, `OT`, `Teacher`, `Lead`, `Supervisor`, `Admin`).
  - **Context Selector:**
    - *Parent, Therapists & Teachers:* **Child Switcher Dropdown** (`Child: Lama Alharbi`, `Maya Al-Rashid`, `Tariq Al-Otaibi`) with diagnosis subtitle.
    - *Supervisor:* Shows caseload badge (`All children (N)`).
    - *Administrator:* Shows organization badge (`Al-Amal Development Center`).
  - **Notifications Bell Icon:** Shows unread count badge and opens `NotificationsModal`.
  - **Settings Gear Icon:** Opens `SettingsModal` (for all non-admin roles; Admins have a dedicated `Settings` tab).

### Section 2.4: Global Modals (`NotificationsModal`, `SettingsModal`, `PromptAuditModal`, `SupervisorFeedbackCard`)
- **`NotificationsModal.tsx`:** Filterable feed of clinical alerts, goal approvals, family messages, and consent changes with `Mark all as read`.
- **`SettingsModal.tsx`:** Displays the active user's clinical license/profile card, language/theme preferences, Saudi PDPL privacy status, and demo data reset controls.
- **`SupervisorFeedbackCard.tsx`:** High-priority amber banner automatically injected at the top of any Therapist or Teacher's **Today** tab whenever a Clinical Supervisor returns/rejects a goal, requests session note corrections, flags a session for re-training, or leaves a line-by-line observation comment. Includes a one-tap **Acknowledge** button per item that syncs back to the Supervisor Portal.

---

## 3. Portal 1: Parent / Caregiver Portal (`parent`)

**File:** `src/components/parent/ParentPortal.tsx`
**Navigation Tabs:** `Home` | `Progress` | `Targets` | `Sessions` | `Messages`

### Page 3.1: `Home` Tab — Daily Family Snapshot & Home Practice
- **Section 1 — Child Hero & Privacy Consent Banner:**
  - Displays child photo, age, school/classroom, assigned multidisciplinary care team pills, and a quick button to open the **Parent Consent Center Modal**.
- **Section 2 — Today's Progress Summary Cards:**
  - Jargon-free status cards across core areas (*Communication*, *Social & Play*, *Daily Living Skills*, *Classroom Participation*) with color-coded status chips (`Mastered`, `Improving`, `Developing`, `Needs support`), plain-language explanation, and score vs. goal criterion bar.
- **Section 3 — This Week in Plain Language ("The Shared Picture"):**
  - Structured 3-part narrative:
    1. *What we worked on*
    2. *What your child is doing well*
    3. *What needs more practice*
- **Section 4 — Guided Home Practice Card & Interactive Checklist:**
  - Step-by-step home activity guide (materials needed, step-by-step instructions, and embedded **Video Modeling Guide Modal**).
  - Interactive **Assigned Home Tasks** list (sent by Behavior, Speech, OT, Remedial, Teacher, or Supervisor): parents can check off completed tasks, leave a **Parent Feedback Note** on how practice went at home, and trigger celebratory confetti.
- **Section 5 — Interactive Speech Weekly Questions & Sentence Practice:**
  - Parents can score the SLP's assigned **Weekly WH Questions** (`Independent`, `Prompted`, `Did not answer`) right from home, which syncs live back to the Speech Therapist's portal.

### Page 3.2: `Progress` Tab — Longitudinal Family Progress & Milestones
- **Section 1 — Overall Mastery & Independence Summary:**
  - Visual progress rings and domain-by-domain mastery bars.
- **Section 2 — Simplified Progress Charts:**
  - Parent-friendly trend graphs showing progress from baseline to current performance across Speech, Behavior, OT, and School domains.
- **Section 3 — Celebrated Milestones & Mastered Skills:**
  - Timeline of mastered targets and classroom achievements.

### Page 3.3: `Targets` Tab — Active IEP & Therapy Goals (Parent View)
- **Section 1 — Discipline Filter Strip:** Filter goals by `All`, `Speech`, `Behavior`, `OT`, `Remedial`, or `School`.
- **Section 2 — Expandable Goal Cards:**
  - Shows goal title, domain, plain-language definition, current score % vs. mastery criterion %, status badge, and contributing sessions from clinic, home, and school.

### Page 3.4: `Sessions` Tab — Therapy & School Session Log
- **Section 1 — Chronological Session Feed:**
  - Cards for every completed Speech, Behavior, OT, Remedial, and Classroom session showing date, specialist name, discipline badge, target worked on, independence %, and parent-friendly session summary.
- **Section 2 — Printable Family Progress Report Modal:**
  - Generates a clean, printable/exportable family summary report.

### Page 3.5: `Messages` Tab — Multi-Contact Care Team Messenger
- **Section 1 — Care Team Contact Directory:**
  - Categorized threads (`Therapists`, `School`, `Care Circle`) for direct 1-on-1 or team messaging with the BCBA, SLP, OT, Classroom Teacher / Remedial Specialist, and Clinical Supervisor, with unread message counters.
- **Section 2 — Real-Time Chat Thread:**
  - Supports bilingual messages, goal-tag attachments (e.g., tagging a specific speech or behavior goal), shared SOAP note summaries, and signed supervisor reports.

### Modal 3.6: Parent Consent Center (`showConsentModal` — Saudi PDPL Compliance)
- Granular privacy toggle matrix where the parent controls—per professional (`Dr. Tareq Hassan - BCBA`, `Dr. Sarah Alharbi - SLP`, `Reem Al-Ahmad - OT`, `Ms. Layla Fahad - Teacher`)—exact read access to 6 data domains:
  1. `Communication`
  2. `Math & Academics`
  3. `Fine Motor`
  4. `Dressing & ADL`
  5. `Attention & Behavior`
  6. `Clinical Notes`
- Every toggle immediately writes an immutable `GRANT_ACCESS_DOMAIN` or `REVOKE_ACCESS_DOMAIN` entry to the **PDPL Audit Log** (viewable by the parent in the **Access Audit Log Modal**).

---

## 4. Portal 2: Behavior Therapist (ABA / BCBA) Portal (`behavior`)

**Files:** `src/components/behavior/BehaviorPortal.tsx`, `BehaviorDatasheetViews.tsx`, `BipPortal.tsx`, `BehaviorGraphs.tsx`
**Navigation Tabs:** `Today` | `Targets` | `Graphs` | `BIP` | `Notes`

### Page 4.1: `Today` Tab — Plan-Driven ABA Session Datasheet
- **Sub-View A — Session Planner (`SessionPlanner.tsx`):**
  - Select active ABA procedures (`Discrete Trial Training (DTT)`, `Prompt Fading`, `Extinction`, `Visual Schedules`, `Functional Communication Training (FCT)`, `Token Economy`, `Natural Environment Teaching (NET)`) and measurement methods (`Trial-by-Trial`, `Frequency`, `Rate`, `Duration`, `Latency`, `Inter-Response Time (IRT)`, `Partial Interval`, `Whole Interval`, `Momentary Time Sampling (MTS)`, `Permanent Product`, `Cold Probe`, `Treatment Integrity`, `IOA`).
- **Sub-View B — Live ABA Datasheet (`BehaviorDatasheetViews.tsx`):**
  - **1. Child & Target Selector Bar:** Switch child or active ABA target, view mastery criterion, or open the Session Planner.
  - **2. 10-Trial / 20-Trial DTT Grid & Prompt Selector:** Tap `+` (Independent), `P` (Prompted), or `-` (Incorrect) per trial; select prompt level (`Independent`, `Verbal`, `Gesture`, `Model`, `Partial physical`, `Full physical`).
  - **3. Continuous & Discontinuous Measurement Widgets (dynamically shown based on Session Plan):**
    - **Frequency & Rate Counter:** `+1` / `-1` counter with live session timer calculating responses per minute.
    - **Duration & Latency Stopwatch:** Start/stop episode timers recording duration (seconds) and response latency (seconds).
    - **Interval Recording (`Partial`, `Whole`, `MTS`):** 10-interval grid (`Yes` / `No` checkboxes) with automatic % of intervals calculation.
    - **Cold Probe Strip:** First-trial unprompted `+` / `-` check.
    - **Token Board:** Interactive star/token counter (`tokensEarned / tokensGoal`).
    - **Inline ABC Event Quick-Logger:** Record Antecedent, Behavior, and Consequence episodes during the session.
    - **Treatment Integrity & IOA Self-Check:** Step-by-step procedural fidelity checklist + Observer 1 vs. Observer 2 count inputs.
  - **4. Automated Clinical Decision Rule Banner (`decide`):**
    - Analyzes the last 3 sessions against the target's mastery criterion and outputs a color-coded clinical recommendation (*"Mastery criterion met — advance to generalization"*, *"Trending up — continue current prompt level"*, or *"Stalled below criterion — review prompt fading step"*).

### Page 4.2: `Targets` Tab — ABA Skill Acquisition Goals (`TargetsPanel.tsx`)
- Grouped by ABA domain (`Mand / Requesting`, `Tact / Labeling`, `Listener Responding`, `Social & Play`, `Behavior Reduction`, `Imitation`).
- Add, edit, delete, or **Launch** any goal into the live `Today` datasheet; view approval status (`approved`, `awaiting_approval`, `needs_review`, `rejected`).

### Page 4.3: `Graphs` Tab — Multi-Metric ABA Progress Graphs (`BehaviorGraphs.tsx`)
- Interactive line graphs with mastery criterion threshold lines and phase-change markers across 12 metrics:
  - `% Independent`, `Cold Probe %`, `Frequency`, `Rate / min`, `Mean Duration (s)`, `Mean Latency (s)`, `Mean IRT (s)`, `Partial Interval %`, `Whole Interval %`, `MTS %`, `IOA %`, `Treatment Integrity %`.

### Page 4.4: `BIP` Tab — Behavior Intervention Plan, ABC Log, Reinforcers & Family (`BipPortal.tsx`)
Contains 4 sub-sections:
1. **ABC Data Collection (`ABC`):** Log and analyze Antecedent–Behavior–Consequence episodes with Setting, Intensity (`Low`, `Moderate`, `High`), Duration, and hypothesized function frequency breakdown (`Escape`, `Attention`, `Tangible`, `Sensory`).
2. **Behavior Intervention Plan Editor (`BIP`):** Author and version-control formal BIPs (Target Behavior, Operational Definition, Function, Prevention/Antecedent Strategies, Teaching/Replacement Behavior, Consequence/Reinforcement Plan, Crisis Plan, Review Date, and Status `draft` / `active`).
3. **Preference Assessment & Reinforcer Bank (`Reinforcers`):** Catalog preferred items/activities rated 1–5 stars with category tags (`Edible`, `Tangible`, `Social`, `Activity`, `Sensory`) and last-assessed date.
4. **Family & Home Tasks (`FamilyPanel`):** Two-way parent chat (`ParentChat`) and home behavior practice publisher (`HomeTasksManager`).

### Page 4.5: `Notes` Tab — Clinical SOAP Notes & Official Archive
- **Section 1 — Auto-Drafting SOAP Note Editor (`SoapNoteCard.tsx`):**
  - Automatically populates **Objective (`O`)** from the session's DTT trials, prompt level, frequency, duration, MTS %, and integrity %.
  - Supports **Multilingual Hands-Free Voice Dictation** (`English`, `العربية`, `اردو`) on each `S`, `O`, `A`, `P` field, one-click **Share to Care Team** (`ShareToTeamModal`), and **Session Report for Parents** modal.
- **Section 2 — Official ABA SOAP Archive (`SoapArchive.tsx`):**
  - Searchable chronological log of all saved sessions, showing supervisor review status (`Signed`, `Correction requested`, `Flagged for re-training`) and supervisor line comments.

---

## 5. Portal 3: Speech-Language Pathologist (SLP) Portal (`speech`)

**Files:** `src/components/speech/SpeechPortal.tsx`, `PracticeTab.tsx`, `WhDrill.tsx`, `SentenceBuilder.tsx`, `ArticulationLogPanel.tsx`, `AudioClipsPanel.tsx`, `GoalTool.tsx`
**Navigation Tabs:** `Today` | `Goals` (`Targets`) | `Practice` | `Graphs` | `Notes` | `Family`

### Page 5.1: `Today` Tab — Speech Session Planner & Datasheet
- Uses `TherapyPortal` configured for Speech (`role="speech"`):
  - **Goal-Specific Interactive Drill (`GoalTool.tsx`):** Automatically surfaces an inline WH-question drill, AAC symbol board, or sentence strip at the top of the datasheet matching the selected speech goal.
  - **Plan-Driven Speech Datasheet:** Tracks `% Independent`, `No-Cue %`, `Cold Probe %`, `Response Latency (s)`, `Mean Length of Utterance (MLU)`, `AAC Selections`, and `Vocal Accuracy %`.

### Page 5.2: `Goals` Tab — Speech & Language Clinical Targets
- Manage goals across `Receptive Language`, `Expressive Language`, `Pragmatics & Social Communication`, `Articulation & Phonology`, and `AAC & Multimodal Communication`.

### Page 5.3: `Practice` Tab — Specialized SLP Clinical Tools (`PracticeTab.tsx`)
Features 4 interactive speech therapy modules that automatically feed into the SLP's SOAP note and parent report:
1. **Weekly WH Questions Drill (`WhDrill.tsx`):**
   - Build weekly sets of `Who`, `What`, `Where`, `When`, and `Why` questions; score each question in clinic (`Independent`, `Prompted`, `No response`) and click **Send to Parents** so families can practice the exact same questions at home.
2. **Visual Sentence Builder & MLU Tracker (`SentenceBuilder.tsx`):**
   - Create target sentence strips (e.g., *"The boy is eating an apple"*), log child utterances, and automatically compute **word count / MLU** and independence rate.
3. **Articulation & Phoneme Position Log (`ArticulationLogPanel.tsx`):**
   - Score target phonemes (e.g., `/s/`, `/r/`, `/k/`, `/ش/`, `/ر/`) across **Initial**, **Medial**, and **Final** word positions at the `Isolation`, `Syllable`, `Word`, `Phrase`, or `Sentence` level with cueing level (`No cue`, `Visual/phonetic cue`, `Model`).
4. **Clinical Voice & Audio Clips Recorder (`AudioClipsPanel.tsx`):**
   - Record or log speech audio samples with duration, clinician note, and toggleable **Share with Parents** permission.

### Pages 5.4, 5.5 & 5.6: `Graphs`, `Notes` & `Family` Tabs
- **`Graphs`:** Plot `MLU`, `No-cue %`, `Latency (s)`, `AAC selections`, `% Independent`, and `Cold Probe %`.
- **`Notes`:** Speech `SoapNoteCard` (with auto-injected weekly WH question and sentence building stats in `O`) + `SoapArchive`.
- **`Family`:** Two-way `ParentChat` + `HomeTasksManager`.

---

## 6. Portal 4: Occupational Therapist (OT) Portal (`ot`)

**Files:** `src/components/ot/OTPortal.tsx`, `TaskAnalysisPanel.tsx`, `SensoryDiet.tsx`, `OtChecklist.tsx`
**Navigation Tabs:** `Today` | `Checklists` | `Goals` (`Targets`) | `Graphs` | `Notes` | `Family`

### Page 6.1: `Today` Tab — Task Analysis, Sensory Diet & OT Datasheet
1. **Interactive Task Analysis Chaining Panel (`TaskAnalysisPanel.tsx`):**
   - Create and score multi-step Activities of Daily Living (ADL) such as *Washing hands*, *Fastening buttons*, or *Packing backpack* using **Forward Chaining**, **Backward Chaining**, or **Total Task Presentation**.
   - Score each individual step (`Independent`, `Verbal`, `Gestural`, `Model`, `Partial Physical`, `Full Physical`, `Not Completed`).
   - **Automated Chaining Coach (`TaskDecision` / `coachNote`):** Identifies the exact target step in the chain and advises whether to fade prompts or advance to the next step in the sequence.
2. **Sensory Diet & Regulation Logger (`SensoryDiet.tsx`):**
   - Log sensory inputs across `Proprioceptive`, `Vestibular`, `Tactile`, `Auditory`, and `Visual` systems, recording the activity (e.g., *Weighted vest*, *Therapy swing*, *Deep pressure*), pre-state (`Dysregulated`, `Seeking`, `Avoidant`), post-state (`Calm & Regulated`, `Focused`, `Partial`), and duration.
3. **Plan-Driven OT Datasheet:**
   - Captures `Task Analysis %`, `Accuracy %`, `Duration (s)` (e.g., grasp endurance / seated posture), `Frequency`, and `Rate`.

### Page 6.2: `Checklists` Tab — Fine Motor, Gross Motor & ADL Skills Checklist (`OtChecklist.tsx`)
- Standardized functional checklist across fine motor, scissor skills, pencil grasp, bilateral coordination, and self-care dressing items scored as `Independent`, `Emerging`, `Prompted`, or `Not yet`, with live mastery percentage bar and custom skill creation.

### Pages 6.3, 6.4, 6.5 & 6.6: `Goals`, `Graphs`, `Notes` & `Family` Tabs
- **`Goals`:** Manage OT targets across `Fine Motor & Graphomotor`, `Self-Care & Dressing (ADL)`, `Sensory Processing & Regulation`, `Bilateral & Gross Motor`, and `Feeding & Oral Motor`.
- **`Graphs`:** Plot `Task analysis %`, `Accuracy %`, `% Independent`, and `Duration (s)`.
- **`Notes`:** OT `SoapNoteCard` (auto-injecting Task Analysis %, Sensory Diet outcome, and Skills Checklist stats into `O`) + `SoapArchive`.
- **`Family`:** Two-way `ParentChat` + `HomeTasksManager`.

---

## 7. Portal 5: Remedial & Special Education Specialist Portal (`remedial`)

**Files:** `src/components/remedial/RemedialPortal.tsx`, `src/components/common/TherapyPortal.tsx`
**Navigation Tabs:** `Today` | `Goals` (`Targets`) | `Graphs` | `Notes` | `Family`

### Page 7.1: `Today` Tab — Academic Fluency Probes & Explicit Instruction Datasheet
- **Session Planner (`SessionPlanner`):** Select special-ed procedures (`Task Analysis`, `Token Economy`, `Explicit Instruction`, `Error Correction`, `Guided Practice`) and Curriculum-Based Measurements (`Words Correct Per Minute - WCPM`, `Digits Correct Per Minute`, `Rate`, `Percentage Correct`, `Cold Probe`, `Writing Rubric %`, `Error Count`).
- **Live Remedial Datasheet:**
  - Timed reading fluency (`WCPM`) and math fluency (`Digits/min`) probes.
  - Trial-by-trial explicit instruction scoring (`+`, `P`, `-`), Cold Probe retention checks, and error count analysis.
  - Automated mastery decision banner (`decide`).

### Pages 7.2, 7.3, 7.4 & 7.5: `Goals`, `Graphs`, `Notes` & `Family` Tabs
- **`Goals`:** Manage IEP academic goals across `Reading Fluency & Decoding`, `Reading Comprehension`, `Math Calculation & Word Problems`, `Written Expression & Spelling`, and `Executive Functioning`.
- **`Graphs`:** Plot `Words / min (WCPM)`, `Digits / min`, `Percent correct`, `% independent`, `Cold probe %`, `Writing rubric %`, and `Errors`.
- **`Notes`:** Remedial `SoapNoteCard` + `SoapArchive`.
- **`Family`:** Two-way `ParentChat` + `HomeTasksManager`.

---

## 8. Portal 6: General / Inclusive Classroom Teacher Portal (`teacher`)

**File:** `src/components/teacher/TeacherPortal.tsx`
**Navigation Tabs:** `Today` | `Students` | `Notes` | `Family`

### Page 8.1: `Today` Tab — 4-Tap Classroom Activity Recorder & Accommodation Passport
Designed on a 2-column desktop layout (single-column on mobile) so a general classroom teacher can log inclusion data in **under 15 seconds** during a live class:
- **Left Column — 4-Tap Activity Recorder:**
  1. **1. Student in Class:** One-tap student selector pills connected to the live `childrenList`.
  2. **2. Goal Selector + Clinical Generalization Sync:** Dropdown combining preset classroom routines and the child's active clinical/IEP goals (`targets`), with a checkbox to automatically record the classroom outcome as a `Classroom Observation` score on the clinical goal's progress graph.
  3. **3. Activity Input & Quick Subject Chips:** Free-text input + 1-tap subject chips (*Science: parts of a plant*, *Morning Circle & Calendar*, *Small-Group Reading Station*, *Math Manipulatives & Counting*, *Art & Fine-Motor Craft*, *Recess / Classroom Transition*).
  4. **4. Four-Level Independence Outcome Buttons:**
     - `Completed independently` (100% — Green)
     - `Partially completed` (65% — Indigo)
     - `Needed help` (40% — Amber)
     - `Not completed` (0% — Red)
  5. **Optional Note with Live Voice Dictation:** Hands-free microphone dictation (`useVoiceDictation`), photo attachment button, and 1-tap observation phrase chips (*"Raised hand spontaneously"*, *"Used desk visual schedule"*, *"Needed 1 verbal prompt"*, *"Worked cooperatively with peer partner"*, *"Self-regulated using calm corner"*).
  6. **New Classroom Goal Modal (`+ New classroom goal`):** Allows the teacher to create a classroom inclusion target (`discipline: 'teacher'`) that submits to the Clinical Supervisor.
- **Right Column — Classroom Accommodation Passport (`classroom-passport`):**
  - Displays the student's school, classroom, **What Works Best in Class** clinical accommodations (*Visual First-Then*, *5-Second Wait Time*, *Sensory Regulation*), live **Behavior Support Quick Tip** pulled from the child's active `BipPlan`, and clickable cards for all active goals being generalized in school.

### Page 8.2: `Students` Tab — Classroom Roster & Generalization Matrix
- Responsive 3-column grid of all students in the teacher's class.
- Displays each student's avatar, classroom, **Active Goals Count**, **Overall Classroom Independence %**, **Focus Classroom Goal**, and a **4-Box Outcome Breakdown** (`Indep`, `Partial`, `Help`, `Not yet`), with quick buttons to **Record Activity** or view filtered **Logs**.

### Page 8.3: `Notes` Tab — Filterable Classroom Logs & Care-Team Sharing
- Filter classroom observations by **Student** (`All students` or specific child) and **Outcome** (`All outcomes`, `Completed independently`, `Partially completed`, `Needed help`, `Not completed`).
- Every observation card includes a **Share with care team** button that opens `ShareToTeamModal` to post the school update directly into the Parent, BCBA, SLP, OT, or Supervisor threads.

### Page 8.4: `Family` Tab — School–Home Bridge
- Side-by-side **Two-Way Parent Chat (`ParentChat`)** and **Home Practice Manager (`HomeTasksManager`)** so the teacher and parents can coordinate daily school-to-home carryover.

---

## 9. Portal 7: Clinical Supervisor Portal (`supervisor`)

**Files:** `src/components/supervisor/SupervisorPortal.tsx`, `ReviewTab.tsx`, `ChildrenTab.tsx`, `StaffTab.tsx`, `ReportsTab.tsx`, `TemplatesTab.tsx`
**Navigation Tabs:** `Review` | `Children` | `Staff` | `Reports` | `Templates`

### Page 9.1: `Review` Tab — Daily Clinical Sign-Off Queue (`ReviewTab.tsx`)
- **Section 1 — Queue Counters & Multi-Dimensional Filters:**
  - Live counters for `Goals Awaiting Approval` and `Sessions to Review`, with age-warning pills (`today`, `1–3d`, `4–7d`, `>7d`).
  - Filter simultaneously by **Discipline**, **Therapist**, and **Child**.
- **Section 2 — Goal Approval Queue & Bulk Sign-Off:**
  - Select multiple goals for **Bulk Approve**, or take individual actions on each goal:
    1. **Approve**
    2. **Edit Then Approve** (inline adjustment of Mastery Criterion, Target Date, or Prompt Hierarchy)
    3. **Return with Comment** (`needs_review`)
    4. **Reject** (`rejected`)
  - Tracks whether the therapist has clicked **Acknowledge** on returned/rejected goals.
- **Section 3 — Session & SOAP Note Sign-Off Queue:**
  - Inspect trial counts, accuracy %, self-recorded integrity/IOA, and full SOAP text.
  - **Line-by-Line Note Commenting:** Click **Comment** on any individual sentence in a therapist's note to quote it and send targeted coaching feedback.
  - **3 Sign-Off Decisions:** `Sign Off` (`signed`), `Request Correction` (`changes`), or `Flag for Re-Training` (`retrain`).

### Page 9.2: `Children` Tab — Caseload Intelligence & Goal Health Engine (`ChildrenTab.tsx`)
- **Section 1 — Caseload KPI Summary & Filters:**
  - Total children, total goals (`approved` / `awaiting` / `returned`), and average performance across approved goals.
  - Filter caseload by child status (`All`, `Needs review`, `Needs support`, `On track`, `No goals yet`) or search by name.
- **Section 2 — Automated 6-State Goal Health Engine (`goalHealth`):**
  - Classifies every goal as `On track`, `At risk` ($\ge 20$ pts below criterion or 3 falling scores), `Stalled` (no session in $N$ days or 3 flat scores), `Mastered`, `Regressed`, or `New`.
- **Section 3 — Expandable Per-Child Clinical Workspace & 6 Action Modals:**
  1. **Goal Detail, Trend Graph, Prompt Breakdown & Version History Sheet:** View full audit trail of every edit/decision and revise goal parameters with a mandatory clinical reason.
  2. **Add & Approve Goal + Clinical Goal Bank (`GOAL_BANK`):** Write a new goal or pick pre-approved clinical wording by discipline and approve immediately.
  3. **Behavior Intervention Plan (BIP) Read Sheet:** Inspect active BIP strategies and 30-day ABC event counts.
  4. **Home Practice Publisher:** Assign home tasks directly to the family and monitor completion.
  5. **Case Notes & IEP Review Tracker:** Record clinical case notes, team meetings, and next IEP review dates.
  6. **Request Team Change (`addTeamRequest`):** Send a structured request (`Add`, `Remove`, or `Swap` therapist) to the Organization Administrator.

### Page 9.3: `Staff` Tab — Treatment Fidelity, IOA & Supervision Hours (`StaffTab.tsx`)
- **Section 1 — Proactive Supervision Alerts Banner (`supervisionAlerts`):**
  - Flags therapists with Integrity % below org threshold, IOA % below org threshold, overdue observation intervals, unsigned notes $>7$ days, or due re-check dates.
- **Section 2 — Per-Therapist Performance Cards (`therapistCards`):**
  - Displays sessions count, active caseload, pending notes, **Observed vs. Self-Recorded Integrity %**, **IOA %**, last observation date, and monthly supervision hours.
- **Section 3 — Live & Video Observation Recorder Modal (`ObservationForm`):**
  - Supports `Live observation`, `Video review`, `Meeting`, and `Training`.
  - **Interactive Fidelity Checklist:** Score each procedural step (`Correct`, `Incorrect`, `N/A`) to auto-calculate **Treatment Integrity %**.
  - **Built-in IOA Calculator:** Supports both **Trial-by-Trial IOA** and **Total-Count IOA**.
  - **Competency Tags, Feedback, Action Items & Re-Check Date:** Sends coaching feedback straight to the therapist's `Today` tab.
- **Section 4 — Monthly Supervision Hours Tally & Chronological Log:**
  - Tracks total supervision hours per therapist and across the clinic, with acknowledgment tracking.

### Page 9.4: `Reports` Tab — Monthly Clinical Audits, Narratives & Comparison (`ReportsTab.tsx`)
- **Section 1 — Period & Scope Selectors:** `This month`, `Last month`, `Last 30 days`, or `Custom` date range; filter by Discipline, Therapist, and Child.
- **Section 2 — 8 Executive Clinical KPI Cards:** Children, Goals, Sessions, Average Performance %, Integrity %, IOA %, Home Practice %, and Waiting Review count.
- **Section 3 — Multi-Level Breakdowns:** By Child (with period-over-period delta), By Therapist (with review turnaround days), By Discipline, and Weekly ABC Behavior Chart.
- **Section 4 — Auto-Generated Editable Clinical Narrative:** Synthesizes all metrics into a prose clinical audit report that the supervisor can edit, **Save Draft**, **Sign and Save**, **Compare Side-by-Side** against any prior saved report, **Export as Print/PDF (LTR/RTL)**, or **Share with Parents**.

### Page 9.5: `Templates` Tab — Clinical Templates Library (`TemplatesTab.tsx`)
- Author, version-control (`v1`, `v2`), submit, and approve standardized clinical templates across 4 categories: `SOAP Note`, `DTT Data Sheet`, `Behavior Plan`, and `Task Analysis`, with one-click **Load Starter Templates**.

---

## 10. Portal 8: Clinic / Organization Administrator Portal (`admin`)

**Files:** `src/components/admin/AdminPortal.tsx`, `PortalsTab.tsx`, `CasesTab.tsx`, `CentersTab.tsx`, `BillingTab.tsx`, `SettingsTab.tsx`, `demoAdmin.ts`
**Navigation Tabs:** `Home` | `Portals` | `Centers` | `Billing` | `Settings`

### Page 10.1: `Home` Tab — Executive Operations & Compliance Dashboard (`AdminPortal.tsx`)
- **Section 1 — Subscription & Seat Utilization Card:** Shows active plan tier, organization name, `Seats Used / Licensed Seats`, billing cycle, renewal date, and quick link to `Billing`.
- **Section 2 — Staff Accounts & Quick Invite Launcher:** Shows active staff count and an **Invite New Specialist** modal pre-selecting Behavior, Speech, OT, Remedial, Teacher, or Supervisor.
- **Section 3 — Supervisor Team Change Requests Inbox:** Displays open team change requests from Supervisors with **Open Case**, **Mark Done** (with note), and **Decline** (with reason) actions.
- **Section 4 — PDPL Compliance Audit Stream Preview:** Latest administrative and security events with drilldown to the full Audit Log.
- **Section 5 — Whole-Organization Operational Figures & Monthly Audit Generator:** Counts of active children, centers, outstanding SAR invoices, 30-day session volume, average goal performance %, home practice %, and plain-text monthly summary export.

### Page 10.2: `Portals` Tab — Staff Directory, Parent Accounts & Cases (`PortalsTab.tsx` & `CasesTab.tsx`)
- **Sub-View A — `Children` (`CasesTab.tsx`):**
  - Filter between `Active` and `Archived` cases; search by child name or family invite code.
  - **Add Child:** Creates a new case and generates an 8-character **Family Invite Code**.
  - **Case Management Sheet (`CaseSheet`):** Rename child, **Reassign Care Team** (chip selector enforcing same-center rules), **Transfer Case Across Centers** (automatically revoking old center staff access), **Regenerate Family Invite Code**, or **Archive / Restore Case**.
- **Sub-View B — Role Portal Groups (`Behavior`, `Speech`, `OT`, `Remedial`, `Teacher`, `Supervisor`, `Parents`):**
  - Shows portal-specific operational KPIs (Active Staff, Children Served, Goals, 30d Sessions) — **never exposing raw clinical notes**.
  - **Create / Edit Account Sheet (`AccountSheet`):** Set Full Name, Email, Title/Credential, Phone, Temporary Password, Center, Visibility Scope (`Assigned children` vs. `Whole centre`), and assigned children.
  - **One-Time Sign-In Credentials Card:** Ready-to-copy login card after account creation or password reset.
  - **Account Lifecycle Controls:** `Reset password`, `Deactivate / Switch on` (frees/uses a license seat), and `Remove account`.

### Page 10.3: `Centers` Tab — Multi-Site Clinic & School Management (`CentersTab.tsx`)
- Manage multiple sites (`Special education`, `Speech therapy`, `Clinic`) with live headcounts of Active Staff, Active Children, and Center Admins.
- Enforces safe archiving: blocks archiving a center until its active children and staff have been transferred or deactivated.

### Page 10.4: `Billing` Tab — Seat Licensing & SAR Invoicing (`BillingTab.tsx`)
- **Section 1 — Subscription Plan & Seat Capacity Editor (`PlanSheet`):** Update plan name, licensed seat limit (enforced on account creation/reactivation), billing cycle, and renewal date.
- **Section 2 — SAR Invoice Ledger & State Machine (`InvoiceSheet`):**
  - Financial totals for `Draft`, `Outstanding (Issued)`, and `Paid` in **SAR**.
  - Create and transition invoices through `draft` $\rightarrow$ `issued` $\rightarrow$ `paid` / `void`, linked to a Child, Center, or Whole Organization, with one-click invoice text copy.

### Page 10.5: `Settings` Tab — Clinical Governance Policies, Codes & PDPL Matrix (`SettingsTab.tsx`)
- **Section 1 — Organization Name & Self-Registration Toggles:** Toggle staff self-registration and family signup; view, copy, or **Rotate/Replace** the organization's `staffCode`.
- **Section 2 — Global Clinical Policy Toggles:** Toggle `New goals need supervisor approval` and `Parents can message the care team`.
- **Section 3 — Live Supervision Thresholds:** Set `Minimum Treatment Integrity %` (default 80%), `Minimum IOA %` (default 80%), `Observation Interval Days` (default 30d), and `Stalled Goal Days` (default 14d).
- **Section 4 — Governance Drilldowns:** Full **PDPL Security Audit Log** and **14-Collection Roles & Permissions Matrix** (`Family` vs. `Clinical Team` vs. `Admin` read/write rules).

---

## 11. Overlay Mode: Child Picture Schedule & First-Then Mode (`ChildScheduleMode`)

**File:** `src/components/child/ChildScheduleMode.tsx`
Launched from the top header's `Child Mode` button for direct use with the child on a tablet or desktop screen:
- **Section 1 — Star Reward Bank:** Gamified star counter (`Stars Earned!`) with progress bar toward the child's chosen reward.
- **Section 2 — Visual "First → Then" Board:** Large, high-contrast visual cards showing the current task (**First**) and the motivating reinforcer (**Then**).
- **Section 3 — Interactive Picture Schedule Checklist:** Child-friendly visual routine cards that play celebratory confetti and award a star each time the child taps a completed activity.

---

## 12. Backend Server, Offline-First Sync & Saudi PDPL Privacy Architecture

**Files:** `server/index.js`, `server/models.js`, `server/policy.js`, `src/sync/useServerSync.ts`
- **Monotonic Sequence Synchronization (`seq`):** Every clinical record (`targets`, `savedSessions`, `bips`, `abcRecords`, `homeTasks`, `observations`, `caseNotes`, `teamRequests`, `templates`, `reports`) is stored with a strictly increasing sequence number (`seq`) for conflict-free incremental sync (`GET /api/sync?since=N`).
- **Role & Center Isolation (`policy.js`):**
  - Parents can only read/write records for their own linked `childIds` and never receive `staff`-only messages, internal `caseNotes`, or supervisor `observations`.
  - Clinical staff only access children in their assigned scope (`assigned` vs. `center`) within their own `centerId`.
  - Administrators manage operational entities (`User`, `Child`, `Center`, `Invoice`, `Setting`, `AuditLog`) and summary counts, with a strict privacy wall blocking raw clinical notes and family chats.

