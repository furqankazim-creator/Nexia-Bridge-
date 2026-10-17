import React from 'react';
import { useApp } from '../../context/AppContext';
import { TherapyPortal } from '../common/TherapyPortal';
import { PracticeTab } from './PracticeTab';
import { mondayOf, sentenceStats, weeklyStats } from '../../utils/sentence';
import { speechSections } from '../../utils/speechReport';

/** Speech therapist: the shared workspace plus Practice (weekly questions, sentences, articulation, recordings). */
export const SpeechPortal: React.FC = () => {
  const { activeChild, weeklySets, sentenceTasks, articulationLogs } = useApp();
  const weekStart = mondayOf(new Date());
  const weekly = weeklyStats(weeklySets.find((x) => x.childId === activeChild.id && x.weekStart === weekStart));
  const sentences = sentenceTasks.filter((x) => x.childId === activeChild.id);
  const articulation = articulationLogs.filter((x) => x.childId === activeChild.id);

  const objective: string[] = [];
  if (weekly.asked) objective.push(`Weekly questions: ${weekly.independent}/${weekly.asked} independent (${weekly.independentPercent}%).`);
  for (const s of sentences) {
    const st = sentenceStats(s);
    if (st.attempts) objective.push(`Sentence building "${s.target}": ${st.independent}/${st.attempts} independent.`);
  }

  return (
    <TherapyPortal
      role="speech"
      extraTabs={{ practice: <PracticeTab /> }}
      extraReportSections={speechSections({ weekStart, weekly, sentences, articulation })}
      extraObjectiveLines={objective}
    />
  );
};
