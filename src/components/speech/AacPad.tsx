import React, { useState } from 'react';
import { Volume2 } from 'lucide-react';
import type { BehaviorDatasheet } from '../../hooks/useBehaviorDatasheet';

const BTN_PRIMARY = 'py-2.5 px-4 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] text-white text-sm font-bold active:scale-95 transition disabled:opacity-50';

/** Core words: English, Arabic, a picture cue and the colour AAC boards usually give that kind of word. */
export const CORE_WORDS: { en: string; ar: string; icon: string; color: string }[] = [
  { en: 'want', ar: 'أريد', icon: '🤲', color: 'border-teal-500' },
  { en: 'more', ar: 'أكثر', icon: '➕', color: 'border-indigo-500' },
  { en: 'help', ar: 'ساعدني', icon: '🆘', color: 'border-amber-500' },
  { en: 'stop', ar: 'توقف', icon: '🛑', color: 'border-rose-500' },
  { en: 'go', ar: 'اذهب', icon: '🟢', color: 'border-emerald-500' },
  { en: 'eat', ar: 'آكل', icon: '🍽️', color: 'border-violet-500' },
  { en: 'look', ar: 'انظر', icon: '👀', color: 'border-cyan-500' },
  { en: 'all done', ar: 'انتهيت', icon: '✅', color: 'border-slate-500' },
  { en: 'like', ar: 'أحب', icon: '❤️', color: 'border-pink-500' },
  { en: 'yes', ar: 'نعم', icon: '👍', color: 'border-green-500' },
  { en: 'no', ar: 'لا', icon: '👎', color: 'border-red-500' },
  { en: 'my turn', ar: 'دوري', icon: '🙋', color: 'border-orange-500' },
];

/**
 * Core-vocabulary quick-tally pad: tap what the child selects, see the sentence build up,
 * hear it spoken, and count spontaneous versus prompted selections.
 */
export const AacPad: React.FC<{ ds: BehaviorDatasheet; isAr: boolean }> = ({ ds, isAr }) => {
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [spontaneous, setSpontaneous] = useState(true);
  const [phrase, setPhrase] = useState<string[]>([]); // English ids of the words tapped, in order
  const log = ds.s.aacLog;
  const spontCount = log.filter((a) => a.spontaneous).length;
  const promptedCount = log.length - spontCount;
  const label = (en: string) => (isAr ? CORE_WORDS.find((w) => w.en === en)?.ar ?? en : en);
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

  const tap = (en: string) => {
    ds.set((p) => ({ aacLog: [...p.aacLog, { word: en, spontaneous }] }));
    setPhrase((p) => [...p, en]);
  };
  const undo = () => {
    ds.set((p) => ({ aacLog: p.aacLog.slice(0, -1) }));
    setPhrase((p) => p.slice(0, -1));
  };
  const speak = () => {
    if (!canSpeak || phrase.length === 0) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(phrase.map(label).join(' '));
    u.lang = isAr ? 'ar-SA' : 'en-US';
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  };

  const counts = new Map<string, number>();
  log.forEach((a) => counts.set(a.word, (counts.get(a.word) ?? 0) + 1));

  return (
    <div className="space-y-3" data-testid="aac-pad">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold">{t('Input mode:', 'طريقة الإدخال:')}</span>
        <div className="flex gap-1.5" role="radiogroup" aria-label={t('How it was produced', 'كيف تم')}>
          <button type="button" role="radio" aria-checked={spontaneous} onClick={() => setSpontaneous(true)} className={`px-3 py-1 rounded-lg text-xs font-bold border ${spontaneous ? 'bg-[#1B9E6B] border-[#1B9E6B] text-white' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>{t('Spontaneous', 'تلقائي')} ({spontCount})</button>
          <button type="button" role="radio" aria-checked={!spontaneous} onClick={() => setSpontaneous(false)} className={`px-3 py-1 rounded-lg text-xs font-bold border ${!spontaneous ? 'bg-[#B7791F] border-[#B7791F] text-white' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>{t('Prompted', 'بتلقين')} ({promptedCount})</button>
        </div>
      </div>

      <div className="rounded-2xl bg-[#F4F6FB] dark:bg-[#252044] border border-[#E2E6EA] dark:border-[#38325E] p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#5C706C]">{t('AAC sentence strip:', 'شريط جملة AAC:')}</span>
          <button type="button" onClick={() => setPhrase([])} disabled={phrase.length === 0} className="text-xs font-bold text-rose-600 disabled:opacity-40">{t('Clear', 'مسح')}</button>
        </div>
        <div className="flex flex-wrap gap-1.5 min-h-[36px]" aria-label={t('Sentence so far', 'الجملة حتى الآن')} data-testid="aac-strip">
          {phrase.length === 0 && <span className="text-xs text-[#5C706C] self-center">{t('Words the child taps appear here', 'تظهر هنا الكلمات التي يضغط عليها الطفل')}</span>}
          {phrase.map((w, i) => <span key={i} className="px-2.5 py-1 rounded-lg bg-[#0F766E] text-white text-sm font-bold">{label(w)}</span>)}
        </div>
        <button type="button" onClick={speak} disabled={!canSpeak || phrase.length === 0} className={`${BTN_PRIMARY} w-full flex items-center justify-center gap-2`}>
          <Volume2 className="w-4 h-4" /> {t('Speak phrase', 'انطق العبارة')}
        </button>
        {!canSpeak && <p className="text-[11px] text-amber-700">{t('Speech output is not available in this browser or app view.', 'النطق الصوتي غير متاح في هذا المتصفح أو العرض.')}</p>}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {CORE_WORDS.map((w) => (
          <button key={w.en} type="button" onClick={() => tap(w.en)} aria-label={`${t('Select', 'اختر')} ${label(w.en)}`} className={`relative flex flex-col items-center gap-1 py-3 rounded-2xl border-2 bg-white dark:bg-[#1F1B3A] active:scale-95 transition ${w.color}`}>
            <span className="text-xl leading-none" aria-hidden>{w.icon}</span>
            <span className="text-[11px] font-bold">{label(w.en)}</span>
            {(counts.get(w.en) ?? 0) > 0 && <span className="absolute -top-1.5 -end-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#4338CA] text-white text-[10px] font-bold flex items-center justify-center">{counts.get(w.en)}</span>}
          </button>
        ))}
      </div>

      <p className="text-sm text-[#16302C] dark:text-gray-200">
        {log.length === 0 ? t('No selections yet.', 'لا اختيارات بعد.') : `${log.length} ${t('selections', 'اختيارات')} · ${ds.aacSpontaneousPercent}% ${t('spontaneous', 'تلقائية')} · ${ds.aacDistinct} ${t('different words', 'كلمات مختلفة')}`}
      </p>
      {log.length > 0 && <button type="button" onClick={undo} className="text-xs text-[#5C706C] underline">{t('Undo last selection', 'تراجع عن آخر اختيار')}</button>}
    </div>
  );
};
