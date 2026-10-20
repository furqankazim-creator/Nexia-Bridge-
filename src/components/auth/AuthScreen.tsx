import React, { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth, RoleMismatch } from '../../context/AuthContext';
import { getApiUrl } from '../../api/client';
import type { AuthUser } from '../../api/client';

type Role = AuthUser['role'];
export type RoleGroup = 'parent' | 'therapist' | 'teacher' | 'supervisor_admin';

const ROLES: { id: Role; label: string }[] = [
  { id: 'parent', label: 'Parent' },
  { id: 'behavior', label: 'Behavior therapist' },
  { id: 'speech', label: 'Speech therapist' },
  { id: 'ot', label: 'Occupational therapist' },
  { id: 'remedial', label: 'Remedial teacher' },
  { id: 'teacher', label: 'Classroom teacher' },
  { id: 'supervisor', label: 'Supervisor' },
  { id: 'admin', label: 'Administrator' },
];
const roleLabel = (r: Role) => ROLES.find((x) => x.id === r)?.label ?? r;

/** Which accounts belong to each card on the welcome page. */
export const GROUP_ROLES: Record<RoleGroup, Role[]> = {
  parent: ['parent'],
  therapist: ['behavior', 'speech', 'ot'],
  teacher: ['teacher', 'remedial'],
  supervisor_admin: ['supervisor', 'admin'],
};
const GROUP_NAME: Record<RoleGroup, string> = { parent: 'Parent or caregiver', therapist: 'Therapist', teacher: 'Teacher', supervisor_admin: 'Supervisor or admin' };
export const groupOf = (r: Role): RoleGroup => (Object.keys(GROUP_ROLES) as RoleGroup[]).find((g) => GROUP_ROLES[g].includes(r)) ?? 'parent';

const INPUT = 'w-full text-base px-4 py-3 rounded-2xl border border-[#E8E2D9] dark:border-[#38325E] bg-white dark:bg-[#1F1B3A] text-[#1F1B3A] dark:text-white placeholder:text-[#9A97B0] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40';

interface AuthScreenProps {
  /** The welcome-page card the person came through: limits sign-in and sign-up to those accounts. */
  group?: RoleGroup;
  /** The specific role picked on the welcome page (for sign-up). */
  role?: Role;
  initialMode?: 'login' | 'register';
  onBack?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ group, role: pickedRole, initialMode = 'login', onBack }) => {
  const { login, register, useDemo, gate } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const allowed = group ? GROUP_ROLES[group] : ROLES.map((r) => r.id);
  const [role, setRole] = useState<Role>(pickedRole && allowed.includes(pickedRole) ? pickedRole : allowed[0]);
  const [code, setCode] = useState('');
  const [url, setUrl] = useState(getApiUrl());
  const [showServer, setShowServer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (gate === 'checking') {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-3 p-6">
        <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5]" />
        <p className="text-sm text-[#6B6785] dark:text-[#A5A0C2]">Connecting…</p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!url.trim()) {
      setShowServer(true);
      setError('Enter the server address.');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'login') await login(email, password, url, group ? GROUP_ROLES[group] : undefined);
      else await register({ name, email, password, role, code }, url);
    } catch (err) {
      if (err instanceof RoleMismatch) setError(`That email belongs to a ${roleLabel(err.actual).toLowerCase()} account. Go back and choose ${GROUP_NAME[groupOf(err.actual)]}.`);
      else setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full bg-[#FBF7F2] dark:bg-[#14122B] text-[#1F1B3A] dark:text-white transition-colors">
    <div className="min-h-full max-w-md w-full mx-auto flex flex-col justify-center gap-5 p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div>
        {onBack && (
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#4F46E5] dark:text-indigo-300 mb-4 hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        )}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-[#4F46E5] flex items-center justify-center text-white">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 stroke-current stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17C6 11 10 8 12 8C14 8 18 11 21 17M12 8V20M6 14C8 12 10 11 12 11C14 11 16 12 18 14" /></svg>
          </div>
          <h1 className="font-heading text-2xl font-bold tracking-tight">Nexia Bridge</h1>
        </div>
        <p className="text-sm text-[#6B6785] dark:text-[#A5A0C2] mt-3">
          {group ? <>You are signing in as <strong className="text-[#1F1B3A] dark:text-white">{pickedRole ? roleLabel(pickedRole) : GROUP_NAME[group]}</strong>.</> : 'One child, one team, one shared picture.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#EDE8DF] dark:bg-[#252044]" role="tablist">
        {(['login', 'register'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(''); }}
            className={`py-2 rounded-xl text-sm font-semibold transition ${mode === m ? 'bg-white dark:bg-[#1F1B3A] shadow-card text-[#1F1B3A] dark:text-white' : 'text-[#6B6785] dark:text-[#A5A0C2]'}`}>
            {m === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3" noValidate>
        {mode === 'register' && (
          <>
            <input aria-label="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={INPUT} />
            <select aria-label="I am a" value={role} onChange={(e) => setRole(e.target.value as AuthUser['role'])} className={INPUT}>
              {ROLES.filter((r) => allowed.includes(r.id)).map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </>
        )}
        <input aria-label="Email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={INPUT} />
        <input aria-label="Password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? 'Password (8+ characters)' : 'Password'} className={INPUT} />
        {mode === 'register' && (
          <label className="block">
            <input aria-label="Invite code" autoCapitalize="characters" value={code} onChange={(e) => setCode(e.target.value)} placeholder={role === 'parent' ? 'Your child’s invite code' : role === 'admin' ? 'Administrator code' : 'Staff invite code'} className={INPUT} />
            <span className="block text-xs text-[#6B6785] dark:text-[#A5A0C2] mt-1.5 px-1">
              {role === 'parent' ? 'Ask your child’s therapist for the family code.' : role === 'admin' ? 'The administrator code is separate from the staff code and is shown when the server starts.' : 'Your clinic gives staff this code.'}
            </span>
          </label>
        )}

        {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl px-3 py-2">{error}</p>}

        <button type="submit" disabled={busy} className="w-full py-3.5 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-60 text-white font-heading font-semibold text-base flex items-center justify-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <div className="text-center space-y-2">
        <button type="button" onClick={() => setShowServer((s) => !s)} className="text-xs text-[#6B6785] dark:text-[#A5A0C2] underline">
          {showServer ? 'Hide server address' : 'Server address'}
        </button>
        {showServer && (
          <input aria-label="Server address" inputMode="url" autoCapitalize="none" autoCorrect="off" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://192.168.1.2:4000" className={INPUT} />
        )}
        <div>
          <button type="button" onClick={useDemo} className="text-sm font-semibold text-[#4F46E5] dark:text-indigo-300 underline">Try the offline demo</button>
          <p className="text-[11px] text-[#6B6785] dark:text-[#A5A0C2] mt-1">The demo runs on this device only and is not shared with anyone.</p>
        </div>
      </div>
    </div>
    </div>
  );
};
