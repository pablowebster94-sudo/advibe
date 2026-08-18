/**
 * Concurrency-limited task queue with live progress.
 *
 * Deliberately transport-agnostic: it drives Web Workers today, and the same
 * interface fits a server-side worker pool later (see docs/ARCHITECTURE.md).
 * Pure TypeScript with no browser API, so its behaviour is unit-tested.
 */
import type { JobProgress } from "../types";

export type TaskState = "queued" | "running" | "done" | "error" | "cancelled";

export interface TaskResult<T> {
  id: string;
  state: TaskState;
  value?: T;
  error?: Error;
}

export interface QueueTask<T> {
  id: string;
  /** Used for the byte-throughput readout; 0 when not applicable. */
  weight?: number;
  run: (signal: AbortSignal) => Promise<T>;
}

export interface QueueOptions {
  concurrency?: number;
  /** Rolling window for the rate estimate. */
  windowMs?: number;
  onProgress?: (progress: JobProgress) => void;
  onResult?: (result: TaskResult<unknown>) => void;
}

/**
 * A sensible default for image analysis on a phone: enough parallelism to keep
 * the cores busy, low enough that four decoded proxies plus their source blobs
 * fit in memory at once.
 */
export function defaultConcurrency(): number {
  const cores =
    typeof navigator !== "undefined" && typeof navigator.hardwareConcurrency === "number"
      ? navigator.hardwareConcurrency
      : 4;
  return Math.max(1, Math.min(4, cores - 1 || 1));
}

export class TaskQueue {
  private readonly concurrency: number;
  private readonly windowMs: number;
  private readonly onProgress?: (progress: JobProgress) => void;
  private readonly onResult?: (result: TaskResult<unknown>) => void;

  private pending: Array<QueueTask<unknown>> = [];
  private running = 0;
  private completed = 0;
  private failed = 0;
  private total = 0;
  private bytesProcessed = 0;
  private paused = false;
  private controller = new AbortController();
  /** Completion timestamps inside the rolling window, for the rate readout. */
  private recent: number[] = [];
  private drained: Array<() => void> = [];

  constructor(options: QueueOptions = {}) {
    this.concurrency = Math.max(1, options.concurrency ?? defaultConcurrency());
    this.windowMs = options.windowMs ?? 10_000;
    this.onProgress = options.onProgress;
    this.onResult = options.onResult;
  }

  add<T>(task: QueueTask<T>): void {
    this.pending.push(task as QueueTask<unknown>);
    this.total += 1;
    this.pump();
  }

  addAll<T>(tasks: readonly QueueTask<T>[]): void {
    for (const task of tasks) {
      this.pending.push(task as QueueTask<unknown>);
    }
    this.total += tasks.length;
    this.pump();
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.pump();
  }

  get isPaused(): boolean {
    return this.paused;
  }

  /** Aborts running tasks and drops anything still queued. */
  cancel(): void {
    const dropped = this.pending.length;
    this.pending = [];
    this.controller.abort();
    this.controller = new AbortController();
    for (let index = 0; index < dropped; index += 1) {
      this.onResult?.({ id: "", state: "cancelled" });
    }
    this.total -= dropped;
    this.emit();
    this.maybeDrain();
  }

  /** Resolves once everything queued has finished, failed or been cancelled. */
  whenIdle(): Promise<void> {
    if (this.running === 0 && this.pending.length === 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      this.drained.push(resolve);
    });
  }

  get progress(): JobProgress {
    const now = Date.now();
    this.recent = this.recent.filter((stamp) => now - stamp <= this.windowMs);
    const elapsed = this.recent.length > 1 ? now - this.recent[0] : 0;
    const rate = elapsed > 0 ? (this.recent.length / elapsed) * 1000 : 0;
    const remaining = this.total - this.completed - this.failed;

    return {
      total: this.total,
      completed: this.completed,
      failed: this.failed,
      rate: Number(rate.toFixed(3)),
      etaMs: rate > 0 && remaining > 0 ? Math.round((remaining / rate) * 1000) : null,
      bytesProcessed: this.bytesProcessed,
    };
  }

  private pump(): void {
    while (!this.paused && this.running < this.concurrency && this.pending.length > 0) {
      const task = this.pending.shift()!;
      this.running += 1;
      void this.execute(task);
    }
    this.emit();
  }

  private async execute(task: QueueTask<unknown>): Promise<void> {
    const signal = this.controller.signal;
    try {
      const value = await task.run(signal);
      if (signal.aborted) {
        this.onResult?.({ id: task.id, state: "cancelled" });
      } else {
        this.completed += 1;
        this.bytesProcessed += task.weight ?? 0;
        this.recent.push(Date.now());
        this.onResult?.({ id: task.id, state: "done", value });
      }
    } catch (error) {
      if (signal.aborted) {
        this.onResult?.({ id: task.id, state: "cancelled" });
      } else {
        this.failed += 1;
        this.onResult?.({
          id: task.id,
          state: "error",
          error: error instanceof Error ? error : new Error(String(error)),
        });
      }
    } finally {
      this.running -= 1;
      this.pump();
      this.maybeDrain();
    }
  }

  private maybeDrain(): void {
    if (this.running === 0 && this.pending.length === 0 && this.drained.length > 0) {
      const waiting = this.drained;
      this.drained = [];
      for (const resolve of waiting) resolve();
    }
  }

  private emit(): void {
    this.onProgress?.(this.progress);
  }
}

/** `2 min 14 s` / `48 s` — the compact form the progress bar shows. */
export function formatEta(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms) || ms <= 0) return "—";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes < 60) return rest === 0 ? `${minutes} min` : `${minutes} min ${rest} s`;
  const hours = Math.floor(minutes / 60);
  return `${hours} h ${minutes % 60} min`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  // One decimal only where it carries information, and never a trailing ".0".
  const text = value < 10 ? value.toFixed(1).replace(/\.0$/, "") : value.toFixed(0);
  return `${text} ${units[unit]}`;
}
