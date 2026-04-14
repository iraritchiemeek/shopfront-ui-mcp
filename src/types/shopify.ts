export interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  options: ShopifyOption[];
}

export interface ShopifyVariant {
  id: number;
  title: string;
  option1: string;
  option2: string | null;
  option3: string | null;
  sku: string;
  requires_shipping: boolean;
  taxable: boolean;
  featured_image: ShopifyFeaturedImage | null;
  available: boolean;
  price: string;
  grams: number;
  compare_at_price: string | null;
  position: number;
  product_id: number;
  created_at: string;
  updated_at: string;
}

export interface ShopifyFeaturedImage {
  id: number;
  product_id: number;
  position: number;
  created_at: string;
  updated_at: string;
  alt: string | null;
  width: number;
  height: number;
  src: string;
  variant_ids: number[];
}

export interface ShopifyImage {
  id: number;
  created_at: string;
  position: number;
  updated_at: string;
  product_id: number;
  variant_ids: number[];
  src: string;
  width: number;
  height: number;
}

export interface ShopifyOption {
  name: string;
  position: number;
  values: string[];
}

export interface ShopifyProductsResponse {
  products: ShopifyProduct[];
}

export interface ShopifyCollectionImage {
  src: string;
  alt: string | null;
  width: number;
  height: number;
  created_at: string;
}

export interface ShopifyCollection {
  id: number;
  handle: string;
  title: string;
  description: string;
  published_at: string;
  updated_at: string;
  image: ShopifyCollectionImage | null;
  products_count: number;
}

export interface ShopifyCollectionsResponse {
  collections: ShopifyCollection[];
}

/**
 * Product shape returned by `/search/suggest.json`. Leaner than `/products.json`:
 * no `options`, no per-variant `sku` / `grams` / timestamps, and URLs are store-relative.
 */
export interface ShopifyPredictiveProduct {
  id: number;
  handle: string;
  title: string;
  body: string;
  vendor: string;
  type: string;
  tags: string[];
  url: string;
  image: string | null;
  price: string;
  price_min: string;
  price_max: string;
  compare_at_price_min: string;
  compare_at_price_max: string;
  available: boolean;
  featured_image: {
    url: string | null;
    alt: string | null;
    width: number | null;
    height: number | null;
    aspect_ratio: number | null;
  };
  variants: Array<{
    id: number;
    title: string;
    url: string;
    price: string;
    compare_at_price: string | null;
    available: boolean;
    image: string | null;
    featured_image: {
      url: string | null;
      alt: string | null;
      width: number | null;
      height: number | null;
      aspect_ratio: number | null;
    };
  }>;
}

export interface ShopifyPredictiveSearchResponse {
  resources: {
    results: {
      products?: ShopifyPredictiveProduct[];
      collections?: unknown[];
      pages?: unknown[];
      articles?: unknown[];
      queries?: unknown[];
    };
  };
}
