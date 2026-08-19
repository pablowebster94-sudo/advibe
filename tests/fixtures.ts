/**
 * Synthetic fixtures: a minimal JPEG and a minimal TIFF container shaped like a
 * Sony `.ARW` (IFD0 + ExifIFD + SubIFD holding an embedded JPEG preview).
 * They let the parser be tested without shipping a 25 MB binary in the repo.
 */

/** Builds a syntactically valid JPEG of the given size, padded with a COM segment. */
export function makeJpeg(width: number, height: number, padTo = 2048): Uint8Array {
  const parts: number[] = [];
  parts.push(0xff, 0xd8); // SOI

  // APP0 / JFIF
  parts.push(0xff, 0xe0, 0x00, 0x10);
  parts.push(0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00);

  // SOF0: length 17, precision 8, height, width, 3 components
  parts.push(0xff, 0xc0, 0x00, 0x11, 0x08);
  parts.push((height >> 8) & 0xff, height & 0xff);
  parts.push((width >> 8) & 0xff, width & 0xff);
  parts.push(0x03);
  parts.push(0x01, 0x22, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01);

  const overhead = parts.length + 2 + 4; // + COM header + EOI
  const padding = Math.max(0, padTo - overhead);
  if (padding > 0) {
    const commentLength = padding + 2;
    parts.push(0xff, 0xfe, (commentLength >> 8) & 0xff, commentLength & 0xff);
    for (let index = 0; index < padding; index += 1) parts.push(0x41);
  }
  parts.push(0xff, 0xd9); // EOI
  return new Uint8Array(parts);
}

type TagValue =
  | { type: "ascii"; value: string }
  | { type: "short"; value: number[] }
  | { type: "long"; value: number[] }
  | { type: "rational"; value: Array<[number, number]> }
  | { type: "undefined"; value: Uint8Array }
  /** Filled in with the heap offset of the embedded JPEG. */
  | { type: "jpegOffset" }
  | { type: "jpegLength" };

export interface IfdSpec {
  name: "ifd0" | "exif" | "sub";
  tags: Array<[number, TagValue]>;
}

const TYPE_CODES = { ascii: 2, short: 3, long: 4, rational: 5, undefined: 7 } as const;

/**
 * Assembles a little-endian TIFF. `ifd0` gets automatic pointer tags to the
 * `exif` (0x8769) and `sub` (0x014a) directories when those are present.
 */
export function makeTiff(specs: IfdSpec[], jpeg: Uint8Array | null): Uint8Array {
  const HEADER = 8;
  const sized = specs.map((spec) => ({
    spec,
    // 2 bytes for the count, 12 per entry, 4 for the next-IFD pointer.
    size: 2 + (spec.tags.length + (spec.name === "ifd0" ? specs.length - 1 : 0)) * 12 + 4,
  }));

  const offsets = new Map<string, number>();
  let cursor = HEADER;
  for (const item of sized) {
    offsets.set(item.spec.name, cursor);
    cursor += item.size;
  }
  const heapStart = cursor;

  const heap: number[] = [];
  const pushHeap = (bytes: number[] | Uint8Array): number => {
    const at = heapStart + heap.length;
    for (const byte of bytes) heap.push(byte);
    if (heap.length % 2 === 1) heap.push(0); // TIFF values are word-aligned.
    return at;
  };

  const jpegOffset = jpeg ? pushHeap(jpeg) : 0;
  const jpegLength = jpeg ? jpeg.length : 0;

  const le16 = (value: number) => [value & 0xff, (value >> 8) & 0xff];
  const le32 = (value: number) => [
    value & 0xff,
    (value >> 8) & 0xff,
    (value >> 16) & 0xff,
    (value >>> 24) & 0xff,
  ];

  function encode(tag: number, spec: TagValue): number[] {
    let type: number;
    let count: number;
    let payload: number[];

    switch (spec.type) {
      case "ascii": {
        type = TYPE_CODES.ascii;
        const chars = [...spec.value].map((char) => char.charCodeAt(0));
        chars.push(0);
        count = chars.length;
        payload = chars;
        break;
      }
      case "short":
        type = TYPE_CODES.short;
        count = spec.value.length;
        payload = spec.value.flatMap(le16);
        break;
      case "long":
        type = TYPE_CODES.long;
        count = spec.value.length;
        payload = spec.value.flatMap(le32);
        break;
      case "rational":
        type = TYPE_CODES.rational;
        count = spec.value.length;
        payload = spec.value.flatMap(([num, den]) => [...le32(num), ...le32(den)]);
        break;
      case "undefined":
        type = TYPE_CODES.undefined;
        count = spec.value.length;
        payload = [...spec.value];
        break;
      case "jpegOffset":
        type = TYPE_CODES.long;
        count = 1;
        payload = le32(jpegOffset);
        break;
      case "jpegLength":
        type = TYPE_CODES.long;
        count = 1;
        payload = le32(jpegLength);
        break;
    }

    const entry = [...le16(tag), ...le16(type), ...le32(count)];
    if (payload.length <= 4) {
      while (payload.length < 4) payload.push(0);
      entry.push(...payload);
    } else {
      entry.push(...le32(pushHeap(payload)));
    }
    return entry;
  }

  const bodies = new Map<string, number[]>();
  for (const item of sized) {
    const tags: Array<[number, TagValue]> = [...item.spec.tags];
    if (item.spec.name === "ifd0") {
      if (offsets.has("exif")) tags.push([0x8769, { type: "long", value: [offsets.get("exif")!] }]);
      if (offsets.has("sub")) tags.push([0x014a, { type: "long", value: [offsets.get("sub")!] }]);
    }
    tags.sort((a, b) => a[0] - b[0]);
    const body = [...le16(tags.length)];
    for (const [tag, value] of tags) body.push(...encode(tag, value));
    body.push(...le32(0)); // No next IFD.
    bodies.set(item.spec.name, body);
  }

  const out: number[] = [0x49, 0x49, 0x2a, 0x00, ...le32(HEADER)];
  for (const item of sized) {
    const body = bodies.get(item.spec.name)!;
    // Pad to the size we reserved so the heap offsets stay valid.
    while (body.length < item.size) body.push(0);
    out.push(...body.slice(0, item.size));
  }
  out.push(...heap);
  return new Uint8Array(out);
}

/** A minimal ARW-like file: EXIF metadata plus a 1616x1080 embedded preview. */
export function makeArw(
  options: {
    previewWidth?: number;
    previewHeight?: number;
    iso?: number;
    orientation?: number;
  } = {},
): { bytes: Uint8Array; jpeg: Uint8Array } {
  const previewWidth = options.previewWidth ?? 1616;
  const previewHeight = options.previewHeight ?? 1080;
  const jpeg = makeJpeg(previewWidth, previewHeight, 4096);

  const bytes = makeTiff(
    [
      {
        name: "ifd0",
        tags: [
          [0x010f, { type: "ascii", value: "SONY" }],
          [0x0110, { type: "ascii", value: "ZV-E10" }],
          [0x0112, { type: "short", value: [options.orientation ?? 1] }],
        ],
      },
      {
        name: "exif",
        tags: [
          [0x829a, { type: "rational", value: [[1, 200]] }],
          [0x829d, { type: "rational", value: [[18, 10]] }],
          [0x8827, { type: "short", value: [options.iso ?? 1600] }],
          [0x9003, { type: "ascii", value: "2026:08:08 19:42:11" }],
          [0x9208, { type: "short", value: [3] }],
          [0x9209, { type: "short", value: [9] }],
          [0x920a, { type: "rational", value: [[35, 1]] }],
          [0xa002, { type: "long", value: [6000] }],
          [0xa003, { type: "long", value: [4000] }],
          [0xa434, { type: "ascii", value: "E 35mm F1.8 OSS" }],
        ],
      },
      {
        name: "sub",
        tags: [
          [0x0100, { type: "long", value: [previewWidth] }],
          [0x0101, { type: "long", value: [previewHeight] }],
          [0x0103, { type: "short", value: [6] }],
          [0x0201, { type: "jpegOffset" }],
          [0x0202, { type: "jpegLength" }],
        ],
      },
    ],
    jpeg,
  );

  return { bytes, jpeg };
}

// ---------------------------------------------------------------------------
// Synthetic images
// ---------------------------------------------------------------------------

export interface TestImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/** Builds an image from a per-pixel colour function. */
export function makeImage(
  width: number,
  height: number,
  paint: (x: number, y: number) => [number, number, number],
): TestImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const at = (y * width + x) * 4;
      const [r, g, b] = paint(x, y);
      data[at] = r;
      data[at + 1] = g;
      data[at + 2] = b;
      data[at + 3] = 255;
    }
  }
  return { data, width, height };
}

export function solidImage(width: number, height: number, rgb: [number, number, number]): TestImage {
  return makeImage(width, height, () => rgb);
}

/** Left-to-right luminance ramp — a well-spread histogram. */
export function gradientImage(width = 64, height = 64): TestImage {
  return makeImage(width, height, (x) => {
    const value = Math.round((x / (width - 1)) * 255);
    return [value, value, value];
  });
}

/** Deterministic pseudo-random noise, so focus measures have something to bite. */
export function noisyImage(width = 64, height = 64, base = 128, amplitude = 60): TestImage {
  let seed = 12345;
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  return makeImage(width, height, () => {
    const value = Math.round(base + (next() - 0.5) * 2 * amplitude);
    return [value, value, value];
  });
}

/** A centred blob of realistic Caucasian/Latin skin tone on a neutral background. */
export function skinImage(
  width = 96,
  height = 96,
  options: { rgb?: [number, number, number]; radius?: number } = {},
): TestImage {
  const rgb = options.rgb ?? [214, 162, 134];
  const radius = options.radius ?? Math.min(width, height) * 0.28;
  const cx = width / 2;
  const cy = height / 2;
  return makeImage(width, height, (x, y) => {
    // Slightly elliptical, like a head.
    const dx = (x - cx) / radius;
    const dy = (y - cy) / (radius * 1.25);
    return dx * dx + dy * dy <= 1 ? rgb : [96, 98, 102];
  });
}

// ---------------------------------------------------------------------------
// TIFF image fixtures
// ---------------------------------------------------------------------------

export interface TiffImageOptions {
  width: number;
  height: number;
  /** 1 none, 5 LZW, 8 Deflate, 32773 PackBits. */
  compression: number;
  /** 0 WhiteIsZero, 1 BlackIsZero, 2 RGB, 3 palette. */
  photometric: number;
  bitsPerSample?: 8 | 16;
  predictor?: number;
  rowsPerStrip?: number;
  /** Raw sample bytes, already in the layout the header describes. */
  samples: Uint8Array;
  /** Compressed strip payloads; when absent `samples` is stored uncompressed. */
  strips?: Uint8Array[];
  palette?: number[];
}

/** Builds a single-IFD TIFF whose image data lives in strips. */
export function makeImageTiff(options: TiffImageOptions): Uint8Array {
  const {
    width,
    height,
    compression,
    photometric,
    bitsPerSample = 8,
    predictor = 1,
    palette,
  } = options;
  const samplesPerPixel = photometric === 2 ? 3 : 1;
  const rowBytes = width * samplesPerPixel * (bitsPerSample / 8);
  const rowsPerStrip = options.rowsPerStrip ?? height;
  const stripCount = Math.ceil(height / rowsPerStrip);

  const strips: Uint8Array[] =
    options.strips ??
    Array.from({ length: stripCount }, (_, index) => {
      const start = index * rowsPerStrip * rowBytes;
      const rows = Math.min(rowsPerStrip, height - index * rowsPerStrip);
      return options.samples.subarray(start, start + rows * rowBytes);
    });

  const le16 = (v: number) => [v & 0xff, (v >> 8) & 0xff];
  const le32 = (v: number) => [v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >>> 24) & 0xff];

  const tags: Array<[number, number, number, number[]]> = [];
  const heap: number[] = [];
  const HEADER = 8;

  // Entry count + entries + next-IFD pointer, then the heap.
  const entryCount = 9 + (palette ? 1 : 0) + (predictor !== 1 ? 1 : 0);
  const ifdSize = 2 + entryCount * 12 + 4;
  const heapStart = HEADER + ifdSize;

  // Appended one element at a time: a real image strip is megabytes, and
  // `push(...bytes)` on that overflows the call stack.
  const pushHeap = (bytes: ArrayLike<number>): number => {
    const at = heapStart + heap.length;
    for (let index = 0; index < bytes.length; index += 1) heap.push(bytes[index]);
    if (heap.length % 2 === 1) heap.push(0);
    return at;
  };

  const stripOffsets: number[] = [];
  for (const strip of strips) stripOffsets.push(pushHeap(strip));
  const stripCounts = strips.map((strip) => strip.length);

  const add = (tag: number, type: number, values: number[]) => {
    const size = type === 3 ? 2 : 4;
    const payload = values.flatMap((v) => (type === 3 ? le16(v) : le32(v)));
    if (payload.length <= 4) {
      while (payload.length < 4) payload.push(0);
      tags.push([tag, type, values.length, payload]);
    } else {
      tags.push([tag, type, values.length, le32(pushHeap(payload))]);
    }
    void size;
  };

  add(0x0100, 4, [width]);
  add(0x0101, 4, [height]);
  add(0x0102, 3, new Array(samplesPerPixel).fill(bitsPerSample));
  add(0x0103, 3, [compression]);
  add(0x0106, 3, [photometric]);
  add(0x0111, 4, stripOffsets);
  add(0x0115, 3, [samplesPerPixel]);
  add(0x0116, 4, [rowsPerStrip]);
  add(0x0117, 4, stripCounts);
  if (predictor !== 1) add(0x013d, 3, [predictor]);
  if (palette) add(0x0140, 3, palette);

  tags.sort((a, b) => a[0] - b[0]);
  const body = [...le16(tags.length)];
  for (const [tag, type, count, payload] of tags) {
    body.push(...le16(tag), ...le16(type), ...le32(count), ...payload);
  }
  body.push(...le32(0));
  while (body.length < ifdSize) body.push(0);

  const header = [0x49, 0x49, 0x2a, 0x00, ...le32(HEADER)];
  const total = header.length + ifdSize + heap.length;
  const out = new Uint8Array(total);
  out.set(header, 0);
  out.set(body.slice(0, ifdSize), header.length);
  for (let index = 0; index < heap.length; index += 1) {
    out[header.length + ifdSize + index] = heap[index];
  }
  return out;
}

/** Minimal TIFF-flavour LZW encoder, used to test the decoder independently. */
export function encodeLzw(input: Uint8Array): Uint8Array {
  const out: number[] = [];
  let bitBuffer = 0;
  let bitCount = 0;
  let codeWidth = 9;
  const write = (code: number) => {
    bitBuffer = (bitBuffer << codeWidth) | code;
    bitCount += codeWidth;
    while (bitCount >= 8) {
      out.push((bitBuffer >> (bitCount - 8)) & 0xff);
      bitCount -= 8;
    }
  };

  let dictionary = new Map<string, number>();
  const reset = () => {
    dictionary = new Map();
    for (let index = 0; index < 256; index += 1) dictionary.set(String.fromCharCode(index), index);
  };
  reset();
  let next = 258;
  write(256);

  let current = "";
  for (const byte of input) {
    const char = String.fromCharCode(byte);
    const candidate = current + char;
    if (dictionary.has(candidate)) {
      current = candidate;
      continue;
    }
    write(dictionary.get(current)!);
    dictionary.set(candidate, next++);
    // TIFF's "early change": the decoder is always one entry behind, so it
    // widens at 2^n - 1 while the encoder widens at 2^n. Getting this asymmetry
    // wrong desynchronises the two after the first 254 new entries.
    if (next >= 1 << codeWidth) {
      if (codeWidth < 12) codeWidth += 1;
      else {
        write(256);
        reset();
        next = 258;
        codeWidth = 9;
      }
    }
    current = char;
  }
  if (current) write(dictionary.get(current)!);
  write(257);
  if (bitCount > 0) out.push((bitBuffer << (8 - bitCount)) & 0xff);
  return new Uint8Array(out);
}

/** PackBits encoder producing only literal runs, which is always valid. */
export function encodePackBits(input: Uint8Array): Uint8Array {
  const out: number[] = [];
  for (let index = 0; index < input.length; index += 128) {
    const chunk = input.subarray(index, index + 128);
    out.push(chunk.length - 1, ...chunk);
  }
  return new Uint8Array(out);
}
