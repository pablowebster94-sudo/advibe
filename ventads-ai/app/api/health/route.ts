import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { databaseSchema } from "@/lib/database-url";
import { resolveStorageProvider } from "@/lib/services/storage";
import { resolveAppUrlSource } from "@/lib/services/job-dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Operational health check for deploy verification (GitHub Actions hits it
 * after every production deployment). Public on purpose — it bypasses the
 * Basic Auth gate in proxy.ts — so it only ever reports booleans, counts
 * and error *codes*: never a value, a hostname, a user or an error message.
 */

function has(name: string) {
  return Boolean(process.env[name]?.trim());
}

function databaseUrlShape() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return { configured: false };
  try {
    const url = new URL(raw);
    const isSupabasePooler = url.hostname.endsWith(".pooler.supabase.com");
    return {
      configured: true,
      supabaseSessionPooler: isSupabasePooler && (url.port || "5432") === "5432",
      supabaseTransactionPooler: isSupabasePooler && url.port === "6543",
      supabaseDirectConnection: /^db\..+\.supabase\.co$/.test(url.hostname),
      poolerUserFormatOk: !isSupabasePooler || url.username.startsWith("postgres."),
    };
  } catch {
    return { configured: true, parseable: false };
  }
}

function errorCode(error: unknown): string {
  const e = error as {
    code?: string;
    name?: string;
    meta?: { driverAdapterError?: { cause?: { kind?: string } } };
    cause?: { kind?: string; code?: string };
  };
  return (
    e.meta?.driverAdapterError?.cause?.kind ??
    e.cause?.kind ??
    e.code ??
    e.cause?.code ??
    e.name ??
    "UnknownError"
  );
}

export async function GET() {
  const config = {
    database: databaseUrlShape(),
    auth: has("BASIC_AUTH_USER") && has("BASIC_AUTH_PASSWORD")
      ? "basic-auth"
      : has("CRON_SECRET")
        ? "cron-secret-fallback"
        : "missing",
    CRON_SECRET: has("CRON_SECRET"),
    APP_URL: resolveAppUrlSource(),
    GEMINI_API_KEY: has("GEMINI_API_KEY"),
    ANTHROPIC_API_KEY: has("ANTHROPIC_API_KEY"),
    OPENAI_API_KEY: has("OPENAI_API_KEY"),
    STORAGE_PROVIDER: resolveStorageProvider(),
    IMAGE_PROVIDER: process.env.IMAGE_PROVIDER || "local-compositor",
  };

  let database: Record<string, unknown>;
  try {
    const migrationsTable = Prisma.raw(
      `"${databaseSchema(process.env.DATABASE_URL).replace(/"/g, '""')}"."_prisma_migrations"`
    );
    const migrations = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name FROM ${migrationsTable}
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
      ORDER BY finished_at`;
    const [users, products] = await Promise.all([prisma.user.count(), prisma.product.count()]);
    database = {
      connected: true,
      schema: databaseSchema(process.env.DATABASE_URL),
      migrationsApplied: migrations.map((row) => row.migration_name),
      tables: { User: users, Product: products },
    };
  } catch (error) {
    database = {
      connected: false,
      error: config.database.configured ? errorCode(error) : "DatabaseUrlMissing",
    };
  }

  const ok =
    database.connected === true &&
    config.auth !== "missing" &&
    config.CRON_SECRET &&
    config.APP_URL !== "missing";

  return NextResponse.json(
    { status: ok ? "ok" : "degraded", database, config },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
