import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchProducts } from "../shopify.js";

export function registerSearchTools(server: McpServer): void {
  server.registerTool(
    "search_products",
    {
      description:
        "Keyword search over a Shopify storefront using the store's built-in predictive search. " +
        "Prefer this when the user named something specific (product name, brand, attribute, keyword) AND the catalogue is likely large. For vague intents like 'popular' or 'featured', use get_collections instead. For semantic matching on descriptions, fall back to get_products and filter in code. " +
        "Returns up to 10 results (Shopify-capped) as a LEAN product shape: Array<{ id, handle, title, body, vendor, type, tags, url, price, price_min, price_max, available, featured_image, variants: [{ id, title, price, available, ... }] }>. Note: shape differs from get_products (`body` not `body_html`, no `options`, no per-variant timestamps; URLs are store-relative). render_products rejects this shape — re-fetch full records via get_products and filter by handle before rendering.",
      inputSchema: {
        shopify_url: z.string().describe("Shopify store URL, e.g. 'https://example.com'"),
        q: z.string().min(1).describe("Search query. Matches titles, tags, and some body content."),
      },
    },
    async ({ shopify_url, q }) => {
      const products = await searchProducts(shopify_url, q);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(products, null, 2) }],
      };
    },
  );
}
