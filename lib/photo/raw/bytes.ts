/**
 * Random-access byte sources.
 *
 * A 25 MB `.ARW` must never be pulled into memory in one piece on a phone, so
 * every reader in this package works through this interface and only fetches
 * the ranges it actually needs. `Blob.slice()` is lazy, so a `File` picked from
 * the Android file picker (or from the camera over USB/MTP) costs nothing until
 * a range is read.
 */
export interface ByteSource {
  readonly size: number;
  read(offset: number, length: number): Promise<Uint8Array>;
}

/** Reads that fall inside this prefix are served from one cached slice. */
const PREFIX_BYTES = 256 * 1024;

export function blobSource(blob: Blob): ByteSource {
  let prefix: Promise<Uint8Array> | null = null;

  const readPrefix = () => {
    if (!prefix) {
      prefix = blob
        .slice(0, Math.min(PREFIX_BYTES, blob.size))
        .arrayBuffer()
        .then((buf) => new Uint8Array(buf));
    }
    return prefix;
  };

  return {
    size: blob.size,
    async read(offset: number, length: number): Promise<Uint8Array> {
      if (offset < 0 || length < 0) {
        throw new RangeError(`Lectura inválida: offset=${offset} length=${length}`);
      }
      const end = Math.min(offset + length, blob.size);
      if (end <= offset) return new Uint8Array(0);

      if (end <= PREFIX_BYTES) {
        const head = await readPrefix();
        // The prefix may be shorter than requested if the file is tiny.
        return head.subarray(offset, Math.min(end, head.length));
      }
      const buf = await blob.slice(offset, end).arrayBuffer();
      return new Uint8Array(buf);
    },
  };
}

export function bufferSource(bytes: Uint8Array): ByteSource {
  return {
    size: bytes.length,
    async read(offset: number, length: number): Promise<Uint8Array> {
      if (offset < 0 || length < 0) {
        throw new RangeError(`Lectura inválida: offset=${offset} length=${length}`);
      }
      const end = Math.min(offset + length, bytes.length);
      if (end <= offset) return new Uint8Array(0);
      return bytes.subarray(offset, end);
    },
  };
}

/** Reads `length` bytes and fails loudly when the source is truncated. */
export async function readExact(
  source: ByteSource,
  offset: number,
  length: number,
): Promise<Uint8Array> {
  const chunk = await source.read(offset, length);
  if (chunk.length < length) {
    throw new RangeError(
      `Archivo truncado: se esperaban ${length} bytes en ${offset}, se leyeron ${chunk.length}`,
    );
  }
  return chunk;
}

export function u16(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  return littleEndian
    ? bytes[offset] | (bytes[offset + 1] << 8)
    : (bytes[offset] << 8) | bytes[offset + 1];
}

export function u32(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  const a = bytes[offset];
  const b = bytes[offset + 1];
  const c = bytes[offset + 2];
  const d = bytes[offset + 3];
  // `>>> 0` keeps values above 2^31 positive.
  return littleEndian
    ? ((a | (b << 8) | (c << 16) | (d << 24)) >>> 0)
    : ((d | (c << 8) | (b << 16) | (a << 24)) >>> 0);
}

export function i32(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  return u32(bytes, offset, littleEndian) | 0;
}

export function i16(bytes: Uint8Array, offset: number, littleEndian: boolean): number {
  const value = u16(bytes, offset, littleEndian);
  return value > 0x7fff ? value - 0x10000 : value;
}
