import React, { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { BehaviorDatasheet } from '../../hooks/useBehaviorDatasheet';
import type { WhType } from '../../types';
import { PROMPT_BANK, type DrillPrompt } from '../../utils/whPrompts';
import { WH_TYPES, mondayOf } from '../../utils/sentence';

const WH_AR: Record<WhType, string> = { who: 'مَن', what: 'ماذا', where: 'أين', when: 'متى', why: 'لماذا', how: 'كيف' };
// The reference drill leads with these four; the rest follow.
const ORDER: WhType[] = ['where', 'what', 'who', 'why', 'when', 'how'];

/** Question drill: pick a question type, ask the prompt, and tally independent / prompted / incorrect answers. */
export const WhDrill: React.FC<{ ds: BehaviorDatasheet; isAr: boolean }> = ({ ds, isAr }) => {
  const { activeChild, weeklySets } = useApp();
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [type, setType] = useState<WhType>('where');
  const [index, setIndex] = useState<Record<string, number>>({});

  // This week's own questions come first, then the starter bank for that type.
  const prompts = useMemo<DrillPrompt[]>(() => {
    const set = weeklySets.find((x) => x.childId === activeChild.id && x.weekStart === mondayOf(new Date()));
    const own = (set?.questions ?? []).filter((q) => q.type === type && q.text.trim()).map((q) => ({ q: q.text, a: q.answer }));
    const bank = PROMPT_BANK[isAr ? 'ar' : 'en'][type].filter((b) => !own.some((o) => o.q === b.q));
    return [...own, ...bank];
  }, [weeklySets, activeChild.id, type, isAr]);

  const i = (index[type] ?? 0) % prompts.length;
  const prompt = prompts[i];
  const d = ds.s.drill;
  const total = ds.drillTotal;
  const bump = (key: 'independent' | 'prompted' | 'incorrect', by: number) => ds.set((p) => ({ drill: { ...p.drill, [key]: Math.max(0, p.drill[key] + by) } }));

  const boxes: { key: 'independent' | 'prompted' | 'incorrect'; en: string; ar: string; tone: string; val: string }[] = [
    { key: 'independent', en: 'Independent', ar: 'مستقل', tone: 'border-[#4338CA] bg-indigo-50/70 dark:bg-indigo-950/40', val: 'text-[#4338CA]' },
    { key: 'prompted', en: 'Prompted', ar: 'بتلقين', tone: 'border-[#E2E6EA] dark:border-[#38325E]', val: 'text-[#1F1B3A] dark:text-white' },
    { key: 'incorrect', en: 'Incorrect', ar: 'غير صحيح', tone: 'border-[#E2E6EA] dark:border-[#38325E]', val: 'text-[#C62828]' },
  ];

  return (
    <div className="space-y-3" data-testid="wh-drill">
      <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label={t('Question type', 'نوع السؤال')}>
        {ORDER.filter((w) => WH_TYPES.includes(w)).map((w) => (
          <button key={w} type="button" role="tab" aria-selected={type === w} onClick={() => setType(w)} className={`py-2 rounded-xl text-xs font-bold border capitalize transition ${type === w ? 'bg-[#4338CA] border-[#4338CA] text-white' : 'bg-white dark:bg-[#1F1B3A] border-[#E2E6EA] dark:border-[#38325E]'}`}>
            {isAr ? WH_AR[w] : w}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-[#F4F6FB] dark:bg-[#252044] border border-[#E2E6EA] dark:border-[#38325E] p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#4338CA]">{isAr ? WH_AR[type] : type} {t('question', 'سؤال')}</span>
          <button type="button" onClick={() => setIndex((x) => ({ ...x, [type]: i + 1 }))} className="text-xs font-bold text-[#4338CA]">{t('Next prompt →', 'السؤال التالي ←')}</button>
        </div>
        <p className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white" dir="auto" data-testid="drill-prompt">“{prompt.q}”</p>
        {prompt.a && (
          <p className="text-xs rounded-xl bg-white dark:bg-[#1F1B3A] px-3 py-2" dir="auto">
            <span className="font-bold text-[#5C706C]">{t('Target response:', 'الإجابة المستهدفة:')} </span>
            <span className="font-bold text-[#0F766E]">{prompt.a}</span>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-bold">{t('Counters', 'العدادات')} ({total} {t('trials', 'محاولات')})</span>
        {total > 0 && <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">{ds.drillPercent}% {t('Independent', 'مستقل')}</span>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {boxes.map((b) => (
          <div key={b.key} className={`rounded-2xl border-2 p-3 text-center ${b.tone}`}>
            <span className="text-xs font-bold block">{t(b.en, b.ar)}</span>
            <span className={`text-3xl font-bold font-heading tabular-nums block my-1 ${b.val}`} aria-live="polite">{d[b.key]}</span>
            <div className="flex items-center justify-center gap-2">
              <button type="button" aria-label={`${t(b.en, b.ar)} −1`} onClick={() => bump(b.key, -1)} className="w-9 h-9 rounded-full border border-[#E2E6EA] dark:border-[#38325E] bg-white dark:bg-transparent flex items-center justify-center"><Minus className="w-4 h-4" /></button>
              <button type="button" aria-label={`${t(b.en, b.ar)} +1`} onClick={() => bump(b.key, 1)} className="w-9 h-9 rounded-full bg-[#4338CA] text-white flex items-center justify-center"><Plus className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
