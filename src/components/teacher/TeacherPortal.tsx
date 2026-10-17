import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useVoiceDictation } from '../../hooks/useVoiceDictation';
import { DictationPanel } from '../common/DictationPanel';
import { ParentChat, HomeTasksManager } from '../common/FamilyPanel';
import { ShareToTeamModal } from '../common/ShareToTeamModal';
import type { ObservationRecord } from '../../types';
import {
  Save,
  Camera,
  Mic,
  MicOff,
  Users,
  Sparkles,
  BookOpen,
  FileText,
  Plus,
  Share2,
  CheckCircle2,
  ShieldAlert,
  Lightbulb,
  Filter
} from 'lucide-react';

type ResultKind = ObservationRecord['result'];

const RESULT_SCORE: Record<ResultKind, number> = {
  'Completed independently': 100,
  'Partially completed': 65,
  'Needed help': 40,
  'Not completed': 0,
};

const PRESET_CLASSROOM_GOALS = [
  'Answers questions in class',
  'Follows 2-step classroom routine',
  'Remains seated during group instruction',
  'Uses gentle hands and shares supplies',
  'Transitions smoothly between activities',
];

const QUICK_ACTIVITIES = [
  'Science: parts of a plant',
  'Morning Circle & Calendar',
  'Small-Group Reading Station',
  'Math Manipulatives & Counting',
  'Art & Fine-Motor Craft',
  'Recess / Classroom Transition',
];

const QUICK_OBSERVATION_CHIPS = [
  'Raised hand spontaneously',
  'Used desk visual schedule',
  'Needed 1 verbal prompt',
  'Worked cooperatively with peer partner',
  'Self-regulated using calm corner',
];

export const TeacherPortal: React.FC = () => {
  const {
    activeChild,
    childrenList,
    selectedChildId,
    setSelectedChildId,
    activeTab,
    setActiveTab,
    language,
    targets,
    bips,
    addTarget,
    addSessionResult,
    addTeacherObservation,
    observations,
    currentUserName,
    showNotification,
    triggerConfetti,
  } = useApp();

  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);

  // Combine child's real clinical/classroom targets with preset classroom generalization goals
  const childTargets = useMemo(
    () => targets.filter((g) => g.childId === activeChild.id && g.approvalStatus !== 'rejected'),
    [targets, activeChild.id]
  );

  const goalsList = useMemo(() => {
    const names = new Set<string>(childTargets.map((g) => g.name));
    PRESET_CLASSROOM_GOALS.forEach((g) => names.add(g));
    return Array.from(names);
  }, [childTargets]);

  const [selectedGoal, setSelectedGoal] = useState<string>('Answers questions in class');
  const [activityText, setActivityText] = useState<string>('Science: parts of a plant');
  const [selectedResult, setSelectedResult] = useState<ResultKind>('Completed independently');
  const [observationNote, setObservationNote] = useState<string>(
    'Answered 4 of 5 questions on their own during plant discussion.'
  );
  const [syncToClinicalGoal, setSyncToClinicalGoal] = useState<boolean>(true);

  // Add new classroom generalization goal modal state
  const [showAddGoal, setShowAddGoal] = useState<boolean>(false);
  const [newGoalName, setNewGoalName] = useState<string>('');
  const [newGoalDomain, setNewGoalDomain] = useState<string>('Classroom Participation');
  const [newGoalDef, setNewGoalDef] = useState<string>('');

  // Notes filter & share modal
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [resultFilter, setResultFilter] = useState<string>('all');
  const [shareObs, setShareObs] = useState<ObservationRecord | null>(null);

  // Voice dictation for hands-free teacher observation notes
  const voice = useVoiceDictation({
    language,
    role: 'teacher',
  });
  const { isListening, activeField, startDictation, stopDictation, hasSpeechSupport, canRecord } = voice;
  const dictatingObs = isListening && activeField === 'teacher-obs';

  const matchedClinicalTarget = useMemo(
    () => childTargets.find((g) => g.name === selectedGoal),
    [childTargets, selectedGoal]
  );

  const activeBip = useMemo(
    () => bips.find((b) => b.childId === activeChild.id),
    [bips, activeChild.id]
  );

  const handleSaveObservation = () => {
    const cleanActivity = activityText.trim() || 'Classroom activity';
    const cleanNote = observationNote.trim();
    addTeacherObservation({
      studentId: activeChild.id,
      studentName: activeChild.name,
      goal: selectedGoal,
      activity: cleanActivity,
      result: selectedResult,
      observation: cleanNote,
      teacherName: currentUserName || 'Ms. Layla Fahad',
    });

    // If linked to an active clinical/classroom target, also feed generalization score into target progress
    if (syncToClinicalGoal && matchedClinicalTarget) {
      const score = RESULT_SCORE[selectedResult];
      addSessionResult(
        matchedClinicalTarget.id,
        score,
        `[Classroom Generalization · ${cleanActivity}] ${selectedResult}${cleanNote ? ` — ${cleanNote}` : ''}`
      );
    }

    if (selectedResult === 'Completed independently') {
      triggerConfetti();
    }
    showNotification(
      isAr
        ? 'تم حفظ الملاحظة الصفية ومشاركتها مع الفريق والأهل'
        : 'Classroom observation saved & synced with care team'
    );
  };

  const handleCreateClassroomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoalName.trim().length < 3) {
      showNotification(t('Enter a classroom goal title.', 'أدخل عنوان الهدف الصفي.'));
      return;
    }
    addTarget({
      childId: activeChild.id,
      discipline: 'teacher',
      name: newGoalName.trim(),
      domain: newGoalDomain.trim() || 'Classroom Inclusion',
      operationalDefinition:
        newGoalDef.trim() ||
        `During regular classroom activities, ${activeChild.name} will demonstrate "${newGoalName.trim()}" across settings and peers.`,
      materials: ['Classroom visual schedule', 'Peer partner station'],
      procedureSteps: [
        'Preview expectation using visual cue before activity starts',
        'Provide natural classroom instruction with peers',
        'Wait 5 seconds for independent initiation',
        'Deliver specific praise or gentle prompt as needed',
      ],
      masteryCriterion: '80% across 3 sessions',
      criterionThreshold: 80,
      status: 'teaching',
      therapistName: currentUserName || 'Ms. Layla Fahad',
      origin: 'Classroom Generalization Target',
    });
    setSelectedGoal(newGoalName.trim());
    setNewGoalName('');
    setNewGoalDef('');
    setShowAddGoal(false);
    showNotification(t('Classroom goal added.', 'تمت إضافة الهدف الصفي.'));
  };

  /* ---------------------------------------------------- */
  /* TAB 1: RECORD AN ACTIVITY (4-Tap + Desktop Grid)     */
  /* ---------------------------------------------------- */
  const renderRecordActivityTab = () => (
    <div className="space-y-5 pb-28 md:pb-12 animate-in fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white mb-1">
            {isAr ? 'تسجيل نشاط مدرسي' : 'Record an activity'}
          </h2>
          <p className="text-sm text-[#6B6785] dark:text-[#A5A0C2]">
            {isAr ? 'طالب ← هدف ← نشاط ← ملاحظة' : 'Student → Goal → Activity → Observation'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddGoal(true)}
          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
          data-testid="teacher-add-goal-btn"
        >
          <Plus className="w-4 h-4" />
          <span>{t('New classroom goal', 'هدف صفي جديد')}</span>
        </button>
      </div>

      {/* Desktop 2-Column Layout: Left = 4-Tap Recorder, Right = Classroom Accommodations & Generalization Passport */}
      <div className="space-y-5 md:space-y-0 md:grid md:grid-cols-12 md:gap-6 items-start">
        {/* Left Column (7 cols on desktop): Fast 4-Tap Activity Recorder */}
        <div className="space-y-4 md:col-span-7">
          {/* Student Selector Strip */}
          <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-4 shadow-card space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#10B981] dark:text-emerald-400 block">
              {t('1. Student in Class', '١. الطالب')}
            </label>
            <div className="flex flex-wrap gap-2">
              {childrenList.map((c) => {
                const active = c.id === activeChild.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedChildId(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-2 ${
                      active
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-[#FAF6F0] dark:bg-[#252044] text-[#1F1B3A] dark:text-gray-200 border-[#E8E2D9] dark:border-[#38325E]'
                    }`}
                  >
                    <span>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal Field */}
          <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#10B981] dark:text-emerald-400 block">
                {isAr ? 'الهدف التعليمي / السلوكي' : 'Goal'}
              </label>
              {matchedClinicalTarget && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-[#4F46E5] dark:text-indigo-300">
                  {t(`Linked to ${matchedClinicalTarget.discipline.toUpperCase()} goal (${matchedClinicalTarget.currentPerformance}%)`, 'مرتبط بهدف إكلينيكي')}
                </span>
              )}
            </div>
            <select
              aria-label="Goal"
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
              className="w-full text-sm font-semibold text-[#1F1B3A] dark:text-white bg-transparent outline-hidden cursor-pointer"
            >
              {goalsList.map((g) => (
                <option key={g} value={g} className="bg-white dark:bg-[#1F1B3A] text-[#1F1B3A] dark:text-white">
                  {g}
                </option>
              ))}
            </select>
            {matchedClinicalTarget && (
              <label className="flex items-center gap-2 pt-1 text-xs text-[#6B6785] dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={syncToClinicalGoal}
                  onChange={(e) => setSyncToClinicalGoal(e.target.checked)}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span>
                  {t(
                    'Count this classroom observation toward clinical goal generalization graph',
                    'احتساب هذه الملاحظة الصفية ضمن رسم تعميم الهدف الإكلينيكي'
                  )}
                </span>
              </label>
            )}
          </div>

          {/* Activity Field + Quick Lesson Chips */}
          <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#10B981] dark:text-emerald-400 block">
              {isAr ? 'النشاط الدراسي' : 'Activity'}
            </label>
            <input
              type="text"
              value={activityText}
              onChange={(e) => setActivityText(e.target.value)}
              placeholder="e.g. Science: parts of a plant"
              className="w-full text-sm font-semibold text-[#1F1B3A] dark:text-white bg-transparent outline-hidden border-b border-[#E8E2D9] dark:border-[#38325E] pb-1.5"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {QUICK_ACTIVITIES.map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => setActivityText(act)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
                    activityText === act
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'bg-[#FAF6F0] dark:bg-[#252044] border-[#E8E2D9] dark:border-[#38325E] text-[#6B6785] dark:text-gray-300 hover:border-emerald-300'
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          {/* 4 Result Buttons matching PDF 2 Page 5 */}
          <div className="space-y-2.5 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-2.5">
            {[
              {
                id: 'Completed independently',
                labelAr: 'أنجز باستقلالية',
                subEn: 'No teacher prompt needed (100%)',
                color:
                  'border-emerald-500 bg-[#DDF5EA] text-[#1B9E6B] dark:bg-emerald-950 dark:text-emerald-300',
              },
              {
                id: 'Needed help',
                labelAr: 'احتاج مساعدة',
                subEn: 'Verbal, gestural or model prompt (40%)',
                color:
                  'border-amber-500 bg-[#FFF1CC] text-[#B7791F] dark:bg-amber-950 dark:text-amber-300',
              },
              {
                id: 'Partially completed',
                labelAr: 'أنجز جزئياً',
                subEn: 'Started or did part independently (65%)',
                color:
                  'border-indigo-500 bg-[#E0E7FF] text-[#4F46E5] dark:bg-indigo-950 dark:text-indigo-300',
              },
              {
                id: 'Not completed',
                labelAr: 'لم يكتمل',
                subEn: 'Refused or needed full redirection (0%)',
                color: 'border-rose-500 bg-[#FDE3E4] text-[#D63B3B] dark:bg-rose-950 dark:text-rose-300',
              },
            ].map((res) => {
              const isSelected = selectedResult === res.id;
              return (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => setSelectedResult(res.id as ResultKind)}
                  className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-sm transition-all border-2 flex items-center justify-between text-left rtl:text-right shadow-card ${
                    isSelected
                      ? res.color + ' shadow-warm'
                      : 'bg-white dark:bg-[#1F1B3A] border-[#E8E2D9] dark:border-[#38325E] text-[#1F1B3A] dark:text-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <span className="block">{isAr ? res.labelAr : res.id}</span>
                    <span className="block text-[10px] opacity-80 font-normal mt-0.5">{res.subEn}</span>
                  </div>
                  {isSelected && <span className="font-bold text-base">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Observation (optional) + Live Voice Dictation & Quick Chips */}
          <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#6B6785] dark:text-[#8E8AAB]">
                {isAr ? 'ملاحظة المعلم (اختياري)' : 'Observation (optional)'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => showNotification('Quick classroom photo attached')}
                  className="p-1.5 rounded-lg text-[#6B6785] hover:text-[#10B981] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
                  title="Attach photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!hasSpeechSupport && !canRecord) {
                      showNotification('Voice dictation is not supported in this browser');
                      return;
                    }
                    if (dictatingObs) stopDictation();
                    else startDictation('teacher-obs', observationNote, setObservationNote);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                    dictatingObs
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                  }`}
                  title="Voice dictation"
                >
                  {dictatingObs ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  <span>{dictatingObs ? t('Stop', 'إيقاف') : t('Dictate', 'إملاء صوتي')}</span>
                </button>
              </div>
            </div>
            <DictationPanel v={voice} field="teacher-obs" isAr={language === 'ar'} />
            <textarea
              value={observationNote}
              onChange={(e) => setObservationNote(e.target.value)}
              placeholder="e.g. Answered 4 of 5 questions on their own"
              rows={3}
              className="w-full text-xs p-3 rounded-xl border border-[#E8E2D9] dark:border-[#38325E] bg-[#FAF6F0] dark:bg-[#252044] text-[#1F1B3A] dark:text-white outline-hidden resize-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {QUICK_OBSERVATION_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() =>
                    setObservationNote((prev) =>
                      prev.trim() ? `${prev.trim().replace(/\.$/, '')}. ${chip}.` : `${chip}.`
                    )
                  }
                  className="px-2.5 py-1 rounded-full text-[11px] bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E] text-[#6B6785] dark:text-gray-300 hover:border-emerald-400 transition"
                >
                  + {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Save Button matching PDF 2 Page 5 */}
          <button
            type="button"
            onClick={handleSaveObservation}
            className="w-full py-4 rounded-2xl bg-[#1B9E6B] hover:bg-[#147952] text-white font-heading font-semibold text-base shadow-warm flex items-center justify-center gap-2 active:scale-98 transition"
          >
            <Save className="w-5 h-5" />
            <span>Save</span>
          </button>
        </div>

        {/* Right Column (5 cols on desktop): Classroom Accommodation Passport & Clinical Bridge */}
        <div className="space-y-4 md:col-span-5">
          {/* Student Classroom Passport */}
          <div
            className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3"
            data-testid="classroom-passport"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <img
                  src={activeChild.avatar}
                  alt={activeChild.name}
                  className="w-10 h-10 rounded-full object-cover border border-emerald-200"
                />
                <div>
                  <h3 className="font-heading font-bold text-sm text-[#1F1B3A] dark:text-white">
                    {activeChild.name} · {t('Classroom Passport', 'بطاقة التسهيلات الصفية')}
                  </h3>
                  <p className="text-[11px] text-[#6B6785]">
                    {activeChild.school} · {activeChild.classroom}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                {t('Generalization Bridge', 'جسر التعميم')}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF6F0] dark:bg-[#252044] space-y-1.5 text-xs">
              <p className="font-bold text-[#1F1B3A] dark:text-white flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('What works best in class (from Clinical Team):', 'ما ينجح في الفصل (توصيات الفريق الإكلينيكي):')}</span>
              </p>
              <ul className="list-disc ps-4 space-y-1 text-[#6B6785] dark:text-gray-300 text-[11px]">
                <li>
                  <b>{t('Visual First-Then:', 'جدول أولاً-ثم البصري:')}</b>{' '}
                  {t('Show the 2-step picture cue on the desk before transitions.', 'اعرض بطاقة الخطوتين على الطاولة قبل الانتقال.')}
                </li>
                <li>
                  <b>{t('5-Second Wait Time:', 'انتظار 5 ثوانٍ:')}</b>{' '}
                  {t('After asking a WH question, pause 5 seconds before repeating.', 'بعد طرح السؤال انتظر 5 ثوانٍ قبل الإعادة.')}
                </li>
                <li>
                  <b>{t('Sensory Regulation:', 'التنظيم الحسي:')}</b>{' '}
                  {t('Offer 2-minute heavy-work helper task (carrying books) before seated writing.', 'قدم مهمة حركية قصيرة قبل الكتابة.')}
                </li>
              </ul>
            </div>

            {activeBip && (
              <div className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 space-y-1 text-xs">
                <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{t('Behavior Support Quick Tip:', 'دعم السلوك السريع:')}</span>
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  <b>{activeBip.targetBehavior}:</b> {activeBip.replacementBehavior || activeBip.antecedentStrategies}
                </p>
              </div>
            )}

            {/* Active Goals Being Generalized in Classroom */}
            <div className="space-y-2 pt-1">
              <p className="text-xs font-bold text-[#1F1B3A] dark:text-white">
                {t('Active Goals Being Generalized in School', 'الأهداف النشطة للتعميم في المدرسة')} ({childTargets.length})
              </p>
              <div className="space-y-1.5 max-h-52 overflow-y-auto pe-1">
                {childTargets.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGoal(g.name)}
                    className={`w-full text-left rtl:text-right p-2.5 rounded-xl border text-xs transition flex items-center justify-between gap-2 ${
                      selectedGoal === g.name
                        ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40'
                        : 'border-[#E8E2D9] dark:border-[#38325E] bg-[#FAF6F0]/60 dark:bg-[#252044]/60 hover:border-emerald-300'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#4F46E5] dark:text-indigo-300 block">
                        {g.discipline} · {g.domain}
                      </span>
                      <span className="font-semibold text-[#1F1B3A] dark:text-white truncate block">{g.name}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] shrink-0">
                      {g.currentPerformance}%
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Classroom Goal Modal */}
      {showAddGoal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center md:p-6"
          onClick={() => setShowAddGoal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-[#1F1B3A] w-full md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-float p-5 md:p-6 space-y-3"
          >
            <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">
              {t(`New Classroom Goal for ${activeChild.name}`, `هدف صفي جديد لـ ${activeChild.name}`)}
            </h3>
            <form onSubmit={handleCreateClassroomGoal} className="space-y-3">
              <label className="block">
                <span className="text-xs font-bold block mb-1">{t('Goal Title', 'عنوان الهدف الصفي')}</span>
                <input
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                  placeholder="e.g. Raises hand and waits to be called during group lesson"
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E2E6EA] dark:border-[#38325E] bg-[#F8FAFC] dark:bg-[#252044] outline-none"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold block mb-1">{t('Classroom Area', 'المجال الصفي')}</span>
                <select
                  value={newGoalDomain}
                  onChange={(e) => setNewGoalDomain(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E2E6EA] dark:border-[#38325E] bg-[#F8FAFC] dark:bg-[#252044] outline-none"
                >
                  <option value="Classroom Participation">Classroom Participation</option>
                  <option value="Peer Social Interaction">Peer Social Interaction</option>
                  <option value="Transitions & Routines">Transitions & Routines</option>
                  <option value="Group Attention & Seating">Group Attention & Seating</option>
                  <option value="Self-Regulation in Class">Self-Regulation in Class</option>
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold block mb-1">{t('What it looks like in class (optional)', 'وصف السلوك المتوقع في الفصل')}</span>
                <textarea
                  rows={3}
                  value={newGoalDef}
                  onChange={(e) => setNewGoalDef(e.target.value)}
                  placeholder="e.g. Given a group question in a class of 15+ peers, the student raises their hand and waits 3 seconds."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-[#E2E6EA] dark:border-[#38325E] bg-[#F8FAFC] dark:bg-[#252044] outline-none"
                />
              </label>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddGoal(false)}
                  className="py-2.5 rounded-xl border border-[#E8E2D9] dark:border-[#38325E] text-xs font-bold"
                >
                  {t('Cancel', 'إلغاء')}
                </button>
                <button
                  type="submit"
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  {t('Save Classroom Goal', 'حفظ الهدف الصفي')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  /* ---------------------------------------------------- */
  /* TAB 2: STUDENTS (Real Roster & Generalization Stats) */
  /* ---------------------------------------------------- */
  const renderStudentsTab = () => (
    <div className="space-y-4 pb-28 md:pb-12 animate-in fade-in">
      <div>
        <h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white">
          {isAr ? 'طلاب الفصل' : 'Classroom Students'}
        </h2>
        <p className="text-xs text-[#6B6785]">
          {isAr
            ? 'المتابعة الأسبوعية للأهداف الصفية ونسبة الاستقلالية في الفصل'
            : 'Classroom inclusion, generalization independence & weekly progress across your roster'}
        </p>
      </div>

      <div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
        {childrenList.map((st, idx) => {
          const stObs = observations.filter(
            (o) => o.studentId === st.id || o.studentName.toLowerCase() === st.name.toLowerCase()
          );
          const indepCount = stObs.filter((o) => o.result === 'Completed independently').length;
          const partialCount = stObs.filter((o) => o.result === 'Partially completed').length;
          const helpCount = stObs.filter((o) => o.result === 'Needed help').length;
          const notCount = stObs.filter((o) => o.result === 'Not completed').length;
          const indepPercent =
            stObs.length > 0
              ? Math.round(
                  stObs.reduce((sum, o) => sum + (RESULT_SCORE[o.result] ?? 50), 0) / stObs.length
                )
              : idx === 0
              ? 85
              : idx === 1
              ? 90
              : 75;
          const stGoals = targets.filter((g) => g.childId === st.id && g.approvalStatus !== 'rejected');
          const primaryGoal = stGoals[0]?.name ?? 'Answers questions in class';
          const isCurrent = st.id === selectedChildId;

          return (
            <div
              key={st.id}
              className={`bg-white dark:bg-[#1F1B3A] border-2 rounded-[20px] p-4 shadow-card space-y-3 transition ${
                isCurrent
                  ? 'border-emerald-500'
                  : 'border-[#E8E2D9] dark:border-[#38325E]'
              }`}
              data-testid="teacher-student-card"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={st.avatar}
                    alt={st.name}
                    className="w-11 h-11 rounded-full object-cover border border-emerald-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="font-heading font-bold text-sm text-[#1F1B3A] dark:text-white truncate">
                      {st.name}
                    </h4>
                    <p className="text-[11px] text-[#6B6785] truncate">
                      {st.classroom || 'Grade 1'} · {stGoals.length} {t('active goals', 'أهداف نشطة')}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full shrink-0">
                  {indepPercent}% Indep
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-[#FAF6F0] dark:bg-[#252044] text-xs space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#10B981] block">
                  {t('Focus Classroom Goal', 'الهدف الصفي الحالي')}
                </span>
                <p className="font-semibold text-[#1F1B3A] dark:text-white truncate">{primaryGoal}</p>
              </div>

              {/* Outcome Breakdown Pills */}
              <div className="grid grid-cols-4 gap-1.5 text-center text-[10px]">
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
                  <b className="block text-xs">{indepCount}</b>
                  <span>Indep</span>
                </div>
                <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300">
                  <b className="block text-xs">{partialCount}</b>
                  <span>Partial</span>
                </div>
                <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
                  <b className="block text-xs">{helpCount}</b>
                  <span>Help</span>
                </div>
                <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300">
                  <b className="block text-xs">{notCount}</b>
                  <span>Not yet</span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChildId(st.id);
                    setActiveTab('Today');
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                >
                  {t('Record Activity', 'تسجيل نشاط')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedChildId(st.id);
                    setStudentFilter(st.id);
                    setActiveTab('Notes');
                  }}
                  className="py-2 px-3 rounded-xl border border-[#E8E2D9] dark:border-[#38325E] text-xs font-semibold hover:border-emerald-500 transition"
                >
                  {t('Logs', 'السجل')} ({stObs.length})
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  /* ---------------------------------------------------- */
  /* TAB 3: NOTES (Filterable Logs & Team/Family Share)   */
  /* ---------------------------------------------------- */
  const renderNotesTab = () => {
    const filtered = observations.filter((o) => {
      if (studentFilter !== 'all' && o.studentId !== studentFilter) return false;
      if (resultFilter !== 'all' && o.result !== resultFilter) return false;
      return true;
    });

    return (
      <div className="space-y-4 pb-28 md:pb-12 animate-in fade-in">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white">
              {t('Classroom Logs', 'سجل الملاحظات الصفية')}
            </h2>
            <p className="text-xs text-[#6B6785]">
              {t(
                'Shared observations visible to parents and the clinical therapy team',
                'الملاحظات الصفية المشتركة مع الأسرة والفريق الإكلينيكي'
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by student"
              value={studentFilter}
              onChange={(e) => setStudentFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-[#E8E2D9] dark:border-[#38325E] bg-white dark:bg-[#1F1B3A]"
            >
              <option value="all">{t('All students', 'جميع الطلاب')}</option>
              {childrenList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by outcome"
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-[#E8E2D9] dark:border-[#38325E] bg-white dark:bg-[#1F1B3A]"
            >
              <option value="all">{t('All outcomes', 'جميع النتائج')}</option>
              <option value="Completed independently">Completed independently</option>
              <option value="Partially completed">Partially completed</option>
              <option value="Needed help">Needed help</option>
              <option value="Not completed">Not completed</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
          {filtered.map((obs) => (
            <div
              key={obs.id}
              className="p-4 rounded-2xl bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] shadow-card space-y-2 flex flex-col justify-between"
            >
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#10B981]">
                    {obs.studentName} · {obs.activity}
                  </span>
                  <span className="text-[#6B6785]">{obs.timestamp}</span>
                </div>
                <p className="text-sm font-semibold text-[#1F1B3A] dark:text-white">
                  {obs.goal} •{' '}
                  <span
                    className={
                      obs.result === 'Completed independently'
                        ? 'text-emerald-600'
                        : obs.result === 'Needed help'
                        ? 'text-amber-600'
                        : obs.result === 'Partially completed'
                        ? 'text-indigo-600'
                        : 'text-rose-600'
                    }
                  >
                    {obs.result}
                  </span>
                </p>
                {obs.observation && (
                  <p className="text-xs text-[#6B6785] dark:text-gray-300">"{obs.observation}"</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#E8E2D9]/60 dark:border-[#38325E]/60 text-[11px] text-[#6B6785]">
                <span>{obs.teacherName}</span>
                <button
                  type="button"
                  onClick={() => setShareObs(obs)}
                  className="inline-flex items-center gap-1 font-bold text-[#10B981] hover:underline"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{t('Share with care team', 'مشاركة مع الفريق')}</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {shareObs && (
          <ShareToTeamModal
            role="teacher"
            isAr={isAr}
            title={t('Share Classroom Observation', 'مشاركة الملاحظة الصفية')}
            subtitle={t(
              `Choose who receives this classroom update for ${shareObs.studentName}`,
              `اختر من يستلم تحديث النشاط الصفي للطالب ${shareObs.studentName}`
            )}
            onClose={() => setShareObs(null)}
            childName={shareObs.studentName}
            authorName={shareObs.teacherName || currentUserName}
            tag={shareObs.goal}
            text={`[Classroom Observation · ${shareObs.activity}]\nStudent: ${shareObs.studentName}\nGoal: ${shareObs.goal}\nOutcome: ${shareObs.result}\nNote: ${shareObs.observation || '—'}`}
          />
        )}
      </div>
    );
  };

  /* ---------------------------------------------------- */
  /* TAB 4: FAMILY (Two-way Parent Chat & Home Alignment) */
  /* ---------------------------------------------------- */
  const renderFamilyTab = () => (
    <div className="space-y-6 pb-28 md:pb-12 animate-in fade-in">
      <div>
        <h2 className="font-heading text-2xl font-bold text-[#1F1B3A] dark:text-white">
          {t('School–Home Bridge', 'التواصل بين المدرسة والمنزل')}
        </h2>
        <p className="text-xs text-[#6B6785]">
          {t(
            `Coordinate classroom wins and home practice with ${activeChild.name}'s parents`,
            `تنسيق التقدم الصفي والتدريب المنزلي مع أسرة ${activeChild.name}`
          )}
        </p>
      </div>
      <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6 items-start">
        <ParentChat />
        <HomeTasksManager />
      </div>
    </div>
  );

  const tab = activeTab.toLowerCase();

  return (
    <div className="max-w-md md:max-w-6xl mx-auto px-4 md:px-8 pt-3 md:pt-6" data-testid="teacher-portal">
      {tab === 'today' && renderRecordActivityTab()}
      {tab === 'students' && renderStudentsTab()}
      {tab === 'notes' && renderNotesTab()}
      {tab === 'family' && renderFamilyTab()}
    </div>
  );
};
