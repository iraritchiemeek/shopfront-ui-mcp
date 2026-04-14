import type { ShopifyProduct, ShopifyProductsResponse } from "./types/shopify.js";

export function normaliseStoreOrigin(input: string): string {
  const raw = input.trim();
  if (!raw) throw new Error("Shopify URL is empty");
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    throw new Error(`Invalid Shopify URL: ${input}`);
  }
}

export async function fetchProducts(
  storeUrl: string,
  filters?: {
    product_type?: string;
    tag?: string;
  },
): Promise<ShopifyProduct[]> {
  const origin = normaliseStoreOrigin(storeUrl);
  const res = await fetch(`${origin}/products.json`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RocketCoffeeMCP/1.0)",
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Shopify returned ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as ShopifyProductsResponse;
  let products = data.products;

  if (filters?.product_type) {
    const type = filters.product_type.toLowerCase();
    products = products.filter((p) => p.product_type.toLowerCase() === type);
  }

  if (filters?.tag) {
    const tag = filters.tag.toLowerCase();
    products = products.filter((p) => p.tags.some((t) => t.toLowerCase() === tag));
  }

  return products;
}

export function buildCartUrl(
  storeUrl: string,
  items: { variantId: number; quantity: number }[],
): string {
  const origin = normaliseStoreOrigin(storeUrl);
  const cartItems = items.map((item) => `${item.variantId}:${item.quantity}`).join(",");
  return `${origin}/cart/${cartItems}`;
}
