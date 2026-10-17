import React, { useEffect, useRef, useState } from 'react';
import { Download, Mic, Pause, Play, Square, X } from 'lucide-react';
import type { useVoiceDictation } from '../../hooks/useVoiceDictation';

type Voice = ReturnType<typeof useVoiceDictation>;

const clock = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
const BARS = 24;

const HINT: Record<string, string> = {
  en: 'Speak naturally. Say “comma”, “full stop”, “question mark” or “new line” to add punctuation.',
  ar: 'تحدث بشكل طبيعي. قل «فاصلة» أو «نقطة» أو «علامة استفهام» أو «سطر جديد» لإضافة علامات الترقيم.',
  ur: 'قدرتی انداز میں بولیں۔ رموزِ اوقاف کے لیے «کوما»، «فل اسٹاپ»، «سوالیہ نشان» یا «نئی لائن» کہیں۔',
};

/** The recorder: live level, timer, the words as they are heard, pause and stop; then the audio to listen back to. */
export const DictationPanel: React.FC<{ v: Voice; field: string; isAr: boolean }> = ({ v, field, isAr }) => {
  const live = v.isListening && v.activeField === field;
  const [bars, setBars] = useState<number[]>(() => Array(BARS).fill(0));
  const last = useRef(0);
  useEffect(() => {
    if (!live) { setBars(Array(BARS).fill(0)); return; }
    // The level arrives about every 70 ms: keep a short history so the bars scroll like a recorder.
    if (v.paused) return;
    if (v.level === last.current && v.level === 0) { setBars((b) => [...b.slice(1), 0]); return; }
    last.current = v.level;
    setBars((b) => [...b.slice(1), v.level]);
  }, [v.level, live, v.paused]);

  const mine = v.recording && v.recording.field === field && !live ? v.recording : null;
  const t = (en: string, ar: string) => (isAr ? ar : en);

  return (
    <>
      {live && (
        <div className="rounded-2xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/50 p-3 space-y-2.5 animate-in fade-in" data-testid="dictation-panel" data-paused={v.paused ? 'true' : 'false'}>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-200">
              <span className={`w-2.5 h-2.5 rounded-full bg-rose-600 ${v.paused ? '' : 'animate-pulse'}`} />
              {v.paused ? t('Paused', 'متوقف مؤقتاً') : v.recorderOnly ? t('Recording', 'جارٍ التسجيل') : t('Listening', 'جارٍ الاستماع')}
              <span className="tabular-nums font-mono" data-testid="dictation-timer">{clock(v.elapsed)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <button type="button" onClick={v.paused ? v.resumeDictation : v.pauseDictation} aria-label={v.paused ? t('Resume', 'متابعة') : t('Pause', 'إيقاف مؤقت')} data-testid="dictation-pause" className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 text-rose-700 flex items-center justify-center active:scale-95">
                {v.paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
              <button type="button" onClick={v.stopDictation} aria-label={t('Stop', 'إيقاف')} data-testid="dictation-stop" className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center active:scale-95">
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </span>
          </div>

          <div className="flex items-end gap-[3px] h-9" aria-hidden="true" data-testid="dictation-level">
            {bars.map((b, i) => <span key={i} className="flex-1 rounded-full bg-rose-500/80 dark:bg-rose-400 transition-all duration-100" style={{ height: `${Math.max(8, Math.round(b * 100))}%`, opacity: v.paused ? 0.3 : 1 }} />)}
          </div>

          {v.recorderOnly ? (
            <p className="text-xs text-rose-900 dark:text-rose-100" data-testid="recorder-only-note">{t('This device cannot turn speech into text here. Your voice is being recorded: stop, listen back, then type the note.', 'لا يستطيع هذا الجهاز تحويل الكلام إلى نص هنا. يتم تسجيل صوتك: أوقف التسجيل واستمع إليه ثم اكتب الملاحظة.')}</p>
          ) : (
            <>
              <p className="min-h-[2.5rem] text-sm font-medium text-slate-900 dark:text-slate-100 rounded-xl bg-white/80 dark:bg-slate-900/70 border border-rose-200 dark:border-rose-900 px-3 py-2" dir="auto" data-testid="dictation-heard">
                {v.interimText || <span className="text-slate-500">{v.paused ? t('Paused. Press play to continue.', 'متوقف. اضغط تشغيل للمتابعة.') : t('Speak now…', 'تحدث الآن…')}</span>}
              </p>
              <p className="text-[11px] text-rose-900/80 dark:text-rose-100/80">{HINT[v.dictLang]}</p>
            </>
          )}
        </div>
      )}

      {mine && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 space-y-1.5" data-testid="dictation-recording">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="font-bold flex items-center gap-1.5"><Mic className="w-3.5 h-3.5 text-indigo-600" /> {t('Your recording', 'تسجيلك')} · {clock(mine.seconds)}</span>
            <span className="flex items-center gap-3">
              <a href={mine.url} download={`dictation-${field}.${mine.mime.includes('mp4') ? 'm4a' : 'webm'}`} aria-label={t('Download recording', 'تنزيل التسجيل')} className="text-indigo-700 dark:text-indigo-300"><Download className="w-4 h-4" /></a>
              <button type="button" onClick={v.clearRecording} aria-label={t('Remove recording', 'حذف التسجيل')} className="text-slate-500"><X className="w-4 h-4" /></button>
            </span>
          </div>
          <audio controls src={mine.url} className="w-full h-9" />
          <p className="text-[10px] text-slate-500">{t('Kept on this screen only, to check the text. It is not saved with the note.', 'محفوظ على هذه الشاشة فقط للتحقق من النص. لا يُحفظ مع الملاحظة.')}</p>
        </div>
      )}
    </>
  );
};
