import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { analyzeSite } from "../analyze.js";

export interface AnalyzeToolsContext {
  browser: Fetcher;
}

export function registerAnalyzeTools(server: McpServer, context: AnalyzeToolsContext): void {
  server.registerTool(
    "analyze_site",
    {
      description:
        "Visit a Shopify storefront and extract its brand design tokens (primary colour, " +
        "background, foreground, accent, font family, border radius, logo URL). Use this before " +
        "render_products so the product cards can be themed to match the store.",
      inputSchema: {
        shopify_url: z
          .string()
          .describe("Shopify store URL, e.g. 'https://rocketcoffee.co.nz' or 'allpress.co.nz'"),
      },
    },
    async ({ shopify_url }) => {
      const tokens = await analyzeSite(shopify_url, context.browser);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(tokens, null, 2) }],
        structuredContent: tokens as unknown as Record<string, unknown>,
      };
    },
  );
}
