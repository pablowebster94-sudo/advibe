// Prisma CLI configuration.
// A placeholder URL keeps `prisma generate` build-safe when Vercel does not
// inject DATABASE_URL during the install/build phase. Runtime database access
// remains strict in lib/db.ts and requires a real DATABASE_URL.
import "dotenv/config";
import { defineConfig } from "prisma/config";

const databaseUrl =
  process.env["DATABASE_URL"] ??
  "postgresql://build:build@localhost:5432/ventads_build";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
