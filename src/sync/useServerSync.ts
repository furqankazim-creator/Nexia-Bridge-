import { useEffect, useRef } from 'react';
import { api, ApiError } from '../api/client';
import type { RoleType } from '../types';

/** One shared collection mirrored to the server. */
export interface SyncCol {
  col: string;
  items: any[];
  /** Apply a change to the app state (functional update). */
  apply: (fn: (prev: any[]) => any[]) => void;
  rid: (item: any) => string;
}

export interface OutMessage {
  id: string;
  childId: string;
  payload: Record<string, unknown>;
}

export interface RemoteMessage {
  rid: string;
  childId: string;
  data: Record<string, any>;
}

interface Options {
  enabled: boolean;
  token: string | null;
  userId: string | null;
  role: RoleType | null;
  cols: SyncCol[];
  messages: OutMessage[];
  /** Messages that arrived from the server. `first` is true for the initial download. */
  onRemoteMessages: (msgs: RemoteMessage[], first: boolean) => void;
  onUnauthorized: () => void;
  onOnline: (online: boolean) => void;
}

interface SyncRecord {
  col: string;
  rid: string;
  childId: string;
  data: any;
  deleted: boolean;
}

const POLL_MS = 4000;
const PARENT_WRITES = new Set(['homeTasks', 'messages', 'medicalRecords']);
/** Written (and deleted) by the parent only: staff devices only ever read them. */
const PARENT_ONLY = new Set(['medicalRecords']);

export function useServerSync(opts: Options) {
  const latest = useRef(opts);
  latest.current = opts;

  // col -> rid -> JSON of what the server is known to hold. Prevents echoing pulled data back.
  const synced = useRef(new Map<string, Map<string, string>>());
  // col -> ids this device has actually held in its state. Only these can be "deleted by the user":
  // an id the server just sent that React has not rendered yet must never look like a deletion.
  const seen = useRef(new Map<string, Set<string>>());
  const seenFor = (col: string) => {
    let s = seen.current.get(col);
    if (!s) seen.current.set(col, (s = new Set()));
    return s;
  };
  const since = useRef(0);
  const firstPull = useRef(true);
  const running = useRef(false);
  const again = useRef(false);

  const mapFor = (col: string) => {
    let m = synced.current.get(col);
    if (!m) synced.current.set(col, (m = new Map()));
    return m;
  };

  const pushAll = async () => {
    const o = latest.current;
    const staff = o.role !== 'parent';
    const token = o.token!;

    for (const spec of o.cols) {
      if (!staff && !PARENT_WRITES.has(spec.col)) continue;
      if (staff && PARENT_ONLY.has(spec.col)) continue;
      const known = mapFor(spec.col);
      const current = new Map<string, { json: string; item: any }>();
      const seenIds = seenFor(spec.col);
      for (const item of spec.items) {
        current.set(spec.rid(item), { json: JSON.stringify(item), item });
        seenIds.add(spec.rid(item));
      }

      for (const [rid, { json, item }] of current) {
        if (known.get(rid) === json) continue;
        try {
          await api(`/api/records/${spec.col}/${encodeURIComponent(rid)}`, { method: 'PUT', token, body: { childId: item.childId, data: item } });
          known.set(rid, json);
        } catch (e) {
          // A refusal (403/400/413) will never succeed: stop retrying it. Network errors are retried next tick.
          if (e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 401) known.set(rid, json);
          else throw e;
        }
      }
      if (staff || PARENT_ONLY.has(spec.col)) {
        for (const rid of [...known.keys()]) {
          if (current.has(rid) || !seenIds.has(rid)) continue;
          try {
            await api(`/api/records/${spec.col}/${encodeURIComponent(rid)}`, { method: 'DELETE', token });
          } catch (e) {
            if (!(e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 401)) throw e;
          }
          known.delete(rid);
          seenIds.delete(rid);
        }
      }
    }

    const msgKnown = mapFor('messages');
    for (const m of o.messages) {
      if (msgKnown.has(m.id)) continue;
      try {
        await api(`/api/records/messages/${encodeURIComponent(m.id)}`, { method: 'PUT', token, body: { childId: m.childId, data: m.payload } });
        msgKnown.set(m.id, '1');
      } catch (e) {
        if (e instanceof ApiError && e.status >= 400 && e.status < 500 && e.status !== 401) msgKnown.set(m.id, '1');
        else throw e;
      }
    }
  };

  const pull = async () => {
    const o = latest.current;
    const incomingMsgs: RemoteMessage[] = [];
    for (let page = 0; page < 20; page++) {
      const res = await api<{ records: SyncRecord[]; latest: number; more: boolean }>(`/api/sync?since=${since.current}`, { token: o.token });
      const byCol = new Map<string, SyncRecord[]>();
      for (const r of res.records) {
        if (r.col === 'messages') {
          if (!r.deleted) {
            mapFor('messages').set(r.rid, '1'); // already on the server: never push it back
            incomingMsgs.push({ rid: r.rid, childId: r.childId, data: r.data });
          }
          continue;
        }
        (byCol.get(r.col) ?? byCol.set(r.col, []).get(r.col)!).push(r);
      }
      for (const spec of o.cols) {
        const recs = byCol.get(spec.col);
        if (!recs) continue;
        const known = mapFor(spec.col);
        spec.apply((prev) => {
          let next = [...prev];
          for (const r of recs) {
            const idx = next.findIndex((x) => spec.rid(x) === r.rid);
            if (r.deleted) {
              if (idx >= 0) next.splice(idx, 1);
              known.delete(r.rid);
              seenFor(spec.col).delete(r.rid);
            } else {
              // This device has an edit the server has not seen yet (an older copy of our own save is
              // coming back, or another device saved meanwhile). Keep ours: it is sent on the next push.
              const knownJson = known.get(r.rid);
              if (idx >= 0 && knownJson !== undefined && JSON.stringify(next[idx]) !== knownJson) continue;
              if (idx >= 0) next[idx] = r.data;
              else next = [...next, r.data];
              known.set(r.rid, JSON.stringify(r.data));
            }
          }
          return next;
        });
      }
      since.current = res.latest;
      if (!res.more) break;
    }
    o.onRemoteMessages(incomingMsgs, firstPull.current);
    firstPull.current = false;
  };

  const cycle = async () => {
    if (running.current) {
      again.current = true;
      return;
    }
    const o = latest.current;
    if (!o.enabled || !o.token) return;
    running.current = true;
    try {
      again.current = false;
      await pushAll();
      await pull();
      latest.current.onOnline(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) latest.current.onUnauthorized();
      else latest.current.onOnline(false);
    } finally {
      running.current = false;
      // A change arrived mid-cycle: run again after React has rendered the new state.
      if (again.current) setTimeout(cycle, 400);
    }
  };

  // Push soon after any local change.
  useEffect(() => {
    if (!opts.enabled || !opts.token) return;
    const t = setTimeout(cycle, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled, opts.token, opts.messages, ...opts.cols.map((c) => c.items)]);

  // Pull other people's changes regularly, and straight away when the app comes back to the foreground.
  useEffect(() => {
    if (!opts.enabled || !opts.token) return;
    const id = setInterval(cycle, POLL_MS);
    const onVis = () => document.visibilityState === 'visible' && cycle();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('online', cycle);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('online', cycle);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opts.enabled, opts.token]);
}
