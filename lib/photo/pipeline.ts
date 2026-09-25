/**
 * High-level orchestration used by the UI: create a project, import files,
 * analyse them, generate edits, and keep everything on disk as it goes.
 *
 * Progress is persisted per photo the moment it is known, so closing the tab
 * mid-import loses only the photos still in flight — the rest are already
 * analysed and reopen instantly.
 */
import type {
  Adjustments,
  DuplicateGroup,
  PhotoRecord,
  ProjectRecord,
  ProjectSettings,
  ProjectStats,
  StyleProfile,
} from "./types";
import { mergeAdjustments } from "./editing/adjustments";
import { generateAdjustments, pickStrategy } from "./editing/engine";
import { groupDuplicates } from "./grouping/duplicates";
import { AnalysisPool } from "./jobs/workerPool";
import { TaskQueue, defaultConcurrency } from "./jobs/queue";
import type { JobProgress } from "./types";
import { baseNameOf, detectFormat } from "./raw/decode";
import * as db from "./storage/db";
import { rememberOriginal } from "./storage/originals";

export const DEFAULT_SETTINGS: ProjectSettings = {
  mode: "wedding",
  styleStrength: 0.7,
  intensity: 0.5,
  proxyEdge: 1600,
};

export const SUPPORTED_EXTENSIONS = ["arw", "dng", "tif", "tiff", "jpg", "jpeg", "png"] as const;

export function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${random}`;
}

export function newProject(name: string, settings: Partial<ProjectSettings> = {}): ProjectRecord {
  const now = Date.now();
  return {
    id: createId("prj"),
    name: name.trim() || "Proyecto sin nombre",
    createdAt: now,
    updatedAt: now,
    settings: { ...DEFAULT_SETTINGS, ...settings },
  };
}

export function isSupportedFile(fileName: string): boolean {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return false;
  const extension = fileName.slice(dot + 1).toLowerCase();
  return (SUPPORTED_EXTENSIONS as readonly string[]).includes(extension);
}

export function projectStats(photos: readonly PhotoRecord[]): ProjectStats {
  let analyzed = 0;
  let edited = 0;
  let picked = 0;
  let errors = 0;
  let bytes = 0;

  for (const photo of photos) {
    if (photo.analysis) analyzed += 1;
    if (photo.auto) edited += 1;
    if (photo.picked) picked += 1;
    if (photo.status === "error") errors += 1;
    bytes += photo.byteSize;
  }
  return { total: photos.length, analyzed, edited, picked, errors, bytes };
}

/** The adjustments actually in force: generated, with manual edits layered on. */
export function effectiveAdjustments(photo: PhotoRecord): Adjustments | null {
  if (!photo.auto) return null;
  return mergeAdjustments(photo.auto.adjustments, photo.manual);
}

export interface ImportCallbacks {
  onPhotoAdded?: (photo: PhotoRecord) => void;
  onPhotoUpdated?: (photo: PhotoRecord) => void;
  onProgress?: (progress: JobProgress) => void;
  onError?: (fileName: string, message: string) => void;
}

export interface ImportHandle {
  queue: TaskQueue;
  pool: AnalysisPool;
  /** Resolves when every queued file has finished or failed. */
  done: Promise<void>;
  cancel: () => void;
}

/**
 * Imports files into a project.
 *
 * The original files are read but never written to and never uploaded; what is
 * stored is a thumbnail, a proxy, and JSON.
 */
export function importFiles(
  project: ProjectRecord,
  files: readonly File[],
  style: StyleProfile | undefined,
  callbacks: ImportCallbacks = {},
  startIndex = 0,
): ImportHandle {
  const pool = AnalysisPool.create(defaultConcurrency());
  const queue = new TaskQueue({
    concurrency: pool.size,
    onProgress: callbacks.onProgress,
  });

  files.forEach((file, offset) => {
    const photo: PhotoRecord = {
      id: createId("pht"),
      projectId: project.id,
      fileName: file.name,
      baseName: baseNameOf(file.name),
      format: "unknown",
      byteSize: file.size,
      lastModified: file.lastModified,
      status: "pending",
      exif: {},
      picked: false,
      rejected: false,
      addedAt: Date.now(),
      orderIndex: startIndex + offset,
    };

    queue.add({
      id: photo.id,
      weight: file.size,
      run: async (signal) => {
        photo.format = await detectFormat(file, file.name);
        // Keep a handle to the original so the export can go back to it for a
        // full-resolution render. Holding a File costs nothing until read.
        rememberOriginal(photo.id, file.name, file);
        photo.status = "analyzing";
        await db.putPhoto(photo);
        callbacks.onPhotoAdded?.({ ...photo });
        if (signal.aborted) return;

        try {
          const output = await pool.analyze({
            fileName: file.name,
            blob: file,
            proxyEdge: project.settings.proxyEdge,
          });
          if (signal.aborted) return;

          if (!output.ok) {
            // Keep what we could read. The photograph stays in the project with
            // its metadata visible and the reason shown, instead of becoming an
            // opaque failure.
            photo.format = output.format;
            photo.exif = output.exif;
            photo.status = "unreadable";
            photo.errorMessage = output.reason;
            await db.putPhoto(photo);
            callbacks.onPhotoUpdated?.({ ...photo });
            callbacks.onError?.(file.name, output.reason);
            return;
          }

          photo.format = output.format;
          photo.exif = output.exif;
          photo.analysis = output.analysis;
          photo.proxyWidth = output.proxyWidth;
          photo.proxyHeight = output.proxyHeight;
          photo.status = "analyzed";

          photo.auto = generateAdjustments({
            analysis: output.analysis,
            exif: output.exif,
            format: output.format,
            settings: project.settings,
            style,
          });
          photo.status = "edited";

          await Promise.all([
            db.putThumbnail(photo.id, output.thumbnail),
            db.putProxy(photo.id, output.proxy),
          ]);
          await db.putPhoto(photo);
          callbacks.onPhotoUpdated?.({ ...photo });
        } catch (error) {
          photo.status = "error";
          photo.errorMessage = error instanceof Error ? error.message : String(error);
          await db.putPhoto(photo);
          callbacks.onPhotoUpdated?.({ ...photo });
          callbacks.onError?.(file.name, photo.errorMessage);
          throw error;
        }
      },
    });
  });

  const done = queue.whenIdle().then(() => {
    pool.dispose();
  });

  return {
    queue,
    pool,
    done,
    cancel: () => {
      queue.cancel();
      pool.dispose();
    },
  };
}

/** Re-runs the engine for one photo, discarding nothing the user typed by hand. */
export function regenerateEdit(
  photo: PhotoRecord,
  settings: ProjectSettings,
  style: StyleProfile | undefined,
  strategyOverride?: string,
): PhotoRecord {
  if (!photo.analysis) return photo;
  const auto = generateAdjustments({
    analysis: photo.analysis,
    exif: photo.exif,
    format: photo.format,
    settings,
    style,
    strategyOverride,
  });
  return { ...photo, auto, status: "edited" };
}

/** Strategy label for the UI, without re-running the whole engine. */
export function strategyLabelFor(
  photo: PhotoRecord,
  settings: ProjectSettings,
): string {
  if (!photo.analysis) return "—";
  return pickStrategy({
    analysis: photo.analysis,
    exif: photo.exif,
    format: photo.format,
    settings,
  }).label;
}

export async function rebuildGroups(
  projectId: string,
  photos: readonly PhotoRecord[],
): Promise<DuplicateGroup[]> {
  const groups = groupDuplicates(photos);
  await db.putGroups(projectId, groups);
  return groups;
}
