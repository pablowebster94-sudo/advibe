/**
 * Browser-only history for generated images.
 *
 * Uses IndexedDB (not localStorage) because a single 4K image easily exceeds the
 * ~5 MB localStorage quota; IndexedDB stores the real Blob, so the copy kept in
 * history is the full-resolution image, not a thumbnail. Nothing leaves the
 * device and there is no server-side database.
 */

import type { AspectRatio, Resolution } from "./image-studio";

const DB_NAME = "advibe-image-studio";
const DB_VERSION = 1;
const STORE = "images";
const MAX_ENTRIES = 24;

export type HistoryEntry = {
  id: string;
  prompt: string;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  mimeType: string;
  createdAt: number;
  blob: Blob;
};

function hasIndexedDb() {
  return typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt");
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = action(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
      })
  );
}

/** Newest first. Returns an empty list when storage is unavailable. */
export async function listHistory(): Promise<HistoryEntry[]> {
  if (!hasIndexedDb()) return [];
  try {
    const entries = await runTransaction<HistoryEntry[]>("readonly", (store) =>
      store.getAll() as IDBRequest<HistoryEntry[]>
    );
    return entries.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

export async function saveHistory(entry: HistoryEntry): Promise<HistoryEntry[]> {
  if (!hasIndexedDb()) return [];
  try {
    await runTransaction("readwrite", (store) => store.put(entry));
    const entries = await listHistory();
    const excess = entries.slice(MAX_ENTRIES);
    for (const stale of excess) {
      await runTransaction("readwrite", (store) => store.delete(stale.id));
    }
    return entries.slice(0, MAX_ENTRIES);
  } catch {
    return listHistory();
  }
}

export async function deleteHistory(id: string): Promise<HistoryEntry[]> {
  if (!hasIndexedDb()) return [];
  try {
    await runTransaction("readwrite", (store) => store.delete(id));
  } catch {
    // Ignore: history is best-effort.
  }
  return listHistory();
}

export async function clearHistory(): Promise<void> {
  if (!hasIndexedDb()) return;
  try {
    await runTransaction("readwrite", (store) => store.clear());
  } catch {
    // Ignore: history is best-effort.
  }
}
