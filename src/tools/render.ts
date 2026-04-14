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
import { shopifyUrlSchema } from "./util.js";

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
  name: z.string().describe("Option name, e.g. 'Size' or 'Weight'"),
  position: z.number(),
  values: z.array(z.string()),
});

const swatchSchema = z.object({
  color: z.string().describe("CSS color for the swatch circle (hex, named, or CSS color string)."),
  label: z.string().describe("Human-readable label, e.g. 'Walnut'."),
});

const siblingProductSchema = z.object({
  id: z.number(),
  handle: z.string(),
  title: z
    .string()
    .optional()
    .describe("Optional override title if the sibling's title differs from the primary product."),
  images: z.array(imageSchema),
  variants: z.array(variantSchema).min(1),
  options: z.array(optionSchema),
  swatch: swatchSchema,
});

const productSchema = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  vendor: z.string(),
  product_type: z.string(),
  tags: z.array(z.string()),
  variants: z.array(variantSchema).min(1, "product must have at least one variant"),
  images: z.array(imageSchema),
  options: z.array(optionSchema),
  subtext: z
    .string()
    .describe(
      "1–2 sentence product description shown below the title. Distil this from the product's body_html — strip HTML, pull out the most useful facts (materials, origin, dimensions, flavour notes, key features) and rewrite as a short, natural-language blurb. Always provide — do not leave blank or pass raw HTML. Aim for ~120 chars; hard cap ~240.",
    ),
  swatch: swatchSchema
    .optional()
    .describe("Swatch metadata for this product when it belongs to a sibling group."),
  siblings: z
    .array(siblingProductSchema)
    .optional()
    .describe(
      "Sibling products that represent alternative finishes/colours of this item, each sold as its own Shopify product (e.g. 'Osaka Coffee Table - Walnut' and 'Osaka Coffee Table - Natural'). When provided, the widget shows a swatch selector above the image and swapping swatches swaps the active card (images, variants, price, cart target). Always set `swatch` on the primary product when supplying siblings.",
    ),
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
                sandbox: {
                  permissions: {
                    clipboardWrite: {},
                  },
                },
                openLinks: {},
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
        "IMPORTANT: Render at most 3 products per call. If you have more candidates, pick the top 3 most relevant to the user's request. " +
        "IMPORTANT: After calling this tool, do NOT repeat the product data — the widget displays it visually.",
      inputSchema: {
        shopify_url: shopifyUrlSchema.describe("Shopify store URL the products belong to"),
        products: z.array(productSchema).describe("Array of Shopify products to display"),
        title: z.string().optional().describe("Optional heading above the cards"),
        template: z
          .enum(["minimal", "bold", "editorial"])
          .optional()
          .describe("Card template variant. Defaults to 'minimal'."),
        currency: z
          .string()
          .length(3)
          .describe(
            "ISO 4217 currency code (e.g. 'USD', 'JPY', 'NZD'). Get this from the `currency` field of your earlier `is_shopify` call.",
          ),
      },
      _meta: {
        ui: { resourceUri: PRODUCT_CARDS_URI },
      },
    },
    async ({ shopify_url, products, title, template, currency }) => {
      return {
        content: [{ type: "text" as const, text: "Products rendered in widget." }],
        structuredContent: {
          shopify_url,
          products,
          title,
          template: template ?? "minimal",
          currency: currency.toUpperCase(),
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
        shopify_url: shopifyUrlSchema.describe("Shopify store URL the items belong to"),
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
