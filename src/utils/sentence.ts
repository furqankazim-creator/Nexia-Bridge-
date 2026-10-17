import type { SentenceTask, WeeklyQuestion, WeeklyQuestionSet, WhType } from '../types';

/** Lower-case, drop punctuation (Latin + Arabic) and Arabic diacritics, collapse spaces. */
export const normalizeText = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[ً-ٰٟـ]/g, '') // Arabic diacritics and tatweel
    .replace(/[.,!?;:،؛؟"'“”‘’()\-_/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const tokenize = (s: string): string[] => normalizeText(s).split(' ').filter(Boolean);

/** The child's sentence matches the target when the same words are in the same order. */
export const sentenceMatches = (produced: string, target: string): boolean => {
  const a = tokenize(produced);
  const b = tokenize(target);
  return a.length > 0 && a.length === b.length && a.every((w, i) => w === b[i]);
};

/** A stable shuffle (same task, same order every render) that never returns the sentence in order. */
export const shuffleWords = (words: string[], seed: string): string[] => {
  if (words.length < 2) return [...words];
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
  const rand = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
  const out = [...words];
  for (let attempt = 0; attempt < 8; attempt++) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (out.some((w, i) => w !== words[i])) break;
  }
  return out;
};

export interface SentenceStats {
  attempts: number;
  correct: number;
  independent: number;
  independentPercent: number | null;
  targetWords: number;
}

export const sentenceStats = (t: SentenceTask): SentenceStats => {
  const attempts = t.attempts.length;
  const correct = t.attempts.filter((a) => a.correct).length;
  const independent = t.attempts.filter((a) => a.independent).length;
  return { attempts, correct, independent, independentPercent: attempts ? Math.round((independent / attempts) * 100) : null, targetWords: tokenize(t.target).length };
};

export const SENTENCE_LIBRARY: { level: string; en: string[]; ar: string[] }[] = [
  { level: '2 words', en: ['dog run', 'more juice', 'big ball'], ar: ['كلب يجري', 'عصير أكثر'] },
  { level: '3 words', en: ['dog on bed', 'I want apple', 'cup in box'], ar: ['الكلب على السرير', 'أريد تفاحة'] },
  { level: '4+ words', en: ['The dog is sleeping', 'I want more juice please', 'The ball is under the table'], ar: ['الولد يأكل التفاحة الحمراء'] },
];

/* ---------- weekly questions ---------- */

export const WH_TYPES: WhType[] = ['who', 'what', 'where', 'when', 'why', 'how'];

const pad = (n: number) => String(n).padStart(2, '0');
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Monday of the week containing `d`, as yyyy-mm-dd (local time). */
export const mondayOf = (d: Date): string => {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  c.setDate(c.getDate() - ((c.getDay() + 6) % 7));
  return toISODate(c);
};

export const shiftWeek = (weekStart: string, weeks: number): string => {
  const [y, m, d] = weekStart.split('-').map(Number);
  const c = new Date(y, m - 1, d + weeks * 7);
  return toISODate(c);
};

export const weekLabel = (weekStart: string, locale = 'en-GB'): string => {
  const [y, m, d] = weekStart.split('-').map(Number);
  const a = new Date(y, m - 1, d);
  const b = new Date(y, m - 1, d + 6);
  const f = (x: Date) => x.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  return `${f(a)} – ${f(b)}`;
};

export interface WeeklyStats {
  asked: number;
  total: number;
  independent: number;
  prompted: number;
  incorrect: number;
  independentPercent: number | null;
  byType: { type: WhType; asked: number; independent: number }[];
}

export const weeklyStats = (set: WeeklyQuestionSet | undefined): WeeklyStats => {
  const qs: WeeklyQuestion[] = set?.questions ?? [];
  const asked = qs.filter((q) => q.result !== null);
  const independent = asked.filter((q) => q.result === '+').length;
  return {
    asked: asked.length,
    total: qs.length,
    independent,
    prompted: asked.filter((q) => q.result === 'P').length,
    incorrect: asked.filter((q) => q.result === '-').length,
    independentPercent: asked.length ? Math.round((independent / asked.length) * 100) : null,
    byType: WH_TYPES.map((type) => {
      const of = asked.filter((q) => q.type === type);
      return { type, asked: of.length, independent: of.filter((q) => q.result === '+').length };
    }).filter((x) => x.asked > 0),
  };
};

/** Plain-text list for the family's home practice. */
export const questionsAsHomeText = (set: WeeklyQuestionSet): string =>
  set.questions.map((q, i) => `${i + 1}. ${q.text}${q.answer ? `  →  ${q.answer}` : ''}`).join('\n');
