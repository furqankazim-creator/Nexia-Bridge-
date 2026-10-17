import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FUNCTION_NAME } from '../../utils/behaviorReport';

/** Parent-facing view of the child's active Behavior Intervention Plan and favourite rewards. */
export const BehaviorPlanCard: React.FC = () => {
  const { activeChild, bips, reinforcers, language } = useApp();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const bip = bips.find((b) => b.childId === activeChild.id && b.status !== 'draft');
  const top = reinforcers.filter((r) => r.childId === activeChild.id).sort((a, b) => b.preference - a.preference).slice(0, 5);
  if (!bip) return null;

  const rows: [string, string, string | undefined][] = [
    ['What we are working on', 'ما نعمل عليه', bip.targetBehavior],
    ['Why it happens', 'لماذا يحدث', bip.hypothesizedFunction ? FUNCTION_NAME[bip.hypothesizedFunction] : undefined],
    ['How to help before it starts', 'كيف تساعد قبل أن يبدأ', bip.antecedentStrategies],
    ['What we teach instead', 'ما نعلّمه بدلاً منه', bip.replacementBehavior],
    ['How to respond', 'كيف تستجيب', bip.consequenceStrategies],
    ['Rewards that work', 'المكافآت المناسبة', bip.reinforcement],
    ['If things get hard', 'إذا اشتد الموقف', bip.crisisPlan],
  ];

  return (
    <section className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[22px] p-4 shadow-card space-y-3" data-testid="behavior-plan-card">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-[#0F766E]" />
        <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">{t('Behavior plan', 'خطة السلوك')}</h3>
        <span className="ms-auto text-[11px] font-semibold text-[#6B6785]">v{bip.version}{bip.reviewDate ? ` · ${t('review', 'مراجعة')} ${bip.reviewDate}` : ''}</span>
      </div>
      <dl className="space-y-2.5">
        {rows.filter(([, , v]) => v && v.trim()).map(([en, ar, v]) => (
          <div key={en}>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-[#0F766E]">{t(en, ar)}</dt>
            <dd className="text-sm text-[#1F1B3A] dark:text-gray-100" dir="auto">{v}</dd>
          </div>
        ))}
      </dl>
      {top.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#0F766E] mb-1">{t('Favourite rewards', 'المكافآت المفضلة')}</p>
          <div className="flex flex-wrap gap-1.5">
            {top.map((r) => (
              <span key={r.id} className="px-2.5 py-1 rounded-full text-xs bg-[#D9F0EA] text-[#0B4F49] font-semibold" dir="auto">{r.name}</span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
