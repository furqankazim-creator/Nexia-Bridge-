import React, { useEffect, useRef, useState } from 'react';
import { MedicalRecordsPanel } from '../medical/MedicalRecords';
import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { OWN_THREAD } from '../../utils/threads';
import { tasksText } from '../../utils/behaviorReport';
import { ShareToTeamModal } from './ShareToTeamModal';
import { Avatar, ChatComposer, ChatHeader, ChatThread } from './chat/WhatsAppChat';
import type { TherapyRole } from '../../types';

const CARD = 'bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-[20px] p-5 shadow-card space-y-3';
const INPUT = 'w-full text-sm px-3.5 py-2.5 rounded-2xl border border-[#DCE3E1] dark:border-[#38325E] bg-white dark:bg-transparent outline-none focus:border-[#0F766E]';
const BTN = 'py-2.5 px-4 rounded-xl bg-[#0F766E] hover:bg-[#0B5F58] text-white text-sm font-bold active:scale-95 transition disabled:opacity-50';
const BTN_GHOST = 'py-2.5 px-4 rounded-xl border-[1.5px] border-[#0F766E] text-[#0F766E] dark:text-teal-300 dark:border-teal-700 text-sm font-semibold bg-white dark:bg-transparent hover:bg-teal-50 dark:hover:bg-teal-950/40 active:scale-95 transition disabled:opacity-50';

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block">
    <span className="text-xs font-bold text-[#0F2A27] dark:text-white block mb-1">{label}</span>
    {children}
  </label>
);

/** Unread messages waiting in this therapist's own thread (for tab badges). */
export const useUnreadForRole = (): number => {
  const { role, contacts } = useApp();
  const id = role ? OWN_THREAD[role] : undefined;
  return contacts.find((c) => c.id === id)?.unreadStaff ?? 0;
};

/** The therapist's chat with the child's parents. Parents' replies arrive here. */
export const ParentChat: React.FC = () => {
  const { activeChild, language, role, contacts, sendContactMessage, markContactRead, isServerMode, inviteCodes, currentUserName, showNotification } = useApp();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const ownThread = role ? OWN_THREAD[role] : undefined;
  const thread = contacts.find((c) => c.id === ownThread);
  const unread = thread?.unreadStaff ?? 0;
  const msgs = (thread?.messages ?? []).filter((m) => !m.childId || m.childId === activeChild.id);

  // Opening the chat, or a new message arriving while it is open, counts as read.
  useEffect(() => {
    if (ownThread && unread > 0) markContactRead(ownThread);
  }, [ownThread, unread, msgs.length]);

  // Mine: sent by me, or (offline demo, one device) by anyone in my own role.
  const mine = (m: (typeof msgs)[number]) => !m.isParent && (m.senderName === currentUserName || m.senderName.startsWith(currentUserName) || (!isServerMode && m.senderRole === role));
  return (
    <div className="space-y-4" data-testid="parent-chat">
      <section className="rounded-2xl overflow-hidden border border-[#E8E2D9] dark:border-[#2A3942] shadow-card flex flex-col h-[clamp(400px,calc(var(--app-h)-285px),880px)] bg-white dark:bg-[#111B21]">
        <ChatHeader
          title={`${t('Parents of', 'أسرة')} ${activeChild.name}`}
          subtitle={t('Family chat · you and the parents', 'محادثة الأسرة · أنت وولي الأمر')}
          avatar={<Avatar initial={(activeChild.name.trim()[0] ?? '?').toUpperCase()} bg="bg-[#DFE5E7]" text="text-[#54656F]" size={40} />}
        />
        <ChatThread
          messages={msgs}
          isMine={mine}
          unreadByOther={thread?.unreadCount ?? 0}
          isAr={isAr}
          showNames
          emptyText={t('No messages yet. Say hello to the family.', 'لا توجد رسائل بعد. ابدأ بالتحية.')}
          notice={t('Messages here are shared only with this child’s parents and care team.', 'الرسائل هنا مشتركة فقط مع والدي الطفل وفريق الرعاية.')}
        />
        <ChatComposer
          isAr={isAr}
          label={t('Message to parents', 'رسالة إلى الأهل')}
          placeholder={t('Write to the parents…', 'اكتب إلى الأهل…')}
          disabled={!ownThread}
          notify={showNotification}
          onSend={(text, attachment) => { if (ownThread) sendContactMessage(ownThread, text, undefined, attachment); }}
        />
      </section>

      {isServerMode && inviteCodes.some((c) => c.inviteCode) && (
        <section className={CARD}>
          <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Family invite codes', 'رموز دعوة الأسر')}</h3>
          <p className="text-xs text-[#5C706C]">{t('Give a parent the code for their child. They enter it when creating their account.', 'أعطِ ولي الأمر رمز طفله ليدخله عند إنشاء حسابه.')}</p>
          {inviteCodes.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-[#EDE8DF] dark:border-[#38325E] last:border-b-0 text-sm">
              <span>{c.name}</span>
              <code className="px-2.5 py-1 rounded-lg bg-[#F4EEE6] dark:bg-[#252044] font-bold tracking-widest select-all">{c.inviteCode}</code>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

/** Assign home tasks to the family and see what they have done. */
export const HomeTasksManager: React.FC = () => {
  const { activeChild, language, role, homeTasks, addHomeTask, removeHomeTask, currentUserName } = useApp();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const [ht, setHt] = useState({ title: '', instructions: '', frequency: 'Daily', dueDate: '' });
  const [share, setShare] = useState(false);
  const tasks = homeTasks.filter((h) => h.childId === activeChild.id);

  return (
    <div className="space-y-4" data-testid="home-tasks-manager">
      <form
        className={CARD}
        onSubmit={(e) => {
          e.preventDefault();
          if (!ht.title.trim()) return;
          addHomeTask({ childId: activeChild.id, title: ht.title.trim(), instructions: ht.instructions.trim(), frequency: ht.frequency, dueDate: ht.dueDate, assignedBy: currentUserName });
          setHt({ title: '', instructions: '', frequency: 'Daily', dueDate: '' });
        }}
      >
        <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Assign a home task', 'تكليف مهمة منزلية')}</h3>
        <Field label={t('Task', 'المهمة')}>
          <input value={ht.title} onChange={(e) => setHt({ ...ht, title: e.target.value })} dir="auto" className={INPUT} placeholder={t('e.g. Practice asking for a break', 'مثل: تدرّب على طلب الاستراحة')} />
        </Field>
        <Field label={t('How to do it', 'طريقة التنفيذ')}>
          <textarea rows={2} value={ht.instructions} onChange={(e) => setHt({ ...ht, instructions: e.target.value })} dir="auto" className={INPUT} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('How often', 'التكرار')}>
            <select value={ht.frequency} onChange={(e) => setHt({ ...ht, frequency: e.target.value })} className={INPUT}>
              {['Daily', '3× per week', 'Weekly', 'Once'].map((f) => <option key={f}>{f}</option>)}
            </select>
          </Field>
          <Field label={t('Due', 'الموعد')}>
            <input type="date" value={ht.dueDate} onChange={(e) => setHt({ ...ht, dueDate: e.target.value })} className={INPUT} />
          </Field>
        </div>
        <button type="submit" disabled={!ht.title.trim()} className={`${BTN} w-full`}>{t('Assign to family', 'تكليف الأسرة')}</button>
      </form>

      <section className={CARD}>
        <h3 className="font-heading font-bold text-base text-[#0F2A27] dark:text-white">{t('Family progress', 'تقدم الأسرة')}</h3>
        {tasks.length === 0 && <p className="text-sm text-[#5C706C]">{t('No home tasks assigned yet.', 'لم تُكلَّف مهام منزلية بعد.')}</p>}
        {tasks.map((h) => (
          <div key={h.id} className="flex items-start gap-3 py-2 border-b border-[#EDE8DF] dark:border-[#38325E] last:border-b-0">
            {h.done ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" /> : <Circle className="w-5 h-5 text-[#9AA7A4] shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0 text-xs space-y-0.5">
              <p className={`text-sm font-semibold ${h.done ? 'line-through text-[#5C706C]' : ''}`} dir="auto">{h.title}</p>
              {h.instructions && <p className="text-[#5C706C] whitespace-pre-line" dir="auto">{h.instructions}</p>}
              <p className="text-[#5C706C]">{h.frequency}{h.dueDate ? ` · ${t('due', 'الموعد')} ${h.dueDate}` : ''}</p>
              {h.done && h.doneAt && <p className="text-emerald-700">{t('Done', 'تم')} {new Date(h.doneAt).toLocaleDateString()}{h.parentNote ? ` — “${h.parentNote}”` : ''}</p>}
            </div>
            <button type="button" aria-label={t('Remove task', 'إزالة المهمة')} onClick={() => removeHomeTask(h.id)} className="p-1 text-[#9AA7A4] hover:text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
        <button type="button" disabled={tasks.length === 0} onClick={() => setShare(true)} className={`${BTN_GHOST} w-full`}>{t('Send to parents', 'إرسال إلى ولي الأمر')}</button>
      </section>

      {share && role && role !== 'parent' && ['behavior', 'speech', 'ot', 'remedial'].includes(role) && (
        <ShareToTeamModal
          role={role as TherapyRole}
          isAr={isAr}
          title={t('Send home-practice status', 'إرسال حالة التدريب المنزلي')}
          subtitle={activeChild.name}
          text={tasksText({ childName: activeChild.name, bip: undefined, abc: [], reinforcers: [], tasks })}
          tag="Home Practice"
          childName={activeChild.name}
          authorName={currentUserName}
          onClose={() => setShare(false)}
        />
      )}
    </div>
  );
};

/** The "Family" tab for therapists: chat with the parents and home tasks. */
export const FamilyPanel: React.FC = () => {
  const { language, activeChild } = useApp();
  const isAr = language === 'ar';
  const t = (en: string, ar: string) => (isAr ? ar : en);
  const unread = useUnreadForRole();
  const [section, setSection] = useState<'chat' | 'home' | 'records'>('chat');
  const items = [
    { id: 'chat' as const, en: 'Parent chat', ar: 'محادثة الأسرة' },
    { id: 'home' as const, en: 'Home tasks', ar: 'مهام المنزل' },
    { id: 'records' as const, en: 'Medical', ar: 'السجلات الطبية' },
  ];
  return (
    <div className="space-y-4 pb-28 animate-in fade-in" data-testid="family-panel">
      <div>
        <h2 className={`font-heading leading-tight font-bold text-[#0F2A27] dark:text-white ${section === 'chat' ? 'text-2xl' : 'text-[28px]'}`}>{t('Family', 'الأسرة')}</h2>
        {section === 'home' && <p className="text-sm text-[#5C706C] dark:text-[#A5A0C2] mt-1">{t('Home practice for', 'التدريب المنزلي لـ')} {activeChild.name}.</p>}
      </div>
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#EDE8DF] dark:bg-[#252044]" role="tablist">
        {items.map((it) => (
          <button key={it.id} type="button" role="tab" aria-selected={section === it.id} onClick={() => setSection(it.id)}
            className={`py-2 rounded-xl text-sm font-semibold transition ${section === it.id ? 'bg-white dark:bg-[#1F1B3A] shadow-card text-[#0F2A27] dark:text-white' : 'text-[#5C706C]'}`}>
            {t(it.en, it.ar)}
            {it.id === 'chat' && unread > 0 && <span className="ms-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">{unread}</span>}
          </button>
        ))}
      </div>
      {section === 'chat' ? <ParentChat /> : section === 'home' ? <HomeTasksManager /> : <MedicalRecordsPanel mode="staff" embedded />}
    </div>
  );
};
