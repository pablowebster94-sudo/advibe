import { test } from "node:test";
import assert from "node:assert/strict";
import { paintCircle, removeIslands } from "../lib/photo/cutout";

function grid(w: number, h: number) {
  return new Uint8ClampedArray(w * h);
}

function fill(a: Uint8ClampedArray, w: number, x0: number, y0: number, x1: number, y1: number, v: number) {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) a[y * w + x] = v;
}

test("removeIslands quita manchas sueltas y conserva el sujeto", () => {
  const w = 100, h = 100;
  const a = grid(w, h);
  fill(a, w, 20, 20, 80, 80, 255); // sujeto: 3600 px
  fill(a, w, 2, 2, 4, 4, 200); // mancha: 4 px
  fill(a, w, 90, 90, 95, 95, 255); // mancha: 25 px
  const stats = removeIslands(a, w, h);
  assert.equal(stats.kept, 1);
  assert.equal(stats.removed, 2);
  assert.equal(a[2 * w + 2], 0);
  assert.equal(a[92 * w + 92], 0);
  assert.equal(a[50 * w + 50], 255);
});

test("removeIslands conserva un segundo sujeto grande", () => {
  const w = 100, h = 50;
  const a = grid(w, h);
  fill(a, w, 5, 5, 40, 45, 255);
  fill(a, w, 60, 5, 90, 45, 255);
  const stats = removeIslands(a, w, h);
  assert.equal(stats.kept, 2);
  assert.equal(a[20 * w + 70], 255);
});

test("removeIslands borra la neblina casi transparente", () => {
  const w = 20, h = 20;
  const a = grid(w, h);
  fill(a, w, 5, 5, 15, 15, 255);
  a[0] = 10;
  removeIslands(a, w, h);
  assert.equal(a[0], 0);
});

test("paintCircle borra y restaura dentro del radio", () => {
  const w = 50, h = 50;
  const a = grid(w, h);
  a.fill(255);
  const rect = paintCircle(a, w, h, 25, 25, 5, 0);
  assert.ok(rect);
  assert.equal(a[25 * w + 25], 0);
  assert.equal(a[0], 255);
  paintCircle(a, w, h, 25, 25, 5, 255);
  assert.equal(a[25 * w + 25], 255);
  assert.equal(paintCircle(a, w, h, -100, -100, 3, 0), null);
});
