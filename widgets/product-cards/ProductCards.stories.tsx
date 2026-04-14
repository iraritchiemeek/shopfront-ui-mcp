import type { Meta, StoryObj } from "@storybook/react";
import { McpThemeDecorator } from "../../.storybook/decorator.js";
import { ProductCardsView } from "./components/ProductCardsView.js";
import { CartLink } from "./components/CartLink.js";
import type { Payload, Product } from "./types.js";

const meta: Meta = {
  title: "MCP Apps/Product Cards",
  decorators: [McpThemeDecorator],
};
export default meta;

type Story = StoryObj<{}>;

// ── Mock data ───────────────────────────────────────────────────────

const ethiopia: Product = {
  id: 1,
  title: "Ethiopia Guji",
  handle: "ethiopia-guji",
  body_html:
    "<p>Natural processed. Flavours of rhubarb, cherry & red plum.</p><p>Roasted on 2026-04-10.</p>",
  vendor: "Rocket Coffee",
  product_type: "COFFEE",
  tags: ["FILTER", "ETHIOPIA", "SINGLE ORIGIN"],
  flavor_notes: ["Rhubarb", "Cherry", "Red plum"],
  images: [
    {
      src: "https://cdn.shopify.com/s/files/1/0000/0000/products/ethiopia.jpg",
      width: 800,
      height: 800,
    },
  ],
  options: [
    { name: "WEIGHT", position: 1, values: ["250g", "1kg"] },
    { name: "GRIND", position: 2, values: ["Whole Bean", "Espresso", "Filter"] },
  ],
  variants: [
    {
      id: 101,
      title: "250g / Whole Bean",
      option1: "250g",
      option2: "Whole Bean",
      option3: null,
      available: true,
      price: "26.00",
    },
    {
      id: 102,
      title: "250g / Espresso",
      option1: "250g",
      option2: "Espresso",
      option3: null,
      available: true,
      price: "26.00",
    },
    {
      id: 103,
      title: "250g / Filter",
      option1: "250g",
      option2: "Filter",
      option3: null,
      available: true,
      price: "26.00",
    },
    {
      id: 104,
      title: "1kg / Whole Bean",
      option1: "1kg",
      option2: "Whole Bean",
      option3: null,
      available: true,
      price: "90.00",
    },
    {
      id: 105,
      title: "1kg / Espresso",
      option1: "1kg",
      option2: "Espresso",
      option3: null,
      available: true,
      price: "90.00",
    },
    {
      id: 106,
      title: "1kg / Filter",
      option1: "1kg",
      option2: "Filter",
      option3: null,
      available: true,
      price: "90.00",
    },
  ],
};

const colombia: Product = {
  id: 2,
  title: "Colombia Finca El Paraíso",
  handle: "colombia-el-paraiso",
  body_html: "<p>Thermal shock process. Flavours of passionfruit, mango & lychee.</p>",
  vendor: "Rocket Coffee",
  product_type: "COFFEE",
  tags: ["FILTER", "COLOMBIA", "SINGLE ORIGIN"],
  flavor_notes: ["Passionfruit", "Mango", "Lychee"],
  images: [
    {
      src: "https://cdn.shopify.com/s/files/1/0000/0000/products/colombia.jpg",
      width: 800,
      height: 800,
    },
  ],
  options: [{ name: "WEIGHT", position: 1, values: ["150g"] }],
  variants: [
    {
      id: 201,
      title: "150g",
      option1: "150g",
      option2: null,
      option3: null,
      available: true,
      price: "42.00",
    },
  ],
};

const espressoBlend: Product = {
  id: 3,
  title: "Rocket Espresso Blend",
  handle: "rocket-espresso",
  body_html: "<p>Chocolate, caramel, hazelnut.</p>",
  vendor: "Rocket Coffee",
  product_type: "COFFEE",
  tags: ["ESPRESSO", "BLEND"],
  images: [
    {
      src: "https://cdn.shopify.com/s/files/1/0000/0000/products/rocket.jpg",
      width: 800,
      height: 800,
    },
  ],
  options: [{ name: "WEIGHT", position: 1, values: ["250g", "1kg"] }],
  variants: [
    {
      id: 301,
      title: "250g",
      option1: "250g",
      option2: null,
      option3: null,
      available: true,
      price: "22.00",
    },
    {
      id: 302,
      title: "1kg",
      option1: "1kg",
      option2: null,
      option3: null,
      available: true,
      price: "78.00",
    },
  ],
};

const ROCKET_URL = "https://rocketcoffee.co.nz";

const basePayload: Payload = {
  shopify_url: ROCKET_URL,
  title: "Filter coffees",
  products: [ethiopia, colombia, espressoBlend],
};

// ── Stories ─────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => <ProductCardsView data={basePayload} app={null} />,
};

export const SingleProduct: Story = {
  render: () => (
    <ProductCardsView data={{ shopify_url: ROCKET_URL, products: [colombia] }} app={null} />
  ),
};

export const NoFlavorNotes: Story = {
  render: () => (
    <ProductCardsView
      data={{ shopify_url: ROCKET_URL, products: [espressoBlend], title: "Espresso" }}
      app={null}
    />
  ),
};

export const ManyVariants: Story = {
  render: () => (
    <ProductCardsView data={{ shopify_url: ROCKET_URL, products: [ethiopia] }} app={null} />
  ),
};

export const EmptyState: Story = {
  render: () => <ProductCardsView data={{ shopify_url: ROCKET_URL, products: [] }} app={null} />,
};

export const CartLinkState: Story = {
  render: () => <CartLink url="https://rocketcoffee.co.nz/cart/101:1,201:2" />,
};

// ── Tokenised stories (simulating analyze_site output) ─────────────

const rocketTokens = {
  primary: "rgb(255, 66, 52)",
  accent: "rgb(255, 66, 52)",
  bg: "#ffffff",
  fg: "#111111",
  muted: "#6b6b6b",
  font: "Roboto",
  radius: "0.5rem",
  siteName: "Rocket Coffee",
};

const allpressTokens = {
  primary: "#000000",
  accent: "#c41e3a",
  bg: "#f5f2ea",
  fg: "#1a1a1a",
  muted: "#6b6b6b",
  font: '"Suisse Intl", Helvetica, sans-serif',
  radius: "0px",
  siteName: "Allpress Espresso",
};

const indieTokens = {
  primary: "#2f5d50",
  accent: "#d4a373",
  bg: "#faedcd",
  fg: "#1d3557",
  muted: "#8d7d6a",
  font: "Georgia, serif",
  radius: "1.25rem",
  siteName: "Forest & Field",
};

export const ThemedRocket: Story = {
  render: () => (
    <ProductCardsView
      data={{
        shopify_url: ROCKET_URL,
        title: "Filter coffees",
        products: [ethiopia, colombia],
        tokens: rocketTokens,
      }}
      app={null}
    />
  ),
};

export const ThemedAllpress: Story = {
  render: () => (
    <ProductCardsView
      data={{
        shopify_url: "https://allpress.co.nz",
        title: "Signature blends",
        products: [ethiopia, colombia],
        tokens: allpressTokens,
      }}
      app={null}
    />
  ),
};

export const ThemedIndie: Story = {
  render: () => (
    <ProductCardsView
      data={{
        shopify_url: "https://forestandfield.example",
        title: "This month's beans",
        products: [ethiopia, colombia],
        tokens: indieTokens,
      }}
      app={null}
    />
  ),
};
