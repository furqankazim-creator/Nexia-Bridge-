import React, { useMemo, useRef, useState } from 'react';
import { Camera, Mic, MicOff, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { SentenceTask } from '../../types';
import { PROMPT_LEVELS } from '../../hooks/useBehaviorDatasheet';
import { DICTATION_LANGS, useVoiceDictation } from '../../hooks/useVoiceDictation';
import { downscaleImage } from '../../utils/image';
import { SENTENCE_LIBRARY, sentenceMatches, sentenceStats, shuffleWords, tokenize } from '../../utils/sentence';

const CARD = 'bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3';
const INPUT = 'w-full text-sm px-3.5 py-2.5 rounded-2xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]';
const BTN = 'py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] text-white text-sm font-bold active:scale-95 transition disabled:opacity-50';
const BTN_GHOST = 'py-2.5 px-4 rounded-xl border-[1.5px] border-[#0F766E] text-[#0F766E] dark:text-teal-300 dark:border-teal-700 text-sm font-semibold bg-white dark:bg-transparent hover:bg-teal-50 dark:hover:bg-teal-950/40 active:scale-95 transition disabled:opacity-50';

const TaskCard: React.FC<{ task: SentenceTask; isAr: boolean }> = ({ task, isAr }) => {
  const { addSentenceAttempt, deleteSentenceTask } = useApp();
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const words = useMemo(() => shuffleWords(tokenize(task.target), task.id), [task]);
  const [picked, setPicked] = useState<number[]>([]); // indices into `words`
  const [typed, setTyped] = useState('');
  const [level, setLevel] = useState<string>('Independent');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const stats = sentenceStats(task);
  const voice = useVoiceDictation({ language: isAr ? 'ar' : 'en' });
  const listening = voice.isListening && voice.activeField === `sent-${task.id}`;
  const voiceErrors: Record<string, [string, string]> = {
    unsupported: ['Listening is not available in this browser or app view. Type what the child said instead.', 'الاستماع غير متاح هنا. اكتب ما قاله الطفل.'],
    denied: ['Microphone permission was denied.', 'تم رفض إذن الميكروفون.'],
    'no-mic': ['No microphone found.', 'لم يتم العثور على ميكروفون.'],
    network: ['Listening needs an internet connection.', 'الاستماع يحتاج إلى اتصال بالإنترنت.'],
    language: ['This language is not supported here.', 'هذه اللغة غير مدعومة هنا.'],
    other: ['Listening stopped unexpectedly.', 'توقف الاستماع بشكل غير متوقع.'],
  };

  const built = picked.map((i) => words[i]).join(' ');
  const produced = typed.trim() ? typed : built;
  const match = produced.trim() ? sentenceMatches(produced, task.target) : null;

  const record = () => {
    if (!produced.trim()) return;
    const correct = sentenceMatches(produced, task.target);
    addSentenceAttempt(task.id, { produced: produced.trim(), promptLevel: level, correct, independent: correct && level === 'Independent' });
    setPicked([]);
    setTyped('');
    setLevel('Independent');
  };

  return (
    <article className={CARD} data-testid="sentence-task">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#0F766E]">{stats.targetWords} {t('words', 'كلمات')}</p>
          <h3 className="font-heading font-bold text-lg text-[#0F2A27] dark:text-white" dir="auto">{task.target}</h3>
        </div>
        <span className="text-xs text-[#5C706C] text-end shrink-0">
          {stats.attempts === 0 ? t('No attempts', 'لا محاولات') : `${stats.independent}/${stats.attempts} ${t('independent', 'مستقل')}`}
          {stats.independentPercent !== null && <b className="block text-sm text-[#0F766E]">{stats.independentPercent}%</b>}
        </span>
      </div>

      {task.image && <img src={task.image} alt={t('Picture for this sentence', 'صورة لهذه الجملة')} className="w-full max-h-48 object-contain rounded-2xl bg-[#F4EEE6] dark:bg-[#252044]" />}

      <div>
        <p className="text-xs font-bold mb-1.5">{t('Tap the words in order', 'اضغط الكلمات بالترتيب')}</p>
        <div className="flex flex-wrap gap-2 min-h-[44px] p-2 rounded-2xl bg-[#F4EEE6] dark:bg-[#252044]" aria-label={t('Built sentence', 'الجملة المبنية')} dir="auto">
          {picked.length === 0 && <span className="text-xs text-[#5C706C] self-center">{t('The sentence appears here', 'تظهر الجملة هنا')}</span>}
          {picked.map((wi, pos) => (
            <button key={pos} type="button" onClick={() => setPicked((p) => p.filter((_, i) => i !== pos))} className="px-3 py-1.5 rounded-full bg-[#D9F0EA] border-[1.5px] border-[#0F766E] text-sm font-bold text-[#0B4F49]" aria-label={`${t('Remove', 'إزالة')} ${words[wi]}`}>{words[wi]}</button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-2" dir="auto">
          {words.map((w, i) => (
            <button key={i} type="button" disabled={picked.includes(i)} onClick={() => setPicked((p) => [...p, i])} className="px-3.5 py-2 rounded-full bg-white dark:bg-[#1F1B3A] border border-[#DCE3E1] dark:border-[#38325E] text-sm font-semibold disabled:opacity-30 active:scale-95">{w}</button>
          ))}
        </div>
      </div>

      <div>
        <span className="text-xs font-bold block mb-1">{t('Or listen to, or type, what the child said', 'أو استمع إلى ما قاله الطفل أو اكتبه')}</span>
        <div className="flex gap-2">
          <input value={typed} onChange={(e) => setTyped(e.target.value)} dir="auto" aria-label={t('What the child said', 'ما قاله الطفل')} className={`${INPUT} flex-1 min-w-0`} />
          <button
            type="button"
            disabled={!voice.hasSpeechSupport}
            onClick={() => (listening ? voice.stopDictation() : voice.startDictation(`sent-${task.id}`, '', setTyped))}
            aria-label={listening ? t('Stop listening', 'إيقاف الاستماع') : t('Listen', 'استمع')}
            className={`px-3.5 rounded-2xl border-[1.5px] flex items-center gap-1.5 text-sm font-bold shrink-0 disabled:opacity-40 ${listening ? 'bg-rose-600 border-rose-700 text-white animate-pulse' : 'border-[#0F766E] text-[#0F766E] dark:text-teal-300'}`}
          >
            {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            {listening ? t('Stop', 'إيقاف') : t('Listen', 'استمع')}
          </button>
        </div>
        <div className="flex gap-1.5 mt-1.5" role="radiogroup" aria-label={t('Listening language', 'لغة الاستماع')}>
          {DICTATION_LANGS.map((l) => (
            <button key={l.code} type="button" role="radio" aria-checked={voice.dictLang === l.code} onClick={() => voice.setDictLang(l.code)} className={`px-3 py-1 rounded-full text-xs font-bold border ${voice.dictLang === l.code ? 'bg-[#4338CA] border-[#4338CA] text-white' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>{l.label}</button>
          ))}
        </div>
        {listening && <p className="text-xs text-rose-700 mt-1.5" role="status">{voice.interimText || t('Listening… let the child say the sentence', 'أستمع… دع الطفل يقول الجملة')}</p>}
        {voice.error && <p role="alert" className="text-xs text-rose-700 mt-1.5">{voiceErrors[voice.error][isAr ? 1 : 0]}</p>}
        {!voice.hasSpeechSupport && <p className="text-xs text-amber-700 mt-1.5">{voiceErrors.unsupported[isAr ? 1 : 0]}</p>}
      </div>

      <div>
        <p className="text-xs font-bold mb-1.5">{t('Support given', 'الدعم المقدَّم')}</p>
        <div className="flex flex-wrap gap-1.5">
          {PROMPT_LEVELS.map((p) => (
            <button key={p} type="button" aria-pressed={level === p} onClick={() => setLevel(p)} className={`px-3 py-1.5 rounded-full text-xs border ${level === p ? 'bg-[#D9F0EA] border-[#0F766E] text-[#0B4F49] font-bold border-[1.5px]' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>{level === p && '✓ '}{p}</button>
          ))}
        </div>
      </div>

      {match !== null && (
        <p role="status" className={`text-sm font-semibold rounded-xl px-3 py-2 ${match ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
          {match ? t('Matches the target sentence', 'تطابق الجملة الهدف') : t('Not the target yet. You can still record it.', 'ليست الجملة الهدف بعد. يمكنك تسجيلها.')}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={record} disabled={!produced.trim()} className={BTN}>{t('Record attempt', 'سجّل المحاولة')}</button>
        <button type="button" onClick={() => { setPicked([]); setTyped(''); }} className={BTN_GHOST}>{t('Clear', 'مسح')}</button>
      </div>

      {task.attempts.length > 0 && (
        <div className="pt-2 border-t border-[#EDE8DF] dark:border-[#38325E] space-y-1.5">
          {[...task.attempts].reverse().slice(0, 5).map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-xs">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold ${a.correct ? (a.independent ? 'bg-emerald-600' : 'bg-amber-500') : 'bg-rose-500'}`}>{a.correct ? '✓' : '✗'}</span>
              <span className="flex-1 min-w-0 truncate" dir="auto">{a.produced}</span>
              <span className="text-[#5C706C] shrink-0">{a.promptLevel}</span>
            </div>
          ))}
        </div>
      )}

      {confirmDelete ? (
        <button type="button" onClick={() => deleteSentenceTask(task.id)} className="w-full py-2 rounded-xl bg-rose-600 text-white text-xs font-bold">{t('Tap again to delete this task and its attempts', 'اضغط مرة أخرى لحذف المهمة ومحاولاتها')}</button>
      ) : (
        <button type="button" onClick={() => setConfirmDelete(true)} className="w-full text-xs text-rose-600 underline flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" /> {t('Delete task', 'حذف المهمة')}</button>
      )}
    </article>
  );
};

export const SentenceBuilder: React.FC = () => {
  const { activeChild, language, sentenceTasks, addSentenceTask } = useApp();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [target, setTarget] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const tasks = sentenceTasks.filter((x) => x.childId === activeChild.id);
  const words = tokenize(target).length;

  return (
    <div className="space-y-4" data-testid="sentence-builder">
      <form
        className={CARD}
        onSubmit={(e) => {
          e.preventDefault();
          if (words < 2) return;
          addSentenceTask(activeChild.id, target, image ?? undefined);
          setTarget('');
          setImage(null);
        }}
      >
        <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('New sentence-building task', 'مهمة بناء جملة جديدة')}</h3>
        <input aria-label={t('Target sentence', 'الجملة الهدف')} value={target} onChange={(e) => setTarget(e.target.value)} dir="auto" placeholder={t('Sentence the child should build', 'الجملة التي يبنيها الطفل')} className={INPUT} />
        <div className="space-y-1.5">
          {SENTENCE_LIBRARY.map((lv) => (
            <div key={lv.level} className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#5C706C] w-14 shrink-0">{lv.level}</span>
              {[...lv.en, ...lv.ar].map((s) => (
                <button key={s} type="button" onClick={() => setTarget(s)} dir="auto" className="px-2.5 py-1 rounded-full text-xs border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent">{s}</button>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => fileRef.current?.click()} className={`${BTN_GHOST} flex items-center gap-1.5 !py-2 !px-3 !text-xs`}><Camera className="w-4 h-4" /> {image ? t('Change picture', 'تغيير الصورة') : t('Add a picture (optional)', 'أضف صورة (اختياري)')}</button>
          {image && <img src={image} alt="" className="w-12 h-12 object-cover rounded-xl border border-[#DCE3E1]" />}
          {image && <button type="button" onClick={() => setImage(null)} className="text-xs text-rose-600 underline">{t('Remove', 'إزالة')}</button>}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={async (e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (!f) return;
            const img = await downscaleImage(f, 360, 0.7);
            setImgError(!img);
            if (img) setImage(img);
          }} />
        </div>
        {imgError && <p role="alert" className="text-xs text-rose-700">{t('That file is not a readable picture.', 'هذا الملف ليس صورة قابلة للقراءة.')}</p>}
        {target.trim() && words < 2 && <p className="text-xs text-amber-700">{t('Use at least 2 words.', 'استخدم كلمتين على الأقل.')}</p>}
        <button type="submit" disabled={words < 2} className={`${BTN} w-full`}>{t('Add task', 'إضافة المهمة')}</button>
      </form>

      {tasks.length === 0 && <section className={CARD}><p className="text-sm text-[#5C706C]">{t('No sentence tasks for this child yet. Start with 2–3 words and build up.', 'لا توجد مهام جمل لهذا الطفل بعد. ابدأ بكلمتين أو ثلاث ثم تدرّج.')}</p></section>}
      {tasks.map((task) => <TaskCard key={task.id} task={task} isAr={isAr} />)}
    </div>
  );
};

