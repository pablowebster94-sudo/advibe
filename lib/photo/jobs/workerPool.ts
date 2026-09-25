/**
 * Worker pool for photo analysis.
 *
 * Falls back to running the same code on the main thread when the browser has
 * no module-worker support. The fallback is slower and blocks the UI in bursts,
 * which the import screen states plainly rather than hiding.
 */
import { type AnalyzeInput, type AnalyzeOutput, analyzeFile } from "./analyzeTask";
import type { AnalyzeRequest, AnalyzeResponse } from "./analyze.worker";
import { defaultConcurrency } from "./queue";

interface Waiter {
  resolve: (output: AnalyzeOutput) => void;
  reject: (error: Error) => void;
}

export class AnalysisPool {
  private readonly workers: Worker[] = [];
  private readonly waiters = new Map<string, Waiter>();
  private next = 0;
  private counter = 0;
  private disposed = false;

  readonly size: number;
  readonly usesWorkers: boolean;

  private constructor(workers: Worker[], size: number) {
    this.workers = workers;
    this.size = size;
    this.usesWorkers = workers.length > 0;
    for (const worker of workers) this.attach(worker);
  }

  static create(size = defaultConcurrency()): AnalysisPool {
    const workers: Worker[] = [];
    if (typeof Worker !== "undefined") {
      for (let index = 0; index < size; index += 1) {
        try {
          workers.push(
            new Worker(new URL("./analyze.worker.ts", import.meta.url), { type: "module" }),
          );
        } catch {
          // Any failure means we run on the main thread; a half-populated pool
          // would be worse than none.
          for (const worker of workers) worker.terminate();
          workers.length = 0;
          break;
        }
      }
    }
    return new AnalysisPool(workers, size);
  }

  analyze(input: AnalyzeInput): Promise<AnalyzeOutput> {
    if (this.disposed) return Promise.reject(new Error("El pool de análisis ya fue liberado"));
    if (this.workers.length === 0) return analyzeFile(input);

    const id = `t${(this.counter += 1)}`;
    const worker = this.workers[this.next % this.workers.length];
    this.next += 1;

    return new Promise<AnalyzeOutput>((resolve, reject) => {
      this.waiters.set(id, { resolve, reject });
      const request: AnalyzeRequest = { ...input, type: "analyze", id };
      worker.postMessage(request);
    });
  }

  dispose(): void {
    this.disposed = true;
    for (const worker of this.workers) worker.terminate();
    this.workers.length = 0;
    for (const waiter of this.waiters.values()) {
      waiter.reject(new Error("Análisis cancelado"));
    }
    this.waiters.clear();
  }

  private attach(worker: Worker): void {
    worker.addEventListener("message", (event: MessageEvent<AnalyzeResponse>) => {
      const response = event.data;
      const waiter = this.waiters.get(response.id);
      if (!waiter) return;
      this.waiters.delete(response.id);
      if (response.type === "done") waiter.resolve(response.payload);
      else waiter.reject(new Error(response.message));
    });
    worker.addEventListener("error", (event) => {
      // A worker-level failure is not tied to one request, so everything in
      // flight on it has to fail rather than hang forever.
      const message = event.message || "Error en el worker de análisis";
      for (const [id, waiter] of this.waiters) {
        waiter.reject(new Error(message));
        this.waiters.delete(id);
      }
    });
  }
}
