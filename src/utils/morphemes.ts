/**
 * A first guess at the number of morphemes in an utterance, so MLU does not have to be counted by hand.
 * English: one per word, plus -ing, -ed, plural or third-person -s, possessive 's, contractions.
 * Other scripts: one per word. It is only a suggestion: the therapist can always adjust it.
 */
const KEEP_S = new Set(['is', 'was', 'has', 'his', 'this', 'as', 'us', 'yes', 'bus', 'gas', 'kiss', 'less', 'miss', 'boss', 'glass', 'class', 'mess', 'dress', 'grass', 'pass', 'always', 'across', 'its', 'does', 'goes', 'plus', 'focus', 'bonus', 'chess', 'cross', 'loss', 'toss', 'moss', 'press', 'guess', 'princess', 'lens', 'news', 'series', 'species', 'means', 'thanks', 'sometimes', 'perhaps', 'lots', 'sis', 'whats', 'thats', 'hers', 'ours', 'yours', 'theirs']);
const KEEP_ING = new Set(['thing', 'king', 'ring', 'sing', 'wing', 'bring', 'spring', 'string', 'swing', 'morning', 'evening', 'ceiling', 'during', 'nothing', 'something', 'anything', 'everything', 'sting', 'cling']);
const KEEP_ED = new Set(['speed', 'breed', 'bleed', 'proceed', 'indeed', 'hundred', 'sacred', 'naked', 'wicked', 'kindred', 'seed', 'weed', 'greed', 'steed', 'need', 'feed']);

export const suggestMorphemes = (text: string): number => {
  const words = text.trim().split(/\s+/).filter(Boolean);
  let total = 0;
  for (const raw of words) {
    const w = raw.toLowerCase().replace(/[.,!?;:"“”]/g, '');
    if (!w) continue;
    total += 1;
    if (!/^[a-z']+$/.test(w)) continue; // not plain English: count the word only
    if (/n't$/.test(w)) total += 1;
    else if (/'(s|m|re|ll|ve|d)$/.test(w)) total += 1;
    const base = w.replace(/'.*$/, '');
    if (base.length > 4 && base.endsWith('ing') && !KEEP_ING.has(base)) total += 1;
    else if (base.length > 4 && base.endsWith('ed') && !KEEP_ED.has(base)) total += 1;
    else if (base.length > 3 && base.endsWith('s') && !base.endsWith('ss') && !base.endsWith('us') && !base.endsWith('ous') && !KEEP_S.has(base)) total += 1;
  }
  return Math.max(1, total);
};
