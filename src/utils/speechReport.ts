import type { ArticulationLog, SentenceTask } from '../types';
import type { WeeklyStats } from './sentence';
import { sentenceStats, weekLabel } from './sentence';
import { articulationSummary } from './articulation';

/** The speech-only sections of the report: weekly questions, sentence building, articulation. */
export const speechSections = (input: { weekStart: string; weekly: WeeklyStats; sentences: SentenceTask[]; articulation: ArticulationLog[] }): string[] => {
  const out: string[] = [];
  if (input.weekly.total > 0) {
    const lines = [`WEEKLY QUESTIONS (${weekLabel(input.weekStart)})`, `${input.weekly.asked} of ${input.weekly.total} asked${input.weekly.independentPercent !== null ? ` · ${input.weekly.independentPercent}% independent` : ''}`];
    for (const b of input.weekly.byType) lines.push(`• ${b.type}: ${b.independent}/${b.asked}`);
    out.push(lines.join('\n'));
  }
  const withAttempts = input.sentences.filter((s) => s.attempts.length > 0);
  if (withAttempts.length) {
    const lines = ['SENTENCE BUILDING'];
    for (const s of withAttempts) {
      const st = sentenceStats(s);
      lines.push(`• "${s.target}" (${st.targetWords} words): ${st.independent}/${st.attempts} independent`);
    }
    out.push(lines.join('\n'));
  }
  if (input.articulation.length) {
    const lines = ['ARTICULATION'];
    for (const r of articulationSummary(input.articulation)) lines.push(`• /${r.sound}/ ${r.position}: ${r.accuracy}% accurate (${r.correct}/${r.total}) at ${r.level} level`);
    out.push(lines.join('\n'));
  }
  return out;
};
