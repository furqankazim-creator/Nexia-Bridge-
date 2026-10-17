import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Send, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { WeeklyQuestion, WeeklyQuestionSet, WhType } from '../../types';
import { WH_TYPES, mondayOf, questionsAsHomeText, shiftWeek, toISODate, weekLabel, weeklyStats } from '../../utils/sentence';

const CARD = 'bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3';
const INPUT = 'w-full text-sm px-3.5 py-2.5 rounded-2xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]';
const BTN = 'py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] text-white text-sm font-bold active:scale-95 transition disabled:opacity-50';
const BTN_GHOST = 'py-2.5 px-4 rounded-xl border-[1.5px] border-[#0F766E] text-[#0F766E] dark:text-teal-300 dark:border-teal-700 text-sm font-semibold bg-white dark:bg-transparent hover:bg-teal-50 dark:hover:bg-teal-950/40 active:scale-95 transition disabled:opacity-50';

const WH_AR: Record<WhType, string> = { who: 'مَن', what: 'ماذا', where: 'أين', when: 'متى', why: 'لماذا', how: 'كيف' };
const STARTERS: Record<WhType, string> = {
  who: 'Who is eating?', what: 'What do you use to drink?', where: 'Where is the ball?', when: 'When do we sleep?', why: 'Why do we wear a coat?', how: 'How do you wash your hands?',
};
const RESULT_STYLE: Record<string, string> = {
  '+': 'bg-[#DDF5EA] border-emerald-500 text-[#1B9E6B]',
  P: 'bg-[#FFF1CC] border-amber-500 text-[#B7791F]',
  '-': 'bg-[#FDE3E4] border-rose-500 text-[#D63B3B]',
  none: 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E] text-gray-400',
};

export const WeeklyQuestions: React.FC = () => {
  const { activeChild, language, weeklySets, saveWeeklySet, deleteWeeklySet, upsertHomeTask, currentUserName, showNotification } = useApp();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const thisWeek = mondayOf(new Date());
  const [week, setWeek] = useState(thisWeek);
  const [type, setType] = useState<WhType>('what');
  const [text, setText] = useState('');
  const [answer, setAnswer] = useState('');

  const childSets = useMemo(() => weeklySets.filter((s) => s.childId === activeChild.id), [weeklySets, activeChild.id]);
  const set = childSets.find((s) => s.weekStart === week);
  const prev = childSets.find((s) => s.weekStart === shiftWeek(week, -1));
  const stats = weeklyStats(set);

  const ensureSet = (questions: WeeklyQuestion[] = []): WeeklyQuestionSet => ({ id: `wq-${activeChild.id}-${week}`, childId: activeChild.id, weekStart: week, questions, sentHome: false });
  const uid = () => `q-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const update = (questions: WeeklyQuestion[], extra: Partial<WeeklyQuestionSet> = {}) => saveWeeklySet({ ...(set ?? ensureSet()), questions, ...extra });

  const addQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    update([...(set?.questions ?? []), { id: uid(), type, text: text.trim(), answer: answer.trim(), result: null }], { sentHome: false });
    setText('');
    setAnswer('');
  };
  const cycle = (q: WeeklyQuestion) => {
    const next = q.result === null ? '+' : q.result === '+' ? 'P' : q.result === 'P' ? '-' : null;
    update((set?.questions ?? []).map((x) => (x.id === q.id ? { ...x, result: next } : x)));
  };

  const sendHome = () => {
    if (!set || set.questions.length === 0) return;
    const [y, m, d] = week.split('-').map(Number);
    upsertHomeTask({
      id: `wq-${set.id}`,
      childId: activeChild.id,
      title: `${t('Weekly questions', 'أسئلة الأسبوع')} (${weekLabel(week)})`,
      instructions: `${t('Ask these questions during the day. Wait 4 seconds before helping.', 'اطرح هذه الأسئلة خلال اليوم وانتظر 4 ثوانٍ قبل المساعدة.')}\n${questionsAsHomeText(set)}`,
      frequency: 'Daily',
      dueDate: toISODate(new Date(y, m - 1, d + 6)),
      assignedBy: currentUserName,
    });
    saveWeeklySet({ ...set, sentHome: true });
  };

  const copyToText = async () => {
    if (!set) return;
    try {
      await navigator.clipboard.writeText(`${t('Weekly questions', 'أسئلة الأسبوع')} ${weekLabel(week)}\n${questionsAsHomeText(set)}`);
      showNotification(t('Questions copied.', 'تم نسخ الأسئلة.'));
    } catch {
      showNotification(t('Copy is not available here.', 'النسخ غير متاح هنا.'));
    }
  };

  // Last six weeks, oldest first, for the trend.
  const trend = [5, 4, 3, 2, 1, 0].map((n) => {
    const w = shiftWeek(thisWeek, -n);
    const s = weeklyStats(childSets.find((x) => x.weekStart === w));
    return { w, pct: s.independentPercent, asked: s.asked };
  });

  return (
    <div className="space-y-4" data-testid="weekly-questions">
      <section className={CARD}>
        <div className="flex items-center justify-between gap-2">
          <button type="button" aria-label={t('Previous week', 'الأسبوع السابق')} onClick={() => setWeek(shiftWeek(week, -1))} className="p-2 rounded-xl border border-[#DCE3E1] dark:border-[#38325E]"><ChevronLeft className="w-4 h-4" /></button>
          <div className="text-center">
            <p className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{weekLabel(week)}</p>
            <p className="text-[11px] text-[#5C706C]">{week === thisWeek ? t('This week', 'هذا الأسبوع') : week > thisWeek ? t('Upcoming', 'قادم') : t('Past week', 'أسبوع سابق')}</p>
          </div>
          <button type="button" aria-label={t('Next week', 'الأسبوع التالي')} onClick={() => setWeek(shiftWeek(week, 1))} className="p-2 rounded-xl border border-[#DCE3E1] dark:border-[#38325E]"><ChevronRight className="w-4 h-4" /></button>
        </div>

        {!set && prev && prev.questions.length > 0 && (
          <button type="button" onClick={() => saveWeeklySet(ensureSet(prev.questions.map((q) => ({ ...q, id: uid(), result: null }))))} className={`${BTN_GHOST} w-full flex items-center justify-center gap-1.5`}>
            <Copy className="w-4 h-4" /> {t('Copy last week’s questions', 'انسخ أسئلة الأسبوع الماضي')}
          </button>
        )}
      </section>

      <form onSubmit={addQuestion} className={CARD}>
        <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Add a question', 'إضافة سؤال')}</h3>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={t('Question type', 'نوع السؤال')}>
          {WH_TYPES.map((w) => (
            <button key={w} type="button" role="radio" aria-checked={type === w} onClick={() => { setType(w); if (!text) setText(STARTERS[w]); }}
              className={`px-3.5 py-1.5 rounded-full text-xs border font-semibold transition ${type === w ? 'bg-[#D9F0EA] border-[#0F766E] text-[#0B4F49] border-[1.5px]' : 'bg-white dark:bg-transparent border-[#DCE3E1] dark:border-[#38325E]'}`}>
              {isAr ? WH_AR[w] : w}
            </button>
          ))}
        </div>
        <input aria-label={t('Question', 'السؤال')} value={text} onChange={(e) => setText(e.target.value)} dir="auto" placeholder={t('Question to ask the child', 'السؤال الموجّه للطفل')} className={INPUT} />
        <input aria-label={t('Expected answer', 'الإجابة المتوقعة')} value={answer} onChange={(e) => setAnswer(e.target.value)} dir="auto" placeholder={t('Expected answer (optional)', 'الإجابة المتوقعة (اختياري)')} className={INPUT} />
        <button type="submit" disabled={!text.trim()} className={`${BTN} w-full`}>{t('Add to this week', 'أضف لهذا الأسبوع')}</button>
      </form>

      <section className={CARD}>
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Questions', 'الأسئلة')}</h3>
          <span className="text-xs text-[#5C706C]">{stats.asked}/{stats.total} {t('asked', 'سُئلت')}</span>
        </div>
        {(!set || set.questions.length === 0) && <p className="text-sm text-[#5C706C]">{t('No questions for this week yet.', 'لا توجد أسئلة لهذا الأسبوع بعد.')}</p>}
        {set?.questions.map((q, i) => (
          <div key={q.id} className="flex items-start gap-3 py-2 border-b border-[#EDE8DF] dark:border-[#38325E] last:border-b-0">
            <button type="button" onClick={() => cycle(q)} aria-label={`${t('Score question', 'قيّم السؤال')} ${i + 1}`} className={`w-10 h-10 shrink-0 rounded-xl border-[1.5px] font-bold text-lg flex items-center justify-center active:scale-95 ${RESULT_STYLE[q.result ?? 'none']}`}>
              {q.result === '-' ? '−' : q.result ?? '…'}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold" dir="auto"><span className="uppercase text-[10px] font-bold text-[#0F766E] me-1.5">{isAr ? WH_AR[q.type] : q.type}</span>{q.text}</p>
              {q.answer && <p className="text-xs text-[#5C706C]" dir="auto">→ {q.answer}</p>}
            </div>
            <button type="button" aria-label={t('Remove question', 'حذف السؤال')} onClick={() => update(set.questions.filter((x) => x.id !== q.id), { sentHome: false })} className="p-1 text-[#9AA7A4] hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        {set && set.questions.length > 0 && <p className="text-xs text-[#5C706C]">+ {t('independent', 'مستقل')} · P {t('prompted', 'بتلقين')} · − {t('incorrect', 'غير صحيح')}. {t('Tap a box to score.', 'اضغط المربع للتقييم.')}</p>}
      </section>

      {stats.asked > 0 && (
        <section className={CARD}>
          <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('This week’s result', 'نتيجة هذا الأسبوع')}</h3>
          <p className="text-sm">{stats.independent} {t('of', 'من')} {stats.asked} {t('answered independently', 'أُجيب عنها باستقلال')} (<b>{stats.independentPercent}%</b>) · {stats.prompted} {t('prompted', 'بتلقين')} · {stats.incorrect} {t('incorrect', 'خطأ')}</p>
          <div className="space-y-1.5">
            {stats.byType.map((b) => (
              <div key={b.type} className="flex items-center gap-2 text-xs">
                <span className="w-14 shrink-0 uppercase font-bold text-[#0F766E]">{isAr ? WH_AR[b.type] : b.type}</span>
                <div className="flex-1 h-2.5 rounded-full bg-[#EDE8DF] dark:bg-[#38325E] overflow-hidden"><div className="h-full bg-[#0F766E]" style={{ width: `${(b.independent / b.asked) * 100}%` }} /></div>
                <b className="w-12 text-end tabular-nums">{b.independent}/{b.asked}</b>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={CARD}>
        <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Last 6 weeks', 'آخر 6 أسابيع')}</h3>
        <div className="flex items-end gap-2 h-24" role="img" aria-label={t('Weekly independent percent', 'نسبة الاستقلال الأسبوعية')}>
          {trend.map((x) => (
            <div key={x.w} className="flex-1 flex flex-col items-center justify-end h-full gap-1">
              <span className="text-[10px] font-bold tabular-nums">{x.pct === null ? '' : `${x.pct}%`}</span>
              <div className={`w-full rounded-t-md ${x.w === week ? 'bg-[#0F766E]' : 'bg-[#9ED4CB]'}`} style={{ height: `${x.pct === null ? 3 : Math.max(4, x.pct)}%`, opacity: x.pct === null ? 0.25 : 1 }} />
              <span className="text-[9px] text-[#5C706C]">{weekLabel(x.w).split(' – ')[0]}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={sendHome} disabled={!set || set.questions.length === 0} className={`${BTN} flex items-center justify-center gap-1.5`}>
          <Send className="w-4 h-4" /> {set?.sentHome ? t('Sent to parents ✓', 'أُرسلت للأهل ✓') : t('Send to parents', 'إرسال إلى ولي الأمر')}
        </button>
        <button type="button" onClick={copyToText} disabled={!set || set.questions.length === 0} className={`${BTN_GHOST} flex items-center justify-center gap-1.5`}><Copy className="w-4 h-4" /> {t('Copy', 'نسخ')}</button>
      </div>
      {set && <button type="button" onClick={() => { deleteWeeklySet(set.id); }} className="w-full text-xs text-rose-600 underline">{t('Delete this week’s set', 'حذف مجموعة هذا الأسبوع')}</button>}
    </div>
  );
};
