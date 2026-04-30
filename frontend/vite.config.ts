import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }
          if (id.includes("@mui/") || id.includes("@emotion/")) {
            return "mui";
          }
          if (id.includes("@tanstack/")) {
            return "query";
          }
          if (id.includes("react") || id.includes("react-router-dom")) {
            return "react";
          }
          return "vendor";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    pool: "threads",
    fileParallelism: false,
    maxWorkers: 1,
  },
});
