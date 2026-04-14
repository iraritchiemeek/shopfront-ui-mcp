import { formatCartItems } from "../../src/shopify.js";

export function storeOrigin(storeUrl: string): string {
  try {
    return new URL(storeUrl).origin;
  } catch {
    return storeUrl.replace(/\/$/, "");
  }
}

export function buildProductUrl(storeUrl: string, handle: string): string {
  return `${storeOrigin(storeUrl)}/products/${handle}`;
}

export function buildCartUrl(
  storeUrl: string,
  items: { variantId: number; quantity: number }[],
): string {
  return `${storeOrigin(storeUrl)}/cart/${formatCartItems(items)}`;
}
