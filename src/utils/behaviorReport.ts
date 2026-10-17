import type { ABCRecord, BipPlan, HomeTask, Reinforcer, BehaviorFunction } from '../types';
import { summarizeAbc, dayPart } from './abcAnalysis';

export const FUNCTION_NAME: Record<BehaviorFunction, string> = {
  attention: 'Attention',
  escape: 'Escape / avoid',
  tangible: 'Tangible / access',
  sensory: 'Sensory / automatic',
};

export interface PlanData {
  childName: string;
  bip: BipPlan | undefined;
  abc: ABCRecord[]; // this child's events
  reinforcers: Reinforcer[]; // this child's
  tasks: HomeTask[]; // this child's
}

export const abcText = (d: PlanData, limit = 10): string => {
  const s = summarizeAbc(d.abc);
  const recent = [...d.abc].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
  return [
    `ABC LOG — ${d.childName}`,
    `${s.total} events · average intensity ${s.avgIntensity.toFixed(1)}/3`,
    ...recent.map(
      (r, i) =>
        `${i + 1}. ${new Date(r.at).toLocaleDateString('en-GB')} (${dayPart(r.at)})${r.setting ? ` · ${r.setting}` : ''}\n   A: ${r.antecedent}\n   B: ${r.behavior}\n   C: ${r.consequence}${r.probableFunction ? `\n   Likely function: ${FUNCTION_NAME[r.probableFunction]}` : ''}`
    ),
  ].join('\n');
};

export const functionText = (d: PlanData): string => {
  const s = summarizeAbc(d.abc);
  return [
    `FUNCTION SUMMARY — ${d.childName}`,
    `${s.total} events · average intensity ${s.avgIntensity.toFixed(1)}/3`,
    s.conclusive && s.topFunction ? `Likely function: ${FUNCTION_NAME[s.topFunction]} (${Math.round(s.topShare * 100)}% of ${s.tagged} tagged events)` : `Function: inconclusive (${s.tagged} tagged of ${s.total})`,
    `Top antecedents: ${s.antecedents.slice(0, 3).map((a) => `${a.label} (${a.count})`).join('; ') || '—'}`,
    `Top consequences: ${s.consequences.slice(0, 3).map((a) => `${a.label} (${a.count})`).join('; ') || '—'}`,
    `Time of day: morning ${s.byDayPart.morning}, midday ${s.byDayPart.midday}, afternoon ${s.byDayPart.afternoon}, evening ${s.byDayPart.evening}`,
  ].join('\n');
};

export const bipText = (childName: string, p: BipPlan): string =>
  [
    `BEHAVIOR INTERVENTION PLAN — ${childName} (v${p.version})`,
    `Status: ${p.status}${p.reviewDate ? ` · Review: ${p.reviewDate}` : ''}`,
    `Target behavior: ${p.targetBehavior}`,
    `Definition: ${p.operationalDefinition}`,
    `Function: ${p.hypothesizedFunction ? FUNCTION_NAME[p.hypothesizedFunction] : '—'}`,
    `Prevention (antecedent): ${p.antecedentStrategies || '—'}`,
    `Replacement behavior: ${p.replacementBehavior}`,
    `Teaching: ${p.teachingStrategies || '—'}`,
    `Consequence strategies: ${p.consequenceStrategies || '—'}`,
    `Reinforcement: ${p.reinforcement || '—'}`,
    `Crisis plan: ${p.crisisPlan || '—'}`,
    `Data: ${p.dataMethod || '—'}`,
  ].join('\n');

export const reinforcersText = (d: PlanData): string => {
  const list = [...d.reinforcers].sort((a, b) => b.preference - a.preference || a.name.localeCompare(b.name));
  return [`REINFORCER RANKING — ${d.childName}`, ...(list.length ? list.map((r, i) => `${i + 1}. ${r.name} (${r.category}) — ${r.preference}/5`) : ['No reinforcers recorded.'])].join('\n');
};

export const tasksSummary = (tasks: HomeTask[]) => ({ total: tasks.length, done: tasks.filter((t) => t.done).length });

export const tasksText = (d: PlanData): string => {
  const t = tasksSummary(d.tasks);
  return [
    `HOME PRACTICE — ${d.childName}`,
    `${t.done} of ${t.total} tasks completed`,
    ...d.tasks.map((x) => `${x.done ? '[x]' : '[ ]'} ${x.title} (${x.frequency}${x.dueDate ? `, due ${x.dueDate}` : ''})${x.done && x.parentNote ? ` — parent: "${x.parentNote}"` : ''}`),
  ].join('\n');
};

/** The behavior-plan part of the official report: only sections that have data. */
export const planSectionText = (d: PlanData): string => {
  const parts: string[] = [];
  if (d.bip) parts.push(bipText(d.childName, d.bip));
  if (d.abc.length) parts.push(functionText(d));
  if (d.reinforcers.length) parts.push(reinforcersText(d));
  if (d.tasks.length) parts.push(tasksText(d));
  return parts.join('\n\n');
};
