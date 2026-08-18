/**
 * Minimal TIFF/IFD reader, enough for Sony `.ARW`, Adobe `.DNG` and plain
 * `.TIFF`, plus the EXIF APP1 segment inside JPEGs.
 *
 * We deliberately do NOT decode raw sensor data. Every RAW container Adobe
 * supports also stores a rendered JPEG preview and the full EXIF block; that is
 * all the information the analysis and XMP layers need, and reading it costs a
 * few kilobytes instead of 25 MB.
 */
import { type ByteSource, readExact, u16, u32, i32, i16 } from "./bytes";

export const TIFF_TYPE_SIZES: Record<number, number> = {
  1: 1, // BYTE
  2: 1, // ASCII
  3: 2, // SHORT
  4: 4, // LONG
  5: 8, // RATIONAL
  6: 1, // SBYTE
  7: 1, // UNDEFINED
  8: 2, // SSHORT
  9: 4, // SLONG
  10: 8, // SRATIONAL
  11: 4, // FLOAT
  12: 8, // DOUBLE
  13: 4, // IFD
};

export interface IfdEntry {
  tag: number;
  type: number;
  count: number;
  /** Absolute offset of the value inside the TIFF stream. */
  valueOffset: number;
  /** Total byte length of the value. */
  byteLength: number;
  /** Present when the value fitted in the 4-byte inline slot. */
  inline?: Uint8Array;
}

export interface Ifd {
  /** Where this IFD started, for diagnostics. */
  offset: number;
  kind: IfdKind;
  entries: Map<number, IfdEntry>;
}

export type IfdKind = "ifd0" | "ifd" | "sub" | "exif" | "gps" | "interop" | "makernote";

export interface TiffFile {
  littleEndian: boolean;
  /** Offset of the TIFF header inside the source (0 for RAW, >0 inside JPEG). */
  tiffStart: number;
  ifds: Ifd[];
  source: ByteSource;
}

export const TIFF_TAGS = {
  ImageWidth: 0x0100,
  ImageHeight: 0x0101,
  BitsPerSample: 0x0102,
  Compression: 0x0103,
  PhotometricInterpretation: 0x0106,
  Make: 0x010f,
  Model: 0x0110,
  StripOffsets: 0x0111,
  Orientation: 0x0112,
  StripByteCounts: 0x0117,
  JpegInterchangeFormat: 0x0201,
  JpegInterchangeFormatLength: 0x0202,
  SubIFDs: 0x014a,
  ExifIFD: 0x8769,
  GpsIFD: 0x8825,
  InteropIFD: 0xa005,
  MakerNote: 0x927c,
  // EXIF IFD
  ExposureTime: 0x829a,
  FNumber: 0x829d,
  ExposureProgram: 0x8822,
  ISOSpeedRatings: 0x8827,
  PhotographicSensitivity: 0x8827,
  DateTimeOriginal: 0x9003,
  ShutterSpeedValue: 0x9201,
  ApertureValue: 0x9202,
  MeteringMode: 0x9207,
  LightSource: 0x9208,
  Flash: 0x9209,
  FocalLength: 0x920a,
  PixelXDimension: 0xa002,
  PixelYDimension: 0xa003,
  FocalLengthIn35mmFilm: 0xa405,
  WhiteBalance: 0xa403,
  LensModel: 0xa434,
  NewSubfileType: 0x00fe,
} as const;

/** Guard against corrupt files claiming absurd IFD entry counts. */
const MAX_IFD_ENTRIES = 512;
const MAX_IFDS = 64;

/**
 * Parses the TIFF header at `tiffStart` and walks the IFD graph:
 * the IFD chain, SubIFDs, the EXIF/GPS/Interop pointers and the MakerNote.
 */
export async function parseTiff(source: ByteSource, tiffStart = 0): Promise<TiffFile> {
  const header = await readExact(source, tiffStart, 8);
  const byteOrder = u16(header, 0, true);
  let littleEndian: boolean;
  if (byteOrder === 0x4949) littleEndian = true;
  else if (byteOrder === 0x4d4d) littleEndian = false;
  else throw new Error("No es un archivo TIFF/RAW válido (orden de bytes desconocido)");

  const magic = u16(header, 2, littleEndian);
  if (magic === 43) {
    throw new Error("BigTIFF no está soportado todavía");
  }
  if (magic !== 42) {
    throw new Error("No es un archivo TIFF/RAW válido (magic incorrecto)");
  }

  const file: TiffFile = {
    littleEndian,
    tiffStart,
    ifds: [],
    source,
  };

  const visited = new Set<number>();
  const queue: Array<{ offset: number; kind: IfdKind }> = [
    { offset: u32(header, 4, littleEndian), kind: "ifd0" },
  ];

  while (queue.length > 0 && file.ifds.length < MAX_IFDS) {
    const next = queue.shift()!;
    if (next.offset <= 0 || visited.has(next.offset)) continue;
    if (tiffStart + next.offset + 2 > source.size) continue;
    visited.add(next.offset);

    let ifd: Ifd;
    try {
      ifd = await readIfd(source, tiffStart, next.offset, littleEndian, next.kind);
    } catch {
      continue; // A malformed sub-IFD must not sink the whole file.
    }
    file.ifds.push(ifd);

    // Follow the main IFD chain (IFD0 -> IFD1 -> ...).
    if (next.kind === "ifd0" || next.kind === "ifd") {
      const nextOffset = await readNextIfdPointer(
        source,
        tiffStart,
        next.offset,
        ifd.entries.size,
        littleEndian,
      );
      if (nextOffset > 0) queue.push({ offset: nextOffset, kind: "ifd" });

      for (const sub of await readNumbers(file, ifd.entries.get(TIFF_TAGS.SubIFDs))) {
        queue.push({ offset: sub, kind: "sub" });
      }
      const exif = ifd.entries.get(TIFF_TAGS.ExifIFD);
      if (exif) {
        const [offset] = await readNumbers(file, exif);
        if (offset) queue.push({ offset, kind: "exif" });
      }
      const gps = ifd.entries.get(TIFF_TAGS.GpsIFD);
      if (gps) {
        const [offset] = await readNumbers(file, gps);
        if (offset) queue.push({ offset, kind: "gps" });
      }
    }

    if (next.kind === "exif") {
      const interop = ifd.entries.get(TIFF_TAGS.InteropIFD);
      if (interop) {
        const [offset] = await readNumbers(file, interop);
        if (offset) queue.push({ offset, kind: "interop" });
      }
      const makerNote = ifd.entries.get(TIFF_TAGS.MakerNote);
      if (makerNote) {
        const offset = await findMakerNoteIfdOffset(file, makerNote);
        if (offset > 0) queue.push({ offset, kind: "makernote" });
      }
    }
  }

  if (file.ifds.length === 0) {
    throw new Error("El archivo no contiene directorios TIFF legibles");
  }
  return file;
}

async function readIfd(
  source: ByteSource,
  tiffStart: number,
  offset: number,
  littleEndian: boolean,
  kind: IfdKind,
): Promise<Ifd> {
  const countBytes = await readExact(source, tiffStart + offset, 2);
  const count = u16(countBytes, 0, littleEndian);
  if (count === 0 || count > MAX_IFD_ENTRIES) {
    throw new Error(`IFD con ${count} entradas fuera de rango`);
  }

  const body = await readExact(source, tiffStart + offset + 2, count * 12);
  const entries = new Map<number, IfdEntry>();

  for (let index = 0; index < count; index += 1) {
    const base = index * 12;
    const tag = u16(body, base, littleEndian);
    const type = u16(body, base + 2, littleEndian);
    const valueCount = u32(body, base + 4, littleEndian);
    const typeSize = TIFF_TYPE_SIZES[type];
    if (!typeSize) continue; // Unknown type: skip rather than guess.

    const byteLength = typeSize * valueCount;
    // Reject entries that cannot possibly fit in the file.
    if (byteLength > source.size) continue;

    const entry: IfdEntry = {
      tag,
      type,
      count: valueCount,
      valueOffset: 0,
      byteLength,
    };
    if (byteLength <= 4) {
      entry.inline = body.slice(base + 8, base + 8 + byteLength);
      entry.valueOffset = tiffStart + offset + 2 + base + 8;
    } else {
      entry.valueOffset = tiffStart + u32(body, base + 8, littleEndian);
    }
    entries.set(tag, entry);
  }

  return { offset, kind, entries };
}

async function readNextIfdPointer(
  source: ByteSource,
  tiffStart: number,
  offset: number,
  entryCount: number,
  littleEndian: boolean,
): Promise<number> {
  // `entryCount` here is the number of entries we kept, which can be lower than
  // the number on disk when we skipped unknown types, so re-read the count.
  const countBytes = await readExact(source, tiffStart + offset, 2);
  const onDisk = u16(countBytes, 0, littleEndian);
  const pointerAt = tiffStart + offset + 2 + onDisk * 12;
  if (pointerAt + 4 > source.size) return 0;
  const bytes = await source.read(pointerAt, 4);
  if (bytes.length < 4) return 0;
  return u32(bytes, 0, littleEndian);
}

/**
 * Sony MakerNotes are a TIFF IFD prefixed by a signature ("SONY DSC \0\0\0")
 * whose entry offsets are relative to the main TIFF header. Anything we cannot
 * recognise is skipped: the MakerNote is a bonus, never a requirement.
 */
async function findMakerNoteIfdOffset(file: TiffFile, entry: IfdEntry): Promise<number> {
  const head = await file.source.read(entry.valueOffset, 16);
  if (head.length < 4) return 0;
  const text = String.fromCharCode(...head.subarray(0, 12));
  const relative = entry.valueOffset - file.tiffStart;

  if (text.startsWith("SONY DSC ") || text.startsWith("SONY CAM ") || text.startsWith("SONY PIC ")) {
    return relative + 12;
  }
  // Some bodies write a bare IFD with no signature at all.
  const maybeCount = u16(head, 0, file.littleEndian);
  if (maybeCount > 0 && maybeCount <= MAX_IFD_ENTRIES) return relative;
  return 0;
}

// ---------------------------------------------------------------------------
// Value readers
// ---------------------------------------------------------------------------

export async function readEntryBytes(file: TiffFile, entry: IfdEntry): Promise<Uint8Array> {
  if (entry.inline) return entry.inline;
  return file.source.read(entry.valueOffset, entry.byteLength);
}

/** Reads an entry as an array of numbers, resolving rationals to floats. */
export async function readNumbers(
  file: TiffFile,
  entry: IfdEntry | undefined,
): Promise<number[]> {
  if (!entry) return [];
  const bytes = await readEntryBytes(file, entry);
  const le = file.littleEndian;
  const out: number[] = [];

  for (let index = 0; index < entry.count; index += 1) {
    switch (entry.type) {
      case 1:
      case 7:
        if (index < bytes.length) out.push(bytes[index]);
        break;
      case 6:
        if (index < bytes.length) out.push(bytes[index] > 127 ? bytes[index] - 256 : bytes[index]);
        break;
      case 3:
        if (index * 2 + 2 <= bytes.length) out.push(u16(bytes, index * 2, le));
        break;
      case 8:
        if (index * 2 + 2 <= bytes.length) out.push(i16(bytes, index * 2, le));
        break;
      case 4:
      case 13:
        if (index * 4 + 4 <= bytes.length) out.push(u32(bytes, index * 4, le));
        break;
      case 9:
        if (index * 4 + 4 <= bytes.length) out.push(i32(bytes, index * 4, le));
        break;
      case 5: {
        const at = index * 8;
        if (at + 8 > bytes.length) break;
        const num = u32(bytes, at, le);
        const den = u32(bytes, at + 4, le);
        out.push(den === 0 ? 0 : num / den);
        break;
      }
      case 10: {
        const at = index * 8;
        if (at + 8 > bytes.length) break;
        const num = i32(bytes, at, le);
        const den = i32(bytes, at + 4, le);
        out.push(den === 0 ? 0 : num / den);
        break;
      }
      case 11: {
        const at = index * 4;
        if (at + 4 > bytes.length) break;
        out.push(new DataView(bytes.buffer, bytes.byteOffset + at, 4).getFloat32(0, le));
        break;
      }
      case 12: {
        const at = index * 8;
        if (at + 8 > bytes.length) break;
        out.push(new DataView(bytes.buffer, bytes.byteOffset + at, 8).getFloat64(0, le));
        break;
      }
      default:
        break;
    }
  }
  return out;
}

export async function readNumber(
  file: TiffFile,
  entry: IfdEntry | undefined,
): Promise<number | undefined> {
  const values = await readNumbers(file, entry);
  return values.length > 0 ? values[0] : undefined;
}

export async function readString(
  file: TiffFile,
  entry: IfdEntry | undefined,
): Promise<string | undefined> {
  if (!entry) return undefined;
  const bytes = await readEntryBytes(file, entry);
  let end = bytes.length;
  while (end > 0 && (bytes[end - 1] === 0 || bytes[end - 1] === 0x20)) end -= 1;
  if (end === 0) return undefined;
  let text = "";
  for (let index = 0; index < end; index += 1) text += String.fromCharCode(bytes[index]);
  return text.trim() || undefined;
}

/** Returns the first entry for `tag` found in any IFD of the given kinds. */
export function findEntry(
  file: TiffFile,
  tag: number,
  kinds?: readonly IfdKind[],
): IfdEntry | undefined {
  for (const ifd of file.ifds) {
    if (kinds && !kinds.includes(ifd.kind)) continue;
    const entry = ifd.entries.get(tag);
    if (entry) return entry;
  }
  return undefined;
}

/** Locates the TIFF header inside a JPEG's APP1/EXIF segment. */
export async function findJpegExifStart(source: ByteSource): Promise<number | null> {
  const head = await source.read(0, Math.min(source.size, 128 * 1024));
  if (head.length < 4 || head[0] !== 0xff || head[1] !== 0xd8) return null;

  let cursor = 2;
  while (cursor + 4 <= head.length) {
    if (head[cursor] !== 0xff) {
      cursor += 1;
      continue;
    }
    const marker = head[cursor + 1];
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      cursor += 2;
      continue;
    }
    if (marker === 0xda || marker === 0xd9) return null; // Reached image data.
    const length = u16(head, cursor + 2, false);
    if (length < 2) return null;
    if (marker === 0xe1 && cursor + 4 + 6 <= head.length) {
      const tag = String.fromCharCode(...head.subarray(cursor + 4, cursor + 10));
      if (tag === "Exif\0\0") return cursor + 10;
    }
    cursor += 2 + length;
  }
  return null;
}
