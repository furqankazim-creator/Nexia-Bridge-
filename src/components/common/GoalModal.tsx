import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Target } from '../../types';

export const SPEECH_DOMAINS = [
  'Articulation & Phonology',
  'Expressive Language',
  'Receptive Language',
  'AAC Core',
  'Pragmatics & Social Communication',
  'Fluency',
  'Voice',
];

/** Pull the mastery percentage out of text like "80% across 3 consecutive sessions". */
export const parseCriterion = (text: string): { threshold: number | null; sessions: number | null } => {
  const pct = text.match(/(\d{1,3})\s*%/);
  const sess = text.match(/across\s+(\d{1,2})/i);
  const threshold = pct ? Number(pct[1]) : null;
  return {
    threshold: threshold !== null && threshold >= 1 && threshold <= 100 ? threshold : null,
    sessions: sess ? Number(sess[1]) : null,
  };
};

const INPUT = 'w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E2E6EA] dark:border-[#38325E] bg-[#F8FAFC] dark:bg-[#252044] outline-none focus:border-[#4338CA] focus:ring-2 focus:ring-indigo-100';
const LABEL = 'text-xs font-bold text-[#1F1B3A] dark:text-white block mb-1';

export interface GoalValues {
  name: string;
  domain: string;
  operationalDefinition: string;
  masteryCriterion: string;
  criterionThreshold: number;
  baseline: number;
  status: Target['status'];
  procedureNotes: string;
  procedureSteps: string[];
  materials: string[];
}

export const OT_DOMAINS = ['Fine motor', 'Gross motor', 'Self-care & daily living', 'Sensory processing', 'Visual-motor & handwriting', 'Feeding', 'Play & social participation'];
export const REMEDIAL_DOMAINS = ['Reading', 'Writing', 'Math', 'Study skills', 'Executive function', 'Attention & classroom behavior'];

interface Props {
  isAr: boolean;
  /** Goal being edited, or null to add a new one. */
  target: Target | null;
  childName: string;
  /** Domains offered in the dropdown (the first is the default). */
  domains: string[];
  /** Dialog title, e.g. "Speech Clinical Target". */
  noun: { en: string; ar: string };
  /** Domain preselected for a new goal (e.g. "AAC Core"). */
  initialDomain?: string;
  onClose: () => void;
  onSave: (v: GoalValues) => void;
  onDelete?: () => void;
}

const lines = (x: string) => x.split('\n').map((l) => l.trim()).filter(Boolean);
const criterionText = (pct: number, sessions: number) => `${pct}% across ${sessions} consecutive sessions`;

/** Goal form: title, domain, definition, mastery criterion, procedure & materials, steps, phase. */
export const GoalModal: React.FC<Props> = ({ isAr, target, childName, domains: domainOptions, noun, initialDomain, onClose, onSave, onDelete }) => {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const startCrit = target?.masteryCriterion ?? criterionText(80, 3);
  const startParsed = parseCriterion(startCrit);

  const [name, setName] = useState(target?.name ?? '');
  const [domain, setDomain] = useState(target?.domain ?? initialDomain ?? domainOptions[0]);
  const [definition, setDefinition] = useState(target && target.operationalDefinition !== target.name ? target.operationalDefinition : '');
  const [criterion, setCriterion] = useState(startCrit);
  const [pct, setPct] = useState(String(target?.criterionThreshold ?? startParsed.threshold ?? 80));
  const [sessions, setSessions] = useState(String(startParsed.sessions ?? 3));
  const [baseline, setBaseline] = useState(String(target?.baseline ?? 0));
  const [status, setStatus] = useState<Target['status']>(target?.status ?? 'baseline');
  const [notes, setNotes] = useState(target?.procedureNotes ?? '');
  const [steps, setSteps] = useState((target?.procedureSteps ?? []).map((x) => x.replace(/^\d+\.\s*/, '')).join('\n'));
  const [materials, setMaterials] = useState((target?.materials ?? []).join('\n'));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tried, setTried] = useState(false);

  // Mastery % and Sessions write the criterion text; typing the text updates them back.
  const onCriterion = (v: string) => {
    setCriterion(v);
    const p = parseCriterion(v);
    if (p.threshold !== null) setPct(String(p.threshold));
    if (p.sessions !== null) setSessions(String(p.sessions));
  };
  const onPct = (v: string) => {
    setPct(v);
    const n = Number(v);
    const s = Number(sessions);
    if (Number.isInteger(n) && n >= 1 && n <= 100) setCriterion(criterionText(n, Number.isInteger(s) && s >= 1 ? s : 3));
  };
  const onSessions = (v: string) => {
    setSessions(v);
    const s = Number(v);
    const n = Number(pct);
    if (Number.isInteger(s) && s >= 1 && s <= 10 && Number.isInteger(n) && n >= 1 && n <= 100) setCriterion(criterionText(n, s));
  };

  const pctN = Number(pct);
  const sessN = Number(sessions);
  const baseN = Number(baseline);
  const errors: string[] = [];
  if (!name.trim()) errors.push(t('Name is required.', 'الاسم مطلوب.'));
  if (!definition.trim()) errors.push(t('Operational definition is required.', 'التعريف الإجرائي مطلوب.'));
  if (parseCriterion(criterion).threshold === null) errors.push(t('Mastery criterion needs a percentage from 1 to 100, e.g. "80% across 3 consecutive sessions".', 'معيار الإتقان يحتاج نسبة من 1 إلى 100، مثل «80% عبر 3 جلسات متتالية».'));
  if (!Number.isInteger(pctN) || pctN < 1 || pctN > 100) errors.push(t('Mastery % must be 1–100.', 'نسبة الإتقان يجب أن تكون بين 1 و100.'));
  if (!Number.isInteger(sessN) || sessN < 1 || sessN > 10) errors.push(t('Sessions must be 1–10.', 'عدد الجلسات يجب أن يكون بين 1 و10.'));
  if (!Number.isFinite(baseN) || baseN < 0 || baseN > 100) errors.push(t('Baseline must be 0–100.', 'الخط القاعدي يجب أن يكون بين 0 و100.'));

  // A seeded goal may use a domain that is not in the standard list: keep it selectable.
  const domains = domainOptions.includes(domain) ? domainOptions : [domain, ...domainOptions];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (errors.length) return;
    onSave({
      name: name.trim(),
      domain,
      operationalDefinition: definition.trim(),
      masteryCriterion: criterion.trim(),
      criterionThreshold: pctN,
      baseline: baseN,
      status,
      procedureNotes: notes.trim(),
      procedureSteps: lines(steps),
      materials: lines(materials),
    });
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={onClose} role="dialog" aria-modal="true" aria-label={`${t('Add New', 'إضافة')} ${t(noun.en, noun.ar)}`}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} noValidate className="bg-white dark:bg-[#1F1B3A] w-full rounded-t-3xl border border-[#E8E2D9] dark:border-[#38325E] shadow-float p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] space-y-3.5 max-h-[92%] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">
              {target ? t(`Edit ${noun.en}`, `تعديل ${noun.ar}`) : t(`Add New ${noun.en}`, `إضافة ${noun.ar} جديد`)}
            </h4>
            <p className="text-[11px] text-[#6B6785]">{childName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <label className="block">
          <span className={LABEL}>{t('Target Title:', 'عنوان الهدف:')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} dir="auto" placeholder={t('e.g. Naming Action Verbs (Running, Jumping)', 'مثال: تسمية أفعال الحركة (يركض، يقفز)')} className={INPUT} />
        </label>

        <label className="block">
          <span className={LABEL}>{t('Clinical Domain:', 'المجال الإكلينيكي:')}</span>
          <select value={domain} onChange={(e) => setDomain(e.target.value)} className={INPUT}>
            {domains.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>

        <label className="block">
          <span className={LABEL}>{t('Operational definition', 'التعريف الإجرائي')}</span>
          <textarea rows={3} value={definition} onChange={(e) => setDefinition(e.target.value)} dir="auto" placeholder={t('What the child does, and how you will know it was done (observable and measurable)', 'ماذا يفعل الطفل وكيف تعرف أنه فعله (قابل للملاحظة والقياس)')} className={INPUT} />
        </label>

        <label className="block">
          <span className={LABEL}>{t('Mastery Criterion:', 'معيار الإتقان:')}</span>
          <input value={criterion} onChange={(e) => onCriterion(e.target.value)} dir="auto" placeholder="80% across 3 consecutive sessions" className={INPUT} />
        </label>

        <div className="grid grid-cols-3 gap-2">
          <label className="block"><span className={LABEL}>{t('Mastery %', 'نسبة الإتقان')}</span>
            <input inputMode="numeric" value={pct} onChange={(e) => onPct(e.target.value)} className={INPUT} /></label>
          <label className="block"><span className={LABEL}>{t('Sessions', 'الجلسات')}</span>
            <input inputMode="numeric" value={sessions} onChange={(e) => onSessions(e.target.value)} className={INPUT} /></label>
          <label className="block"><span className={LABEL}>{t('Baseline %', 'الخط القاعدي')}</span>
            <input inputMode="numeric" value={baseline} onChange={(e) => setBaseline(e.target.value)} className={INPUT} /></label>
        </div>

        <label className="block">
          <span className={LABEL}>{t('Phase', 'المرحلة')}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as Target['status'])} className={INPUT}>
            {(['baseline', 'teaching', 'generalizing', 'maintenance', 'mastered'] as const).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>

        <label className="block">
          <span className={LABEL}>{t('Clinical Procedure & Materials:', 'الإجراء الإكلينيكي والأدوات:')}</span>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} dir="auto" placeholder={t("Present 2 stimulus cards, ask 'What is the boy doing?'...", "اعرض بطاقتين واسأل «ماذا يفعل الولد؟»...")} className={INPUT} />
        </label>

        <label className="block">
          <span className={LABEL}>{t('Teaching steps (one per line)', 'خطوات التعليم (خطوة في كل سطر)')}</span>
          <textarea rows={3} value={steps} onChange={(e) => setSteps(e.target.value)} dir="auto" className={INPUT} />
        </label>

        <label className="block">
          <span className={LABEL}>{t('Materials (one per line)', 'الأدوات (أداة في كل سطر)')}</span>
          <textarea rows={2} value={materials} onChange={(e) => setMaterials(e.target.value)} dir="auto" className={INPUT} />
        </label>

        {target && <p className="text-[11px] text-amber-700">{t('Changing the mastery criterion sends the goal back to the supervisor for approval.', 'تغيير معيار الإتقان يعيد الهدف إلى المشرف للموافقة.')}</p>}
        {tried && errors.length > 0 && <ul role="alert" className="text-xs text-rose-700 list-disc ps-4 space-y-0.5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button type="button" onClick={onClose} className="py-3 rounded-xl border-[1.5px] border-[#4338CA] text-[#4338CA] dark:text-indigo-300 text-sm font-bold bg-white dark:bg-transparent">{t('Cancel', 'إلغاء')}</button>
          <button type="submit" className="py-3 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-sm font-bold">{t('Save Target', 'حفظ الهدف')}</button>
        </div>
        {target && onDelete && (
          confirmDelete ? (
            <button type="button" onClick={onDelete} className="w-full py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold">{t('Tap again to delete this target', 'اضغط مرة أخرى لحذف الهدف')}</button>
          ) : (
            <button type="button" onClick={() => setConfirmDelete(true)} className="w-full py-2 text-xs text-rose-600 underline">{t('Delete target', 'حذف الهدف')}</button>
          )
        )}
      </form>
    </div>
  );
};
