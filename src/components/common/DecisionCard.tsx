import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  eyebrow: string;
  headline: string;
  /** Lines shown under the headline (rule triggered, suggested action ...). */
  body: React.ReactNode;
  whyLabel: string;
  why: { rule: string; scores: number[]; reasons: string[] };
  tone?: 'indigo' | 'orange';
  isAr: boolean;
  testId?: string;
}

/** A recommendation with a "why" button that shows the rule and numbers behind it. */
export const DecisionCard: React.FC<Props> = ({ eyebrow, headline, body, whyLabel, why, tone = 'indigo', isAr, testId = 'decision-card' }) => {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [open, setOpen] = useState(false);
  const o = tone === 'orange';
  return (
    <section className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3" data-testid={testId}>
      <span className={`text-[11px] font-bold uppercase tracking-wide ${o ? 'text-[#4338CA]' : 'text-[#4338CA]'}`}>{eyebrow}</span>
      <div className={`rounded-2xl border p-3.5 space-y-2 ${o ? 'border-[#F5C8A8] bg-[#FFF1E6] dark:bg-orange-950/30' : 'border-[#C7D2FE] bg-indigo-50/70 dark:bg-indigo-950/40'}`}>
        <p className={`text-sm font-bold ${o ? 'text-[#C2410C]' : 'text-[#312E81] dark:text-indigo-200'}`} dir="auto">{headline}</p>
        <div className={`text-xs ${o ? 'text-[#7C2D12] dark:text-orange-200' : 'text-[#312E81] dark:text-indigo-200'}`} dir="auto">{body}</div>
        <button type="button" aria-expanded={open} onClick={() => setOpen((v) => !v)} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border text-xs font-bold bg-white dark:bg-transparent ${o ? 'border-[#EA580C] text-[#C2410C]' : 'border-[#4338CA] text-[#4338CA] dark:text-indigo-200'}`}>
          {whyLabel} <ChevronDown className={`w-3.5 h-3.5 transition ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>
      {open && (
        <div className="text-xs space-y-1.5 text-[#16302C] dark:text-gray-200" data-testid={`${testId}-why`}>
          <p><b>{t('Rule applied:', 'القاعدة المطبقة:')}</b> {why.rule}</p>
          {why.scores.length > 0 && <p><b>{t('Scores looked at (oldest first):', 'الدرجات المدروسة (الأقدم أولاً):')}</b> {why.scores.map((x) => `${x}%`).join(' → ')}</p>}
          <ul className="list-disc ps-5 space-y-0.5">{why.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
          <p className="text-[#5C706C]">{t('This is a suggestion from fixed rules, not a diagnosis. You decide.', 'هذا اقتراح من قواعد ثابتة وليس تشخيصاً. القرار لك.')}</p>
        </div>
      )}
    </section>
  );
};
