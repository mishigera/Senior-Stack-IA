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
      all: false,
      include: [
        "client/src/lib/auth-utils.ts",
        "client/src/lib/queryClient.ts",
        "client/src/lib/utils.ts",
        "client/src/hooks/use-roles.ts",
      ],
      exclude: [
        "client/src/main.tsx",
        "client/src/**/*.d.ts",
        "client/src/**/*.test.{ts,tsx}",
        "client/src/**/__tests__/**",
        "tests/**",
        "**/*.config.{js,ts,mjs,cjs}",
        "**/node_modules/**",
        "**/dist/**",
        "**/coverage/**",
        "**/index.css",
      ],
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
