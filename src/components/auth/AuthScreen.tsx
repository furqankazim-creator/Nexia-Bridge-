import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiUrl } from '../../api/client';
import type { AuthUser } from '../../api/client';

const ROLES: { id: AuthUser['role']; label: string }[] = [
  { id: 'parent', label: 'Parent' },
  { id: 'behavior', label: 'Behavior therapist' },
  { id: 'speech', label: 'Speech therapist' },
  { id: 'ot', label: 'Occupational therapist' },
  { id: 'remedial', label: 'Remedial teacher' },
  { id: 'teacher', label: 'Classroom teacher' },
  { id: 'supervisor', label: 'Supervisor' },
  { id: 'admin', label: 'Administrator' },
];

const INPUT = 'w-full text-base px-4 py-3 rounded-2xl border border-[#DCE3E1] bg-white outline-none focus:border-[#0F766E] focus:ring-2 focus:ring-teal-100';

export const AuthScreen: React.FC = () => {
  const { login, register, useDemo, gate } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<AuthUser['role']>('parent');
  const [code, setCode] = useState('');
  const [url, setUrl] = useState(getApiUrl());
  const [showServer, setShowServer] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (gate === 'checking') {
    return (
      <div className="min-h-full flex flex-col items-center justify-center gap-3 p-6">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F766E]" />
        <p className="text-sm text-[#5C706C]">Connecting…</p>
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
      if (mode === 'login') await login(email, password, url);
      else await register({ name, email, password, role, code }, url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full max-w-md w-full mx-auto flex flex-col justify-center gap-5 p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <div>
        <h1 className="font-heading text-3xl font-bold text-[#0F2A27]">Nexia Bridge</h1>
        <p className="text-sm text-[#5C706C] mt-1">One child, one team, one shared picture.</p>
      </div>

      <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-[#EDE8DF]" role="tablist">
        {(['login', 'register'] as const).map((m) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(''); }}
            className={`py-2 rounded-xl text-sm font-semibold transition ${mode === m ? 'bg-white shadow-card text-[#0F2A27]' : 'text-[#5C706C]'}`}>
            {m === 'login' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3" noValidate>
        {mode === 'register' && (
          <>
            <input aria-label="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={INPUT} />
            <select aria-label="I am a" value={role} onChange={(e) => setRole(e.target.value as AuthUser['role'])} className={INPUT}>
              {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </>
        )}
        <input aria-label="Email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className={INPUT} />
        <input aria-label="Password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === 'register' ? 'Password (8+ characters)' : 'Password'} className={INPUT} />
        {mode === 'register' && (
          <label className="block">
            <input aria-label="Invite code" autoCapitalize="characters" value={code} onChange={(e) => setCode(e.target.value)} placeholder={role === 'parent' ? 'Your child’s invite code' : role === 'admin' ? 'Administrator code' : 'Staff invite code'} className={INPUT} />
            <span className="block text-xs text-[#5C706C] mt-1.5 px-1">
              {role === 'parent' ? 'Ask your child’s therapist for the family code.' : role === 'admin' ? 'The administrator code is separate from the staff code and is shown when the server starts.' : 'Your clinic gives staff this code.'}
            </span>
          </label>
        )}

        {error && <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">{error}</p>}

        <button type="submit" disabled={busy} className="w-full py-3.5 rounded-2xl bg-[#0F766E] hover:bg-[#0B5F58] disabled:opacity-60 text-white font-heading font-semibold text-base flex items-center justify-center gap-2">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>

      <div className="text-center space-y-2">
        <button type="button" onClick={() => setShowServer((s) => !s)} className="text-xs text-[#5C706C] underline">
          {showServer ? 'Hide server address' : 'Server address'}
        </button>
        {showServer && (
          <input aria-label="Server address" inputMode="url" autoCapitalize="none" autoCorrect="off" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://192.168.1.2:4000" className={INPUT} />
        )}
        <div>
          <button type="button" onClick={useDemo} className="text-sm font-semibold text-[#0F766E] underline">Try the offline demo</button>
          <p className="text-[11px] text-[#5C706C] mt-1">The demo runs on this device only and is not shared with anyone.</p>
        </div>
      </div>
    </div>
  );
};
