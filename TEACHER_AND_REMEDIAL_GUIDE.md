# Nexia Bridge — Classroom Teacher & Remedial Specialist Capabilities Guide

> **Purpose:** Complete functional, educational, and clinical breakdown of the **General / Inclusive Classroom Teacher Portal (`teacher`)** and the **Remedial & Special Education Specialist Portal (`remedial`)** in **Nexia Bridge**, including why both roles are essential, how they differ, and how the upgraded Teacher Portal bridges clinic-to-school generalization.

---

## 1. Why the Classroom Teacher Role is Critical ("The Generalization Bridge")

In pediatric autism, ADHD, and neurodevelopmental care, the single biggest clinical failure point is **lack of generalization**:
- A child may achieve **90% mastery** on a skill (e.g., answering *WH* questions, following a 2-step direction, or requesting help) inside a quiet, 1-on-1 clinic room with their BCBA, Speech Therapist (SLP), or Remedial Specialist.
- Yet that same child may drop to **30% independence** inside a real school classroom with 20+ peers, competing classroom noise, group transitions, and a teacher who is managing the entire class.
- Historically, general classroom teachers are excluded from clinical software because clinical datasheets (20-trial DTT grids, interval timers, ABC matrices) are **impossible to fill out while teaching a live class**.

**Nexia Bridge solves this with two distinct, purpose-built school portals:**
1. **General / Inclusive Classroom Teacher Portal (`teacher`):** Built for **speed (< 15 seconds), zero clinical jargon, and real-time generalization tracking** during live group lessons.
2. **Remedial & Special Education Specialist Portal (`remedial`):** Built for **structured 1-on-1 or small-group academic intervention**, curriculum-based measurement (`WCPM`, `Digits/min`), explicit instruction, and IEP goal mastery.

---

## 2. Core Difference: Classroom Teacher vs. Remedial & Special Ed Specialist

| Dimension | General / Inclusive Classroom Teacher (`teacher`) | Remedial & Special Education Specialist (`remedial`) |
| :--- | :--- | :--- |
| **Primary Environment** | Mainstream or inclusive classroom (15–25+ students) during live group subjects (Science, Circle Time, Art, Recess transitions). | Pull-out learning support room, resource room, or 1-on-1 / small-group special education session. |
| **Core Mission** | **Generalization & Inclusion:** Observe whether the child can apply clinic/IEP skills independently among peers in natural school routines. | **Targeted Academic Remediation:** Close specific foundational skill gaps in reading fluency, decoding, math calculation, and written expression. |
| **Recording Speed & UX** | **4-Tap Quick Log (< 15 seconds):** `Student → Goal → Activity → 4-Level Independence Outcome` + optional voice dictation. | **Full Plan-Driven Clinical Datasheet:** Trial-by-trial scoring, fluency timers, cold probes, error analysis, and SOAP notes. |
| **Language & Terminology** | **Plain, Jargon-Free Educational Language:** *Completed independently*, *Partially completed*, *Needed help*, *Not completed*. | **Specialized Special-Ed & Clinical Metrics:** `WCPM` (Words Correct Per Minute), `Digits/min`, `Cold Probe %`, `Explicit Instruction`, `Task Analysis`, `Token Economy`. |
| **How Data is Used** | Feeds **Classroom Generalization data** back to the clinical team's target graphs and shares positive school participation updates with parents. | Tracks **IEP Academic Goal Mastery** across multi-metric clinical graphs, auto-drafts formal **SOAP Notes**, and submits goals for **Clinical Supervisor** sign-off. |
| **Navigation Tabs** | 4 Tabs: `Today` (Record Activity & Classroom Passport), `Students` (Roster & Independence Matrix), `Notes` (Classroom Logs & Team Sharing), `Family` (School–Home Bridge). | 5 Tabs: `Today` (Session Planner, Fluency Datasheet & SOAP Note), `Goals` (IEP Learning Goals), `Graphs` (WCPM & Mastery Trends), `Notes` (SOAP Archive), `Family` (Parent Chat & Home Tasks). |

---

## 3. Upgraded General Classroom Teacher Portal (`TeacherPortal`)

### What Was Upgraded in the Teacher Portal
To make the Classroom Teacher Portal a true clinical-to-school bridge on both **Desktop Web** and **Mobile**, we upgraded it from a static form into a live, roster-connected workspace:

1. **Connected to Live Student Caseload & Cross-Discipline Targets:**
   - Replaced static placeholder names with the organization's live `childrenList` and active `targets`.
   - Teachers can switch between assigned students in one tap and record observations against **either preset classroom routines or the child's active Speech, Behavior, OT, Remedial, and Classroom goals**.
2. **Automatic Clinical Generalization Sync:**
   - When a teacher records a classroom observation on a linked clinical goal, it automatically translates the 4-level classroom outcome into a generalization score (`Completed independently` = `100%`, `Partially completed` = `65%`, `Needed help` = `40%`, `Not completed` = `0%`) and appends a `Classroom Observation` entry to the goal's progress history.
3. **Classroom Accommodation Passport & Clinical Quick-Tips (`classroom-passport`):**
   - Displays an at-a-glance card alongside the activity recorder showing **what works best for this child in class** (e.g., *Visual First-Then cues on desk*, *5-second wait time after WH questions*, *2-minute heavy-work sensory regulation before writing*) plus live **Behavior Support Quick Tips** pulled from the child's active `BipPlan`.
4. **Hands-Free Voice Dictation & Quick Observation Chips:**
   - Integrated live speech-to-text dictation (`useVoiceDictation` supporting English and Arabic) and 1-tap observation chips (*"Raised hand spontaneously"*, *"Used desk visual schedule"*, *"Needed 1 verbal prompt"*, *"Worked cooperatively with peer partner"*, *"Self-regulated using calm corner"*).
5. **Custom Classroom Goal Creation (`discipline: 'teacher'`):**
   - Teachers can add new classroom inclusion goals (*Classroom Participation*, *Peer Social Interaction*, *Transitions & Routines*, *Group Attention & Seating*, *Self-Regulation in Class*) that flow into the **Clinical Supervisor's Review Queue**.
6. **Direct Care-Team & Family Sharing (`ShareToTeamModal` + `Family` Tab):**
   - Teachers can share any logged classroom observation directly into the Parent, BCBA, SLP, OT, or Supervisor chat threads, and coordinate daily school-to-home practice in the dedicated **Family** tab.

---

### Tab-by-Tab Breakdown of the Classroom Teacher Portal

#### Tab 1: Today — Fast 4-Tap Activity Recorder & Classroom Passport
- **Left Panel (4-Tap Recorder):**
  1. **Select Student:** Quick student switcher pills.
  2. **Select Goal:** Dropdown combining active interdisciplinary goals + core classroom routines, with a toggle to sync the observation directly to the clinical goal's generalization graph.
  3. **Select or Type Activity:** Free-text input + 1-tap subject chips (*Science: parts of a plant*, *Morning Circle & Calendar*, *Small-Group Reading Station*, *Math Manipulatives & Counting*, *Art & Fine-Motor Craft*, *Recess / Classroom Transition*).
  4. **Tap Independence Outcome:**
     - `Completed independently` (Green — 100% / no teacher prompt needed; triggers celebration confetti)
     - `Partially completed` (Indigo — 65% / started or completed part independently)
     - `Needed help` (Amber — 40% / required verbal, gestural, or model prompt)
     - `Not completed` (Red — 0% / needed full redirection)
  5. **Optional Note with Voice Dictation:** Hands-free microphone dictation (`Dictate` / `Stop`), photo attachment button, and 1-tap observation phrase chips.
- **Right Panel (Classroom Accommodation Passport):**
  - Displays the student's school, classroom, clinical accommodations, active Behavior Intervention Plan (BIP) replacement strategy, and clickable cards for every active goal being generalized in school.

#### Tab 2: Students — Classroom Roster & Independence Matrix
- Multi-column responsive grid of all students in the teacher's class.
- Shows each student's **Overall Classroom Independence %**, **Active Goals Count**, **Focus Classroom Goal**, and a **4-Box Outcome Breakdown** (`Indep`, `Partial`, `Help`, `Not yet`).
- One-tap buttons to **Record Activity** for that student or jump to their filtered **Logs**.

#### Tab 3: Notes — Filterable Classroom Logs & Care-Team Sharing
- Filter observations by **Student** and by **Independence Outcome**.
- Each card displays the student, subject/activity, timestamp, goal, color-coded outcome, teacher note, and a **Share with care team** button that opens `ShareToTeamModal` to post the observation to Parents, BCBA, SLP, OT, or Remedial threads.

#### Tab 4: Family — School–Home Bridge (`ParentChat` & `HomeTasksManager`)
- **Two-Way Parent Chat:** Direct messaging between the classroom teacher and the child's parents (with unread message badges on the navigation bar).
- **Home Practice Alignment:** View and assign simple school-to-home carryover tasks and see when parents mark them completed at home.

---

## 4. Remedial & Special Education Specialist Portal (`RemedialPortal`)

While the Classroom Teacher focuses on group inclusion and natural generalization, the **Remedial Specialist (`remedial`)** operates a full clinical/educational intervention workstation powered by `TherapyPortal`:

### Key Capabilities of the Remedial Portal
1. **Session Planner (`SessionPlanner`):**
   - Configure evidence-based special education procedures before or during the session:
     - **Procedures:** `Task Analysis`, `Token Economy`, `Explicit Instruction`, `Error Correction`, `Guided Practice`, `Chunking & Graphic Organizers`.
     - **Measurements:** `Words Correct Per Minute (WCPM)`, `Digits Correct Per Minute`, `Rate`, `Percentage Correct`, `Cold Probe`, `Writing Rubric %`, `Error Count`, `Treatment Integrity %`.
2. **Plan-Driven Remedial Datasheet (`Today` Tab):**
   - **Reading Fluency (`WCPM`) & Math Fluency (`Digits/min`) Probes:** Timed fluency counters that calculate rate and accuracy automatically.
   - **Trial-by-Trial & Prompt-Level Scoring:** Score each instructional trial (`+` Independent, `P` Prompted, `-` Incorrect) and record the exact prompt hierarchy used.
   - **Cold Probe Scoring:** First-trial unprompted checks to verify true retention from the previous remedial session.
   - **Automated Clinical Decision Support (`decide`):** Evaluates the last 3 sessions against the goal's mastery criterion and recommends whether to *Advance to next step*, *Continue current instruction*, or *Simplify / add visual scaffolding*.
3. **Structured SOAP Note & Voice Dictation (`SoapNoteCard`):**
   - Auto-drafts the **Objective (`O`)** section from the datasheet's WCPM, accuracy %, and trial counts.
   - Supports bilingual **Voice Dictation** (`S`, `O`, `A`, `P`), 1-click **Share to Care Team**, and **Session Report for Parents** export.
4. **IEP & Remedial Learning Goals (`Goals` Tab / `TargetsPanel`):**
   - Create, edit, and track academic learning goals across `Reading Fluency & Decoding`, `Reading Comprehension`, `Math Calculation & Word Problems`, `Written Expression & Spelling`, and `Executive Functioning & Study Skills`.
   - Launch any goal directly into the active session datasheet.
5. **Multi-Metric Academic Graphs (`Graphs` Tab / `BehaviorGraphs`):**
   - Plot longitudinal progress across 10 remedial metrics: `Words / min (WCPM)`, `Digits / min`, `Percent correct`, `% independent`, `Cold probe %`, `Accuracy %`, `Writing rubric %`, `Errors`, `Rate / min`, and `Integrity %`.
6. **Official Remedial SOAP Archive & Family Bridge (`Notes` & `Family` Tabs):**
   - Searchable archive of signed remedial SOAP notes (`SoapArchive`) + two-way parent chat and home learning assignments (`FamilyPanel`).

---

## 5. Suggested Slide Deck Outline for Client Presentation (8 Slides for Claude)

You can copy and paste this guide into Claude to generate slides covering the School & Educational Portals:

1. **Slide 1 — The School Inclusion Challenge ("The Generalization Gap"):** Why children who master skills in 1-on-1 therapy struggle in 25-student classrooms—and why schools need two distinct portals (`Classroom Teacher` vs. `Remedial Specialist`).
2. **Slide 2 — Role Comparison Matrix:** Side-by-side breakdown of **General Classroom Teacher** (15-second 4-tap inclusion logging) vs. **Remedial Specialist** (1-on-1 IEP academic intervention & WCPM fluency probes).
3. **Slide 3 — Classroom Teacher Portal: 4-Tap Activity Recording:** How a teacher logs `Student → Goal → Activity → Independence Outcome` in under 15 seconds during a live lesson, with hands-free voice dictation.
4. **Slide 4 — The Classroom Accommodation Passport:** Giving teachers instant, jargon-free clinical strategies (*First-Then visuals*, *wait-time cues*, *sensory regulation*, and *BIP replacement behaviors*) right next to their activity log.
5. **Slide 5 — Automatic Clinic-to-Classroom Generalization Sync:** How classroom teacher observations automatically feed into clinical goal progress graphs and can be shared with parents and therapists in one click.
6. **Slide 6 — Classroom Roster & Independence Analytics (`Students` Tab):** Tracking independence percentages and outcome breakdowns (`Indep`, `Partial`, `Help`, `Not yet`) across all students in the classroom.
7. **Slide 7 — Remedial Specialist Portal: Precision Academic Intervention:** Plan-driven datasheets for Reading Fluency (`WCPM`), Math Fluency (`Digits/min`), Cold Probes, Explicit Instruction, and IEP Goal Mastery graphs.
8. **Slide 8 — Unified School–Clinic–Home Loop:** How the Classroom Teacher, Remedial Specialist, Clinical Therapists (ABA, SLP, OT), Supervisor, and Parents stay aligned around one child record.

