import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Storage is abstracted behind this interface so the local-disk provider
 * used in development/MVP can be swapped for S3 (or anything else) later by
 * writing one adapter — nothing above this layer needs to change.
 * See AGENTS.md #14/#19: no provider details leak past this file.
 */
export interface StorageService {
  save(input: {
    buffer: Buffer;
    folder: string;
    extension: string;
  }): Promise<{ key: string; url: string }>;
  read(key: string): Promise<Buffer>;
  urlFor(key: string): string;
}

const STORAGE_ROOT = path.join(process.cwd(), "storage");

class LocalStorageService implements StorageService {
  async save({
    buffer,
    folder,
    extension,
  }: {
    buffer: Buffer;
    folder: string;
    extension: string;
  }) {
    const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "");
    const dir = path.join(STORAGE_ROOT, safeFolder);
    await mkdir(dir, { recursive: true });

    const filename = `${randomUUID()}.${extension.replace(/[^a-z0-9]/gi, "")}`;
    const key = `${safeFolder}/${filename}`;
    await writeFile(path.join(STORAGE_ROOT, key), buffer);

    return { key, url: this.urlFor(key) };
  }

  async read(key: string) {
    return readFile(this.resolveSafePath(key));
  }

  urlFor(key: string) {
    return `/api/files/${key}`;
  }

  /** Prevents path traversal (e.g. "../../etc/passwd") from a stored key. */
  private resolveSafePath(key: string) {
    const resolved = path.resolve(STORAGE_ROOT, key);
    if (!resolved.startsWith(STORAGE_ROOT + path.sep)) {
      throw new Error("Invalid storage key");
    }
    return resolved;
  }
}

function createStorageService(): StorageService {
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  switch (provider) {
    case "local":
      return new LocalStorageService();
    default:
      throw new Error(`Unknown STORAGE_PROVIDER: ${provider}`);
  }
}

export const storage = createStorageService();
