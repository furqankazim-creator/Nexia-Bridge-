import React from 'react';
import type { Target } from '../../types';
import type { BehaviorDatasheet } from '../../hooks/useBehaviorDatasheet';
import { domainGroup } from '../common/TargetsPanel';
import { AacPad } from './AacPad';
import { ArticulationTracker } from './ArticulationTracker';
import { WhDrill } from './WhDrill';

type Kind = 'wh' | 'aac' | 'articulation' | null;

const WH_RE = /\b(wh|question|questions|who|what|where|why|when|how)\b/i;
const SOUND_RE = /\/([a-z؀-ۿ]{1,3})\//i;

/** Which drill suits a goal, judged from its name and domain. */
export const goalToolKind = (g: Pick<Target, 'name' | 'domain'>): Kind => {
  if (WH_RE.test(g.name)) return 'wh';
  const group = domainGroup(g.domain);
  if (group === 'AAC Core' || /\baac\b/i.test(g.name)) return 'aac';
  if (group === 'Articulation' || SOUND_RE.test(g.name)) return 'articulation';
  return null;
};

/** The practice tool that matches the active goal, shown above the datasheet. */
export const GoalTool: React.FC<{ goal: Target; ds: BehaviorDatasheet; isAr: boolean }> = ({ goal, ds, isAr }) => {
  const kind = goalToolKind(goal);
  if (!kind) return null;
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const eyebrow = kind === 'wh' ? t('Expressive language drill', 'تدريب اللغة التعبيرية') : kind === 'aac' ? t('Augmentative communication (AAC)', 'التواصل المعزز والبديل (AAC)') : t('Articulation drill', 'تدريب النطق');
  const sound = goal.name.match(SOUND_RE)?.[1] ?? '';
  return (
    <section className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3" data-testid="goal-tool" data-kind={kind}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#4338CA]">{eyebrow}</span>
          <h3 className="font-heading font-bold text-lg text-[#1F1B3A] dark:text-white" dir="auto">{goal.name}</h3>
          <p className="text-xs text-[#6B6785]" dir="auto">{t('Domain', 'المجال')}: {goal.domain}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold capitalize shrink-0 bg-emerald-50 text-emerald-700 border border-emerald-200">{goal.status}</span>
      </div>
      {kind === 'wh' && <WhDrill ds={ds} isAr={isAr} />}
      {kind === 'aac' && <AacPad ds={ds} isAr={isAr} />}
      {kind === 'articulation' && <ArticulationTracker compact initialSound={sound} />}
    </section>
  );
};
