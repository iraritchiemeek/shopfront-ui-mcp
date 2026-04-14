import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { checkIsShopify } from "../shopify.js";
import { shopifyUrlSchema } from "./util.js";

export function registerDetectTools(server: McpServer): void {
  server.registerTool(
    "is_shopify",
    {
      description:
        "Check whether a URL points to a Shopify storefront AND return the store's ISO 4217 currency code when it is one. Call this FIRST inside `code` before any other catalogue method — if `shopify` is false, return early with `{ shopify: false, reason }` instead of attempting to browse. When shopify is true, pass the `currency` through to `render_products` so prices format correctly. " +
        "Detection uses Shopify response headers (x-shopid, x-shardid, x-shopify-stage), powered-by hints, and markers in the homepage HTML (cdn.shopify.com, Shopify.theme, etc.). Currency is read from the storefront's /meta.json. " +
        "Returns: { shopify: boolean, currency?: string, reason?: string }.",
      inputSchema: {
        shopify_url: shopifyUrlSchema,
      },
    },
    async ({ shopify_url }) => {
      const result = await checkIsShopify(shopify_url);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(result) }],
      };
    },
  );
}
