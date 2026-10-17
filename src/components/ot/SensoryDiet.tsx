import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { SensoryActivity, SensoryLog } from '../../types';

const CARD = 'bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3';

export const SENSORY_ACTIVITIES: { id: SensoryActivity; en: string; ar: string }[] = [
  { id: 'proprioceptive', en: 'Proprioceptive', ar: 'الحس العميق' },
  { id: 'vestibular', en: 'Vestibular', ar: 'الدهليزي' },
  { id: 'tactile', en: 'Tactile Putty', ar: 'معجون لمسي' },
  { id: 'deep_pressure', en: 'Deep Pressure', ar: 'الضغط العميق' },
];

const STRATEGIES: Record<SensoryActivity, string[]> = {
  proprioceptive: ['Deep Pressure (Weighted Vest 5% body wt)', 'Chair Push-Ups & Joint Compressions', 'Heavy-work obstacle course (wheelbarrow walks)'],
  vestibular: ['Linear Vestibular Swing (Calming rhythm)', 'Slow rocking on a therapy ball', 'Bolster ride'],
  tactile: ['Resistive Therapy Putty (Green medium)', 'Tactile Dry Rice & Bean Bin exploration', 'Textured brush strokes'],
  deep_pressure: ['Deep Pressure (Weighted Vest 5% body wt)', 'Firm bear hugs or a pillow squeeze', 'Rolling a therapy ball over the back'],
};

const PRE: { id: SensoryLog['pre']; en: string; ar: string; on: string }[] = [
  { id: 'lethargic', en: 'Lethargic', ar: 'خامل', on: 'bg-[#3B82F6] border-[#3B82F6] text-white' },
  { id: 'optimal', en: 'Optimal', ar: 'مثالي', on: 'bg-[#22B573] border-[#22B573] text-white' },
  { id: 'elevated', en: 'Elevated', ar: 'مرتفع', on: 'bg-[#F59E0B] border-[#F59E0B] text-white' },
];
const POST: { id: SensoryLog['post']; en: string; ar: string; on: string }[] = [
  { id: 'regulated', en: 'Regulated', ar: 'منظَّم', on: 'bg-[#22B573] border-[#22B573] text-white' },
  { id: 'calmed', en: 'Calmed', ar: 'هادئ', on: 'bg-[#14B8A6] border-[#14B8A6] text-white' },
  { id: 'needs_time', en: 'Needs time', ar: 'يحتاج وقتاً', on: 'bg-[#F59E0B] border-[#F59E0B] text-white' },
];

export const sensoryLine = (l: Pick<SensoryLog, 'activity' | 'pre' | 'post' | 'strategies' | 'note'>) =>
  `${l.activity.replace('_', ' ')}: arousal ${l.pre}, then ${l.post.replace('_', ' ')}${l.strategies.length ? ` (${l.strategies.join('; ')})` : ''}${l.note ? `. ${l.note}` : ''}`;

/** Sensory diet log: what was done, arousal before and after, and what it looked like. */
export const SensoryDiet: React.FC = () => {
  const { activeChild, language, otSensory, addSensoryLog, deleteSensoryLog, showNotification } = useApp();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [activity, setActivity] = useState<SensoryActivity>('proprioceptive');
  const [pre, setPre] = useState<SensoryLog['pre'] | null>(null);
  const [post, setPost] = useState<SensoryLog['post'] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const logs = otSensory.filter((l) => l.childId === activeChild.id);

  const changeActivity = (a: SensoryActivity) => { setActivity(a); setPicked([]); };
  const ready = pre !== null && post !== null;
  const save = () => {
    if (!pre || !post) return;
    addSensoryLog({ childId: activeChild.id, activity, pre, post, strategies: picked, note: note.trim() });
    showNotification(t('Sensory activity logged.', 'تم تسجيل النشاط الحسي.'));
    setPre(null);
    setPost(null);
    setPicked([]);
    setNote('');
  };

  return (
    <section className={CARD} data-testid="sensory-diet">
      <div>
        <span className="text-[11px] font-bold uppercase tracking-wide text-[#4338CA]">{t('Sensory regulation & modulation diet', 'النظام الحسي والتنظيم')}</span>
        <h3 className="font-heading font-bold text-lg text-[#1F1B3A] dark:text-white">{t('Sensory Diet & Proprioceptive Log', 'سجل النظام الحسي والحس العميق')}</h3>
        <p className="text-xs text-[#5C706C]">{t('Pre-task sensory conditioning to optimize arousal & attention', 'تهيئة حسية قبل المهمة لتحسين الاستثارة والانتباه')}</p>
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={t('Sensory activity', 'النشاط الحسي')}>
        {SENSORY_ACTIVITIES.map((a) => (
          <button key={a.id} type="button" role="tab" aria-selected={activity === a.id} onClick={() => changeActivity(a.id)} className={`px-3.5 py-1.5 rounded-lg text-xs font-bold border transition ${activity === a.id ? 'bg-[#EA580C] border-[#EA580C] text-white' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>{isAr ? a.ar : a.en}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-2xl border border-[#E8E2D9] dark:border-[#38325E] bg-[#FAFBFC] dark:bg-[#252044] p-3">
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold">{t('Pre-Activity Arousal:', 'الاستثارة قبل النشاط:')}</p>
          <div className="space-y-1.5" role="radiogroup" aria-label={t('Arousal before', 'الاستثارة قبل')}>
            {PRE.map((o) => <button key={o.id} type="button" role="radio" aria-checked={pre === o.id} onClick={() => setPre(pre === o.id ? null : o.id)} className={`w-full py-2 rounded-lg border text-[11px] font-bold ${pre === o.id ? o.on : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>{isAr ? o.ar : o.en}</button>)}
          </div>
        </div>
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold">{t('Post-Activity State:', 'الحالة بعد النشاط:')}</p>
          <div className="space-y-1.5" role="radiogroup" aria-label={t('State after', 'الحالة بعد')}>
            {POST.map((o) => <button key={o.id} type="button" role="radio" aria-checked={post === o.id} onClick={() => setPost(post === o.id ? null : o.id)} className={`w-full py-2 rounded-lg border text-[11px] font-bold ${post === o.id ? o.on : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>{isAr ? o.ar : o.en}</button>)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STRATEGIES[activity].map((s) => {
          const on = picked.includes(s);
          return <button key={s} type="button" aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== s) : [...p, s]))} className={`px-2.5 py-1.5 rounded-lg text-[11px] border ${on ? 'bg-[#FFEDD5] border-[#EA580C] text-[#9A3412] font-bold' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>{on && '✓ '}{s}</button>;
        })}
      </div>

      <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} dir="auto" aria-label={t('Sensory note', 'ملاحظة حسية')} placeholder={t('What was done and how the child responded (e.g. 10 mins of heavy-work obstacle course, improved seated endurance)', 'ماذا فُعل وكيف استجاب الطفل')} className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E2E6EA] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#EA580C]" />
      <button type="button" onClick={save} disabled={!ready} className="w-full py-2.5 rounded-xl bg-[#EA580C] hover:bg-[#C2410C] text-white text-sm font-bold disabled:opacity-50 active:scale-95 transition">{t('Log sensory activity', 'تسجيل النشاط الحسي')}</button>
      {!ready && <p className="text-[11px] text-[#5C706C]">{t('Choose the arousal before and the state after to log it.', 'اختر الاستثارة قبل والحالة بعد لتسجيلها.')}</p>}

      {logs.length > 0 && (
        <div className="pt-2 border-t border-[#EDE8DF] dark:border-[#38325E] space-y-1.5" data-testid="sensory-log">
          {logs.slice(0, 4).map((l) => (
            <div key={l.id} className="flex items-start gap-2 text-xs">
              <p className="flex-1 min-w-0" dir="auto"><b className="capitalize">{l.activity.replace('_', ' ')}</b> · {l.pre} → {l.post.replace('_', ' ')} · {new Date(l.at).toLocaleDateString()}{l.note ? ` · ${l.note}` : ''}</p>
              <button type="button" aria-label={t('Delete sensory entry', 'حذف الإدخال الحسي')} onClick={() => deleteSensoryLog(l.id)} className="p-1 text-[#9AA7A4] hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
