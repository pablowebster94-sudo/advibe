/**
 * ZIP writer.
 *
 * Dependency-free, and it produces real DEFLATE output by using the platform's
 * own `CompressionStream("deflate-raw")` where available, falling back to STORE
 * where it is not. Entries are appended as `Blob` parts rather than copied into
 * one big buffer, so a 400-photo export does not have to fit in memory at once.
 *
 * Limitation, stated rather than hidden: this writes ZIP32. Archives above 4 GB
 * need ZIP64, and `addFile` throws with a clear message instead of emitting a
 * corrupt file. The export UI splits large jobs before that can happen.
 */

const LOCAL_HEADER = 0x04034b50;
const CENTRAL_HEADER = 0x02014b50;
const END_OF_CENTRAL = 0x06054b50;
const ZIP32_LIMIT = 0xffffffff;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let index = 0; index < 256; index += 1) {
    let value = index;
    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }
  return table;
})();

export function crc32(bytes: Uint8Array, seed = 0): number {
  let crc = (seed ^ -1) >>> 0;
  for (let index = 0; index < bytes.length; index += 1) {
    crc = (CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8)) >>> 0;
  }
  return (crc ^ -1) >>> 0;
}

/** MS-DOS date/time, the only timestamp format a plain ZIP header carries. */
export function dosDateTime(date: Date): { time: number; date: number } {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function deflateSupported(): boolean {
  return typeof CompressionStream !== "undefined";
}

async function deflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(
    new CompressionStream("deflate-raw"),
  );
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

interface Entry {
  name: Uint8Array;
  crc: number;
  compressedSize: number;
  uncompressedSize: number;
  offset: number;
  method: number;
  time: number;
  date: number;
}

export interface ZipProgress {
  entries: number;
  bytes: number;
  currentName: string;
}

export class ZipWriter {
  private readonly parts: BlobPart[] = [];
  private readonly entries: Entry[] = [];
  private offset = 0;
  private readonly names = new Set<string>();

  /** Adds one file. Names are made unique so nothing is silently overwritten. */
  async addFile(
    name: string,
    content: Uint8Array | Blob | string,
    options: { modified?: Date; compress?: boolean } = {},
  ): Promise<void> {
    const uniqueName = this.uniqueName(name);
    const raw =
      typeof content === "string"
        ? new TextEncoder().encode(content)
        : content instanceof Blob
          ? new Uint8Array(await content.arrayBuffer())
          : content;

    const shouldCompress = (options.compress ?? true) && deflateSupported() && raw.length > 256;
    let payload = raw;
    let method = 0;
    if (shouldCompress) {
      const deflated = await deflateRaw(raw);
      // Only keep the compressed form if it actually helped: an already-
      // compressed JPEG usually gets bigger.
      if (deflated.length < raw.length) {
        payload = deflated;
        method = 8;
      }
    }

    if (this.offset + payload.length > ZIP32_LIMIT) {
      throw new Error(
        "El ZIP supera 4 GB, que es el límite del formato ZIP32. Exporta en lotes más pequeños.",
      );
    }

    const nameBytes = new TextEncoder().encode(uniqueName);
    const { time, date } = dosDateTime(options.modified ?? new Date());
    const crc = crc32(raw);

    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, LOCAL_HEADER, true);
    view.setUint16(4, 20, true); // version needed
    view.setUint16(6, 0x0800, true); // UTF-8 names
    view.setUint16(8, method, true);
    view.setUint16(10, time, true);
    view.setUint16(12, date, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, payload.length, true);
    view.setUint32(22, raw.length, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    header.set(nameBytes, 30);

    this.entries.push({
      name: nameBytes,
      crc,
      compressedSize: payload.length,
      uncompressedSize: raw.length,
      offset: this.offset,
      method,
      time,
      date,
    });

    this.parts.push(header as BlobPart, payload as BlobPart);
    this.offset += header.length + payload.length;
  }

  get fileCount(): number {
    return this.entries.length;
  }

  get byteLength(): number {
    return this.offset;
  }

  /** Writes the central directory and returns the finished archive. */
  finish(): Blob {
    const centralParts: Uint8Array[] = [];
    let centralSize = 0;

    for (const entry of this.entries) {
      const record = new Uint8Array(46 + entry.name.length);
      const view = new DataView(record.buffer);
      view.setUint32(0, CENTRAL_HEADER, true);
      view.setUint16(4, 20, true); // version made by
      view.setUint16(6, 20, true); // version needed
      view.setUint16(8, 0x0800, true);
      view.setUint16(10, entry.method, true);
      view.setUint16(12, entry.time, true);
      view.setUint16(14, entry.date, true);
      view.setUint32(16, entry.crc, true);
      view.setUint32(20, entry.compressedSize, true);
      view.setUint32(24, entry.uncompressedSize, true);
      view.setUint16(28, entry.name.length, true);
      view.setUint16(30, 0, true); // extra length
      view.setUint16(32, 0, true); // comment length
      view.setUint16(34, 0, true); // disk number
      view.setUint16(36, 0, true); // internal attributes
      view.setUint32(38, 0, true); // external attributes
      view.setUint32(42, entry.offset, true);
      record.set(entry.name, 46);
      centralParts.push(record);
      centralSize += record.length;
    }

    const end = new Uint8Array(22);
    const view = new DataView(end.buffer);
    view.setUint32(0, END_OF_CENTRAL, true);
    view.setUint16(4, 0, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, this.entries.length, true);
    view.setUint16(10, this.entries.length, true);
    view.setUint32(12, centralSize, true);
    view.setUint32(16, this.offset, true);
    view.setUint16(20, 0, true);

    return new Blob([...this.parts, ...(centralParts as BlobPart[]), end as BlobPart], {
      type: "application/zip",
    });
  }

  private uniqueName(name: string): string {
    const clean = name.replace(/^\/+/, "").replace(/\\/g, "/");
    if (!this.names.has(clean)) {
      this.names.add(clean);
      return clean;
    }
    const dot = clean.lastIndexOf(".");
    const base = dot <= 0 ? clean : clean.slice(0, dot);
    const extension = dot <= 0 ? "" : clean.slice(dot);
    let counter = 2;
    let candidate = `${base}-${counter}${extension}`;
    while (this.names.has(candidate)) {
      counter += 1;
      candidate = `${base}-${counter}${extension}`;
    }
    this.names.add(candidate);
    return candidate;
  }
}
