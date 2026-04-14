import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchCollections, fetchCollectionProducts } from "../shopify.js";
import { shopifyUrlSchema } from "./util.js";

export function registerCollectionTools(server: McpServer): void {
  server.registerTool(
    "get_collections",
    {
      description:
        "List all collections (categories) in a Shopify storefront. Use this FIRST when the user asks for popular, featured, bestselling, curated, seasonal, or on-sale items — Shopify stores commonly surface these intents as named collections (e.g. handles like 'bestsellers', 'featured', 'staff-picks', 'sale', 'new-arrivals'). After discovering the right handle here, call get_products_in_collection to fetch its products. " +
        "Returns: Array<{ id, handle, title, description, products_count, image | null, published_at, updated_at }>. " +
        "Tip: match handles case-insensitively against keywords like /best|popular|top|featured|staff|sale|new/.",
      inputSchema: {
        shopify_url: shopifyUrlSchema,
      },
    },
    async ({ shopify_url }) => {
      const collections = await fetchCollections(shopify_url);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(collections, null, 2) }],
      };
    },
  );

  server.registerTool(
    "get_products_in_collection",
    {
      description:
        "Fetch products within a named Shopify collection, by handle. Use after get_collections when you've identified the right collection. " +
        "Order reflects the storefront's manual or automatic sort for that collection as configured by the merchant — if they sort a collection by best-selling, the JSON returns in that order. " +
        "Returns the same product shape as get_products: Array<{ id, title, handle, body_html, vendor, product_type, tags, variants, images, options, ... }>.",
      inputSchema: {
        shopify_url: shopifyUrlSchema,
        handle: z
          .string()
          .describe("Collection handle from get_collections (the URL-safe slug, not the title)"),
      },
    },
    async ({ shopify_url, handle }) => {
      const products = await fetchCollectionProducts(shopify_url, handle);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(products, null, 2) }],
      };
    },
  );
}
