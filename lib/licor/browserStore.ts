"use client";

/**
 * Minimal external store backed by `localStorage` / `sessionStorage`.
 *
 * Browser storage is an external system, so it is read through
 * `useSyncExternalStore` rather than by writing state from an effect: the
 * server and the hydration pass both see `serverSnapshot`, and the real value
 * arrives on the first client subscription. That keeps hydration stable and
 * avoids the cascading re-renders a read-in-effect would cause.
 */

export type BrowserStore<T> = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  /** Replaces the value and persists it. */
  set: (next: T | ((current: T) => T)) => void;
  /** Current value without subscribing (for event handlers). */
  peek: () => T;
};

export function createBrowserStore<T>({
  key,
  storage = "local",
  serverSnapshot,
  parse,
  serialize = JSON.stringify,
  syncAcrossTabs = false,
}: {
  key: string;
  storage?: "local" | "session";
  /** Value used on the server and during hydration. */
  serverSnapshot: T;
  /** Turns the raw stored string (or null) into a value. Must be total. */
  parse: (raw: string | null) => T;
  serialize?: (value: T) => string;
  syncAcrossTabs?: boolean;
}): BrowserStore<T> {
  let snapshot = serverSnapshot;
  let loaded = false;
  const listeners = new Set<() => void>();

  function area(): Storage | null {
    try {
      return storage === "local" ? window.localStorage : window.sessionStorage;
    } catch {
      // Storage can throw in private mode or with cookies blocked.
      return null;
    }
  }

  function emit() {
    for (const listener of listeners) listener();
  }

  function load() {
    try {
      snapshot = parse(area()?.getItem(key) ?? null);
    } catch {
      snapshot = serverSnapshot;
    }
    loaded = true;
  }

  function onStorage(event: StorageEvent) {
    if (event.key !== key) return;
    snapshot = parse(event.newValue);
    emit();
  }

  return {
    subscribe(listener) {
      if (!loaded) load();
      if (syncAcrossTabs && listeners.size === 0) {
        window.addEventListener("storage", onStorage);
      }
      listeners.add(listener);
      // React re-reads the snapshot right after subscribing, so the value
      // loaded above is picked up without an extra notification.
      return () => {
        listeners.delete(listener);
        if (syncAcrossTabs && listeners.size === 0) {
          window.removeEventListener("storage", onStorage);
        }
      };
    },
    getSnapshot: () => snapshot,
    getServerSnapshot: () => serverSnapshot,
    peek: () => snapshot,
    set(next) {
      if (!loaded) load();
      const value =
        typeof next === "function" ? (next as (current: T) => T)(snapshot) : next;
      if (Object.is(value, snapshot)) return;
      snapshot = value;
      try {
        area()?.setItem(key, serialize(value));
      } catch {
        // Persisting is best-effort; the value still lives in memory.
      }
      emit();
    },
  };
}

/** Subscribe function for stores that never change after load. */
export const NEVER_CHANGES = () => () => {};
