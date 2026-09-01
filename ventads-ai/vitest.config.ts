import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Isolated, disposable database — see scripts/prepare-test-db.mjs (runs
    // via the `pretest` npm script before this config is even loaded).
    env: { DATABASE_URL: "file:./test.db" },
    testTimeout: 15000,
  },
});
