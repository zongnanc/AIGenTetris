/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig({
  // Relative base so the production build also works on GitHub Pages.
  base: "./",
  test: {
    globals: true,
    environment: "node",
  },
});
