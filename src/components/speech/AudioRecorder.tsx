import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AudioClip } from '../../types';

const CARD = 'bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3';
const INPUT = 'w-full text-sm px-3.5 py-2.5 rounded-2xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]';
const BTN = 'py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] text-white text-sm font-bold active:scale-95 transition disabled:opacity-50';
const BTN_GHOST = 'py-2.5 px-4 rounded-xl border-[1.5px] border-[#0F766E] text-[#0F766E] dark:text-teal-300 dark:border-teal-700 text-sm font-semibold bg-white dark:bg-transparent active:scale-95 transition';

/** Recordings stay short and low-bitrate so each one is small enough to save and sync (about 130 KB at most). */
export const MAX_SECONDS = 45;
const MAX_DATA_URL = 200_000;
const BARS = 24;

const pickMime = (): string => {
  const MR = (window as unknown as { MediaRecorder?: { isTypeSupported(m: string): boolean } }).MediaRecorder;
  for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']) if (MR?.isTypeSupported(m)) return m;
  return '';
};

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(blob);
  });

/** Reduce a long list of loudness readings to BARS bars between 0 and 1. */
export const toPeaks = (levels: number[]): number[] => {
  if (levels.length === 0) return [];
  const size = Math.max(1, Math.ceil(levels.length / BARS));
  const out: number[] = [];
  for (let i = 0; i < levels.length; i += size) out.push(Math.max(...levels.slice(i, i + size)));
  const top = Math.max(...out, 0.0001);
  return out.slice(0, BARS).map((v) => Math.round((v / top) * 100) / 100);
};

const Wave: React.FC<{ peaks: number[]; live?: boolean }> = ({ peaks, live }) => (
  <div className={`flex items-center justify-between gap-[3px] h-10 px-1 ${live ? 'opacity-90' : ''}`} aria-hidden data-testid={live ? 'wave-live' : 'wave'}>
    {(peaks.length ? peaks : Array(BARS).fill(0.05)).map((v, i) => (
      <span key={i} className="flex-1 max-w-[6px] rounded-full bg-[#0F766E]" style={{ height: `${Math.max(8, v * 100)}%` }} />
    ))}
  </div>
);

/** Record the child saying a word (kept for the clinical team) or a spoken tip for the parents. */
export const AudioRecorder: React.FC = () => {
  const { activeChild, language, audioClips, addAudioClip, deleteAudioClip, showNotification, currentUserName } = useApp();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof (window as unknown as { MediaRecorder?: unknown }).MediaRecorder !== 'undefined';

  const [kind, setKind] = useState<'sample' | 'tip'>('sample');
  const [limit, setLimit] = useState(5);
  const [label, setLabel] = useState('');
  const [note, setNote] = useState('');
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [live, setLive] = useState<number[]>([]);
  const [preview, setPreview] = useState<{ data: string; seconds: number; mime: string; peaks: number[] } | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const levels = useRef<number[]>([]);
  const chunks = useRef<Blob[]>([]);
  const startedAt = useRef(0);
  const limitRef = useRef(limit);
  limitRef.current = limit;
  const clips = audioClips.filter((c) => c.childId === activeChild.id);

  const release = () => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    ctxRef.current?.close().catch(() => undefined);
    ctxRef.current = null;
  };
  useEffect(() => () => { try { recRef.current?.state === 'recording' && recRef.current.stop(); } catch { /* ignore */ } release(); }, []);

  // Tips default to 20 s, quick child samples to 5 s.
  useEffect(() => { setLimit(kind === 'tip' ? 20 : 5); }, [kind]);

  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      const s = Math.floor((Date.now() - startedAt.current) / 1000);
      setElapsed(s);
      if (s >= limitRef.current) recRef.current?.stop();
    }, 250);
    return () => clearInterval(id);
  }, [recording]);

  const start = async () => {
    setError('');
    setPreview(null);
    levels.current = [];
    setLive([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      streamRef.current = stream;

      // Loudness readings for the waveform. If the browser has no AudioContext the recording still works.
      let timer: ReturnType<typeof setInterval> | null = null;
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AC) {
          const ctx = new AC();
          ctxRef.current = ctx;
          const an = ctx.createAnalyser();
          an.fftSize = 512;
          ctx.createMediaStreamSource(stream).connect(an);
          const buf = new Uint8Array(an.fftSize);
          timer = setInterval(() => {
            an.getByteTimeDomainData(buf);
            let sum = 0;
            for (const v of buf) sum += ((v - 128) / 128) ** 2;
            const rms = Math.sqrt(sum / buf.length);
            levels.current.push(rms);
            setLive((l) => [...l.slice(-(BARS - 1)), Math.min(1, rms * 3)]);
          }, 100);
        }
      } catch { /* waveform is optional */ }

      const mime = pickMime();
      const rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), audioBitsPerSecond: 24000 });
      chunks.current = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.current.push(e.data);
      rec.onstop = async () => {
        if (timer) clearInterval(timer);
        const seconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
        const blob = new Blob(chunks.current, { type: rec.mimeType || mime || 'audio/webm' });
        const peaks = toPeaks(levels.current);
        release();
        setRecording(false);
        try {
          const data = await toDataUrl(blob);
          if (data.length > MAX_DATA_URL) setError(t('That recording is too long to save. Keep it under 45 seconds.', 'التسجيل طويل جداً للحفظ. اجعله أقل من 45 ثانية.'));
          else setPreview({ data, seconds, mime: blob.type, peaks });
        } catch {
          setError(t('Could not read the recording.', 'تعذرت قراءة التسجيل.'));
        }
      };
      recRef.current = rec;
      startedAt.current = Date.now();
      setElapsed(0);
      rec.start();
      setRecording(true);
    } catch (e) {
      release();
      const name = (e as { name?: string })?.name;
      setError(name === 'NotAllowedError' || name === 'SecurityError' ? t('Microphone permission was denied.', 'تم رفض إذن الميكروفون.') : name === 'NotFoundError' ? t('No microphone found.', 'لم يتم العثور على ميكروفون.') : t('Recording is not available here.', 'التسجيل غير متاح هنا.'));
    }
  };

  const stop = () => recRef.current?.state === 'recording' && recRef.current.stop();

  const canSave = !!preview && (kind === 'sample' || note.trim().length > 0);
  const save = () => {
    if (!preview) return;
    const clip: Omit<AudioClip, 'id' | 'at'> = {
      childId: activeChild.id,
      kind,
      label: label.trim() || (kind === 'tip' ? t('Tip for parents', 'نصيحة للأهل') : t('Recording', 'تسجيل')),
      durationSec: preview.seconds,
      mime: preview.mime,
      data: preview.data,
      peaks: preview.peaks,
      ...(note.trim() ? { note: note.trim() } : {}),
    };
    addAudioClip(clip);
    showNotification(kind === 'tip' ? t('Tip saved. Parents can listen to it.', 'تم حفظ النصيحة. يستطيع الأهل الاستماع إليها.') : t('Recording saved.', 'تم حفظ التسجيل.'));
    setPreview(null);
    setLabel('');
    setNote('');
  };

  const lengths = kind === 'tip' ? [20, 45] : [5, 20, 45];

  return (
    <div className="space-y-4" data-testid="audio-recorder">
      <section className={CARD}>
        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#EDE8DF] dark:bg-[#252044]" role="radiogroup" aria-label={t('Recording type', 'نوع التسجيل')}>
          {([['sample', 'Child’s speech sample', 'عينة من كلام الطفل'], ['tip', 'Spoken tip for parents', 'نصيحة صوتية للأهل']] as const).map(([k, en, ar]) => (
            <button key={k} type="button" role="radio" aria-checked={kind === k} disabled={recording} onClick={() => setKind(k)} className={`py-2 rounded-xl text-xs font-bold transition ${kind === k ? 'bg-white dark:bg-[#1F1B3A] shadow-card text-[#0F2A27] dark:text-white' : 'text-[#5C706C]'}`}>{t(en, ar)}</button>
          ))}
        </div>
        <p className="text-xs text-[#5C706C]">
          {kind === 'tip'
            ? t('Record a short spoken tip and write it out too. Parents see both on their Home screen.', 'سجّل نصيحة صوتية قصيرة واكتبها أيضاً. يرى الأهل الاثنين في شاشتهم الرئيسية.')
            : t('Save clear samples to compare over time. Only the clinical team sees these. Ask the parents first.', 'احفظ عينات واضحة للمقارنة عبر الوقت. الفريق الإكلينيكي فقط يراها. اطلب إذن الأهل أولاً.')}
        </p>
        {!supported && <p className="text-xs rounded-xl px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800">{t('Recording is not available in this browser or app view.', 'التسجيل غير متاح في هذا المتصفح أو العرض.')}</p>}

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold shrink-0">{t('Length', 'المدة')}</span>
          <div className="flex gap-1.5" role="radiogroup" aria-label={t('Recording length', 'مدة التسجيل')}>
            {lengths.map((n) => (
              <button key={n} type="button" role="radio" aria-checked={limit === n} disabled={recording} onClick={() => setLimit(n)} className={`px-3 py-1 rounded-full text-xs font-bold border ${limit === n ? 'bg-[#D9F0EA] border-[#0F766E] border-[1.5px] text-[#0B4F49]' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>{n} s</button>
            ))}
          </div>
        </div>

        <input value={label} onChange={(e) => setLabel(e.target.value)} dir="auto" aria-label={t('Recording label', 'عنوان التسجيل')} placeholder={kind === 'tip' ? t('Tip title (optional)', 'عنوان النصيحة (اختياري)') : t('What is being said, e.g. /s/ production for "sun"', 'ماذا يقول، مثال: نطق /س/ في «شمس»')} className={INPUT} disabled={recording} />
        {kind === 'tip' ? (
          <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} dir="auto" aria-label={t('Tip for parents', 'نصيحة للأهل')} placeholder={t('Write the tip the parents will read and hear', 'اكتب النصيحة التي سيقرؤها الأهل ويسمعونها')} className={INPUT} />
        ) : (
          <input value={note} onChange={(e) => setNote(e.target.value)} dir="auto" aria-label={t('Quality note', 'ملاحظة الجودة')} placeholder={t('Quality note (optional), e.g. clean resonance', 'ملاحظة الجودة (اختياري)')} className={INPUT} />
        )}

        {recording && <Wave peaks={live} live />}
        {recording ? (
          <button type="button" onClick={stop} className="w-full py-3 rounded-xl bg-rose-600 text-white font-bold flex items-center justify-center gap-2 animate-pulse"><Square className="w-4 h-4 fill-current" /> {t('Stop', 'إيقاف')} · {elapsed}s / {limit}s</button>
        ) : (
          <button type="button" onClick={start} disabled={!supported} className={`${BTN} w-full flex items-center justify-center gap-2`}><Mic className="w-4 h-4" /> {t(`Record ${limit}s`, `تسجيل ${limit} ث`)}</button>
        )}
        {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
        {preview && (
          <div className="space-y-2 pt-1">
            <Wave peaks={preview.peaks} />
            <audio controls src={preview.data} className="w-full" aria-label={t('Preview', 'معاينة')} />
            {kind === 'tip' && !note.trim() && <p className="text-xs text-amber-700">{t('Write the tip text to save it.', 'اكتب نص النصيحة لحفظها.')}</p>}
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={save} disabled={!canSave} className={BTN}>{kind === 'tip' ? t('Save tip for parents', 'حفظ النصيحة للأهل') : t('Save recording', 'حفظ التسجيل')}</button>
              <button type="button" onClick={() => setPreview(null)} className={BTN_GHOST}>{t('Discard', 'تجاهل')}</button>
            </div>
          </div>
        )}
      </section>

      <section className={CARD}>
        <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Saved recordings', 'التسجيلات المحفوظة')}</h3>
        {clips.length === 0 && <p className="text-sm text-[#5C706C]">{t('No recordings yet.', 'لا توجد تسجيلات بعد.')}</p>}
        {clips.map((c) => (
          <div key={c.id} className="space-y-1.5 py-2 border-b border-[#EDE8DF] dark:border-[#38325E] last:border-b-0" data-testid="audio-clip" data-kind={c.kind ?? 'sample'}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold min-w-0 truncate" dir="auto">{c.kind === 'tip' && <span className="me-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">{t('Parent tip', 'نصيحة للأهل')}</span>}{c.label}</p>
              <button type="button" aria-label={t('Delete recording', 'حذف التسجيل')} onClick={() => deleteAudioClip(c.id)} className="p-1 text-[#9AA7A4] hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
            <Wave peaks={c.peaks ?? []} />
            <audio controls preload="none" src={c.data} className="w-full" />
            <p className="text-[11px] text-[#5C706C]" dir="auto">{t('Logged audio', 'تسجيل مسجل')}: {c.label} · {new Date(c.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · {c.durationSec}s{c.note ? ` · ${c.note}` : ''}{c.kind === 'tip' ? ` · ${t('visible to parents', 'ظاهرة للأهل')}` : ''}</p>
          </div>
        ))}
      </section>
    </div>
  );
};
