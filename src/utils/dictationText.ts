import type { DictationLang } from '../hooks/useVoiceDictation';

/**
 * Turns what the speech engine hears into a written note. People say "comma" and "new line"; engines write the words.
 * Spoken punctuation becomes the mark, spacing is tidied, and English sentences start with a capital letter.
 */
const PUNCT = '.,?!:;،؛؟۔';
type Rule = [RegExp, string];

// A word boundary that also works for Arabic and Urdu letters.
const B = (phrase: string): RegExp => new RegExp(`(^|[\\s])(?:${phrase})(?=$|[\\s.,?!:;،؛؟۔])`, 'giu');

const RULES: Record<DictationLang, Rule[]> = {
  en: [
    [B('new paragraph'), '$1\n\n'],
    [B('new line|newline'), '$1\n'],
    [B('question mark'), '?'],
    [B('exclamation mark|exclamation point'), '!'],
    [B('full stop'), '.'],
    [B('semicolon|semi colon'), ';'],
    [B('colon'), ':'],
    [B('comma'), ','],
  ],
  ar: [
    [B('فقرة جديدة'), '$1\n\n'],
    [B('سطر جديد'), '$1\n'],
    [B('علامة استفهام'), '؟'],
    [B('علامة تعجب'), '!'],
    [B('فاصلة منقوطة'), '؛'],
    [B('فاصلة'), '،'],
    [B('نقطتان'), ':'],
    [B('نقطة'), '.'],
  ],
  ur: [
    [B('نیا پیراگراف'), '$1\n\n'],
    [B('نئی لائن'), '$1\n'],
    [B('سوالیہ نشان'), '؟'],
    [B('فل اسٹاپ|فل سٹاپ|نقطہ'), '۔'],
    [B('کوما'), '،'],
  ],
};

const capitalize = (s: string) => s.replace(/^(\s*)(\p{Ll})/u, (_m, sp: string, ch: string) => sp + ch.toUpperCase());

export function formatDictation(raw: string, lang: DictationLang): string {
  let t = (raw ?? '').replace(/[ \t]+/g, ' ').trim();
  if (!t) return '';
  for (const [re, to] of RULES[lang]) t = t.replace(re, to);
  // The spoken mark replaced a word including the space before it: join it to the previous word.
  t = t.replace(new RegExp(`\\s+([${PUNCT}])`, 'gu'), '$1');
  // One space after a mark that is followed by a word; none around line breaks.
  t = t.replace(new RegExp(`([${PUNCT}])(?=[\\p{L}\\p{N}])`, 'gu'), '$1 ');
  t = t.replace(/[ \t]*\n[ \t]*/g, '\n').replace(/ {2,}/g, ' ').trim();
  if (lang === 'en') t = t.replace(/(^|[.?!]\s+|\n)(\p{Ll})/gu, (_m, pre: string, ch: string) => pre + ch.toUpperCase());
  return lang === 'en' ? t.replace(/^(\p{Lu})/u, (c) => c.toLowerCase()) : t; // the first letter is decided by what is already in the note
}

const ENDS_SENTENCE = /[.?!؟۔]\s*$|\n\s*$/u;

/** Add dictated text after what is already in the note: right spacing, and a capital after a full stop. */
export function joinDictation(base: string, said: string): string {
  if (!said) return base;
  const b = base.replace(/[ \t]+$/, '');
  const startsWithMark = new RegExp(`^[${PUNCT}]`, 'u').test(said);
  const startsWithBreak = said.startsWith('\n');
  const fresh = !b.trim() || ENDS_SENTENCE.test(b);
  const text = fresh ? capitalize(said) : said;
  if (!b.trim()) return text;
  const sep = startsWithMark || startsWithBreak || b.endsWith('\n') ? '' : ' ';
  return `${b}${sep}${text}`;
}
