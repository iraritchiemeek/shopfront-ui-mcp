/**
 * MCP Apps render tools — product cards widget.
 *
 * render_products: model-facing tool that passes curated product data to the widget.
 * get_cart_url: widget-callable tool that generates a Shopify cart permalink.
 */
import { registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { buildCartUrl } from "../shopify.js";
import { PRODUCT_CARDS_URI } from "../widgets/registry.js";
import { buildAppStubHtml } from "../widgets/stub.js";

const variantSchema = z.object({
  id: z.number().describe("Shopify variant ID"),
  title: z.string().describe("Variant title, e.g. 'Large / Red'"),
  option1: z.string(),
  option2: z.string().nullable(),
  option3: z.string().nullable(),
  available: z.boolean(),
  price: z.string().describe("Price as string, e.g. '19.99'"),
});

const imageSchema = z.object({
  src: z.string().describe("Image URL from Shopify CDN"),
  width: z.number(),
  height: z.number(),
});

const optionSchema = z.object({
  name: z.string().describe("Option name, e.g. 'Size' or 'Color'"),
  position: z.number(),
  values: z.array(z.string()),
});

const productSchema = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  body_html: z.string().describe("Product description. Plain text or HTML. May be truncated."),
  vendor: z.string(),
  product_type: z.string(),
  tags: z.array(z.string()),
  variants: z.array(variantSchema),
  images: z.array(imageSchema),
  options: z.array(optionSchema),
});

export interface RenderToolsContext {
  /** Base URL where Static Assets are served — used to reference widget JS/CSS. */
  getAssetsBaseUrl: () => string;
}

export function registerRenderTools(server: McpServer, context: RenderToolsContext): void {
  server.registerResource(
    "product-cards",
    PRODUCT_CARDS_URI,
    {
      mimeType: RESOURCE_MIME_TYPE,
      description: "Coffee product cards rendered inline in chat.",
    },
    async (uri) => {
      const baseUrl = context.getAssetsBaseUrl();
      const html = buildAppStubHtml("product-cards", baseUrl);
      return {
        contents: [
          {
            uri: uri.toString(),
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: {
              ui: {
                csp: {
                  connectDomains: ["https://cdn.shopify.com"],
                  resourceDomains: [baseUrl],
                },
              },
            },
          },
        ],
      };
    },
  );

  registerAppTool(
    server,
    "render_products",
    {
      description:
        "Render products from a Shopify storefront as interactive cards. Pass curated products (trimmed — see the `code` tool's trim helper). The widget displays images, descriptions, prices, and variant selectors, and lets the user generate a cart link. " +
        "Always pass shopify_url so the cart link resolves to the same store. " +
        "IMPORTANT: After calling this tool, do NOT repeat the product data — the widget displays it visually.",
      inputSchema: {
        shopify_url: z.string().describe("Shopify store URL the products belong to"),
        products: z.array(productSchema).describe("Array of Shopify products to display"),
        title: z.string().optional().describe("Optional heading above the cards"),
        template: z
          .enum(["minimal", "bold", "editorial"])
          .optional()
          .describe("Card template variant. Defaults to 'minimal'."),
      },
      _meta: {
        ui: { resourceUri: PRODUCT_CARDS_URI },
      },
    },
    async ({ shopify_url, products, title, template }) => {
      return {
        content: [{ type: "text" as const, text: "Products rendered in widget." }],
        structuredContent: {
          shopify_url,
          products,
          title,
          template: template ?? "minimal",
        } as unknown as Record<string, unknown>,
      };
    },
  );

  registerAppTool(
    server,
    "get_cart_url",
    {
      title: "Get Cart URL",
      description:
        "Generate a Shopify cart permalink from selected items for a given storefront. Called " +
        "by the product-cards widget when the user confirms their selection — not intended for " +
        "direct use by the model.",
      inputSchema: {
        shopify_url: z.string().describe("Shopify store URL the items belong to"),
        items: z
          .array(
            z.object({
              variant_id: z.number().describe("Shopify variant ID"),
              quantity: z.number().int().min(1).describe("Quantity to add"),
            }),
          )
          .describe("Items to add to the Shopify cart"),
      },
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ shopify_url, items }) => {
      const cartUrl = buildCartUrl(
        shopify_url,
        items.map((item) => ({ variantId: item.variant_id, quantity: item.quantity })),
      );
      return {
        content: [{ type: "text" as const, text: cartUrl }],
        structuredContent: { cart_url: cartUrl },
      };
    },
  );
}
