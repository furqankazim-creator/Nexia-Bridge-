import React, { useMemo } from 'react';
import { ArrowRight, BarChart2, CalendarDays, CheckCircle2, ChevronRight, FolderHeart, MessageSquare, Smile, Sparkles, Target as TargetIcon } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { SavedSession, Target } from '../../types';
import { DISCIPLINE_LABEL } from '../../utils/org';
import { HomeTasksCard } from './HomeTasksCard';
import { VoiceTipsCard } from './VoiceTipsCard';
import { BehaviorPlanCard } from './BehaviorPlanCard';

/** The parent's Home, Progress and Sessions built only from what the child's team really saved. */

const CARD = 'bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[22px] shadow-card';
const DAY = 86_400_000;

const useT = () => {
  const { language } = useApp();
  const isAr = language === 'ar';
  return { isAr, t: (en: string, ar: string) => (isAr ? ar : en) };
};

const ago = (iso: string, isAr: boolean): string => {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms)) return '';
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return isAr ? 'الآن' : 'Just now';
  if (h < 24) return isAr ? `منذ ${h} ساعة` : `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return isAr ? 'أمس' : 'Yesterday';
  if (d < 7) return isAr ? `منذ ${d} أيام` : `${d} days ago`;
  return new Date(iso).toLocaleDateString(isAr ? 'ar' : 'en-GB', { day: 'numeric', month: 'short' });
};

const result = (s: SavedSession, isAr: boolean): string => {
  const m = s.summary;
  if (m.percentIndependent != null) return isAr ? `${m.percentIndependent}% باستقلالية` : `${m.percentIndependent}% independent`;
  if (m.frequency != null) return isAr ? `${m.frequency} مرات` : `${m.frequency} times`;
  if (m.ratePerMinute != null) return isAr ? `${m.ratePerMinute} في الدقيقة` : `${m.ratePerMinute} per minute`;
  if (m.meanDurationSec != null) return isAr ? `${m.meanDurationSec} ثانية` : `${m.meanDurationSec}s on average`;
  return isAr ? `${m.scoredTrials} محاولات` : `${m.scoredTrials} trials`;
};

const progressOf = (t: Target) => Math.max(0, Math.min(100, Math.round((t.currentPerformance / Math.max(1, t.criterionThreshold)) * 100)));

const TONE = {
  green: 'bg-[#DDF5EA] text-[#1B9E6B] dark:bg-emerald-950 dark:text-emerald-300',
  amber: 'bg-[#FFF1CC] text-[#B7791F] dark:bg-amber-950 dark:text-amber-300',
  grey: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
  indigo: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
} as const;

/** One plain word for how a discipline's goals are going. */
const skillState = (ts: Target[], isAr: boolean): { label: string; tone: keyof typeof TONE } => {
  if (ts.every((x) => x.status === 'mastered')) return { label: isAr ? 'تم الإتقان' : 'Mastered', tone: 'indigo' };
  const improving = ts.some((x) => x.lastThreeSessions.length >= 2 && x.lastThreeSessions[x.lastThreeSessions.length - 1] > x.lastThreeSessions[0]);
  if (improving) return { label: isAr ? 'في تحسن' : 'Improving', tone: 'green' };
  if (ts.every((x) => x.lastThreeSessions.length === 0)) return { label: isAr ? 'بداية' : 'Getting started', tone: 'grey' };
  return { label: isAr ? 'قيد التطور' : 'Developing', tone: 'amber' };
};

const Empty: React.FC<{ icon: React.ReactNode; title: string; text: string }> = ({ icon, title, text }) => (
  <div className={`${CARD} p-6 text-center space-y-2`}>
    <div className="w-10 h-10 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] flex items-center justify-center">{icon}</div>
    <p className="font-heading font-bold text-sm">{title}</p>
    <p className="text-xs text-[#6B6785] dark:text-[#A5A0C2] max-w-xs mx-auto">{text}</p>
  </div>
);

interface Nav {
  goTab: (tab: string) => void;
  goDiscipline: (d: string) => void;
  openGoal: (t: Target) => void;
}

const useChildData = () => {
  const { activeChild, targets, savedSessions, homeTasks } = useApp();
  return useMemo(() => {
    const goals = targets.filter((t) => t.childId === activeChild.id && t.approvalStatus === 'approved');
    const sessions = savedSessions.filter((s) => s.childId === activeChild.id).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
    const tasks = homeTasks.filter((h) => h.childId === activeChild.id);
    return { child: activeChild, goals, sessions, tasks };
  }, [activeChild, targets, savedSessions, homeTasks]);
};

/* ------------------------------------------------------------------ Home */

export const RealHome: React.FC<Nav> = ({ goTab, goDiscipline, openGoal }) => {
  const { isAr, t } = useT();
  const { setChildScheduleMode, contacts } = useApp();
  const { child, goals, sessions, tasks } = useChildData();

  const byDiscipline = (Object.keys(DISCIPLINE_LABEL) as string[])
    .map((d) => ({ d, ts: goals.filter((g) => g.discipline === d) }))
    .filter((x) => x.ts.length > 0);

  const updates = useMemo(() => {
    const items: { id: string; at: string; title: string; text: string; icon: React.ReactNode; go: () => void }[] = [];
    for (const s of sessions.slice(0, 4)) {
      items.push({
        id: s.id, at: s.savedAt, icon: <CalendarDays className="w-5 h-5" />, go: () => goTab('Sessions'),
        title: isAr ? `جلسة ${DISCIPLINE_LABEL[s.role]?.ar ?? ''}` : `${DISCIPLINE_LABEL[s.role]?.en ?? s.role} session`,
        text: `${s.therapistName} · ${s.targetName} · ${result(s, isAr)}`,
      });
    }
    for (const h of tasks.filter((x) => x.createdAt && !x.done).slice(0, 3)) {
      items.push({ id: h.id, at: h.createdAt!, icon: <CheckCircle2 className="w-5 h-5" />, go: () => undefined, title: t('New home task', 'مهمة منزلية جديدة'), text: `${h.title}${h.assignedBy ? ` · ${h.assignedBy}` : ''}` });
    }
    for (const g of goals.filter((x) => x.status === 'mastered')) {
      const at = g.history?.filter((e) => e.action === 'approved' || e.action === 'edited').map((e) => e.at).sort().pop();
      if (at) items.push({ id: g.id, at, icon: <Sparkles className="w-5 h-5" />, go: () => openGoal(g), title: t('Goal mastered', 'تم إتقان هدف'), text: g.name });
    }
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, tasks, goals, isAr]);

  const week = useMemo(() => {
    const since = Date.now() - 7 * DAY;
    const ss = sessions.filter((s) => new Date(s.savedAt).getTime() >= since);
    const done = tasks.filter((h) => h.done && h.doneAt && new Date(h.doneAt).getTime() >= since).length;
    const byRole = new Map<string, number>();
    ss.forEach((s) => byRole.set(s.role, (byRole.get(s.role) ?? 0) + 1));
    return { sessions: ss.length, done, open: tasks.filter((h) => !h.done).length, byRole: [...byRole.entries()] };
  }, [sessions, tasks]);

  const team = contacts.map((c) => c.name).join(', ');
  const tile = (icon: React.ReactNode, title: string, text: string, onClick: () => void) => (
    <button type="button" onClick={onClick} className={`${CARD} w-full p-4 flex items-center justify-between gap-3 text-start hover:border-[#4F46E5] transition group`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-[#4F46E5] dark:text-indigo-300 flex items-center justify-center shrink-0">{icon}</div>
        <div className="min-w-0">
          <h4 className="font-heading font-bold text-base">{title}</h4>
          <p className="text-xs text-[#6B6785] dark:text-[#8E8AAB] truncate">{text}</p>
        </div>
      </div>
      <ArrowRight className="w-5 h-5 text-[#6B6785] shrink-0 rtl:rotate-180" />
    </button>
  );

  return (
    <div className="space-y-6 pb-28 animate-in fade-in" data-testid="real-home">
      <div>
        <h2 className="font-heading text-[26px] leading-tight font-bold text-[#1F1B3A] dark:text-white">{t(`${child.name}’s week`, `أسبوع ${child.name}`)}</h2>
        <p className="text-sm text-[#6B6785] dark:text-[#A5A0C2] mt-1">{t('What the care team is working on, and what to do at home.', 'ما يعمل عليه فريق الرعاية، وما يمكنك فعله في المنزل.')}</p>
      </div>

      <section className={`${CARD} divide-y divide-[#E8E2D9]/60 dark:divide-[#2F2952] overflow-hidden`} aria-label={t('Skills', 'المهارات')}>
        {byDiscipline.length === 0 && (
          <div className="p-5 text-sm text-[#6B6785] dark:text-[#A5A0C2]">{t('Goals will appear here when your child’s therapists add them and a supervisor approves them.', 'ستظهر الأهداف هنا عندما يضيفها المعالجون ويعتمدها المشرف.')}</div>
        )}
        {byDiscipline.map(({ d, ts }) => {
          const st = skillState(ts, isAr);
          const lead = ts.find((x) => x.status !== 'mastered') ?? ts[0];
          return (
            <button key={d} type="button" onClick={() => goDiscipline(d)} className="w-full p-4 flex items-center justify-between gap-3 text-start hover:bg-[#FAF6F0] dark:hover:bg-[#252044] transition group">
              <div className="min-w-0">
                <span className="font-heading font-semibold text-base">{isAr ? DISCIPLINE_LABEL[d].ar : DISCIPLINE_LABEL[d].en}</span>
                <span className="block text-[11px] text-[#6B6785] dark:text-gray-400 truncate">{ts.length} {t(ts.length === 1 ? 'goal' : 'goals', 'أهداف')} · {lead.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${TONE[st.tone]}`}>{st.label}</span>
                <ChevronRight className="w-4 h-4 text-[#6B6785] rtl:rotate-180" />
              </div>
            </button>
          );
        })}
      </section>

      <section>
        <h3 className="font-heading text-xl font-bold mb-3">{t('Recent updates', 'آخر التحديثات')}</h3>
        {updates.length === 0 ? (
          <Empty icon={<Smile className="w-5 h-5" />} title={t('Nothing yet', 'لا شيء بعد')} text={t('After the first session, you will see what was worked on and how it went.', 'بعد الجلسة الأولى سترى ما تم العمل عليه وكيف سارت.')} />
        ) : (
          <div className="space-y-2.5">
            {updates.map((u) => (
              <button key={u.id} type="button" onClick={u.go} className={`${CARD} w-full p-4 flex items-start gap-3.5 text-start hover:border-[#4F46E5] transition`}>
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center shrink-0">{u.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2"><h4 className="font-heading font-bold text-sm">{u.title}</h4><span className="text-[11px] text-[#6B6785] shrink-0">{ago(u.at, isAr)}</span></div>
                  <p className="text-xs text-[#6B6785] dark:text-[#A5A0C2] mt-0.5 leading-relaxed" dir="auto">{u.text}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      <VoiceTipsCard />
      <BehaviorPlanCard />
      <HomeTasksCard />

      <section className={`${CARD} p-5 space-y-3`} aria-label={t('This week', 'هذا الأسبوع')}>
        <h3 className="font-heading font-bold text-lg">{t('This week', 'هذا الأسبوع')}</h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { n: week.sessions, l: t('sessions', 'جلسات') },
            { n: week.done, l: t('home tasks done', 'مهام منزلية مكتملة') },
            { n: week.open, l: t('still to do', 'متبقية') },
          ].map((x) => (
            <div key={x.l} className="p-3 rounded-2xl bg-[#FAF6F0] dark:bg-[#252044] border border-[#E8E2D9] dark:border-[#38325E]">
              <span className="font-heading font-black text-2xl text-[#4F46E5] dark:text-indigo-300">{x.n}</span>
              <p className="text-[10px] text-[#6B6785] dark:text-gray-400 font-semibold mt-0.5">{x.l}</p>
            </div>
          ))}
        </div>
        {week.byRole.length > 0 && <p className="text-xs text-[#6B6785] dark:text-[#A5A0C2]">{week.byRole.map(([r, n]) => `${isAr ? DISCIPLINE_LABEL[r]?.ar : DISCIPLINE_LABEL[r]?.en ?? r} ${n}`).join(' · ')}</p>}
      </section>

      <section className="space-y-3">
        <h3 className="font-heading text-xl font-bold">{t('Quick actions', 'إجراءات سريعة')}</h3>
        {tile(<MessageSquare className="w-5 h-5" />, t('Message the care team', 'راسل فريق الرعاية'), team || t('Therapists, teachers and the supervisor', 'المعالجون والمعلمون والمشرف'), () => goTab('Messages'))}
        {tile(<FolderHeart className="w-5 h-5" />, t('Medical records', 'السجلات الطبية'), t('Keep reports safe and choose who sees them', 'احفظ التقارير واختر من يراها'), () => goTab('Records'))}
        {tile(<TargetIcon className="w-5 h-5" />, t('Goals', 'الأهداف'), t('What the team is teaching, step by step', 'ما يعلّمه الفريق خطوة بخطوة'), () => goTab('Targets'))}
        {tile(<Smile className="w-5 h-5" />, t('Child mode', 'وضع الطفل'), t('A simple, big-button routine for your child', 'روتين بسيط بأزرار كبيرة لطفلك'), () => setChildScheduleMode(true))}
      </section>
    </div>
  );
};

/* -------------------------------------------------------------- Progress */

export const RealProgress: React.FC<Nav> = ({ goDiscipline, openGoal }) => {
  const { isAr, t } = useT();
  const { child, goals, sessions, tasks } = useChildData();
  const monthAgo = Date.now() - 30 * DAY;
  const mastered = goals.filter((g) => g.status === 'mastered').length;
  const rows = (Object.keys(DISCIPLINE_LABEL) as string[])
    .map((d) => ({ d, ts: goals.filter((g) => g.discipline === d) }))
    .filter((x) => x.ts.length);

  return (
    <div className="space-y-6 pb-28 animate-in fade-in" data-testid="real-progress">
      <div>
        <h2 className="font-heading text-[26px] leading-tight font-bold">{t('Progress', 'التقدم')}</h2>
        <p className="text-sm text-[#6B6785] dark:text-[#A5A0C2] mt-1">{t(`How ${child.name} is doing on each goal. A goal is mastered when the criterion is met in three sessions.`, `كيف يسير ${child.name} في كل هدف. يُتقن الهدف عند تحقيق المعيار في ثلاث جلسات.`)}</p>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { n: goals.length, l: t('goals', 'أهداف') },
          { n: goals.length - mastered, l: t('teaching', 'قيد التعليم') },
          { n: mastered, l: t('mastered', 'متقنة') },
          { n: sessions.filter((s) => new Date(s.savedAt).getTime() >= monthAgo).length, l: t('sessions / 30d', 'جلسات / ٣٠ يوماً') },
        ].map((x) => (
          <div key={x.l} className={`${CARD} p-3`}>
            <span className="font-heading font-black text-xl text-[#4F46E5] dark:text-indigo-300">{x.n}</span>
            <p className="text-[10px] text-[#6B6785] dark:text-gray-400 font-semibold mt-0.5">{x.l}</p>
          </div>
        ))}
      </div>

      {rows.length === 0 && <Empty icon={<BarChart2 className="w-5 h-5" />} title={t('No goals yet', 'لا توجد أهداف بعد')} text={t('Progress appears once your child’s therapists add goals and a supervisor approves them.', 'يظهر التقدم بعد أن يضيف المعالجون الأهداف ويعتمدها المشرف.')} />}

      {rows.map(({ d, ts }) => {
        const avg = Math.round(ts.reduce((a, g) => a + progressOf(g), 0) / ts.length);
        return (
          <section key={d} className={`${CARD} p-4 space-y-3`}>
            <button type="button" onClick={() => goDiscipline(d)} className="w-full flex items-center justify-between gap-2 text-start">
              <h3 className="font-heading font-bold text-base">{isAr ? DISCIPLINE_LABEL[d].ar : DISCIPLINE_LABEL[d].en}</h3>
              <span className="text-xs font-bold text-[#4F46E5] dark:text-indigo-300">{avg}% {t('toward the goals', 'نحو الأهداف')}</span>
            </button>
            <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-[#4F46E5] rounded-full" style={{ width: `${avg}%` }} /></div>
            <div className="divide-y divide-[#EDE8DF] dark:divide-[#38325E]">
              {ts.map((g) => (
                <button key={g.id} type="button" onClick={() => openGoal(g)} className="w-full py-2.5 text-start space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold" dir="auto">{g.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${g.status === 'mastered' ? TONE.indigo : TONE.grey}`}>{g.status}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-[#0D9488] rounded-full" style={{ width: `${progressOf(g)}%` }} /></div>
                  <p className="text-[11px] text-[#6B6785] dark:text-[#A5A0C2]">
                    {g.currentPerformance}% {t('now', 'الآن')} · {t('goal', 'الهدف')} {g.masteryCriterion}{g.lastThreeSessions.length ? ` · ${t('last sessions', 'آخر الجلسات')} ${g.lastThreeSessions.join('%, ')}%` : ''}
                  </p>
                </button>
              ))}
            </div>
          </section>
        );
      })}

      <p className="text-[11px] text-center text-[#6B6785] dark:text-[#A5A0C2]">{t(`${tasks.filter((h) => h.done).length} of ${tasks.length} home tasks done so far.`, `تم إنجاز ${tasks.filter((h) => h.done).length} من ${tasks.length} مهام منزلية.`)}</p>
    </div>
  );
};

/* -------------------------------------------------------------- Sessions */

export const RealSessions: React.FC<Nav> = ({ goTab }) => {
  const { isAr, t } = useT();
  const { child, sessions } = useChildData();
  const groups = useMemo(() => {
    const g = new Map<string, SavedSession[]>();
    sessions.forEach((s) => {
      const k = new Date(s.savedAt).toLocaleDateString(isAr ? 'ar' : 'en-GB', { month: 'long', year: 'numeric' });
      (g.get(k) ?? g.set(k, []).get(k)!).push(s);
    });
    return [...g.entries()];
  }, [sessions, isAr]);

  return (
    <div className="space-y-5 pb-28 animate-in fade-in" data-testid="real-sessions">
      <div>
        <h2 className="font-heading text-[26px] leading-tight font-bold">{t('Sessions', 'الجلسات')}</h2>
        <p className="text-sm text-[#6B6785] dark:text-[#A5A0C2] mt-1">{t(`What the team did with ${child.name}, newest first. To ask about a session, send a message.`, `ما فعله الفريق مع ${child.name}، الأحدث أولاً. للسؤال عن جلسة، أرسل رسالة.`)}</p>
      </div>
      {groups.length === 0 && <Empty icon={<CalendarDays className="w-5 h-5" />} title={t('No sessions yet', 'لا توجد جلسات بعد')} text={t('When a therapist saves a session, it shows up here with the result.', 'عندما يحفظ المعالج جلسة تظهر هنا مع النتيجة.')} />}
      {groups.map(([month, list]) => (
        <section key={month} className="space-y-2" aria-label={month}>
          <h3 className="text-xs font-bold tracking-wider text-[#6B6785] uppercase">{month}</h3>
          {list.map((s) => (
            <div key={s.id} className={`${CARD} p-4 space-y-1`}>
              <div className="flex items-start justify-between gap-2">
                <p className="font-bold text-sm leading-snug" dir="auto">{s.targetName}</p>
                <span className="text-xs font-bold text-[#4F46E5] dark:text-indigo-300 shrink-0">{result(s, isAr)}</span>
              </div>
              <p className="text-[11px] text-[#6B6785] dark:text-[#A5A0C2]">
                {new Date(s.savedAt).toLocaleDateString(isAr ? 'ar' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {isAr ? DISCIPLINE_LABEL[s.role]?.ar : DISCIPLINE_LABEL[s.role]?.en ?? s.role} · {s.therapistName}
              </p>
            </div>
          ))}
        </section>
      ))}
      <button type="button" onClick={() => goTab('Messages')} className="w-full py-3 rounded-2xl border-[1.5px] border-[#4F46E5] text-[#4F46E5] dark:text-indigo-300 text-sm font-bold">{t('Ask the team about a session', 'اسأل الفريق عن جلسة')}</button>
    </div>
  );
};
