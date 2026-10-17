import { STAFF_ROLES } from './models.js';

export const isStaff = (user) => STAFF_ROLES.includes(user.role);
export const isAdmin = (user) => user.role === 'admin';
/** Therapists, teachers and supervisors: the people who read and write clinical records. */
export const isClinical = (user) => isStaff(user) && !isAdmin(user);

/**
 * An administrator manages accounts and the organisation, so sees only what that needs:
 * goals, session summaries (never the note text), home-task completion and plan status.
 * Chats, ABC events, recordings and practice data are not shared with administrators.
 */
export const ADMIN_READ = new Set(['targets', 'savedSessions', 'homeTasks', 'bips', 'teamRequests']);

/** Which collections exist and who may read/write them. Everything not listed is rejected. */
export const POLICY = {
  // Clinical, staff only (ABC events are raw clinical observations)
  abcRecords: { read: 'staff', write: 'staff' },
  // Parents may read these, only staff may change them
  bips: { read: 'all', write: 'staff', parentVisible: (d) => d && d.status !== 'draft' },
  reinforcers: { read: 'all', write: 'staff' },
  // Speech: weekly question sets and sentence-building tasks (parents may read them)
  weeklyQuestions: { read: 'all', write: 'staff' },
  sentenceTasks: { read: 'all', write: 'staff' },
  articulationLogs: { read: 'all', write: 'staff' },
  // Child samples stay with the clinical team; only spoken tips recorded for parents reach them.
  audioClips: { read: 'all', write: 'staff', parentVisible: (d) => d && d.kind === 'tip' },
  // OT skills checklist
  otChecklist: { read: 'all', write: 'staff' },
  otTasks: { read: 'all', write: 'staff' },
  otSensory: { read: 'all', write: 'staff' },
  targets: { read: 'all', write: 'staff' },
  // Supervision. Clinical team only; families never see any of it.
  caseNotes: { read: 'staff', write: 'staff' },
  observations: { read: 'staff', write: 'staff' },
  // A supervisor asks the administrator to change a case's team. The administrator may only answer it.
  teamRequests: { read: 'staff', write: 'staff', adminFields: ['status', 'adminNote', 'resolvedAt', 'resolvedBy'] },
  // Organisation-wide libraries (childId is always "org"): templates and saved reports.
  templates: { read: 'staff', write: 'staff', org: true },
  reports: { read: 'staff', write: 'staff', org: true },
  savedSessions: { read: 'all', write: 'staff' },
  // Parents read tasks and may only tick them off (done / doneAt / parentNote)
  homeTasks: { read: 'all', write: 'staff', parentFields: ['done', 'doneAt', 'parentNote'] },
  // Messages: anyone on the child's team, create-only. Parents never see audience:"staff".
  messages: { read: 'all', write: 'all', createOnly: true, parentVisible: (d) => d && d.audience !== 'staff' },
};

export const canRead = (user, col) => {
  const p = POLICY[col];
  if (!p) return false;
  if (isAdmin(user)) return ADMIN_READ.has(col);
  return p.read === 'all' || isStaff(user);
};

/** What an administrator receives of a record: figures and status, not clinical text. */
export const shapeData = (user, col, data) => {
  if (!data || !isAdmin(user)) return data;
  if (col === 'savedSessions') {
    const { id, childId, role, therapistName, targetId, targetName, savedAt, summary, review } = data;
    return { id, childId, role, therapistName, targetId, targetName, savedAt, summary, review };
  }
  if (col === 'bips') {
    const { childId, status, version, reviewDate, updatedAt } = data;
    return { childId, status, version, reviewDate, updatedAt };
  }
  return data;
};

/** Plain description of who can read and write each kind of record (shown to administrators). */
export const accessMatrix = () =>
  Object.entries(POLICY).map(([col, p]) => ({
    col,
    parentRead: p.read === 'all' && (p.parentVisible ? 'some' : 'yes') || 'no',
    parentWrite: p.parentFields ? 'limited' : p.write === 'all' ? 'yes' : 'no',
    clinicalRead: 'yes',
    clinicalWrite: 'yes',
    adminRead: ADMIN_READ.has(col) ? (col === 'savedSessions' || col === 'bips' ? 'summary' : 'yes') : 'no',
    adminWrite: p.adminFields ? 'limited' : 'no',
  }));

export const canSeeRecord = (user, col, data) => {
  if (!canRead(user, col)) return false;
  if (isStaff(user)) return true;
  const p = POLICY[col];
  return p.parentVisible ? p.parentVisible(data) : true;
};

export const hasChild = (user, childId) => user.childIds.includes(childId);
