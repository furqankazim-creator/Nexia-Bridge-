import { useCallback, useEffect, useState } from 'react';
import { type OrgSettings, type AdminApi, type AdminAuditEvent, type AdminCenter, type AdminChild, type AdminInvoice, type AdminUser, type InvoiceTotals } from '../../api/client';

export interface MatrixRow { col: string; parentRead: string; parentWrite: string; clinicalRead: string; clinicalWrite: string; adminRead: string; adminWrite: string }

/** Everything the administrator screens show, loaded from the server in one place. */
export function useAdminData(api: AdminApi, notify: (m: string) => void) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [kids, setKids] = useState<AdminChild[]>([]);
  const [centers, setCenters] = useState<AdminCenter[]>([]);
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [totals, setTotals] = useState<InvoiceTotals>({ draft: 0, outstanding: 0, paid: 0 });
  const [events, setEvents] = useState<AdminAuditEvent[]>([]);
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [seatsUsed, setSeatsUsed] = useState(0);
  const [canEditSettings, setCanEdit] = useState(false);
  const [matrix, setMatrix] = useState<MatrixRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [u, c, ce, inv, a, m, st] = await Promise.all([api.users(), api.children(), api.centers(), api.invoices(), api.audit(100), api.access(), api.settings()]);
      setSettings(st.settings); setSeatsUsed(st.seatsUsed); setCanEdit(st.canEdit);
      setUsers(u); setKids(c); setCenters(ce); setInvoices(inv.invoices); setTotals(inv.totals); setEvents(a); setMatrix(m as MatrixRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void refresh(); }, [refresh]);

  /** Run a change, report the outcome, reload. Returns true when it worked. */
  const run = useCallback(async (fn: () => Promise<unknown>, ok: string): Promise<boolean> => {
    setBusy(true);
    try { await fn(); notify(ok); await refresh(); return true; } catch (e) { notify(e instanceof Error ? e.message : 'Failed.'); return false; } finally { setBusy(false); }
  }, [notify, refresh]);

  return { api, settings, seatsUsed, canEditSettings, users, kids, centers, invoices, totals, events, matrix, loading, error, busy, refresh, run };
}
export type AdminData = ReturnType<typeof useAdminData>;
