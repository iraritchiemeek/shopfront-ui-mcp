/**
 * Product cards widget — browse coffee, pick quantities, generate a cart link.
 */
import { App, PostMessageTransport } from "@modelcontextprotocol/ext-apps";
import { el, applyTheme, renderStatus } from "../lib/helpers.js";

// ── Types ────────────────────────────────────────────────────────────

type Variant = {
  id: number;
  title: string;
  option1: string;
  option2: string | null;
  option3: string | null;
  available: boolean;
  price: string;
};

type Image = { src: string; width: number; height: number };
type Option = { name: string; position: number; values: string[] };

type Product = {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  variants: Variant[];
  images: Image[];
  options: Option[];
};

type Payload = { products: Product[]; title?: string };

// ── State ────────────────────────────────────────────────────────────

/** Per-product selection state: chosen variant ID and quantity. */
const selections = new Map<number, { variantId: number; quantity: number }>();

// ── Helpers ──────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent ?? "";
}

function formatPrice(amount: string): string {
  const n = parseFloat(amount);
  if (Number.isNaN(n)) return `$${amount}`;
  return `$${n.toFixed(2)}`;
}

function findVariant(product: Product, optionValues: string[]): Variant | undefined {
  return product.variants.find((v) => {
    if (v.option1 !== optionValues[0]) return false;
    if (optionValues[1] !== undefined && v.option2 !== optionValues[1]) return false;
    if (optionValues[2] !== undefined && v.option3 !== optionValues[2]) return false;
    return true;
  });
}

function getSelectedVariant(product: Product): Variant {
  const sel = selections.get(product.id);
  if (sel) {
    const v = product.variants.find((v) => v.id === sel.variantId);
    if (v) return v;
  }
  return product.variants[0]!;
}

// ── Bottom bar ──────────────────────────────────────────────────────

function updateBottomBar(): void {
  const bar = document.getElementById("bottom-bar");
  const summary = document.getElementById("cart-summary");
  const btn = document.getElementById("cart-btn") as HTMLButtonElement | null;
  if (!bar || !summary || !btn) return;

  let totalItems = 0;
  let totalPrice = 0;

  for (const sel of selections.values()) {
    if (sel.quantity > 0) {
      totalItems += sel.quantity;
      // Price is looked up from the DOM data attributes
    }
  }

  // Recalculate from product data
  const products = (window as unknown as { __products?: Product[] }).__products;
  if (products) {
    totalPrice = 0;
    totalItems = 0;
    for (const p of products) {
      const sel = selections.get(p.id);
      if (sel && sel.quantity > 0) {
        const variant = p.variants.find((v) => v.id === sel.variantId);
        if (variant) {
          totalPrice += parseFloat(variant.price) * sel.quantity;
          totalItems += sel.quantity;
        }
      }
    }
  }

  if (totalItems === 0) {
    bar.className = "hidden";
  } else {
    bar.className = [
      "sticky bottom-0 mt-6 flex items-center justify-between",
      "rounded-xl bg-white dark:bg-slate-800 shadow-lg dark:shadow-none",
      "border border-slate-200 dark:border-slate-700",
      "px-5 py-4",
    ].join(" ");
    summary.textContent = `${totalItems} item${totalItems === 1 ? "" : "s"} · $${totalPrice.toFixed(2)} NZD`;
    btn.disabled = false;
  }
}

// ── Quantity controls ───────────────────────────────────────────────

function setQuantity(product: Product, qty: number): void {
  const variant = getSelectedVariant(product);
  if (qty <= 0) {
    selections.delete(product.id);
  } else {
    selections.set(product.id, { variantId: variant.id, quantity: qty });
  }

  const qtyEl = document.getElementById(`qty-${product.id}`);
  if (qtyEl) qtyEl.textContent = String(Math.max(0, qty));

  const minusBtn = document.getElementById(`minus-${product.id}`) as HTMLButtonElement | null;
  if (minusBtn) {
    minusBtn.disabled = qty <= 0;
    minusBtn.className = minusBtn.className.replace(
      /opacity-\d+/,
      qty <= 0 ? "opacity-30" : "opacity-100",
    );
  }

  updateBottomBar();
}

// ── Card rendering ──────────────────────────────────────────────────

function renderCard(product: Product): HTMLElement {
  const wrapper = el(
    "div",
    [
      "overflow-hidden rounded-xl",
      "bg-white dark:bg-slate-800/60",
      "shadow-sm dark:shadow-none",
      "border border-slate-100 dark:border-slate-700/50",
    ].join(" "),
  );

  const inner = el("div", "flex gap-5 p-5");

  // Image
  const img = product.images[0];
  if (img) {
    const imgEl = document.createElement("img");
    imgEl.src = img.src;
    imgEl.alt = product.title;
    imgEl.className = "h-28 w-28 rounded-lg object-cover flex-shrink-0";
    imgEl.loading = "lazy";
    inner.appendChild(imgEl);
  }

  // Info
  const info = el("div", "flex-1 min-w-0");

  // Title
  info.appendChild(
    el("h3", "text-sm font-semibold text-slate-900 dark:text-slate-100 leading-tight", product.title),
  );

  // Tasting notes from body_html (first sentence or so)
  const description = stripHtml(product.body_html).trim();
  if (description) {
    const short = description.length > 120 ? description.slice(0, 120) + "…" : description;
    info.appendChild(
      el("p", "mt-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed", short),
    );
  }

  // Tags (filter, espresso, origin)
  const relevantTags = product.tags
    .filter((t) => !t.startsWith("__"))
    .slice(0, 4);
  if (relevantTags.length > 0) {
    const tagRow = el("div", "mt-2 flex flex-wrap gap-1.5");
    for (const tag of relevantTags) {
      tagRow.appendChild(
        el(
          "span",
          "inline-block rounded-full bg-slate-100 dark:bg-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide",
          tag,
        ),
      );
    }
    info.appendChild(tagRow);
  }

  // Variant selector + price + quantity row
  const controls = el("div", "mt-3 flex items-center gap-3 flex-wrap");

  // Variant selector(s) — only if more than one variant
  if (product.variants.length > 1) {
    for (const opt of product.options) {
      const select = document.createElement("select");
      select.className = [
        "rounded-lg border border-slate-200 dark:border-slate-600",
        "bg-white dark:bg-slate-700",
        "px-2 py-1 text-xs text-slate-700 dark:text-slate-300",
        "focus:outline-none focus:ring-2 focus:ring-amber-500/50",
      ].join(" ");
      for (const val of opt.values) {
        const option = document.createElement("option");
        option.value = val;
        option.textContent = val;
        select.appendChild(option);
      }
      select.addEventListener("change", () => {
        // Resolve variant from current option selections
        const selects = wrapper.querySelectorAll("select");
        const values: string[] = [];
        selects.forEach((s) => values.push((s as HTMLSelectElement).value));
        const variant = findVariant(product, values);
        if (variant) {
          const currentQty = selections.get(product.id)?.quantity ?? 0;
          if (currentQty > 0) {
            selections.set(product.id, { variantId: variant.id, quantity: currentQty });
          }
          // Update price display
          const priceEl = document.getElementById(`price-${product.id}`);
          if (priceEl) priceEl.textContent = formatPrice(variant.price);
          updateBottomBar();
        }
      });
      controls.appendChild(select);
    }
  }

  // Price
  const firstVariant = product.variants[0]!;
  const priceEl = el(
    "span",
    "text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums",
    formatPrice(firstVariant.price),
  );
  priceEl.id = `price-${product.id}`;
  controls.appendChild(priceEl);

  // Spacer
  controls.appendChild(el("div", "flex-1"));

  // Quantity controls
  const qtyGroup = el("div", "flex items-center gap-2");

  const minusBtn = document.createElement("button");
  minusBtn.id = `minus-${product.id}`;
  minusBtn.className = [
    "h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer",
    "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    "hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors",
    "opacity-30",
  ].join(" ");
  minusBtn.textContent = "−";
  minusBtn.disabled = true;
  minusBtn.addEventListener("click", () => {
    const current = selections.get(product.id)?.quantity ?? 0;
    setQuantity(product, current - 1);
  });

  const qtyDisplay = el(
    "span",
    "w-6 text-center text-sm font-semibold text-slate-800 dark:text-slate-200 tabular-nums",
    "0",
  );
  qtyDisplay.id = `qty-${product.id}`;

  const plusBtn = document.createElement("button");
  plusBtn.className = [
    "h-7 w-7 rounded-lg flex items-center justify-center cursor-pointer",
    "bg-amber-500 text-white",
    "hover:bg-amber-600 dark:hover:bg-amber-400 transition-colors",
  ].join(" ");
  plusBtn.textContent = "+";
  plusBtn.addEventListener("click", () => {
    const current = selections.get(product.id)?.quantity ?? 0;
    setQuantity(product, current + 1);
  });

  qtyGroup.append(minusBtn, qtyDisplay, plusBtn);
  controls.appendChild(qtyGroup);

  info.appendChild(controls);
  inner.appendChild(info);
  wrapper.appendChild(inner);

  return wrapper;
}

// ── Main render ─────────────────────────────────────────────────────

function render(payload: Payload): void {
  const root = document.getElementById("root");
  if (!root) return;
  root.className = "max-w-2xl pr-6 py-6 font-sans antialiased";
  root.textContent = "";

  // Store products for price calculations
  (window as unknown as { __products: Product[] }).__products = payload.products;

  if (payload.title) {
    root.appendChild(
      el(
        "h2",
        "mb-4 text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500",
        payload.title,
      ),
    );
  }

  if (payload.products.length === 0) {
    renderStatus("No products to display.");
    return;
  }

  const list = el("div", "flex flex-col gap-4");
  for (const product of payload.products) {
    // Initialize selection with first variant
    list.appendChild(renderCard(product));
  }
  root.appendChild(list);

  // Bottom bar
  const bar = el("div", "hidden");
  bar.id = "bottom-bar";

  const summary = el(
    "span",
    "text-sm font-medium text-slate-700 dark:text-slate-300",
    "",
  );
  summary.id = "cart-summary";

  const btn = document.createElement("button");
  btn.id = "cart-btn";
  btn.className = [
    "px-5 py-2 text-sm font-semibold rounded-lg cursor-pointer",
    "bg-amber-500 text-white hover:bg-amber-600",
    "dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300",
    "transition-colors",
  ].join(" ");
  btn.textContent = "Generate Cart Link";
  btn.addEventListener("click", () => void generateCartLink());

  bar.append(summary, btn);
  root.appendChild(bar);
}

// ── Cart link generation ────────────────────────────────────────────

async function generateCartLink(): Promise<void> {
  const items: { variant_id: number; quantity: number }[] = [];
  for (const [, sel] of selections) {
    if (sel.quantity > 0) {
      items.push({ variant_id: sel.variantId, quantity: sel.quantity });
    }
  }

  if (items.length === 0) return;

  const btn = document.getElementById("cart-btn") as HTMLButtonElement | null;
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Generating…";
  }

  try {
    const result = (await app.callServerTool({
      name: "get_cart_url",
      arguments: { items },
    })) as { structuredContent?: { cart_url?: string } };

    const cartUrl = result?.structuredContent?.cart_url;
    if (!cartUrl) {
      renderStatus("Failed to generate cart URL.", "error");
      return;
    }

    showCartLink(cartUrl);
  } catch (err) {
    renderStatus(`Failed to generate cart link: ${(err as Error).message}`, "error");
  }
}

function showCartLink(url: string): void {
  const root = document.getElementById("root");
  if (!root) return;
  root.className = "max-w-2xl pr-6 py-6 font-sans antialiased";
  root.textContent = "";

  const container = el(
    "div",
    [
      "rounded-xl bg-emerald-50 dark:bg-emerald-900/20",
      "border border-emerald-200 dark:border-emerald-800",
      "p-6 text-center",
    ].join(" "),
  );

  container.appendChild(
    el(
      "div",
      "text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-2",
      "Cart ready!",
    ),
  );

  container.appendChild(
    el(
      "p",
      "text-sm text-emerald-600 dark:text-emerald-400 mb-4",
      "Click below to open Rocket Coffee with your items pre-loaded.",
    ),
  );

  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.className = [
    "inline-block px-6 py-3 rounded-lg text-sm font-semibold",
    "bg-amber-500 text-white hover:bg-amber-600",
    "dark:bg-amber-400 dark:text-slate-900 dark:hover:bg-amber-300",
    "transition-colors no-underline",
  ].join(" ");
  link.textContent = "Open Checkout →";
  container.appendChild(link);

  // Copy button
  const copyBtn = document.createElement("button");
  copyBtn.className = [
    "block mx-auto mt-3 px-4 py-1.5 text-xs font-medium rounded-lg cursor-pointer",
    "text-emerald-600 dark:text-emerald-400",
    "hover:bg-emerald-100 dark:hover:bg-emerald-900/40",
    "transition-colors",
  ].join(" ");
  copyBtn.textContent = "Copy link";
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(url).then(() => {
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy link";
      }, 1500);
    });
  });
  container.appendChild(copyBtn);

  root.appendChild(container);
}

// ── Bootstrap ────────────────────────────────────────────────────────

renderStatus("Loading products…");

const app = new App(
  { name: "rocket-coffee-product-cards", version: "1.0.0" },
  {},
  { autoResize: true },
);

app.ontoolinput = (params) => {
  const data = params as Record<string, unknown>;
  const args = data.arguments as Record<string, unknown> | undefined;
  if (!args) return;

  const products = args.products as Product[] | undefined;
  if (!products) {
    renderStatus("No product data received.", "error");
    return;
  }

  const title = typeof args.title === "string" ? args.title : undefined;
  render({ products, title });
};

app.onhostcontextchanged = (params) => {
  const ctx = params as Record<string, unknown>;
  const theme = ctx.theme;
  if (typeof theme === "string") applyTheme(theme);
};

app.connect(new PostMessageTransport(window.parent, window.parent)).then(() => {
  const theme = app.getHostContext()?.theme;
  if (typeof theme === "string") applyTheme(theme);
});

// Timeout diagnostic
setTimeout(() => {
  const root = document.getElementById("root");
  if (root?.textContent?.includes("Loading products")) {
    renderStatus("Widget connected but no tool data was delivered.", "error");
  }
}, 5000);
