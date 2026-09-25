/** Shared pixel helpers. Pure functions, so they run in Node tests unchanged. */

export interface RgbaImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Rec.709 luma on gamma-encoded sRGB, 0..255. */
export function luma(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Builds a single-channel luma plane. */
export function lumaPlane(image: RgbaImage): Float32Array {
  const { data, width, height } = image;
  const plane = new Float32Array(width * height);
  for (let index = 0, pixel = 0; pixel < plane.length; pixel += 1, index += 4) {
    plane[pixel] = luma(data[index], data[index + 1], data[index + 2]);
  }
  return plane;
}

/** HSV conversion with H in degrees, S and V in 0..1. Inputs are 0..255. */
export function rgbToHsv(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; v: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta > 1e-6) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max <= 1e-6 ? 0 : delta / max, v: max };
}

/** Averages angles in degrees correctly across the 0/360 wrap. */
export function meanHue(hues: number[]): number {
  if (hues.length === 0) return 0;
  let x = 0;
  let y = 0;
  for (const hue of hues) {
    const radians = (hue * Math.PI) / 180;
    x += Math.cos(radians);
    y += Math.sin(radians);
  }
  const angle = (Math.atan2(y / hues.length, x / hues.length) * 180) / Math.PI;
  return angle < 0 ? angle + 360 : angle;
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return value < min ? min : value > max ? max : value;
}

/** Rounds to `decimals` places, avoiding `-0`. */
export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  const result = Math.round(value * factor) / factor;
  return Object.is(result, -0) ? 0 : result;
}

/** Nearest-neighbour downscale, used to normalise proxies before hashing. */
export function resize(image: RgbaImage, width: number, height: number): RgbaImage {
  const out = new Uint8ClampedArray(width * height * 4);
  const xRatio = image.width / width;
  const yRatio = image.height / height;

  for (let y = 0; y < height; y += 1) {
    // Box-average the source rows/columns that map onto this destination pixel
    // so downscaling does not alias away the structure the hash depends on.
    const y0 = Math.floor(y * yRatio);
    const y1 = Math.max(y0 + 1, Math.floor((y + 1) * yRatio));
    for (let x = 0; x < width; x += 1) {
      const x0 = Math.floor(x * xRatio);
      const x1 = Math.max(x0 + 1, Math.floor((x + 1) * xRatio));
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let count = 0;
      for (let sy = y0; sy < Math.min(y1, image.height); sy += 1) {
        for (let sx = x0; sx < Math.min(x1, image.width); sx += 1) {
          const at = (sy * image.width + sx) * 4;
          r += image.data[at];
          g += image.data[at + 1];
          b += image.data[at + 2];
          a += image.data[at + 3];
          count += 1;
        }
      }
      const at = (y * width + x) * 4;
      if (count === 0) count = 1;
      out[at] = r / count;
      out[at + 1] = g / count;
      out[at + 2] = b / count;
      out[at + 3] = a / count;
    }
  }
  return { data: out, width, height };
}
