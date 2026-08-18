/**
 * Embedded-preview extraction.
 *
 * Every RAW container Lightroom supports also stores one or more rendered JPEG
 * previews. Pulling the largest one gives us a colour-accurate, camera-rendered
 * proxy for analysis at a cost of ~1-2 MB instead of the full 25 MB file, and
 * without ever writing to the original.
 */
import { type ByteSource, u16, u32 } from "./bytes";
import { type TiffFile, TIFF_TAGS, readNumbers } from "./tiff";

export interface PreviewCandidate {
  offset: number;
  length: number;
  /** Where the candidate came from — useful in diagnostics. */
  source: string;
  width?: number;
  height?: number;
}

export interface EmbeddedPreview extends PreviewCandidate {
  bytes: Uint8Array;
}

/** Sony MakerNote tag holding a full-size rendered preview. */
const SONY_PREVIEW_IMAGE = 0x2001;

/** Reads a JPEG's dimensions from its SOFn marker without decoding it. */
export function readJpegSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let cursor = 2;
  while (cursor + 9 < bytes.length) {
    if (bytes[cursor] !== 0xff) {
      cursor += 1;
      continue;
    }
    const marker = bytes[cursor + 1];
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      cursor += 2;
      continue;
    }
    const length = u16(bytes, cursor + 2, false);
    if (length < 2) return null;
    // SOF0..SOF15, excluding the DHT/JPG/DAC markers at 0xc4/0xc8/0xcc.
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      return {
        height: u16(bytes, cursor + 5, false),
        width: u16(bytes, cursor + 7, false),
      };
    }
    if (marker === 0xda) return null;
    cursor += 2 + length;
  }
  return null;
}

/** Collects every plausible JPEG preview referenced by the TIFF structure. */
export async function findPreviewCandidates(file: TiffFile): Promise<PreviewCandidate[]> {
  const candidates: PreviewCandidate[] = [];

  for (const ifd of file.ifds) {
    // Classic thumbnail/preview pointer pair.
    const jpegOffset = ifd.entries.get(TIFF_TAGS.JpegInterchangeFormat);
    const jpegLength = ifd.entries.get(TIFF_TAGS.JpegInterchangeFormatLength);
    if (jpegOffset && jpegLength) {
      const [offset] = await readNumbers(file, jpegOffset);
      const [length] = await readNumbers(file, jpegLength);
      if (offset > 0 && length > 0) {
        candidates.push({
          offset: file.tiffStart + offset,
          length,
          source: `${ifd.kind}:JpegInterchangeFormat`,
        });
      }
    }

    // Strip-based JPEG images (Compression 6 = old-style JPEG, 7 = JPEG).
    const [compression] = await readNumbers(file, ifd.entries.get(TIFF_TAGS.Compression));
    if (compression === 6 || compression === 7) {
      const offsets = await readNumbers(file, ifd.entries.get(TIFF_TAGS.StripOffsets));
      const counts = await readNumbers(file, ifd.entries.get(TIFF_TAGS.StripByteCounts));
      if (offsets.length === 1 && counts.length === 1 && offsets[0] > 0 && counts[0] > 0) {
        const [width] = await readNumbers(file, ifd.entries.get(TIFF_TAGS.ImageWidth));
        const [height] = await readNumbers(file, ifd.entries.get(TIFF_TAGS.ImageHeight));
        candidates.push({
          offset: file.tiffStart + offsets[0],
          length: counts[0],
          source: `${ifd.kind}:StripOffsets`,
          width,
          height,
        });
      }
    }

    // Sony MakerNote preview: a raw JPEG blob stored as an UNDEFINED value.
    if (ifd.kind === "makernote") {
      const preview = ifd.entries.get(SONY_PREVIEW_IMAGE);
      if (preview && preview.byteLength > 1024) {
        candidates.push({
          offset: preview.valueOffset,
          length: preview.byteLength,
          source: "makernote:PreviewImage",
        });
      }
    }
  }

  return candidates.filter(
    (candidate) =>
      candidate.offset >= 0 &&
      candidate.length > 1024 &&
      candidate.offset + candidate.length <= file.source.size,
  );
}

/**
 * Returns the largest valid embedded preview, or null when the file has none.
 * Candidates are checked biggest-first and validated by their SOI marker, so a
 * bogus offset in a corrupt MakerNote falls through to the next candidate.
 */
export async function extractLargestPreview(file: TiffFile): Promise<EmbeddedPreview | null> {
  const candidates = await findPreviewCandidates(file);
  candidates.sort((a, b) => b.length - a.length);

  for (const candidate of candidates) {
    const bytes = await file.source.read(candidate.offset, candidate.length);
    if (bytes.length < 1024) continue;
    // Some vendors pad the value; find the SOI within the first few bytes.
    let start = -1;
    for (let index = 0; index < Math.min(64, bytes.length - 1); index += 1) {
      if (bytes[index] === 0xff && bytes[index + 1] === 0xd8) {
        start = index;
        break;
      }
    }
    if (start === -1) continue;
    const jpeg = start === 0 ? bytes : bytes.subarray(start);
    const size = readJpegSize(jpeg);
    if (!size || size.width < 160 || size.height < 160) continue;

    return {
      ...candidate,
      offset: candidate.offset + start,
      length: jpeg.length,
      bytes: jpeg,
      width: size.width,
      height: size.height,
    };
  }
  return null;
}

/**
 * Last-resort scan for a JPEG stream when the IFD structure gives us nothing.
 * Bounded to `limit` bytes so it stays cheap even on a phone.
 */
export async function scanForJpeg(
  source: ByteSource,
  limit = 8 * 1024 * 1024,
): Promise<EmbeddedPreview | null> {
  const window = await source.read(0, Math.min(limit, source.size));
  let best: EmbeddedPreview | null = null;

  for (let index = 0; index + 1 < window.length; index += 1) {
    if (window[index] !== 0xff || window[index + 1] !== 0xd8) continue;
    const slice = window.subarray(index);
    const size = readJpegSize(slice);
    if (!size || size.width < 320 || size.height < 320) continue;
    // Walk forward to the matching EOI so we know the real length.
    let end = -1;
    for (let scan = index + 2; scan + 1 < window.length; scan += 1) {
      if (window[scan] === 0xff && window[scan + 1] === 0xd9) {
        end = scan + 2;
        break;
      }
    }
    if (end === -1) continue;
    const length = end - index;
    if (!best || length > best.length) {
      best = {
        offset: index,
        length,
        source: "scan",
        bytes: window.subarray(index, end),
        width: size.width,
        height: size.height,
      };
    }
    index = end - 1;
  }
  return best;
}

/** Detects a PNG's dimensions from its IHDR chunk. */
export function readPngSize(bytes: Uint8Array): { width: number; height: number } | null {
  if (bytes.length < 24) return null;
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  for (let index = 0; index < signature.length; index += 1) {
    if (bytes[index] !== signature[index]) return null;
  }
  return { width: u32(bytes, 16, false), height: u32(bytes, 20, false) };
}
