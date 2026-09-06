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
    // Isolated, disposable PostgreSQL database — migrated fresh by
    // scripts/prepare-test-db.mjs (runs via the `pretest` npm script before
    // this config is even loaded). TEST_DATABASE_URL must be set in the
    // environment (see .env.example); tests never touch DATABASE_URL.
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "" },
    testTimeout: 15000,
  },
});
