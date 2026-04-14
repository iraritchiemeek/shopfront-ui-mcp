import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchProducts } from "../shopify.js";

export function registerProductTools(server: McpServer): void {
  server.registerTool(
    "get_products",
    {
      description:
        "Fetch Rocket Coffee's full product catalog. Returns products with names, descriptions, " +
        "tasting notes, prices, variants (sizes/grinds), images, and availability. The body_html " +
        "field contains tasting notes and roast dates. Use product_type and tag to filter.",
      inputSchema: {
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
    async ({ product_type, tag }) => {
      const products = await fetchProducts("https://rocketcoffee.co.nz", { product_type, tag });
      return {
        content: [{ type: "text" as const, text: JSON.stringify(products, null, 2) }],
      };
    },
  );
}
