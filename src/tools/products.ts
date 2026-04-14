import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchProducts } from "../shopify.js";

export function registerProductTools(server: McpServer): void {
  server.registerTool(
    "get_products",
    {
      description:
        "Fetch the full product catalogue from a Shopify storefront via its public " +
        "/products.json endpoint. Returns products with names, descriptions, tasting notes, " +
        "prices, variants, images, and availability. Use product_type and tag to filter. " +
        "Works with any Shopify store — pass the storefront URL.",
      inputSchema: {
        shopify_url: z
          .string()
          .describe("Shopify store URL, e.g. 'https://rocketcoffee.co.nz' or 'allpress.co.nz'"),
        product_type: z
          .string()
          .optional()
          .describe("Filter by product type, e.g. COFFEE, EQUIPMENT, CLOTHING"),
        tag: z
          .string()
          .optional()
          .describe("Filter by tag, e.g. FILTER, ESPRESSO, ETHIOPIA, SINGLE ORIGIN"),
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
