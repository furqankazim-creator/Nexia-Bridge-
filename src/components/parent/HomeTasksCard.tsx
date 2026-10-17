import React, { useState } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

/** Parent-facing list of home tasks assigned by the therapist; ticking one reports back to the therapist. */
export const HomeTasksCard: React.FC = () => {
  const { activeChild, homeTasks, setHomeTaskDone, language } = useApp();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const tasks = homeTasks.filter((h) => h.childId === activeChild.id);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState('');

  if (tasks.length === 0) return null;
  const open = tasks.filter((x) => !x.done).length;

  return (
    <section className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[22px] p-4 shadow-card space-y-2" data-testid="home-tasks-card">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">{t('Home practice from your therapist', 'التدريب المنزلي من المعالج')}</h3>
        <span className="text-xs font-semibold text-[#6B6785]">{open} {t('to do', 'متبقية')}</span>
      </div>
      {tasks.map((h) => (
        <div key={h.id} className="py-2 border-t border-[#EDE8DF] dark:border-[#38325E] first:border-t-0 space-y-1.5">
          <button
            type="button"
            onClick={() => {
              if (h.done) setHomeTaskDone(h.id, false);
              else { setNoteFor(noteFor === h.id ? null : h.id); setNote(''); }
            }}
            aria-pressed={h.done}
            className="w-full flex items-start gap-3 text-start"
          >
            {h.done ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-[#9AA7A4] shrink-0 mt-0.5" />}
            <span className="min-w-0 flex-1">
              <span className={`block text-sm font-semibold ${h.done ? 'line-through text-[#6B6785]' : 'text-[#1F1B3A] dark:text-white'}`} dir="auto">{h.title}</span>
              {h.instructions && <span className="block text-xs text-[#6B6785] whitespace-pre-line" dir="auto">{h.instructions}</span>}
              <span className="block text-[11px] text-[#6B6785]">{h.frequency}{h.dueDate ? ` · ${t('due', 'الموعد')} ${h.dueDate}` : ''}</span>
            </span>
          </button>
          {noteFor === h.id && !h.done && (
            <div className="flex gap-2 ps-8">
              <input value={note} onChange={(e) => setNote(e.target.value)} dir="auto" placeholder={t('How did it go? (optional)', 'كيف سار الأمر؟ (اختياري)')} className="flex-1 min-w-0 text-sm px-3 py-2 rounded-xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none" />
              <button type="button" onClick={() => { setHomeTaskDone(h.id, true, note.trim()); setNoteFor(null); }} className="px-3 py-2 rounded-xl bg-[#0F766E] text-white text-xs font-bold">{t('Done', 'تم')}</button>
            </div>
          )}
          {h.done && h.parentNote && <p className="ps-8 text-xs text-emerald-700" dir="auto">“{h.parentNote}”</p>}
        </div>
      ))}
    </section>
  );
};
