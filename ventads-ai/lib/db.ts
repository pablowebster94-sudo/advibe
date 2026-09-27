import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { databaseSchema } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required");
  // Same dedicated schema the migrations use (see lib/database-url.ts).
  const adapter = new PrismaPg(connectionString, { schema: databaseSchema(connectionString) });
  return new PrismaClient({ adapter });
}

function getClient() {
  const client = globalForPrisma.prisma ?? createClient();
  // Cached in production too: one client per server instance.
  globalForPrisma.prisma = client;
  return client;
}

/**
 * Created on first use rather than at import time, so `next build` (which
 * imports every route while collecting page data) never needs DATABASE_URL
 * or a reachable database. A missing/invalid DATABASE_URL surfaces at
 * request time instead, where app/error.tsx renders it.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getClient();
    const value = Reflect.get(client, property, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
