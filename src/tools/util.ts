import { z } from "zod";

export const shopifyUrlSchema = z
  .string()
  .describe("Shopify store URL, e.g. 'https://example.com' or 'example.myshopify.com'");
