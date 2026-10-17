import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { procedureName, measureName } from '../../data/planConfig';
import { SessionPlanner } from '../therapy/SessionPlanner';
import { SoapNoteCard } from '../common/SoapNoteCard';
import { SoapArchive } from '../common/SoapArchive';
import { useBehaviorDatasheet } from '../../hooks/useBehaviorDatasheet';
import { BehaviorDatasheetViews, DatasheetView } from './BehaviorDatasheetViews';
import { BipPortal } from './BipPortal';
import { FamilyPanel } from '../common/FamilyPanel';
import { BehaviorGraphs } from './BehaviorGraphs';
import { TargetEditorModal } from './TargetEditorModal';
import { TargetsPanel } from '../common/TargetsPanel';
import type { Target } from '../../types';
import { ShareToTeamModal } from '../common/ShareToTeamModal';
import { planSectionText, tasksSummary, FUNCTION_NAME } from '../../utils/behaviorReport';
import { summarizeAbc } from '../../utils/abcAnalysis';
import { 
  Play, 
  Pause, 
  Plus, 
  Clock, 
  TrendingUp, 
  FileText, 
  Save, 
  Mic, 
  Camera, 
  Sparkles,
  Sliders,
  CheckCircle2,
  Calendar,
  Award,
  Layers,
  ChevronRight,
  Share2,
  Printer,
  Copy,
  Send,
  X,
  Check,
  FileCheck,
  UserCheck
} from 'lucide-react';

export const BehaviorPortal: React.FC = () => {
  const { 
    activeChild, 
    activeTab, 
    setActiveTab, 
    language, 
    targets, 
    addSessionResult,
    saveSession,
    savedSessions,
    saveSessionPlan,
    bips,
    abcRecords,
    reinforcers,
    homeTasks,
    shareSoapNote,
    currentUserName,
    addTarget,
    updateTarget,
    deleteTarget,
    childrenList,
    setSelectedChildId,
    getSessionPlan,
    showNotification,
    triggerConfetti,
    sendMessage
  } = useApp();

  const isAr = language === 'ar';

  // Sub-view on Today tab: 'plan' | 'datasheet' | 'continuous' | 'interval' | 'other_measures'
  const [sessionSubView, setSessionSubView] = useState<DatasheetView | 'plan'>('datasheet');

  // Target add/edit modal: undefined = closed, null = new, Target = editing
  const [editingTarget, setEditingTarget] = useState<Target | null | undefined>(undefined);

  // Report & Share modal state
  const [showReportModal, setShowReportModal] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // SOAP Notes State matching client screenshot with pre-filled session & object-location data
  const [soapSubjective, setSoapSubjective] = useState(
    'Ahmed arrived alert, regulated and cooperative. Maintained calm demeanor and sustained joint attention during tabletop tasks.'
  );
  const [soapObjective, setSoapObjective] = useState(
    'Object-Location & Receptive Identification Task: 8/10 independent trials (80% accuracy). Latency: 1.8s avg. Touch target on table: 88% mastery. Frequency: 4 correct spontaneous mands. Rate: 0.4 resp/min. Cold Probe: 2/3 (+, +, -). Treatment Integrity: 95%.'
  );
  const [soapAssessment, setSoapAssessment] = useState(
    'Demonstrated steady acquisition on object-location spatial prepositions (in, on, under). Response persistence maintained under VR-3 schedule. Met criterion threshold for 3D items with fading gestural prompts.'
  );
  const [soapPlan, setSoapPlan] = useState(
    'Advance object-location tasks to 3-step spatial placements in natural settings. Fade gestural prompting to 4-second latency delay. Train caregivers on Differential Reinforcement of Alternative behavior (DRA) for home carryover.'
  );
  const [isAutoDrafting, setIsAutoDrafting] = useState(false);

  // Load configured plan for current child
  const currentPlan = getSessionPlan(activeChild.id, 'behavior');
  const selectedProcedures = currentPlan.procedureIds;
  const selectedMeasures = currentPlan.measureIds;

  // Active target for DTT session
  const behaviorTarget = targets.find(t => t.discipline === 'behavior' && t.childId === activeChild.id) || targets.find(t => t.discipline === 'behavior') || targets[0];

  // Previous scores for this child + target (oldest first) feed trials-to-criterion.
  const scoreHistory = savedSessions
    .filter(x => x.role === 'behavior' && x.childId === activeChild.id && x.targetId === behaviorTarget.id && x.summary.percentIndependent !== null && !x.notes.startsWith('[SOAP NOTE]'))
    .sort((x, y) => x.savedAt.localeCompare(y.savedAt))
    .map(x => x.summary.percentIndependent as number);

  // All live datasheet state (trials, timers, intervals, IOA, integrity...) lives in the hook.
  const ds = useBehaviorDatasheet(scoreHistory);
  const plan = { procedureIds: selectedProcedures, measureIds: selectedMeasures };
  const percentIndependent = ds.percentIndependent;
  const frequencyCount = ds.s.frequency;
  const currentPromptLevel = ds.s.promptLevel;

  // Notes state
  const [sessionNotes, setSessionNotes] = useState(
    'Leo participated actively in DTT trials for object identification. Responded well to verbal prompt fading on "shoe" and "cup". Mild vocal protest at trial 5 resolved with brief sensory break.'
  );

  const buildSessionPayload = (notes: string) => ({
    childId: activeChild.id,
    role: 'behavior' as const,
    therapistName: currentUserName,
    targetId: behaviorTarget.id,
    targetName: behaviorTarget.name,
    procedureIds: selectedProcedures,
    measureIds: selectedMeasures,
    data: ds.buildData(),
    summary: ds.buildSummary(plan),
    notes,
  });

  const handleSaveSession = () => {
    const summary = ds.buildSummary(plan);
    saveSession(buildSessionPayload(sessionNotes));

    if ((summary.percentIndependent ?? 0) >= 90) {
      triggerConfetti();
    }
    showNotification(
      summary.percentIndependent !== null
        ? isAr
          ? `تم حفظ ورقة البيانات بنجاح (${summary.percentIndependent}%). تم تحديث الأهداف والرسوم البيانية.`
          : `Datasheet saved! (${summary.percentIndependent}% independent). Targets & graphs updated.`
        : isAr
        ? 'تم حفظ ورقة البيانات بنجاح.'
        : 'Datasheet saved.'
    );
  };

  const handleAddMeasure = (id: string) => {
    if (selectedMeasures.includes(id)) return;
    saveSessionPlan(activeChild.id, 'behavior', selectedProcedures, [...selectedMeasures, id]);
    showNotification(isAr ? 'تمت إضافة القياس إلى الخطة وورقة البيانات.' : 'Measure added to your plan and datasheet.');
  };

  const planData = {
    childName: activeChild.name,
    bip: bips.find(b => b.childId === activeChild.id),
    abc: abcRecords.filter(r => r.childId === activeChild.id),
    reinforcers: reinforcers.filter(r => r.childId === activeChild.id),
    tasks: homeTasks.filter(h => h.childId === activeChild.id),
  };
  const abcSum = summarizeAbc(planData.abc);
  const taskSum = tasksSummary(planData.tasks);
  const topReinf = [...planData.reinforcers].sort((a, b) => b.preference - a.preference).slice(0, 3);
  const hasPlanData = !!planData.bip || planData.abc.length > 0 || planData.reinforcers.length > 0 || planData.tasks.length > 0;
  const [reportShare, setReportShare] = useState<'team' | 'supervisor' | null>(null);

  /** Full official report: datasheet numbers + every BIP-tab section that has data. */
  const buildReportText = () => {
    const ioa = ds.ioaPercent !== null && (ds.s.ioaOn || selectedMeasures.includes('ioa')) ? ds.ioaPercent + '%' : 'N/A';
    const head = `NEXIA BRIDGE CLINICAL SESSION REPORT
Child: ${activeChild.name} (${activeChild.age} yrs)
Clinician: ${currentUserName} (BCBA)
Target: ${behaviorTarget.name}
Performance: ${percentIndependent}% Independent (${ds.scoredCount} trials scored)
Prompt Level: ${currentPromptLevel}
Frequency Count: ${frequencyCount}
IOA Agreement: ${ioa}
Notes: ${sessionNotes}`;
    const plan = planSectionText(planData);
    return plan ? `${head}\n\n${plan}` : head;
  };

  const handleShareWithParents = () => {
    sendMessage(
      `Behavior Therapy Session Report: ${activeChild.name} achieved ${percentIndependent}% independent accuracy in DTT. ${sessionNotes}`,
      'Behavior Progress'
    );
    showNotification(
      isAr 
        ? 'تمت مشاركة تقرير الجلسة مع ولي الأمر وفريق الرعاية.' 
        : 'Session report shared with parents & care circle.'
    );
  };

  const handleCopyReport = () => {
    const reportText = buildReportText();

    try {
      navigator.clipboard.writeText(reportText);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2500);
      showNotification('Report copied to clipboard.');
    } catch {
      showNotification('Report text ready.');
    }
  };

  /* ---------------------------------------------------- */
  /* TAB 2: TARGETS (Library, operational defs, history)  */
  /* ---------------------------------------------------- */
  const renderTargetsTab = () => (
    <TargetsPanel
      isAr={isAr}
      targets={targets.filter(t => t.childId === activeChild.id && t.discipline === 'behavior')}
      sessions={savedSessions.filter(x => x.role === 'behavior' && x.childId === activeChild.id)}
      title={{ en: 'Active targets', ar: 'الأهداف العلاجية النشطة' }}
      subtitle={{ en: 'Operational definitions, lesson steps, and saved session history', ar: 'التعريفات الإجرائية وخطوات الدرس وسجل الجلسات المحفوظة' }}
      addLabel={{ en: 'Add target', ar: 'هدف جديد' }}
      noun={{ en: 'target', ar: 'هدف' }}
      onAdd={() => setEditingTarget(null)}
      onEdit={t => setEditingTarget(t)}
      onReport={() => setShowReportModal(true)}
    />
  );

  const renderGraphsTab = () => (
    <BehaviorGraphs
      isAr={isAr}
      targets={targets.filter(t => t.childId === activeChild.id && t.discipline === 'behavior')}
      sessions={savedSessions.filter(x => x.role === 'behavior' && x.childId === activeChild.id)}
      onReport={() => setShowReportModal(true)}
    />
  );

  const handleAutoDraftSoap = () => {
    setIsAutoDrafting(true);
    setTimeout(() => {
      setSoapSubjective(
        `${activeChild.name} arrived alert, well-regulated and cooperative. Maintained focused engagement and demonstrated calm demeanor during task demands.`
      );
      const parts: string[] = [];
      if (ds.isTrialGridActive(plan) && ds.scoredCount) {
        parts.push(`${behaviorTarget.name}: ${ds.percentIndependent}% independent (${ds.independentCount}/${ds.scoredCount} trials). Prompt level: ${ds.s.promptLevel}.`);
      }
      if (selectedMeasures.includes('latency') && ds.s.latencies.length) parts.push(`Response latency: ${ds.latencyMean.toFixed(1)}s avg.`);
      if (selectedMeasures.includes('irt') && ds.s.irts.length) parts.push(`Mean IRT: ${ds.irtMean.toFixed(1)}s.`);
      if (selectedMeasures.includes('frequency')) parts.push(`Frequency: ${ds.s.frequency}.`);
      if (selectedMeasures.includes('rate') && ds.s.rateSeconds > 0) parts.push(`Rate: ${ds.ratePerMinute.toFixed(1)} resp/min.`);
      if (selectedMeasures.includes('duration') && ds.s.durationEpisodes.length) parts.push(`Mean duration: ${Math.round(ds.durationMean)}s over ${ds.s.durationEpisodes.length} episodes.`);
      if (selectedMeasures.includes('partial_interval')) parts.push(`Partial-interval: ${ds.partialYes}/${ds.s.partial.length}.`);
      if (selectedMeasures.includes('whole_interval')) parts.push(`Whole-interval: ${ds.wholeYes}/${ds.s.whole.length}.`);
      if (selectedMeasures.includes('mts') && ds.mtsScored) parts.push(`MTS: ${ds.mtsYes}/${ds.mtsScored} samples.`);
      if (selectedMeasures.includes('percentage') && ds.pctTotal) parts.push(`Percentage correct: ${ds.percentage}% (${ds.s.pctCorrect}/${ds.pctTotal}).`);
      if (selectedMeasures.includes('cold_probe') && ds.coldScored) parts.push(`Cold probe: ${ds.coldCorrect}/${ds.coldScored}.`);
      if (selectedMeasures.includes('accuracy') && ds.accuracyTotal) parts.push(`Accuracy: ${ds.accuracyPercent}%.`);
      if ((ds.s.ioaOn || selectedMeasures.includes('ioa')) && ds.ioaPercent !== null) parts.push(`IOA agreement: ${ds.ioaPercent}%.`);
      if (selectedMeasures.includes('treatment_integrity') && ds.integrityPercent !== null) parts.push(`Treatment integrity: ${ds.integrityPercent}%.`);
      setSoapObjective(parts.length ? parts.join(' ') : 'No datasheet measures recorded yet for this session.');
      setSoapAssessment(
        `Robust receptive acquisition observed on object-location tasks. ${activeChild.name} demonstrated steady progress in spatial preposition discernment (in, on, under) with fading gestural prompts on VR-3 reinforcement schedule.`
      );
      setSoapPlan(
        'Advance object-location targets to 3-step spatial placements in natural therapy and classroom settings. Fade gestural prompting to 4-second latency delay. Train caregivers on Differential Reinforcement of Alternative behavior (DRA) for home carryover.'
      );
      setIsAutoDrafting(false);
      showNotification(isAr ? 'تم إنشاء المسودة الإكلينيكية تلقائياً من بيانات الجلسة السلوكية' : 'Clinical SOAP notes auto-synthesized from latest behavior & object-location metrics!');
    }, 400);
  };

  const handleSaveSoapNote = () => {
    saveSession(buildSessionPayload(`[SOAP NOTE]\nS: ${soapSubjective}\nO: ${soapObjective}\nA: ${soapAssessment}\nP: ${soapPlan}`));

    triggerConfetti();
    showNotification(
      isAr 
        ? 'تم حفظ واعتماد ملاحظات SOAP السلوكية الإكلينيكية الرسمية في سجل الطفل' 
        : 'Official Clinical SOAP Note successfully saved and timestamped to child record.'
    );
  };

  /* ---------------------------------------------------- */
  /* TAB 4: NOTES (Session SOAP Notes with Dedicated Mics)*/
  /* ---------------------------------------------------- */
  const renderNotesTab = () => (
    <div className="space-y-4 pb-28 animate-in fade-in">
      {/* Reusable Clinical SOAP Note Card with Dedicated Mics on S, O, A, P */}
      <SoapNoteCard
        role="behavior"
        childName={activeChild.name}
        language={language as 'en' | 'ar'}
        soapSubjective={soapSubjective}
        setSoapSubjective={setSoapSubjective}
        soapObjective={soapObjective}
        setSoapObjective={setSoapObjective}
        soapAssessment={soapAssessment}
        setSoapAssessment={setSoapAssessment}
        soapPlan={soapPlan}
        setSoapPlan={setSoapPlan}
        onAutoDraft={handleAutoDraftSoap}
        isAutoDrafting={isAutoDrafting}
        onSaveNote={handleSaveSoapNote}
      />

      {/* Action Bar for Clinical Export */}
      <div className="flex items-center pt-1">
        <button
          onClick={() => setShowReportModal(true)}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1F1B3A] border border-[#0F766E] text-xs font-semibold text-[#0F766E] hover:bg-teal-50 dark:hover:bg-teal-950/40 transition flex items-center gap-1.5 shadow-xs"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{isAr ? 'تصدير التقرير الرسمي' : 'Export Official Clinical Report'}</span>
        </button>

      </div>
      <SoapArchive
        sessions={savedSessions.filter(s => s.role === 'behavior' && s.childId === activeChild.id)}
        childName={activeChild.name}
        language={language as 'en' | 'ar'}
        title={isAr ? 'أرشيف جلسات السلوك المعتمدة' : 'Official Behavior SOAP Notes Archive'}
        credential="Certified BCBA"
      />
    </div>
  );

  /* ---------------------------------------------------- */
  /* CLINICAL REPORT & SHARE MODAL                        */
  /* ---------------------------------------------------- */
  const renderReportModal = () => (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#1F1B3A] rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-float border border-[#E8E2D9] dark:border-[#38325E] p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F766E] dark:text-teal-300 bg-teal-50 dark:bg-teal-950 px-2.5 py-0.5 rounded-full border border-teal-200">
              {isAr ? 'تقرير إكلينيكي رسمي' : 'Official Clinical Session Report'}
            </span>
            <h3 className="font-heading font-bold text-lg text-[#1F1B3A] dark:text-white mt-1">
              Nexia Bridge · Behavior Intervention Report
            </h3>
          </div>
          <button 
            onClick={() => setShowReportModal(false)}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Child & Therapist Details */}
        <div className="grid grid-cols-2 gap-3 text-xs p-3.5 bg-[#FAF6F0] dark:bg-[#252044] rounded-2xl border border-[#E8E2D9] dark:border-[#38325E]">
          <div>
            <span className="text-[#6B6785] block">{isAr ? 'الطفل:' : 'Child:'}</span>
            <span className="font-bold text-[#1F1B3A] dark:text-white">{activeChild.name} ({activeChild.age} yrs)</span>
            <span className="text-[10px] text-[#6B6785] block">{activeChild.diagnosis}</span>
          </div>
          <div>
            <span className="text-[#6B6785] block">{isAr ? 'الأخصائي المعالج:' : 'Therapist (BCBA):'}</span>
            <span className="font-bold text-[#1F1B3A] dark:text-white">Dr. Tareq Hassan</span>
            <span className="text-[10px] text-[#0F766E] font-medium block">Board Certified Behavior Analyst</span>
          </div>
        </div>

        {/* Acquisition Target & Performance Summary */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#1F1B3A] dark:text-white uppercase tracking-wider">
            {isAr ? 'أداء الهدف الإكلينيكي المكتسب' : 'Acquisition Target & Performance'}
          </h4>
          <div className="p-4 rounded-2xl border border-teal-200 dark:border-teal-800 bg-[#F0FAF7] dark:bg-[#1C2C28] flex items-center justify-between">
            <div>
              <span className="font-bold text-sm text-[#1F1B3A] dark:text-white block">{behaviorTarget.name}</span>
              <span className="text-xs text-[#5C706C] dark:text-gray-300">
                {ds.independentCount}/{ds.scoredCount} {isAr ? 'محاولات مستقلة' : 'trials independent'} · {currentPromptLevel} {isAr ? 'مستوى التلقين' : 'prompt level'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-[#0F766E] dark:text-teal-300 block">{percentIndependent}%</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${percentIndependent >= 90 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {percentIndependent >= 90 ? 'Mastery Met' : 'In Progress'}
              </span>
            </div>
          </div>
        </div>

        {/* Behavioral Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <span className="text-[10px] text-[#6B6785] block">{isAr ? 'التكرار (العدد)' : 'Frequency'}</span>
            <span className="text-lg font-bold text-[#1F1B3A] dark:text-white">{frequencyCount}</span>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <span className="text-[10px] text-[#6B6785] block">{isAr ? 'المعدل/دقيقة' : 'Rate/min'}</span>
            <span className="text-lg font-bold text-[#1F1B3A] dark:text-white">
              {ds.ratePerMinute.toFixed(1)}
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
            <span className="text-[10px] text-[#6B6785] block">{isAr ? 'اتفاق الملاحظين' : 'IOA Agreement'}</span>
            <span className="text-lg font-bold text-[#0F766E]">{ds.ioaPercent !== null ? `${ds.ioaPercent}%` : '—'}</span>
          </div>
        </div>

        {/* Behavior plan: BIP, ABC function, reinforcers, home practice */}
        {hasPlanData && (
          <div className="space-y-2" data-testid="report-plan-section">
            <h4 className="text-xs font-bold text-[#1F1B3A] dark:text-white uppercase tracking-wider">{isAr ? 'خطة السلوك' : 'Behavior plan'}</h4>
            <div className="rounded-2xl border border-[#E8E2D9] dark:border-[#38325E] divide-y divide-[#EDE8DF] dark:divide-[#38325E] text-xs">
              {planData.bip && (
                <div className="p-3 space-y-0.5">
                  <p className="font-bold">{isAr ? 'خطة التدخل السلوكي' : 'BIP'} v{planData.bip.version} · {planData.bip.status}</p>
                  <p dir="auto">{planData.bip.targetBehavior}{planData.bip.hypothesizedFunction ? ` — ${FUNCTION_NAME[planData.bip.hypothesizedFunction]}` : ''}</p>
                  <p className="text-[#5C706C]" dir="auto">{isAr ? 'السلوك البديل' : 'Replacement'}: {planData.bip.replacementBehavior}</p>
                </div>
              )}
              {planData.abc.length > 0 && (
                <div className="p-3">
                  <p className="font-bold">{isAr ? 'ABC والوظيفة' : 'ABC & function'}</p>
                  <p>{abcSum.total} {isAr ? 'حدث' : 'events'} · {isAr ? 'متوسط الشدة' : 'avg intensity'} {abcSum.avgIntensity.toFixed(1)}/3 · {abcSum.conclusive && abcSum.topFunction ? `${FUNCTION_NAME[abcSum.topFunction]} (${Math.round(abcSum.topShare * 100)}%)` : (isAr ? 'الوظيفة غير حاسمة' : 'function inconclusive')}</p>
                </div>
              )}
              {topReinf.length > 0 && (
                <div className="p-3">
                  <p className="font-bold">{isAr ? 'أعلى المعززات' : 'Top reinforcers'}</p>
                  <p dir="auto">{topReinf.map(r => `${r.name} (${r.preference}/5)`).join(' · ')}</p>
                </div>
              )}
              {taskSum.total > 0 && (
                <div className="p-3">
                  <p className="font-bold">{isAr ? 'التدريب المنزلي' : 'Home practice'}</p>
                  <p>{taskSum.done} {isAr ? 'من' : 'of'} {taskSum.total} {isAr ? 'مهام مكتملة' : 'tasks completed'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applied Procedures Tag Cloud */}
        <div>
          <span className="text-xs font-bold text-[#1F1B3A] dark:text-white block mb-1.5">
            {isAr ? 'الإجراءات المنفذة في هذه الجلسة:' : 'Clinical Procedures Delivered:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {selectedProcedures.map(p => (
              <span key={p} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-[11px] font-medium text-gray-700 dark:text-gray-300 rounded-md">
                ✓ {procedureName(p, isAr)}
              </span>
            ))}
          </div>
        </div>

        {/* Therapist Narrative Note */}
        <div>
          <span className="text-xs font-bold text-[#1F1B3A] dark:text-white block mb-1">
            {isAr ? 'ملاحظات الأخصائي الإكلينيكية والتوصيات:' : 'Therapist Notes & Recommendations:'}
          </span>
          <p className="text-xs text-[#5C706C] dark:text-gray-300 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 leading-relaxed border border-gray-100 dark:border-gray-700">
            {sessionNotes}
          </p>
        </div>

        {/* Share & Export Action Grid */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            {/* Share to Parents */}
            <button
              onClick={() => setReportShare('team')}
              className="py-3 px-3 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isAr ? 'إرسال إلى ولي الأمر' : 'Send to parents'}</span>
            </button>

            {/* Submit to Supervisor */}
            <button
              onClick={() => {
                shareSoapNote(['contact-circle'], { text: buildReportText(), childName: activeChild.name, authorName: currentUserName, authorRole: 'behavior', tag: 'Report for sign-off' });
              }}
              className="py-3 px-3 rounded-xl bg-white dark:bg-[#1F1B3A] border border-[#0F766E] text-[#0F766E] dark:text-teal-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-teal-50 transition active:scale-95"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>{isAr ? 'إرسال للمشرف' : 'Submit to Care Circle'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Print / Export PDF */}
            <button
              onClick={() => window.print()}
              className="py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              <span>{isAr ? 'طباعة / تصدير PDF' : 'Print / Export PDF'}</span>
            </button>

            {/* Copy Summary */}
            <button
              onClick={handleCopyReport}
              className="py-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
              <span>{copiedReport ? (isAr ? 'تم النسخ!' : 'Copied!') : (isAr ? 'نسخ النص' : 'Copy Text')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md md:max-w-6xl mx-auto px-4 md:px-8 pt-3 md:pt-6">
      {activeTab.toLowerCase() === 'today' && (
        sessionSubView === 'plan' ? (
          <SessionPlanner 
            role="behavior" 
            onSaved={() => setSessionSubView('datasheet')} 
          />
        ) :
        (
          <BehaviorDatasheetViews
            ds={ds}
            plan={plan}
            isAr={isAr}
            view={sessionSubView}
            setView={setSessionSubView}
            childName={activeChild.name}
            childrenList={childrenList}
            activeChildId={activeChild.id}
            onChildChange={setSelectedChildId}
            targetName={behaviorTarget.name}
            onEditPlan={() => setSessionSubView('plan')}
            onOpenReport={() => setShowReportModal(true)}
            onSave={handleSaveSession}
            onAddMeasure={handleAddMeasure}
            notify={showNotification}
          />
        )
      )}
      {activeTab.toLowerCase() === 'targets' && renderTargetsTab()}
      {activeTab.toLowerCase() === 'graphs' && renderGraphsTab()}
      {activeTab.toLowerCase() === 'bip' && <BipPortal />}
      {activeTab.toLowerCase() === 'notes' && renderNotesTab()}
      {activeTab.toLowerCase() === 'family' && <FamilyPanel />}

      {editingTarget !== undefined && (
        <TargetEditorModal
          isAr={isAr}
          target={editingTarget}
          childName={activeChild.name}
          onClose={() => setEditingTarget(undefined)}
          onDelete={editingTarget ? () => { deleteTarget(editingTarget.id); setEditingTarget(undefined); } : undefined}
          onSave={(v) => {
            const criterion = `${v.criterionThreshold}% across ${v.sessionsRequired} sessions`;
            if (editingTarget) {
              updateTarget(editingTarget.id, {
                name: v.name, domain: v.domain, operationalDefinition: v.operationalDefinition,
                procedureSteps: v.procedureSteps, materials: v.materials, criterionThreshold: v.criterionThreshold,
                masteryCriterion: criterion, baseline: v.baseline, status: v.status,
              });
            } else {
              addTarget({
                childId: activeChild.id, discipline: 'behavior', name: v.name, domain: v.domain,
                operationalDefinition: v.operationalDefinition, procedureSteps: v.procedureSteps, materials: v.materials,
                masteryCriterion: criterion, criterionThreshold: v.criterionThreshold, baseline: v.baseline,
                status: v.status, therapistName: currentUserName,
              });
            }
            setEditingTarget(undefined);
          }}
        />
      )}

      {/* Render Report & Share Modal */}
      {showReportModal && renderReportModal()}

      {reportShare && (
        <ShareToTeamModal
          role="behavior"
          isAr={isAr}
          title={isAr ? 'إرسال التقرير داخل التطبيق' : 'Send report inside the app'}
          subtitle={`${activeChild.name} · ${behaviorTarget.name}`}
          text={buildReportText()}
          tag="Session Report"
          childName={activeChild.name}
          authorName={currentUserName}
          onClose={() => setReportShare(null)}
        />
      )}

    </div>
  );
};
