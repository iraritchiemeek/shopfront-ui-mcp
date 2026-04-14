import type {
  ShopifyCollection,
  ShopifyCollectionsResponse,
  ShopifyPredictiveProduct,
  ShopifyPredictiveSearchResponse,
  ShopifyProduct,
  ShopifyProductsResponse,
} from "./types/shopify.js";

const SHOPIFY_HEADERS = {
  "User-Agent": "Mozilla/5.0 (compatible; ShopfrontUiMCP/1.0)",
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

async function tryFetchShopifyJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: SHOPIFY_HEADERS });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchShopifyEndpoint<T>(storeUrl: string, path: string): Promise<T> {
  const origin = normaliseStoreOrigin(storeUrl);
  return fetchShopifyJson<T>(`${origin}${path}`);
}

export function formatCartItems(items: { variantId: number; quantity: number }[]): string {
  return items.map((i) => `${i.variantId}:${i.quantity}`).join(",");
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

export async function checkIsShopify(
  storeUrl: string,
): Promise<{ shopify: boolean; currency?: string; reason?: string }> {
  const origin = normaliseStoreOrigin(storeUrl);
  let res: Response;
  try {
    res = await fetch(origin, { headers: SHOPIFY_HEADERS, redirect: "follow" });
  } catch (err) {
    return { shopify: false, reason: err instanceof Error ? err.message : String(err) };
  }
  const headers = res.headers;
  const headerMatch =
    headers.get("x-shopid") || headers.get("x-shardid") || headers.get("x-shopify-stage");
  const poweredBy = `${headers.get("powered-by") ?? ""} ${headers.get("x-powered-by") ?? ""}`;
  let isShopify = Boolean(headerMatch) || /shopify/i.test(poweredBy);
  if (!isShopify) {
    try {
      const text = await res.text();
      if (/cdn\.shopify\.com|Shopify\.theme|shopify-features|\/\/shop\.app\//i.test(text)) {
        isShopify = true;
      }
    } catch {
      // ignore body read errors — fall through to not-shopify
    }
  }
  if (!isShopify) {
    return { shopify: false, reason: "No Shopify markers found in response headers or HTML" };
  }
  const currency = (await fetchShopCurrency(storeUrl)) ?? undefined;
  return currency ? { shopify: true, currency } : { shopify: true };
}

export async function fetchProducts(storeUrl: string): Promise<ShopifyProduct[]> {
  const data = await fetchShopifyEndpoint<ShopifyProductsResponse>(storeUrl, "/products.json");
  return data.products;
}

export async function fetchCollections(storeUrl: string): Promise<ShopifyCollection[]> {
  const data = await fetchShopifyEndpoint<ShopifyCollectionsResponse>(
    storeUrl,
    "/collections.json?limit=250",
  );
  return data.collections;
}

export async function fetchCollectionProducts(
  storeUrl: string,
  handle: string,
): Promise<ShopifyProduct[]> {
  const encodedHandle = encodeURIComponent(handle);
  const data = await fetchShopifyEndpoint<ShopifyProductsResponse>(
    storeUrl,
    `/collections/${encodedHandle}/products.json?limit=250`,
  );
  return data.products;
}

/**
 * Shopify's predictive search endpoint. Capped by Shopify at 10 results per
 * resource type. Returns the flattened `products` array (may be empty on miss).
 *
 * Some storefronts reject the `resources[options][unavailable_products]=hide`
 * parameter with HTTP 417 — we retry without it on that specific failure.
 */
export async function searchProducts(
  storeUrl: string,
  query: string,
): Promise<ShopifyPredictiveProduct[]> {
  const origin = normaliseStoreOrigin(storeUrl);
  const base = new URLSearchParams({ q: query, "resources[type]": "product" });
  const withHide = new URLSearchParams(base);
  withHide.set("resources[options][unavailable_products]", "hide");

  const firstRes = await fetch(`${origin}/search/suggest.json?${withHide.toString()}`, {
    headers: SHOPIFY_HEADERS,
  });
  if (firstRes.ok) {
    const data = (await firstRes.json()) as ShopifyPredictiveSearchResponse;
    return data.resources.results.products ?? [];
  }
  if (firstRes.status === 417) {
    const data = await fetchShopifyJson<ShopifyPredictiveSearchResponse>(
      `${origin}/search/suggest.json?${base.toString()}`,
    );
    return data.resources.results.products ?? [];
  }
  throw new Error(`Shopify returned ${firstRes.status}`);
}

/**
 * Fetch shop currency (ISO 4217) from `/meta.json`. Cached per-origin in
 * memory. Falls back to `null` if unavailable — callers should default to USD.
 */
const currencyCache = new Map<string, string | null>();

interface ShopifyMetaJson {
  currency?: string;
  description?: string;
  name?: string;
}

export async function fetchShopCurrency(storeUrl: string): Promise<string | null> {
  const origin = normaliseStoreOrigin(storeUrl);
  if (currencyCache.has(origin)) return currencyCache.get(origin) ?? null;
  const meta = await tryFetchShopifyJson<ShopifyMetaJson>(`${origin}/meta.json`);
  const currency = typeof meta?.currency === "string" ? meta.currency.toUpperCase() : null;
  currencyCache.set(origin, currency);
  return currency;
}

export function buildCartUrl(
  storeUrl: string,
  items: { variantId: number; quantity: number }[],
): string {
  const origin = normaliseStoreOrigin(storeUrl);
  return `${origin}/cart/${formatCartItems(items)}`;
}
