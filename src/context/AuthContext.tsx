import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError, AuthUser, PublicOrg, getApiUrl, getToken, serverConfigured, setApiUrl, setToken } from '../api/client';

type Gate = 'checking' | 'login' | 'demo' | 'server';

interface AuthContextType {
  gate: Gate;
  user: AuthUser | null;
  token: string | null;
  apiUrl: string;
  /** Staff only: invite codes to give each family. */
  org: PublicOrg | null;
  children_: { id: string; name: string; inviteCode?: string; team?: { id: string; name: string; role: AuthUser['role']; title: string }[] }[];
  /** `expect` is the set of roles the person chose on the welcome page; a different account is turned away. */
  login: (email: string, password: string, apiUrl: string, expect?: AuthUser['role'][]) => Promise<void>;
  register: (v: { name: string; email: string; password: string; role: AuthUser['role']; code: string }, apiUrl: string) => Promise<void>;
  logout: () => void;
  useDemo: () => void;
  leaveDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** The account exists but belongs to another kind of user than the page the person came through. */
export class RoleMismatch extends Error {
  constructor(public actual: AuthUser['role']) {
    super('wrong portal');
  }
}

interface AuthResponse { token: string; user: AuthUser }

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gate, setGate] = useState<Gate>(() => (serverConfigured() ? 'checking' : 'demo'));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTok] = useState<string | null>(null);
  const [org, setOrg] = useState<PublicOrg | null>(null);
  const [kids, setKids] = useState<AuthContextType['children_']>([]);

  const loadMe = useCallback(async (t: string) => {
    const me = await api<{ user: AuthUser; org?: PublicOrg; children: AuthContextType['children_'] }>('/api/me', { token: t });
    setUser(me.user);
    setOrg(me.org ?? null);
    setKids(me.children);
    setTok(t);
    setGate('server');
  }, []);

  // Resume a previous sign-in.
  useEffect(() => {
    if (gate !== 'checking') return;
    const t = getToken();
    if (!t) {
      setGate('login');
      return;
    }
    loadMe(t).catch((e) => {
      // A rejected token means sign in again; an unreachable server must not wipe the saved sign-in.
      if (e instanceof ApiError && e.status === 401) setToken(null);
      setGate('login');
    });
  }, [gate, loadMe]);

  const finish = async (r: AuthResponse) => {
    setToken(r.token);
    await loadMe(r.token);
  };

  const value: AuthContextType = {
    gate,
    user,
    token,
    apiUrl: getApiUrl(),
    org,
    children_: kids,
    login: async (email, password, url, expect) => {
      setApiUrl(url);
      const r = await api<AuthResponse>('/api/auth/login', { method: 'POST', body: { email, password } });
      if (expect && !expect.includes(r.user.role)) throw new RoleMismatch(r.user.role);
      await finish(r);
    },
    register: async (v, url) => {
      setApiUrl(url);
      await finish(await api<AuthResponse>('/api/auth/register', { method: 'POST', body: v }));
    },
    logout: () => {
      setToken(null);
      setUser(null);
      setTok(null);
      setKids([]);
      setGate(serverConfigured() ? 'login' : 'demo');
    },
    useDemo: () => setGate('demo'),
    leaveDemo: () => setGate(serverConfigured() ? 'checking' : 'demo'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used within an AuthProvider');
  return c;
};
