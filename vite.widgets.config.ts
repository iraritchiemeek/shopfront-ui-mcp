/**
 * Per-widget Vite build.
 *
 * Set WIDGET=<name> to build widgets/<name>/main.tsx. Output goes to
 * public/ui-apps/<name>/{main.js, styles.css}, served by Cloudflare Workers
 * Static Assets.
 *
 * `inlineDynamicImports` + `format: iife` keeps each widget to a single JS file
 * (no shared chunks, no CORS headaches inside sandboxed iframes). Predictable
 * filenames let the runtime stub HTML reference them without a manifest.
 */
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const WIDGETS_DIR = resolve(__dirname, "widgets");
const widgetName = process.env.WIDGET;

if (!widgetName) {
  throw new Error("WIDGET env var is required");
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "public/ui-apps",
    emptyOutDir: false,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: resolve(WIDGETS_DIR, widgetName, "main.tsx"),
      output: {
        inlineDynamicImports: true,
        format: "iife" as const,
        entryFileNames: `${widgetName}/main.js`,
        assetFileNames: `${widgetName}/styles[extname]`,
      },
    },
  },
  logLevel: "warn",
});
