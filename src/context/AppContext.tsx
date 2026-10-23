import type { PublicOrg } from '../api/client';
import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import { useServerSync, SyncCol, OutMessage, RemoteMessage } from '../sync/useServerSync';
import { OWN_THREAD, THREAD_ROLES, ROLE_TITLE } from '../utils/threads';
import { primaryPercent } from '../utils/primaryPercent';
import { parseMastery } from '../utils/decisionSupport';
import { 
  Child, 
  RoleType, 
  ConsentGrant, 
  Target, 
  AuditEvent, 
  MessageItem, 
  MessageAttachment,
  ObservationRecord,
  ChatContact,
  AppNotification,
  SessionPlan,
  SavedSession,
  TherapyRole,
  ABCRecord,
  BipPlan,
  Reinforcer,
  HomeTask,
  MedicalRecord,
  ReadMark,
  WeeklyQuestionSet,
  SentenceTask,
  SentenceAttempt,
  ArticulationLog,
  AudioClip,
  ChecklistItem,
  ChecklistScore,
  TaskAnalysis,
  StepLevel,
  SensoryLog
} from '../types';
import { demoOrg, demoRoster, DEMO_ADMIN_EVENT } from '../components/admin/demoAdmin';
import { useSupervision, type SupervisionApi } from './useSupervision';
import { demoAbc, demoHomeTasks, demoSessions } from '../data/demoSupervision';
import { canRoleSee, demoMedicalRecords } from '../data/medicalCategories';
import { deleteFile, type FileStore } from '../utils/medicalFiles';
import { 
  INITIAL_CHILDREN, blankChild,
  INITIAL_CONSENT_GRANTS, 
  INITIAL_TARGETS, 
  INITIAL_AUDIT_LOG, 
  INITIAL_MESSAGES,
  INITIAL_CONTACTS,
  INITIAL_NOTIFICATIONS
} from '../data/seedData';

interface AppContextType extends SupervisionApi {
  role: RoleType | null;
  setRole: (role: RoleType | null) => void;
  selectedChildId: string;
  setSelectedChildId: (id: string) => void;
  activeChild: Child;
  childrenList: Child[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: 'en' | 'ar';
  toggleLanguage: () => void;
  isRtl: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  isOffline: boolean;
  toggleOffline: () => void;
  syncQueueCount: number;
  childScheduleMode: boolean;
  setChildScheduleMode: (enabled: boolean) => void;
  targets: Target[];
  consentGrants: ConsentGrant[];
  auditLog: AuditEvent[];
  messages: MessageItem[];
  observations: ObservationRecord[];
  updateConsentGrant: (grantId: string, domain: keyof ConsentGrant['domains'], allowed: boolean) => void;
  hasAccessToDomain: (role: RoleType, domain: keyof ConsentGrant['domains']) => boolean;
  addSessionResult: (targetId: string, scorePercent: number, summaryText: string) => void;
  addTeacherObservation: (obs: Omit<ObservationRecord, 'id' | 'timestamp'>) => void;
  approveTarget: (targetId: string, newCriterion?: string) => void;
  /** Supervisor: send a goal back to its therapist with a reason. */
  requestGoalChanges: (targetId: string, note: string) => void;
  /** Supervisor: sign a session off, send it back with a note, or clear an earlier decision. */
  reviewSession: (sessionId: string, decision: 'signed' | 'changes' | 'retrain' | 'clear', note?: string) => void;
  orgName: string;
  setOrgName: (name: string) => void;
  /** Organisation policies the administrator controls (goal approval, family messaging). */
  org: PublicOrg;
  setOrgSettings: (patch: Partial<PublicOrg>) => void;

  sendMessage: (text: string, goalTag?: string) => void;
  triggerConfetti: () => void;
  notification: string | null;
  showNotification: (msg: string) => void;

  // Contacts / Multi-Contact Chat Support (Screenshot 3)
  contacts: ChatContact[];
  activeContactId: string | null;
  setActiveContactId: (id: string | null) => void;
  sendContactMessage: (contactId: string, text: string, goalTag?: string, attachment?: MessageAttachment, childId?: string) => void;
  /** Unread messages in a chat (for one child, or all the children when none is given). */
  unreadFor: (contactId: string, childId?: string) => number;
  /** How many of my latest messages in this chat the other side has not opened yet. */
  unreadByOtherFor: (contactId: string, childId?: string) => number;
  /** Posts a saved SOAP note into the chosen care-team threads (in-app only) and notifies them. */
  shareSoapNote: (contactIds: string[], payload: { text: string; childName: string; authorName: string; authorRole: RoleType; tag?: string; childId?: string }) => void;

  // Global Notifications (Bell icon)
  notifications: AppNotification[];
  unreadNotificationsCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;

  // Global Settings (Gear icon)
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;

  // Therapist session plans + saved datasheets
  getSessionPlan: (childId: string, role: TherapyRole) => SessionPlan;
  saveSessionPlan: (childId: string, role: TherapyRole, procedureIds: string[], measureIds: string[]) => void;
  savedSessions: SavedSession[];
  saveSession: (session: Omit<SavedSession, 'id' | 'savedAt'>) => void;

  // Server connection (null / false when running as the offline demo)
  isServerMode: boolean;
  currentUserName: string;
  logout: () => void;
  /** Staff only: the invite code to give each family. */
  inviteCodes: { id: string; name: string; inviteCode?: string }[];
  markContactRead: (contactId: string, childId?: string) => void;

  // Target management (therapist)
  addTarget: (t: Omit<Target, 'id' | 'currentPerformance' | 'lastThreeSessions' | 'approvalStatus' | 'suggestedAction' | 'suggestedNextStep'> & Partial<Target>) => string;
  updateTarget: (id: string, patch: Partial<Target>) => void;
  deleteTarget: (id: string) => void;

  // Behavior therapist clinical records
  abcRecords: ABCRecord[];
  addAbcRecord: (r: Omit<ABCRecord, 'id'>) => void;
  deleteAbcRecord: (id: string) => void;
  bips: BipPlan[];
  saveBip: (plan: Omit<BipPlan, 'version' | 'updatedAt'>) => void;
  reinforcers: Reinforcer[];
  addReinforcer: (r: Omit<Reinforcer, 'id' | 'lastAssessedAt'>) => void;
  updateReinforcer: (id: string, patch: Partial<Reinforcer>) => void;
  removeReinforcer: (id: string) => void;
  /** Medical reports the parent saved. Staff only ever receive the ones shared with their role. */
  medicalRecords: MedicalRecord[];
  saveMedicalRecord: (r: MedicalRecord) => void;
  removeMedicalRecord: (id: string) => void;
  /** Where report files are kept (server or this browser) and the sign-in for it. */
  fileStore: FileStore;
  homeTasks: HomeTask[];
  addHomeTask: (t: Omit<HomeTask, 'id' | 'done' | 'doneAt' | 'parentNote'>) => void;
  setHomeTaskDone: (id: string, done: boolean, parentNote?: string) => void;
  removeHomeTask: (id: string) => void;
  /** Create or replace a home task with a fixed id (used to resend the same weekly questions). */
  upsertHomeTask: (t: Omit<HomeTask, 'done' | 'doneAt' | 'parentNote'>) => void;

  // Speech therapist records
  weeklySets: WeeklyQuestionSet[];
  saveWeeklySet: (set: WeeklyQuestionSet) => void;
  deleteWeeklySet: (id: string) => void;
  sentenceTasks: SentenceTask[];
  addSentenceTask: (childId: string, target: string, image?: string) => void;
  addSentenceAttempt: (taskId: string, attempt: Omit<SentenceAttempt, 'id' | 'at'>) => void;
  deleteSentenceTask: (id: string) => void;
  articulationLogs: ArticulationLog[];
  addArticulationLog: (l: Omit<ArticulationLog, 'id' | 'at'>) => void;
  deleteArticulationLog: (id: string) => void;
  audioClips: AudioClip[];
  addAudioClip: (c: Omit<AudioClip, 'id' | 'at'>) => void;
  deleteAudioClip: (id: string) => void;
  otChecklist: ChecklistItem[];
  addChecklistItem: (childId: string, name: string) => void;
  scoreChecklistItem: (id: string, score: ChecklistScore | null) => void;
  deleteChecklistItem: (id: string) => void;
  otTasks: TaskAnalysis[];
  addTaskAnalysis: (t: Pick<TaskAnalysis, 'childId' | 'title' | 'domain' | 'chaining'> & { steps: string[] }) => string;
  updateTaskAnalysis: (id: string, patch: Partial<Pick<TaskAnalysis, 'title' | 'domain' | 'chaining'>> & { steps?: string[] }) => void;
  setStepLevel: (taskId: string, stepId: string, level: StepLevel | null) => void;
  /** Store today's step results in each task's history and start the next session blank. */
  closeTaskSession: (childId: string) => void;
  deleteTaskAnalysis: (id: string) => void;
  otSensory: SensoryLog[];
  addSensoryLog: (l: Omit<SensoryLog, 'id' | 'at'>) => void;
  deleteSensoryLog: (id: string) => void;
}

/** Starting selections shown on "Plan the session" (as in the client mock-ups). */
const DEFAULT_PLAN_SELECTION: Record<TherapyRole, { procedureIds: string[]; measureIds: string[] }> = {
  behavior: {
    procedureIds: ['prompt_fading', 'dtt', 'extinction', 'visual_schedules'],
    measureIds: ['frequency', 'mts'],
  },
  speech: {
    procedureIds: ['prompt_fading', 'net', 'time_delay'],
    measureIds: ['latency', 'trial_by_trial', 'cold_probe', 'mlu'],
  },
  // PDF page 3: Backward chaining, Task analysis, Graded activity; Duration and Accuracy measurement
  ot: {
    procedureIds: ['back_chain', 'task_analysis', 'graded_activity'],
    measureIds: ['duration', 'accuracy'],
  },
  // PDF page 4: Task analysis, Token economy, Explicit instruction, Error correction; Rate, Percentage, Cold-probe, Words correct per minute
  remedial: {
    procedureIds: ['task_analysis', 'token_econ', 'explicit_inst', 'error_corr'],
    measureIds: ['rate', 'percentage', 'cold_probe', 'wcpm'],
  },
};

const PLANS_KEY = 'nexia.sessionPlans.v1';
const SESSIONS_KEY = 'nexia.savedSessions.v1';
const TARGETS_KEY = 'nexia.targets.v1';
const ABC_KEY = 'nexia.abc.v1';
const BIPS_KEY = 'nexia.bips.v1';
const REINFORCERS_KEY = 'nexia.reinforcers.v1';
const HOMETASKS_KEY = 'nexia.homeTasks.v1';
const MEDICAL_KEY = 'nexia.medical.v1';
const WEEKLY_KEY = 'nexia.weeklyQuestions.v1';
const SENTENCES_KEY = 'nexia.sentenceTasks.v1';
const ARTIC_KEY = 'nexia.articulationLogs.v1';
const AUDIO_KEY = 'nexia.audioClips.v1';
const CHECKLIST_KEY = 'nexia.otChecklist.v1';
const OTTASKS_KEY = 'nexia.otTasks.v1';
const OTSENSORY_KEY = 'nexia.otSensory.v1';

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** Demo only: add the dummy records once (by id) to whatever the device already holds, without touching the user's own work. */
function loadSeeded<T extends { id: string }>(key: string, seeds: T[], flag: string): T[] {
  const stored = loadJson<T[]>(key, []);
  try {
    if (window.localStorage.getItem(flag)) return stored;
    window.localStorage.setItem(flag, '1');
  } catch {
    return stored.length ? stored : seeds;
  }
  const have = new Set(stored.map((x) => x.id));
  return [...stored, ...seeds.filter((x) => !have.has(x.id))];
}

/** Demo: the children and care teams come from the demo administrator's roster, so the portals and the Admin screens agree. */
function childrenFromRoster(prev: Child[] = []): Child[] {
  const { kids, users } = demoRoster();
  return kids
    .filter(k => !k.archived)
    .map(k => {
      const base = prev.find(c => c.id === k.id) ?? INITIAL_CHILDREN.find(c => c.id === k.id) ?? blankChild(k.id, k.name);
      const team = users
        .filter(u => u.role !== 'parent' && u.role !== 'admin' && !u.disabled && u.childIds.includes(k.id))
        .map(u => ({ role: u.role as RoleType, name: u.name, title: u.title ?? '' }));
      return { ...base, name: k.name, assignedTeam: team };
    });
}

function saveJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode / quota): keep working in memory
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// The practice version remembers the chosen portal for this browser tab, so a refresh does not send you back to the start.
const DEMO_ROLE_KEY = 'nexia.demoRole';
const readDemoRole = (): RoleType | null => {
  try { return (sessionStorage.getItem(DEMO_ROLE_KEY) as RoleType | null) || null; } catch { return null; }
};

const DEFAULT_TAB: Record<RoleType, string> = {
  parent: 'Home', behavior: 'Today', speech: 'Today', remedial: 'Today', teacher: 'Today', ot: 'Today', supervisor: 'Review', admin: 'Home',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const serverUser = auth.gate === 'server' ? auth.user : null;
  const isServerMode = !!serverUser;
  // Server mode keeps nothing in localStorage: the server is the source of truth.
  const load = <T,>(key: string, fallback: T): T => (isServerMode ? fallback : loadJson<T>(key, fallback));

  const [role, setRoleState] = useState<RoleType | null>(serverUser?.role ?? readDemoRole());
  const [selectedChildId, setSelectedChildId] = useState<string>(serverUser ? (auth.children_[0]?.id ?? serverUser.childIds[0] ?? '') : 'child-lama');
  const [activeTab, setActiveTabState] = useState<string>(DEFAULT_TAB[serverUser?.role ?? readDemoRole() ?? 'parent']);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [syncQueueCount, setSyncQueueCount] = useState<number>(0);
  const [childScheduleMode, setChildScheduleMode] = useState<boolean>(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Modals for Header icons
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const [childrenList, setChildrenList] = useState<Child[]>(() =>
    serverUser
      // The server decides which children exist for this account; the seeded demo profile is only used to fill in details.
      ? auth.children_.map(k => ({
          ...(INITIAL_CHILDREN.find(i => i.id === k.id) ?? blankChild(k.id, k.name)),
          name: k.name,
          // The real team: the staff an administrator linked to this child.
          assignedTeam: (k.team ?? []).map(m => ({ role: m.role as RoleType, name: m.name, title: m.title })),
        }))
      : childrenFromRoster()
  );
  useEffect(() => {
    if (isServerMode) return;
    const refresh = () => setChildrenList(prev => childrenFromRoster(prev));
    window.addEventListener(DEMO_ADMIN_EVENT, refresh);
    return () => window.removeEventListener(DEMO_ADMIN_EVENT, refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isServerMode]);
  const [targets, setTargets] = useState<Target[]>(() => {
    // The real system starts with no goals: the sample goals belong to the practice version only.
    if (isServerMode) return [];
    const stored = load<Target[]>(TARGETS_KEY, INITIAL_TARGETS);
    // The first four demo goals used to point at a child who does not exist. Move them to Maya and Tariq.
    const fix: Record<string, string> = { 'target-1': 'child-2', 'target-2': 'child-2', 'target-3': 'child-3', 'target-4': 'child-3' };
    return stored.map(t => (fix[t.id] && t.childId !== fix[t.id] ? { ...t, childId: fix[t.id] } : t));
  });
  const [consentGrants, setConsentGrants] = useState<ConsentGrant[]>(INITIAL_CONSENT_GRANTS);
  const [auditLog, setAuditLog] = useState<AuditEvent[]>(INITIAL_AUDIT_LOG);
  const [messages, setMessages] = useState<MessageItem[]>(INITIAL_MESSAGES);
  
  // Contacts list matching Screenshot 3
  // The real system starts with empty chats: the demo conversations are practice data only.
  const [contactsRaw, setContacts] = useState<ChatContact[]>(() =>
    isServerMode ? INITIAL_CONTACTS.map(c => ({ ...c, messages: [], lastMessage: '', timestamp: '', unreadCount: 0, unreadStaff: 0, online: false })) : INITIAL_CONTACTS
  );
  // Where this person left off in each chat. Kept on the server so unread counts follow them to another device.
  const [readMarks, setReadMarks] = useState<ReadMark[]>([]);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);

  // Notifications matching Screenshot 1 bell
  const [notifications, setNotifications] = useState<AppNotification[]>(isServerMode ? [] : INITIAL_NOTIFICATIONS);

  const [observations, setObservations] = useState<ObservationRecord[]>(isServerMode ? [] : [
    {
      id: 'obs-1',
      studentId: 'child-lama',
      studentName: 'Lama Alharbi',
      goal: 'Answers questions in class',
      activity: 'Science: parts of a plant',
      result: 'Completed independently',
      observation: 'Answered peer question regarding plant leaves spontaneously.',
      timestamp: 'Today at 10:15 AM',
      teacherName: 'Ms. Layla Fahad'
    }
  ]);

  const plansKey = serverUser ? `${PLANS_KEY}.${serverUser.id}` : PLANS_KEY;
  const [sessionPlans, setSessionPlans] = useState<SessionPlan[]>(() => loadJson<SessionPlan[]>(plansKey, []));
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>(() => (isServerMode ? [] : loadSeeded<SavedSession>(SESSIONS_KEY, demoSessions(), 'nexia.demoSeed.sessions.v1')));

  useEffect(() => saveJson(plansKey, sessionPlans), [plansKey, sessionPlans]);
  useEffect(() => { if (!isServerMode) saveJson(SESSIONS_KEY, savedSessions); }, [savedSessions]);
  useEffect(() => { if (!isServerMode) saveJson(TARGETS_KEY, targets); }, [targets]);

  const [abcRecords, setAbcRecords] = useState<ABCRecord[]>(() => (isServerMode ? [] : loadSeeded<ABCRecord>(ABC_KEY, demoAbc(), 'nexia.demoSeed.abc.v1')));
  const [bips, setBips] = useState<BipPlan[]>(() => load<BipPlan[]>(BIPS_KEY, []));
  const [reinforcers, setReinforcers] = useState<Reinforcer[]>(() => load<Reinforcer[]>(REINFORCERS_KEY, []));
  const [homeTasks, setHomeTasks] = useState<HomeTask[]>(() => (isServerMode ? [] : loadSeeded<HomeTask>(HOMETASKS_KEY, demoHomeTasks(), 'nexia.demoSeed.homeTasks.v1')));
  useEffect(() => { if (!isServerMode) saveJson(ABC_KEY, abcRecords); }, [abcRecords]);
  useEffect(() => { if (!isServerMode) saveJson(BIPS_KEY, bips); }, [bips]);
  useEffect(() => { if (!isServerMode) saveJson(REINFORCERS_KEY, reinforcers); }, [reinforcers]);
  useEffect(() => { if (!isServerMode) saveJson(HOMETASKS_KEY, homeTasks); }, [homeTasks]);
  const [allMedical, setAllMedical] = useState<MedicalRecord[]>(() => (isServerMode ? [] : loadSeeded<MedicalRecord>(MEDICAL_KEY, demoMedicalRecords('child-lama'), 'nexia.demoSeed.medical.v1')));
  useEffect(() => { if (!isServerMode) saveJson(MEDICAL_KEY, allMedical); }, [allMedical]);
  // The practice version has one device for every portal, so the sharing rule is applied here too.
  const medicalRecords = useMemo(() => allMedical.filter(r => canRoleSee(r, role)), [allMedical, role]);
  const fileStore = useMemo<FileStore>(() => ({ server: isServerMode, token: auth.token }), [isServerMode, auth.token]);
  const saveMedicalRecord = (r: MedicalRecord) => setAllMedical(prev => [r, ...prev.filter(x => x.id !== r.id)]);
  const removeMedicalRecord = (id: string) => {
    const gone = allMedical.find(x => x.id === id);
    if (gone && !isServerMode) gone.files.forEach(f => void deleteFile(fileStore, f.id)); // the server removes its own copies
    setAllMedical(prev => prev.filter(x => x.id !== id));
  };

  const [weeklySets, setWeeklySets] = useState<WeeklyQuestionSet[]>(() => load<WeeklyQuestionSet[]>(WEEKLY_KEY, []));
  const [sentenceTasks, setSentenceTasks] = useState<SentenceTask[]>(() => load<SentenceTask[]>(SENTENCES_KEY, []));
  useEffect(() => { if (!isServerMode) saveJson(WEEKLY_KEY, weeklySets); }, [weeklySets]);
  useEffect(() => { if (!isServerMode) saveJson(SENTENCES_KEY, sentenceTasks); }, [sentenceTasks]);

  const [articulationLogs, setArticulationLogs] = useState<ArticulationLog[]>(() => load<ArticulationLog[]>(ARTIC_KEY, []));
  const [audioClips, setAudioClips] = useState<AudioClip[]>(() => load<AudioClip[]>(AUDIO_KEY, []));
  const [otChecklist, setOtChecklist] = useState<ChecklistItem[]>(() => load<ChecklistItem[]>(CHECKLIST_KEY, []));
  useEffect(() => { if (!isServerMode) saveJson(ARTIC_KEY, articulationLogs); }, [articulationLogs]);
  useEffect(() => { if (!isServerMode) saveJson(AUDIO_KEY, audioClips); }, [audioClips]);
  useEffect(() => { if (!isServerMode) saveJson(CHECKLIST_KEY, otChecklist); }, [otChecklist]);

  const [otTasks, setOtTasks] = useState<TaskAnalysis[]>(() => load<TaskAnalysis[]>(OTTASKS_KEY, []));
  const [otSensory, setOtSensory] = useState<SensoryLog[]>(() => load<SensoryLog[]>(OTSENSORY_KEY, []));
  useEffect(() => { if (!isServerMode) saveJson(OTTASKS_KEY, otTasks); }, [otTasks]);
  useEffect(() => { if (!isServerMode) saveJson(OTSENSORY_KEY, otSensory); }, [otSensory]);

  const isRtl = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [isRtl, language]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (isServerMode) return;
    try { if (role) sessionStorage.setItem(DEMO_ROLE_KEY, role); else sessionStorage.removeItem(DEMO_ROLE_KEY); } catch { /* private mode */ }
  }, [role, isServerMode]);

  // Set default tabs whenever role changes
  const setRole = (newRole: RoleType | null) => {
    // A signed-in account has one role. Leaving means signing out.
    if (isServerMode) {
      if (newRole === null) auth.logout();
      return;
    }
    setRoleState(newRole);
    if (!newRole) return;
    switch (newRole) {
      case 'parent':
        setActiveTabState('Home');
        break;
      case 'behavior':
      case 'speech':
      case 'remedial':
      case 'teacher':
        setActiveTabState('Today');
        break;
      case 'ot':
        setActiveTabState('Today');
        break;
      case 'supervisor':
        setActiveTabState('Review');
        break;
      case 'admin':
        setActiveTabState('Home');
        break;
    }
  };

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    // If user switches to Messages tab, reset active contact so the contacts list is shown first!
    if (tab.toLowerCase() === 'messages') {
      setActiveContactId(null);
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'ar' : 'en'));
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const toggleOffline = () => {
    setIsOffline(prev => {
      const next = !prev;
      if (!next && syncQueueCount > 0) {
        showNotification(`${syncQueueCount} offline records synchronized securely.`);
        setSyncQueueCount(0);
      }
      return next;
    });
  };

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showNotification = (msg: string) => {
    setNotification(msg);
    // Restart the timer so an older message cannot hide a newer one early.
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4F46E5', '#FF6B57', '#10B981', '#F59E0B']
      });
    } catch {
      // safe fallback
    }
  };

  const activeChild = childrenList.find(c => c.id === selectedChildId) || childrenList[0] || blankChild('none', 'No child yet');

  const currentUserName =
    serverUser?.name ??
    (role === 'parent' ? 'Sarah Alharbi' : role === 'behavior' ? 'Dr. Tareq Hassan' : role === 'speech' ? 'Dr. Sarah Alharbi' : role === 'ot' ? 'Reem Al-Ahmad' : role === 'teacher' ? 'Ms. Layla Fahad' : role === 'remedial' ? 'Mr. Omar Khaled' : role === 'supervisor' ? 'Dr. Rebecca Hall' : role === 'admin' ? 'System Administrator' : 'Care Team Member');

  const updateConsentGrant = (grantId: string, domain: keyof ConsentGrant['domains'], allowed: boolean) => {
    setConsentGrants(prev => prev.map(g => {
      if (g.id === grantId) {
        return {
          ...g,
          domains: {
            ...g.domains,
            [domain]: allowed
          }
        };
      }
      return g;
    }));

    // Record audit event for Saudi PDPL compliance
    const targetGrant = consentGrants.find(g => g.id === grantId);
    const newAudit: AuditEvent = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: 'user-parent',
      userName: 'Sarah Alharbi',
      role: 'parent',
      action: allowed ? 'GRANT_ACCESS_DOMAIN' : 'REVOKE_ACCESS_DOMAIN',
      resource: `${targetGrant?.professionalName || 'Professional'} · Domain: ${domain}`
    };
    setAuditLog(prev => [newAudit, ...prev]);
    showNotification(`Consent updated: ${domain} is now ${allowed ? 'shared' : 'restricted'}.`);
  };

  const hasAccessToDomain = (chkRole: RoleType, domain: keyof ConsentGrant['domains']): boolean => {
    if (chkRole === 'parent' || chkRole === 'supervisor' || chkRole === 'admin') return true;
    const grant = consentGrants.find(g => g.role === chkRole && g.childId === selectedChildId);
    if (!grant) return true;
    return !!grant.domains[domain];
  };

  const addSessionResult = (targetId: string, scorePercent: number, summaryText: string) => {
    if (isOffline) {
      setSyncQueueCount(prev => prev + 1);
      showNotification('Session saved offline. Will sync when connection is restored.');
    } else {
      showNotification(`Session data recorded: ${scorePercent}% independent.`);
    }

    const todayDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const therapistDisplayName = serverUser ? serverUser.name : role === 'behavior' ? 'Dr. Tareq Hassan' : role === 'speech' ? 'Dr. Sarah Alharbi' : role === 'ot' ? 'Reem Al-Ahmad' : 'Therapist';

    setTargets(prev => prev.map(t => {
      if (t.id === targetId) {
        const newThree = [...t.lastThreeSessions.slice(1), scorePercent];
        const isMastered = newThree.every(s => s >= t.criterionThreshold);
        const newContributing = [
          {
            id: `sess-${Date.now()}`,
            date: todayDate,
            therapistName: therapistDisplayName,
            scorePercent: scorePercent,
            notes: summaryText,
            source: 'Clinic Session' as const,
          },
          ...(t.contributingSessions || [])
        ];
        return {
          ...t,
          currentPerformance: scorePercent,
          lastThreeSessions: newThree,
          status: isMastered ? 'mastered' : t.status,
          suggestedAction: isMastered ? 'Target Mastered! Ready for generalization probe.' : t.suggestedAction,
          contributingSessions: newContributing
        };
      }
      return t;
    }));

    // Audit log
    const newAudit: AuditEvent = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: `user-${role}`,
      userName: therapistDisplayName,
      role: role || 'behavior',
      action: 'RECORD_TRIAL_DATA',
      resource: `${activeChild.name} · ${summaryText}`
    };
    setAuditLog(prev => [newAudit, ...prev]);
  };

  const getSessionPlan = (childId: string, planRole: TherapyRole): SessionPlan => {
    const found = sessionPlans.find(p => p.childId === childId && p.role === planRole);
    if (found) return found;
    return {
      childId,
      role: planRole,
      procedureIds: DEFAULT_PLAN_SELECTION[planRole].procedureIds,
      measureIds: DEFAULT_PLAN_SELECTION[planRole].measureIds,
      updatedAt: '',
    };
  };

  const saveSessionPlan = (childId: string, planRole: TherapyRole, procedureIds: string[], measureIds: string[]) => {
    const next: SessionPlan = { childId, role: planRole, procedureIds, measureIds, updatedAt: new Date().toISOString() };
    setSessionPlans(prev => [...prev.filter(p => !(p.childId === childId && p.role === planRole)), next]);
  };

  const saveSession = (session: Omit<SavedSession, 'id' | 'savedAt'>) => {
    const record: SavedSession = {
      ...session,
      id: `sess-${Date.now()}`,
      savedAt: new Date().toISOString(),
    };
    setSavedSessions(prev => [record, ...prev]);

    const pct = primaryPercent(session.summary);
    if (pct !== null && session.targetId) {
      // Updates the target's performance, last-three sessions, mastery status, audit log.
      addSessionResult(
        session.targetId,
        pct,
        `${session.targetName}: ${pct}% independent across ${session.summary.scoredTrials} trials.`
      );
    } else {
      if (isOffline) {
        setSyncQueueCount(prev => prev + 1);
        showNotification('Datasheet saved offline. Will sync when connection is restored.');
      } else {
        showNotification('Datasheet saved.');
      }
      setAuditLog(prev => [{
        id: `audit-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userId: `user-${session.role}`,
        userName: session.therapistName,
        role: session.role,
        action: 'RECORD_SESSION_DATASHEET',
        resource: `${activeChild.name} · ${session.targetName}`,
      }, ...prev]);
    }
  };

  const addTeacherObservation = (obs: Omit<ObservationRecord, 'id' | 'timestamp'>) => {
    const now = new Date();
    const newObs: ObservationRecord = {
      ...obs,
      id: `obs-${Date.now()}`,
      childId: obs.studentId,
      at: now.toISOString(),
      timestamp: now.toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }),
    };
    setObservations(prev => [newObs, ...prev]);

    setChildrenList(prev => prev.map(c => {
      if (c.id === obs.studentId) {
        return {
          ...c,
          todayProgress: c.todayProgress.map(p => {
            if (p.area.toLowerCase().includes('communication') || p.area.toLowerCase().includes('attention')) {
              return {
                ...p,
                reason: `${obs.activity}: ${obs.result}. ${obs.observation || ''}`
              };
            }
            return p;
          })
        };
      }
      return c;
    }));

    showNotification('Classroom observation saved and shared to child profile.');
  };

  const addAudit = (action: string, resource: string) =>
    setAuditLog(prev => [
      {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        userId: serverUser?.id ?? 'local',
        userName: currentUserName,
        role: role ?? 'supervisor',
        action,
        resource,
      },
      ...prev,
    ]);

  /** Tell the therapist who owns a goal or session what the supervisor decided (a team-only message in their chat). */
  const tellTherapist = (discipline: string, childId: string, tag: string, text: string) => {
    const thread = OWN_THREAD[discipline as RoleType];
    if (!thread) return;
    const childName = childrenList.find(c => c.id === childId)?.name ?? '';
    shareSoapNote([thread], { text, childName, authorName: currentUserName, authorRole: role ?? 'supervisor', tag, childId });
  };

  const approveTarget = (targetId: string, newCriterion?: string) => {
    const t0 = targets.find(t => t.id === targetId);
    setTargets(prev => prev.map(t => {
      if (t.id === targetId) {
        const crit = newCriterion || t.masteryCriterion;
        const { reviewNote: _drop, ...rest } = t;
        return {
          ...rest,
          approvalStatus: 'approved',
          masteryCriterion: crit,
          criterionThreshold: parseMastery(crit, t.criterionThreshold).threshold,
          history: [...(t.history ?? []), { at: new Date().toISOString(), by: currentUserName, action: 'approved' as const, ...(newCriterion && newCriterion !== t.masteryCriterion ? { changes: [`Mastery criterion: ${t.masteryCriterion} → ${newCriterion}`] } : {}) }],
        };
      }
      return t;
    }));
    if (t0) addAudit('Goal approved', `${t0.name} (${t0.discipline})${newCriterion && newCriterion !== t0.masteryCriterion ? ` · criterion set to ${newCriterion}` : ''}`);
    showNotification('Goal approved.');
  };

  const requestGoalChanges = (targetId: string, note: string) => {
    const t0 = targets.find(t => t.id === targetId);
    if (!t0) return;
    setTargets(prev => prev.map(t => (t.id === targetId ? { ...t, approvalStatus: 'needs_review', reviewNote: note.trim(), reviewAckAt: undefined, history: [...(t.history ?? []), { at: new Date().toISOString(), by: currentUserName, action: 'returned' as const, note: note.trim() }] } : t)));
    addAudit('Goal sent back for changes', `${t0.name} (${t0.discipline})`);
    tellTherapist(t0.discipline, t0.childId, 'Supervisor feedback', `Goal "${t0.name}" needs changes: ${note.trim()}`);
    showNotification('Sent back to the therapist with your note.');
  };

  const reviewSession = (sessionId: string, decision: 'signed' | 'changes' | 'retrain' | 'clear', note?: string) => {
    const s0 = savedSessions.find(s => s.id === sessionId);
    if (!s0) return;
    setSavedSessions(prev => prev.map(s => {
      if (s.id !== sessionId) return s;
      if (decision === 'clear') {
        const { review: _r, ...rest } = s;
        return rest;
      }
      return { ...s, review: { status: decision, by: currentUserName, at: new Date().toISOString(), ...(note?.trim() ? { note: note.trim() } : {}) } };
    }));
    const label = `${s0.targetName} · ${s0.therapistName}`;
    if (decision === 'signed') addAudit('Session signed off', label);
    if (decision === 'changes') {
      addAudit('Session sent back for changes', label);
      tellTherapist(s0.role, s0.childId, 'Supervisor feedback', `Session "${s0.targetName}" (${new Date(s0.savedAt).toLocaleDateString()}) needs changes: ${(note ?? '').trim()}`);
    }
    if (decision === 'retrain') {
      addAudit('Session flagged for re-training', label);
      tellTherapist(s0.role, s0.childId, 'Supervisor feedback', `Session "${s0.targetName}" (${new Date(s0.savedAt).toLocaleDateString()}) was flagged for re-training: ${(note ?? '').trim()}`);
    }
    showNotification(decision === 'signed' ? 'Session signed off.' : decision === 'changes' ? 'Sent back to the therapist with your note.' : decision === 'retrain' ? 'Flagged for re-training. The therapist has been told.' : 'Decision cleared.');
  };

  const [org, setOrg] = useState<PublicOrg>(() =>
    isServerMode ? auth.org ?? { name: 'Al-Amal Development Center', requireGoalApproval: true, parentMessaging: true } : demoOrg()
  );
  const orgName = org.name;
  const setOrgSettings = (patch: Partial<PublicOrg>) => setOrg(prev => ({ ...prev, ...patch }));
  const setOrgName = (name: string) => {
    const n = name.trim() || 'Al-Amal Development Center';
    setOrg(prev => ({ ...prev, name: n }));
    addAudit('Organisation name changed', n);
  };

  const supervision = useSupervision({
    isServerMode,
    role,
    userName: currentUserName,
    notify: showNotification,
    org,
    targets,
    setTargets,
    sessions: savedSessions,
    setSessions: setSavedSessions,
    addAudit,
    tellTherapist,
  });

  const sendMessage = (text: string, goalTag?: string) => {
    const newMsg: MessageItem = {
      id: `msg-${Date.now()}`,
      childId: selectedChildId,
      senderName: currentUserName,
      senderRole: role || 'parent',
      senderAvatar: activeChild.avatar,
      contentEn: text,
      contentAr: text,
      timestamp: 'Just now',
      goalTag: goalTag || 'General Progress',
      isParent: role === 'parent',
    };
    setMessages(prev => [...prev, newMsg]);
    showNotification('Message sent to child care team.');
  };

  const sendContactMessage = (contactId: string, text: string, goalTag?: string, attachment?: MessageAttachment, forChildId?: string) => {
    if (role === 'parent' && !org.parentMessaging) {
      showNotification('Messaging is turned off by your administrator.');
      return;
    }
    const newMsg: MessageItem = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      childId: forChildId ?? selectedChildId,
      senderName: currentUserName,
      senderRole: role || 'parent',
      senderAvatar: activeChild.avatar,
      contentEn: text,
      contentAr: text,
      timestamp: 'Just now',
      at: new Date().toISOString(),
      ...(attachment ? { attachment } : {}),
      goalTag: goalTag || 'General Progress',
      isParent: role === 'parent',
      audience: 'family',
    };

    setContacts(prev => prev.map(c => {
      if (c.id === contactId) {
        return {
          ...c,
          lastMessage: text || (attachment?.kind === 'audio' ? '🎤 Voice message' : '📷 Photo'),
          timestamp: 'Just now',
          messages: [...c.messages, newMsg],
          // Offline demo (one device, both roles): the other side gets the unread mark.
          // With a server, the unread mark is added on the receiving device when the message arrives.
          ...(isServerMode ? {} : role === 'parent' ? { unreadStaff: (c.unreadStaff || 0) + 1 } : { unreadCount: (c.unreadCount || 0) + 1 }),
        };
      }
      return c;
    }));

    showNotification(role === 'parent' ? 'Message sent to specialist.' : 'Message sent to parents.');
  };

  const shareSoapNote: AppContextType['shareSoapNote'] = (contactIds, { text, childName, authorName, authorRole, tag = 'SOAP Note', childId }) => {
    if (contactIds.length === 0) return;
    const stamp = Date.now();
    setContacts(prev => prev.map(c => {
      if (!contactIds.includes(c.id)) return c;
      // Sent into the author's own thread = to the parents; any other thread = colleagues only.
      const toFamily = c.id === (OWN_THREAD[authorRole] ?? '');
      const msg: MessageItem = {
        id: `msg-soap-${stamp}-${c.id}-${Math.random().toString(36).slice(2, 6)}`,
        childId: childId ?? selectedChildId,
        senderName: authorName,
        senderRole: authorRole,
        senderAvatar: activeChild.avatar,
        contentEn: text,
        contentAr: text,
        timestamp: 'Just now',
        at: new Date().toISOString(),
        goalTag: tag,
        isParent: false,
        audience: toFamily ? 'family' : 'staff',
      };
      return {
        ...c,
        lastMessage: `${tag} · ${childName}`,
        timestamp: 'Just now',
        // The mark goes to whoever receives it: parents for family messages, the thread's therapist for team ones.
        ...(toFamily ? { unreadCount: (c.unreadCount || 0) + 1 } : { unreadStaff: (c.unreadStaff || 0) + 1 }),
        messages: [...c.messages, msg],
      };
    }));
    setNotifications(prev => [
      {
        id: `n-soap-${stamp}`,
        title: `${tag} shared by ${authorName}`,
        description: `${tag} for ${childName} was shared with ${contactIds.length} ${contactIds.length === 1 ? 'recipient' : 'recipients'}.`,
        timestamp: 'Just now',
        type: 'session',
        read: false,
      },
      ...prev,
    ]);
    showNotification(
      contactIds.length === 1 && contactIds[0] === (OWN_THREAD[authorRole] ?? '')
        ? `${tag} sent to parents.`
        : `${tag} shared with ${contactIds.length} ${contactIds.length === 1 ? 'recipient' : 'recipients'}.`
    );
  };

  const uid = (p: string) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const addTarget: AppContextType['addTarget'] = (t) => {
    const id = uid('tgt');
    const threshold = t.criterionThreshold ?? 90;
    const next: Target = {
      origin: 'Added by therapist',
      ...t,
      id,
      criterionThreshold: threshold,
      currentPerformance: t.baseline ?? 0,
      lastThreeSessions: [0, 0, 0],
      approvalStatus: org.requireGoalApproval ? 'awaiting_approval' : 'approved',
      submittedAt: new Date().toISOString(),
      history: [{ at: new Date().toISOString(), by: currentUserName, action: 'submitted' as const }],
      suggestedAction: 'Collect baseline data',
      suggestedNextStep: 'Run 3 baseline sessions before starting teaching',
    };
    setTargets(prev => [next, ...prev]);
    showNotification(org.requireGoalApproval ? 'Target added. Awaiting supervisor approval.' : 'Target added.');
    return id;
  };

  const updateTarget = (id: string, patch: Partial<Target>) => {
    setTargets(prev => prev.map(t => {
      if (t.id !== id) return t;
      const resubmit = org.requireGoalApproval && (patch.masteryCriterion || patch.criterionThreshold);
      const wasReturned = t.approvalStatus === 'needs_review' || t.approvalStatus === 'rejected';
      const back = resubmit || (wasReturned && org.requireGoalApproval);
      return {
        ...t,
        ...patch,
        approvalStatus: back ? 'awaiting_approval' : t.approvalStatus,
        ...(back ? { submittedAt: new Date().toISOString(), history: [...(t.history ?? []), { at: new Date().toISOString(), by: currentUserName, action: 'submitted' as const, note: wasReturned ? 'Resubmitted after feedback' : 'Criterion changed' }] } : {}),
      };
    }));
    showNotification('Target updated.');
  };

  const deleteTarget = (id: string) => {
    setTargets(prev => prev.filter(t => t.id !== id));
    showNotification('Target removed.');
  };

  const addAbcRecord: AppContextType['addAbcRecord'] = (r) => {
    setAbcRecords(prev => [{ ...r, id: uid('abc') }, ...prev]);
    showNotification('ABC event logged.');
  };
  const deleteAbcRecord = (id: string) => setAbcRecords(prev => prev.filter(r => r.id !== id));

  const saveBip: AppContextType['saveBip'] = (plan) => {
    setBips(prev => {
      const existing = prev.find(b => b.childId === plan.childId);
      const next: BipPlan = { ...plan, version: (existing?.version ?? 0) + 1, updatedAt: new Date().toISOString() };
      return [...prev.filter(b => b.childId !== plan.childId), next];
    });
    showNotification('Behavior Intervention Plan saved.');
  };

  const addReinforcer: AppContextType['addReinforcer'] = (r) =>
    setReinforcers(prev => [...prev, { ...r, id: uid('rf'), lastAssessedAt: new Date().toISOString() }]);
  const updateReinforcer = (id: string, patch: Partial<Reinforcer>) =>
    setReinforcers(prev => prev.map(r => (r.id === id ? { ...r, ...patch, lastAssessedAt: new Date().toISOString() } : r)));
  const removeReinforcer = (id: string) => setReinforcers(prev => prev.filter(r => r.id !== id));

  const addHomeTask: AppContextType['addHomeTask'] = (t) => {
    setHomeTasks(prev => [{ ...t, id: uid('ht'), done: false, doneAt: null, parentNote: '', createdAt: new Date().toISOString() }, ...prev]);
    showNotification('Home task assigned to the family.');
  };
  const setHomeTaskDone = (id: string, done: boolean, parentNote?: string) =>
    setHomeTasks(prev => prev.map(t => (t.id === id ? { ...t, done, doneAt: done ? new Date().toISOString() : null, parentNote: parentNote ?? t.parentNote } : t)));
  const removeHomeTask = (id: string) => setHomeTasks(prev => prev.filter(t => t.id !== id));
  const upsertHomeTask: AppContextType['upsertHomeTask'] = (t) => {
    setHomeTasks(prev => [{ ...t, done: false, doneAt: null, parentNote: '', createdAt: new Date().toISOString() }, ...prev.filter(x => x.id !== t.id)]);
    showNotification('Sent to the family as home practice.');
  };

  const saveWeeklySet = (set: WeeklyQuestionSet) =>
    setWeeklySets(prev => (prev.some(x => x.id === set.id) ? prev.map(x => (x.id === set.id ? set : x)) : [set, ...prev]));
  const deleteWeeklySet = (id: string) => setWeeklySets(prev => prev.filter(x => x.id !== id));

  const addSentenceTask = (childId: string, target: string, image?: string) =>
    setSentenceTasks(prev => [{ id: uid('sent'), childId, target: target.trim(), createdAt: new Date().toISOString(), attempts: [], ...(image ? { image } : {}) }, ...prev]);
  const addSentenceAttempt: AppContextType['addSentenceAttempt'] = (taskId, attempt) =>
    setSentenceTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, attempts: [...t.attempts, { ...attempt, id: uid('att'), at: new Date().toISOString() }] } : t))
    );
  const deleteSentenceTask = (id: string) => setSentenceTasks(prev => prev.filter(t => t.id !== id));

  const addArticulationLog: AppContextType['addArticulationLog'] = (l) =>
    setArticulationLogs(prev => [{ ...l, id: uid('art'), at: new Date().toISOString() }, ...prev]);
  const deleteArticulationLog = (id: string) => setArticulationLogs(prev => prev.filter(l => l.id !== id));

  const addAudioClip: AppContextType['addAudioClip'] = (c) => setAudioClips(prev => [{ ...c, id: uid('aud'), at: new Date().toISOString() }, ...prev]);
  const deleteAudioClip = (id: string) => setAudioClips(prev => prev.filter(c => c.id !== id));

  const addChecklistItem = (childId: string, name: string) =>
    setOtChecklist(prev => [...prev, { id: uid('chk'), childId, name: name.trim(), score: null, history: [] }]);
  const scoreChecklistItem = (id: string, score: ChecklistScore | null) =>
    setOtChecklist(prev =>
      prev.map(i => (i.id === id ? { ...i, score, history: score ? [...i.history, { at: new Date().toISOString(), score }] : i.history } : i))
    );
  const deleteChecklistItem = (id: string) => setOtChecklist(prev => prev.filter(i => i.id !== id));

  const stepsFromText = (lines: string[], keep: TaskAnalysis['steps'] = []) =>
    lines.map((text, i) => ({ id: keep[i]?.text === text ? keep[i].id : uid('stp'), text }));

  const addTaskAnalysis: AppContextType['addTaskAnalysis'] = (t) => {
    const id = uid('task');
    setOtTasks(prev => [...prev, { id, childId: t.childId, title: t.title.trim(), domain: t.domain, chaining: t.chaining, steps: stepsFromText(t.steps), levels: {}, history: [], createdAt: new Date().toISOString() }]);
    return id;
  };
  const updateTaskAnalysis: AppContextType['updateTaskAnalysis'] = (id, patch) =>
    setOtTasks(prev =>
      prev.map(x => {
        if (x.id !== id) return x;
        const { steps, ...rest } = patch;
        if (!steps) return { ...x, ...rest };
        // Steps that were not touched keep their id (and so their scores); edited or new ones start unscored.
        const next = stepsFromText(steps, x.steps);
        const levels: TaskAnalysis['levels'] = {};
        for (const s of next) if (x.levels[s.id]) levels[s.id] = x.levels[s.id];
        return { ...x, ...rest, steps: next, levels };
      })
    );
  const setStepLevel = (taskId: string, stepId: string, level: StepLevel | null) =>
    setOtTasks(prev =>
      prev.map(x => {
        if (x.id !== taskId) return x;
        const levels = { ...x.levels };
        if (level) levels[stepId] = level;
        else delete levels[stepId];
        return { ...x, levels };
      })
    );
  const closeTaskSession = (childId: string) =>
    setOtTasks(prev =>
      prev.map(x => {
        if (x.childId !== childId) return x;
        const scored = x.steps.filter(s => x.levels[s.id]);
        if (scored.length === 0) return x;
        const independent = x.steps.filter(s => x.levels[s.id] === 'Independent').length;
        const total = x.steps.length;
        return { ...x, levels: {}, history: [...x.history, { at: new Date().toISOString(), percent: Math.round((independent / total) * 100), independent, total }] };
      })
    );
  const deleteTaskAnalysis = (id: string) => setOtTasks(prev => prev.filter(x => x.id !== id));

  const addSensoryLog: AppContextType['addSensoryLog'] = (l) => setOtSensory(prev => [{ ...l, id: uid('sen'), at: new Date().toISOString() }, ...prev]);
  const deleteSensoryLog = (id: string) => setOtSensory(prev => prev.filter(x => x.id !== id));

  const iAmParent = role === 'parent';
  /** Messages from the other side that arrived after this person last opened the chat. */
  const unreadFor = (contactId: string, childId?: string): number => {
    const c = contactsRaw.find(x => x.id === contactId);
    if (!c) return 0;
    if (!isServerMode) return (iAmParent ? c.unreadCount : c.unreadStaff) ?? 0;
    return c.messages.filter(m => {
      if (childId && m.childId !== childId) return false;
      if (iAmParent ? m.isParent || m.audience === 'staff' : !m.isParent) return false; // only what the other side wrote to me
      const mark = readMarks.find(r => r.userId === serverUser?.id && r.contactId === contactId && r.childId === m.childId);
      return !!m.at && (!mark || m.at > mark.at);
    }).length;
  };

  const unreadByOtherFor = (contactId: string, childId?: string): number => {
    const c = contactsRaw.find(x => x.id === contactId);
    if (!c) return 0;
    if (!isServerMode) return (iAmParent ? c.unreadStaff : c.unreadCount) ?? 0;
    return c.messages.filter(m => {
      if (childId && m.childId !== childId) return false;
      if (iAmParent ? !m.isParent : m.isParent || m.audience === 'staff') return false; // what I wrote to them
      const seen = readMarks.filter(r => r.userId !== serverUser?.id && r.contactId === contactId && r.childId === m.childId).map(r => r.at).sort().pop();
      return !!m.at && (!seen || m.at > seen);
    }).length;
  };

  const markContactRead = (contactId: string, childId?: string) => {
    if (!isServerMode) {
      setContacts(prev =>
        prev.map(c => {
          if (c.id !== contactId) return c;
          // Each side clears only its own unread mark.
          if (role === 'parent') return c.unreadCount ? { ...c, unreadCount: 0 } : c;
          return c.unreadStaff ? { ...c, unreadStaff: 0 } : c;
        })
      );
      return;
    }
    const kid = childId ?? selectedChildId;
    const thread = contactsRaw.find(c => c.id === contactId);
    if (!serverUser || !thread || !kid) return;
    // The mark points at the newest message (the server's clock), so a device clock that is off cannot hide or invent unread.
    const newest = thread.messages.filter(m => m.childId === kid && m.at).map(m => m.at!).sort().pop();
    if (!newest) return;
    const id = `${serverUser.id}:${contactId}:${kid}`;
    setReadMarks(prev => {
      const was = prev.find(r => r.id === id);
      if (was && was.at >= newest) return prev;
      return [...prev.filter(r => r.id !== id), { id, childId: kid, userId: serverUser.id, contactId, at: newest }];
    });
  };

  // What the screens see: in the real system the contact list is the child's actual team, and unread comes from the marks.
  const contacts = useMemo<ChatContact[]>(() => {
    if (!isServerMode) return contactsRaw;
    const team = activeChild.assignedTeam ?? [];
    const isAr = language === 'ar';
    return contactsRaw
      .map(c => {
        const members = team.filter(m => (THREAD_ROLES[c.id] ?? []).includes(m.role));
        const first = members[0];
        return {
          ...c,
          members: members.length,
          name: members.length ? members.map(m => m.name).join(' & ') : c.name,
          roleTitle: members.length ? (first.title || (ROLE_TITLE[first.role]?.[isAr ? 'ar' : 'en'] ?? c.roleTitle)) : c.roleTitle,
          avatarInitial: (members[0]?.name.trim()[0] ?? c.avatarInitial).toUpperCase(),
          online: false,
          // Same meaning as in the practice version: unreadCount = the parent has unread, unreadStaff = the team has unread.
          unreadCount: iAmParent ? unreadFor(c.id, activeChild.id) : unreadByOtherFor(c.id, activeChild.id),
          unreadStaff: iAmParent ? unreadByOtherFor(c.id, activeChild.id) : unreadFor(c.id, activeChild.id),
        };
      })
      // A parent only sees the people who are really on this child's team.
      .filter(c => !iAmParent || (c as ChatContact & { members: number }).members > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactsRaw, readMarks, isServerMode, activeChild.id, activeChild.assignedTeam, language, iAmParent]);

  // Real system: tell the parent about a new home task and the therapist when the family ticks one off.
  // Only recent changes count, so signing in later does not replay old ones; each is announced once.
  useEffect(() => {
    if (!isServerMode) return;
    const recent = (iso?: string | null) => !!iso && Date.now() - new Date(iso).getTime() < 3 * 60_000;
    const fresh: AppNotification[] = [];
    for (const h of homeTasks) {
      if (iAmParent && !h.done && recent(h.createdAt) && h.assignedBy !== currentUserName) {
        fresh.push({ id: `n-task-${h.id}`, title: `New home task from ${h.assignedBy || 'your therapist'}`, description: h.title, timestamp: 'Just now', type: 'session', read: false });
      } else if (!iAmParent && h.done && recent(h.doneAt) && h.assignedBy === currentUserName) {
        fresh.push({ id: `n-done-${h.id}-${h.doneAt}`, title: 'Home task completed', description: `${h.title}${h.parentNote ? ` — “${h.parentNote}”` : ''}`, timestamp: 'Just now', type: 'session', read: false });
      }
    }
    if (fresh.length) setNotifications(prev => [...fresh.filter(f => !prev.some(p => p.id === f.id)), ...prev]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeTasks, isServerMode, iAmParent]);

  /* ---------------- server sync (only when signed in to a server) ---------------- */
  const syncCols: SyncCol[] = [
    { col: 'targets', items: targets, apply: fn => setTargets(fn as (p: Target[]) => Target[]), rid: (x: Target) => x.id },
    { col: 'savedSessions', items: savedSessions, apply: fn => setSavedSessions(fn as (p: SavedSession[]) => SavedSession[]), rid: (x: SavedSession) => x.id },
    { col: 'abcRecords', items: abcRecords, apply: fn => setAbcRecords(fn as (p: ABCRecord[]) => ABCRecord[]), rid: (x: ABCRecord) => x.id },
    { col: 'bips', items: bips, apply: fn => setBips(fn as (p: BipPlan[]) => BipPlan[]), rid: (x: BipPlan) => x.childId },
    { col: 'reinforcers', items: reinforcers, apply: fn => setReinforcers(fn as (p: Reinforcer[]) => Reinforcer[]), rid: (x: Reinforcer) => x.id },
    { col: 'medicalRecords', items: allMedical, apply: fn => setAllMedical(fn as (p: MedicalRecord[]) => MedicalRecord[]), rid: (x: MedicalRecord) => x.id },
    { col: 'classroomNotes', items: observations, apply: fn => setObservations(fn as (p: ObservationRecord[]) => ObservationRecord[]), rid: (x: ObservationRecord) => x.id },
    { col: 'readMarks', items: readMarks, apply: fn => setReadMarks(fn as (p: ReadMark[]) => ReadMark[]), rid: (x: ReadMark) => x.id },
    { col: 'homeTasks', items: homeTasks, apply: fn => setHomeTasks(fn as (p: HomeTask[]) => HomeTask[]), rid: (x: HomeTask) => x.id },
    { col: 'weeklyQuestions', items: weeklySets, apply: fn => setWeeklySets(fn as (p: WeeklyQuestionSet[]) => WeeklyQuestionSet[]), rid: (x: WeeklyQuestionSet) => x.id },
    { col: 'articulationLogs', items: articulationLogs, apply: fn => setArticulationLogs(fn as (p: ArticulationLog[]) => ArticulationLog[]), rid: (x: ArticulationLog) => x.id },
    { col: 'audioClips', items: audioClips, apply: fn => setAudioClips(fn as (p: AudioClip[]) => AudioClip[]), rid: (x: AudioClip) => x.id },
    { col: 'otTasks', items: otTasks, apply: fn => setOtTasks(fn as (p: TaskAnalysis[]) => TaskAnalysis[]), rid: (x: TaskAnalysis) => x.id },
    { col: 'otSensory', items: otSensory, apply: fn => setOtSensory(fn as (p: SensoryLog[]) => SensoryLog[]), rid: (x: SensoryLog) => x.id },
    { col: 'otChecklist', items: otChecklist, apply: fn => setOtChecklist(fn as (p: ChecklistItem[]) => ChecklistItem[]), rid: (x: ChecklistItem) => x.id },
    ...supervision.syncCols,
    { col: 'sentenceTasks', items: sentenceTasks, apply: fn => setSentenceTasks(fn as (p: SentenceTask[]) => SentenceTask[]), rid: (x: SentenceTask) => x.id },
  ];

  // Messages written on this device, waiting to reach the server (seed messages never are).
  const outMessages = useMemo<OutMessage[]>(
    () =>
      contactsRaw.flatMap(c =>
        c.messages
          .filter(m => m.id.startsWith('msg-'))
          .map(m => ({
            id: m.id,
            childId: m.childId,
            payload: { id: m.id, contactId: c.id, contentEn: m.contentEn, contentAr: m.contentAr, goalTag: m.goalTag, audience: m.audience ?? 'family', ...(m.attachment ? { attachment: m.attachment } : {}) },
          }))
      ),
    [contactsRaw]
  );

  const contactsRef = useRef(contactsRaw);
  contactsRef.current = contactsRaw;

  const handleRemoteMessages = (msgs: RemoteMessage[], first: boolean) => {
    if (msgs.length === 0) return;
    const fmt = (iso: string) => {
      const d = new Date(iso);
      return d.toDateString() === new Date().toDateString()
        ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };
    const known = new Set(contactsRef.current.flatMap(c => c.messages.map(m => m.id)));
    const fresh = msgs
      .filter(m => !known.has(m.rid))
      .map(m => ({
        contactId: String(m.data.contactId),
        mine: m.data.senderId === serverUser?.id,
        item: {
          id: m.rid,
          childId: m.childId,
          senderName: m.data.senderName ?? 'Care team',
          senderRole: (m.data.senderRole ?? 'parent') as RoleType,
          senderAvatar: '',
          contentEn: m.data.contentEn ?? '',
          contentAr: m.data.contentAr ?? m.data.contentEn ?? '',
          timestamp: m.data.createdAt ? fmt(m.data.createdAt) : '',
          at: m.data.createdAt ?? undefined,
          ...(m.data.attachment ? { attachment: m.data.attachment } : {}),
          goalTag: m.data.goalTag,
          isParent: m.data.senderRole === 'parent',
          audience: m.data.audience === 'staff' ? 'staff' : 'family',
        } as MessageItem,
      }));
    if (fresh.length === 0) return;

    setContacts(prev =>
      prev.map(c => {
        const mine = fresh.filter(f => f.contactId === c.id && !c.messages.some(m => m.id === f.item.id));
        if (mine.length === 0) return c;
        const last = mine[mine.length - 1].item;
        return {
          ...c,
          messages: [...c.messages, ...mine.map(f => f.item)],
          lastMessage: last.contentEn.split('\n')[0].slice(0, 60) || (last.attachment?.kind === 'audio' ? '🎤 Voice message' : '📷 Photo'),
          timestamp: last.timestamp,
        };
      })
    );

    if (!first) {
      const theirs = fresh.filter(f => !f.mine);
      if (theirs.length > 0) {
        const latest = theirs[theirs.length - 1].item;
        setNotifications(prev => [
          { id: `n-in-${latest.id}`, title: `New message from ${latest.senderName}`, description: latest.contentEn.split('\n')[0].slice(0, 90), timestamp: 'Just now', type: 'message', read: false },
          ...prev,
        ]);
        showNotification(`New message from ${latest.senderName}`);
      }
    }
  };

  useServerSync({
    enabled: isServerMode,
    token: auth.token,
    userId: serverUser?.id ?? null,
    role,
    cols: syncCols,
    messages: outMessages,
    onRemoteMessages: handleRemoteMessages,
    onUnauthorized: () => auth.logout(),
    onOnline: online => setIsOffline(!online),
  });

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    showNotification('All notifications marked as read.');
  };

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        selectedChildId,
        setSelectedChildId,
        activeChild,
        childrenList,
        activeTab,
        setActiveTab,
        language,
        toggleLanguage,
        isRtl,
        darkMode,
        toggleDarkMode,
        isOffline,
        toggleOffline,
        syncQueueCount,
        childScheduleMode,
        setChildScheduleMode,
        targets,
        consentGrants,
        auditLog,
        messages,
        observations,
        updateConsentGrant,
        hasAccessToDomain,
        addSessionResult,
        addTeacherObservation,
        approveTarget,
        requestGoalChanges,
        reviewSession,
        orgName,
        setOrgName,
        org,
        setOrgSettings,
        ...(({ syncCols: _s, ...rest }) => rest)(supervision),
        sendMessage,
        triggerConfetti,
        notification,
        showNotification,

        contacts,
        shareSoapNote,
        activeContactId,
        setActiveContactId,
        sendContactMessage,

        notifications,
        unreadNotificationsCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        isNotificationsOpen,
        setIsNotificationsOpen,

        isSettingsOpen,
        setIsSettingsOpen,

        getSessionPlan,
        saveSessionPlan,
        savedSessions,
        saveSession,

        isServerMode,
        currentUserName,
        logout: auth.logout,
        inviteCodes: auth.children_,
        markContactRead,
        unreadFor,
        unreadByOtherFor,

        addTarget,
        updateTarget,
        deleteTarget,
        abcRecords,
        addAbcRecord,
        deleteAbcRecord,
        bips,
        saveBip,
        reinforcers,
        addReinforcer,
        updateReinforcer,
        removeReinforcer,
        medicalRecords,
        saveMedicalRecord,
        removeMedicalRecord,
        fileStore,
        homeTasks,
        addHomeTask,
        setHomeTaskDone,
        removeHomeTask,
        upsertHomeTask,
        weeklySets,
        saveWeeklySet,
        deleteWeeklySet,
        sentenceTasks,
        addSentenceTask,
        addSentenceAttempt,
        deleteSentenceTask,
        articulationLogs,
        addArticulationLog,
        deleteArticulationLog,
        audioClips,
        addAudioClip,
        deleteAudioClip,
        otChecklist,
        addChecklistItem,
        scoreChecklistItem,
        deleteChecklistItem,
        otTasks,
        addTaskAnalysis,
        updateTaskAnalysis,
        setStepLevel,
        closeTaskSession,
        deleteTaskAnalysis,
        otSensory,
        addSensoryLog,
        deleteSensoryLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
