import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchProducts, buildCartUrl } from "../src/shopify.js";

const mockFetch = vi.fn<typeof fetch>();

beforeEach(() => {
  mockFetch.mockReset();
  globalThis.fetch = mockFetch;
});

afterEach(() => {
  vi.restoreAllMocks();
});

const sampleProducts = [
  {
    id: 1,
    title: "Ethiopian Yirgacheffe",
    handle: "ethiopian-yirgacheffe",
    body_html: "<p>Blueberry, jasmine, citrus</p>",
    published_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    vendor: "Rocket Coffee",
    product_type: "COFFEE",
    tags: ["FILTER", "ETHIOPIA", "SINGLE ORIGIN"],
    variants: [
      {
        id: 100,
        title: "250g / Whole Bean",
        option1: "250g",
        option2: "Whole Bean",
        option3: null,
        sku: "ETH-250-WB",
        requires_shipping: true,
        taxable: true,
        featured_image: null,
        available: true,
        price: "26.00",
        grams: 250,
        compare_at_price: null,
        position: 1,
        product_id: 1,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ],
    images: [{ id: 10, created_at: "", position: 1, updated_at: "", product_id: 1, variant_ids: [], src: "https://cdn.shopify.com/img.jpg", width: 800, height: 800 }],
    options: [{ name: "WEIGHT", position: 1, values: ["250g"] }],
  },
  {
    id: 2,
    title: "Grinder Pro",
    handle: "grinder-pro",
    body_html: "<p>Professional coffee grinder</p>",
    published_at: "2026-01-01T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    vendor: "Rocket Coffee",
    product_type: "EQUIPMENT",
    tags: ["GRINDER"],
    variants: [
      {
        id: 200,
        title: "Default",
        option1: "Default",
        option2: null,
        option3: null,
        sku: "GRD-001",
        requires_shipping: true,
        taxable: true,
        featured_image: null,
        available: true,
        price: "450.00",
        grams: 2000,
        compare_at_price: null,
        position: 1,
        product_id: 2,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ],
    images: [],
    options: [{ name: "Title", position: 1, values: ["Default"] }],
  },
];

describe("fetchProducts", () => {
  it("fetches and returns products", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ products: sampleProducts }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await fetchProducts();
    expect(result).toHaveLength(2);
    expect(result[0]!.title).toBe("Ethiopian Yirgacheffe");
    expect(mockFetch).toHaveBeenCalledWith("https://rocketcoffee.co.nz/products.json", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RocketCoffeeMCP/1.0)",
        Accept: "application/json",
      },
    });
  });

  it("filters by product_type", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ products: sampleProducts })),
    );

    const result = await fetchProducts({ product_type: "COFFEE" });
    expect(result).toHaveLength(1);
    expect(result[0]!.title).toBe("Ethiopian Yirgacheffe");
  });

  it("filters by tag", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ products: sampleProducts })),
    );

    const result = await fetchProducts({ tag: "FILTER" });
    expect(result).toHaveLength(1);
    expect(result[0]!.title).toBe("Ethiopian Yirgacheffe");
  });

  it("filters are case-insensitive", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ products: sampleProducts })),
    );

    const result = await fetchProducts({ product_type: "coffee" });
    expect(result).toHaveLength(1);
  });

  it("returns empty array when no products match filter", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ products: sampleProducts })),
    );

    const result = await fetchProducts({ tag: "DECAF" });
    expect(result).toHaveLength(0);
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("Not Found", { status: 404 }),
    );

    await expect(fetchProducts()).rejects.toThrow("Shopify returned 404");
  });
});

describe("buildCartUrl", () => {
  it("builds URL for single item", () => {
    const url = buildCartUrl([{ variantId: 12345, quantity: 1 }]);
    expect(url).toBe("https://rocketcoffee.co.nz/cart/12345:1");
  });

  it("builds URL for multiple items", () => {
    const url = buildCartUrl([
      { variantId: 100, quantity: 2 },
      { variantId: 200, quantity: 1 },
    ]);
    expect(url).toBe("https://rocketcoffee.co.nz/cart/100:2,200:1");
  });

  it("handles empty items array", () => {
    const url = buildCartUrl([]);
    expect(url).toBe("https://rocketcoffee.co.nz/cart/");
  });
});
