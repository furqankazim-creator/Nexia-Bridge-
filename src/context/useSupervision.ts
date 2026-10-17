import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { PublicOrg } from '../api/client';
import type { CaseNote, ClinicalTemplate, GoalHistoryEntry, Observation, RoleType, SavedReport, SavedSession, Target, TeamRequest, TemplateKind } from '../types';
import type { SyncCol } from '../sync/useServerSync';
import { demoCaseNotes, demoObservations, demoReports, demoTeamRequests, demoTemplates } from '../data/demoSupervision';
import { parseMastery } from '../utils/decisionSupport';
import { STARTER_TEMPLATES } from '../data/starterTemplates';
import { DEFAULT_THRESHOLDS, type Thresholds } from '../utils/supervision';

const KEYS = {
  teamRequests: 'nexia.teamRequests.v1',
  caseNotes: 'nexia.caseNotes.v1',
  observations: 'nexia.observations.v1',
  templates: 'nexia.templates.v1',
  reports: 'nexia.savedReports.v1',
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable
  }
}

const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const today = () => new Date().toISOString().slice(0, 10);

export interface SupervisionDeps {
  isServerMode: boolean;
  role: RoleType | null;
  userName: string;
  notify: (m: string) => void;
  org: PublicOrg;
  targets: Target[];
  setTargets: Dispatch<SetStateAction<Target[]>>;
  sessions: SavedSession[];
  setSessions: Dispatch<SetStateAction<SavedSession[]>>;
  addAudit: (action: string, resource: string) => void;
  tellTherapist: (discipline: string, childId: string, tag: string, text: string) => void;
}

export interface NewGoal {
  childId: string;
  discipline: Target['discipline'];
  name: string;
  domain: string;
  operationalDefinition: string;
  masteryCriterion: string;
  baseline?: number;
  targetDate?: string;
  promptLevel?: string;
}
export interface GoalEdit {
  name?: string;
  operationalDefinition?: string;
  masteryCriterion?: string;
  targetDate?: string;
  promptLevel?: string;
  status?: Target['status'];
}
export interface NewObservation {
  childId: string;
  therapistName: string;
  goalId?: string;
  goalName?: string;
  date: string;
  type: Observation['type'];
  durationMin: number;
  steps: Observation['steps'];
  fidelity: number | null;
  ioa: Observation['ioa'];
  feedback: string;
  actionItems: string;
  recheckDate?: string;
  competencies?: string[];
  /** The therapist's discipline, used to reach their own chat thread when no goal is named. */
  discipline?: string;
}

const entry = (by: string, action: GoalHistoryEntry['action'], note?: string, changes?: string[]): GoalHistoryEntry => ({
  at: new Date().toISOString(),
  by,
  action,
  ...(note ? { note } : {}),
  ...(changes?.length ? { changes } : {}),
});

/** Records and actions for supervision: team requests, case notes, observations, templates, saved reports, goal decisions. */
export function useSupervision(d: SupervisionDeps) {
  const { isServerMode } = d;
  const [teamRequests, setTeamRequests] = useState<TeamRequest[]>(() => (isServerMode ? [] : read(KEYS.teamRequests, demoTeamRequests())));
  const [caseNotes, setCaseNotes] = useState<CaseNote[]>(() => (isServerMode ? [] : read(KEYS.caseNotes, demoCaseNotes())));
  const [fidelityObservations, setObservations] = useState<Observation[]>(() => (isServerMode ? [] : read(KEYS.observations, demoObservations())));
  const [templates, setTemplates] = useState<ClinicalTemplate[]>(() => (isServerMode ? [] : read(KEYS.templates, demoTemplates())));
  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => (isServerMode ? [] : read(KEYS.reports, demoReports())));

  useEffect(() => { if (!isServerMode) write(KEYS.teamRequests, teamRequests); }, [teamRequests, isServerMode]);
  useEffect(() => { if (!isServerMode) write(KEYS.caseNotes, caseNotes); }, [caseNotes, isServerMode]);
  useEffect(() => { if (!isServerMode) write(KEYS.observations, fidelityObservations); }, [fidelityObservations, isServerMode]);
  useEffect(() => { if (!isServerMode) write(KEYS.templates, templates); }, [templates, isServerMode]);
  useEffect(() => { if (!isServerMode) write(KEYS.reports, savedReports); }, [savedReports, isServerMode]);

  const thresholds: Thresholds = {
    integrityMin: d.org.integrityMin ?? DEFAULT_THRESHOLDS.integrityMin,
    ioaMin: d.org.ioaMin ?? DEFAULT_THRESHOLDS.ioaMin,
    observationDays: d.org.observationDays ?? DEFAULT_THRESHOLDS.observationDays,
    stalledDays: d.org.stalledDays ?? DEFAULT_THRESHOLDS.stalledDays,
  };

  const syncCols: SyncCol[] = [
    { col: 'teamRequests', items: teamRequests, apply: (fn) => setTeamRequests(fn as (p: TeamRequest[]) => TeamRequest[]), rid: (x: TeamRequest) => x.id },
    { col: 'caseNotes', items: caseNotes, apply: (fn) => setCaseNotes(fn as (p: CaseNote[]) => CaseNote[]), rid: (x: CaseNote) => x.id },
    { col: 'observations', items: fidelityObservations, apply: (fn) => setObservations(fn as (p: Observation[]) => Observation[]), rid: (x: Observation) => x.id },
    { col: 'templates', items: templates, apply: (fn) => setTemplates(fn as (p: ClinicalTemplate[]) => ClinicalTemplate[]), rid: (x: ClinicalTemplate) => x.id },
    { col: 'reports', items: savedReports, apply: (fn) => setSavedReports(fn as (p: SavedReport[]) => SavedReport[]), rid: (x: SavedReport) => x.id },
  ];

  const me = d.userName;
  const goalOf = (id: string) => d.targets.find((t) => t.id === id);

  /* ---------------- goals ---------------- */

  /** A supervisor writes a goal directly: it is approved on the spot and says so in its history. */
  const createGoal = (g: NewGoal): string => {
    const id = uid('tgt');
    const th = parseMastery(g.masteryCriterion, 90).threshold;
    const next: Target = {
      id,
      childId: g.childId,
      discipline: g.discipline,
      name: g.name.trim(),
      domain: g.domain.trim() || 'General',
      operationalDefinition: g.operationalDefinition.trim() || g.name.trim(),
      materials: [],
      procedureSteps: [],
      masteryCriterion: g.masteryCriterion.trim(),
      criterionThreshold: th,
      currentPerformance: g.baseline ?? 0,
      baseline: g.baseline,
      status: 'baseline',
      suggestedAction: 'Collect baseline data',
      suggestedNextStep: 'Run 3 baseline sessions before starting teaching',
      approvalStatus: 'approved',
      lastThreeSessions: [0, 0, 0],
      origin: 'Written by supervisor',
      therapistName: me,
      targetDate: g.targetDate || undefined,
      promptLevel: g.promptLevel?.trim() || undefined,
      submittedAt: new Date().toISOString(),
      history: [entry(me, 'created', 'Written by the supervisor and approved.')],
    };
    d.setTargets((prev) => [next, ...prev]);
    d.addAudit('Goal created by supervisor', `${next.name} (${next.discipline})`);
    d.tellTherapist(next.discipline, next.childId, 'New goal', `A new approved goal was added for this child: "${next.name}". Criterion: ${next.masteryCriterion}.`);
    d.notify('Goal added and approved.');
    return id;
  };

  const rejectGoal = (id: string, note: string) => {
    const t0 = goalOf(id);
    if (!t0 || !note.trim()) return;
    d.setTargets((prev) => prev.map((t) => (t.id === id ? { ...t, approvalStatus: 'rejected', reviewNote: note.trim(), reviewAckAt: undefined, history: [...(t.history ?? []), entry(me, 'rejected', note.trim())] } : t)));
    d.addAudit('Goal rejected', `${t0.name} (${t0.discipline})`);
    d.tellTherapist(t0.discipline, t0.childId, 'Supervisor feedback', `Goal "${t0.name}" was rejected: ${note.trim()}`);
    d.notify('Goal rejected. The therapist has been told.');
  };

  /** A supervisor revises a goal. A reason is required and every change is kept in the history. */
  const editGoal = (id: string, patch: GoalEdit, reason: string): boolean => {
    const t0 = goalOf(id);
    if (!t0 || !reason.trim()) return false;
    const changes: string[] = [];
    const fields: Partial<Target> = {};
    if (patch.name !== undefined && patch.name.trim() && patch.name.trim() !== t0.name) { changes.push(`Goal: "${t0.name}" → "${patch.name.trim()}"`); fields.name = patch.name.trim(); }
    if (patch.operationalDefinition !== undefined && patch.operationalDefinition.trim() && patch.operationalDefinition.trim() !== t0.operationalDefinition) { changes.push('Definition updated'); fields.operationalDefinition = patch.operationalDefinition.trim(); }
    if (patch.masteryCriterion !== undefined && patch.masteryCriterion.trim() && patch.masteryCriterion.trim() !== t0.masteryCriterion) {
      changes.push(`Mastery criterion: ${t0.masteryCriterion} → ${patch.masteryCriterion.trim()}`);
      fields.masteryCriterion = patch.masteryCriterion.trim();
      fields.criterionThreshold = parseMastery(fields.masteryCriterion, t0.criterionThreshold).threshold;
    }
    if (patch.targetDate !== undefined && (patch.targetDate || '') !== (t0.targetDate ?? '')) { changes.push(`Target date: ${t0.targetDate || 'none'} → ${patch.targetDate || 'none'}`); fields.targetDate = patch.targetDate || undefined; }
    if (patch.promptLevel !== undefined && patch.promptLevel.trim() !== (t0.promptLevel ?? '')) { changes.push(`Prompt hierarchy: ${t0.promptLevel || 'none'} → ${patch.promptLevel.trim() || 'none'}`); fields.promptLevel = patch.promptLevel.trim() || undefined; }
    if (patch.status !== undefined && patch.status !== t0.status) { changes.push(`Phase: ${t0.status} → ${patch.status}`); fields.status = patch.status; }
    if (changes.length === 0) { d.notify('Nothing changed.'); return false; }
    const h = entry(me, 'edited', reason.trim(), changes);
    // Apply to the latest copy of the goal, so a decision made a moment ago is not overwritten.
    d.setTargets((prev) => prev.map((t) => (t.id === id ? { ...t, ...fields, history: [...(t.history ?? []), h] } : t)));
    d.addAudit('Goal revised by supervisor', `${t0.name} · ${changes.join('; ')}`);
    d.tellTherapist(t0.discipline, t0.childId, 'Goal revised', `Supervisor revised "${fields.name ?? t0.name}". ${changes.join('. ')}. Reason: ${reason.trim()}`);
    d.notify('Goal updated. The change is in its history.');
    return true;
  };

  /** Approve several goals at once (the supervisor chooses which; nothing is auto-approved). */
  const approveGoals = (ids: string[]) => {
    if (!ids.length) return;
    const set = new Set(ids);
    const hit = d.targets.filter((t) => set.has(t.id));
    d.setTargets((prev) => prev.map((t) => { if (!set.has(t.id)) return t; const { reviewNote: _n, ...rest } = t; return { ...rest, approvalStatus: 'approved', history: [...(t.history ?? []), entry(me, 'approved', 'Bulk approval')] }; }));
    for (const t of hit) d.addAudit('Goal approved', `${t.name} (${t.discipline}) · bulk`);
    d.notify(`${hit.length} goal${hit.length === 1 ? '' : 's'} approved.`);
  };

  const acknowledgeGoalFeedback = (id: string) => {
    d.setTargets((prev) => prev.map((t) => (t.id === id ? { ...t, reviewAckAt: new Date().toISOString() } : t)));
    d.notify('Feedback acknowledged.');
  };

  /* ---------------- sessions ---------------- */

  const commentOnSession = (id: string, text: string) => {
    const s0 = d.sessions.find((s) => s.id === id);
    if (!s0 || !text.trim()) return;
    d.setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, commentsAckAt: undefined, comments: [...(s.comments ?? []), { at: new Date().toISOString(), by: me, text: text.trim() }] } : s)));
    d.tellTherapist(s0.role, s0.childId, 'Supervisor comment', `On "${s0.targetName}" (${new Date(s0.savedAt).toLocaleDateString()}): ${text.trim()}`);
    d.notify('Comment sent to the therapist.');
  };

  const acknowledgeSessionFeedback = (id: string) => {
    const now = new Date().toISOString();
    d.setSessions((prev) => prev.map((s) => (s.id === id ? { ...s, commentsAckAt: s.comments?.length ? now : s.commentsAckAt, review: s.review ? { ...s.review, ackAt: now } : s.review } : s)));
    d.notify('Feedback acknowledged.');
  };

  /* ---------------- team requests ---------------- */

  const addTeamRequest = (r: Pick<TeamRequest, 'childId' | 'kind' | 'role' | 'staffName' | 'note'>) => {
    const next: TeamRequest = { id: uid('treq'), ...r, requestedBy: me, requestedByRole: d.role ?? 'supervisor', at: new Date().toISOString(), status: 'open' };
    setTeamRequests((prev) => [next, ...prev]);
    d.addAudit('Team change requested', `${r.kind} ${r.role}${r.staffName ? ` (${r.staffName})` : ''}`);
    d.notify('Request sent to the administrator.');
  };

  /** The administrator answers a request: done (they changed the team) or declined, with a note. */
  const resolveTeamRequest = (id: string, status: 'done' | 'declined', adminNote: string) => {
    setTeamRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status, adminNote: adminNote.trim(), resolvedAt: new Date().toISOString(), resolvedBy: me } : r)));
    d.addAudit(status === 'done' ? 'Team request completed' : 'Team request declined', id);
    d.notify(status === 'done' ? 'Marked as done.' : 'Request declined.');
  };

  /* ---------------- case notes ---------------- */

  const addCaseNote = (n: Pick<CaseNote, 'childId' | 'kind' | 'text' | 'date' | 'nextReview'>) => {
    if (!n.text.trim()) return;
    setCaseNotes((prev) => [{ id: uid('cnote'), ...n, text: n.text.trim(), author: me, authorRole: d.role ?? 'supervisor', at: new Date().toISOString() }, ...prev]);
    d.notify('Note saved.');
  };
  const removeCaseNote = (id: string) => setCaseNotes((prev) => prev.filter((n) => n.id !== id));

  /* ---------------- observations ---------------- */

  const addFidelityObservation = (o: NewObservation) => {
    const { discipline, ...rec } = o;
    const next: Observation = { id: uid('obs'), ...rec, observer: me, observerRole: d.role ?? 'supervisor', at: new Date().toISOString() };
    setObservations((prev) => [next, ...prev]);
    d.addAudit('Observation recorded', `${o.therapistName} · ${o.type}${o.fidelity !== null ? ` · integrity ${o.fidelity}%` : ''}`);
    if (o.feedback.trim() || o.actionItems.trim()) {
      const g = o.goalId ? goalOf(o.goalId) : undefined;
      const target = g?.discipline ?? discipline;
      if (target) d.tellTherapist(target, o.childId, 'Supervisor feedback', `${o.type === 'training' ? 'Training' : 'Observation'} feedback: ${o.feedback.trim()}${o.actionItems.trim() ? ` Action: ${o.actionItems.trim()}` : ''}`);
    }
    d.notify('Observation saved.');
  };
  const acknowledgeFidelityObservation = (id: string) => {
    setObservations((prev) => prev.map((o) => (o.id === id ? { ...o, ackAt: new Date().toISOString() } : o)));
    d.notify('Feedback acknowledged.');
  };

  /* ---------------- templates ---------------- */

  const canApproveTemplates = d.role === 'supervisor';

  const saveTemplate = (t: { id?: string; kind: TemplateKind; title: string; body: string; steps: string[] }) => {
    if (!t.title.trim()) return;
    const clean = { kind: t.kind, title: t.title.trim(), body: t.body.trim(), steps: t.steps.map((s) => s.trim()).filter(Boolean) };
    if (t.id) {
      // Editing an approved template starts a new version that must be approved again.
      setTemplates((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...clean, status: 'draft', version: x.status === 'approved' ? x.version + 1 : x.version, approvedBy: undefined, approvedAt: undefined } : x)));
    } else {
      setTemplates((prev) => [{ id: uid('tpl'), childId: 'org', ...clean, status: 'draft', version: 1, createdBy: me, createdAt: new Date().toISOString() }, ...prev]);
    }
    d.notify('Template saved as a draft.');
  };
  const submitTemplate = (id: string) => {
    setTemplates((prev) => prev.map((x) => (x.id === id && x.status === 'draft' ? { ...x, status: 'submitted' } : x)));
    d.addAudit('Template submitted for approval', id);
    d.notify('Sent for supervisor approval.');
  };
  /** Clinical supervisors approve templates. */
  const approveTemplate = (id: string): boolean => {
    if (!canApproveTemplates) { d.notify('Only a supervisor can approve templates.'); return false; }
    setTemplates((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'approved', approvedBy: me, approvedAt: new Date().toISOString() } : x)));
    d.addAudit('Template approved', id);
    d.notify('Template approved.');
    return true;
  };
  const returnTemplate = (id: string) => {
    if (!canApproveTemplates) { d.notify('Only a supervisor can return templates.'); return; }
    setTemplates((prev) => prev.map((x) => (x.id === id ? { ...x, status: 'draft', approvedBy: undefined, approvedAt: undefined } : x)));
    d.notify('Returned to draft.');
  };
  const deleteTemplate = (id: string) => setTemplates((prev) => prev.filter((x) => x.id !== id));
  const loadStarterTemplates = () => {
    const have = new Set(templates.map((t) => t.title));
    const add = STARTER_TEMPLATES.filter((s) => !have.has(s.title)).map((s): ClinicalTemplate => ({ id: uid('tpl'), childId: 'org', ...s, status: 'draft', version: 1, createdBy: me, createdAt: new Date().toISOString() }));
    if (add.length) setTemplates((prev) => [...add, ...prev]);
    d.notify(add.length ? `${add.length} starter templates added as drafts.` : 'The starter templates are already there.');
  };

  /* ---------------- reports ---------------- */

  const saveReport = (r: Omit<SavedReport, 'id' | 'childId' | 'createdBy' | 'createdAt'>): string => {
    const id = uid('rep');
    setSavedReports((prev) => [{ id, childId: 'org', createdBy: me, createdAt: new Date().toISOString(), ...r }, ...prev]);
    d.notify('Report saved.');
    return id;
  };
  const signReport = (id: string, narrative: string) => {
    setSavedReports((prev) => prev.map((r) => (r.id === id ? { ...r, narrative, signedBy: me, signedAt: new Date().toISOString() } : r)));
    d.addAudit('Report signed', id);
    d.notify('Report signed.');
  };
  const deleteReport = (id: string) => setSavedReports((prev) => prev.filter((r) => r.id !== id));

  return {
    teamRequests, caseNotes, fidelityObservations, templates, savedReports, thresholds, syncCols, canApproveTemplates,
    createGoal, rejectGoal, editGoal, approveGoals, acknowledgeGoalFeedback,
    commentOnSession, acknowledgeSessionFeedback,
    addTeamRequest, resolveTeamRequest, addCaseNote, removeCaseNote,
    addFidelityObservation, acknowledgeFidelityObservation,
    saveTemplate, submitTemplate, approveTemplate, returnTemplate, deleteTemplate, loadStarterTemplates,
    saveReport, signReport, deleteReport,
    today,
  };
}

export type SupervisionApi = Omit<ReturnType<typeof useSupervision>, 'syncCols'>;
