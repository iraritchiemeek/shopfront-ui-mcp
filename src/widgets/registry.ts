/**
 * UI app registry — single source of truth for widget URIs and metadata.
 */
export const PRODUCT_CARDS_URI = "ui://shopfront-ui/product-cards@v7";
export const THREE_SCENE_URI = "ui://shopfront-ui/three-scene@v1";

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
  {
    appKey: "three-scene",
    uri: THREE_SCENE_URI,
    appDir: "three-scene",
    name: "Three.js Scene",
    description: "Arbitrary three.js scenes rendered inline in chat.",
  },
];
