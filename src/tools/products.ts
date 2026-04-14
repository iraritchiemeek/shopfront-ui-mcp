import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchProducts } from "../shopify.js";
import { shopifyUrlSchema } from "./util.js";

export function registerProductTools(server: McpServer): void {
  server.registerTool(
    "get_products",
    {
      description:
        "Fetch the full product catalogue from a Shopify storefront via its public /products.json endpoint. " +
        "Use this when the user asks to browse everything, wants to filter by product_type or tag (case-insensitive exact match), or when you need to do semantic filtering on descriptions/tags that other tools can't express. " +
        "For 'popular' or 'featured' intents, prefer get_collections first. For keyword search on a large catalogue, prefer search_products. " +
        "Returns: Array<{ id, title, handle, body_html, vendor, product_type, tags, variants: [{ id, title, price, available, ... }], images, options }>. Works with any Shopify store.",
      inputSchema: {
        shopify_url: shopifyUrlSchema,
        product_type: z
          .string()
          .optional()
          .describe(
            "Filter by product type, case-insensitive exact match. Stores set their own types — inspect a first unfiltered result or get_collections to discover the values used on this store.",
          ),
        tag: z
          .string()
          .optional()
          .describe(
            "Filter by tag, case-insensitive exact match. Stores set their own tags — discover values from an unfiltered result.",
          ),
      },
    },
    async ({ shopify_url, product_type, tag }) => {
      const products = await fetchProducts(shopify_url, { product_type, tag });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(products, null, 2) }],
      };
    },
  );
}
