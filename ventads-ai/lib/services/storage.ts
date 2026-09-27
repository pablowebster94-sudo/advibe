import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "@/lib/db";

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
  /**
   * Async because a real S3-compatible provider signs a time-limited URL on
   * every call (no stable URL can be cached in the DB — see
   * ARCHITECTURE.md → "Storage"). The local provider is trivially async
   * (no signing needed) so both implementations share this signature.
   */
  urlFor(key: string): Promise<string>;
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

    return { key, url: await this.urlFor(key) };
  }

  async read(key: string) {
    return readFile(this.resolveSafePath(key));
  }

  async urlFor(key: string) {
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

/**
 * S3-compatible provider: works against AWS S3 as well as any
 * S3-API-compatible object store (Cloudflare R2, Supabase Storage, etc).
 * R2 is the recommended target for this app given its read-heavy,
 * image-serving pattern (zero egress fees) — set S3_ENDPOINT to R2's
 * account endpoint and S3_FORCE_PATH_STYLE=true; leave both unset for
 * real AWS S3.
 *
 * The DB never stores a URL (see ARCHITECTURE.md -> "Storage"): every read
 * signs a short-lived GET URL on demand, so a bucket can be made private
 * and URLs naturally expire instead of staying valid forever.
 */
class S3StorageService implements StorageService {
  private client: S3Client;
  private bucket: string;
  private signedUrlTtlSeconds: number;

  constructor() {
    const bucket = process.env.S3_BUCKET;
    const region = process.env.AWS_REGION;
    if (!bucket) throw new Error("S3_BUCKET is required when STORAGE_PROVIDER=s3");
    if (!region) throw new Error("AWS_REGION is required when STORAGE_PROVIDER=s3");

    this.bucket = bucket;
    this.signedUrlTtlSeconds = Number(process.env.S3_SIGNED_URL_TTL_SECONDS ?? 3600);
    this.client = new S3Client({
      region,
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      // Falls back to the SDK's default provider chain (env vars, shared
      // config file, IAM role) when AWS_ACCESS_KEY_ID isn't set — explicit
      // credentials are only needed for providers like R2 that require them.
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }

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
    const filename = `${randomUUID()}.${extension.replace(/[^a-z0-9]/gi, "")}`;
    const key = `${safeFolder}/${filename}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentTypeFromExtension(extension),
      })
    );

    return { key, url: await this.urlFor(key) };
  }

  async read(key: string) {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key })
    );
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) throw new Error(`Object not found: ${key}`);
    return Buffer.from(bytes);
  }

  async urlFor(key: string) {
    return getSignedUrl(
      this.client,
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
      { expiresIn: this.signedUrlTtlSeconds }
    );
  }
}

function contentTypeFromExtension(extension: string) {
  switch (extension.replace(/[^a-z0-9]/gi, "").toLowerCase()) {
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}

/**
 * Stores file bytes in PostgreSQL (StoredFile). Zero-config: it needs only
 * the DATABASE_URL the app already requires, which makes it the working
 * default on Vercel (read-only, per-invocation filesystem) until an
 * S3-compatible bucket is configured. Files are served by /api/files,
 * exactly like the local provider.
 */
class DatabaseStorageService implements StorageService {
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
    const safeExtension = extension.replace(/[^a-z0-9]/gi, "");
    const key = `${safeFolder}/${randomUUID()}.${safeExtension}`;
    await prisma.storedFile.create({
      data: {
        key,
        contentType: contentTypeFromExtension(safeExtension),
        data: new Uint8Array(buffer),
        size: buffer.length,
      },
    });
    return { key, url: await this.urlFor(key) };
  }

  async read(key: string) {
    const file = await prisma.storedFile.findUnique({ where: { key } });
    if (!file) throw new Error("File not found");
    return Buffer.from(file.data);
  }

  async urlFor(key: string) {
    return `/api/files/${key}`;
  }
}

export function resolveStorageProvider() {
  const configured = process.env.STORAGE_PROVIDER?.trim();
  // Local disk cannot persist anything on Vercel; fall back to the database.
  if (process.env.VERCEL && (!configured || configured === "local")) return "database";
  return configured || "local";
}

function createStorageService(): StorageService {
  const provider = resolveStorageProvider();
  switch (provider) {
    case "local":
      return new LocalStorageService();
    case "database":
      return new DatabaseStorageService();
    case "s3":
      return new S3StorageService();
    default:
      throw new Error(`Unknown STORAGE_PROVIDER: ${provider}`);
  }
}

export const storage = createStorageService();
