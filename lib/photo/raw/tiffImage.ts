/**
 * TIFF image decoding.
 *
 * The browser cannot decode TIFF, so a `.tif` that carries no embedded JPEG
 * preview would otherwise be unopenable — and photographers hand off TIFFs all
 * the time. This decodes the variants that actually come out of Photoshop,
 * Lightroom and scanners:
 *
 *   compression   1 (none), 5 (LZW), 8/32946 (Deflate), 32773 (PackBits)
 *   photometric   0 (WhiteIsZero), 1 (BlackIsZero), 2 (RGB), 3 (palette)
 *   bit depth     8 and 16 bits per sample
 *   layout        strips, chunky (PlanarConfiguration 1)
 *
 * What it does NOT do, and reports plainly instead of failing obscurely: tiled
 * TIFFs, planar layout, CMYK/YCbCr, floating-point samples, and JPEG-in-TIFF
 * (which never reaches here — the preview extractor handles that case first).
 */
import { type ByteSource } from "./bytes";
import { type TiffFile, TIFF_TAGS, readNumbers } from "./tiff";

const TAG_SAMPLES_PER_PIXEL = 0x0115;
const TAG_ROWS_PER_STRIP = 0x0116;
const TAG_PLANAR_CONFIGURATION = 0x011c;
const TAG_PREDICTOR = 0x013d;
const TAG_COLOR_MAP = 0x0140;
const TAG_EXTRA_SAMPLES = 0x0152;
const TAG_SAMPLE_FORMAT = 0x0153;
const TAG_TILE_WIDTH = 0x0142;

export interface DecodedImage {
  /** Backed by a plain ArrayBuffer so it can be handed straight to ImageData. */
  data: Uint8ClampedArray<ArrayBuffer>;
  width: number;
  height: number;
}

/** PackBits (TIFF compression 32773): a run-length scheme. */
export function decodePackBits(input: Uint8Array, expected: number): Uint8Array {
  const out = new Uint8Array(expected);
  let read = 0;
  let write = 0;
  while (read < input.length && write < expected) {
    const header = input[read] > 127 ? input[read] - 256 : input[read];
    read += 1;
    if (header >= 0) {
      const count = header + 1;
      for (let index = 0; index < count && write < expected && read < input.length; index += 1) {
        out[write++] = input[read++];
      }
    } else if (header !== -128) {
      const count = 1 - header;
      const value = input[read++];
      for (let index = 0; index < count && write < expected; index += 1) out[write++] = value;
    }
  }
  return out;
}

/**
 * TIFF's LZW variant: MSB-first codes, 8-bit clear/end codes at 256/257, and
 * the "early change" quirk where the code width grows one code sooner than in
 * the GIF flavour.
 */
export function decodeLzw(input: Uint8Array, expected: number): Uint8Array {
  const CLEAR = 256;
  const END = 257;
  const out = new Uint8Array(expected);
  let written = 0;

  let dictionary: Uint8Array[] = [];
  const resetDictionary = () => {
    dictionary = new Array(258);
    for (let index = 0; index < 256; index += 1) dictionary[index] = Uint8Array.of(index);
  };
  resetDictionary();

  let codeWidth = 9;
  let next = 258;
  let previous: Uint8Array | null = null;
  let bitBuffer = 0;
  let bitCount = 0;
  let position = 0;

  const emit = (bytes: Uint8Array) => {
    for (let index = 0; index < bytes.length && written < expected; index += 1) {
      out[written++] = bytes[index];
    }
  };

  while (written < expected) {
    while (bitCount < codeWidth) {
      if (position >= input.length) return out;
      bitBuffer = (bitBuffer << 8) | input[position++];
      bitCount += 8;
    }
    const code = (bitBuffer >> (bitCount - codeWidth)) & ((1 << codeWidth) - 1);
    bitCount -= codeWidth;

    if (code === END) break;
    if (code === CLEAR) {
      resetDictionary();
      codeWidth = 9;
      next = 258;
      previous = null;
      continue;
    }

    let entry: Uint8Array;
    if (dictionary[code]) {
      entry = dictionary[code];
    } else if (previous) {
      entry = new Uint8Array(previous.length + 1);
      entry.set(previous);
      entry[previous.length] = previous[0];
    } else {
      break; // Corrupt stream: stop rather than loop.
    }

    emit(entry);

    if (previous) {
      const added = new Uint8Array(previous.length + 1);
      added.set(previous);
      added[previous.length] = entry[0];
      dictionary[next++] = added;
    }
    previous = entry;

    // Early change: widen one code before the dictionary is actually full.
    if (next + 1 >= 1 << codeWidth && codeWidth < 12) codeWidth += 1;
  }
  return out;
}

async function inflate(input: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("Este navegador no puede descomprimir TIFF Deflate");
  }
  const stream = new Blob([input as BlobPart]).stream().pipeThrough(new DecompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Undoes the horizontal differencing predictor (TIFF Predictor 2). */
function undoPredictor(
  bytes: Uint8Array,
  width: number,
  rows: number,
  samples: number,
  bitsPerSample: number,
): void {
  if (bitsPerSample === 8) {
    for (let row = 0; row < rows; row += 1) {
      const offset = row * width * samples;
      for (let index = samples; index < width * samples; index += 1) {
        bytes[offset + index] = (bytes[offset + index] + bytes[offset + index - samples]) & 0xff;
      }
    }
    return;
  }
  if (bitsPerSample === 16) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    for (let row = 0; row < rows; row += 1) {
      const offset = row * width * samples * 2;
      for (let index = samples; index < width * samples; index += 1) {
        const at = offset + index * 2;
        const previous = view.getUint16(at - samples * 2, true);
        view.setUint16(at, (view.getUint16(at, true) + previous) & 0xffff, true);
      }
    }
  }
}

export interface TiffDecodeSupport {
  supported: boolean;
  reason?: string;
}

/** Reports whether an IFD describes something this decoder can handle. */
export async function inspectTiffImage(
  file: TiffFile,
  ifdIndex = 0,
): Promise<TiffDecodeSupport> {
  const ifd = file.ifds[ifdIndex];
  if (!ifd) return { supported: false, reason: "El archivo no tiene un directorio de imagen" };

  const [width] = await readNumbers(file, ifd.entries.get(TIFF_TAGS.ImageWidth));
  const [height] = await readNumbers(file, ifd.entries.get(TIFF_TAGS.ImageHeight));
  if (!width || !height) return { supported: false, reason: "Sin dimensiones declaradas" };

  if (ifd.entries.get(TAG_TILE_WIDTH)) {
    return { supported: false, reason: "TIFF por mosaicos (tiles): no soportado" };
  }
  const [planar] = await readNumbers(file, ifd.entries.get(TAG_PLANAR_CONFIGURATION));
  if (planar === 2) return { supported: false, reason: "Disposición planar: no soportada" };

  const [compression = 1] = await readNumbers(file, ifd.entries.get(TIFF_TAGS.Compression));
  if (![1, 5, 8, 32773, 32946].includes(compression)) {
    return { supported: false, reason: `Compresión TIFF ${compression}: no soportada` };
  }
  const [photometric = 1] = await readNumbers(file, ifd.entries.get(TIFF_TAGS.PhotometricInterpretation));
  if (![0, 1, 2, 3].includes(photometric)) {
    return { supported: false, reason: `Interpretación fotométrica ${photometric}: no soportada` };
  }
  const bits = await readNumbers(file, ifd.entries.get(TIFF_TAGS.BitsPerSample));
  const bitsPerSample = bits[0] ?? 8;
  if (bitsPerSample !== 8 && bitsPerSample !== 16) {
    return { supported: false, reason: `${bitsPerSample} bits por muestra: no soportado` };
  }
  const [sampleFormat = 1] = await readNumbers(file, ifd.entries.get(TAG_SAMPLE_FORMAT));
  if (sampleFormat !== 1 && sampleFormat !== 2) {
    return { supported: false, reason: "Muestras en coma flotante: no soportadas" };
  }
  return { supported: true };
}

/** Picks the largest decodable IFD, which is the full-size image. */
export async function findLargestDecodableIfd(file: TiffFile): Promise<number> {
  let best = -1;
  let bestPixels = 0;
  for (let index = 0; index < file.ifds.length; index += 1) {
    if (file.ifds[index].kind !== "ifd0" && file.ifds[index].kind !== "ifd" && file.ifds[index].kind !== "sub") {
      continue;
    }
    const support = await inspectTiffImage(file, index);
    if (!support.supported) continue;
    const [width] = await readNumbers(file, file.ifds[index].entries.get(TIFF_TAGS.ImageWidth));
    const [height] = await readNumbers(file, file.ifds[index].entries.get(TIFF_TAGS.ImageHeight));
    const pixels = (width ?? 0) * (height ?? 0);
    if (pixels > bestPixels) {
      bestPixels = pixels;
      best = index;
    }
  }
  return best;
}

/**
 * Why none of the image directories could be decoded, in the file's own terms.
 *
 * Sony's ARW pixel data is a compression variant this decoder does not
 * implement, so a camera-original ARW normally reaches this only when its
 * embedded preview is missing too. When that happens the photographer deserves
 * the actual reason -- "Compresión TIFF 7: no soportada" -- rather than a
 * generic failure, so they can tell a limitation from a corrupt file.
 */
export async function undecodableReasons(file: TiffFile): Promise<string[]> {
  const reasons: string[] = [];
  for (let index = 0; index < file.ifds.length; index += 1) {
    const kind = file.ifds[index].kind;
    if (kind !== "ifd0" && kind !== "ifd" && kind !== "sub") continue;
    const support = await inspectTiffImage(file, index);
    if (support.supported) continue;
    if (support.reason && !reasons.includes(support.reason)) reasons.push(support.reason);
  }
  return reasons;
}

/** Decodes one IFD to RGBA. Throws with a readable reason when unsupported. */
export async function decodeTiffImage(file: TiffFile, ifdIndex: number): Promise<DecodedImage> {
  const support = await inspectTiffImage(file, ifdIndex);
  if (!support.supported) throw new Error(support.reason ?? "TIFF no soportado");

  const ifd = file.ifds[ifdIndex];
  const source: ByteSource = file.source;
  const [width] = await readNumbers(file, ifd.entries.get(TIFF_TAGS.ImageWidth));
  const [height] = await readNumbers(file, ifd.entries.get(TIFF_TAGS.ImageHeight));
  const [compression = 1] = await readNumbers(file, ifd.entries.get(TIFF_TAGS.Compression));
  const [photometric = 1] = await readNumbers(file, ifd.entries.get(TIFF_TAGS.PhotometricInterpretation));
  const bits = await readNumbers(file, ifd.entries.get(TIFF_TAGS.BitsPerSample));
  const bitsPerSample = bits[0] ?? 8;
  const [samplesPerPixel = photometric === 2 ? 3 : 1] = await readNumbers(
    file,
    ifd.entries.get(TAG_SAMPLES_PER_PIXEL),
  );
  const [predictor = 1] = await readNumbers(file, ifd.entries.get(TAG_PREDICTOR));
  const [rowsPerStrip = height] = await readNumbers(file, ifd.entries.get(TAG_ROWS_PER_STRIP));
  const offsets = await readNumbers(file, ifd.entries.get(TIFF_TAGS.StripOffsets));
  const counts = await readNumbers(file, ifd.entries.get(TIFF_TAGS.StripByteCounts));
  const palette = await readNumbers(file, ifd.entries.get(TAG_COLOR_MAP));
  const extraSamples = await readNumbers(file, ifd.entries.get(TAG_EXTRA_SAMPLES));
  const hasAlpha = samplesPerPixel > (photometric === 2 ? 3 : 1) && extraSamples.length > 0;

  if (offsets.length === 0 || offsets.length !== counts.length) {
    throw new Error("El TIFF no declara bandas (strips) utilizables");
  }

  const bytesPerSample = bitsPerSample / 8;
  const rowBytes = width * samplesPerPixel * bytesPerSample;
  const out = new Uint8ClampedArray(new ArrayBuffer(width * height * 4));
  const maxValue = bitsPerSample === 16 ? 65535 : 255;

  for (let strip = 0; strip < offsets.length; strip += 1) {
    const firstRow = strip * rowsPerStrip;
    if (firstRow >= height) break;
    const stripRows = Math.min(rowsPerStrip, height - firstRow);
    const raw = await source.read(file.tiffStart + offsets[strip], counts[strip]);

    let bytes: Uint8Array;
    switch (compression) {
      case 1:
        bytes = raw;
        break;
      case 5:
        bytes = decodeLzw(raw, rowBytes * stripRows);
        break;
      case 8:
      case 32946:
        bytes = await inflate(raw);
        break;
      case 32773:
        bytes = decodePackBits(raw, rowBytes * stripRows);
        break;
      default:
        throw new Error(`Compresión TIFF ${compression}: no soportada`);
    }

    if (predictor === 2) {
      // The predictor needs its own buffer view; copy when the slice is shared.
      const owned = bytes.buffer.byteLength === bytes.byteLength ? bytes : bytes.slice();
      undoPredictor(owned, width, stripRows, samplesPerPixel, bitsPerSample);
      bytes = owned;
    }

    const view =
      bitsPerSample === 16
        ? new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
        : null;

    for (let row = 0; row < stripRows; row += 1) {
      const y = firstRow + row;
      for (let x = 0; x < width; x += 1) {
        const sampleAt = row * rowBytes + x * samplesPerPixel * bytesPerSample;
        const read = (channel: number): number => {
          const at = sampleAt + channel * bytesPerSample;
          if (at + bytesPerSample > bytes.length) return 0;
          const value = view ? view.getUint16(at, file.littleEndian) : bytes[at];
          return (value / maxValue) * 255;
        };

        let r: number;
        let g: number;
        let b: number;
        if (photometric === 2) {
          r = read(0);
          g = read(1);
          b = read(2);
        } else if (photometric === 3 && palette.length >= 3) {
          const index = view ? view.getUint16(sampleAt, file.littleEndian) : bytes[sampleAt];
          const entries = palette.length / 3;
          r = (palette[index] ?? 0) / 65535 * 255;
          g = (palette[entries + index] ?? 0) / 65535 * 255;
          b = (palette[entries * 2 + index] ?? 0) / 65535 * 255;
        } else {
          const grey = read(0);
          // WhiteIsZero stores an inverted ramp, as scanners produce.
          const value = photometric === 0 ? 255 - grey : grey;
          r = value;
          g = value;
          b = value;
        }

        const at = (y * width + x) * 4;
        out[at] = r;
        out[at + 1] = g;
        out[at + 2] = b;
        out[at + 3] = hasAlpha ? read(samplesPerPixel - 1) : 255;
      }
    }
  }

  return { data: out, width, height };
}
