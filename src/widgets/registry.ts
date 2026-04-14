/**
 * UI app registry — single source of truth for widget URIs and metadata.
 */
export const PRODUCT_CARDS_URI = "ui://shopfront-ui/product-cards@v7";

export interface UiApp {
  readonly appKey: string;
  readonly uri: string;
  readonly appDir: string;
  readonly name: string;
  readonly description: string;
}

export const UI_APPS: readonly UiApp[] = [
  {
    appKey: "product-cards",
    uri: PRODUCT_CARDS_URI,
    appDir: "product-cards",
    name: "Shopify Product Cards",
    description: "Shopify product cards rendered inline in chat.",
  },
];
