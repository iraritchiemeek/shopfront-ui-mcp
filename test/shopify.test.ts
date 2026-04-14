import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchProducts,
  buildCartUrl,
  fetchCollections,
  fetchCollectionProducts,
  searchProducts,
} from "../src/shopify.js";

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

const ROCKET = "https://rocketcoffee.co.nz";

describe("fetchProducts", () => {
  it("fetches and returns products", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ products: sampleProducts }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const result = await fetchProducts(ROCKET);
    expect(result).toHaveLength(2);
    expect(result[0]!.title).toBe("Ethiopian Yirgacheffe");
    expect(mockFetch).toHaveBeenCalledWith("https://rocketcoffee.co.nz/products.json", {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; ShopfrontUiMCP/1.0)",
        Accept: "application/json",
      },
    });
  });

  it("hits the store URL provided", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ products: [] })),
    );

    await fetchProducts("https://example.myshopify.com");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://example.myshopify.com/products.json",
      expect.anything(),
    );
  });

  it("normalises bare hostnames and paths", async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ products: [] })));
    await fetchProducts("allpress.co.nz");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://allpress.co.nz/products.json",
      expect.anything(),
    );
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response("Not Found", { status: 404 }),
    );

    await expect(fetchProducts(ROCKET)).rejects.toThrow("Shopify returned 404");
  });
});

describe("fetchCollections", () => {
  it("fetches collections from the provided store", async () => {
    const collections = [
      {
        id: 1,
        title: "Bestsellers",
        handle: "bestsellers",
        description: "",
        published_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
        image: null,
        products_count: 10,
      },
    ];
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ collections })),
    );

    const result = await fetchCollections(ROCKET);
    expect(result).toHaveLength(1);
    expect(result[0]!.handle).toBe("bestsellers");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://rocketcoffee.co.nz/collections.json?limit=250",
      expect.anything(),
    );
  });

  it("throws on non-OK response", async () => {
    mockFetch.mockResolvedValueOnce(new Response("boom", { status: 500 }));
    await expect(fetchCollections(ROCKET)).rejects.toThrow("Shopify returned 500");
  });
});

describe("fetchCollectionProducts", () => {
  it("fetches products for a collection handle", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ products: sampleProducts })),
    );

    const result = await fetchCollectionProducts(ROCKET, "coffee");
    expect(result).toHaveLength(2);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://rocketcoffee.co.nz/collections/coffee/products.json?limit=250",
      expect.anything(),
    );
  });

  it("url-encodes handles with unusual characters", async () => {
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ products: [] })));
    await fetchCollectionProducts(ROCKET, "new arrivals");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://rocketcoffee.co.nz/collections/new%20arrivals/products.json?limit=250",
      expect.anything(),
    );
  });
});

describe("searchProducts", () => {
  it("returns the flattened predictive products array", async () => {
    const products = [
      { id: 1, handle: "espresso", title: "ESPRESSO BLEND", tags: [], variants: [] },
    ];
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ resources: { results: { products } } })),
    );

    const result = await searchProducts(ROCKET, "espresso");
    expect(result).toHaveLength(1);
    expect(result[0]!.title).toBe("ESPRESSO BLEND");

    const calledUrl = mockFetch.mock.calls[0]![0] as string;
    expect(calledUrl).toContain("https://rocketcoffee.co.nz/search/suggest.json?");
    expect(calledUrl).toContain("q=espresso");
    expect(calledUrl).toContain("resources%5Btype%5D=product");
    expect(calledUrl).toContain("resources%5Boptions%5D%5Bunavailable_products%5D=hide");
  });

  it("returns an empty array when the store has no matches", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ resources: { results: { products: [] } } })),
    );
    const result = await searchProducts(ROCKET, "nomatches");
    expect(result).toEqual([]);
  });

  it("returns an empty array when the products key is absent", async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ resources: { results: {} } })),
    );
    const result = await searchProducts(ROCKET, "x");
    expect(result).toEqual([]);
  });
});

describe("buildCartUrl", () => {
  it("builds URL for single item", () => {
    const url = buildCartUrl(ROCKET, [{ variantId: 12345, quantity: 1 }]);
    expect(url).toBe("https://rocketcoffee.co.nz/cart/12345:1");
  });

  it("builds URL for multiple items", () => {
    const url = buildCartUrl(ROCKET, [
      { variantId: 100, quantity: 2 },
      { variantId: 200, quantity: 1 },
    ]);
    expect(url).toBe("https://rocketcoffee.co.nz/cart/100:2,200:1");
  });

  it("uses the provided host", () => {
    const url = buildCartUrl("https://example.myshopify.com", [
      { variantId: 1, quantity: 1 },
    ]);
    expect(url).toBe("https://example.myshopify.com/cart/1:1");
  });

  it("handles empty items array", () => {
    const url = buildCartUrl(ROCKET, []);
    expect(url).toBe("https://rocketcoffee.co.nz/cart/");
  });
});
