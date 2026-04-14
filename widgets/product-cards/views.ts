import type {
  Product,
  ProductImage,
  ProductOption,
  SiblingProduct,
  Swatch,
  Variant,
} from "./types.js";

export interface ProductView {
  id: number;
  handle: string;
  title: string;
  images: ProductImage[];
  variants: Variant[];
  options: ProductOption[];
  swatch?: Swatch;
}

export function productViews(
  product: Product,
  opts?: { siblingTitle?: (product: Product, sibling: SiblingProduct) => string },
): ProductView[] {
  const siblingTitle = opts?.siblingTitle ?? ((p, s) => s.title ?? p.title);
  const primary: ProductView = {
    id: product.id,
    handle: product.handle,
    title: product.title,
    images: product.images,
    variants: product.variants,
    options: product.options,
    swatch: product.swatch,
  };
  const siblings: ProductView[] = (product.siblings ?? []).map((s) => ({
    id: s.id,
    handle: s.handle,
    title: siblingTitle(product, s),
    images: s.images,
    variants: s.variants,
    options: s.options,
    swatch: s.swatch,
  }));
  return [primary, ...siblings];
}
