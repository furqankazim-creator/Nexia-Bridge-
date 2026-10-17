const URL_KEY = 'nexia.apiUrl';
const TOKEN_KEY = 'nexia.token';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const safe = {
  get: (k: string) => {
    try {
      return window.localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k: string, v: string) => {
    try {
      window.localStorage.setItem(k, v);
    } catch {
      // storage unavailable
    }
  },
  del: (k: string) => {
    try {
      window.localStorage.removeItem(k);
    } catch {
      // storage unavailable
    }
  },
};

const clean = (u: string) => u.trim().replace(/\/+$/, '');

/** `?api=http://host:4000` in the page address switches a build to server mode. */
const fromQuery = () => {
  try {
    const q = new URLSearchParams(window.location.search).get('api');
    if (q) safe.set(URL_KEY, clean(q));
  } catch {
    // no window.location
  }
};
fromQuery();

export const getApiUrl = (): string => clean(safe.get(URL_KEY) || (import.meta.env.VITE_API_URL as string | undefined) || '');
export const setApiUrl = (u: string) => (u.trim() ? safe.set(URL_KEY, clean(u)) : safe.del(URL_KEY));
/** Server mode is only offered when a server address exists; otherwise the app runs as the local demo. */
export const serverConfigured = (): boolean => !!getApiUrl();

export const getToken = () => safe.get(TOKEN_KEY);
export const setToken = (t: string | null) => (t ? safe.set(TOKEN_KEY, t) : safe.del(TOKEN_KEY));

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'behavior' | 'speech' | 'ot' | 'remedial' | 'teacher' | 'supervisor' | 'admin';
  childIds: string[];
  /** Administrators: the centre they are limited to (none = whole organisation). */
  centerId?: string | null;
  scope?: 'assigned' | 'center';
  title?: string;
  phone?: string;
  centerName?: string | null;
}

export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown; token?: string | null; baseUrl?: string } = {}): Promise<T> {
  const base = clean(opts.baseUrl ?? getApiUrl());
  if (!base) throw new ApiError(0, 'No server address is set.');
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method: opts.method ?? 'GET',
      headers: { 'content-type': 'application/json', ...(opts.token ? { authorization: `Bearer ${opts.token}` } : {}) },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    });
  } catch {
    throw new ApiError(0, `Can't reach the server at ${base}. Check the address and your connection.`);
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, (json as { error?: string }).error || `Request failed (${res.status}).`);
  return json as T;
}

/* ---------- Administrator endpoints ---------- */

export type CenterType = 'special_education' | 'speech_therapy' | 'clinic';
export type StaffScope = 'assigned' | 'center';
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'void';

export interface AdminUser { id: string; name: string; email: string; role: AuthUser['role']; childIds: string[]; disabled?: boolean; centerId: string | null; scope: StaffScope; title?: string; phone?: string }
export interface AdminChild { id: string; name: string; inviteCode: string; centerId: string | null; archived: boolean }
export interface AdminCenter { id: string; name: string; type: CenterType; archived: boolean }
export interface AdminInvoice { id: string; number: string; centerId: string | null; childId: string | null; description: string; amount: number; currency: string; status: InvoiceStatus; dueDate: string | null; issuedAt: string | null; paidAt: string | null; createdAt: string }
export interface InvoiceTotals { draft: number; outstanding: number; paid: number }
export interface AdminAuditEvent { id: string; at: string; userName: string | null; role: string | null; action: string; details?: Record<string, unknown> }

export interface OrgPlan { name: string; seats: number; billingCycle: 'monthly' | 'annual'; billedOn: string; renewalDate: string; status: 'active' | 'paused' }
export interface OrgSettings {
  name: string;
  plan: OrgPlan;
  access: { staffSelfRegistration: boolean; familySignup: boolean };
  policy: { requireGoalApproval: boolean; parentMessaging: boolean; integrityMin: number; ioaMin: number; observationDays: number; stalledDays: number };
  staffCode: string | null;
}
export interface SettingsReply { settings: OrgSettings; seatsUsed: number; canEdit: boolean }
export interface SettingsPatch { name?: string; plan?: Partial<OrgPlan>; access?: Partial<OrgSettings['access']>; policy?: Partial<OrgSettings['policy']> }
/** What every signed-in person may know about the organisation. */
export interface PublicOrg { name: string; requireGoalApproval: boolean; parentMessaging: boolean; integrityMin?: number; ioaMin?: number; observationDays?: number; stalledDays?: number }

export interface AdminApi {
  settings(): Promise<SettingsReply>;
  patchSettings(b: SettingsPatch): Promise<SettingsReply>;
  rotateStaffCode(): Promise<{ staffCode: string }>;
  users(): Promise<AdminUser[]>;
  createUser(b: { name: string; email: string; password: string; role: AuthUser['role']; title?: string; phone?: string; centerId?: string | null; scope?: StaffScope; childIds?: string[] }): Promise<AdminUser>;
  patchUser(id: string, b: { name?: string; title?: string; phone?: string; password?: string; role?: AuthUser['role']; centerId?: string | null; scope?: StaffScope; childIds?: string[]; disabled?: boolean }): Promise<AdminUser>;
  deleteUser(id: string): Promise<{ ok: true }>;
  children(): Promise<AdminChild[]>;
  createChild(b: { name: string; centerId?: string | null }): Promise<AdminChild>;
  patchChild(id: string, b: { name?: string; centerId?: string | null; archived?: boolean }): Promise<AdminChild>;
  setTeam(id: string, userIds: string[]): Promise<{ ok: true }>;
  regenerateCode(id: string): Promise<AdminChild>;
  centers(): Promise<AdminCenter[]>;
  createCenter(b: { name: string; type: CenterType }): Promise<AdminCenter>;
  patchCenter(id: string, b: { name?: string; type?: CenterType; archived?: boolean }): Promise<AdminCenter>;
  invoices(): Promise<{ invoices: AdminInvoice[]; totals: InvoiceTotals }>;
  createInvoice(b: { description: string; amount: number; centerId?: string | null; childId?: string | null; dueDate?: string | null }): Promise<AdminInvoice>;
  patchInvoice(id: string, b: { status?: InvoiceStatus; description?: string; amount?: number; dueDate?: string | null }): Promise<AdminInvoice>;
  audit(limit?: number): Promise<AdminAuditEvent[]>;
  access(): Promise<unknown>;
}

const admin = <T,>(path: string, method = 'GET', body?: unknown) => api<T>(`/api/admin${path}`, { method, body, token: getToken() });

export const adminApi: AdminApi = {
  settings: () => admin<SettingsReply>('/settings'),
  patchSettings: (b) => admin<SettingsReply>('/settings', 'PATCH', b),
  rotateStaffCode: () => admin<{ staffCode: string }>('/settings/staff-code', 'POST'),
  users: () => admin<{ users: AdminUser[] }>('/users').then((r) => r.users),
  createUser: (b: { name: string; email: string; password: string; role: AuthUser['role']; title?: string; phone?: string; centerId?: string | null; scope?: StaffScope; childIds?: string[] }) => admin<{ user: AdminUser }>('/users', 'POST', b).then((r) => r.user),
  patchUser: (id: string, b: { name?: string; title?: string; phone?: string; password?: string; role?: AuthUser['role']; centerId?: string | null; scope?: StaffScope; childIds?: string[]; disabled?: boolean }) => admin<{ user: AdminUser }>(`/users/${id}`, 'PATCH', b).then((r) => r.user),
  deleteUser: (id: string) => admin<{ ok: true }>(`/users/${id}`, 'DELETE'),
  children: () => admin<{ children: AdminChild[] }>('/children').then((r) => r.children),
  createChild: (b: { name: string; centerId?: string | null }) => admin<{ child: AdminChild }>('/children', 'POST', b).then((r) => r.child),
  patchChild: (id: string, b: { name?: string; centerId?: string | null; archived?: boolean }) => admin<{ child: AdminChild }>(`/children/${id}`, 'PATCH', b).then((r) => r.child),
  setTeam: (id: string, userIds: string[]) => admin<{ ok: true }>(`/children/${id}/staff`, 'PUT', { userIds }),
  regenerateCode: (id: string) => admin<{ child: AdminChild }>(`/children/${id}/regenerate-code`, 'POST').then((r) => r.child),
  centers: () => admin<{ centers: AdminCenter[] }>('/centers').then((r) => r.centers),
  createCenter: (b: { name: string; type: CenterType }) => admin<{ center: AdminCenter }>('/centers', 'POST', b).then((r) => r.center),
  patchCenter: (id: string, b: { name?: string; type?: CenterType; archived?: boolean }) => admin<{ center: AdminCenter }>(`/centers/${id}`, 'PATCH', b).then((r) => r.center),
  invoices: () => admin<{ invoices: AdminInvoice[]; totals: InvoiceTotals }>('/invoices'),
  createInvoice: (b: { description: string; amount: number; centerId?: string | null; childId?: string | null; dueDate?: string | null }) => admin<{ invoice: AdminInvoice }>('/invoices', 'POST', b).then((r) => r.invoice),
  patchInvoice: (id: string, b: { status?: InvoiceStatus; description?: string; amount?: number; dueDate?: string | null }) => admin<{ invoice: AdminInvoice }>(`/invoices/${id}`, 'PATCH', b).then((r) => r.invoice),
  audit: (limit = 100) => admin<{ events: AdminAuditEvent[] }>(`/audit?limit=${limit}`).then((r) => r.events),
  access: () => admin<{ matrix: unknown }>('/access').then((r) => r.matrix),
};
