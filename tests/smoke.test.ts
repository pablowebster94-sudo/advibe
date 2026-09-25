import { test } from "node:test";
import assert from "node:assert/strict";
import { bufferSource, u16, u32 } from "../lib/photo/raw/bytes";

test("u16/u32 respetan el orden de bytes", () => {
  const bytes = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
  assert.equal(u16(bytes, 0, true), 0x0201);
  assert.equal(u16(bytes, 0, false), 0x0102);
  assert.equal(u32(bytes, 0, true), 0x04030201);
  assert.equal(u32(bytes, 0, false), 0x01020304);
});

test("bufferSource lee rangos", async () => {
  const source = bufferSource(new Uint8Array([1, 2, 3, 4, 5]));
  assert.deepEqual([...(await source.read(1, 3))], [2, 3, 4]);
  assert.equal((await source.read(10, 3)).length, 0);
});
