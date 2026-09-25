import { test } from "node:test";
import assert from "node:assert/strict";

import { TaskQueue, formatBytes, formatEta } from "../lib/photo/jobs/queue";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

test("TaskQueue respeta el límite de concurrencia", async () => {
  let running = 0;
  let peak = 0;
  const queue = new TaskQueue({ concurrency: 3 });

  queue.addAll(
    Array.from({ length: 12 }, (_, index) => ({
      id: `t${index}`,
      run: async () => {
        running += 1;
        peak = Math.max(peak, running);
        await wait(5);
        running -= 1;
        return index;
      },
    })),
  );

  await queue.whenIdle();
  assert.equal(peak, 3, `pico de concurrencia ${peak}`);
  assert.equal(queue.progress.completed, 12);
  assert.equal(queue.progress.failed, 0);
});

test("TaskQueue reporta fallos sin detener el resto", async () => {
  const results: string[] = [];
  const queue = new TaskQueue({
    concurrency: 2,
    onResult: (result) => results.push(`${result.id}:${result.state}`),
  });

  queue.addAll([
    { id: "ok1", run: async () => 1 },
    { id: "boom", run: async () => { throw new Error("archivo corrupto"); } },
    { id: "ok2", run: async () => 2 },
  ]);

  await queue.whenIdle();
  assert.equal(queue.progress.completed, 2);
  assert.equal(queue.progress.failed, 1);
  assert.ok(results.includes("boom:error"));
  assert.ok(results.includes("ok1:done"));
  assert.ok(results.includes("ok2:done"));
});

test("TaskQueue puede pausarse y reanudarse", async () => {
  let done = 0;
  const queue = new TaskQueue({ concurrency: 1 });
  queue.pause();
  queue.addAll(
    Array.from({ length: 4 }, (_, index) => ({
      id: `t${index}`,
      run: async () => {
        done += 1;
      },
    })),
  );

  await wait(15);
  assert.equal(done, 0, "en pausa no debe ejecutar nada");
  assert.equal(queue.isPaused, true);

  queue.resume();
  await queue.whenIdle();
  assert.equal(done, 4);
});

test("TaskQueue cancela lo pendiente y avisa a quien espera", async () => {
  let started = 0;
  const queue = new TaskQueue({ concurrency: 1 });
  queue.addAll(
    Array.from({ length: 6 }, (_, index) => ({
      id: `t${index}`,
      run: async (signal: AbortSignal) => {
        started += 1;
        await wait(10);
        if (signal.aborted) throw new Error("cancelado");
      },
    })),
  );

  await wait(5);
  queue.cancel();
  await queue.whenIdle();
  assert.ok(started <= 2, `no debería haber arrancado más de 2 tareas, arrancó ${started}`);
});

test("TaskQueue acumula bytes y calcula progreso", async () => {
  const queue = new TaskQueue({ concurrency: 2 });
  queue.addAll(
    Array.from({ length: 5 }, (_, index) => ({
      id: `t${index}`,
      weight: 25_000_000,
      run: async () => {
        await wait(2);
      },
    })),
  );
  await queue.whenIdle();
  assert.equal(queue.progress.bytesProcessed, 125_000_000);
  assert.equal(queue.progress.total, 5);
});

test("formatEta y formatBytes son legibles", () => {
  assert.equal(formatEta(null), "—");
  assert.equal(formatEta(0), "—");
  assert.equal(formatEta(48_000), "48 s");
  assert.equal(formatEta(134_000), "2 min 14 s");
  assert.equal(formatEta(120_000), "2 min");
  assert.equal(formatEta(3_900_000), "1 h 5 min");

  assert.equal(formatBytes(512), "512 B");
  assert.equal(formatBytes(25 * 1024 * 1024), "25 MB");
  assert.equal(formatBytes(2.5 * 1024 * 1024 * 1024), "2.5 GB");
  assert.equal(formatBytes(1024 * 1024 * 1024), "1 GB");
  assert.equal(formatBytes(1536 * 1024 * 1024), "1.5 GB");
});
