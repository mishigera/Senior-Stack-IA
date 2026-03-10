import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/frontend/setup.ts"],
    include: ["tests/frontend/**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage/frontend",
      include: ["client/src/**/*.{ts,tsx}"],
      exclude: ["client/src/main.tsx", "client/src/**/*.d.ts", "**/*.test.{ts,tsx}", "**/index.css"],
      thresholds: {
        "client/src/lib/**/*.{ts,tsx}": {
          lines: 70,
          functions: 70,
          branches: 70,
          statements: 70,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
});
