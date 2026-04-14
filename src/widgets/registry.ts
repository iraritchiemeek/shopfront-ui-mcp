/**
 * UI app registry — single source of truth for widget URIs and metadata.
 */
export const PRODUCT_CARDS_URI = "ui://rocket-coffee/product-cards@v7";

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
    name: "Rocket Coffee Product Cards",
    description: "Coffee product cards rendered inline in chat.",
  },
];
