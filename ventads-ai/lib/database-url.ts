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
