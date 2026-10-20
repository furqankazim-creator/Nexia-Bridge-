import { ApiError, getApiUrl } from '../api/client';
import type { MedicalFileRef } from '../types';
import { FILE_ACCEPT, MAX_FILE_BYTES_DEMO, MAX_FILE_BYTES_SERVER } from '../data/medicalCategories';

/**
 * Where the report files live.
 * - Signed in to a server: on the server (never inside the synced records).
 * - Practice version: in this browser's IndexedDB, so a PDF is not squeezed into localStorage.
 */
export interface FileStore {
  server: boolean;
  token: string | null;
}

const ALLOWED = FILE_ACCEPT.split(',');
const EXT_TYPE: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export const fileMime = (f: File): string => {
  if (ALLOWED.includes(f.type)) return f.type;
  return EXT_TYPE[f.name.split('.').pop()?.toLowerCase() ?? ''] ?? '';
};

export const prettySize = (n: number): string => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Returns a plain-words problem with the file, or null when it can be saved. */
export const fileProblem = (f: File, server: boolean, isAr: boolean): string | null => {
  if (!fileMime(f)) return isAr ? 'يمكن حفظ ملفات PDF أو JPG أو PNG أو WebP فقط.' : 'Only PDF, JPG, PNG or WebP files can be saved.';
  const max = server ? MAX_FILE_BYTES_SERVER : MAX_FILE_BYTES_DEMO;
  if (f.size > max) return isAr ? `الملف كبير جداً (الحد ${prettySize(max)}).` : `That file is too big (limit ${prettySize(max)}).`;
  if (f.size < 16) return isAr ? 'الملف فارغ.' : 'That file is empty.';
  return null;
};

/* ---------- practice version: IndexedDB ---------- */

const DB = 'nexia-medical-files';
const STORE = 'files';
const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
const idb = async <T,>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> => {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const req = run(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
};

/* ---------- API ---------- */

const serverError = async (res: Response): Promise<ApiError> => {
  const j = (await res.json().catch(() => ({}))) as { error?: string };
  return new ApiError(res.status, j.error || `Request failed (${res.status}).`);
};

export async function putFile(store: FileStore, childId: string, id: string, file: File): Promise<MedicalFileRef> {
  const mime = fileMime(file);
  if (!store.server) {
    await idb('readwrite', (s) => s.put(new Blob([file], { type: mime }), id));
    return { id, name: file.name, mime, size: file.size };
  }
  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}/api/medical-files/${encodeURIComponent(id)}?childId=${encodeURIComponent(childId)}&name=${encodeURIComponent(file.name)}`, {
      method: 'PUT',
      headers: { 'content-type': mime, authorization: `Bearer ${store.token}` },
      body: file,
    });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw await serverError(res);
  return { id, name: file.name, mime, size: file.size };
}

export async function getFileBlob(store: FileStore, id: string): Promise<Blob> {
  if (!store.server) {
    const b = await idb<Blob | undefined>('readonly', (s) => s.get(id));
    if (!b) throw new ApiError(404, 'This file is not on this device.');
    return b;
  }
  let res: Response;
  try {
    res = await fetch(`${getApiUrl()}/api/medical-files/${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${store.token}` } });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }
  if (!res.ok) throw await serverError(res);
  return res.blob();
}

export async function deleteFile(store: FileStore, id: string): Promise<void> {
  try {
    if (!store.server) await idb('readwrite', (s) => s.delete(id));
    else await fetch(`${getApiUrl()}/api/medical-files/${encodeURIComponent(id)}`, { method: 'DELETE', headers: { authorization: `Bearer ${store.token}` } });
  } catch {
    /* an orphan file is harmless; the record is what matters */
  }
}
