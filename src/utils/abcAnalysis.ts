import type { ABCRecord, BehaviorFunction } from '../types';

export const FUNCTIONS: BehaviorFunction[] = ['attention', 'escape', 'tangible', 'sensory'];

export type DayPart = 'morning' | 'midday' | 'afternoon' | 'evening';

export const dayPart = (iso: string): DayPart => {
  const h = new Date(iso).getHours();
  if (h < 11) return 'morning';
  if (h < 14) return 'midday';
  if (h < 17) return 'afternoon';
  return 'evening';
};

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Group by a text key, case-insensitively, most frequent first. */
const tally = (items: string[]) => {
  const map = new Map<string, { label: string; count: number }>();
  for (const raw of items) {
    const k = norm(raw);
    if (!k) continue;
    const cur = map.get(k);
    if (cur) cur.count++;
    else map.set(k, { label: raw.trim(), count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
};

export interface AbcSummary {
  total: number;
  avgIntensity: number;
  functionCounts: Record<BehaviorFunction, number>;
  tagged: number;
  topFunction: BehaviorFunction | null;
  topShare: number; // 0..1 of tagged events
  /** Enough evidence for a hypothesis: >= 3 tagged events and one function >= 50% of them. */
  conclusive: boolean;
  antecedents: { label: string; count: number }[];
  consequences: { label: string; count: number }[];
  settings: { label: string; count: number }[];
  byDayPart: Record<DayPart, number>;
  avgDurationSec: number | null;
}

export function summarizeAbc(records: ABCRecord[]): AbcSummary {
  const functionCounts: Record<BehaviorFunction, number> = { attention: 0, escape: 0, tangible: 0, sensory: 0 };
  const byDayPart: Record<DayPart, number> = { morning: 0, midday: 0, afternoon: 0, evening: 0 };
  let intensitySum = 0;
  const durations: number[] = [];
  for (const r of records) {
    if (r.probableFunction) functionCounts[r.probableFunction]++;
    byDayPart[dayPart(r.at)]++;
    intensitySum += r.intensity;
    if (r.durationSec) durations.push(r.durationSec);
  }
  const tagged = Object.values(functionCounts).reduce((a, b) => a + b, 0);
  const top = FUNCTIONS.reduce<BehaviorFunction | null>(
    (best, f) => (functionCounts[f] > (best ? functionCounts[best] : 0) ? f : best),
    null
  );
  const topShare = top && tagged ? functionCounts[top] / tagged : 0;
  return {
    total: records.length,
    avgIntensity: records.length ? intensitySum / records.length : 0,
    functionCounts,
    tagged,
    topFunction: top,
    topShare,
    conclusive: tagged >= 3 && topShare >= 0.5,
    antecedents: tally(records.map((r) => r.antecedent)),
    consequences: tally(records.map((r) => r.consequence)),
    settings: tally(records.map((r) => r.setting)),
    byDayPart,
    avgDurationSec: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
  };
}

/** Evidence-based replacement behavior suggestion per function (FCT). */
export const REPLACEMENT_BY_FUNCTION: Record<BehaviorFunction, { en: string; ar: string }> = {
  attention: {
    en: 'Teach a functional communication response to request attention appropriately (e.g. tap shoulder, say "look at me"); give attention immediately for it and withhold attention for the problem behavior.',
    ar: 'علّم الطفل طلب الانتباه بطريقة مناسبة (مثل لمس الكتف أو قول «انظر إليّ») وقدّم الانتباه فوراً عند استخدامها وامنعه عند السلوك المشكل.',
  },
  escape: {
    en: 'Teach a break request (card, sign or "break please"); honor it quickly, then fade toward longer work intervals. Do not let the problem behavior end the task.',
    ar: 'علّم الطفل طلب استراحة (بطاقة أو إشارة أو «استراحة من فضلك») واستجب لها بسرعة ثم زد مدة العمل تدريجياً. لا تدع السلوك المشكل ينهي المهمة.',
  },
  tangible: {
    en: 'Teach a request for the item or activity (mand "I want ___"); provide it immediately for the request and teach waiting with a visual timer.',
    ar: 'علّم الطفل طلب الشيء أو النشاط («أريد ___») وقدّمه فوراً عند الطلب وعلّمه الانتظار بمؤقت بصري.',
  },
  sensory: {
    en: 'Provide an alternative way to get the same sensory input (e.g. chew tool, fidget, movement break) on a schedule and teach requesting it.',
    ar: 'وفّر بديلاً يمنح المدخل الحسي نفسه (مثل أداة مضغ أو لعبة تململ أو استراحة حركة) بجدول منتظم وعلّم الطفل طلبه.',
  },
};
