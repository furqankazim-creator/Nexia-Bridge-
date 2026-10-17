export type TranslateLang = 'en' | 'ar' | 'ur';

export const TRANSLATE_LANGS: Array<{ code: TranslateLang; label: string; labelAr: string }> = [
  { code: 'en', label: 'English', labelAr: 'الإنجليزية' },
  { code: 'ar', label: 'العربية', labelAr: 'العربية' },
  { code: 'ur', label: 'اردو', labelAr: 'الأردية' },
];

// Guess the source language from the script so the user only picks the target.
export function detectTextLang(text: string): TranslateLang {
  if (/[ٹڈڑںےھچپگژ]/.test(text)) return 'ur';
  if (/[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/.test(text)) return 'ar';
  return 'en';
}

// MyMemory accepts at most ~500 bytes per request, so split on sentence ends.
function chunkText(text: string, max = 450): string[] {
  const sentences = text.match(/[^.!?؟۔\n]+[.!?؟۔]*\s*|\n/g) || [text];
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if ((current + s).length > max && current) {
      chunks.push(current);
      current = '';
    }
    current += s;
    while (current.length > max) {
      chunks.push(current.slice(0, max));
      current = current.slice(max);
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(text: string, from: TranslateLang, to: TranslateLang): Promise<string> {
  if (!text.trim()) return text;
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation failed (${res.status})`);
  const data = await res.json();
  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    throw new Error(data.responseDetails || 'Translation failed');
  }
  return data.responseData.translatedText;
}

export async function translateText(text: string, to: TranslateLang): Promise<string> {
  const from = detectTextLang(text);
  if (from === to) return text;
  const parts = await Promise.all(chunkText(text).map((c) => translateChunk(c, from, to)));
  return parts.join('');
}
