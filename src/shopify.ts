import type {
  ShopifyCollection,
  ShopifyCollectionsResponse,
  ShopifyPredictiveProduct,
  ShopifyPredictiveSearchResponse,
  ShopifyProduct,
  ShopifyProductsResponse,
} from "./types/shopify.js";

const SHOPIFY_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; RocketCoffeeMCP/1.0)",
  Accept: "application/json",
} as const;

const BLOCKED_HOST_SUFFIXES = [".local", ".internal", ".localhost", ".lan", ".home.arpa"];
const BLOCKED_HOSTS = new Set(["localhost"]);

async function fetchShopifyJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: SHOPIFY_HEADERS });
  if (!res.ok) {
    throw new Error(`Shopify returned ${res.status}`);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new Error("Shopify returned non-JSON response");
  }
}

function isIpLiteral(hostname: string): boolean {
  if (hostname.startsWith("[") && hostname.endsWith("]")) return true;
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

export function normaliseStoreOrigin(input: string): string {
  const raw = input.trim();
  if (!raw) throw new Error("Shopify URL is empty");
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) && !/^https?:\/\//i.test(raw)) {
    throw new Error(`Invalid Shopify URL: ${input} (only https supported)`);
  }
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error(`Invalid Shopify URL: ${input}`);
  }
  if (url.protocol !== "https:") {
    throw new Error(`Invalid Shopify URL: ${input} (only https supported)`);
  }
  const host = url.hostname.toLowerCase();
  if (!host || !host.includes(".")) {
    throw new Error(`Invalid Shopify URL: ${input} (hostname required)`);
  }
  if (isIpLiteral(host)) {
    throw new Error(`Invalid Shopify URL: ${input} (IP literals not allowed)`);
  }
  if (BLOCKED_HOSTS.has(host) || BLOCKED_HOST_SUFFIXES.some((s) => host.endsWith(s))) {
    throw new Error(`Invalid Shopify URL: ${input} (internal hostnames not allowed)`);
  }
  return url.origin;
}

export async function fetchProducts(
  storeUrl: string,
  filters?: {
    product_type?: string;
    tag?: string;
  },
): Promise<ShopifyProduct[]> {
  const origin = normaliseStoreOrigin(storeUrl);
  const data = await fetchShopifyJson<ShopifyProductsResponse>(`${origin}/products.json`);
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

export async function fetchCollections(storeUrl: string): Promise<ShopifyCollection[]> {
  const origin = normaliseStoreOrigin(storeUrl);
  const data = await fetchShopifyJson<ShopifyCollectionsResponse>(
    `${origin}/collections.json?limit=250`,
  );
  return data.collections;
}

export async function fetchCollectionProducts(
  storeUrl: string,
  handle: string,
): Promise<ShopifyProduct[]> {
  const origin = normaliseStoreOrigin(storeUrl);
  const encodedHandle = encodeURIComponent(handle);
  const data = await fetchShopifyJson<ShopifyProductsResponse>(
    `${origin}/collections/${encodedHandle}/products.json?limit=250`,
  );
  return data.products;
}

/**
 * Shopify's predictive search endpoint. Capped by Shopify at 10 results per
 * resource type. Returns the flattened `products` array (may be empty on miss).
 */
export async function searchProducts(
  storeUrl: string,
  query: string,
): Promise<ShopifyPredictiveProduct[]> {
  const origin = normaliseStoreOrigin(storeUrl);
  const params = new URLSearchParams({
    q: query,
    "resources[type]": "product",
    "resources[options][unavailable_products]": "hide",
  });
  const data = await fetchShopifyJson<ShopifyPredictiveSearchResponse>(
    `${origin}/search/suggest.json?${params.toString()}`,
  );
  return data.resources.results.products ?? [];
}

export function buildCartUrl(
  storeUrl: string,
  items: { variantId: number; quantity: number }[],
): string {
  const origin = normaliseStoreOrigin(storeUrl);
  const cartItems = items.map((item) => `${item.variantId}:${item.quantity}`).join(",");
  return `${origin}/cart/${cartItems}`;
}
