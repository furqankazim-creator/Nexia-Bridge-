import React, { useEffect, useRef, useState } from 'react';
import { Award, Camera, ChevronDown, Check, Minus, Pause, Play, Plus, Save, Share2, Sliders } from 'lucide-react';
import { procedureName, measureName, PLAN_CONFIG } from '../../data/planConfig';
import { downscaleImage } from '../../utils/image';
import { useSupervisorFeedback } from '../common/SupervisorFeedbackCard';
import { suggestMorphemes } from '../../utils/morphemes';
import { brownStage, morphemeBuckets } from '../../utils/mlu';
import { AacPad } from '../speech/AacPad';
import type { TherapyRole } from '../../types';
import {
  BehaviorDatasheet,
  CUE_LEVELS,
  MASTERY_CRITERION,
  MASTERY_SESSIONS,
  PROMPT_LEVELS,
  PlanLike,
  ProbeKind,
  TrialResult,
} from '../../hooks/useBehaviorDatasheet';

export type DatasheetView = 'datasheet' | 'continuous' | 'interval' | 'other_measures' | 'other_measures_2' | 'speech_measures' | 'remedial_measures';

/** Which measures live on which datasheet page (PDF pages 6-9), in display order. */
export const MEASURE_GROUPS: Record<Exclude<DatasheetView, 'datasheet'>, string[]> = {
  continuous: ['frequency', 'rate', 'duration', 'latency', 'irt'],
  interval: ['partial_interval', 'whole_interval', 'mts'],
  other_measures: ['permanent_product', 'percentage', 'trials_to_crit', 'trial_by_trial', 'cold_probe'],
  other_measures_2: ['accuracy', 'baseline', 'ioa', 'treatment_integrity'],
  speech_measures: ['cueing_level', 'mlu', 'aac_core'],
  remedial_measures: ['wcpm', 'digits_pm', 'correct_incorrect_pm', 'error_analysis', 'writing_rubric', 'work_sample'],
};

const CORE_WORDS: [string, string][] = [
  ['want', 'أريد'], ['more', 'أكثر'], ['go', 'اذهب'], ['stop', 'توقف'], ['help', 'ساعدني'], ['like', 'أحب'],
  ['all done', 'انتهيت'], ['yes', 'نعم'], ['no', 'لا'], ['my turn', 'دوري'], ['look', 'انظر'], ['eat', 'آكل'],
];

interface Props {
  /** Which therapist's datasheet this is. Decides labels and which measures the plan offers. */
  role?: TherapyRole;
  ds: BehaviorDatasheet;
  plan: PlanLike;
  isAr: boolean;
  view: DatasheetView;
  setView: (v: DatasheetView) => void;
  childName: string;
  childrenList: { id: string; name: string }[];
  activeChildId: string;
  onChildChange: (id: string) => void;
  targetName: string;
  onEditPlan: () => void;
  onOpenReport: () => void;
  onSave: () => void;
  onAddMeasure: (id: string) => void;
  notify: (msg: string) => void;
  /** Extra content shown just above the Save button (e.g. decision support, add-goal shortcuts). */
  beforeSave?: React.ReactNode;
}

/* ---------- small building blocks ---------- */

const CARD =
  'bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3';
const BTN_PRIMARY =
  'py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] text-white text-sm font-bold active:scale-95 transition disabled:opacity-50';
const BTN_GHOST =
  'py-2.5 px-4 rounded-xl border-[1.5px] border-[#0F766E] text-[#0F766E] dark:text-teal-300 dark:border-teal-700 text-sm font-semibold bg-white dark:bg-transparent hover:bg-teal-50 dark:hover:bg-teal-950/40 active:scale-95 transition disabled:opacity-50';
const ROW = 'flex items-center justify-between text-sm py-2 border-b border-[#EDE8DF] dark:border-[#38325E] last:border-b-0';

const Card: React.FC<{ title: string; subtitle?: React.ReactNode; eyebrow?: string; children?: React.ReactNode }> = ({
  title,
  subtitle,
  eyebrow,
  children,
}) => (
  <section className={CARD}>
    <div>
      {eyebrow && (
        <span className="text-[11px] font-semibold text-[#0F766E] dark:text-teal-400 block mb-0.5">{eyebrow}</span>
      )}
      <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{title}</h3>
      {subtitle && <p className="text-xs text-[#5C706C] dark:text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </section>
);

const Stepper: React.FC<{ value: number; onChange: (v: number) => void; min?: number; max?: number; label: string }> = ({
  value,
  onChange,
  min = 0,
  max = 999,
  label,
}) => (
  <div className="flex items-center gap-2">
    <button
      type="button"
      aria-label={`${label} −1`}
      onClick={() => onChange(Math.max(min, value - 1))}
      className="w-7 h-7 rounded-lg border border-[#DCE3E1] dark:border-[#38325E] flex items-center justify-center text-[#5C706C] hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95"
    >
      <Minus className="w-3.5 h-3.5" />
    </button>
    <span className="w-6 text-center font-bold tabular-nums text-sm">{value}</span>
    <button
      type="button"
      aria-label={`${label} +1`}
      onClick={() => onChange(Math.min(max, value + 1))}
      className="w-7 h-7 rounded-lg border border-[#DCE3E1] dark:border-[#38325E] flex items-center justify-center text-[#0F766E] hover:bg-teal-50 dark:hover:bg-teal-950/40 active:scale-95"
    >
      <Plus className="w-3.5 h-3.5" />
    </button>
  </div>
);

const fmtClock = (sec: number) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, '0')}`;
const fmtClock2 = (sec: number) => `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

const YesNoCell: React.FC<{ n: number; state: 'Yes' | 'No' | null; onClick: () => void }> = ({ n, state, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 rounded-xl border-[1.5px] transition active:scale-95 ${
      state === 'Yes'
        ? 'bg-[#DDF5EA] dark:bg-emerald-950/60 border-emerald-500 text-[#0B6B47] dark:text-emerald-300'
        : state === 'No'
        ? 'bg-[#F1F3F2] dark:bg-gray-800 border-gray-400 text-gray-700 dark:text-gray-300'
        : 'bg-white dark:bg-[#1F1B3A] border-[#DCE3E1] dark:border-[#38325E] text-gray-400'
    }`}
  >
    <span className="text-[11px] text-[#5C706C]">{n}</span>
    <span className="text-sm font-bold">{state ?? ''}</span>
  </button>
);

/* ---------- timed fluency probe (words / digits / correct-and-incorrect per minute) ---------- */

const PROBE_TEXT: Record<ProbeKind, { en: string; ar: string; subEn: string; subAr: string }> = {
  wcpm: { en: 'Words correct per minute', ar: 'الكلمات الصحيحة في الدقيقة', subEn: 'Count correct and incorrect words in a timed reading', subAr: 'عدّ الكلمات الصحيحة وغير الصحيحة في قراءة موقوتة' },
  digits_pm: { en: 'Digits correct per minute', ar: 'الأرقام الصحيحة في الدقيقة', subEn: 'Count correct and incorrect digits in a timed math probe', subAr: 'عدّ الأرقام الصحيحة وغير الصحيحة في اختبار حساب موقوت' },
  correct_incorrect_pm: { en: 'Correct and incorrect per minute', ar: 'الصحيح وغير الصحيح في الدقيقة', subEn: 'Both rates from one timed probe', subAr: 'المعدلان من اختبار موقوت واحد' },
};

const FluencyProbeCard: React.FC<{ kind: ProbeKind; ds: BehaviorDatasheet; isAr: boolean }> = ({ kind, ds, isAr }) => {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const x = PROBE_TEXT[kind];
  const [correct, setCorrect] = useState(0);
  const [incorrect, setIncorrect] = useState(0);
  const [seconds, setSeconds] = useState(60);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const commitRef = useRef<(secs: number) => void>(() => undefined);

  const commit = (secs: number) => {
    if (correct === 0 && incorrect === 0) {
      setRunning(false);
      setElapsed(0);
      return;
    }
    ds.set((p) => ({ probes: [...p.probes, { kind, correct, incorrect, seconds: Math.max(1, secs) }] }));
    setCorrect(0);
    setIncorrect(0);
    setElapsed(0);
    setRunning(false);
  };
  commitRef.current = commit;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (running && elapsed >= seconds) commitRef.current(seconds);
  }, [running, elapsed, seconds]);

  const mine = ds.s.probes.map((p, i) => ({ p, i })).filter(({ p }) => p.kind === kind);
  const meanC = ds.probeRate(kind, 'correct');
  const meanI = ds.probeRate(kind, 'incorrect');

  return (
    <Card title={t(x.en, x.ar)} subtitle={t(x.subEn, x.subAr)}>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-[#DDF5EA] dark:bg-emerald-950/50 p-3 text-center">
          <span className="text-[11px] font-bold text-[#1B9E6B] block">{t('Correct', 'صحيح')}</span>
          <span className="text-3xl font-bold font-heading tabular-nums">{correct}</span>
          <button type="button" onClick={() => setCorrect((c) => c + 1)} className={`${BTN_PRIMARY} w-full mt-2 !py-2`} aria-label={`${t('Correct', 'صحيح')} +1`}>+1</button>
        </div>
        <div className="rounded-2xl bg-[#FDE3E4] dark:bg-rose-950/50 p-3 text-center">
          <span className="text-[11px] font-bold text-[#D63B3B] block">{t('Incorrect', 'غير صحيح')}</span>
          <span className="text-3xl font-bold font-heading tabular-nums">{incorrect}</span>
          <button type="button" onClick={() => setIncorrect((c) => c + 1)} className={`${BTN_GHOST} w-full mt-2 !py-2`} aria-label={`${t('Incorrect', 'غير صحيح')} +1`}>+1</button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select aria-label={t('Probe length', 'مدة الاختبار')} value={seconds} disabled={running} onChange={(e) => setSeconds(Number(e.target.value))} className="text-sm px-3 py-2 rounded-xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent">
          {[30, 60, 120].map((n) => <option key={n} value={n}>{n} s</option>)}
        </select>
        {running ? (
          <button type="button" onClick={() => commit(elapsed)} className={`${BTN_GHOST} flex-1`}>{t('Stop and save', 'إيقاف وحفظ')} · {fmtClock(Math.max(0, seconds - elapsed))}</button>
        ) : (
          <>
            <button type="button" onClick={() => { setElapsed(0); setRunning(true); }} className={`${BTN_PRIMARY} flex-1`}>{t('Start timer', 'بدء المؤقت')}</button>
            <button type="button" onClick={() => commit(seconds)} disabled={correct === 0 && incorrect === 0} className={BTN_GHOST}>{t('Save probe', 'حفظ')}</button>
          </>
        )}
      </div>
      <div>
        {mine.map(({ p, i }) => (
          <div key={i} className={ROW}>
            <span>{p.correct} {t('correct', 'صحيح')} · {p.incorrect} {t('incorrect', 'خطأ')} · {fmtClock(p.seconds)}</span>
            <span className="flex items-center gap-2">
              <b className="tabular-nums">{(p.correct / (p.seconds / 60)).toFixed(1)}/min</b>
              <button type="button" aria-label={t('Remove probe', 'حذف')} onClick={() => ds.set((st) => ({ probes: st.probes.filter((_, idx) => idx !== i) }))} className="text-[#9AA7A4] hover:text-rose-600 text-lg leading-none px-1">×</button>
            </span>
          </div>
        ))}
        {mine.length > 0 && (
          <div className={ROW}>
            <span>{t('Overall', 'الإجمالي')}</span>
            <b className="tabular-nums">{meanC!.toFixed(1)} {t('correct', 'صحيح')}{kind === 'correct_incorrect_pm' ? ` · ${meanI!.toFixed(1)} ${t('incorrect', 'خطأ')}` : ''} /min</b>
          </div>
        )}
        {mine.length === 0 && <p className="text-xs text-[#5C706C]">{t('No probes yet.', 'لا توجد اختبارات بعد.')}</p>}
      </div>
    </Card>
  );
};

/* ---------- the datasheet ---------- */

export const BehaviorDatasheetViews: React.FC<Props> = ({
  role = 'behavior',
  ds,
  plan,
  isAr,
  view,
  setView,
  childName,
  childrenList,
  activeChildId,
  onChildChange,
  targetName,
  onEditPlan,
  onOpenReport,
  onSave,
  onAddMeasure,
  notify,
  beforeSave,
}) => {
  const { s, set } = ds;
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const feedbackCount = useSupervisorFeedback().total;
  const has = (id: string) => plan.measureIds.includes(id);
  // Only measures this role's planner offers appear on the pages (the PDF shows different lists per role).
  const allowed = new Set(PLAN_CONFIG[role].measureSections.flatMap((sec) => sec.items.map((m) => m.id)));
  const groupIds = (g: keyof typeof MEASURE_GROUPS) => MEASURE_GROUPS[g].filter((id) => allowed.has(id));
  const [utt, setUtt] = useState('');
  const [aacSpont, setAacSpont] = useState(true);
  const [errName, setErrName] = useState('');
  const [rubName, setRubName] = useState('');
  const [sampleCaption, setSampleCaption] = useState('');
  const sampleFile = useRef<HTMLInputElement>(null);
  const [childMenuOpen, setChildMenuOpen] = useState(false);
  const [baselineInput, setBaselineInput] = useState('');
  const [newStep, setNewStep] = useState('');
  const [newError, setNewError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const trialGrid = ds.isTrialGridActive(plan);
  const sampleNote = ds.isSample ? t('Sample data shown.', 'تظهر بيانات تجريبية.') : t('Recording live data.', 'تسجيل بيانات مباشرة.');

  /* ----- trial grid (shared by the main DTT card and "Trial-by-trial recording") ----- */
  const cycleTrial = (i: number) =>
    set((p) => {
      const cur = p.trials[i];
      const next: TrialResult = cur === null ? '+' : cur === '+' ? 'P' : cur === 'P' ? '-' : null;
      return { trials: p.trials.map((x, idx) => (idx === i ? next : x)) };
    });

  const TrialGrid = (
    <>
      <div className="grid grid-cols-5 gap-2.5">
        {s.trials.map((res, i) => {
          const cls =
            res === '+'
              ? 'bg-[#DDF5EA] dark:bg-emerald-950/60 border-emerald-500 text-[#1B9E6B] dark:text-emerald-300'
              : res === 'P'
              ? 'bg-[#FFF1CC] dark:bg-amber-950/60 border-amber-500 text-[#B7791F] dark:text-amber-300'
              : res === '-'
              ? 'bg-[#FDE3E4] dark:bg-rose-950/60 border-rose-500 text-[#D63B3B] dark:text-rose-300'
              : 'bg-white dark:bg-[#1F1B3A] border-[#0F766E]/60 text-[#0F766E]';
          return (
            <button
              key={i}
              type="button"
              onClick={() => cycleTrial(i)}
              aria-label={`${t('Trial', 'محاولة')} ${i + 1}`}
              className={`flex flex-col items-center justify-center py-2.5 rounded-2xl border-[1.5px] font-bold transition active:scale-95 ${cls}`}
            >
              <span className="text-[11px] font-medium text-[#5C706C] dark:text-[#8E8AAB]">{i + 1}</span>
              <span className="text-lg leading-tight">{res === '-' ? '−' : res ?? '…'}</span>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-[#5C706C] dark:text-gray-400">
        + {t('independent', 'مستقل')} · P {t('prompted', 'بتلقين')} · − {t('incorrect', 'غير صحيح')}
      </p>
    </>
  );

  /* ----- measure cards ----- */
  const renderMeasure = (id: string, main: boolean): React.ReactNode => {
    switch (id) {
      case 'frequency': {
        const def = s.definition.definition || s.definition.name;
        return (
          <Card
            key={id}
            title={main ? t('Frequency', 'التكرار') : t('Frequency (count)', 'التكرار (العدد)')}
            subtitle={
              main ? (
                <button type="button" onClick={() => setView('other_measures_2')} className="text-start">
                  {def ? def : t('[Operational definition of the behavior]', '[التعريف الإجرائي للسلوك]')}
                </button>
              ) : (
                t('Count each time the behavior occurs', 'سجّل كل مرة يحدث فيها السلوك')
              )
            }
          >
            <div className="flex items-center gap-3">
              <div className="min-w-[56px]">
                <span className="text-4xl font-bold font-heading text-[#0F2A27] dark:text-white tabular-nums">{s.frequency}</span>
                {!main && <span className="text-xs text-[#5C706C] ms-1.5">{t('occurrences', 'مرات')}</span>}
              </div>
              <button type="button" onClick={() => set((p) => ({ frequency: p.frequency + 1 }))} className={`${BTN_PRIMARY} flex-1 text-base py-3.5`}>
                +1
              </button>
              <button type="button" onClick={() => set((p) => ({ frequency: Math.max(0, p.frequency - 1) }))} className={BTN_GHOST}>
                {t('Undo', 'تراجع')}
              </button>
            </div>
          </Card>
        );
      }

      case 'rate':
        return (
          <Card key={id} title={t('Rate', 'المعدل')} subtitle={t('Count divided by observation time', 'العدد مقسوماً على زمن الملاحظة')}>
            <div>
              <span className="text-4xl font-bold font-heading text-[#0F2A27] dark:text-white tabular-nums">{ds.ratePerMinute.toFixed(2)}</span>
              <span className="text-xs text-[#5C706C] ms-1.5">{t('per minute', 'في الدقيقة')}</span>
            </div>
            <div>
              <div className={ROW}>
                <span>{t('Responses', 'الاستجابات')}</span>
                <b className="tabular-nums">{s.rateResponses}</b>
              </div>
              <div className={ROW}>
                <span>{t('Observation time', 'زمن الملاحظة')}</span>
                <b className="tabular-nums">{fmtClock(s.rateSeconds)} min</b>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => set((p) => ({ rateResponses: p.rateResponses + 1 }))} className={BTN_PRIMARY}>
                +1
              </button>
              <button type="button" onClick={() => set((p) => ({ rateRunning: !p.rateRunning }))} className={BTN_GHOST}>
                {s.rateRunning ? t('Pause', 'إيقاف مؤقت') : t('Start', 'بدء')}
              </button>
            </div>
          </Card>
        );

      case 'duration':
        return (
          <Card key={id} title={t('Duration', 'المدة')} subtitle={t('Time from start to end of each episode', 'الوقت من بداية كل نوبة إلى نهايتها')}>
            <div>
              <span className="text-4xl font-bold font-heading text-[#0F2A27] dark:text-white tabular-nums">{fmtClock2(s.durationCurrent)}</span>
              <span className="text-xs text-[#5C706C] ms-1.5">{t('current episode', 'النوبة الحالية')}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => set({ durationRunning: true })} disabled={s.durationRunning} className={`${BTN_PRIMARY} flex items-center justify-center gap-1.5`}>
                <Play className="w-4 h-4 fill-current" /> {t('Start', 'بدء')}
              </button>
              <button
                type="button"
                disabled={!s.durationRunning && s.durationCurrent === 0}
                onClick={() =>
                  set((p) => ({
                    durationRunning: false,
                    durationEpisodes: p.durationCurrent > 0 ? [...p.durationEpisodes, p.durationCurrent] : p.durationEpisodes,
                    durationCurrent: 0,
                  }))
                }
                className={`${BTN_GHOST} flex items-center justify-center gap-1.5`}
              >
                <Pause className="w-4 h-4" /> {t('Stop', 'إيقاف')}
              </button>
            </div>
            <div>
              {s.durationEpisodes.map((sec, i) => (
                <div key={i} className={ROW}>
                  <span>{t('Episode', 'النوبة')} {i + 1}</span>
                  <b className="tabular-nums">{fmtClock(sec)}</b>
                </div>
              ))}
              <div className={ROW}>
                <span>{t('Total · Mean', 'المجموع · المتوسط')}</span>
                <b className="tabular-nums">{fmtClock(ds.durationTotal)} · {fmtClock(ds.durationMean)}</b>
              </div>
            </div>
          </Card>
        );

      case 'latency': {
        const running = s.latencyStartedAt !== null;
        return (
          <Card key={id} title={t('Latency', 'زمن الاستجابة (Latency)')} subtitle={t('Time from the instruction to the response', 'الوقت من التعليمات إلى الاستجابة')}>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => set({ latencyStartedAt: Date.now() })} disabled={running} className={BTN_PRIMARY}>
                {running ? `${ds.latencyLive.toFixed(1)} s…` : t('Instruction given', 'إعطاء التعليمات')}
              </button>
              <button
                type="button"
                disabled={!running}
                onClick={() =>
                  set((p) => ({
                    latencies: [...p.latencies, Number(((Date.now() - (p.latencyStartedAt ?? Date.now())) / 1000).toFixed(1))],
                    latencyStartedAt: null,
                  }))
                }
                className={BTN_GHOST}
              >
                {t('Response', 'الاستجابة')}
              </button>
            </div>
            <div>
              {s.latencies.map((sec, i) => (
                <div key={i} className={ROW}>
                  <span>{t('Trial', 'محاولة')} {i + 1}</span>
                  <b className="tabular-nums">{sec} s</b>
                </div>
              ))}
              <div className={ROW}>
                <span>{t('Mean', 'المتوسط')}</span>
                <b className="tabular-nums">{ds.latencyMean.toFixed(1)} s</b>
              </div>
            </div>
            {s.latencies.length > 0 && (
              <button type="button" onClick={() => set((p) => ({ latencies: p.latencies.slice(0, -1) }))} className="text-xs text-[#5C706C] underline">
                {t('Undo last trial', 'تراجع عن آخر محاولة')}
              </button>
            )}
          </Card>
        );
      }

      case 'irt':
        return (
          <Card key={id} title={t('Interresponse time (IRT)', 'الزمن بين الاستجابات (IRT)')} subtitle={t('Time between one response and the next', 'الوقت بين استجابة والتي تليها')}>
            <button
              type="button"
              onClick={() =>
                set((p) => {
                  const now = Date.now();
                  if (p.irtLastAt === null) return { irtLastAt: now };
                  return { irts: [...p.irts, Number(((now - p.irtLastAt) / 1000).toFixed(1))], irtLastAt: now };
                })
              }
              className={`${BTN_PRIMARY} w-full`}
            >
              {t('Response occurred', 'حدثت الاستجابة')}
            </button>
            {s.irtLastAt !== null && s.irts.length === 0 && (
              <p className="text-xs text-[#5C706C]">{t('Timing started. Tap again at the next response.', 'بدأ التوقيت. اضغط مرة أخرى عند الاستجابة التالية.')}</p>
            )}
            <div>
              {s.irts.map((sec, i) => (
                <div key={i} className={ROW}>
                  <span>{t('Response', 'الاستجابة')} {i + 2}</span>
                  <b className="tabular-nums">{sec} s {t('after', 'بعد')} #{i + 1}</b>
                </div>
              ))}
              <div className={ROW}>
                <span>{t('Mean IRT', 'متوسط IRT')}</span>
                <b className="tabular-nums">{ds.irtMean.toFixed(1)} s</b>
              </div>
            </div>
            {s.irts.length > 0 && (
              <button type="button" onClick={() => set((p) => ({ irts: p.irts.slice(0, -1) }))} className="text-xs text-[#5C706C] underline">
                {t('Undo last response', 'تراجع عن آخر استجابة')}
              </button>
            )}
          </Card>
        );

      case 'partial_interval':
      case 'whole_interval': {
        const isPartial = id === 'partial_interval';
        const arr = isPartial ? s.partial : s.whole;
        const yes = isPartial ? ds.partialYes : ds.wholeYes;
        return (
          <Card
            key={id}
            title={isPartial ? t('Partial-interval recording', 'التسجيل بالفاصل الجزئي') : t('Whole-interval recording', 'التسجيل بالفاصل الكلي')}
            subtitle={
              isPartial
                ? t('Yes if the behavior occurs at any time in the 10-second interval', 'نعم إذا حدث السلوك في أي وقت خلال الفترة (10 ثوانٍ)')
                : t('Yes only if the behavior lasts the whole 10-second interval', 'نعم فقط إذا استمر السلوك طوال الفترة (10 ثوانٍ)')
            }
          >
            <div className="grid grid-cols-5 gap-2">
              {arr.map((v, i) => (
                <YesNoCell
                  key={i}
                  n={i + 1}
                  state={v ? 'Yes' : 'No'}
                  onClick={() =>
                    set((p) => {
                      const cur = isPartial ? p.partial : p.whole;
                      const next = cur.map((x, idx) => (idx === i ? !x : x));
                      return isPartial ? { partial: next } : { whole: next };
                    })
                  }
                />
              ))}
            </div>
            <p className="text-sm text-[#16302C] dark:text-gray-200">
              {t('Intervals with behavior', 'فترات حدوث السلوك')}: {yes} {t('of', 'من')} {arr.length} ({Math.round((yes / arr.length) * 100)}%)
            </p>
          </Card>
        );
      }

      case 'mts':
        return (
          <Card
            key={id}
            title={main ? t('Momentary time sampling · every 30 seconds', 'العينة اللحظية · كل 30 ثانية') : t('Momentary time sampling (MTS)', 'العينة الزمنية اللحظية (MTS)')}
            subtitle={
              main
                ? undefined
                : t('Yes if the behavior is occurring at the moment the interval ends', 'نعم إذا كان السلوك يحدث لحظة انتهاء الفترة')
            }
          >
            <div className="grid grid-cols-5 gap-2">
              {s.mts.map((state, i) => (
                <YesNoCell
                  key={i}
                  n={i + 1}
                  state={state}
                  onClick={() =>
                    set((p) => ({
                      mts: p.mts.map((x, idx) => (idx === i ? (x === null ? 'Yes' : x === 'Yes' ? 'No' : null) : x)),
                    }))
                  }
                />
              ))}
            </div>
            <p className="text-xs text-[#5C706C] dark:text-gray-400">
              {main
                ? t('Yes = behavior occurring at the moment the interval ends', 'نعم = السلوك يحدث لحظة انتهاء الفترة')
                : `${t('Samples with behavior', 'العينات التي ظهر فيها السلوك')}: ${ds.mtsYes} ${t('of', 'من')} ${ds.mtsScored} (${ds.mtsScored ? Math.round((ds.mtsYes / ds.mtsScored) * 100) : 0}%)`}
            </p>
          </Card>
        );

      case 'permanent_product':
        return (
          <Card key={id} title={t('Permanent product recording', 'تسجيل الناتج الدائم')} subtitle={t('Score what the behavior leaves behind', 'قيّم ما يتركه السلوك خلفه')}>
            <div>
              {s.products.map((pr, i) => (
                <div key={i} className={ROW}>
                  <span>{pr.label}</span>
                  <span className="flex items-center gap-3">
                    <b className="tabular-nums">{pr.correct} {t('of', 'من')} {pr.total} {t('correct', 'صحيح')}</b>
                    <Stepper
                      label={pr.label}
                      value={pr.correct}
                      max={pr.total}
                      onChange={(v) => set((p) => ({ products: p.products.map((x, idx) => (idx === i ? { ...x, correct: v } : x)) }))}
                    />
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set((p) => ({ products: [...p.products, { label: `${t('Worksheet', 'ورقة عمل')} ${p.products.length + 1}`, correct: 0, total: 10 }] }))}
                className={`${BTN_GHOST} flex-1`}
              >
                {t('Add worksheet', 'إضافة ورقة عمل')}
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} className={`${BTN_GHOST} flex-1 flex items-center justify-center gap-1.5`}>
                <Camera className="w-4 h-4" /> {t('Attach photo', 'إرفاق صورة')}
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                set((p) => ({ photos: [...p.photos, URL.createObjectURL(f)] }));
                notify(t('Photo attached to this session.', 'تم إرفاق الصورة بهذه الجلسة.'));
                e.target.value = '';
              }}
            />
            {s.photos.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {s.photos.map((src, i) => (
                  <img key={i} src={src} alt={`${t('Worksheet photo', 'صورة ورقة العمل')} ${i + 1}`} className="w-16 h-16 object-cover rounded-xl border border-[#DCE3E1]" />
                ))}
              </div>
            )}
          </Card>
        );

      case 'percentage':
        return (
          <Card key={id} title={t('Percentage', 'النسبة المئوية')} subtitle={t('Correct responses divided by total, times 100', 'الاستجابات الصحيحة ÷ المجموع × 100')}>
            <div>
              <span className="text-4xl font-bold font-heading text-[#0F2A27] dark:text-white tabular-nums">{ds.percentage}%</span>
              <span className="text-xs text-[#5C706C] ms-2">{s.pctCorrect} {t('of', 'من')} {ds.pctTotal}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => set((p) => ({ pctCorrect: p.pctCorrect + 1 }))} className={BTN_PRIMARY}>
                {t('Correct', 'صحيح')}
              </button>
              <button type="button" onClick={() => set((p) => ({ pctIncorrect: p.pctIncorrect + 1 }))} className={BTN_GHOST}>
                {t('Incorrect', 'غير صحيح')}
              </button>
            </div>
            <button
              type="button"
              onClick={() => set({ pctCorrect: 0, pctIncorrect: 0 })}
              className="text-xs text-[#5C706C] underline"
            >
              {t('Reset count', 'إعادة العد')}
            </button>
          </Card>
        );

      case 'trials_to_crit':
        return (
          <Card key={id} title={t('Trials-to-criterion', 'المحاولات حتى بلوغ المعيار')} subtitle={t('Sessions needed to reach the mastery criterion', 'الجلسات اللازمة لبلوغ معيار الإتقان')}>
            <div>
              <div className={ROW}>
                <span>{t('Criterion', 'المعيار')}</span>
                <b>{MASTERY_CRITERION}% {t('across', 'عبر')} {MASTERY_SESSIONS} {t('sessions', 'جلسات')}</b>
              </div>
              {ds.criterionSessions.map((c, i) => (
                <div key={i} className={ROW}>
                  <span>
                    {t('Session', 'الجلسة')} {c.label}
                    {i === ds.criterionSessions.length - 1 ? ` (${t('today', 'اليوم')})` : ''}
                  </span>
                  <b className="tabular-nums">{c.pct === null ? '—' : `${c.pct}%`}</b>
                </div>
              ))}
              <div className={ROW}>
                <span>{t('Sessions at criterion', 'الجلسات عند المعيار')}</span>
                <b className="tabular-nums">{ds.sessionsAtCriterion} {t('of', 'من')} {MASTERY_SESSIONS}</b>
              </div>
            </div>
          </Card>
        );

      case 'trial_by_trial':
        return (
          <Card key={id} title={t('Trial-by-trial recording', 'التسجيل محاولة بمحاولة')} subtitle={t('Score each trial: independent, prompted or incorrect', 'قيّم كل محاولة: مستقل أو بتلقين أو غير صحيح')}>
            {TrialGrid}
          </Card>
        );

      case 'cold_probe':
        return (
          <Card key={id} title={t('Cold-probe measurement', 'القياس بالمسح البارد')} subtitle={t('Test with no prompts and no reinforcement', 'اختبار بدون تلقين وبدون تعزيز')}>
            <div>
              {s.coldProbe.map((v, i) => (
                <div key={i} className={ROW}>
                  <span>{t('Item', 'البند')} {i + 1}</span>
                  <button
                    type="button"
                    onClick={() =>
                      set((p) => ({
                        coldProbe: p.coldProbe.map((x, idx) => (idx === i ? (x === null ? '+' : x === '+' ? '-' : null) : x)),
                      }))
                    }
                    className={`min-w-[84px] px-3 py-1 rounded-full text-xs font-bold text-center border active:scale-95 ${
                      v === '+'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : v === '-'
                        ? 'bg-rose-50 border-rose-300 text-rose-700'
                        : 'bg-white border-[#DCE3E1] text-gray-400 dark:bg-transparent'
                    }`}
                  >
                    {v === '+' ? t('Correct', 'صحيح') : v === '-' ? t('Incorrect', 'خطأ') : t('Not scored', 'لم يُقيَّم')}
                  </button>
                </div>
              ))}
              <div className={ROW}>
                <span>{t('Score', 'الدرجة')}</span>
                <b className="tabular-nums">
                  {ds.coldCorrect} {t('of', 'من')} {ds.coldScored} ({ds.coldScored ? Math.round((ds.coldCorrect / ds.coldScored) * 100) : 0}%)
                </b>
              </div>
            </div>
          </Card>
        );

      case 'aac_core':
        return (
          <Card key={id} title={t('AAC core selections', 'اختيارات مفردات AAC الأساسية')} subtitle={t('Tap each core word the child selects on the device or board', 'اضغط كل كلمة أساسية يختارها الطفل على الجهاز أو اللوحة')}>
            <AacPad ds={ds} isAr={isAr} />
          </Card>
        );

      case 'wcpm':
      case 'digits_pm':
      case 'correct_incorrect_pm':
        return <FluencyProbeCard key={id} kind={id as ProbeKind} ds={ds} isAr={isAr} />;

      case 'error_analysis': {
        const total = ds.errorCount;
        const max = Math.max(1, ...s.errorTypes.map((e) => e.count));
        return (
          <Card key={id} title={t('Error analysis', 'تحليل الأخطاء')} subtitle={t('Tally each kind of error to see the pattern', 'سجّل كل نوع من الأخطاء لتظهر النمط')}>
            <div>
              {s.errorTypes.map((er, i) => (
                <div key={er.label} className={ROW}>
                  <span className="min-w-0 flex-1 truncate" dir="auto">{er.label}</span>
                  <Stepper label={er.label} value={er.count} onChange={(v) => set((p) => ({ errorTypes: p.errorTypes.map((x, idx) => (idx === i ? { ...x, count: v } : x)) }))} />
                </div>
              ))}
            </div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const label = errName.trim(); if (!label || s.errorTypes.some((x) => x.label.toLowerCase() === label.toLowerCase())) return; set((p) => ({ errorTypes: [...p.errorTypes, { label, count: 0 }] })); setErrName(''); }}>
              <input value={errName} onChange={(e) => setErrName(e.target.value)} dir="auto" aria-label={t('New error type', 'نوع خطأ جديد')} placeholder={t('Add error type', 'أضف نوع خطأ')} className="flex-1 min-w-0 text-sm px-3 py-2 rounded-xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]" />
              <button type="submit" className={BTN_GHOST}>{t('Add', 'إضافة')}</button>
            </form>
            <p className="text-sm text-[#16302C] dark:text-gray-200">{t('Total errors', 'مجموع الأخطاء')}: <b>{total}</b></p>
            {total > 0 && s.errorTypes.filter((e) => e.count > 0).sort((a, b) => b.count - a.count).map((e) => (
              <div key={e.label} className="flex items-center gap-2 text-xs">
                <span className="w-24 shrink-0 truncate">{e.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-[#EDE8DF] dark:bg-[#38325E] overflow-hidden"><div className="h-full bg-[#D63B3B]" style={{ width: `${(e.count / max) * 100}%` }} /></div>
                <b className="w-10 text-end tabular-nums">{Math.round((e.count / total) * 100)}%</b>
              </div>
            ))}
          </Card>
        );
      }

      case 'writing_rubric':
        return (
          <Card key={id} title={t('Writing rubric', 'معيار تقييم الكتابة')} subtitle={t('Score each criterion from 1 (beginning) to 4 (strong)', 'قيّم كل معيار من 1 (مبتدئ) إلى 4 (قوي)')}>
            <div>
              {s.rubric.map((row, i) => (
                <div key={row.label} className={ROW}>
                  <span className="min-w-0 flex-1 truncate" dir="auto">{row.label}</span>
                  <div className="flex gap-1.5" role="radiogroup" aria-label={row.label}>
                    {[1, 2, 3, 4].map((n) => (
                      <button key={n} type="button" role="radio" aria-checked={row.score === n} aria-label={`${row.label} ${n}`} onClick={() => set((p) => ({ rubric: p.rubric.map((x, idx) => (idx === i ? { ...x, score: x.score === n ? null : n } : x)) }))}
                        className={`w-9 h-9 rounded-xl border-[1.5px] text-sm font-bold ${row.score === n ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>{n}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const label = rubName.trim(); if (!label || s.rubric.some((x) => x.label.toLowerCase() === label.toLowerCase())) return; set((p) => ({ rubric: [...p.rubric, { label, score: null }] })); setRubName(''); }}>
              <input value={rubName} onChange={(e) => setRubName(e.target.value)} dir="auto" aria-label={t('New criterion', 'معيار جديد')} placeholder={t('Add criterion', 'أضف معياراً')} className="flex-1 min-w-0 text-sm px-3 py-2 rounded-xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]" />
              <button type="submit" className={BTN_GHOST}>{t('Add', 'إضافة')}</button>
            </form>
            <p className="text-sm text-[#16302C] dark:text-gray-200">
              {ds.rubricPercent === null ? t('Not scored yet.', 'لم يُقيَّم بعد.') : `${t('Score', 'الدرجة')}: ${ds.rubricPercent}% (${s.rubric.filter((r) => r.score !== null).reduce((a, r) => a + (r.score as number), 0)} ${t('of', 'من')} ${s.rubric.filter((r) => r.score !== null).length * 4})`}
            </p>
          </Card>
        );

      case 'work_sample':
        return (
          <Card key={id} title={t('Work sample', 'عينة عمل')} subtitle={t('Keep a photo and a note of the child’s work', 'احتفظ بصورة وملاحظة لعمل الطفل')}>
            <input value={sampleCaption} onChange={(e) => setSampleCaption(e.target.value)} dir="auto" aria-label={t('Work sample note', 'ملاحظة عينة العمل')} placeholder={t('What this sample shows', 'ما الذي تظهره العينة')} className="w-full text-sm px-3 py-2.5 rounded-xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]" />
            <div className="flex gap-2">
              <button type="button" onClick={() => sampleFile.current?.click()} disabled={s.samples.length >= 4} className={`${BTN_GHOST} flex-1 flex items-center justify-center gap-1.5`}><Camera className="w-4 h-4" /> {t('Add with photo', 'إضافة مع صورة')}</button>
              <button type="button" disabled={!sampleCaption.trim() || s.samples.length >= 4} onClick={() => { set((p) => ({ samples: [...p.samples, { caption: sampleCaption.trim(), photo: null }] })); setSampleCaption(''); }} className={`${BTN_PRIMARY} flex-1`}>{t('Add note only', 'إضافة ملاحظة فقط')}</button>
            </div>
            <input ref={sampleFile} type="file" accept="image/*" capture="environment" hidden onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = '';
              if (!f) return;
              const photo = await downscaleImage(f, 280, 0.65);
              if (!photo) { notify(t('That file is not a readable picture.', 'هذا الملف ليس صورة قابلة للقراءة.')); return; }
              set((p) => ({ samples: [...p.samples, { caption: sampleCaption.trim() || t('Work sample', 'عينة عمل'), photo }] }));
              setSampleCaption('');
            }} />
            {s.samples.length >= 4 && <p className="text-xs text-[#5C706C]">{t('Up to 4 samples per session.', 'حتى 4 عينات في الجلسة.')}</p>}
            {s.samples.map((sm, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-t border-[#EDE8DF] dark:border-[#38325E]">
                {sm.photo ? <img src={sm.photo} alt={sm.caption} className="w-14 h-14 object-cover rounded-xl border border-[#DCE3E1]" /> : <div className="w-14 h-14 rounded-xl bg-[#F4EEE6] flex items-center justify-center text-xs text-[#5C706C]">{t('note', 'ملاحظة')}</div>}
                <p className="flex-1 min-w-0 text-sm" dir="auto">{sm.caption}</p>
                <button type="button" aria-label={t('Remove sample', 'حذف العينة')} onClick={() => set((p) => ({ samples: p.samples.filter((_, idx) => idx !== i) }))} className="text-[#9AA7A4] hover:text-rose-600 text-lg leading-none px-1">×</button>
              </div>
            ))}
          </Card>
        );

      case 'cueing_level': {
        const total = s.cueLog.length;
        const max = Math.max(1, ...ds.cueCounts.map((c) => c.count));
        const CUE_AR: Record<string, string> = { Independent: 'مستقل', 'Visual cue': 'تلميح بصري', 'Gestural cue': 'تلميح بالإشارة', 'Verbal cue': 'تلميح لفظي', Model: 'نمذجة', 'Hand-over-hand': 'يداً بيد' };
        return (
          <Card key={id} title={t('Cueing level', 'مستوى التلميح')} subtitle={t('Tap the support each trial needed, from least to most', 'اضغط مستوى الدعم الذي احتاجته كل محاولة، من الأقل إلى الأكثر')}>
            <div className="grid grid-cols-2 gap-2">
              {CUE_LEVELS.map((lv) => (
                <button key={lv} type="button" onClick={() => set((p) => ({ cueLog: [...p.cueLog, lv] }))} className={`${lv === 'Independent' ? BTN_PRIMARY : BTN_GHOST} !py-2 !text-xs`}>
                  {isAr ? CUE_AR[lv] : lv} <span className="opacity-70">({ds.cueCounts.find((c) => c.level === lv)!.count})</span>
                </button>
              ))}
            </div>
            <div className="space-y-1.5">
              {ds.cueCounts.map((c) => (
                <div key={c.level} className="flex items-center gap-2 text-xs">
                  <span className="w-28 shrink-0">{isAr ? CUE_AR[c.level] : c.level}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-[#EDE8DF] dark:bg-[#38325E] overflow-hidden"><div className="h-full bg-[#0F766E]" style={{ width: `${(c.count / max) * 100}%` }} /></div>
                  <b className="w-5 text-end tabular-nums">{c.count}</b>
                </div>
              ))}
            </div>
            <p className="text-sm text-[#16302C] dark:text-gray-200">
              {total === 0
                ? t('No trials logged yet.', 'لم تُسجَّل محاولات بعد.')
                : `${s.cueLog.filter((c) => c === 'Independent').length} ${t('of', 'من')} ${total} ${t('trials with no cue', 'محاولات بلا تلميح')} (${ds.cueIndependentPercent}%)`}
            </p>
            {total > 0 && (
              <button type="button" onClick={() => set((p) => ({ cueLog: p.cueLog.slice(0, -1) }))} className="text-xs text-[#5C706C] underline">{t('Undo last trial', 'تراجع عن آخر محاولة')}</button>
            )}
          </Card>
        );
      }

      case 'mlu': {
        const addUtt = () => {
          const text = utt.trim();
          if (!text) return;
          set((p) => ({ utterances: [...p.utterances, { text, morphemes: suggestMorphemes(text) }] }));
          setUtt('');
        };
        return (
          <Card key={id} title={t('Language sample (MLU)', 'عينة لغوية (MLU)')} subtitle={t('Write what the child says. MLU = morphemes ÷ utterances. Morphemes are counted for you (words plus endings like -ing, -ed, plural -s): adjust with + and − if needed.', 'اكتب ما يقوله الطفل. MLU = المورفيمات ÷ الجمل. تُحسب المورفيمات تلقائياً (الكلمات مع النهايات)؛ عدّلها بـ + و − عند الحاجة.')}>
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addUtt(); }}>
              <input value={utt} onChange={(e) => setUtt(e.target.value)} dir="auto" aria-label={t('Child utterance', 'جملة الطفل')} placeholder={t('e.g. dog on bed', 'مثال: الكلب على السرير')} className="flex-1 min-w-0 text-sm px-3 py-2 rounded-xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]" />
              <button type="submit" disabled={!utt.trim()} className={BTN_PRIMARY}>{t('Add', 'إضافة')}</button>
            </form>
            <div>
              {s.utterances.map((u, i) => (
                <div key={i} className={ROW}>
                  <span className="min-w-0 flex-1 truncate" dir="auto">{u.text}</span>
                  <span className="flex items-center gap-2 ms-2">
                    <Stepper label={u.text} value={u.morphemes} min={1} max={30} onChange={(v) => set((p) => ({ utterances: p.utterances.map((x, idx) => (idx === i ? { ...x, morphemes: v } : x)) }))} />
                    <button type="button" aria-label={t('Remove utterance', 'حذف الجملة')} onClick={() => set((p) => ({ utterances: p.utterances.filter((_, idx) => idx !== i) }))} className="text-[#9AA7A4] hover:text-rose-600 text-lg leading-none px-1">×</button>
                  </span>
                </div>
              ))}
              <div className={ROW}>
                <span>{t('MLU', 'متوسط طول الجملة')}</span>
                <b className="tabular-nums">{ds.mlu === null ? '—' : `${ds.mlu.toFixed(2)} ${t('morphemes', 'مورفيم')} (${ds.morphemeTotal} ÷ ${s.utterances.length})`}</b>
              </div>
            </div>
            {ds.mlu !== null && (() => {
              const stage = brownStage(ds.mlu);
              const buckets = morphemeBuckets(s.utterances);
              const tones = ['bg-[#EEF1F6] text-[#334155]', 'bg-[#E2E8F0] text-[#334155]', 'bg-[#EDE9FE] text-[#6D28D9]', 'bg-[#CCFBF1] text-[#0F766E]'];
              return (
                <div className="space-y-2.5" data-testid="mlu-engine">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white dark:bg-[#252044] border border-[#E2E6EA] dark:border-[#38325E] py-2"><span className="text-[11px] text-[#5C706C] block">{t('Utterances', 'الجمل')}</span><b className="text-xl font-heading tabular-nums">{s.utterances.length}</b></div>
                    <div className="rounded-xl bg-white dark:bg-[#252044] border border-[#E2E6EA] dark:border-[#38325E] py-2"><span className="text-[11px] text-[#5C706C] block">{t('Morphemes', 'المورفيمات')}</span><b className="text-xl font-heading tabular-nums">{ds.morphemeTotal}</b></div>
                    <div className="rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-[#4338CA] py-2"><span className="text-[11px] text-[#5C706C] block">{t('Mean MLU', 'متوسط MLU')}</span><b className="text-xl font-heading tabular-nums text-[#4338CA]">{ds.mlu.toFixed(2)}</b></div>
                  </div>
                  {stage && <p className="text-xs text-[#5C706C] dark:text-gray-300">{t(`Brown’s Stage ${stage.stage}: typical for ${stage.months}. ${stage.note}`, `مرحلة براون ${stage.stage}: نموذجية في عمر ${stage.months}. ${stage.note}`)}</p>}
                  <div className="grid grid-cols-4 gap-1.5">
                    {buckets.map((b, i) => (
                      <div key={b.label} className={`rounded-lg text-center py-1.5 ${tones[i]}`}><span className="text-xs font-bold block">+{b.label} {t('Morph', 'مورفيم')}</span><span className="text-[10px] opacity-80">({b.count})</span></div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </Card>
        );
      }

      case 'accuracy':
        return (
          <Card key={id} title={t('Accuracy measurement', 'قياس الدقة')} subtitle={t('Correct and incorrect responses, with error types', 'الاستجابات الصحيحة وغير الصحيحة مع أنواع الأخطاء')}>
            <div>
              <span className="text-4xl font-bold font-heading text-[#0F2A27] dark:text-white tabular-nums">{ds.accuracyPercent}%</span>
              <span className="text-xs text-[#5C706C] ms-2">{s.accuracyCorrect} {t('of', 'من')} {ds.accuracyTotal} {t('correct', 'صحيح')}</span>
            </div>
            <div>
              <div className={ROW}>
                <span>{t('Correct', 'صحيح')}</span>
                <Stepper label={t('Correct', 'صحيح')} value={s.accuracyCorrect} onChange={(v) => set({ accuracyCorrect: v })} />
              </div>
              {s.accuracyErrors.map((er, i) => (
                <div key={i} className={ROW}>
                  <span>{er.label}</span>
                  <Stepper
                    label={er.label}
                    value={er.count}
                    onChange={(v) => set((p) => ({ accuracyErrors: p.accuracyErrors.map((x, idx) => (idx === i ? { ...x, count: v } : x)) }))}
                  />
                </div>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const label = newError.trim();
                if (!label) return;
                set((p) => ({ accuracyErrors: [...p.accuracyErrors, { label, count: 0 }] }));
                setNewError('');
              }}
            >
              <input
                value={newError}
                onChange={(e) => setNewError(e.target.value)}
                placeholder={t('Add error type (e.g. Commission)', 'أضف نوع خطأ (مثل: إضافة)')}
                className="flex-1 min-w-0 text-sm px-3 py-2 rounded-xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]"
              />
              <button type="submit" className={BTN_GHOST}>{t('Add', 'إضافة')}</button>
            </form>
          </Card>
        );

      case 'baseline': {
        const inTreatment = s.baselinePhase === 'Treatment';
        return (
          <Card key={id} title={t('Baseline measurement', 'قياس الخط القاعدي')} subtitle={t('Record the behavior before treatment starts', 'سجّل السلوك قبل بدء العلاج')}>
            <div>
              <div className={ROW}>
                <span>{t('Phase', 'المرحلة')}</span>
                <b>{inTreatment ? t('Treatment', 'العلاج') : t('Baseline', 'الخط القاعدي')}</b>
              </div>
              {s.baseline.map((b, i) => (
                <div key={i} className={ROW}>
                  <span>
                    {t('Session', 'الجلسة')} {i + 1}
                    {b.phase === 'Treatment' && <em className="ms-1.5 text-[11px] not-italic text-[#0F766E]">{t('treatment', 'علاج')}</em>}
                  </span>
                  <b className="tabular-nums">{b.value}</b>
                </div>
              ))}
            </div>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const v = Number(baselineInput);
                if (baselineInput.trim() === '' || Number.isNaN(v) || v < 0) return;
                set((p) => ({ baseline: [...p.baseline, { phase: p.baselinePhase, value: v }] }));
                setBaselineInput('');
              }}
            >
              <input
                inputMode="decimal"
                value={baselineInput}
                onChange={(e) => setBaselineInput(e.target.value)}
                placeholder={t('Count this session', 'عدد هذه الجلسة')}
                className="flex-1 min-w-0 text-sm px-3 py-2 rounded-xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]"
              />
              <button type="submit" className={BTN_PRIMARY}>{t('Add session', 'إضافة جلسة')}</button>
            </form>
            <button
              type="button"
              disabled={inTreatment}
              onClick={() => {
                set({ baselinePhase: 'Treatment' });
                notify(t('Treatment phase started. New sessions are recorded as treatment.', 'بدأت مرحلة العلاج. ستُسجَّل الجلسات الجديدة كعلاج.'));
              }}
              className={`${BTN_GHOST} w-full`}
            >
              {inTreatment ? t('Treatment phase started', 'بدأت مرحلة العلاج') : t('Start treatment', 'بدء العلاج')}
            </button>
          </Card>
        );
      }

      case 'ioa':
        return (
          <Card key={id} title={t('Interobserver agreement (IOA)', 'اتفاق الملاحظين (IOA)')} subtitle={t('Two observers record independently', 'ملاحظان يسجلان بشكل مستقل')}>
            <div>
              <div className={ROW}>
                <span>{t('Observer 1', 'الملاحظ 1')}</span>
                <Stepper label="Observer 1" value={s.ioa1} onChange={(v) => set({ ioa1: v })} />
              </div>
              <div className={ROW}>
                <span>{t('Observer 2', 'الملاحظ 2')}</span>
                <Stepper label="Observer 2" value={s.ioa2} onChange={(v) => set({ ioa2: v })} />
              </div>
              <div className={ROW}>
                <span>{t('Method', 'الطريقة')}</span>
                <b>{t('Total count', 'العدد الكلي')}</b>
              </div>
              <div className={ROW}>
                <span>{t('Agreement', 'الاتفاق')}</span>
                <b className="tabular-nums">
                  {ds.ioaPercent === null ? '—' : `${Math.min(s.ioa1, s.ioa2)} ÷ ${Math.max(s.ioa1, s.ioa2)} × 100 = ${ds.ioaPercent}%`}
                </b>
              </div>
            </div>
          </Card>
        );

      case 'treatment_integrity':
        return (
          <Card key={id} title={t('Treatment integrity measurement', 'قياس سلامة تنفيذ العلاج')} subtitle={t('Check the procedure was delivered as written', 'تحقق من تنفيذ الإجراء كما هو مكتوب')}>
            <div>
              {s.steps.map((st, i) => (
                <div key={i} className={ROW}>
                  <span>{st.step}</span>
                  <button
                    type="button"
                    onClick={() =>
                      set((p) => ({
                        steps: p.steps.map((x, idx) => (idx === i ? { ...x, done: x.done === null ? true : x.done ? false : null } : x)),
                      }))
                    }
                    className={`min-w-[84px] px-3 py-1 rounded-full text-xs font-bold text-center active:scale-95 ${
                      st.done === true
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : st.done === false
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-white text-gray-400 border border-[#DCE3E1] dark:bg-transparent'
                    }`}
                  >
                    {st.done === true ? `✓ ${t('Done', 'تم')}` : st.done === false ? `✗ ${t('Missed', 'فائت')}` : t('Not scored', 'لم يُقيَّم')}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-sm text-[#16302C] dark:text-gray-200">
              {ds.stepsDone} {t('of', 'من')} {ds.stepsScored} {t('steps correct', 'خطوات صحيحة')} ({ds.integrityPercent ?? 0}%)
            </p>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                const step = newStep.trim();
                if (!step) return;
                set((p) => ({ steps: [...p.steps, { step, done: null }] }));
                setNewStep('');
              }}
            >
              <input
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                placeholder={t('Add a procedure step', 'أضف خطوة إجرائية')}
                className="flex-1 min-w-0 text-sm px-3 py-2 rounded-xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]"
              />
              <button type="submit" className={BTN_GHOST}>{t('Add', 'إضافة')}</button>
            </form>
          </Card>
        );

      default:
        return null;
    }
  };

  /** Operational definition form (PDF page 9). Feeds the Frequency card. */
  const OperationalDefinitionCard = (
    <Card
      key="opdef"
      title={t('Operational definition', 'التعريف الإجرائي')}
      subtitle={t('Define the behavior so anyone can score it the same way', 'عرّف السلوك بحيث يستطيع أي شخص تقييمه بالطريقة نفسها')}
    >
      {(
        [
          ['name', t('Behavior name', 'اسم السلوك'), t('[Behavior name]', '[اسم السلوك]')],
          ['definition', t('Definition', 'التعريف'), t('[Observable, measurable definition]', '[تعريف قابل للملاحظة والقياس]')],
          ['examples', t('Examples', 'أمثلة'), t('[Examples]', '[أمثلة]')],
          ['nonExamples', t('Non-examples', 'أمثلة غير منتمية'), t('[Non-examples]', '[أمثلة غير منتمية]')],
        ] as const
      ).map(([key, label, ph]) => (
        <label key={key} className="block">
          <span className="text-xs font-bold text-[#0F2A27] dark:text-white block mb-1">{label}</span>
          <input
            value={s.definition[key]}
            onChange={(e) => set((p) => ({ definition: { ...p.definition, [key]: e.target.value } }))}
            placeholder={ph}
            dir="auto"
            className="w-full text-sm px-3.5 py-2.5 rounded-2xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]"
          />
        </label>
      ))}
    </Card>
  );

  const NotInPlan = (id: string) => (
    <section key={id} className={`${CARD} !space-y-2 opacity-90`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-heading font-bold text-sm text-[#0F2A27] dark:text-white">{measureName(id, isAr)}</h3>
          <p className="text-xs text-[#5C706C] dark:text-gray-400">{t('Not in your plan', 'ليس ضمن خطتك')}</p>
        </div>
        <button type="button" onClick={() => onAddMeasure(id)} className={`${BTN_GHOST} !py-1.5 !px-3 !text-xs shrink-0`}>
          + {t('Add to plan', 'أضف إلى الخطة')}
        </button>
      </div>
    </section>
  );

  /* ----- page chrome ----- */
  const isMain = view === 'datasheet';
  const ROLE_LABEL: Record<TherapyRole, { en: string; ar: string }> = {
    behavior: { en: 'Behavior therapist', ar: 'أخصائي السلوك' },
    speech: { en: 'Speech therapist', ar: 'أخصائي النطق' },
    ot: { en: 'Occupational therapist', ar: 'أخصائي العلاج الوظيفي' },
    remedial: { en: 'Remedial teacher', ar: 'معلم التربية الخاصة' },
  };
  const roleLabel = isMain ? t(ROLE_LABEL[role].en, ROLE_LABEL[role].ar) : t('Datasheets', 'أوراق البيانات');

  const PAGE_TITLES: Record<DatasheetView, { en: string; ar: string }> = {
    datasheet: { en: 'Session datasheet', ar: 'ورقة بيانات الجلسة' },
    continuous: { en: 'Continuous measures', ar: 'القياسات المستمرة' },
    interval: { en: 'Interval and sampling', ar: 'الفترات والعينات' },
    other_measures: { en: 'Other measures 1', ar: 'قياسات أخرى 1' },
    other_measures_2: { en: 'Other measures 2', ar: 'قياسات أخرى 2' },
    speech_measures: { en: 'Speech measures', ar: 'قياسات النطق واللغة' },
    remedial_measures: { en: 'Remedial measures', ar: 'قياسات التربية الخاصة' },
  };

  const TABS: { id: DatasheetView; en: string; ar: string }[] = [
    { id: 'datasheet', en: 'Datasheet', ar: 'الورقة' },
    { id: 'continuous', en: 'Continuous', ar: 'مستمرة' },
    { id: 'interval', en: 'Interval', ar: 'فترات' },
    { id: 'other_measures', en: 'Other 1', ar: 'أخرى 1' },
    { id: 'other_measures_2', en: 'Other 2', ar: 'أخرى 2' },
    ...(role === 'speech' ? [{ id: 'speech_measures' as DatasheetView, en: 'Speech', ar: 'النطق' }] : []),
    ...(role === 'remedial' ? [{ id: 'remedial_measures' as DatasheetView, en: 'Remedial', ar: 'التربية الخاصة' }] : []),
  ];

  const mainMeasures = (['continuous', 'interval', 'other_measures', 'other_measures_2', 'speech_measures', 'remedial_measures'] as const)
    .flatMap((g) => groupIds(g))
    .filter((id) => has(id) && id !== 'trial_by_trial' && !(id === 'ioa'));

  return (
    <div className="space-y-4 pb-28 animate-in fade-in" data-testid="behavior-datasheet">
      {/* Role + child picker */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm font-bold text-[#0E5E57] dark:text-teal-300">{roleLabel}</span>
        <div className="relative">
          <button
            type="button"
            onClick={() => setChildMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-[#1F1B3A] text-xs font-semibold text-[#0F2A27] dark:text-white hover:border-[#0F766E] transition"
          >
            <span>[{childName}]</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#5C706C]" />
          </button>
          {childMenuOpen && (
            <div className="absolute end-0 mt-1 w-48 bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-xl shadow-warm py-1 z-30">
              {childrenList.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onChildChange(c.id);
                    setChildMenuOpen(false);
                  }}
                  className={`w-full text-start px-3 py-1.5 text-xs flex items-center justify-between hover:bg-[#F4EEE6] dark:hover:bg-[#252044] ${
                    c.id === activeChildId ? 'font-bold text-[#0F766E]' : 'text-[#1F1B3A] dark:text-gray-300'
                  }`}
                >
                  <span>{c.name}</span>
                  {c.id === activeChildId && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-[28px] leading-tight font-bold text-[#0F2A27] dark:text-white">
            {t(PAGE_TITLES[view].en, PAGE_TITLES[view].ar)}
          </h2>
          <p className="text-sm text-[#5C706C] dark:text-[#A5A0C2] mt-1">
            {isMain ? `${t('Built from your chosen procedures and measures.', 'مبنية من الإجراءات وطرق القياس التي اخترتها.')} ` : ''}
            {sampleNote}{' '}
            <button
              type="button"
              onClick={ds.isSample ? ds.clearSample : ds.restoreSample}
              className="underline text-[#0F766E] dark:text-teal-300 font-semibold"
            >
              {ds.isSample ? t('Clear sample data', 'مسح البيانات التجريبية') : t('Load sample data', 'تحميل بيانات تجريبية')}
            </button>
          </p>
        </div>
      </div>

      {/* Plan / report shortcuts */}
      <div className="flex items-center gap-2">
        <button type="button" onClick={onEditPlan} className="px-3 py-1.5 rounded-xl bg-[#0F766E] text-xs font-semibold text-white hover:bg-[#0B5F58] transition flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5" /> {t('Edit plan', 'تعديل الخطة')}
          {feedbackCount > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-amber-400 text-[#3B2A00] text-[10px] font-bold flex items-center justify-center" data-testid="plan-feedback-badge" aria-label={`${feedbackCount} supervisor feedback`}>{feedbackCount}</span>}
        </button>
        <button type="button" onClick={onOpenReport} className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] text-xs font-semibold text-[#0F766E] dark:text-teal-300 hover:border-[#0F766E] transition flex items-center gap-1.5">
          <Share2 className="w-3.5 h-3.5" /> {t('Report', 'تقرير')}
        </button>
      </div>

      {/* Page tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={view === tab.id}
            onClick={() => setView(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition border ${
              view === tab.id
                ? 'bg-[#0F766E] border-[#0F766E] text-white font-semibold'
                : 'bg-white dark:bg-[#1F1B3A] border-[#DCE3E1] dark:border-[#38325E] text-[#5C706C] dark:text-gray-300'
            }`}
          >
            {t(tab.en, tab.ar)}
          </button>
        ))}
      </div>

      {/* ===== MAIN: built from the plan ===== */}
      {isMain && (
        <>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {plan.procedureIds.map((pid) => (
              <span key={pid} className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#D9F0EA] border border-[#0F766E] text-[#0B4F49] dark:bg-teal-950 dark:border-teal-400 dark:text-teal-200 whitespace-nowrap">
                ✓ {procedureName(pid, isAr)}
              </span>
            ))}
          </div>

          {trialGrid && (
            <>
              <Card
                eyebrow={plan.procedureIds.includes('dtt') ? t('Trial-by-trial · Discrete-trial training', 'محاولة بمحاولة · التدريب بالمحاولات المنفصلة') : t('Trial-by-trial recording', 'التسجيل محاولة بمحاولة')}
                title={`${t('Target', 'الهدف')}: ${targetName}`}
              >
                {TrialGrid}
              </Card>

              <Card title={t('Prompt level for this trial (least to most)', 'مستوى التلقين لهذه المحاولة (من الأقل إلى الأكثر)')}>
                <div className="flex flex-wrap gap-2">
                  {PROMPT_LEVELS.map((p) => {
                    const sel = s.promptLevel === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        aria-pressed={sel}
                        onClick={() => set({ promptLevel: p })}
                        className={`px-4 py-2 rounded-full text-[13px] border transition active:scale-95 ${
                          sel
                            ? 'bg-[#D9F0EA] border-[#0F766E] border-[1.5px] text-[#0B4F49] font-bold dark:bg-teal-950 dark:border-teal-400 dark:text-teal-100'
                            : 'bg-white border-[#DCE3E1] text-[#16302C] dark:bg-[#1F1B3A] dark:border-[#38325E] dark:text-gray-200'
                        }`}
                      >
                        {sel && '✓ '}
                        {p}
                      </button>
                    );
                  })}
                </div>
              </Card>

              <Card title={t('Summary', 'الملخص')}>
                <p className="text-sm text-[#16302C] dark:text-gray-200">
                  {ds.independentCount} {t('of', 'من')} {ds.scoredCount} {t('trials independent so far', 'محاولات مستقلة حتى الآن')} ({ds.percentIndependent}%).
                </p>
                <p className="text-sm text-[#5C706C] dark:text-gray-400">
                  {t('Mastery criterion', 'معيار الإتقان')}: {MASTERY_CRITERION}% {t('across', 'عبر')} {MASTERY_SESSIONS} {t('sessions', 'جلسات')}.
                </p>
              </Card>
            </>
          )}

          {plan.procedureIds.includes('token_econ') && (
            <Card title={`${t('Token economy', 'اقتصاد الرموز')} (${s.tokensEarned}/5)`}>
              <div className="flex justify-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`${t('Token', 'رمز')} ${i + 1}`}
                    onClick={() => set((p) => ({ tokensEarned: p.tokensEarned === i + 1 ? i : i + 1 }))}
                    className={`w-10 h-10 rounded-full font-bold flex items-center justify-center border transition ${
                      i < s.tokensEarned ? 'bg-amber-400 border-amber-500 text-amber-950' : 'bg-white dark:bg-[#1F1B3A] border-amber-300 text-gray-300'
                    }`}
                  >
                    <Award className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </Card>
          )}

          {mainMeasures.map((id) => renderMeasure(id, true))}

          {has('ioa') && renderMeasure('ioa', true)}

          {/* Second observer toggle (PDF page 5) */}
          <section className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] px-5 py-4 flex items-center justify-between shadow-card">
            <div>
              <span className="font-heading font-bold text-base text-[#0F2A27] dark:text-white block">{t('Second observer (IOA)', 'الملاحظ الثاني (IOA)')}</span>
              {s.ioaOn && (
                <span className="text-xs text-[#5C706C]">
                  {ds.ioaPercent === null
                    ? t('Enter both observers’ counts in Other 2', 'أدخل عدّ الملاحظين في «أخرى 2»')
                    : `${t('Agreement', 'الاتفاق')}: ${ds.ioaPercent}%`}
                </span>
              )}
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={s.ioaOn}
              onClick={() => set((p) => ({ ioaOn: !p.ioaOn }))}
              className={`min-w-[64px] px-4 py-2 rounded-full text-sm font-bold border-[1.5px] transition ${
                s.ioaOn ? 'bg-[#0F766E] border-[#0F766E] text-white' : 'bg-white dark:bg-transparent border-[#9DB5B0] text-[#5C706C]'
              }`}
            >
              {s.ioaOn ? t('On', 'تشغيل') : t('Off', 'إيقاف')}
            </button>
          </section>

          {!trialGrid && mainMeasures.length === 0 && !has('ioa') && (
            <Card title={t('No measures selected', 'لم تُختر طرق قياس')} subtitle={t('Pick procedures and measurement methods in the plan to build this datasheet.', 'اختر الإجراءات وطرق القياس في الخطة لبناء هذه الورقة.')}>
              <button type="button" onClick={onEditPlan} className={BTN_PRIMARY}>{t('Edit plan', 'تعديل الخطة')}</button>
            </Card>
          )}
        </>
      )}

      {/* ===== Group pages: every measure of the page, plan-selected ones live ===== */}
      {!isMain && (
        <>
          {groupIds(view as keyof typeof MEASURE_GROUPS).map((id) => (
            <React.Fragment key={id}>
              {has(id) ? renderMeasure(id, false) : NotInPlan(id)}
              {view === 'other_measures_2' && id === 'accuracy' && OperationalDefinitionCard}
            </React.Fragment>
          ))}
        </>
      )}

      {beforeSave}

      <button type="button" onClick={onSave} className="w-full py-3.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F58] text-white font-heading font-semibold text-base shadow-warm flex items-center justify-center gap-2 active:scale-[0.98] transition">
        <Save className="w-4 h-4" />
        {t('Save session', 'حفظ الجلسة')}
      </button>
    </div>
  );
};
