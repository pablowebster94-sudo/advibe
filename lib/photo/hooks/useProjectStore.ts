"use client";

/**
 * Project state for the studio UI.
 *
 * Owns the in-memory view of one project and keeps IndexedDB in sync. Kept in a
 * hook rather than a global store because a project is the natural unit of work
 * and nothing outside the workspace needs it.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Adjustments,
  DuplicateGroup,
  JobProgress,
  PhotoRecord,
  ProjectRecord,
  ProjectSettings,
  StyleProfile,
} from "../types";
import { cloneAdjustments, mergeAdjustments } from "../editing/adjustments";
import {
  type ImportHandle,
  effectiveAdjustments,
  importFiles,
  isSupportedFile,
  projectStats,
  rebuildGroups,
  regenerateEdit,
} from "../pipeline";
import * as db from "../storage/db";

export interface ImportState {
  active: boolean;
  progress: JobProgress;
  /** Files rejected before analysis, e.g. an unsupported extension. */
  skipped: string[];
  errors: Array<{ fileName: string; message: string }>;
  usesWorkers: boolean;
}

const EMPTY_PROGRESS: JobProgress = {
  total: 0,
  completed: 0,
  failed: 0,
  rate: 0,
  etaMs: null,
  bytesProcessed: 0,
};

export function useProjectStore(projectId: string) {
  const [project, setProject] = useState<ProjectRecord | null>(null);
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [styles, setStyles] = useState<StyleProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importState, setImportState] = useState<ImportState>({
    active: false,
    progress: EMPTY_PROGRESS,
    skipped: [],
    errors: [],
    usesWorkers: true,
  });
  const [clipboard, setClipboard] = useState<Adjustments | null>(null);
  const importRef = useRef<ImportHandle | null>(null);

  // --- load ----------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loadedProject, loadedPhotos, loadedGroups, loadedStyles] = await Promise.all([
          db.getProject(projectId),
          db.listPhotos(projectId),
          db.listGroups(projectId),
          db.listStyleProfiles(),
        ]);
        if (cancelled) return;
        if (!loadedProject) {
          setError("No se encontró el proyecto.");
        } else {
          setProject(loadedProject);
        }
        setPhotos(loadedPhotos);
        setGroups(loadedGroups);
        setStyles(loadedStyles);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : String(loadError));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  useEffect(() => () => importRef.current?.cancel(), []);

  const styleProfileId = project?.settings.styleProfileId;
  const activeStyle = useMemo(
    () => styles.find((style) => style.id === styleProfileId),
    [styles, styleProfileId],
  );

  const stats = useMemo(() => projectStats(photos), [photos]);

  // --- helpers -------------------------------------------------------------
  const upsertPhoto = useCallback((photo: PhotoRecord) => {
    setPhotos((current) => {
      const index = current.findIndex((item) => item.id === photo.id);
      if (index === -1) return [...current, photo].sort((a, b) => a.orderIndex - b.orderIndex);
      const next = [...current];
      next[index] = photo;
      return next;
    });
  }, []);

  const persistProject = useCallback(async (next: ProjectRecord) => {
    const stamped = { ...next, updatedAt: Date.now() };
    setProject(stamped);
    await db.putProject(stamped);
  }, []);

  // --- actions -------------------------------------------------------------
  const addFiles = useCallback(
    async (fileList: FileList | File[]) => {
      if (!project) return;
      const all = Array.from(fileList);
      const accepted = all.filter((file) => isSupportedFile(file.name));
      const skipped = all.filter((file) => !isSupportedFile(file.name)).map((file) => file.name);

      if (accepted.length === 0) {
        setImportState((current) => ({ ...current, skipped }));
        return;
      }

      await db.requestPersistence();

      const startIndex = photos.length;
      setImportState({
        active: true,
        progress: { ...EMPTY_PROGRESS, total: accepted.length },
        skipped,
        errors: [],
        usesWorkers: true,
      });

      const handle = importFiles(project, accepted, activeStyle, {
        onPhotoAdded: upsertPhoto,
        onPhotoUpdated: upsertPhoto,
        onProgress: (progress) => setImportState((current) => ({ ...current, progress })),
        onError: (fileName, message) =>
          setImportState((current) => ({
            ...current,
            errors: [...current.errors, { fileName, message }],
          })),
      }, startIndex);

      importRef.current = handle;
      setImportState((current) => ({ ...current, usesWorkers: handle.pool.usesWorkers }));

      await handle.done;
      importRef.current = null;
      setImportState((current) => ({ ...current, active: false }));

      const refreshed = await db.listPhotos(project.id);
      setPhotos(refreshed);
      setGroups(await rebuildGroups(project.id, refreshed));
    },
    [project, photos.length, activeStyle, upsertPhoto],
  );

  const cancelImport = useCallback(() => {
    importRef.current?.cancel();
    importRef.current = null;
    setImportState((current) => ({ ...current, active: false }));
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<ProjectSettings>) => {
      if (!project) return;
      await persistProject({ ...project, settings: { ...project.settings, ...patch } });
    },
    [project, persistProject],
  );

  const setManual = useCallback(
    async (photoId: string, patch: Partial<Adjustments>) => {
      const photo = photos.find((item) => item.id === photoId);
      if (!photo) return;
      const next: PhotoRecord = { ...photo, manual: { ...photo.manual, ...patch } };
      upsertPhoto(next);
      await db.putPhoto(next);
    },
    [photos, upsertPhoto],
  );

  /** Drops manual overrides, going back to what the engine proposed. */
  const clearManual = useCallback(
    async (photoId: string) => {
      const photo = photos.find((item) => item.id === photoId);
      if (!photo) return;
      const next: PhotoRecord = { ...photo, manual: undefined };
      upsertPhoto(next);
      await db.putPhoto(next);
    },
    [photos, upsertPhoto],
  );

  const reapplyAi = useCallback(
    async (photoId: string, strategyOverride?: string) => {
      const photo = photos.find((item) => item.id === photoId);
      if (!photo || !project) return;
      const next = regenerateEdit(photo, project.settings, activeStyle, strategyOverride);
      const cleared: PhotoRecord = { ...next, manual: undefined };
      upsertPhoto(cleared);
      await db.putPhoto(cleared);
    },
    [photos, project, activeStyle, upsertPhoto],
  );

  const reapplyAll = useCallback(async () => {
    if (!project) return;
    const updated = photos.map((photo) =>
      photo.analysis ? regenerateEdit(photo, project.settings, activeStyle) : photo,
    );
    setPhotos(updated);
    await db.putPhotos(updated);
  }, [photos, project, activeStyle]);

  const copyAdjustments = useCallback(
    (photoId: string) => {
      const photo = photos.find((item) => item.id === photoId);
      const adjustments = photo ? effectiveAdjustments(photo) : null;
      setClipboard(adjustments ? cloneAdjustments(adjustments) : null);
    },
    [photos],
  );

  /**
   * Pastes copied adjustments onto a selection.
   *
   * `keys` lets the photographer sync only part of the edit (tone but not white
   * balance, say), which is what makes this usable across a whole ceremony.
   */
  const pasteAdjustments = useCallback(
    async (targetIds: readonly string[], keys?: readonly (keyof Adjustments)[]) => {
      if (!clipboard) return;
      const patch: Partial<Adjustments> = keys
        ? Object.fromEntries(keys.map((key) => [key, clipboard[key]]))
        : cloneAdjustments(clipboard);

      const updated = photos.map((photo) =>
        targetIds.includes(photo.id) && photo.auto
          ? { ...photo, manual: { ...photo.manual, ...patch } }
          : photo,
      );
      setPhotos(updated);
      await db.putPhotos(updated.filter((photo) => targetIds.includes(photo.id)));
    },
    [clipboard, photos],
  );

  const setFlags = useCallback(
    async (photoIds: readonly string[], flags: { picked?: boolean; rejected?: boolean }) => {
      const updated = photos.map((photo) =>
        photoIds.includes(photo.id) ? { ...photo, ...flags } : photo,
      );
      setPhotos(updated);
      await db.putPhotos(updated.filter((photo) => photoIds.includes(photo.id)));
    },
    [photos],
  );

  const removePhotos = useCallback(
    async (photoIds: readonly string[]) => {
      for (const id of photoIds) await db.deletePhoto(id);
      setPhotos((current) => current.filter((photo) => !photoIds.includes(photo.id)));
    },
    [],
  );

  const refreshGroups = useCallback(async () => {
    if (!project) return;
    setGroups(await rebuildGroups(project.id, photos));
  }, [project, photos]);

  return {
    project,
    photos,
    groups,
    styles,
    activeStyle,
    stats,
    loading,
    error,
    importState,
    clipboard,
    actions: {
      addFiles,
      cancelImport,
      updateSettings,
      setManual,
      clearManual,
      reapplyAi,
      reapplyAll,
      copyAdjustments,
      pasteAdjustments,
      setFlags,
      removePhotos,
      refreshGroups,
    },
  };
}

/** Resolves the adjustments in force for a photo, memoised for render use. */
export function useEffectiveAdjustments(photo: PhotoRecord | null): Adjustments | null {
  return useMemo(() => {
    if (!photo?.auto) return null;
    return mergeAdjustments(photo.auto.adjustments, photo.manual);
  }, [photo]);
}

/** Object URL for a blob stored in IndexedDB, revoked on unmount. */
export function useStoredImage(
  photoId: string | null,
  kind: "thumbnail" | "proxy",
): string | null {
  const [entry, setEntry] = useState<{ id: string | null; url: string | null }>({
    id: photoId,
    url: null,
  });

  // Drop the stale URL in the same render that the photo changes, rather than
  // showing the previous photo's image for one frame.
  if (entry.id !== photoId) setEntry({ id: photoId, url: null });

  useEffect(() => {
    if (!photoId) return;
    let objectUrl: string | null = null;
    let cancelled = false;

    (async () => {
      const blob = kind === "thumbnail" ? await db.getThumbnail(photoId) : await db.getProxy(photoId);
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setEntry({ id: photoId, url: objectUrl });
    })();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId, kind]);

  return entry.id === photoId ? entry.url : null;
}
