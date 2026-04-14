import type { BrandTokens } from "../lib/brand.js";

export type Variant = {
  id: number;
  title: string;
  option1: string;
  option2: string | null;
  option3: string | null;
  available: boolean;
  price: string;
};

export type ProductImage = { src: string; width: number; height: number };
export type ProductOption = { name: string; position: number; values: string[] };

export type Product = {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: Variant[];
  images: ProductImage[];
  options: ProductOption[];
  flavor_notes?: string[];
};

export type CardTemplate = "minimal" | "bold" | "editorial";

export type Payload = {
  products: Product[];
  title?: string;
  tokens?: BrandTokens;
  template?: CardTemplate;
};

export type Selection = { variantId: number; quantity: number };
