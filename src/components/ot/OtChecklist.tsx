import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ChecklistScore } from '../../types';

const CARD = 'bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3';
const SUGGESTIONS = ['Buttons a shirt', 'Zips a jacket', 'Holds pencil with tripod grip', 'Cuts along a straight line', 'Ties shoelaces', 'Uses a spoon', 'Opens a lunch box'];
const SCORES: { id: ChecklistScore; ar: string; style: string }[] = [
  { id: 'Independent', ar: 'مستقل', style: 'bg-[#DDF5EA] border-emerald-500 text-[#1B9E6B]' },
  { id: 'Prompted', ar: 'بتلقين', style: 'bg-[#FFF1CC] border-amber-500 text-[#B7791F]' },
  { id: 'Physical help', ar: 'مساعدة جسدية', style: 'bg-[#FDE3E4] border-rose-500 text-[#D63B3B]' },
];

/** OT skills checklist (dressing, fine motor ...): score each skill, add your own, watch it improve. */
export const OtChecklist: React.FC = () => {
  const { activeChild, language, otChecklist, addChecklistItem, scoreChecklistItem, deleteChecklistItem } = useApp();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [name, setName] = useState('');
  const items = otChecklist.filter((i) => i.childId === activeChild.id);
  const scored = items.filter((i) => i.score !== null);
  const independent = scored.filter((i) => i.score === 'Independent').length;
  const has = (n: string) => items.some((i) => i.name.toLowerCase() === n.toLowerCase());

  const add = (n: string) => {
    const v = n.trim();
    if (!v || has(v)) return;
    addChecklistItem(activeChild.id, v);
  };

  return (
    <div className="space-y-4 pb-28 animate-in fade-in" data-testid="ot-checklist">
      <div>
        <h2 className="font-heading text-[28px] leading-tight font-bold text-[#0F2A27] dark:text-white">{t('Skills checklist', 'قائمة المهارات')}</h2>
        <p className="text-sm text-[#5C706C] dark:text-[#A5A0C2] mt-1">{t('Dressing, fine motor and daily-living skills for', 'مهارات ارتداء الملابس والحركة الدقيقة والحياة اليومية لـ')} {activeChild.name}.</p>
      </div>

      <section className={CARD}>
        <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Add a skill', 'إضافة مهارة')}</h3>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); add(name); setName(''); }}>
          <input value={name} onChange={(e) => setName(e.target.value)} dir="auto" aria-label={t('Skill', 'المهارة')} placeholder={t('e.g. Buttons a shirt', 'مثال: يزرّر القميص')} className="flex-1 min-w-0 text-sm px-3.5 py-2.5 rounded-2xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]" />
          <button type="submit" disabled={!name.trim()} className="py-2.5 px-4 rounded-xl bg-[#0F766E] text-white text-sm font-bold disabled:opacity-50">{t('Add', 'إضافة')}</button>
        </form>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTIONS.filter((s) => !has(s)).map((s) => (
            <button key={s} type="button" onClick={() => add(s)} className="px-2.5 py-1 rounded-full text-xs border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent">+ {s}</button>
          ))}
        </div>
      </section>

      {items.length === 0 && <section className={CARD}><p className="text-sm text-[#5C706C]">{t('No skills on the checklist yet.', 'لا توجد مهارات في القائمة بعد.')}</p></section>}

      {items.map((item) => (
        <article key={item.id} className={CARD} data-testid="checklist-item">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white" dir="auto">{item.name}</h3>
            <button type="button" aria-label={t('Remove skill', 'حذف المهارة')} onClick={() => deleteChecklistItem(item.id)} className="p-1 text-[#9AA7A4] hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
          </div>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={item.name}>
            {SCORES.map((s) => (
              <button key={s.id} type="button" role="radio" aria-checked={item.score === s.id} onClick={() => scoreChecklistItem(item.id, item.score === s.id ? null : s.id)}
                className={`py-2.5 rounded-xl border-[1.5px] text-xs font-bold transition active:scale-95 ${item.score === s.id ? s.style : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E] text-[#5C706C]'}`}>
                {item.score === s.id && '✓ '}{isAr ? s.ar : s.id}
              </button>
            ))}
          </div>
          {item.history.length > 0 && <p className="text-[11px] text-[#5C706C]">{item.history.length} {t('scores recorded', 'تقييمات مسجلة')} · {t('last', 'آخر')}: {item.history[item.history.length - 1].score}</p>}
        </article>
      ))}

      {scored.length > 0 && (
        <section className={CARD}>
          <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Today’s result', 'نتيجة اليوم')}</h3>
          <p className="text-sm">{independent} {t('of', 'من')} {scored.length} {t('skills independent', 'مهارات باستقلال')} (<b>{Math.round((independent / scored.length) * 100)}%</b>)</p>
        </section>
      )}
    </div>
  );
};
