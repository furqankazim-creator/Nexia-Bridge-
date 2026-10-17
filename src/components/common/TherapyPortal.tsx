import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Copy, Send, Timer, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SessionPlanner } from '../therapy/SessionPlanner';
import { SoapNoteCard } from './SoapNoteCard';
import { SoapArchive } from './SoapArchive';
import { TargetsPanel } from './TargetsPanel';
import { GoalTool, goalToolKind } from '../speech/GoalTool';
import { decide, parseMastery } from '../../utils/decisionSupport';
import { ShareToTeamModal } from './ShareToTeamModal';
import { FamilyPanel } from './FamilyPanel';
import { GoalModal, OT_DOMAINS, REMEDIAL_DOMAINS, SPEECH_DOMAINS } from './GoalModal';
import { BehaviorDatasheetViews, DatasheetView } from '../behavior/BehaviorDatasheetViews';
import { BehaviorGraphs, MetricDef } from '../behavior/BehaviorGraphs';
import { useBehaviorDatasheet } from '../../hooks/useBehaviorDatasheet';
import { summaryLines, therapyReportText } from '../../utils/therapyReport';
import { primaryPercent } from '../../utils/primaryPercent';
import type { SavedSession, Target, TherapyRole } from '../../types';

type L = { en: string; ar: string };

interface RoleConfig {
  domains: string[];
  /** e.g. "Speech Clinical Target": used in the goal dialog title. */
  dialogNoun: L;
  /** Words for one item in this discipline. */
  addLabel: L;
  noun: L;
  goalsTitle: L;
  goalsSubtitle: L;
  reportHeading: string;
  goalsHeading: string;
  reportTitle: L;
  archiveTitle: L;
  credential: string;
  metrics: MetricDef[];
  launch: boolean;
  groupOf?: (d: string) => string;
}

const M = (id: MetricDef['id'], en: string, ar: string, unit: string, percent: boolean): MetricDef => ({ id, en, ar, unit, percent });

export const SPEECH_METRICS: MetricDef[] = [
  M('percentIndependent', '% independent', '% مستقل', '%', true),
  M('cueIndependentPercent', 'No-cue %', 'بلا تلميح %', '%', true),
  M('coldProbePercent', 'Cold probe %', 'المسح البارد %', '%', true),
  M('meanLatencySec', 'Latency (s)', 'الكمون (ث)', 's', false),
  M('mlu', 'MLU', 'MLU', '', false),
  M('aacSelections', 'AAC selections', 'اختيارات AAC', '', false),
  M('accuracyPercent', 'Accuracy %', 'الدقة %', '%', true),
  M('percentageCorrect', 'Percent correct', 'نسبة الصحيح', '%', true),
  M('ioaPercent', 'IOA %', 'IOA %', '%', true),
  M('integrityPercent', 'Integrity %', 'سلامة التنفيذ %', '%', true),
];
const OT_METRICS: MetricDef[] = [
  M('taskAnalysisPercent', 'Task analysis %', 'تحليل المهمة %', '%', true),
  M('accuracyPercent', 'Accuracy %', 'الدقة %', '%', true),
  M('percentIndependent', '% independent', '% مستقل', '%', true),
  M('meanDurationSec', 'Duration (s)', 'المدة (ث)', 's', false),
  M('percentageCorrect', 'Percent correct', 'نسبة الصحيح', '%', true),
  M('frequency', 'Frequency', 'التكرار', '', false),
  M('ratePerMinute', 'Rate / min', 'المعدل/دقيقة', '', false),
  M('meanLatencySec', 'Latency (s)', 'الكمون (ث)', 's', false),
  M('partialPercent', 'Partial interval %', 'الفاصل الجزئي %', '%', true),
  M('mtsPercent', 'MTS %', 'MTS %', '%', true),
  M('ioaPercent', 'IOA %', 'IOA %', '%', true),
];
const REMEDIAL_METRICS: MetricDef[] = [
  M('wcpm', 'Words / min', 'كلمات/دقيقة', '', false),
  M('digitsPm', 'Digits / min', 'أرقام/دقيقة', '', false),
  M('percentageCorrect', 'Percent correct', 'نسبة الصحيح', '%', true),
  M('percentIndependent', '% independent', '% مستقل', '%', true),
  M('coldProbePercent', 'Cold probe %', 'المسح البارد %', '%', true),
  M('accuracyPercent', 'Accuracy %', 'الدقة %', '%', true),
  M('rubricPercent', 'Writing rubric %', 'معيار الكتابة %', '%', true),
  M('errorCount', 'Errors', 'الأخطاء', '', false),
  M('ratePerMinute', 'Rate / min', 'المعدل/دقيقة', '', false),
  M('integrityPercent', 'Integrity %', 'سلامة التنفيذ %', '%', true),
];

const CONFIG: Record<Exclude<TherapyRole, 'behavior'>, RoleConfig> = {
  speech: {
    domains: SPEECH_DOMAINS,
    dialogNoun: { en: 'Speech Clinical Target', ar: 'هدف نطق إكلينيكي' },
    addLabel: { en: 'Add goal', ar: 'هدف جديد' },
    noun: { en: 'goal', ar: 'هدف' },
    goalsTitle: { en: 'Speech goals', ar: 'أهداف النطق واللغة' },
    goalsSubtitle: { en: 'Each goal is a lesson: definition, materials, steps, data and next step', ar: 'كل هدف درس: تعريف وأدوات وخطوات وبيانات والخطوة التالية' },
    reportHeading: 'SPEECH & LANGUAGE SESSION REPORT',
    goalsHeading: 'SPEECH GOALS',
    reportTitle: { en: 'Speech session report', ar: 'تقرير جلسة النطق' },
    archiveTitle: { en: 'Official Speech SOAP Notes Archive', ar: 'أرشيف جلسات النطق المعتمدة' },
    credential: 'Certified SLP',
    metrics: SPEECH_METRICS,
    launch: true,
  },
  ot: {
    domains: OT_DOMAINS,
    dialogNoun: { en: 'OT Clinical Goal', ar: 'هدف علاج وظيفي' },
    addLabel: { en: 'Add goal', ar: 'هدف جديد' },
    noun: { en: 'goal', ar: 'هدف' },
    goalsTitle: { en: 'OT goals', ar: 'أهداف العلاج الوظيفي' },
    goalsSubtitle: { en: 'Each goal is a lesson: definition, materials, steps, data and next step', ar: 'كل هدف درس: تعريف وأدوات وخطوات وبيانات والخطوة التالية' },
    reportHeading: 'OCCUPATIONAL THERAPY SESSION REPORT',
    goalsHeading: 'OT GOALS',
    reportTitle: { en: 'OT session report', ar: 'تقرير جلسة العلاج الوظيفي' },
    archiveTitle: { en: 'Official OT SOAP Notes Archive', ar: 'أرشيف جلسات العلاج الوظيفي المعتمدة' },
    credential: 'Certified OT',
    metrics: OT_METRICS,
    launch: true,
    groupOf: (d) => d,
  },
  remedial: {
    domains: REMEDIAL_DOMAINS,
    dialogNoun: { en: 'Learning Goal', ar: 'هدف تعليمي' },
    addLabel: { en: 'Add goal', ar: 'هدف جديد' },
    noun: { en: 'goal', ar: 'هدف' },
    goalsTitle: { en: 'Learning goals', ar: 'الأهداف التعليمية' },
    goalsSubtitle: { en: 'Each goal is a lesson: definition, materials, steps, data and next step', ar: 'كل هدف درس: تعريف وأدوات وخطوات وبيانات والخطوة التالية' },
    reportHeading: 'REMEDIAL TEACHING SESSION REPORT',
    goalsHeading: 'LEARNING GOALS',
    reportTitle: { en: 'Remedial session report', ar: 'تقرير جلسة التربية الخاصة' },
    archiveTitle: { en: 'Official Remedial SOAP Notes Archive', ar: 'أرشيف جلسات التربية الخاصة المعتمدة' },
    credential: 'Remedial teacher',
    metrics: REMEDIAL_METRICS,
    launch: true,
    groupOf: (d) => d,
  },
};

interface Props {
  role: Exclude<TherapyRole, 'behavior'>;
  /** Tabs only this discipline has (e.g. Speech "practice", OT "checklists"), keyed by tab id. */
  extraTabs?: Record<string, React.ReactNode>;
  /** Formatted sections added to the parent report (weekly questions, checklist, ...). */
  extraReportSections?: string[];
  /** Sentences added to the Objective part of the SOAP auto-draft. */
  extraObjectiveLines?: string[];
  /** Content placed above the datasheet on the main session page (e.g. OT task analysis). */
  todayTop?: React.ReactNode;
  /** Replaces the default goal-based recommendation on the session page. */
  decisionOverride?: React.ReactNode;
  /** Role-specific figures merged into the saved session's summary. */
  extraSummary?: () => Partial<SavedSession['summary']>;
  /** Called after a datasheet is saved (e.g. to close the day's task-analysis scoring). */
  onSessionSaved?: () => void;
}

/** The shared therapist workspace: plan-driven datasheet, goals, graphs, SOAP notes, report and family. */
export const TherapyPortal: React.FC<Props> = ({ role, extraTabs = {}, extraReportSections = [], extraObjectiveLines = [], todayTop, decisionOverride, extraSummary, onSessionSaved }) => {
  const {
    activeChild, activeTab, setActiveTab, language, targets, saveSession, savedSessions, getSessionPlan, saveSessionPlan,
    showNotification, triggerConfetti, childrenList, setSelectedChildId, currentUserName, addTarget, updateTarget, deleteTarget,
  } = useApp();
  const cfg = CONFIG[role];
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);

  const [view, setView] = useState<DatasheetView | 'plan'>('datasheet');
  const [editingTarget, setEditingTarget] = useState<Target | null | undefined>(undefined);
  const [showReport, setShowReport] = useState(false);
  const [reportShare, setReportShare] = useState(false);
  const [targetId, setTargetId] = useState<string>('');
  const [newDomain, setNewDomain] = useState<string | undefined>(undefined);
  const [showWhy, setShowWhy] = useState(false);

  // Session clock: starts when the therapist opens the workspace, restarts after each saved session.
  const [sessionStart, setSessionStart] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsedSec = Math.max(0, Math.floor((now - sessionStart) / 1000));
  const clock = `${String(Math.floor(elapsedSec / 60)).padStart(2, '0')}:${String(elapsedSec % 60).padStart(2, '0')}`;

  const plan = getSessionPlan(activeChild.id, role);
  const roleTargets = useMemo(() => targets.filter((x) => x.childId === activeChild.id && x.discipline === role), [targets, activeChild.id, role]);
  const goal = roleTargets.find((x) => x.id === targetId) ?? roleTargets[0];
  // The speech in-session tool (WH drill, AAC pad, articulation drill) shows only when the plan includes it.
  const toolKind = goal ? goalToolKind(goal) : null;
  const toolInPlan = toolKind === 'wh' ? plan.procedureIds.includes('wh_drill') : toolKind === 'aac' ? plan.procedureIds.includes('aac_pad') : toolKind === 'articulation' ? plan.procedureIds.includes('artic_drill') : false;
  const childSessions = useMemo(() => savedSessions.filter((x) => x.role === role && x.childId === activeChild.id), [savedSessions, activeChild.id, role]);

  // This goal's earlier datasheet scores feed trials-to-criterion.
  const history = useMemo(
    () => childSessions.filter((x) => x.targetId === goal?.id && primaryPercent(x.summary) !== null && !x.notes.startsWith('[SOAP NOTE]')).sort((a, b) => a.savedAt.localeCompare(b.savedAt)).map((x) => primaryPercent(x.summary) as number),
    [childSessions, goal?.id]
  );
  const ds = useBehaviorDatasheet(history, role);
  const summary = { ...ds.buildSummary(plan), ...(extraSummary ? extraSummary() : {}) };

  // SOAP notes start empty: nothing is pre-written about a child.
  const [soapS, setSoapS] = useState('');
  const [soapO, setSoapO] = useState('');
  const [soapA, setSoapA] = useState('');
  const [soapP, setSoapP] = useState('');
  const [drafting, setDrafting] = useState(false);

  const reportText = therapyReportText({
    heading: cfg.reportHeading, goalsHeading: cfg.goalsHeading, childName: activeChild.name, age: activeChild.age,
    therapist: currentUserName, targetName: goal?.name ?? '—', summary, extra: extraReportSections, goals: roleTargets,
  });

  const payload = (notes: string) => ({
    childId: activeChild.id,
    role,
    therapistName: currentUserName,
    targetId: goal!.id,
    targetName: goal!.name,
    procedureIds: plan.procedureIds,
    measureIds: plan.measureIds,
    data: ds.buildData(),
    summary,
    notes,
  });

  const requireGoal = () => {
    if (goal) return true;
    showNotification(t('Add a goal first (Goals tab).', 'أضف هدفاً أولاً (تبويب الأهداف).'));
    return false;
  };

  const saveDatasheet = () => {
    if (!requireGoal()) return;
    const lines = summaryLines(summary);
    saveSession(payload(lines.length ? lines.join(' · ') : 'Datasheet saved with no measures recorded.'));
    setSessionStart(Date.now());
    onSessionSaved?.();
    const main = primaryPercent(summary);
    if ((main ?? 0) >= 90) triggerConfetti();
    showNotification(main !== null ? t(`Datasheet saved (${main}%).`, `تم حفظ ورقة البيانات (${main}%).`) : t('Datasheet saved.', 'تم حفظ ورقة البيانات.'));
  };

  const saveSoap = () => {
    if (!requireGoal()) return;
    saveSession(payload(`[SOAP NOTE]\nS: ${soapS}\nO: ${soapO}\nA: ${soapA}\nP: ${soapP}`));
    triggerConfetti();
    showNotification(t('Official SOAP note saved to the child record.', 'تم حفظ ملاحظة SOAP في سجل الطفل.'));
  };

  const autoDraft = () => {
    setDrafting(true);
    const parts: string[] = [];
    const has = (id: string) => plan.measureIds.includes(id);
    if (ds.isTrialGridActive(plan) && ds.scoredCount) parts.push(`${goal?.name ?? 'Goal'}: ${ds.percentIndependent}% independent (${ds.independentCount}/${ds.scoredCount} trials).`);
    if (has('cueing_level') && ds.s.cueLog.length) parts.push(`${ds.cueIndependentPercent}% of trials needed no cue.`);
    if (has('latency') && ds.s.latencies.length) parts.push(`Response latency ${ds.latencyMean.toFixed(1)}s average.`);
    if (has('cold_probe') && ds.coldScored) parts.push(`Cold probe ${ds.coldCorrect}/${ds.coldScored}.`);
    if (has('mlu') && ds.mlu !== null) parts.push(`MLU ${ds.mlu.toFixed(2)} morphemes (${ds.s.utterances.length} utterances).`);
    if (has('aac_core') && ds.s.aacLog.length) parts.push(`${ds.s.aacLog.length} AAC core selections (${ds.aacSpontaneousPercent}% spontaneous).`);
    if (has('accuracy') && ds.accuracyTotal) parts.push(`Accuracy ${ds.accuracyPercent}%.`);
    if (has('percentage') && ds.pctTotal) parts.push(`Percent correct ${ds.percentage}% (${ds.s.pctCorrect}/${ds.pctTotal}).`);
    if (has('frequency')) parts.push(`Frequency ${ds.s.frequency}.`);
    if (has('rate') && ds.s.rateSeconds > 0) parts.push(`Rate ${ds.ratePerMinute.toFixed(1)}/min.`);
    if (has('duration') && ds.s.durationEpisodes.length) parts.push(`Mean duration ${Math.round(ds.durationMean)}s over ${ds.s.durationEpisodes.length} episodes.`);
    if (has('partial_interval')) parts.push(`Partial interval ${ds.partialYes}/${ds.s.partial.length}.`);
    if (has('whole_interval')) parts.push(`Whole interval ${ds.wholeYes}/${ds.s.whole.length}.`);
    if (has('mts') && ds.mtsScored) parts.push(`MTS ${ds.mtsYes}/${ds.mtsScored}.`);
    if (summary.wcpm != null) parts.push(`Words correct per minute ${summary.wcpm}.`);
    if (summary.digitsPm != null) parts.push(`Digits correct per minute ${summary.digitsPm}.`);
    if (summary.rubricPercent != null) parts.push(`Writing rubric ${summary.rubricPercent}%.`);
    if (summary.errorCount != null) parts.push(`${summary.errorCount} errors tallied.`);
    if (has('treatment_integrity') && ds.integrityPercent !== null) parts.push(`Treatment integrity ${ds.integrityPercent}%.`);
    parts.push(...extraObjectiveLines);
    setSoapO(parts.length ? parts.join(' ') : 'No session data recorded yet.');
    setDrafting(false);
    showNotification(t('Objective section drafted from your recorded data.', 'تمت صياغة قسم القياسات من بياناتك المسجلة.'));
  };

  const handleChild = (id: string) => {
    setSelectedChildId(id);
    setTargetId('');
  };

  const tab = activeTab.toLowerCase();

  const renderToday = () =>
    view === 'plan' ? (
      <SessionPlanner role={role} onSaved={() => setView('datasheet')} />
    ) : (
      <>
        {view === 'datasheet' && roleTargets.length > 0 && (
          <section className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-4 shadow-card space-y-2.5 mb-3" data-testid="session-bar">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#1F1B3A] dark:text-white">{t('Session Active Targets (Fast Switch):', 'أهداف الجلسة النشطة (تبديل سريع):')}</span>
              <span className="flex items-center gap-1 text-[11px] text-[#5C706C] tabular-nums shrink-0" data-testid="session-clock"><Timer className="w-3.5 h-3.5" /> {clock} {t('elapsed', 'منذ البدء')}</span>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5" role="tablist" aria-label={t('Session goal', 'هدف الجلسة')}>
              {roleTargets.map((x) => {
                const on = x.id === goal?.id;
                const kind = goalToolKind(x);
                const icon = kind === 'wh' ? '🗣️' : kind === 'aac' ? '📱' : kind === 'articulation' ? '🎯' : '📌';
                // The active goal shows today's live figure; the others show their latest saved performance.
                const liveFigure = kind === 'wh' && ds.drillPercent !== null ? ds.drillPercent : primaryPercent(summary);
                const pctShown = on ? (liveFigure ?? x.currentPerformance) : x.currentPerformance;
                const suffix = on && kind === 'aac' ? `${ds.s.aacLog.length} ${t('req', 'طلب')}` : `${pctShown}%`;
                return (
                  <button key={x.id} type="button" role="tab" aria-selected={on} onClick={() => setTargetId(x.id)}
                    className={`px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap border transition active:scale-95 ${on ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E] text-[#1F1B3A] dark:text-gray-200'}`}>
                    {icon} {x.name.length > 26 ? `${x.name.slice(0, 25)}…` : x.name} ({suffix})
                  </button>
                );
              })}
            </div>
          </section>
        )}
        {view === 'datasheet' && role === 'speech' && goal && toolInPlan && <div className="mb-3"><p className="text-[11px] font-semibold text-[#6B6785] mb-1.5 px-1" data-testid="from-plan">{isAr ? 'من خطتك' : 'From your plan'} · {toolKind === 'wh' ? t('WH-question drill', 'تدريب أسئلة الاستفهام') : toolKind === 'aac' ? t('AAC pad with speech output', 'لوحة التواصل المعزز') : t('Articulation drill', 'تدريب النطق')}</p><GoalTool goal={goal} ds={ds} isAr={isAr} /></div>}
        {view === 'datasheet' && todayTop && <div className="mb-3">{todayTop}</div>}
        <BehaviorDatasheetViews
          role={role}
          ds={ds}
          plan={plan}
          isAr={isAr}
          view={view}
          setView={setView}
          childName={activeChild.name}
          childrenList={childrenList}
          activeChildId={activeChild.id}
          onChildChange={handleChild}
          targetName={goal?.name ?? t('No goal yet', 'لا يوجد هدف بعد')}
          onEditPlan={() => setView('plan')}
          onOpenReport={() => setShowReport(true)}
          onSave={saveDatasheet}
          onAddMeasure={(id) => {
            if (plan.measureIds.includes(id)) return;
            saveSessionPlan(activeChild.id, role, plan.procedureIds, [...plan.measureIds, id]);
            showNotification(t('Measure added to your plan and datasheet.', 'تمت إضافة القياس إلى الخطة وورقة البيانات.'));
          }}
          notify={showNotification}
          beforeSave={
            <>
              {decisionOverride}
              {!decisionOverride && goal && (() => {
                const mastery = parseMastery(goal.masteryCriterion, goal.criterionThreshold);
                // Saved sessions for this goal; a goal with none yet falls back to the scores it already carries.
                const scores = history.length ? history : goal.lastThreeSessions.filter((x) => x > 0);
                const d = decide({ status: goal.status, threshold: mastery.threshold, sessions: mastery.sessions, scores });
                return (
                  <section className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3" data-testid="decision-panel">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-[#4338CA]">{t('Last 3 sessions', 'آخر 3 جلسات')}</span>
                    <div className="rounded-2xl border border-[#C7D2FE] bg-indigo-50/70 dark:bg-indigo-950/40 p-3.5 space-y-2">
                      <p className="text-sm font-bold text-[#312E81] dark:text-indigo-200" dir="auto">
                        {d.latest === null ? t('No sessions recorded yet.', 'لا توجد جلسات مسجلة بعد.') : `${d.latest}% ${t('on the main measure.', 'في القياس الرئيسي.')}`} {t('Mastery criterion:', 'معيار الإتقان:')} {goal.masteryCriterion}. {t('Suggested:', 'المقترح:')} {d.suggestion}.
                      </p>
                      <button type="button" aria-expanded={showWhy} onClick={() => setShowWhy((v) => !v)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#4338CA] text-[#4338CA] dark:text-indigo-200 text-xs font-bold bg-white dark:bg-transparent">
                        {t('Why this was suggested (Transparent Decision Support)', 'لماذا هذا الاقتراح (دعم القرار الشفاف)')} <ChevronDown className={`w-3.5 h-3.5 transition ${showWhy ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {showWhy && (
                      <div className="text-xs space-y-1.5 text-[#16302C] dark:text-gray-200" data-testid="decision-why">
                        <p><b>{t('Rule applied:', 'القاعدة المطبقة:')}</b> {d.rule}</p>
                        {d.scores.length > 0 && <p><b>{t('Scores looked at (oldest first):', 'الدرجات المدروسة (الأقدم أولاً):')}</b> {d.scores.map((x) => `${x}%`).join(' → ')}</p>}
                        <ul className="list-disc ps-5 space-y-0.5">{d.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                        <p className="text-[#5C706C]">{t('This is a suggestion from fixed rules, not a diagnosis. You decide.', 'هذا اقتراح من قواعد ثابتة وليس تشخيصاً. القرار لك.')}</p>
                      </div>
                    )}
                  </section>
                );
              })()}
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => { setNewDomain(undefined); setEditingTarget(null); }} className="py-3 rounded-2xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-[#1F1B3A] text-sm font-bold text-[#1F1B3A] dark:text-white">{t('Add target', 'إضافة هدف')}</button>
                {role === 'speech' && <button type="button" onClick={() => { setNewDomain('AAC Core'); setEditingTarget(null); }} className="py-3 rounded-2xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-[#1F1B3A] text-sm font-bold text-[#1F1B3A] dark:text-white">{t('Add AAC goal', 'إضافة هدف AAC')}</button>}
              </div>
            </>
          }
        />
      </>
    );

  const renderNotes = () => (
    <div className="space-y-4 pb-28 animate-in fade-in">
      <SoapNoteCard
        role={role}
        childName={activeChild.name}
        language={language as 'en' | 'ar'}
        soapSubjective={soapS} setSoapSubjective={setSoapS}
        soapObjective={soapO} setSoapObjective={setSoapO}
        soapAssessment={soapA} setSoapAssessment={setSoapA}
        soapPlan={soapP} setSoapPlan={setSoapP}
        onAutoDraft={autoDraft}
        isAutoDrafting={drafting}
        onSaveNote={saveSoap}
      />
      <button type="button" onClick={() => setShowReport(true)} className="w-full py-3 rounded-xl border-[1.5px] border-[#0F766E] text-[#0F766E] dark:text-teal-300 text-sm font-semibold">
        {t('Session report for parents', 'تقرير الجلسة للأهل')}
      </button>
      <SoapArchive
        sessions={savedSessions.filter((s) => s.role === role && s.childId === activeChild.id)}
        childName={activeChild.name}
        language={language as 'en' | 'ar'}
        title={t(cfg.archiveTitle.en, cfg.archiveTitle.ar)}
        credential={cfg.credential}
      />
    </div>
  );

  return (
    <div className="max-w-md md:max-w-6xl mx-auto px-4 md:px-8 pt-3 md:pt-6" data-testid={`${role}-portal`}>
      {tab === 'today' && renderToday()}
      {tab === 'targets' && (
        <TargetsPanel
          isAr={isAr}
          targets={roleTargets}
          sessions={childSessions}
          title={cfg.goalsTitle}
          subtitle={cfg.goalsSubtitle}
          addLabel={cfg.addLabel}
          noun={cfg.noun}
          groupOf={cfg.groupOf}
          onAdd={() => setEditingTarget(null)}
          onEdit={(x) => setEditingTarget(x)}
          onReport={() => setShowReport(true)}
          onLaunch={cfg.launch ? (x) => {
            setTargetId(x.id);
            setView('datasheet');
            setActiveTab('Today');
            showNotification(t(`Session goal: ${x.name}`, `هدف الجلسة: ${x.name}`));
          } : undefined}
        />
      )}
      {tab === 'graphs' && (
        <BehaviorGraphs isAr={isAr} targets={roleTargets} sessions={childSessions} onReport={() => setShowReport(true)} metrics={cfg.metrics} />
      )}
      {tab === 'notes' && renderNotes()}
      {tab === 'family' && <FamilyPanel />}
      {extraTabs[tab] !== undefined && extraTabs[tab]}

      {showReport && (
        <div className="absolute inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={() => setShowReport(false)} role="dialog" aria-modal="true">
          <div className="bg-white dark:bg-[#1F1B3A] w-full rounded-t-3xl border border-[#E8E2D9] dark:border-[#38325E] shadow-float p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] space-y-3 max-h-[88%] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">{t(cfg.reportTitle.en, cfg.reportTitle.ar)}</h4>
              <button type="button" onClick={() => setShowReport(false)} aria-label="Close" className="p-1 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <pre data-testid="therapy-report" className="text-xs whitespace-pre-wrap font-sans leading-relaxed bg-[#FAF6F0] dark:bg-[#252044] rounded-2xl p-3.5 border border-[#E8E2D9] dark:border-[#38325E]" dir="auto">{reportText}</pre>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setReportShare(true)} className="py-3 rounded-xl bg-[#0F766E] text-white text-sm font-bold flex items-center justify-center gap-1.5"><Send className="w-4 h-4" /> {t('Send to parents', 'إرسال إلى ولي الأمر')}</button>
              <button
                type="button"
                onClick={async () => {
                  try { await navigator.clipboard.writeText(reportText); showNotification(t('Report copied.', 'تم نسخ التقرير.')); } catch { showNotification(t('Copy is not available here.', 'النسخ غير متاح هنا.')); }
                }}
                className="py-3 rounded-xl border-[1.5px] border-[#0F766E] text-[#0F766E] dark:text-teal-300 text-sm font-semibold flex items-center justify-center gap-1.5"
              ><Copy className="w-4 h-4" /> {t('Copy text', 'نسخ النص')}</button>
            </div>
          </div>
        </div>
      )}

      {reportShare && (
        <ShareToTeamModal
          role={role}
          isAr={isAr}
          title={t('Send report inside the app', 'إرسال التقرير داخل التطبيق')}
          subtitle={`${activeChild.name} · ${goal?.name ?? ''}`}
          text={reportText}
          tag="Session Report"
          childName={activeChild.name}
          authorName={currentUserName}
          onClose={() => setReportShare(false)}
        />
      )}

      {editingTarget !== undefined && (
        <GoalModal
          isAr={isAr}
          target={editingTarget}
          childName={activeChild.name}
          domains={cfg.domains}
          noun={cfg.dialogNoun}
          initialDomain={newDomain}
          onClose={() => setEditingTarget(undefined)}
          onDelete={editingTarget ? () => { deleteTarget(editingTarget.id); setEditingTarget(undefined); } : undefined}
          onSave={(v) => {
            if (editingTarget) {
              // Only touch the criterion when it changed: changing it sends the goal back for approval.
              const criterionChanged = v.masteryCriterion !== editingTarget.masteryCriterion || v.criterionThreshold !== editingTarget.criterionThreshold;
              updateTarget(editingTarget.id, {
                name: v.name, domain: v.domain, operationalDefinition: v.operationalDefinition, procedureNotes: v.procedureNotes,
                procedureSteps: v.procedureSteps, materials: v.materials, baseline: v.baseline, status: v.status,
                ...(criterionChanged ? { masteryCriterion: v.masteryCriterion, criterionThreshold: v.criterionThreshold } : {}),
              });
            } else {
              addTarget({
                childId: activeChild.id, discipline: role, name: v.name, domain: v.domain, operationalDefinition: v.operationalDefinition,
                procedureNotes: v.procedureNotes, procedureSteps: v.procedureSteps, materials: v.materials, masteryCriterion: v.masteryCriterion,
                criterionThreshold: v.criterionThreshold, baseline: v.baseline, status: v.status, therapistName: currentUserName,
              });
            }
            setEditingTarget(undefined);
          }}
        />
      )}
    </div>
  );
};
