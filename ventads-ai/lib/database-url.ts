/**
 * VentAds keeps its Prisma tables in their own PostgreSQL schema
 * ("ventads" by default) instead of `public`. The shared Supabase database
 * already holds the AdVibe Module 1 tables in `public` (supabase/migrations),
 * and Prisma refuses to migrate a non-empty schema it doesn't own (P3005).
 * A dedicated schema keeps both sets isolated, needs no destructive change,
 * and keeps these tables out of Supabase's public REST API.
 *
 * An explicit `?schema=` in DATABASE_URL still wins. Used by both
 * prisma.config.ts (migrations) and lib/db.ts (runtime client), so the two
 * can never disagree.
 */
export const DEFAULT_DATABASE_SCHEMA = "ventads";

export function databaseSchema(connectionString: string | undefined): string {
  if (!connectionString) return DEFAULT_DATABASE_SCHEMA;
  try {
    return new URL(connectionString).searchParams.get("schema") || DEFAULT_DATABASE_SCHEMA;
  } catch {
    return DEFAULT_DATABASE_SCHEMA;
  }
}

export function withDatabaseSchema(connectionString: string | undefined): string | undefined {
  if (!connectionString) return connectionString;
  try {
    const url = new URL(connectionString);
    if (!url.searchParams.get("schema")) url.searchParams.set("schema", DEFAULT_DATABASE_SCHEMA);
    return url.toString();
  } catch {
    return connectionString;
  }
}

/**
 * Connection string the serverless runtime uses. Supabase's Session pooler
 * (port 5432) pins one server connection per client for the whole session,
 * and serverless instances keep their sessions while idle or frozen, so a
 * handful of workers exhausted it in production (EMAXCONNSESSION). The
 * Transaction pooler on the same host (port 6543) only holds a server
 * connection during each transaction, which is what serverless needs.
 * Prisma's pg adapter is compatible: unnamed statements, schema-qualified
 * SQL, no session state. Migrations keep using DATABASE_URL as is (they
 * need the session pooler). DATABASE_POOL_MODE=session opts out.
 */
export function runtimeConnectionString(connectionString: string): string {
  if (process.env.DATABASE_POOL_MODE?.trim().toLowerCase() === "session") return connectionString;
  try {
    const url = new URL(connectionString);
    if (url.hostname.endsWith(".pooler.supabase.com") && (url.port || "5432") === "5432") {
      url.port = "6543";
      return url.toString();
    }
  } catch {
    // Not a URL we understand: use it unchanged.
  }
  return connectionString;
}

/** "transaction" | "session" | "direct", for /api/health (never the URL itself). */
export function runtimePoolerMode(connectionString: string | undefined): string {
  if (!connectionString) return "missing";
  try {
    const url = new URL(runtimeConnectionString(connectionString));
    if (!url.hostname.endsWith(".pooler.supabase.com")) return "direct";
    return url.port === "6543" ? "transaction" : "session";
  } catch {
    return "unknown";
  }
}
