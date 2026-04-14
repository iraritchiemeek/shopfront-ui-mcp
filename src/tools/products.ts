import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchProducts } from "../shopify.js";
import type { ShopifyProduct } from "../types/shopify.js";
import { shopifyUrlSchema } from "./util.js";

function matchesQuery(p: ShopifyProduct, q: string): boolean {
  const needle = q.toLowerCase();
  if (p.title.toLowerCase().includes(needle)) return true;
  if (p.product_type.toLowerCase().includes(needle)) return true;
  if (p.vendor.toLowerCase().includes(needle)) return true;
  if (p.tags.some((t) => t.toLowerCase().includes(needle))) return true;
  const bodyText = (p.body_html ?? "").replace(/<[^>]+>/g, " ");
  if (bodyText.toLowerCase().includes(needle)) return true;
  return false;
}

export function registerProductTools(server: McpServer): void {
  server.registerTool(
    "get_products",
    {
      description:
        "Fetch the product catalogue from a Shopify storefront via its public /products.json endpoint. " +
        "Use for browsing everything or keyword search on title/description/tags/vendor/type via `q`. " +
        "Prefer this over search_products when the storefront is small (<250 products) or when search_products has failed — q-filtering here matches against full descriptions too. " +
        "For 'popular' or 'featured' intents, prefer get_collections first. Filter by exact product_type/tag inside your `code` arrow after fetching. " +
        "Returns: Array<{ id, title, handle, body_html, vendor, product_type, tags, variants: [{ id, title, price, available, ... }], images, options }>.",
      inputSchema: {
        shopify_url: shopifyUrlSchema,
        q: z
          .string()
          .optional()
          .describe(
            "Case-insensitive substring match against title, product_type, vendor, tags, and body_html (HTML-stripped). Applied server-side so you get only relevant products back.",
          ),
      },
    },
    async ({ shopify_url, q }) => {
      let products = await fetchProducts(shopify_url);
      if (q) products = products.filter((p) => matchesQuery(p, q));
      return {
        content: [{ type: "text" as const, text: JSON.stringify(products, null, 2) }],
      };
    },
  );
}
