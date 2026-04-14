import type { Meta, StoryObj } from "@storybook/react";
import { McpThemeDecorator } from "../../.storybook/decorator.js";
import { ProductCardsView } from "./components/ProductCardsView.js";
import type { Payload, Product, Variant } from "./types.js";

const meta: Meta = {
  title: "MCP Apps/Product Cards",
  decorators: [McpThemeDecorator],
};
export default meta;

type Story = StoryObj<{}>;

// ── Mock data ───────────────────────────────────────────────────────

const MOCK_IMAGE_SRC =
  "https://rocketcoffee.co.nz/cdn/shop/files/2B466F62-D866-4428-A38E-6CFE11A25F75.webp?v=1773617655&width=700";

const ethiopia: Product = {
  id: 1,
  title: "Ethiopia Guji",
  handle: "ethiopia-guji",
  body_html:
    "<p>Natural processed. Flavours of rhubarb, cherry & red plum.</p><p>Roasted on 2026-04-10.</p>",
  vendor: "Rocket Coffee",
  product_type: "COFFEE",
  tags: ["FILTER", "ETHIOPIA", "SINGLE ORIGIN"],
  subtext: "Rhubarb · Cherry · Red plum",
  images: [{ src: MOCK_IMAGE_SRC, width: 800, height: 800 }],
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
  subtext: "Passionfruit · Mango · Lychee",
  images: [{ src: MOCK_IMAGE_SRC, width: 800, height: 800 }],
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
  images: [{ src: MOCK_IMAGE_SRC, width: 800, height: 800 }],
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

export const NoSubtext: Story = {
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

// ── Gearshop: MSR Hubba Hubba Bikepack Tent ─────────────────────────

const msrHubbaHubba: Product = {
  id: 14879445352815,
  title: "MSR Hubba Hubba Bikepack Tent",
  handle: "msr-hubba-hubba-bikepack-tent",
  body_html:
    "<p>Designed for the adventurous cyclist whether they ride dirt or pavement, the new Hubba Hubba Bikepack series has been meticulously designed for life on two wheels. Thoughtful features that all cyclists will appreciate married with spacious performance make these tents best-in-class.</p>",
  vendor: "MSR",
  product_type: "Tents & Shelters",
  tags: ["brand:msr", "cat:bikepack shelter", "cat:tents", "msr", "tents"],
  subtext: "Freestanding bikepacking tent · DAC poles · DuraShield fly",
  images: [
    {
      src: "https://cdn.shopify.com/s/files/1/0278/9779/files/cd9d170d-db2f-433e-af93-27c98c39d727.jpg?v=1769642063",
      width: 700,
      height: 357,
    },
    {
      src: "https://cdn.shopify.com/s/files/1/0278/9779/files/d60b65d9-a957-4a75-b808-cde3a3567c41.jpg?v=1769642063",
      width: 712,
      height: 437,
    },
    {
      src: "https://cdn.shopify.com/s/files/1/0278/9779/files/233b5107-c09c-4551-bde9-b6d0c7be3ce4.jpg?v=1769642063",
      width: 700,
      height: 342,
    },
    {
      src: "https://cdn.shopify.com/s/files/1/0278/9779/files/e2771391-27c7-4bf6-84e5-4d25968adeac.jpg?v=1769642063",
      width: 700,
      height: 367,
    },
    {
      src: "https://cdn.shopify.com/s/files/1/0278/9779/files/2002a5be-4a74-4147-ae9c-c2abe7524693.jpg?v=1769642063",
      width: 700,
      height: 438,
    },
    {
      src: "https://cdn.shopify.com/s/files/1/0278/9779/files/484df9c5-7a1e-4a55-8b1e-dbb89090082f.jpg?v=1769642063",
      width: 700,
      height: 342,
    },
  ],
  options: [{ name: "Size", position: 1, values: ["1 Person", "2 Person"] }],
  variants: [
    {
      id: 52618328539503,
      title: "1 Person",
      option1: "1 Person",
      option2: null,
      option3: null,
      available: true,
      price: "989.10",
    },
    {
      id: 52618328637807,
      title: "2 Person",
      option1: "2 Person",
      option2: null,
      option3: null,
      available: true,
      price: "1187.10",
    },
  ],
};

export const GearshopMsrHubbaHubba: Story = {
  render: () => (
    <ProductCardsView
      data={{
        shopify_url: "https://www.gearshop.co.nz",
        title: "Lightweight tents",
        products: [msrHubbaHubba],
      }}
      app={null}
    />
  ),
};

// ── Mocka: Osaka Coffee Table (Walnut) ──────────────────────────────

const mockaOsakaCoffeeTable: Product = {
  id: 10781703799087,
  title: "Osaka Coffee Table - Walnut",
  handle: "osaka-coffee-table-walnut",
  body_html:
    "<p>Add timeless style and function to your living room with the Osaka Coffee Table in Walnut. Featuring two sliding drawers for plenty of storage, this piece is perfect for mid-century or Japandi-inspired spaces.</p>",
  vendor: "Mocka New Zealand",
  product_type: "Furniture",
  tags: ["label-rts", "Sub:CoffeeTable", "Type:Furniture"],
  subtext: "Walnut finish · Two sliding drawers · Mid-century / Japandi",
  images: [
    {
      src: "https://cdn.shopify.com/s/files/1/0830/6340/6895/files/T04542_LowRes_01.jpg?v=1771409010",
      width: 1200,
      height: 1200,
    },
    {
      src: "https://cdn.shopify.com/s/files/1/0830/6340/6895/files/T04542_LowRes_04.jpg?v=1771409010",
      width: 1200,
      height: 1200,
    },
  ],
  options: [{ name: "Title", position: 1, values: ["Default Title"] }],
  variants: [
    {
      id: 51975211811119,
      title: "Default Title",
      option1: "Default Title",
      option2: null,
      option3: null,
      available: true,
      price: "319.99",
    },
  ],
  swatch: { color: "#5c4033", label: "Walnut" },
  siblings: [
    {
      id: 10784587317551,
      handle: "osaka-coffee-table-natural",
      title: "Osaka Coffee Table - Natural",
      swatch: { color: "#d4b48c", label: "Natural" },
      images: [
        {
          src: "https://cdn.shopify.com/s/files/1/0830/6340/6895/files/T04543_Low_01_e1321130-3f16-45aa-8104-8d3a0ffffca0.jpg?v=1771409411",
          width: 1200,
          height: 1200,
        },
        {
          src: "https://cdn.shopify.com/s/files/1/0830/6340/6895/files/T04543_Low_02_3be05a93-0311-4ec6-8b31-c839e21d1b96.jpg?v=1771409411",
          width: 1200,
          height: 1200,
        },
        {
          src: "https://cdn.shopify.com/s/files/1/0830/6340/6895/files/T04543_Low_03_657d0595-312b-4093-9ac0-05514b08743e.jpg?v=1771409411",
          width: 1200,
          height: 1200,
        },
      ],
      options: [{ name: "Title", position: 1, values: ["Default Title"] }],
      variants: [
        {
          id: 51985044275503,
          title: "Default Title",
          option1: "Default Title",
          option2: null,
          option3: null,
          available: true,
          price: "239.99",
        },
      ],
    },
  ],
};

export const MockaOsakaCoffeeTable: Story = {
  render: () => (
    <ProductCardsView
      data={{
        shopify_url: "https://www.mocka.co.nz",
        title: "Coffee tables",
        products: [mockaOsakaCoffeeTable],
      }}
      app={null}
    />
  ),
};

// ── Synthetic: colour swatches + two select options ─────────────────

const JACKET_BLACK_IMG =
  "https://cdn.shopify.com/s/files/1/1104/4168/files/Allbirds_WL_RN_SF_PDP_Natural_Grey_LAT.png?v=1751143404";
const JACKET_NAVY_IMG =
  "https://cdn.shopify.com/s/files/1/1104/4168/files/Allbirds_WL_RN_SF_PDP_Natural_Grey_HEL.png?v=1751143404";

function jacketVariants(prefix: number): Variant[] {
  const sizes = ["S", "M", "L", "XL"];
  const fits = ["Regular", "Slim"];
  const variants: Variant[] = [];
  let n = 0;
  for (const size of sizes) {
    for (const fit of fits) {
      n += 1;
      variants.push({
        id: prefix + n,
        title: `${size} / ${fit}`,
        option1: size,
        option2: fit,
        option3: null,
        available: true,
        price: "249.00",
      });
    }
  }
  return variants;
}

const alpineJacket: Product = {
  id: 900000001,
  title: "Alpine Shell Jacket",
  handle: "alpine-shell-jacket-black",
  body_html: "<p>Weatherproof three-layer shell for alpine travel.</p>",
  vendor: "Northline",
  product_type: "Jackets",
  tags: ["waterproof", "shell"],
  subtext: "3-layer waterproof shell · Fully taped seams · Adjustable hood",
  images: [
    { src: JACKET_BLACK_IMG, width: 1600, height: 1600 },
    { src: JACKET_NAVY_IMG, width: 1600, height: 1600 },
  ],
  options: [
    { name: "Size", position: 1, values: ["S", "M", "L", "XL"] },
    { name: "Fit", position: 2, values: ["Regular", "Slim"] },
  ],
  variants: jacketVariants(900000100),
  swatch: { color: "#111827", label: "Black" },
  siblings: [
    {
      id: 900000002,
      handle: "alpine-shell-jacket-navy",
      title: "Alpine Shell Jacket - Navy",
      swatch: { color: "#1e3a8a", label: "Navy" },
      images: [
        { src: JACKET_NAVY_IMG, width: 1600, height: 1600 },
        { src: JACKET_BLACK_IMG, width: 1600, height: 1600 },
      ],
      options: [
        { name: "Size", position: 1, values: ["S", "M", "L", "XL"] },
        { name: "Fit", position: 2, values: ["Regular", "Slim"] },
      ],
      variants: jacketVariants(900000200),
    },
    {
      id: 900000003,
      handle: "alpine-shell-jacket-moss",
      title: "Alpine Shell Jacket - Moss",
      swatch: { color: "#4d5d3a", label: "Moss" },
      images: [{ src: JACKET_BLACK_IMG, width: 1600, height: 1600 }],
      options: [
        { name: "Size", position: 1, values: ["S", "M", "L", "XL"] },
        { name: "Fit", position: 2, values: ["Regular", "Slim"] },
      ],
      variants: jacketVariants(900000300),
    },
  ],
};

export const SiblingsWithTwoSelects: Story = {
  render: () => (
    <ProductCardsView
      data={{
        shopify_url: "https://example-outdoor.myshopify.com",
        title: "Shell jackets",
        products: [alpineJacket],
      }}
      app={null}
    />
  ),
};
