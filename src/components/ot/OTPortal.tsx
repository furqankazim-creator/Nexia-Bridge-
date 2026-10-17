import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TherapyPortal } from '../common/TherapyPortal';
import { OtChecklist } from './OtChecklist';
import { TaskAnalysisPanel, TaskDecision } from './TaskAnalysisPanel';
import { SensoryDiet, sensoryLine } from './SensoryDiet';
import { CHAINING_LABEL, coachNote, stepStats } from '../../utils/taskAnalysis';

/** Occupational therapist: task analysis, sensory diet, plan-driven datasheet, checklist, goals, graphs, SOAP, family. */
export const OTPortal: React.FC = () => {
  const { activeChild, otChecklist, otTasks, otSensory, closeTaskSession, language, getSessionPlan } = useApp();
  // The two OT tools on the Today screen are chosen in the plan, and say which plan item they come from.
  const planIds = getSessionPlan(activeChild.id, 'ot').procedureIds;
  const showTasks = planIds.includes('ta_activity');
  const showSensory = planIds.includes('sensory_log');
  const isAr = language === 'ar';
  const fromPlan = (name: string) => <p className="text-[11px] font-semibold text-[#6B6785] mb-1.5 px-1" data-testid="from-plan">{isAr ? 'من خطتك' : 'From your plan'} · {name}</p>;
  const [activeTaskId, setActiveTaskId] = useState('');
  const items = otChecklist.filter((i) => i.childId === activeChild.id);
  const scored = items.filter((i) => i.score !== null);
  const independent = scored.filter((i) => i.score === 'Independent').length;

  // Today's task-analysis scoring (steps scored but not yet saved with a session).
  const tasks = otTasks.filter((x) => x.childId === activeChild.id);
  const live = tasks.map((x) => ({ x, s: stepStats(x) })).filter(({ s }) => s.scored > 0);
  const taskPercent = live.length ? Math.round(live.reduce((a, { s }) => a + s.percent, 0) / live.length) : null;
  const selectedTask = tasks.find((x) => x.id === activeTaskId) ?? tasks[0];
  const sensory = otSensory.filter((l) => l.childId === activeChild.id).slice(0, 3);

  const reportSections: string[] = [];
  if (live.length) {
    reportSections.push(['TASK ANALYSIS', ...live.map(({ x, s }) => {
      const n = coachNote(x);
      return `• ${x.title} (${CHAINING_LABEL[x.chaining].en}): ${s.independent}/${s.total} steps independent (${s.percent}%). ${n.advice}`;
    })].join('\n'));
  }
  if (sensory.length) reportSections.push(['SENSORY DIET', ...sensory.map((l) => `• ${sensoryLine(l)}`)].join('\n'));
  if (scored.length) reportSections.push(['SKILLS CHECKLIST', `${independent} of ${scored.length} skills independent (${Math.round((independent / scored.length) * 100)}%)`, ...scored.map((i) => `• ${i.name}: ${i.score}`)].join('\n'));

  const objective: string[] = [];
  for (const { x, s } of live) objective.push(`Task analysis "${x.title}": ${s.independent}/${s.total} steps independent (${s.percent}%). ${coachNote(x).advice}`);
  if (sensory[0]) objective.push(`Sensory diet: ${sensoryLine(sensory[0])}.`);
  if (scored.length) objective.push(`Skills checklist: ${independent}/${scored.length} independent (${scored.map((i) => `${i.name} ${i.score}`).join('; ')}).`);

  return (
    <TherapyPortal
      role="ot"
      extraTabs={{ checklists: <OtChecklist /> }}
      extraReportSections={reportSections}
      extraObjectiveLines={objective}
      todayTop={(showTasks || showSensory) ? (
        <>
          {showTasks && <div>{fromPlan(isAr ? 'نشاط تحليل المهمة' : 'Task analysis activity')}<TaskAnalysisPanel activeId={activeTaskId} setActiveId={setActiveTaskId} /></div>}
          {showSensory && <div className={showTasks ? 'mt-3' : ''}>{fromPlan(isAr ? 'النظام الحسي وسجل الحس العميق' : 'Sensory diet & proprioceptive log')}<SensoryDiet /></div>}
        </>
      ) : undefined}
      // The task-based recommendation replaces the generic goal recommendation, as in the OT reference design.
      decisionOverride={showTasks ? (selectedTask ? <TaskDecision task={selectedTask} isAr={isAr} /> : <></>) : undefined}
      extraSummary={() => (taskPercent !== null ? { taskAnalysisPercent: taskPercent } : {})}
      onSessionSaved={() => closeTaskSession(activeChild.id)}
    />
  );
};
