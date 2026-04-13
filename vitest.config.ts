import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: ["node_modules/**"],
  },
  plugins: [
    cloudflareTest({
      miniflare: {
        compatibilityDate: "2026-03-01",
        compatibilityFlags: ["nodejs_compat"],
      },
    }),
  ],
});
