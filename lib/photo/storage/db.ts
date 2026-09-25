/**
 * IndexedDB persistence.
 *
 * Everything lives on the device. That is not a shortcut — it is the only
 * architecture that makes the stated workflow possible: 100 ARW files are
 * 2.5 GB, and uploading that from a phone on mobile data is not a product.
 *
 * What we keep per photo is small and self-contained:
 *   - a 320 px thumbnail for the grid  (~25 KB)
 *   - a 1600 px edit proxy for the develop view and JPEG export  (~300 KB)
 *   - the analysis, the generated adjustments and the manual overrides (JSON)
 *
 * The original RAW is read once, at import, and never again — XMP generation
 * needs no pixels at all. It is never modified, never copied and never uploaded.
 */
import type {
  DuplicateGroup,
  PhotoRecord,
  ProjectRecord,
  StyleProfile,
  StyleSample,
} from "../types";

export const DB_NAME = "advibe-photo-studio";
export const DB_VERSION = 1;

export const STORES = {
  projects: "projects",
  photos: "photos",
  thumbnails: "thumbnails",
  proxies: "proxies",
  groups: "groups",
  styles: "styles",
  styleSamples: "styleSamples",
} as const;

let connection: Promise<IDBDatabase> | null = null;

export function isStorageAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

export function openDatabase(): Promise<IDBDatabase> {
  if (!isStorageAvailable()) {
    return Promise.reject(new Error("Este navegador no soporta IndexedDB"));
  }
  if (connection) return connection;

  connection = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORES.projects)) {
        db.createObjectStore(STORES.projects, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.photos)) {
        const store = db.createObjectStore(STORES.photos, { keyPath: "id" });
        store.createIndex("projectId", "projectId", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.thumbnails)) {
        db.createObjectStore(STORES.thumbnails);
      }
      if (!db.objectStoreNames.contains(STORES.proxies)) {
        db.createObjectStore(STORES.proxies);
      }
      if (!db.objectStoreNames.contains(STORES.groups)) {
        const store = db.createObjectStore(STORES.groups, { keyPath: "id" });
        store.createIndex("projectId", "projectId", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.styles)) {
        db.createObjectStore(STORES.styles, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORES.styleSamples)) {
        const store = db.createObjectStore(STORES.styleSamples, { keyPath: "id" });
        store.createIndex("profileId", "profileId", { unique: false });
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => {
        db.close();
        connection = null;
      };
      resolve(db);
    };
    request.onerror = () => reject(request.error ?? new Error("No se pudo abrir la base de datos"));
    request.onblocked = () =>
      reject(new Error("Hay otra pestaña abierta con una versión anterior. Ciérrala y recarga."));
  });

  return connection;
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Error de IndexedDB"));
  });
}

async function withStore<T>(
  name: string,
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(name, mode);
    const store = transaction.objectStore(name);
    let result: T;
    let failed = false;

    Promise.resolve(work(store))
      .then((value) => {
        if (value && typeof value === "object" && "onsuccess" in (value as object)) {
          return promisify(value as unknown as IDBRequest<T>);
        }
        return value as T;
      })
      .then((value) => {
        result = value;
      })
      .catch((error) => {
        failed = true;
        reject(error);
        transaction.abort();
      });

    transaction.oncomplete = () => {
      if (!failed) resolve(result);
    };
    transaction.onerror = () => reject(transaction.error ?? new Error("Transacción fallida"));
    transaction.onabort = () => {
      if (!failed) reject(transaction.error ?? new Error("Transacción cancelada"));
    };
  });
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

export async function putProject(project: ProjectRecord): Promise<void> {
  await withStore(STORES.projects, "readwrite", (store) => store.put(project));
}

export async function getProject(id: string): Promise<ProjectRecord | undefined> {
  return withStore(STORES.projects, "readonly", (store) => store.get(id));
}

export async function listProjects(): Promise<ProjectRecord[]> {
  const projects = await withStore<ProjectRecord[]>(STORES.projects, "readonly", (store) =>
    store.getAll(),
  );
  return projects.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Deletes a project and everything attached to it. */
export async function deleteProject(id: string): Promise<void> {
  const photos = await listPhotos(id);
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.projects, STORES.photos, STORES.thumbnails, STORES.proxies, STORES.groups],
      "readwrite",
    );
    transaction.objectStore(STORES.projects).delete(id);
    const photoStore = transaction.objectStore(STORES.photos);
    const thumbnails = transaction.objectStore(STORES.thumbnails);
    const proxies = transaction.objectStore(STORES.proxies);
    for (const photo of photos) {
      photoStore.delete(photo.id);
      thumbnails.delete(photo.id);
      proxies.delete(photo.id);
    }
    const groups = transaction.objectStore(STORES.groups);
    const index = groups.index("projectId");
    const cursorRequest = index.openCursor(IDBKeyRange.only(id));
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ---------------------------------------------------------------------------
// Photos
// ---------------------------------------------------------------------------

export async function putPhoto(photo: PhotoRecord): Promise<void> {
  await withStore(STORES.photos, "readwrite", (store) => store.put(photo));
}

export async function putPhotos(photos: readonly PhotoRecord[]): Promise<void> {
  if (photos.length === 0) return;
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORES.photos, "readwrite");
    const store = transaction.objectStore(STORES.photos);
    for (const photo of photos) store.put(photo);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getPhoto(id: string): Promise<PhotoRecord | undefined> {
  return withStore(STORES.photos, "readonly", (store) => store.get(id));
}

export async function listPhotos(projectId: string): Promise<PhotoRecord[]> {
  const db = await openDatabase();
  const photos = await new Promise<PhotoRecord[]>((resolve, reject) => {
    const transaction = db.transaction(STORES.photos, "readonly");
    const index = transaction.objectStore(STORES.photos).index("projectId");
    const request = index.getAll(IDBKeyRange.only(projectId));
    request.onsuccess = () => resolve(request.result as PhotoRecord[]);
    request.onerror = () => reject(request.error);
  });
  return photos.sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function deletePhoto(id: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      [STORES.photos, STORES.thumbnails, STORES.proxies],
      "readwrite",
    );
    transaction.objectStore(STORES.photos).delete(id);
    transaction.objectStore(STORES.thumbnails).delete(id);
    transaction.objectStore(STORES.proxies).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// ---------------------------------------------------------------------------
// Image blobs
// ---------------------------------------------------------------------------

export async function putThumbnail(photoId: string, blob: Blob): Promise<void> {
  await withStore(STORES.thumbnails, "readwrite", (store) => store.put(blob, photoId));
}

export async function getThumbnail(photoId: string): Promise<Blob | undefined> {
  return withStore(STORES.thumbnails, "readonly", (store) => store.get(photoId));
}

export async function putProxy(photoId: string, blob: Blob): Promise<void> {
  await withStore(STORES.proxies, "readwrite", (store) => store.put(blob, photoId));
}

export async function getProxy(photoId: string): Promise<Blob | undefined> {
  return withStore(STORES.proxies, "readonly", (store) => store.get(photoId));
}

// ---------------------------------------------------------------------------
// Groups, styles
// ---------------------------------------------------------------------------

export interface StoredGroup extends DuplicateGroup {
  projectId: string;
}

export async function putGroups(projectId: string, groups: DuplicateGroup[]): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORES.groups, "readwrite");
    const store = transaction.objectStore(STORES.groups);
    const index = store.index("projectId");
    const cursorRequest = index.openCursor(IDBKeyRange.only(projectId));
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
        return;
      }
      for (const group of groups) {
        store.put({ ...group, id: `${projectId}:${group.id}`, projectId });
      }
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function listGroups(projectId: string): Promise<DuplicateGroup[]> {
  const db = await openDatabase();
  const stored = await new Promise<StoredGroup[]>((resolve, reject) => {
    const transaction = db.transaction(STORES.groups, "readonly");
    const index = transaction.objectStore(STORES.groups).index("projectId");
    const request = index.getAll(IDBKeyRange.only(projectId));
    request.onsuccess = () => resolve(request.result as StoredGroup[]);
    request.onerror = () => reject(request.error);
  });
  // Strip the composite key back down to the group's own id.
  return stored
    .map((group) => ({
      id: group.id.slice(group.id.indexOf(":") + 1),
      label: group.label,
      photoIds: group.photoIds,
      suggestedId: group.suggestedId,
      scores: group.scores,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function putStyleProfile(profile: StyleProfile): Promise<void> {
  await withStore(STORES.styles, "readwrite", (store) => store.put(profile));
}

export async function listStyleProfiles(): Promise<StyleProfile[]> {
  const profiles = await withStore<StyleProfile[]>(STORES.styles, "readonly", (store) =>
    store.getAll(),
  );
  return profiles.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteStyleProfile(id: string): Promise<void> {
  const samples = await listStyleSamples(id);
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORES.styles, STORES.styleSamples], "readwrite");
    transaction.objectStore(STORES.styles).delete(id);
    const sampleStore = transaction.objectStore(STORES.styleSamples);
    for (const sample of samples) sampleStore.delete(sample.id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export interface StoredStyleSample extends StyleSample {
  profileId: string;
}

export async function putStyleSample(profileId: string, sample: StyleSample): Promise<void> {
  await withStore(STORES.styleSamples, "readwrite", (store) => store.put({ ...sample, profileId }));
}

export async function listStyleSamples(profileId: string): Promise<StyleSample[]> {
  const db = await openDatabase();
  const stored = await new Promise<StoredStyleSample[]>((resolve, reject) => {
    const transaction = db.transaction(STORES.styleSamples, "readonly");
    const index = transaction.objectStore(STORES.styleSamples).index("profileId");
    const request = index.getAll(IDBKeyRange.only(profileId));
    request.onsuccess = () => resolve(request.result as StoredStyleSample[]);
    request.onerror = () => reject(request.error);
  });
  return stored.map(({ profileId, ...sample }) => {
    void profileId; // stored only for the index; not part of the sample record
    return sample;
  });
}

export async function deleteStyleSample(id: string): Promise<void> {
  await withStore(STORES.styleSamples, "readwrite", (store) => store.delete(id));
}

// ---------------------------------------------------------------------------
// Storage budget
// ---------------------------------------------------------------------------

export interface StorageEstimate {
  usage: number;
  quota: number;
  /** 0..1 */
  ratio: number;
  supported: boolean;
}

export async function estimateStorage(): Promise<StorageEstimate> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return { usage: 0, quota: 0, ratio: 0, supported: false };
  }
  const estimate = await navigator.storage.estimate();
  const usage = estimate.usage ?? 0;
  const quota = estimate.quota ?? 0;
  return { usage, quota, ratio: quota > 0 ? usage / quota : 0, supported: true };
}

/**
 * Asks the browser to make the origin's storage persistent, so a large project
 * is not evicted while the photographer is halfway through culling it.
 */
export async function requestPersistence(): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
  try {
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}
