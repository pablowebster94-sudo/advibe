// Runs before `npm test` (see package.json `pretest`). Creates a fresh,
// disposable SQLite database matching the current schema.prisma, so tests
// never share state with local dev.db or leak state across runs.
import { existsSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dbPath = fileURLToPath(new URL("../test.db", import.meta.url));

if (existsSync(dbPath)) rmSync(dbPath);

execFileSync("npx", ["prisma", "db", "push"], {
  stdio: "inherit",
  cwd: root,
  env: { ...process.env, DATABASE_URL: "file:./test.db" },
});
