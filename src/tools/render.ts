/**
 * MCP Apps render tools — product cards widget.
 *
 * render_products: model-facing tool that passes curated product data to the widget.
 * get_cart_url: widget-callable tool that generates a Shopify cart permalink.
 */
import {
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { buildCartUrl } from "../shopify.js";
import { PRODUCT_CARDS_URI } from "../widgets/registry.js";
import { buildAppStubHtml } from "../widgets/stub.js";

const variantSchema = z.object({
  id: z.number().describe("Shopify variant ID"),
  title: z.string().describe("Variant title, e.g. '250g / Whole Bean'"),
  option1: z.string(),
  option2: z.string().nullable(),
  option3: z.string().nullable(),
  available: z.boolean(),
  price: z.string().describe("Price as string, e.g. '26.00'"),
});

const imageSchema = z.object({
  src: z.string().describe("Image URL from Shopify CDN"),
  width: z.number(),
  height: z.number(),
});

const optionSchema = z.object({
  name: z.string().describe("Option name, e.g. 'WEIGHT' or 'GRIND'"),
  position: z.number(),
  values: z.array(z.string()),
});

const productSchema = z.object({
  id: z.number(),
  title: z.string(),
  handle: z.string(),
  body_html: z.string().describe("HTML description with tasting notes"),
  vendor: z.string(),
  product_type: z.string(),
  tags: z.array(z.string()),
  variants: z.array(variantSchema),
  images: z.array(imageSchema),
  options: z.array(optionSchema),
  flavor_notes: z
    .array(z.string())
    .optional()
    .describe(
      "Tasting / flavor notes parsed from body_html (e.g. ['Rhubarb', 'Cherry', 'Red plum']). " +
        "Extract from phrases like 'flavours of X, Y & Z' in body_html. Title-case each note. " +
        "Omit if none are present.",
    ),
});

export interface RenderToolsContext {
  /** Base URL where Static Assets are served — used to reference widget JS/CSS. */
  getAssetsBaseUrl: () => string;
}

export function registerRenderTools(
  server: McpServer,
  context: RenderToolsContext,
): void {
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
                  resourceDomains: [
                    baseUrl,
                    "https://fonts.googleapis.com",
                    "https://fonts.gstatic.com",
                  ],
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
        "Render coffee products as interactive cards. Pass the curated product data from " +
        "get_products. The widget displays product images, tasting notes, prices, and variant " +
        "selectors. Users can pick quantities and generate a Shopify cart link directly in the " +
        "widget. For each product, parse the flavor notes from body_html (look for phrases like " +
        "'flavours of X, Y & Z') and populate the flavor_notes array with title-cased items — " +
        "the widget displays these in place of the raw description. IMPORTANT: After calling this " +
        "tool, do NOT repeat the product data — the widget displays it visually.",
      inputSchema: {
        products: z.array(productSchema).describe("Array of Shopify products to display"),
        title: z.string().optional().describe("Optional heading above the cards"),
      },
      _meta: {
        ui: { resourceUri: PRODUCT_CARDS_URI },
      },
    },
    async ({ products, title }) => {
      return {
        content: [{ type: "text" as const, text: "Products rendered in widget." }],
        structuredContent: { products, title } as unknown as Record<string, unknown>,
      };
    },
  );

  registerAppTool(
    server,
    "get_cart_url",
    {
      title: "Get Cart URL",
      description:
        "Generate a Shopify cart permalink from selected items. Called by the product-cards " +
        "widget when the user confirms their selection — not intended for direct use by the model.",
      inputSchema: {
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
    async ({ items }) => {
      const cartUrl = buildCartUrl(
        "https://rocketcoffee.co.nz",
        items.map((item) => ({ variantId: item.variant_id, quantity: item.quantity })),
      );
      return {
        content: [{ type: "text" as const, text: cartUrl }],
        structuredContent: { cart_url: cartUrl },
      };
    },
  );
}
