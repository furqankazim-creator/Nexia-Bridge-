import React from 'react';
import { X } from 'lucide-react';
import type { AuthUser, CenterType } from '../../api/client';

export const CARD = 'bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-2xl p-4 shadow-card';
export const BTN = 'px-3.5 py-2 rounded-xl bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold active:scale-95 transition disabled:opacity-50';
export const BTN_GHOST = 'px-3.5 py-2 rounded-xl border-[1.5px] border-[#4F46E5] text-[#4F46E5] dark:text-indigo-300 text-xs font-bold bg-white dark:bg-transparent active:scale-95 transition disabled:opacity-50';
export const BTN_DANGER = 'px-3.5 py-2 rounded-xl border-[1.5px] border-rose-500 text-rose-600 text-xs font-bold bg-white dark:bg-transparent active:scale-95 transition disabled:opacity-50';
export const INPUT = 'w-full text-sm px-3.5 py-2.5 rounded-xl border border-[#E2E6EA] dark:border-[#38325E] bg-[#F8FAFC] dark:bg-[#252044] outline-none focus:border-[#4F46E5]';

export const ROLE_LABEL: Record<AuthUser['role'], string> = {
  parent: 'Parent', admin: 'Administrator', supervisor: 'Supervisor', teacher: 'Special-education teacher',
  behavior: 'Behavior therapist', speech: 'Speech therapist', ot: 'Occupational therapist', remedial: 'Remedial teacher',
};
export const STAFF_ROLES: AuthUser['role'][] = ['behavior', 'speech', 'ot', 'remedial', 'teacher', 'supervisor'];
export const CENTER_TYPE_LABEL: Record<CenterType, string> = { special_education: 'Special education', speech_therapy: 'Speech therapy', clinic: 'Clinic' };

export const money = (n: number, cur = 'SAR') => `${cur} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const when = (iso: string) => { const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }); };

/** A bottom sheet on mobile (<768px) and centered modal dialog on desktop web (>=768px). */
export const Sheet: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-end md:items-center justify-center md:p-6" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
    <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-[#1F1B3A] w-full md:max-w-lg rounded-t-3xl md:rounded-3xl shadow-float p-5 md:p-6 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] md:pb-6 space-y-3 max-h-[90%] overflow-y-auto">
      <div className="flex items-start justify-between gap-3"><h4 className="font-heading font-bold text-base">{title}</h4><button type="button" onClick={onClose} aria-label="Close" className="p-1 text-gray-400"><X className="w-5 h-5" /></button></div>
      {children}
    </div>
  </div>
);

export const Field: React.FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <label className="block"><span className="text-xs font-bold block mb-1">{label}</span>{children}{hint && <span className="block text-[11px] text-[#6B6785] mt-1">{hint}</span>}</label>
);

export const Chip: React.FC<{ on: boolean; onClick: () => void; disabled?: boolean; children: React.ReactNode }> = ({ on, onClick, disabled, children }) => (
  <button type="button" aria-pressed={on} disabled={disabled} onClick={onClick} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${on ? 'bg-[#4F46E5] text-white border-[#4F46E5]' : 'bg-white dark:bg-transparent text-[#6B6785] border-[#E8E2D9] dark:border-[#38325E]'}`}>{children}</button>
);

export const Pill: React.FC<{ tone?: 'green' | 'amber' | 'red' | 'grey' | 'indigo'; children: React.ReactNode }> = ({ tone = 'grey', children }) => {
  const c = { green: 'bg-emerald-100 text-emerald-800', amber: 'bg-amber-100 text-amber-800', red: 'bg-rose-100 text-rose-700', grey: 'bg-gray-100 text-gray-600', indigo: 'bg-indigo-100 text-indigo-800' }[tone];
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c}`}>{children}</span>;
};

export const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className={CARD}><p className="text-sm text-[#6B6785]">{children}</p></div>;

export const randomPassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const a = new Uint32Array(10);
  crypto.getRandomValues(a);
  return Array.from(a, (n) => chars[n % chars.length]).join('');
};

/** Plain-language line for an audit entry, e.g. "Created account". */
const ACTION_TITLE: Record<string, string> = {
  'account.register': 'Account Registered', 'auth.login': 'Signed In', 'auth.login_failed': 'Failed Sign-in Attempt',
  'record.write': 'Updated Clinical Record', 'record.delete': 'Removed Clinical Record',
  'admin.create_account': 'Created Account', 'admin.update_account': 'Updated Account', 'admin.remove_account': 'Removed Account',
  'admin.create_center': 'Created Centre', 'admin.update_center': 'Updated Centre', 'admin.create_child': 'Added Child',
  'admin.update_child': 'Updated Case', 'admin.assign_team': 'Reassigned Care Team', 'admin.regenerate_family_code': 'Replaced Family Code',
  'admin.create_invoice': 'Created Invoice', 'admin.update_invoice': 'Updated Invoice', 'admin.update_settings': 'Changed Organisation Settings',
  'admin.rotate_staff_code': 'Replaced Staff Invite Code',
};
export const eventTitle = (action: string) => ACTION_TITLE[action] ?? action;
const COL_WORD: Record<string, string> = { targets: 'goal', savedSessions: 'session note', bips: 'behavior plan' };
export const eventDetail = (e: { userName: string | null; role: string | null; action: string; details?: Record<string, unknown> }) => {
  const who = e.userName ?? 'System';
  const d = e.details ?? {};
  const what = typeof d.targetName === 'string' ? d.targetName : typeof d.col === 'string' ? COL_WORD[d.col] ?? d.col : typeof d.number === 'string' ? d.number : '';
  return [who, e.role ? ROLE_LABEL[e.role as AuthUser['role']] ?? e.role : '', what].filter(Boolean).join(' · ');
};

/** "Today, 11:42 AM" / "Yesterday, ..." / "12 Oct, ...". */
export const friendlyTime = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(d).setHours(0, 0, 0, 0)) / 86400000);
  return `${days === 0 ? 'Today' : days === 1 ? 'Yesterday' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}, ${time}`;
};
export const longDate = (iso: string) => { const d = new Date(`${iso}T00:00:00`); return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); };
export const monthYear = (ym: string) => { const d = new Date(`${ym}-01T00:00:00`); return Number.isNaN(d.getTime()) ? ym : d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); };
