import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ClipboardList, Share2, Trash2, Plus, Star, Lightbulb, CheckCircle2, Circle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ShareToTeamModal } from '../common/ShareToTeamModal';
import type { ABCRecord, BehaviorFunction, BipPlan, Reinforcer } from '../../types';
import { FUNCTIONS, REPLACEMENT_BY_FUNCTION, summarizeAbc } from '../../utils/abcAnalysis';
import { abcText, bipText as buildBipText, functionText, reinforcersText, tasksText } from '../../utils/behaviorReport';

type Section = 'abc' | 'function' | 'bip' | 'reinforcers';

const CARD = 'bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3';
const INPUT =
  'w-full text-sm px-3.5 py-2.5 rounded-2xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]';
const BTN = 'py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] text-white text-sm font-bold active:scale-95 transition disabled:opacity-50';
const BTN_GHOST =
  'py-2.5 px-4 rounded-xl border-[1.5px] border-[#0F766E] text-[#0F766E] dark:text-teal-300 dark:border-teal-700 text-sm font-semibold bg-white dark:bg-transparent hover:bg-teal-50 dark:hover:bg-teal-950/40 active:scale-95 transition disabled:opacity-50';

const FN_LABEL: Record<BehaviorFunction, { en: string; ar: string; color: string }> = {
  attention: { en: 'Attention', ar: 'الانتباه', color: 'bg-indigo-500' },
  escape: { en: 'Escape / avoid', ar: 'الهروب / التجنب', color: 'bg-rose-500' },
  tangible: { en: 'Tangible / access', ar: 'الحصول على شيء', color: 'bg-amber-500' },
  sensory: { en: 'Sensory / automatic', ar: 'حسي / تلقائي', color: 'bg-teal-500' },
};

const DAYPART_LABEL = {
  morning: { en: 'Morning', ar: 'صباحاً' },
  midday: { en: 'Midday', ar: 'ظهراً' },
  afternoon: { en: 'Afternoon', ar: 'عصراً' },
  evening: { en: 'Evening', ar: 'مساءً' },
} as const;

const localInputValue = (d = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="text-xs font-bold text-[#0F2A27] dark:text-white block mb-1">{label}</span>
    {children}
  </label>
);

const Bar: React.FC<{ label: string; value: number; max: number; color?: string }> = ({ label, value, max, color = 'bg-[#0F766E]' }) => (
  <div className="flex items-center gap-2 text-xs">
    <span className="w-28 shrink-0 truncate text-[#16302C] dark:text-gray-200" title={label}>{label}</span>
    <div className="flex-1 h-2.5 rounded-full bg-[#EDE8DF] dark:bg-[#38325E] overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
    <b className="w-6 text-end tabular-nums">{value}</b>
  </div>
);

export const BipPortal: React.FC = () => {
  const {
    activeChild, language, role, abcRecords, addAbcRecord, deleteAbcRecord, bips, saveBip, reinforcers,
    addReinforcer, updateReinforcer, removeReinforcer, homeTasks, addHomeTask, removeHomeTask,
    showNotification, contacts, sendContactMessage, markContactRead, isServerMode, inviteCodes, currentUserName,
  } = useApp();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const therapistName = currentUserName;

  const [section, setSection] = useState<Section>('abc');
  const [shareDoc, setShareDoc] = useState<{ title: string; text: string; tag: string } | null>(null);

  const childAbc = useMemo(
    () => abcRecords.filter((r) => r.childId === activeChild.id).sort((a, b) => b.at.localeCompare(a.at)),
    [abcRecords, activeChild.id]
  );
  const summary = useMemo(() => summarizeAbc(childAbc), [childAbc]);

  const childReinfAll = reinforcers.filter((r) => r.childId === activeChild.id);
  const childTasksAll = homeTasks.filter((h) => h.childId === activeChild.id);
  const planData = { childName: activeChild.name, bip: bips.find((b) => b.childId === activeChild.id), abc: childAbc, reinforcers: childReinfAll, tasks: childTasksAll };
  const ShareBtn: React.FC<{ title: string; tag: string; text: string; disabled?: boolean }> = ({ title, tag, text, disabled }) => (
    <button type="button" disabled={disabled} onClick={() => setShareDoc({ title, tag, text })} className={`${BTN_GHOST} w-full flex items-center justify-center gap-1.5`}>
      <Share2 className="w-4 h-4" /> {t('Send to parents', 'إرسال إلى ولي الأمر')}
    </button>
  );

  /* ---------------- ABC form ---------------- */
  const blankAbc = () => ({
    at: localInputValue(),
    setting: '',
    antecedent: '',
    behavior: '',
    consequence: '',
    intensity: 1 as 1 | 2 | 3,
    durationMin: '',
    probableFunction: '' as BehaviorFunction | '',
  });
  const [abc, setAbc] = useState(blankAbc);
  const abcValid = abc.antecedent.trim() && abc.behavior.trim() && abc.consequence.trim();

  const submitAbc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!abcValid) return;
    const mins = parseFloat(abc.durationMin);
    const rec: Omit<ABCRecord, 'id'> = {
      childId: activeChild.id,
      at: new Date(abc.at).toISOString(),
      setting: abc.setting.trim(),
      antecedent: abc.antecedent.trim(),
      behavior: abc.behavior.trim(),
      consequence: abc.consequence.trim(),
      intensity: abc.intensity,
      durationSec: Number.isFinite(mins) && mins > 0 ? Math.round(mins * 60) : null,
      probableFunction: abc.probableFunction || null,
      observer: therapistName,
    };
    addAbcRecord(rec);
    setAbc(blankAbc());
  };

  /* ---------------- BIP form ---------------- */
  const savedBip = bips.find((b) => b.childId === activeChild.id);
  const emptyBip = (): Omit<BipPlan, 'version' | 'updatedAt'> => ({
    childId: activeChild.id,
    targetBehavior: '',
    operationalDefinition: '',
    hypothesizedFunction: summary.conclusive && summary.topFunction ? summary.topFunction : '',
    antecedentStrategies: '',
    replacementBehavior: '',
    teachingStrategies: '',
    consequenceStrategies: '',
    reinforcement: '',
    crisisPlan: '',
    dataMethod: '',
    reviewDate: '',
    status: 'draft',
  });
  const [bipDraft, setBipDraft] = useState<Omit<BipPlan, 'version' | 'updatedAt'>>(() => savedBip ?? emptyBip());
  const [bipChild, setBipChild] = useState(activeChild.id);
  // Reset the form when the active child changes.
  if (bipChild !== activeChild.id) {
    setBipChild(activeChild.id);
    setBipDraft(bips.find((b) => b.childId === activeChild.id) ?? emptyBip());
  }
  const setB = <K extends keyof BipPlan>(k: K, v: BipPlan[K]) => setBipDraft((p) => ({ ...p, [k]: v }));
  const bipValid = bipDraft.targetBehavior.trim() && bipDraft.operationalDefinition.trim() && bipDraft.hypothesizedFunction && bipDraft.replacementBehavior.trim();

  /* ---------------- Reinforcers ---------------- */
  const childReinf = reinforcers.filter((r) => r.childId === activeChild.id).sort((a, b) => b.preference - a.preference || a.name.localeCompare(b.name));
  const [rfName, setRfName] = useState('');
  const [rfCat, setRfCat] = useState<Reinforcer['category']>('tangible');
  const CAT_LABEL: Record<Reinforcer['category'], { en: string; ar: string }> = {
    edible: { en: 'Edible', ar: 'مأكول' },
    tangible: { en: 'Toy / item', ar: 'لعبة / شيء' },
    activity: { en: 'Activity', ar: 'نشاط' },
    social: { en: 'Social', ar: 'اجتماعي' },
    sensory: { en: 'Sensory', ar: 'حسي' },
  };

  /* ---------------- Home tasks ---------------- */
  const SECTIONS: { id: Section; en: string; ar: string }[] = [
    { id: 'abc', en: 'ABC log', ar: 'سجل ABC' },
    { id: 'function', en: 'Function', ar: 'الوظيفة' },
    { id: 'bip', en: 'BIP', ar: 'خطة BIP' },
    { id: 'reinforcers', en: 'Reinforcers', ar: 'المعززات' },
  ];

  const maxOf = (arr: { count: number }[]) => Math.max(1, ...arr.map((a) => a.count));

  return (
    <div className="space-y-4 pb-28 animate-in fade-in" data-testid="bip-portal">
      <div>
        <h2 className="font-heading text-[28px] leading-tight font-bold text-[#0F2A27] dark:text-white">
          {t('Behavior plan', 'خطة السلوك')}
        </h2>
        <p className="text-sm text-[#5C706C] dark:text-[#A5A0C2] mt-1">
          {t('ABC data, function, BIP and reinforcers for', 'بيانات ABC والوظيفة وخطة BIP والمعززات لـ')} {activeChild.name}.
        </p>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1" role="tablist">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={section === s.id}
            onClick={() => setSection(s.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs whitespace-nowrap transition border ${
              section === s.id
                ? 'bg-[#0F766E] border-[#0F766E] text-white font-semibold'
                : 'bg-white dark:bg-[#1F1B3A] border-[#DCE3E1] dark:border-[#38325E] text-[#5C706C] dark:text-gray-300'
            }`}
          >
            {t(s.en, s.ar)}
          </button>
        ))}
      </div>

      {/* ================= ABC LOG ================= */}
      {section === 'abc' && (
        <>
          <form onSubmit={submitAbc} className={CARD}>
            <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Log an ABC event', 'تسجيل حدث ABC')}</h3>
            <Field label={t('When', 'الوقت')}>
              <input type="datetime-local" value={abc.at} onChange={(e) => setAbc({ ...abc, at: e.target.value })} className={INPUT} />
            </Field>
            <Field label={t('Setting', 'المكان')}>
              <input value={abc.setting} onChange={(e) => setAbc({ ...abc, setting: e.target.value })} placeholder={t('e.g. Table work, circle time', 'مثل: العمل على الطاولة')} dir="auto" className={INPUT} />
            </Field>
            <Field label={t('Antecedent: what happened right before', 'السابقة: ما حدث قبل السلوك مباشرة')}>
              <textarea rows={2} value={abc.antecedent} onChange={(e) => setAbc({ ...abc, antecedent: e.target.value })} placeholder={t('e.g. Given a hard task', 'مثل: طُلبت منه مهمة صعبة')} dir="auto" className={INPUT} />
            </Field>
            <Field label={t('Behavior: what the child did (observable)', 'السلوك: ما فعله الطفل (قابل للملاحظة)')}>
              <textarea rows={2} value={abc.behavior} onChange={(e) => setAbc({ ...abc, behavior: e.target.value })} placeholder={t('e.g. Dropped to floor and screamed', 'مثل: سقط على الأرض وصرخ')} dir="auto" className={INPUT} />
            </Field>
            <Field label={t('Consequence: what happened right after', 'النتيجة: ما حدث بعد السلوك مباشرة')}>
              <textarea rows={2} value={abc.consequence} onChange={(e) => setAbc({ ...abc, consequence: e.target.value })} placeholder={t('e.g. Task removed', 'مثل: أُزيلت المهمة')} dir="auto" className={INPUT} />
            </Field>

            <div>
              <span className="text-xs font-bold text-[#0F2A27] dark:text-white block mb-1">{t('Intensity', 'الشدة')}</span>
              <div className="grid grid-cols-3 gap-2">
                {([1, 2, 3] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={abc.intensity === n}
                    onClick={() => setAbc({ ...abc, intensity: n })}
                    className={`py-2 rounded-xl text-xs font-semibold border transition ${abc.intensity === n ? 'bg-[#D9F0EA] border-[#0F766E] text-[#0B4F49] border-[1.5px]' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}
                  >
                    {n === 1 ? t('Mild', 'خفيف') : n === 2 ? t('Moderate', 'متوسط') : t('Severe', 'شديد')}
                  </button>
                ))}
              </div>
            </div>

            <Field label={t('Duration (minutes, optional)', 'المدة (بالدقائق، اختياري)')}>
              <input inputMode="decimal" value={abc.durationMin} onChange={(e) => setAbc({ ...abc, durationMin: e.target.value })} className={INPUT} />
            </Field>

            <div>
              <span className="text-xs font-bold text-[#0F2A27] dark:text-white block mb-1">{t('Probable function (optional)', 'الوظيفة المحتملة (اختياري)')}</span>
              <div className="flex flex-wrap gap-2">
                {FUNCTIONS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={abc.probableFunction === f}
                    onClick={() => setAbc({ ...abc, probableFunction: abc.probableFunction === f ? '' : f })}
                    className={`px-3.5 py-1.5 rounded-full text-xs border transition ${abc.probableFunction === f ? 'bg-[#D9F0EA] border-[#0F766E] text-[#0B4F49] font-bold border-[1.5px]' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}
                  >
                    {abc.probableFunction === f && '✓ '}
                    {t(FN_LABEL[f].en, FN_LABEL[f].ar)}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={!abcValid} className={`${BTN} w-full`}>
              {t('Save ABC event', 'حفظ حدث ABC')}
            </button>
          </form>

          <section className={CARD}>
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Recorded events', 'الأحداث المسجلة')}</h3>
              <span className="text-xs text-[#5C706C]">{childAbc.length}</span>
            </div>
            {childAbc.length === 0 && <p className="text-sm text-[#5C706C]">{t('No ABC events yet for this child.', 'لا توجد أحداث ABC لهذا الطفل بعد.')}</p>}
            {childAbc.map((r) => (
              <article key={r.id} className="rounded-2xl border border-[#EDE8DF] dark:border-[#38325E] p-3 space-y-1.5 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#5C706C]">{new Date(r.at).toLocaleString(isAr ? 'ar' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })}{r.setting ? ` · ${r.setting}` : ''}</span>
                  <button type="button" aria-label={t('Delete event', 'حذف الحدث')} onClick={() => deleteAbcRecord(r.id)} className="p-1 text-[#9AA7A4] hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <p dir="auto"><b className="text-[#0F766E]">A</b> {r.antecedent}</p>
                <p dir="auto"><b className="text-[#0F766E]">B</b> {r.behavior}</p>
                <p dir="auto"><b className="text-[#0F766E]">C</b> {r.consequence}</p>
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${r.intensity === 3 ? 'bg-rose-100 text-rose-700' : r.intensity === 2 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    {r.intensity === 1 ? t('Mild', 'خفيف') : r.intensity === 2 ? t('Moderate', 'متوسط') : t('Severe', 'شديد')}
                  </span>
                  {r.durationSec && <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-700">{Math.round(r.durationSec / 60 * 10) / 10} min</span>}
                  {r.probableFunction && <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 text-indigo-700 font-semibold">{t(FN_LABEL[r.probableFunction].en, FN_LABEL[r.probableFunction].ar)}</span>}
                </div>
              </article>
            ))}
            <ShareBtn title={t('Send ABC log', 'إرسال سجل ABC')} tag="ABC Log" text={abcText(planData)} disabled={childAbc.length === 0} />
          </section>
        </>
      )}

      {/* ================= FUNCTION ANALYSIS ================= */}
      {section === 'function' && (
        <>
          {summary.total === 0 ? (
            <section className={CARD}>
              <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('No data yet', 'لا توجد بيانات بعد')}</h3>
              <p className="text-sm text-[#5C706C]">{t('Log ABC events and tag a probable function to see patterns here.', 'سجّل أحداث ABC وحدد الوظيفة المحتملة لتظهر الأنماط هنا.')}</p>
              <button type="button" onClick={() => setSection('abc')} className={BTN}>{t('Log an event', 'سجّل حدثاً')}</button>
            </section>
          ) : (
            <>
              <section className={CARD}>
                <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Function hypothesis', 'فرضية الوظيفة')}</h3>
                {summary.conclusive && summary.topFunction ? (
                  <>
                    <p className="text-sm text-[#16302C] dark:text-gray-200">
                      {t('Most likely function', 'الوظيفة الأرجح')}: <b>{t(FN_LABEL[summary.topFunction].en, FN_LABEL[summary.topFunction].ar)}</b> ({Math.round(summary.topShare * 100)}% {t('of tagged events', 'من الأحداث الموسومة')}).
                    </p>
                    <div className="rounded-2xl bg-[#F0FAF7] dark:bg-[#1C2C28] border border-teal-200 dark:border-teal-800 p-3 text-xs space-y-1">
                      <p className="font-bold flex items-center gap-1.5 text-[#0B4F49] dark:text-teal-300"><Lightbulb className="w-3.5 h-3.5" /> {t('Suggested replacement behavior', 'السلوك البديل المقترح')}</p>
                      <p dir="auto">{isAr ? REPLACEMENT_BY_FUNCTION[summary.topFunction].ar : REPLACEMENT_BY_FUNCTION[summary.topFunction].en}</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-[#5C706C]">
                    {t(
                      'Not enough evidence yet. A hypothesis needs at least 3 events tagged with a function and one function covering at least half of them.',
                      'الأدلة غير كافية بعد. تحتاج الفرضية إلى 3 أحداث موسومة على الأقل ووظيفة واحدة تغطي نصفها على الأقل.'
                    )}{' '}
                    ({summary.tagged} {t('tagged of', 'موسومة من')} {summary.total}).
                  </p>
                )}
                <div className="space-y-2 pt-1">
                  {FUNCTIONS.map((f) => (
                    <Bar key={f} label={t(FN_LABEL[f].en, FN_LABEL[f].ar)} value={summary.functionCounts[f]} max={Math.max(1, summary.tagged)} color={FN_LABEL[f].color} />
                  ))}
                </div>
                {summary.conclusive && (
                  <button
                    type="button"
                    onClick={() => {
                      setBipDraft((p) => ({ ...p, hypothesizedFunction: summary.topFunction!, replacementBehavior: p.replacementBehavior || REPLACEMENT_BY_FUNCTION[summary.topFunction!].en }));
                      setSection('bip');
                      showNotification(t('Function copied to the BIP draft.', 'تم نسخ الوظيفة إلى مسودة BIP.'));
                    }}
                    className={`${BTN_GHOST} w-full`}
                  >
                    {t('Use in BIP', 'استخدم في خطة BIP')}
                  </button>
                )}
              </section>

              <section className={CARD}>
                <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Patterns', 'الأنماط')}</h3>
                <p className="text-xs text-[#5C706C]">
                  {summary.total} {t('events', 'حدث')} · {t('average intensity', 'متوسط الشدة')} {summary.avgIntensity.toFixed(1)}/3
                  {summary.avgDurationSec ? ` · ${t('average duration', 'متوسط المدة')} ${Math.round(summary.avgDurationSec / 6) / 10} min` : ''}
                </p>
                <div>
                  <h4 className="text-xs font-bold mb-1.5">{t('Time of day', 'وقت اليوم')}</h4>
                  <div className="space-y-1.5">
                    {(Object.keys(summary.byDayPart) as (keyof typeof DAYPART_LABEL)[]).map((k) => (
                      <Bar key={k} label={t(DAYPART_LABEL[k].en, DAYPART_LABEL[k].ar)} value={summary.byDayPart[k]} max={Math.max(1, ...Object.values(summary.byDayPart))} />
                    ))}
                  </div>
                </div>
                {([
                  ['Common antecedents', 'السوابق الشائعة', summary.antecedents],
                  ['Common consequences', 'النتائج الشائعة', summary.consequences],
                  ['Settings', 'الأماكن', summary.settings],
                ] as const).map(([en, ar, list]) =>
                  list.length ? (
                    <div key={en}>
                      <h4 className="text-xs font-bold mb-1.5">{t(en, ar)}</h4>
                      <div className="space-y-1.5">
                        {list.slice(0, 5).map((x) => (
                          <Bar key={x.label} label={x.label} value={x.count} max={maxOf(list)} />
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
                <button
                  type="button"
                  onClick={() => setShareDoc({ title: t('Share function summary', 'مشاركة ملخص الوظيفة'), tag: 'Function Summary', text: functionText(planData) })}
                  className={`${BTN_GHOST} w-full flex items-center justify-center gap-1.5`}
                >
                  <Share2 className="w-4 h-4" /> {t('Share summary', 'مشاركة الملخص')}
                </button>
              </section>
            </>
          )}
        </>
      )}

      {/* ================= BIP ================= */}
      {section === 'bip' && (
        <form
          className={CARD}
          onSubmit={(e) => {
            e.preventDefault();
            if (!bipValid) return;
            saveBip(bipDraft);
          }}
        >
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white flex items-center gap-1.5"><ClipboardList className="w-4 h-4" /> {t('Behavior Intervention Plan', 'خطة التدخل السلوكي')}</h3>
            {savedBip && <span className="text-[11px] text-[#5C706C]">v{savedBip.version} · {new Date(savedBip.updatedAt).toLocaleDateString()}</span>}
          </div>

          <Field label={t('Target behavior', 'السلوك المستهدف')}>
            <input value={bipDraft.targetBehavior} onChange={(e) => setB('targetBehavior', e.target.value)} dir="auto" className={INPUT} />
          </Field>
          <Field label={t('Operational definition', 'التعريف الإجرائي')}>
            <textarea rows={2} value={bipDraft.operationalDefinition} onChange={(e) => setB('operationalDefinition', e.target.value)} dir="auto" className={INPUT} />
          </Field>
          <div>
            <span className="text-xs font-bold text-[#0F2A27] dark:text-white block mb-1">{t('Function of the behavior', 'وظيفة السلوك')}</span>
            <div className="flex flex-wrap gap-2">
              {FUNCTIONS.map((f) => (
                <button key={f} type="button" aria-pressed={bipDraft.hypothesizedFunction === f} onClick={() => setB('hypothesizedFunction', f)}
                  className={`px-3.5 py-1.5 rounded-full text-xs border transition ${bipDraft.hypothesizedFunction === f ? 'bg-[#D9F0EA] border-[#0F766E] text-[#0B4F49] font-bold border-[1.5px]' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>
                  {bipDraft.hypothesizedFunction === f && '✓ '}{t(FN_LABEL[f].en, FN_LABEL[f].ar)}
                </button>
              ))}
            </div>
            {summary.conclusive && summary.topFunction && bipDraft.hypothesizedFunction && bipDraft.hypothesizedFunction !== summary.topFunction && (
              <p className="text-[11px] text-amber-700 mt-1.5">
                {t('Your ABC data points to', 'بيانات ABC تشير إلى')} “{FN_LABEL[summary.topFunction].en}”.
              </p>
            )}
          </div>
          <Field label={t('Prevention: antecedent strategies', 'الوقاية: استراتيجيات السوابق')}>
            <textarea rows={2} value={bipDraft.antecedentStrategies} onChange={(e) => setB('antecedentStrategies', e.target.value)} dir="auto" className={INPUT} />
          </Field>
          <Field label={t('Replacement behavior', 'السلوك البديل')}>
            <textarea rows={2} value={bipDraft.replacementBehavior} onChange={(e) => setB('replacementBehavior', e.target.value)} dir="auto" className={INPUT} />
          </Field>
          {bipDraft.hypothesizedFunction && !bipDraft.replacementBehavior.trim() && (
            <button type="button" onClick={() => setB('replacementBehavior', REPLACEMENT_BY_FUNCTION[bipDraft.hypothesizedFunction as BehaviorFunction].en)} className="text-xs underline text-[#0F766E]">
              {t('Insert suggested replacement behavior', 'أدرج السلوك البديل المقترح')}
            </button>
          )}
          <Field label={t('How it will be taught', 'كيف سيتم تعليمه')}>
            <textarea rows={2} value={bipDraft.teachingStrategies} onChange={(e) => setB('teachingStrategies', e.target.value)} dir="auto" className={INPUT} />
          </Field>
          <Field label={t('Consequence strategies', 'استراتيجيات النتائج')}>
            <textarea rows={2} value={bipDraft.consequenceStrategies} onChange={(e) => setB('consequenceStrategies', e.target.value)} dir="auto" className={INPUT} />
          </Field>
          <Field label={t('Reinforcement plan', 'خطة التعزيز')}>
            <textarea rows={2} value={bipDraft.reinforcement} onChange={(e) => setB('reinforcement', e.target.value)} dir="auto" className={INPUT} placeholder={childReinf[0] ? `${t('Top reinforcer', 'أعلى معزز')}: ${childReinf[0].name}` : ''} />
          </Field>
          <Field label={t('Crisis / safety plan', 'خطة الأزمات والسلامة')}>
            <textarea rows={2} value={bipDraft.crisisPlan} onChange={(e) => setB('crisisPlan', e.target.value)} dir="auto" className={INPUT} />
          </Field>
          <Field label={t('Data collection method', 'طريقة جمع البيانات')}>
            <input value={bipDraft.dataMethod} onChange={(e) => setB('dataMethod', e.target.value)} dir="auto" className={INPUT} placeholder={t('e.g. Frequency per session + ABC for severe events', 'مثل: التكرار في كل جلسة + ABC للأحداث الشديدة')} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('Review date', 'تاريخ المراجعة')}>
              <input type="date" value={bipDraft.reviewDate} onChange={(e) => setB('reviewDate', e.target.value)} className={INPUT} />
            </Field>
            <Field label={t('Status', 'الحالة')}>
              <select value={bipDraft.status} onChange={(e) => setB('status', e.target.value as BipPlan['status'])} className={INPUT}>
                <option value="draft">{t('Draft', 'مسودة')}</option>
                <option value="active">{t('Active', 'فعالة')}</option>
                <option value="under_review">{t('Under review', 'قيد المراجعة')}</option>
              </select>
            </Field>
          </div>
          {!bipValid && <p className="text-xs text-[#5C706C]">{t('Required: target behavior, definition, function and replacement behavior.', 'مطلوب: السلوك المستهدف والتعريف والوظيفة والسلوك البديل.')}</p>}
          <div className="grid grid-cols-2 gap-2">
            <button type="submit" disabled={!bipValid} className={BTN}>{t('Save BIP', 'حفظ الخطة')}</button>
            <button
              type="button"
              disabled={!savedBip}
              onClick={() => savedBip && setShareDoc({ title: t('Share BIP', 'مشاركة خطة BIP'), tag: 'BIP', text: buildBipText(activeChild.name, savedBip) })}
              className={`${BTN_GHOST} flex items-center justify-center gap-1.5`}
            >
              <Share2 className="w-4 h-4" /> {t('Share', 'مشاركة')}
            </button>
          </div>
        </form>
      )}

      {/* ================= REINFORCERS ================= */}
      {section === 'reinforcers' && (
        <>
          <form
            className={CARD}
            onSubmit={(e) => {
              e.preventDefault();
              const name = rfName.trim();
              if (!name) return;
              addReinforcer({ childId: activeChild.id, name, category: rfCat, preference: 3 });
              setRfName('');
            }}
          >
            <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Add a reinforcer', 'إضافة معزز')}</h3>
            <Field label={t('Item or activity', 'الشيء أو النشاط')}>
              <input value={rfName} onChange={(e) => setRfName(e.target.value)} dir="auto" className={INPUT} />
            </Field>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CAT_LABEL) as Reinforcer['category'][]).map((c) => (
                <button key={c} type="button" aria-pressed={rfCat === c} onClick={() => setRfCat(c)}
                  className={`px-3.5 py-1.5 rounded-full text-xs border ${rfCat === c ? 'bg-[#D9F0EA] border-[#0F766E] text-[#0B4F49] font-bold border-[1.5px]' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>
                  {t(CAT_LABEL[c].en, CAT_LABEL[c].ar)}
                </button>
              ))}
            </div>
            <button type="submit" disabled={!rfName.trim()} className={`${BTN} w-full flex items-center justify-center gap-1.5`}><Plus className="w-4 h-4" /> {t('Add', 'إضافة')}</button>
          </form>

          <section className={CARD}>
            <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Preference ranking', 'ترتيب التفضيل')}</h3>
            <p className="text-xs text-[#5C706C]">{t('Rate 1–5 stars after each preference assessment. Highest first. Re-assess often: preferences change.', 'قيّم من 1 إلى 5 نجوم بعد كل تقييم تفضيل. الأعلى أولاً. أعد التقييم كثيراً فالتفضيلات تتغير.')}</p>
            {childReinf.length === 0 && <p className="text-sm text-[#5C706C]">{t('No reinforcers yet.', 'لا توجد معززات بعد.')}</p>}
            {childReinf.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 py-2 border-b border-[#EDE8DF] dark:border-[#38325E] last:border-b-0">
                <span className="w-6 text-center text-xs font-bold text-[#5C706C]">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" dir="auto">{r.name}</p>
                  <p className="text-[11px] text-[#5C706C]">{t(CAT_LABEL[r.category].en, CAT_LABEL[r.category].ar)} · {new Date(r.lastAssessedAt).toLocaleDateString()}</p>
                </div>
                <div className="flex" role="radiogroup" aria-label={r.name}>
                  {([1, 2, 3, 4, 5] as const).map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={r.preference === n} aria-label={`${n}`} onClick={() => updateReinforcer(r.id, { preference: n })} className="p-0.5">
                      <Star className={`w-4 h-4 ${n <= r.preference ? 'fill-amber-400 text-amber-400' : 'text-[#CBD5D1]'}`} />
                    </button>
                  ))}
                </div>
                <button type="button" aria-label={t('Remove', 'إزالة')} onClick={() => removeReinforcer(r.id)} className="p-1 text-[#9AA7A4] hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            <ShareBtn title={t('Send reinforcer ranking', 'إرسال ترتيب المعززات')} tag="Reinforcers" text={reinforcersText(planData)} disabled={childReinf.length === 0} />
          </section>
        </>
      )}

      {/* ================= HOME TASKS / PARENT CHAT (shared with the other therapists) ================= */}

      {shareDoc && (
        <ShareToTeamModal
          role="behavior"
          isAr={isAr}
          title={shareDoc.title}
          subtitle={activeChild.name}
          text={shareDoc.text}
          tag={shareDoc.tag}
          childName={activeChild.name}
          authorName={therapistName}
          onClose={() => setShareDoc(null)}
        />
      )}
    </div>
  );
};
