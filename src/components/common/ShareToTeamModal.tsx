import React, { useState } from 'react';
import { Check, Send, X } from 'lucide-react';
import type { TherapyRole } from '../../types';
import { useApp } from '../../context/AppContext';

const OWN_THREAD: Record<TherapyRole | 'teacher', string> = { behavior: 'contact-bcba', speech: 'contact-slp', ot: 'contact-ot', remedial: 'contact-teacher', teacher: 'contact-teacher' };

interface Props {
  role: TherapyRole | 'teacher';
  isAr: boolean;
  title: string;
  subtitle: string;
  text: string;
  /** Label shown on the posted message and notification, e.g. "SOAP Note", "BIP". */
  tag: string;
  childName: string;
  authorName: string;
  onClose: () => void;
}

/** In-app recipient picker: posts a document into care-team chat threads, never leaves the app. */
export const ShareToTeamModal: React.FC<Props> = ({ role, isAr, title, subtitle, text, tag, childName, authorName, onClose }) => {
  const { contacts, shareSoapNote } = useApp();
  const ownThread = OWN_THREAD[role];
  const [selected, setSelected] = useState<string[]>([ownThread]);

  const toggle = (id: string) => setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  // The therapist's own thread is the one the family sees, so it represents "Parent / Family".
  const recipients = [
    { id: ownThread, name: isAr ? 'ولي الأمر' : 'Parents', sub: isAr ? 'تصل مباشرة إلى ولي الأمر' : 'Delivered straight to the parents', initial: isAr ? 'أ' : 'P', bg: 'bg-[#E0E7FF] text-[#4F46E5]' },
    ...contacts
      .filter((c) => c.id !== ownThread)
      .map((c) => ({ id: c.id, name: c.name, sub: c.roleTitle, initial: c.avatarInitial, bg: `${c.avatarBg} ${c.avatarTextColor}` })),
  ];

  const send = () => {
    shareSoapNote(selected, { text, childName, authorName, authorRole: role, tag });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-end md:items-center justify-center md:p-6" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="bg-white dark:bg-[#1F1B3A] w-full md:max-w-lg rounded-t-3xl md:rounded-3xl border border-[#E8E2D9] dark:border-[#38325E] shadow-float p-5 md:p-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] md:pb-6 space-y-4 max-h-[85%] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-heading font-bold text-base text-[#1F1B3A] dark:text-white">{title}</h4>
            <p className="text-[11px] text-[#6B6785] dark:text-gray-400 mt-0.5">{subtitle}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {(() => {
          const [parent, ...colleagues] = recipients;
          const Row = (r: (typeof recipients)[number]) => {
            const on = selected.includes(r.id);
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => toggle(r.id)}
                  aria-pressed={on}
                  className={`w-full flex items-center gap-3 p-3 rounded-2xl border text-start transition ${
                    on ? 'border-[#4338CA] bg-indigo-50/70 dark:bg-indigo-950/50' : 'border-[#E8E2D9] dark:border-[#38325E] hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <span className={`w-9 h-9 rounded-full ${r.bg} font-bold text-sm flex items-center justify-center shrink-0`}>{r.initial}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-bold text-[#1F1B3A] dark:text-white truncate">{r.name}</span>
                    <span className="block text-[11px] text-[#6B6785] dark:text-gray-400 truncate">{r.sub}</span>
                  </span>
                  <span className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${on ? 'bg-[#4338CA] border-[#4338CA] text-white' : 'border-slate-300 dark:border-slate-600'}`}>
                    {on && <Check className="w-3.5 h-3.5" />}
                  </span>
                </button>
              </li>
            );
          };
          return (
            <>
              <ul className="space-y-2">{Row(parent)}</ul>
              <details className="group">
                <summary className="text-xs font-semibold text-[#4338CA] dark:text-indigo-300 cursor-pointer py-1 select-none">
                  {isAr ? 'مشاركة مع زملاء أيضاً (اختياري)' : 'Also share with colleagues (optional)'}
                </summary>
                <ul className="space-y-2 pt-2">{colleagues.map(Row)}</ul>
              </details>
            </>
          );
        })()}

        <button
          type="button"
          onClick={send}
          disabled={selected.length === 0}
          className="w-full py-3 rounded-xl bg-[#4338CA] hover:bg-[#3730A3] disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
        >
          <Send className="w-4 h-4" />
          {isAr ? (selected.length === 1 && selected[0] === ownThread ? 'إرسال إلى ولي الأمر' : `إرسال (${selected.length})`) : selected.length === 1 && selected[0] === ownThread ? 'Send to parents' : `Send to ${selected.length} ${selected.length === 1 ? 'recipient' : 'recipients'}`}
        </button>
      </div>
    </div>
  );
};
