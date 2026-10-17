import { useState, useRef, useEffect, useCallback } from 'react';
import { formatDictation, joinDictation } from '../utils/dictationText';

export type SoapFieldKey = 'S' | 'O' | 'A' | 'P';
export type DictationLang = 'en' | 'ar' | 'ur';

interface VoiceDictationOptions {
  language?: 'en' | 'ar';
  role?: string;
  /** Keep the audio of each take so it can be played back. Default true. */
  keepAudio?: boolean;
}

export const DICTATION_LANGS: Array<{ code: DictationLang; locale: string; label: string }> = [
  { code: 'en', locale: 'en-US', label: 'English' },
  { code: 'ar', locale: 'ar-SA', label: 'العربية' },
  { code: 'ur', locale: 'ur-PK', label: 'اردو' },
];

const LANG_KEY = 'nexia.dictationLang.v1';

const getRecognitionCtor = (): any =>
  typeof window === 'undefined' ? null : (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;

const canCaptureAudio = () =>
  typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof (window as any).MediaRecorder !== 'undefined';

const loadLang = (fallback: DictationLang): DictationLang => {
  try {
    const v = window.localStorage.getItem(LANG_KEY);
    if (v === 'en' || v === 'ar' || v === 'ur') return v;
  } catch {
    // storage unavailable
  }
  return fallback;
};

const join = (...parts: string[]) => parts.map((p) => p.trim()).filter(Boolean).join(' ');

export type DictationError = 'unsupported' | 'denied' | 'no-mic' | 'network' | 'language' | 'other' | null;

/** The audio of the last dictation, kept in memory so the therapist can listen back and check the text. */
export interface DictationRecording {
  url: string;
  seconds: number;
  field: string;
  mime: string;
}

export function useVoiceDictation({ language = 'en', keepAudio = true }: VoiceDictationOptions = {}) {
  const [dictLang, setDictLangState] = useState<DictationLang>(() => loadLang(language === 'ar' ? 'ar' : 'en'));
  const [activeField, setActiveField] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<DictationError>(null);
  const [level, setLevel] = useState(0); // 0..1 live microphone loudness
  const [elapsed, setElapsed] = useState(0); // seconds recorded in this take
  const [recording, setRecording] = useState<DictationRecording | null>(null);
  const [recorderOnly, setRecorderOnly] = useState(false);
  const hasSpeechSupport = !!getRecognitionCtor();
  const canRecord = keepAudio && canCaptureAudio();

  const recognitionRef = useRef<any>(null);
  const restartTimerRef = useRef<any>(null);
  const listeningRef = useRef(false);
  const pausedRef = useRef(false);
  const activeFieldRef = useRef<string | null>(null);
  const sessionFinalRef = useRef('');
  const langRef = useRef<DictationLang>(dictLang);
  const onUpdateRef = useRef<((text: string) => void) | null>(null);
  const baseRef = useRef('');
  const committedRef = useRef('');
  const interimRef = useRef('');
  const startedAtRef = useRef(0);
  const noMediaRetryRef = useRef(false);

  // microphone side: level meter, timer and audio recorder
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<any>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const takeStartRef = useRef(0);
  const takeMsRef = useRef(0); // time recorded before the latest pause
  const fieldOfTakeRef = useRef('');

  const setDictLang = useCallback((l: DictationLang) => {
    langRef.current = l;
    setDictLangState(l);
    try {
      window.localStorage.setItem(LANG_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const emit = (sessionFinal: string, interim: string) => {
    const cb = onUpdateRef.current;
    if (!cb) return;
    // What was said is cleaned up (spoken punctuation, capital letters) and written into the field live.
    const said = formatDictation(join(committedRef.current, sessionFinal, interim), langRef.current);
    cb(joinDictation(baseRef.current, said));
  };

  const stopMeter = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    try { audioCtxRef.current?.close(); } catch { /* already closed */ }
    audioCtxRef.current = null;
    setLevel(0);
  };

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const finishRecorder = (keep: boolean) => {
    const rec = recorderRef.current;
    recorderRef.current = null;
    if (!rec) return;
    const field = fieldOfTakeRef.current;
    const seconds = Math.max(1, Math.round((takeMsRef.current + (pausedRef.current ? 0 : Date.now() - takeStartRef.current)) / 1000));
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
      chunksRef.current = [];
      if (keep && blob.size > 0) {
        setRecording((prev) => {
          if (prev) URL.revokeObjectURL(prev.url);
          return { url: URL.createObjectURL(blob), seconds, field, mime: blob.type };
        });
      }
    };
    try { if (rec.state !== 'inactive') rec.stop(); else rec.onstop?.(new Event('stop') as any); } catch { /* already stopped */ }
  };

  const startMeter = (stream: MediaStream) => {
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new Ctx();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.fftSize);
      let last = 0;
      const tick = (now: number) => {
        rafRef.current = requestAnimationFrame(tick);
        if (now - last < 70) return;
        last = now;
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
        setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 4));
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // no level meter on this device; dictation still works
    }
    takeStartRef.current = Date.now();
    takeMsRef.current = 0;
    setElapsed(0);
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      setElapsed(Math.floor((takeMsRef.current + Date.now() - takeStartRef.current) / 1000));
    }, 250);
  };

  const teardown = useCallback((keepAudio = true) => {
    listeningRef.current = false;
    pausedRef.current = false;
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onresult = rec.onerror = rec.onend = rec.onspeechstart = rec.onspeechend = null;
      try {
        rec.stop();
      } catch {
        // already stopped
      }
    }
    finishRecorder(keepAudio);
    stopMeter();
    releaseStream();
    onUpdateRef.current = null;
    activeFieldRef.current = null;
    setIsListening(false);
    setIsSpeaking(false);
    setPaused(false);
    setRecorderOnly(false);
    setActiveField(null);
    setInterimText('');
    interimRef.current = '';
    sessionFinalRef.current = '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopDictation = useCallback(() => {
    // Keep whatever was heard but not yet finalised, so the last words are never lost.
    if (interimRef.current.trim() || sessionFinalRef.current.trim()) {
      committedRef.current = join(committedRef.current, sessionFinalRef.current, interimRef.current);
      sessionFinalRef.current = '';
      interimRef.current = '';
      emit('', '');
    }
    teardown(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teardown]);

  const launchRecognition = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!listeningRef.current || pausedRef.current || !Ctor) return;
    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.lang = DICTATION_LANGS.find((l) => l.code === langRef.current)!.locale;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    startedAtRef.current = Date.now();

    rec.onspeechstart = () => setIsSpeaking(true);
    rec.onspeechend = () => setIsSpeaking(false);

    rec.onresult = (event: any) => {
      // Rebuild from every result of THIS session: robust to the engine revising earlier words.
      let sessionFinal = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        const r = event.results[i];
        const t = r[0]?.transcript || '';
        if (r.isFinal) sessionFinal = join(sessionFinal, t);
        else interim = join(interim, t);
      }
      interimRef.current = interim;
      setInterimText(formatDictation(interim, langRef.current));
      setIsSpeaking(!!interim);
      sessionFinalRef.current = sessionFinal;
      emit(sessionFinal, interim);
    };

    rec.onerror = (e: any) => {
      const type = e?.error || '';
      if (type === 'no-speech' || type === 'aborted') return; // just a pause
      // Some phones cannot share the microphone between the recogniser and the level meter. Drop the meter once and retry.
      if (type === 'audio-capture' && streamRef.current && !noMediaRetryRef.current) {
        noMediaRetryRef.current = true;
        finishRecorder(false);
        stopMeter();
        releaseStream();
        committedRef.current = join(committedRef.current, sessionFinalRef.current, interimRef.current);
        sessionFinalRef.current = '';
        interimRef.current = '';
        restartTimerRef.current = setTimeout(launchRecognition, 300);
        return;
      }
      if (type === 'not-allowed' || type === 'service-not-allowed') setError('denied');
      else if (type === 'audio-capture') setError('no-mic');
      else if (type === 'network') setError('network');
      else if (type === 'language-not-supported') setError('language');
      else setError('other');
      stopDictation();
    };

    rec.onend = () => {
      if (!listeningRef.current || pausedRef.current) return;
      // Engines end sessions after silence; bank the text and restart for hands-free dictation.
      committedRef.current = join(committedRef.current, sessionFinalRef.current, interimRef.current);
      sessionFinalRef.current = '';
      interimRef.current = '';
      setInterimText('');
      const tooFast = Date.now() - startedAtRef.current < 600;
      restartTimerRef.current = setTimeout(launchRecognition, tooFast ? 600 : 120);
    };

    try {
      rec.start();
    } catch {
      setError('other');
      stopDictation();
    }
  }, [stopDictation]);

  const startDictation = useCallback(
    async (field: string, currentValue: string, onUpdate: (newVal: string) => void) => {
      if (listeningRef.current && activeFieldRef.current === field) {
        stopDictation();
        return;
      }
      if (listeningRef.current) teardown(true);

      const speech = !!getRecognitionCtor();
      if (!speech && !(keepAudio && canCaptureAudio())) {
        setError('unsupported');
        return;
      }

      setError(null);
      noMediaRetryRef.current = false;
      listeningRef.current = true;
      pausedRef.current = false;
      activeFieldRef.current = field;
      fieldOfTakeRef.current = field;
      onUpdateRef.current = onUpdate;
      baseRef.current = currentValue || '';
      committedRef.current = '';
      interimRef.current = '';
      sessionFinalRef.current = '';
      setActiveField(field);
      setIsListening(true);
      setPaused(false);
      setInterimText('');
      setRecorderOnly(!speech);

      // The recorder (level meter, timer, audio) is only used where the screen shows it. Otherwise the recogniser alone listens.
      if (keepAudio && canCaptureAudio()) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
          if (!listeningRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
          streamRef.current = stream;
          startMeter(stream);
          if (keepAudio) try {
            const mime = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'].find((m) => (window as any).MediaRecorder.isTypeSupported?.(m));
            const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
            chunksRef.current = [];
            mr.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunksRef.current.push(e.data); };
            mr.start(1000);
            recorderRef.current = mr;
          } catch {
            // recording is optional; the text still comes from the recogniser
          }
        } catch (e: any) {
          const name = e?.name || '';
          if (name === 'NotAllowedError' || name === 'SecurityError') { setError('denied'); teardown(false); return; }
          if (name === 'NotFoundError' || name === 'OverconstrainedError') { setError('no-mic'); teardown(false); return; }
          // Anything else: carry on without the meter.
        }
      }
      if (!listeningRef.current) return;
      if (speech) launchRecognition();
    },
    [launchRecognition, stopDictation, teardown, keepAudio]
  );

  const pauseDictation = useCallback(() => {
    if (!listeningRef.current || pausedRef.current) return;
    // Bank what was heard, then stop listening until resumed.
    committedRef.current = join(committedRef.current, sessionFinalRef.current, interimRef.current);
    sessionFinalRef.current = '';
    interimRef.current = '';
    emit('', '');
    pausedRef.current = true;
    setPaused(true);
    setInterimText('');
    setIsSpeaking(false);
    takeMsRef.current += Date.now() - takeStartRef.current;
    try { recorderRef.current?.pause(); } catch { /* not recording */ }
    const rec = recognitionRef.current;
    recognitionRef.current = null;
    if (rec) {
      rec.onresult = rec.onerror = rec.onend = rec.onspeechstart = rec.onspeechend = null;
      try { rec.stop(); } catch { /* already stopped */ }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resumeDictation = useCallback(() => {
    if (!listeningRef.current || !pausedRef.current) return;
    pausedRef.current = false;
    setPaused(false);
    takeStartRef.current = Date.now();
    try { recorderRef.current?.resume(); } catch { /* not recording */ }
    launchRecognition();
  }, [launchRecognition]);

  const clearRecording = useCallback(() => {
    setRecording((prev) => {
      if (prev) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  // Switching language mid-dictation restarts the engine in the new language.
  useEffect(() => {
    langRef.current = dictLang;
    const rec = recognitionRef.current;
    if (listeningRef.current && !pausedRef.current && rec) {
      try {
        rec.stop(); // onend banks the text and relaunches with the new locale
      } catch {
        // ignore
      }
    }
  }, [dictLang]);

  useEffect(() => () => { teardown(false); }, [teardown]);

  return {
    activeField,
    isListening,
    isSpeaking,
    paused,
    interimText,
    level,
    elapsed,
    recording,
    recorderOnly,
    canRecord,
    dictLang,
    setDictLang,
    error,
    clearError: () => setError(null),
    hasSpeechSupport,
    startDictation,
    stopDictation,
    pauseDictation,
    resumeDictation,
    clearRecording,
  };
}
