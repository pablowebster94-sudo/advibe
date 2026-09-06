// Runs before `npm test` (see package.json `pretest`). Points at a
// dedicated, disposable PostgreSQL database and brings it up to date with
// the current schema.prisma via `prisma migrate deploy`, so tests never
// share state with local dev data or leak state across runs. Same
// datasource provider as dev/production (Option B: one schema.prisma, no
// per-environment dialect switching) — only the database differs.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error(
    "TEST_DATABASE_URL is required to run tests (a dedicated PostgreSQL database — never reuses DATABASE_URL)."
  );
}

execFileSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  cwd: root,
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
});
