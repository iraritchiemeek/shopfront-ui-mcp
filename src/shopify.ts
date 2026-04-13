import type { ShopifyProduct, ShopifyProductsResponse } from "./types/shopify.js";

const STORE_URL = "https://rocketcoffee.co.nz";

export async function fetchProducts(filters?: {
  product_type?: string;
  tag?: string;
}): Promise<ShopifyProduct[]> {
  const res = await fetch(`${STORE_URL}/products.json`);
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

export function buildCartUrl(items: { variantId: number; quantity: number }[]): string {
  const cartItems = items.map((item) => `${item.variantId}:${item.quantity}`).join(",");
  return `${STORE_URL}/cart/${cartItems}`;
}
