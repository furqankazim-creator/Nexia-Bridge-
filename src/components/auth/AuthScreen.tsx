import React, { useState } from 'react';
import { Activity, ArrowLeft, BookOpen, Eye, EyeOff, Heart, KeyRound, Loader2, Lock, Mail, ShieldCheck, User, Users } from 'lucide-react';
import { useAuth, RoleMismatch } from '../../context/AuthContext';
import { getApiUrl, serverConfigured } from '../../api/client';
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
const GROUP_LOOK: Record<RoleGroup, { Icon: React.ComponentType<{ className?: string }>; chip: string }> = {
  parent: { Icon: Heart, chip: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900' },
  therapist: { Icon: Activity, chip: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900' },
  teacher: { Icon: BookOpen, chip: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900' },
  supervisor_admin: { Icon: ShieldCheck, chip: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-200 dark:border-slate-700' },
};

export const groupOf = (r: Role): RoleGroup => (Object.keys(GROUP_ROLES) as RoleGroup[]).find((g) => GROUP_ROLES[g].includes(r)) ?? 'parent';

const INPUT = 'w-full text-base ps-11 pe-4 py-3.5 rounded-2xl border border-[#E8E2D9] dark:border-[#38325E] bg-white dark:bg-[#1F1B3A] text-[#1F1B3A] dark:text-white placeholder:text-[#9A97B0] outline-none focus:border-[#4F46E5] focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/40';

interface AuthScreenProps {
  /** The welcome-page card the person came through: limits sign-in and sign-up to those accounts. */
  group?: RoleGroup;
  /** The specific role picked on the welcome page (for sign-up). */
  role?: Role;
  initialMode?: 'login' | 'register';
  onBack?: () => void;
  /** Practice version: the same sign-in page, with a sample account already filled in. */
  demo?: { onEnter: (role: Role) => void };
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ group, role: pickedRole, initialMode = 'login', onBack, demo }) => {
  const { login, register, useDemo, leaveDemo, gate } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const allowed = group ? GROUP_ROLES[group] : ROLES.map((r) => r.id);
  const [role, setRole] = useState<Role>(pickedRole && allowed.includes(pickedRole) ? pickedRole : allowed[0]);
  const demoEmail = `${role === 'parent' ? 'sarah' : role}@demo.nexia`;
  const [code, setCode] = useState('');
  const [url, setUrl] = useState(getApiUrl());
  const [showServer, setShowServer] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (gate === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-6 bg-[#FBF7F2]" style={{ minHeight: 'var(--app-h, 100vh)' }}>
        <div className="w-14 h-14 rounded-2xl bg-[#4F46E5] flex items-center justify-center text-white shadow-warm">
          <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 stroke-current stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17C6 11 10 8 12 8C14 8 18 11 21 17M12 8V20M6 14C8 12 10 11 12 11C14 11 16 12 18 14" /></svg>
        </div>
        <p className="font-heading text-xl font-bold text-[#1F1B3A]">Nexia Bridge</p>
        <Loader2 className="w-5 h-5 animate-spin text-[#4F46E5]" />
        <p className="text-xs text-[#6B6785]">Connecting…</p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (demo) {
      setBusy(true);
      window.setTimeout(() => demo.onEnter(role), 450); // a short pause so it feels like signing in
      return;
    }
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

  const look = group ? GROUP_LOOK[group] : null;
  const who = group ? (pickedRole ? roleLabel(pickedRole) : GROUP_NAME[group]) : null;
  const field = (Icon: React.ComponentType<{ className?: string }>, input: React.ReactNode, extra?: React.ReactNode) => (
    <div className="relative">
      <Icon className="w-[18px] h-[18px] absolute top-1/2 -translate-y-1/2 start-4 text-[#9A97B0] pointer-events-none" />
      {input}
      {extra}
    </div>
  );

  return (
    <div className="relative overflow-hidden bg-[#FBF7F2] dark:bg-[#14122B] text-[#1F1B3A] dark:text-white transition-colors flex" style={{ minHeight: 'var(--app-h, 100vh)' }}>
      <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-200/25 dark:bg-indigo-900/15 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#FFE4DF]/40 dark:bg-rose-900/10 rounded-full blur-3xl pointer-events-none -ml-20" />

      <div className="relative z-10 w-full max-w-md md:max-w-5xl mx-auto flex flex-col md:grid md:grid-cols-2 md:gap-12 md:items-center px-5 sm:px-6 md:px-10 pt-[calc(env(safe-area-inset-top)+1rem)] pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        {/* Left on computers, top on phones: who you are signing in as */}
        <div className="pt-2 md:pt-0">
          {onBack && (
            <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#4F46E5] dark:text-indigo-300 mb-5 hover:underline">
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> Back
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#4F46E5] flex items-center justify-center text-white shadow-warm">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 stroke-current stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17C6 11 10 8 12 8C14 8 18 11 21 17M12 8V20M6 14C8 12 10 11 12 11C14 11 16 12 18 14" /></svg>
            </div>
            <span className="font-heading text-2xl font-bold tracking-tight">Nexia Bridge</span>
          </div>

          <h1 className="font-heading text-3xl md:text-4xl font-bold leading-[1.2] mt-6">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-base text-[#6B6785] dark:text-[#A5A0C2] mt-2">
            {mode === 'login' ? 'Sign in to continue with your child’s team.' : 'It takes a minute. You will need an invite code.'}
          </p>
          {look && who && (
            <span className={`inline-flex items-center gap-2 mt-4 px-3.5 py-1.5 rounded-full border text-sm font-bold ${look.chip}`}>
              <look.Icon className="w-4 h-4" />{who}
            </span>
          )}

          <ul className="hidden md:block mt-10 space-y-4">
            {[
              { Icon: Users, t: 'One child, one team', d: 'Parents, therapists, teachers and supervisors see one shared picture.' },
              { Icon: Lock, t: 'Parents stay in control', d: 'Families decide which professionals see medical records.' },
              { Icon: ShieldCheck, t: 'Private by design', d: 'Everyone only sees what their role needs.' },
            ].map(({ Icon, t, d }) => (
              <li key={t} className="flex gap-3">
                <span className="w-10 h-10 shrink-0 rounded-xl bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] flex items-center justify-center text-[#4F46E5]"><Icon className="w-5 h-5" /></span>
                <span><span className="block font-heading font-semibold">{t}</span><span className="block text-sm text-[#6B6785] dark:text-[#A5A0C2]">{d}</span></span>
              </li>
            ))}
          </ul>
        </div>

        {/* The form */}
        <div className="mt-6 md:mt-0 flex-1 md:flex-none flex flex-col">
          <div className="bg-white dark:bg-[#1F1B3A] border border-[#E8E2D9] dark:border-[#38325E] rounded-3xl shadow-card p-5 sm:p-6 space-y-4">
            {demo && <p className="text-xs rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-[#4338CA] dark:text-indigo-200 border border-indigo-100 dark:border-indigo-900 px-3 py-2">Practice version. A sample account is filled in for you. Nothing is saved to a server.</p>}
            {!demo && <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#F4EEE6] dark:bg-[#252044]" role="tablist">
              {(['login', 'register'] as const).map((m) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(''); }}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition ${mode === m ? 'bg-white dark:bg-[#1F1B3A] shadow-card text-[#1F1B3A] dark:text-white' : 'text-[#6B6785] dark:text-[#A5A0C2]'}`}>
                  {m === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>}

            <form onSubmit={submit} className="space-y-3" noValidate>
              {demo && allowed.length > 1 && (
                <select aria-label="I am a" value={role} onChange={(e) => setRole(e.target.value as Role)} className={`${INPUT} ps-4`}>
                  {ROLES.filter((r) => allowed.includes(r.id)).map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select>
              )}
              {mode === 'register' && !demo && (
                <>
                  {field(User, <input aria-label="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={INPUT} />)}
                  {allowed.length > 1 && (
                    <select aria-label="I am a" value={role} onChange={(e) => setRole(e.target.value as Role)} className={`${INPUT} ps-4`}>
                      {ROLES.filter((r) => allowed.includes(r.id)).map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select>
                  )}
                </>
              )}
              {field(Mail, <input aria-label="Email" type="email" inputMode="email" autoComplete="email" value={demo ? demoEmail : email} readOnly={!!demo} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={INPUT} />)}
              {field(Lock,
                <input aria-label="Password" type={showPw ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={demo ? 'demo-password' : password} readOnly={!!demo} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? 'Password (8+ characters)' : 'Password'} className={`${INPUT} pe-12`} />,
                <button type="button" onClick={() => setShowPw((v) => !v)} aria-label={showPw ? 'Hide password' : 'Show password'} className="absolute top-1/2 -translate-y-1/2 end-3 p-1.5 text-[#9A97B0] hover:text-[#4F46E5]">
                  {showPw ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              )}
              {mode === 'register' && (
                <div>
                  {field(KeyRound, <input aria-label="Invite code" autoCapitalize="characters" value={code} onChange={(e) => setCode(e.target.value)} placeholder={role === 'parent' ? 'Your child’s invite code' : role === 'admin' ? 'Administrator code' : 'Staff invite code'} className={INPUT} />)}
                  <span className="block text-xs text-[#6B6785] dark:text-[#A5A0C2] mt-1.5 px-1">
                    {role === 'parent' ? 'Ask your child’s therapist for the family code.' : role === 'admin' ? 'The administrator code is separate from the staff code and is shown when the server starts.' : 'Your clinic gives staff this code.'}
                  </span>
                </div>
              )}

              {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl px-3 py-2.5">{error}</p>}

              <button type="submit" disabled={busy} className="w-full py-3.5 rounded-2xl bg-[#4F46E5] hover:bg-[#4338CA] disabled:opacity-60 text-white font-heading font-semibold text-base shadow-warm active:scale-[0.99] transition flex items-center justify-center gap-2">
                {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === 'login' ? 'Sign in' : 'Create account'}
              </button>
            </form>

            {mode === 'login' && !demo && <p className="text-xs text-center text-[#6B6785] dark:text-[#A5A0C2]">Forgot your password? Ask your clinic administrator for help.</p>}
          </div>

          <div className="text-center space-y-2 mt-5">
            <div className="flex items-center justify-center gap-2 text-xs text-[#6B6785] dark:text-[#8E8AAB] px-4 py-2 bg-[#F4EEE6]/70 dark:bg-[#1D193B]/70 rounded-xl border border-[#E8E2D9]/80 dark:border-[#2D284D]">
              <Lock className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              <span>Parents decide which professionals can see their child’s information.</span>
            </div>
            {demo ? (
              serverConfigured() && <button type="button" onClick={leaveDemo} className="text-sm font-semibold text-[#4F46E5] dark:text-indigo-300 underline">Use the real system instead</button>
            ) : (<>
            <button type="button" onClick={() => setShowServer((s) => !s)} className="text-xs text-[#6B6785] dark:text-[#A5A0C2] underline">
              {showServer ? 'Hide server address' : 'Server address'}
            </button>
            {showServer && (
              <input aria-label="Server address" inputMode="url" autoCapitalize="none" autoCorrect="off" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://192.168.1.2:4000" className={`${INPUT} ps-4`} />
            )}
            <div>
              <button type="button" onClick={useDemo} className="text-sm font-semibold text-[#4F46E5] dark:text-indigo-300 underline">Try the offline demo</button>
              <p className="text-[11px] text-[#6B6785] dark:text-[#A5A0C2] mt-1">The demo runs on this device only and is not shared with anyone.</p>
            </div>
            </>)}
          </div>
        </div>
      </div>
    </div>
  );
};
