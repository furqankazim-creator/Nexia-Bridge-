# Nexia Bridge — Clinical Supervisor & Administrator Capabilities Guide

> **Purpose:** Complete functional, clinical, and architectural breakdown of the **Clinical Supervisor Portal** and the **Organization Administrator Portal** in **Nexia Bridge**, structured for client presentations, slide decks, and executive overviews.

---

## Executive Summary

**Nexia Bridge** separates **clinical governance** from **organizational administration** to comply with healthcare privacy standards (including Saudi **PDPL** requirements) and BACB/clinical supervision best practices:

1. **Clinical Supervisor Portal** — Focused on **clinical quality, treatment fidelity, caseload outcomes, and therapist mentorship**. Supervisors oversee assigned children and interdisciplinary teams, approve/revise goals, sign off on therapy sessions and SOAP notes, score treatment integrity & Inter-Observer Agreement (IOA), manage clinical templates, and publish signed monthly clinical audits.
2. **Administrator Portal** — Focused on **multi-tenant operations, licensing, access control, case assignment, billing, and compliance auditing**. Administrators manage centers, staff/parent accounts, seat licensing, invoices, clinical policy thresholds, and PDPL audit streams—**without exposing sensitive raw clinical notes, ABC behavior logs, or private family messages**.

---

## Part 1: Clinical Supervisor Portal

### Role Scope & Clinical Governance
The **Clinical Supervisor** operates across a 5-tab clinical governance portal:
- **Clinical Supervisor Capabilities:** Approves/edits/returns therapy goals, reviews and signs off on session datasheets & SOAP notes, conducts live/video staff fidelity observations & IOA checks, manages caseload plans, authors and approves clinical templates (`SOAP`, `DTT`, `Behavior Plan`, `Task Analysis`), and publishes signed monthly clinical audits.
- **Visibility Scope (Set by Admin):** Can be scoped to **Assigned Children** (specific caseload) or **Whole Center** (all active children in their clinic/school/center).

---

### Tab 1: Review Queue (`ReviewTab`)
The central command center for daily clinical sign-off and quality control.

- **Real-Time Queue Counters & Age Badges:**
  - Instant counters for **Goals Awaiting Approval** and **Sessions to Review**.
  - Color-coded waiting-time badges (`today`, `waiting 1–3 days` in grey, `4–7 days` in amber, `>7 days` in red) to prevent clinical bottlenecks.
- **Multi-Dimensional Filtering:**
  - Filter queue items simultaneously by **Discipline** (Behavior, Speech, OT, Remedial, Classroom), **Therapist**, and **Child**.
- **Goal Approval Workflows:**
  - Inspect full goal metadata: Discipline, Domain, Operational Definition, Therapist, Baseline %, Mastery Criterion, Target Date, and Prompt Hierarchy.
  - **4 Decision Actions:**
    1. **Approve** (single-click or **Bulk Approve** across multiple selected goals).
    2. **Edit Then Approve:** Adjust Mastery Criterion, Target Date, or Prompt Hierarchy inline and approve in a single step (automatically logged in goal audit history).
    3. **Return with Comment:** Send back to the therapist with required revisions (`needs_review`).
    4. **Reject:** Reject unsuitable goals with mandatory clinical rationale (`rejected`).
  - **Returned/Rejected Tracking:** Live status indicator showing whether the therapist has acknowledged the supervisor's feedback (`✓ Therapist acknowledged` vs. `Not acknowledged yet`).
- **Session & SOAP Note Sign-Off Workflows:**
  - Review both **Trial Datasheets** (Accuracy %, Independent / Prompted / Incorrect trial counts, self-recorded Integrity % & IOA %) and **SOAP Notes**.
  - **Line-by-Line Note Commenting:** Open any session to view notes broken down line by line; click **Comment** on any specific sentence to quote it and attach targeted feedback that the therapist must acknowledge.
  - **3 Review Decisions:**
    1. **Sign Off** (`signed`) — Finalizes the clinical record.
    2. **Request Correction** (`changes`) — Returns datasheet/note to the therapist with specific correction instructions.
    3. **Flag for Re-Training** (`retrain`) — Flags the session and alerts the therapist for skill re-training.
- **Closed-Loop Therapist Feedback (`SupervisorFeedbackCard`):**
  - Any returned goal, session correction request, re-training flag, or line comment immediately appears as a high-priority banner on the therapist's **Today** tab with an **Acknowledge** button that syncs back to the Supervisor Portal.

---

### Tab 2: Caseload & Children Overview (`ChildrenTab`)
Holistic, multi-disciplinary tracking for every child on the supervisor's caseload.

- **Caseload Summary & Automated Status Engine:**
  - Displays total active children, total goals across disciplines, breakdown of `approved` / `awaiting approval` / `returned or rejected`, and overall average performance across approved goals.
  - **Automated Child Status Classification:**
    - `Needs review` (Amber): Pending goals or unsigned sessions awaiting supervisor action.
    - `Needs support` (Red): One or more approved goals flagged by the clinical decision engine as needing teaching-plan adjustment.
    - `On track` (Green): Progressing normally toward mastery criteria.
    - `No goals yet` (Grey): New intake awaiting initial goals.
  - **Automated Goal Health Engine (`goalHealth`):**
    - Evaluates every goal into 6 clinical states:
      1. `On track` — Scores moving toward mastery criterion.
      2. `At risk` — Latest score is $\ge 20$ points below criterion, or 3 consecutive falling session scores.
      3. `Stalled` — No session recorded for $N$ days (configurable by Admin, default 14 days), or 3 flat scores (within 3 percentage points) below criterion.
      4. `Mastered` — Goal has achieved mastery and is holding at or above criterion.
      5. `Regressed` — Previously mastered goal dropped below its mastery criterion.
      6. `New` — Baseline only; no therapy sessions recorded yet.
- **Per-Child Deep Dive & 5 Clinical Action Sheets:**
  - Expanding a child card shows proactive **"Needs your attention"** alerts, the assigned interdisciplinary team, and discipline-by-discipline goal averages.
  - **1. Goal Detail & Audit History Sheet:**
    - Visual **Trend Graph** against the mastery criterion threshold line.
    - **Prompt-Level Breakdown Bar:** Aggregate Independent vs. Prompted vs. Incorrect trials and percentages across all sessions.
    - **Full Version History:** Every creation, edit, approval, or return with timestamp, author, exact field diffs, and clinical reason.
    - **Goal Editor:** Modify goal name, operational definition, mastery criterion, target date, prompt hierarchy, or phase (`baseline`, `teaching`, `generalizing`, `maintenance`, `mastered`) with a mandatory audit reason.
  - **2. Add Goal & Approved Goal Bank (`GOAL_BANK`):**
    - Supervisors can author custom goals or pick pre-approved clinical wording from the built-in **Goal Bank** (filtered by discipline) and **Add and Approve** in one step.
  - **3. Behavior Intervention Plan (BIP) Sheet:**
    - Read-only clinical view of the child's active/draft BIP (Version, Review Date, Target Behavior, Operational Definition, Hypothesized Function, Replacement Behavior, Antecedent/Teaching/Consequence Strategies, Reinforcement, Data Method) + count of recorded **ABC behavior events** in the last 30 days.
  - **4. Home Practice Publisher:**
    - Create and publish structured home practice assignments directly to the **Parent Portal** (Task title, session duration in minutes, date range, and parent instructions) and monitor completion status (`Done` vs. `Open`) and parent feedback notes.
  - **5. Case Notes & IEP Review Tracker:**
    - Log general clinical notes, **Team Meetings**, and **IEP Reviews** (with mandatory **Next Review Date** that surfaces on the child's main caseload card).
  - **6. Team Change Request Workflow:**
    - Request the Administrator to **Add a therapist** (by discipline), **Remove a therapist**, or **Swap a therapist** on the child's care team, with live status tracking (`Open`, `Done`, `Declined`) and administrator response notes.

---

### Tab 3: Staff Fidelity, IOA & Supervision (`StaffTab`)
Evidence-based clinical supervision, treatment integrity scoring, and BACB-style supervision hour tracking.

- **Proactive Supervision Alerts Banner (`supervisionAlerts`):**
  - Automatically flags therapists when:
    - Treatment integrity falls below organization minimum (default `80%`).
    - Inter-Observer Agreement (IOA) falls below organization minimum (default `80%`).
    - Therapist has not been observed within the required interval (default `30 days`) or has `Never been observed`.
    - Unsigned session notes are overdue by $>7$ days.
    - A scheduled **Re-check date** from a prior observation is due or overdue.
- **Per-Therapist Performance Cards (`therapistCards`):**
  - Displays roles/disciplines, total sessions, active caseload count, pending notes count, **Treatment Integrity %** (distinguishing supervisor-observed vs. self-recorded), **IOA %**, last observation date, supervision hours this month, and unacknowledged feedback badges.
- **Live & Video Observation Recorder (`ObservationForm`):**
  - Supports 4 supervision modalities: **Live observation**, **Video review**, **Meeting**, and **Training**.
  - **Interactive Fidelity Checklist:**
    - 5 default clinical steps (*Sets up materials/environment*, *Gives instruction clearly*, *Uses planned prompt level*, *Delivers reinforcement correctly*, *Records every trial/response*) + ability to **add custom steps** or remove steps.
    - Score each step as `Correct`, `Incorrect`, or `N/A`.
    - Live calculation of **Treatment Integrity %**:
      $$\text{Treatment Integrity} = \frac{\text{Correct Steps}}{\text{Scored Steps (excluding N/A)}} \times 100$$
  - **Built-in Inter-Observer Agreement (IOA) Calculator:**
    - **Trial-by-Trial IOA:**
      $$\text{IOA} = \frac{\text{Trials Agreed}}{\text{Total Trials}} \times 100$$
    - **Total-Count IOA:**
      $$\text{IOA} = \frac{\min(\text{Therapist Count}, \text{Supervisor Count})}{\max(\text{Therapist Count}, \text{Supervisor Count})} \times 100$$
  - **Competency Tagging & Action Plans:**
    - Tag staff competencies (*Prompt fading*, *Data accuracy*, *Reinforcement*, *Session pacing*, *Parent communication*, *Task analysis*).
    - Record written **Feedback**, **Action Items**, and a scheduled **Re-check Date**.
- **Monthly Supervision Hours Tally & Filterable Supervision Log:**
  - Automatic monthly tally of supervision hours/minutes per therapist and organization-wide total.
  - Complete chronological Supervision Log filterable by therapist, showing integrity/IOA pills, re-check dates, and whether the therapist has acknowledged the coaching feedback.

---

### Tab 4: Monthly Clinical Audits & Reports (`ReportsTab`)
Automated clinical analytics, narrative generation, multi-period comparison, and parent/PDF distribution.

- **Flexible Period & Scope Controls:**
  - Presets for **This Month**, **Last Month**, **Last 30 Days**, or **Custom Date Range**.
  - Filter report scope by **Discipline**, **Therapist**, and/or **Child**.
- **8 Executive KPI Cards:**
  - Children in scope, Goals, Sessions in period, Average Performance %, Treatment Integrity %, IOA %, Home Practice Completion %, and Items Waiting for Review.
- **Granular Breakdowns:**
  - **By Child:** Sessions count, average accuracy %, **period-over-period trend delta** (e.g., `+8 vs previous period`), goals started/mastered/needing attention, and aggregate prompt breakdown (independent/prompted/incorrect).
  - **By Therapist:** Sessions count, integrity %, IOA %, note completion %, and **average supervisor review turnaround time in days**.
  - **By Discipline:** Session volume and goal distribution across Speech, Behavior, OT, Remedial, and Classroom.
  - **Home Practice & Behavior Trends:** Weekly bar chart of recorded ABC behavior events + active vs. draft Behavior Plans.
- **Auto-Generated Editable Clinical Narrative:**
  - Automatically synthesizes all statistics into a structured prose clinical summary (`reportNarrative`) with a recommendations section.
  - Supervisors can freely edit the narrative text or click **Rewrite from the numbers** to regenerate.
- **Sign, Archive, Compare & Distribute:**
  - **Save Draft** or **Sign and Save** (stamps report with supervisor's digital signature).
  - **Side-by-Side Report Comparison:** Select any two saved reports to view an automatic delta table (`Goals`, `Sessions`, `Average Performance`, `Integrity`, `IOA`, `Mastered` with `+/-` changes between periods).
  - **Export PDF (RTL/LTR aware):** Generates a formatted, print-ready clinical audit table and signed narrative supporting both English (LTR) and Arabic (RTL).
  - **Share with Parents:** When filtered to a single child, sends the signed progress summary directly to the family's message thread (with consent confirmation).

---

### Tab 5: Clinical Templates Library (`TemplatesTab`)
Standardizes clinical documentation and protocols across the organization.

- **4 Template Categories:**
  1. `SOAP Note` (structured clinical note templates)
  2. `DTT Data Sheet` (discrete trial training steps & instructions)
  3. `Behavior Plan` (BIP structure & crisis/antecedent/consequence sections)
  4. `Task Analysis` (chained step-by-step occupational/life-skills sequences)
- **Starter Library & Version Control:**
  - One-click **Load Starter Templates** to populate clinical defaults.
  - Automatic version incrementing (`v1`, `v2`, etc.). Editing an already-approved template automatically creates a new draft version requiring fresh approval.
- **Template Approval Lifecycle:**
  - `Draft` → Click **Send for approval** → `Submitted (Awaiting approval)` → **Clinical Supervisor** clicks **Approve** (or **Return** / **Withdraw approval**) → `Approved`.

---

## Part 2: Organization & Center Administrator Portal

### Architectural Highlights: Multi-Tenancy & Privacy-by-Design
- **Two-Tier Admin Hierarchy:**
  1. **Organization-Wide Administrator:** Manages all centers, global settings, subscription plans, staff invite codes, cross-center case transfers, and administrator accounts.
  2. **Center Administrator:** Scoped strictly to their assigned center (`myCenterId`). Can manage staff, children, teams, and invoices within their site, while global policies and other centers remain locked/hidden.
- **Clinical Privacy Wall (Saudi PDPL Compliant):**
  - Administrators see **operational counts, seat usage, and compliance metadata only**.
  - Raw clinical SOAP notes, ABC behavior logs, therapy audio clips, and family-therapist messages are **blocked from the Admin role** at both the UI and server policy layers.
- **Dual Execution Mode:**
  - Works seamlessly against the **Live Node/Express + MongoDB Backend (`adminApi`)** or in **Offline Demo Mode (`demoAdminApi`)** with full local persistence and one-click demo reset.

---

## Tab 1: Admin Home Dashboard (`AdminPortal` — Home)
Executive snapshot of organizational health, licensing, pending team requests, and compliance.

- **Subscription & Seat Utilization Card:**
  - Shows active plan tier, organization name, status badge (`Active Plan` / `Paused`), **Seats Used vs. Licensed Seats** (`seatsUsed / plan.seats`), billing cycle (`Annual` / `Monthly`), and renewal date, with quick link to **Manage Seats & Invoices**.
- **Staff Accounts Quick Card:**
  - Shows count of licensed clinical staff, preview of active specialists, and an **Invite New Specialist** launcher that opens the account creation flow pre-selected for Behavior, Speech, OT, Remedial, Teacher, or Supervisor.
- **Supervisor Team Change Requests Inbox:**
  - Receives real-time requests submitted by Supervisors from the `ChildrenTab` (e.g., *Add a Speech therapist*, *Remove/Swap therapist*).
  - Admins can jump directly to the case, **Mark Done** (with an explanation note back to the supervisor), or **Decline** (with a mandatory reason).
- **PDPL Compliance Audit Stream Preview:**
  - Live feed of the latest security and administrative events with one-click drilldown to the full **Audit Log**.
- **Whole-Organization Operational Figures:**
  - Active Children, Active Centers, Outstanding Invoice Balance (SAR), Sessions in last 30 days, Average Goal Performance %, Home Practice Completion %, and Discipline breakdown, plus a **Generate Monthly Summary** plain-text audit generator.

---

### Tab 2: Portals, Staff Directory & Cases (`PortalsTab` & `CasesTab`)
Unified management of every portal group (`Children`, `Behavior`, `Speech`, `OT`, `Remedial`, `Teacher`, `Supervisor`, `Parents`).

- **Portal-Specific KPI Strips:**
  - Selecting any clinical portal displays live operational metrics: Active Staff, Children Served, Total Goals, and 30-Day Session Volume (or Waiting Goals/Sessions for Supervisors, and Linked Families for Parents).
- **Staff & Parent Account Provisioning (`AccountSheet`):**
  - Create logins with Full Name, Email, Professional Title/Credential (e.g., *BCBA*, *Senior SLP*), Phone, Role (`behavior`, `speech`, `ot`, `remedial`, `teacher`, `supervisor`, `parent`), and Center assignment.
  - **Visibility Scope Control:**
    - `Assigned children`: Staff member only accesses hand-picked children.
    - `Whole centre`: Staff member automatically accesses every current and future active child in their center (`syncScopedAccess`).
  - **One-Time Sign-In Credentials Card:**
    - Auto-generates a strong temporary password and formats a ready-to-share **Sign-In Card** (Name, Role, Title, Center, Assigned Children, Server URL, Email, Temporary Password) with one-click **Copy**.
  - **Account Lifecycle Actions:**
    - **Reset Password** (generates new credential card), **Deactivate / Switch On** (frees or consumes a license seat; prevents self-deactivation), and **Remove Account** (deletes login while preserving historical clinical records on the child's file).
- **Case & Child Management (`CasesTab` & `CaseSheet`):**
  - Filter between **Active** and **Archived** cases.
  - **Add Child:** Creates a child profile scoped to a center and generates a unique 8-character **Family Invite Code**.
  - **Reassign Therapists:** Visual chip selector to assign or update the child's multi-disciplinary therapy team (automatically enforcing same-center rules).
  - **Transfer Case Across Centers:** Organization-wide admins can transfer a child to a different center; **data separation rules** automatically revoke access from the previous center's staff while preserving parent access.
  - **Regenerate Family Code:** Invalidates the old family invite code and issues a new one.
  - **Archive / Restore Case:** Makes the case read-only and removes it from active therapist caseloads without deleting historical data.

---

### Tab 3: Multi-Site Centers Management (`CentersTab`)
Multi-tenant site separation for clinics, schools, and therapy centers.

- **Center Cards with Live Headcounts:**
  - Displays each center's name, facility type (`Clinic`, `School`, `Center`, etc.), status (`Active` / `Archived`), and live counts of **Active Staff**, **Active Children**, and **Center Admins**.
- **Create, Edit & Safely Archive Centers:**
  - Organization-wide admins can create new centers or rename/reclassify existing ones.
  - **Safe Archive Guardrail:** The backend blocks archiving a center if it still has active children or active staff, prompting the admin to transfer or deactivate them first.

---

### Tab 4: Billing, Subscriptions & Invoicing (`BillingTab`)
End-to-end subscription seat management and client/center invoicing in **SAR**.

- **Subscription & Seat Capacity Management (`PlanSheet`):**
  - Visual progress bar of **Seats Used vs. Total Licensed Seats** (turns red at capacity).
  - Enforced across the server: creating or reactivating a staff account is blocked (`HTTP 409`) if all licensed seats are in use.
  - Organization admins can update the **Plan Name**, **Licensed Seats** (validated so it cannot be lowered below currently active seats), **Billing Cycle** (`Annual` / `Monthly`), **Billed Month**, and **Renewal Date**.
- **Invoice Lifecycle & Financial Totals:**
  - Live financial summary cards for **Draft**, **Outstanding (Issued)**, and **Paid** totals in SAR.
  - Create invoices linked to a specific **Child**, a **Center**, or the **Whole Organization**, with description, amount (SAR), and due date.
  - **Strict State Machine (`draft` → `issued` → `paid` / `void`):**
    - `Draft`: Editable description, amount, and due date; can be **Issued** or **Voided**.
    - `Issued`: Locked from editing; stamps `issuedAt` timestamp; can be **Marked Paid** (stamps `paidAt`) or **Voided**.
    - `Paid` & `Void`: Final immutable states for financial integrity.
  - One-click **Copy Invoice Text** for sharing via email or WhatsApp.

---

### Tab 5: Global Clinical Policy, Governance & Settings (`SettingsTab`)
Organization-wide operational rules, clinical supervision thresholds, and compliance matrices.

- **Organization Branding:**
  - Set the **Organization Name** displayed across every portal's header and printed PDF reports.
- **Self-Registration & Invite Code Controls:**
  - Toggle **Staff can sign up with the invite code** (`staffSelfRegistration`).
  - Toggle **Families can sign up with a child code** (`familySignup`).
  - **Staff Invite Code Vault:** Mask/unmask, copy, or **Rotate/Replace** the organization's staff registration code (immediately invalidating the previous code).
- **Global Clinical Policy Toggles:**
  - **New goals need supervisor approval** (`requireGoalApproval`): When ON, therapist-created goals enter `awaiting_approval`; when OFF, goals are auto-approved immediately.
  - **Parents can message the care team** (`parentMessaging`): Toggle two-way family messaging vs. read-only announcements.
- **Configurable Supervision Thresholds (Live-Linked to Supervisor Portal):**
  1. **Minimum Treatment Integrity %** (`0–100%`, default `80%`) — Threshold below which therapists are flagged in the Supervisor Portal.
  2. **Minimum Inter-Observer Agreement (IOA) %** (`0–100%`, default `80%`) — Threshold below which IOA scores trigger alerts.
  3. **Observation Interval Limit** (`1–365 days`, default `30 days`) — Maximum days allowed between supervisor observations of an active therapist.
  4. **Stalled Goal Limit** (`1–365 days`, default `14 days`) — Days without a session before a goal is automatically marked `Stalled`.
- **Governance Drilldowns:**
  - **Full PDPL Audit Log (`audit`):** Chronological, tamper-evident stream of sign-ins, account creations, password resets, role changes, team reassignments, case transfers, code rotations, invoice updates, and policy changes (scoped to the center for Center Admins, or organization-wide for Org Admins).
  - **Roles & Permissions Matrix (`roles` / `accessMatrix`):** Visual read/write access matrix across all 14 clinical data collections (`Goals`, `Sessions & SOAP notes`, `Behavior plans`, `Home tasks`, `Messages`, `ABC records`, `Reinforcers`, `Weekly questions`, `Sentence tasks`, `Articulation logs`, `Audio clips`, `OT checklists`, `OT task analyses`, `Sensory diet`) comparing **Family**, **Clinical Team**, and **Admin** permissions.
- **Device & Localization Preferences:**
  - Instant **English (LTR) / Arabic (`العربية` RTL)** toggle and **Light / Dark Theme** switch.

---

## Part 3: Suggested Slide Deck Outline (10-Slide Structure for Claude)

When pasting this document into Claude to generate your client presentation, you can ask Claude to follow this 10-slide structure:

1. **Title Slide:** *Nexia Bridge — Clinical Governance & Multi-Tenant Administration*
2. **Governance Architecture:** How Nexia Bridge separates Clinical Supervision (quality & outcomes) from Administration (operations & PDPL privacy).
3. **Supervisor Portal — Daily Review Queue:** Approving goals, bulk sign-off, editing criteria inline, and line-by-line session/SOAP note coaching.
4. **Closed-Loop Therapist Feedback:** How supervisor returns, retraining flags, and comments appear on the therapist's Today dashboard and require acknowledgement.
5. **Caseload Intelligence & Goal Health Engine:** Automated child status (`On track`, `Needs support`, `Needs review`) and 6-state Goal Health detection (`Mastered`, `Regressed`, `Stalled`, `At risk`).
6. **Staff Fidelity & IOA Supervision:** Live/video observations, interactive treatment integrity checklists, Trial-by-Trial & Total-Count IOA calculators, and monthly supervision hour tallies.
7. **Clinical Audits, Reports & Standardized Templates:** Auto-generated clinical narratives, period-over-period comparison, RTL/LTR PDF exports, and clinical template management (`SOAP`, `DTT`, `BIP`, `Task Analysis`).
8. **Administrator Portal — Multi-Site & Case Operations:** Managing clinics/schools, provisioning staff & parent accounts, `Assigned` vs. `Whole Center` visibility scopes, and cross-center case transfers.
9. **Subscription Licensing & SAR Billing:** Seat capacity enforcement, invoice state machine (`Draft` $\rightarrow$ `Issued` $\rightarrow$ `Paid`), and financial tracking by child or center.
10. **Clinical Policy Engine & Saudi PDPL Compliance:** Live-configurable supervision thresholds, privacy walls protecting clinical notes from admin view, and the full PDPL security audit log.

