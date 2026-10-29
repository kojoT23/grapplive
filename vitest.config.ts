import { defineConfig } from "vitest/config";
import path from "path";

// jsdom environment is required: zustand's persist middleware (via
// lib/utils/safe-storage.ts) calls window.localStorage directly, which
// doesn't exist under Node's default "node" test environment.
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
