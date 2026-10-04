import { describe, expect, it } from "vitest";
import { analyzeMask } from "@/lib/services/cutout";

function mask(width: number, height: number, box: { l: number; t: number; r: number; b: number }) {
  const m = new Uint8Array(width * height);
  for (let y = box.t; y <= box.b; y++) for (let x = box.l; x <= box.r; x++) m[y * width + x] = 255;
  return m;
}

describe("analyzeMask", () => {
  it("returns the bounding box of a whole product", () => {
    const box = analyzeMask(mask(100, 80, { l: 10, t: 20, r: 89, b: 69 }), 100, 80);
    expect(box).toMatchObject({ left: 10, top: 20, width: 80, height: 50 });
  });

  it("rejects a product cut by the photo's edge (it would look amputated)", () => {
    expect(analyzeMask(mask(100, 80, { l: 10, t: 20, r: 99, b: 69 }), 100, 80)).toBeNull();
  });

  it("rejects an empty or almost-full selection", () => {
    expect(analyzeMask(new Uint8Array(100 * 80), 100, 80)).toBeNull();
    expect(analyzeMask(mask(100, 80, { l: 2, t: 2, r: 97, b: 77 }), 100, 80)).toBeNull();
  });
});
