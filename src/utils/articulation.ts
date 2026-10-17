import type { ArticulationLog, ArticulationLevel, SoundPosition } from '../types';

export const LEVELS: ArticulationLevel[] = ['isolation', 'syllable', 'word', 'phrase', 'sentence', 'conversation'];
export const POSITIONS: SoundPosition[] = ['initial', 'medial', 'final'];

export const totalOf = (l: Pick<ArticulationLog, 'correct' | 'approximated' | 'incorrect'>) => l.correct + l.approximated + l.incorrect;
export const accuracyOf = (l: Pick<ArticulationLog, 'correct' | 'approximated' | 'incorrect'>): number | null => {
  const n = totalOf(l);
  return n ? Math.round((l.correct / n) * 100) : null;
};

export const normalizeSound = (s: string): string => s.trim().replace(/^\/+|\/+$/g, '').toLowerCase();

export interface ArticulationRow {
  sound: string;
  position: SoundPosition;
  /** The highest level practised so far for this sound and position. */
  level: ArticulationLevel;
  correct: number;
  total: number;
  accuracy: number;
  sessions: number;
}

/** One row per sound and position: accuracy across everything logged, and the highest level reached. */
export const articulationSummary = (logs: ArticulationLog[]): ArticulationRow[] => {
  const map = new Map<string, ArticulationRow>();
  for (const l of logs) {
    const n = totalOf(l);
    if (!n) continue;
    const key = `${normalizeSound(l.sound)}|${l.position}`;
    const row = map.get(key) ?? { sound: normalizeSound(l.sound), position: l.position, level: l.level, correct: 0, total: 0, accuracy: 0, sessions: 0 };
    row.correct += l.correct;
    row.total += n;
    row.sessions += 1;
    if (LEVELS.indexOf(l.level) > LEVELS.indexOf(row.level)) row.level = l.level;
    map.set(key, row);
  }
  return [...map.values()]
    .map((r) => ({ ...r, accuracy: Math.round((r.correct / r.total) * 100) }))
    .sort((a, b) => a.sound.localeCompare(b.sound) || POSITIONS.indexOf(a.position) - POSITIONS.indexOf(b.position));
};

/** Accuracy over time for one sound (all positions), oldest first. */
export const accuracyTrend = (logs: ArticulationLog[], sound: string) =>
  logs
    .filter((l) => normalizeSound(l.sound) === normalizeSound(sound) && totalOf(l) > 0)
    .sort((a, b) => a.at.localeCompare(b.at))
    .map((l) => ({ at: l.at, accuracy: accuracyOf(l) as number, position: l.position, level: l.level }));
