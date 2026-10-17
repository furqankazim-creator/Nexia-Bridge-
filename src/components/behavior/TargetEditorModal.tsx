import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Target } from '../../types';

interface Props {
  isAr: boolean;
  /** Existing target to edit, or null to add a new one. */
  target: Target | null;
  childName: string;
  defaultDomain?: string;
  onClose: () => void;
  onSave: (values: {
    name: string;
    domain: string;
    operationalDefinition: string;
    procedureSteps: string[];
    materials: string[];
    criterionThreshold: number;
    sessionsRequired: number;
    baseline: number;
    status: Target['status'];
  }) => void;
  onDelete?: () => void;
}

const INPUT = 'w-full text-sm px-3.5 py-2.5 rounded-2xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]';

const parseSessions = (criterion: string) => parseInt(criterion.match(/across\s+(\d+)/i)?.[1] ?? '3', 10) || 3;
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

export const TargetEditorModal: React.FC<Props> = ({ isAr, target, childName, defaultDomain = 'Behavior', onClose, onSave, onDelete }) => {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [name, setName] = useState(target?.name ?? '');
  const [domain, setDomain] = useState(target?.domain ?? defaultDomain);
  const [definition, setDefinition] = useState(target?.operationalDefinition ?? '');
  const [steps, setSteps] = useState((target?.procedureSteps ?? []).join('\n'));
  const [materials, setMaterials] = useState((target?.materials ?? []).join('\n'));
  const [threshold, setThreshold] = useState(String(target?.criterionThreshold ?? 90));
  const [sessions, setSessions] = useState(String(target ? parseSessions(target.masteryCriterion) : 3));
  const [baseline, setBaseline] = useState(String(target?.baseline ?? 0));
  const [status, setStatus] = useState<Target['status']>(target?.status ?? 'baseline');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const th = Number(threshold);
  const ss = Number(sessions);
  const bl = Number(baseline);
  const errors: string[] = [];
  if (!name.trim()) errors.push(t('Name is required.', 'الاسم مطلوب.'));
  if (!definition.trim()) errors.push(t('Operational definition is required.', 'التعريف الإجرائي مطلوب.'));
  if (!Number.isFinite(th) || th < 1 || th > 100) errors.push(t('Mastery % must be 1–100.', 'نسبة الإتقان يجب أن تكون بين 1 و100.'));
  if (!Number.isInteger(ss) || ss < 1 || ss > 10) errors.push(t('Sessions must be 1–10.', 'عدد الجلسات يجب أن يكون بين 1 و10.'));
  if (!Number.isFinite(bl) || bl < 0 || bl > 100) errors.push(t('Baseline must be 0–100.', 'الخط القاعدي يجب أن يكون بين 0 و100.'));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.length) return;
    onSave({
      name: name.trim(), domain: domain.trim() || 'Behavior', operationalDefinition: definition.trim(),
      procedureSteps: lines(steps), materials: lines(materials), criterionThreshold: th, sessionsRequired: ss, baseline: bl, status,
    });
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={onClose} role="dialog" aria-modal="true">
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#1F1B3A] w-full rounded-t-3xl border border-[#E8E2D9] dark:border-[#38325E] shadow-float p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] space-y-3 max-h-[92%] overflow-y-auto">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">{target ? t('Edit target', 'تعديل الهدف') : t('Add target', 'إضافة هدف')}</h4>
            <p className="text-[11px] text-[#6B6785]">{childName}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded-full text-gray-400"><X className="w-5 h-5" /></button>
        </div>

        <label className="block"><span className="text-xs font-bold block mb-1">{t('Target name', 'اسم الهدف')}</span>
          <input value={name} onChange={(e) => setName(e.target.value)} dir="auto" className={INPUT} /></label>
        <label className="block"><span className="text-xs font-bold block mb-1">{t('Domain', 'المجال')}</span>
          <input value={domain} onChange={(e) => setDomain(e.target.value)} dir="auto" className={INPUT} /></label>
        <label className="block"><span className="text-xs font-bold block mb-1">{t('Operational definition', 'التعريف الإجرائي')}</span>
          <textarea rows={3} value={definition} onChange={(e) => setDefinition(e.target.value)} dir="auto" className={INPUT} /></label>
        <label className="block"><span className="text-xs font-bold block mb-1">{t('Teaching steps (one per line)', 'خطوات التعليم (خطوة في كل سطر)')}</span>
          <textarea rows={3} value={steps} onChange={(e) => setSteps(e.target.value)} dir="auto" className={INPUT} /></label>
        <label className="block"><span className="text-xs font-bold block mb-1">{t('Materials (one per line)', 'الأدوات (أداة في كل سطر)')}</span>
          <textarea rows={2} value={materials} onChange={(e) => setMaterials(e.target.value)} dir="auto" className={INPUT} /></label>

        <div className="grid grid-cols-3 gap-2">
          <label className="block"><span className="text-xs font-bold block mb-1">{t('Mastery %', 'نسبة الإتقان')}</span>
            <input inputMode="numeric" value={threshold} onChange={(e) => setThreshold(e.target.value)} className={INPUT} /></label>
          <label className="block"><span className="text-xs font-bold block mb-1">{t('Sessions', 'الجلسات')}</span>
            <input inputMode="numeric" value={sessions} onChange={(e) => setSessions(e.target.value)} className={INPUT} /></label>
          <label className="block"><span className="text-xs font-bold block mb-1">{t('Baseline %', 'الخط القاعدي')}</span>
            <input inputMode="numeric" value={baseline} onChange={(e) => setBaseline(e.target.value)} className={INPUT} /></label>
        </div>
        <label className="block"><span className="text-xs font-bold block mb-1">{t('Phase', 'المرحلة')}</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as Target['status'])} className={INPUT}>
            {(['baseline', 'teaching', 'generalizing', 'maintenance', 'mastered'] as const).map((s) => <option key={s} value={s}>{s}</option>)}
          </select></label>

        {target && <p className="text-[11px] text-amber-700">{t('Changing the mastery criterion sends the target back to the supervisor for approval.', 'تغيير معيار الإتقان يعيد الهدف إلى المشرف للموافقة.')}</p>}
        {errors.length > 0 && <ul role="alert" className="text-xs text-rose-700 list-disc ps-4">{errors.map((e) => <li key={e}>{e}</li>)}</ul>}

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button type="submit" disabled={errors.length > 0} className="py-2.5 rounded-xl bg-[#0F766E] text-white text-sm font-bold disabled:opacity-50">{t('Save target', 'حفظ الهدف')}</button>
          <button type="button" onClick={onClose} className="py-2.5 rounded-xl border-[1.5px] border-[#0F766E] text-[#0F766E] text-sm font-semibold">{t('Cancel', 'إلغاء')}</button>
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
