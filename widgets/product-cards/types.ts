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
export type ProductOption = {
  name: string;
  position: number;
  values: string[];
};

export type Swatch = { color: string; label: string };

export type SiblingProduct = {
  id: number;
  handle: string;
  title?: string;
  images: ProductImage[];
  variants: Variant[];
  options: ProductOption[];
  swatch: Swatch;
};

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
  subtext?: string;
  swatch?: Swatch;
  siblings?: SiblingProduct[];
};

export type CardTemplate = "minimal" | "bold" | "editorial";

export type Payload = {
  shopify_url: string;
  products: Product[];
  title?: string;
  template?: CardTemplate;
  currency?: string;
};

export type Selection = { variantId: number; quantity: number };
