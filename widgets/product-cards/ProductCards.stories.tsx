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

// ── Real: Rocket Coffee fruity filter roasts (writing-page demo) ────

const ROCKET_GRINDS = [
  "Whole bean",
  "Aeropress",
  "Chemex",
  "Kalita",
  "Moccamaster",
  "Plunger",
  "Swiss Gold",
  "V60",
];

function rocketGrindVariants(idBase: number, price: string): Variant[] {
  return ROCKET_GRINDS.map((grind, i) => ({
    id: idBase + i,
    title: `250g / ${grind}`,
    option1: "250g",
    option2: grind,
    option3: null,
    available: true,
    price,
  }));
}

const sipiFalls: Product = {
  id: 7970648424624,
  title: "Sipi Falls Organic - SL28 - SL14 [natural] Filter Roast",
  handle: "sips-falls-organic-sl28-sl14-natural-filter-roast",
  vendor: "ROCKET COFFEE",
  product_type: "COFFEE",
  tags: ["COFFEE", "ETHIOPIA", "FILTER", "SINGLE ORIGIN", "WASHED"],
  subtext: "Strawberry · Pineapple · Gooseberry",
  images: [
    {
      src: "https://cdn.shopify.com/s/files/1/0259/2853/files/4C7E7656-35BF-4E98-BE73-D843CAE0B29F.webp?v=1762375306",
      width: 2846,
      height: 2846,
    },
  ],
  options: [
    { name: "WEIGHT", position: 1, values: ["250g"] },
    { name: "GRIND", position: 2, values: ROCKET_GRINDS },
  ],
  variants: rocketGrindVariants(44828511961264, "25.00"),
};

const merlyLeon: Product = {
  id: 8035585687728,
  title: "Merly León - Yellow Caturra [washed] filter roast",
  handle: "wilder-garcia-bravo-yellow-bourbon-washed-filter-roast-copy",
  vendor: "ROCKET COFFEE",
  product_type: "COFFEE",
  tags: ["COFFEE", "FILTER", "NEW", "PERU", "SINGLE ORIGIN", "WASHED", "YELLOW CATURRA"],
  subtext: "Peach · Orange · Maple syrup",
  images: [
    {
      src: "https://cdn.shopify.com/s/files/1/0259/2853/files/36A52ACA-1FE1-4D28-8771-1EB7C2127298.webp?v=1776053869",
      width: 2846,
      height: 2846,
    },
  ],
  options: [
    { name: "WEIGHT", position: 1, values: ["250g"] },
    { name: "GRIND", position: 2, values: ROCKET_GRINDS },
  ],
  variants: rocketGrindVariants(45047563845808, "26.00"),
};

// ── Real: Ishinomaki Lab coffee tables (writing-page demo) ──────────

const ishinomakiCenterTableHalf: Product = {
  id: 10028504973609,
  title: "CENTER TABLE HALF - Lounge Series",
  handle: "center-table-half-lounge-series",
  vendor: "Ishinomaki Lab",
  product_type: "Furniture",
  tags: [],
  subtext: "Low center table · Yakushima cedar or chestnut",
  images: [
    {
      src: "https://cdn.shopify.com/s/files/1/0896/8116/6633/files/01CENTER_TABLE-HALF_Chestnut01_black_KLS.webp?v=1771903780",
      width: 1200,
      height: 1200,
    },
  ],
  options: [
    {
      name: "Wood",
      position: 1,
      values: ["栗 / natural", "栗 / soil", "屋久島地杉"],
    },
  ],
  variants: [
    {
      id: 52740576772393,
      title: "栗 / natural",
      option1: "栗 / natural",
      option2: null,
      option3: null,
      available: true,
      price: "154000",
    },
    {
      id: 52740576805161,
      title: "栗 / soil",
      option1: "栗 / soil",
      option2: null,
      option3: null,
      available: true,
      price: "154000",
    },
    {
      id: 52740576837929,
      title: "屋久島地杉",
      option1: "屋久島地杉",
      option2: null,
      option3: null,
      available: true,
      price: "93500",
    },
  ],
};

const ishinomakiCornerTable: Product = {
  id: 10028499534121,
  title: "CORNER TABLE - Kobo Lounge Series",
  handle: "corner-table-kobo-lounge-series",
  vendor: "Ishinomaki Lab",
  product_type: "Furniture",
  tags: [],
  subtext: "Compact corner table · Yakushima cedar or chestnut",
  images: [
    {
      src: "https://cdn.shopify.com/s/files/1/0896/8116/6633/files/01CORNER_TABLE_Chestnut01_black_KLS.webp?v=1771902441",
      width: 1200,
      height: 1200,
    },
  ],
  options: [
    {
      name: "Wood",
      position: 1,
      values: ["栗 / natural", "栗 / soil", "屋久島地杉"],
    },
  ],
  variants: [
    {
      id: 52740531061033,
      title: "栗 / natural",
      option1: "栗 / natural",
      option2: null,
      option3: null,
      available: true,
      price: "132000",
    },
    {
      id: 52740531847465,
      title: "栗 / soil",
      option1: "栗 / soil",
      option2: null,
      option3: null,
      available: true,
      price: "132000",
    },
    {
      id: 52740532633897,
      title: "屋久島地杉",
      option1: "屋久島地杉",
      option2: null,
      option3: null,
      available: true,
      price: "82500",
    },
  ],
};

const ishinomakiSideTable: Product = {
  id: 10011211104553,
  title: "SIDE TABLE - the Originals",
  handle: "side-table-the-originals",
  vendor: "Ishinomaki Lab",
  product_type: "Furniture",
  tags: [],
  subtext: "Noto hiba cedar · Linoleum top",
  images: [
    {
      src: "https://cdn.shopify.com/s/files/1/0896/8116/6633/files/01SIDE_TABLE_Notohiba_Pebble_basic01_black_OG.webp?v=1770617705",
      width: 1200,
      height: 1200,
    },
  ],
  options: [
    { name: "Wood", position: 1, values: ["能登ヒバ"] },
    { name: "Linolium", position: 2, values: ["Pebble"] },
  ],
  variants: [
    {
      id: 52622979334441,
      title: "能登ヒバ / Pebble",
      option1: "能登ヒバ",
      option2: "Pebble",
      option3: null,
      available: true,
      price: "39600",
    },
  ],
};

export const IshinomakiCoffeeTables: Story = {
  render: () => (
    <ProductCardsView
      data={{
        shopify_url: "https://ishinomaki-lab.org",
        currency: "JPY",
        title: "Ishinomaki Lab — coffee / center tables",
        products: [
          ishinomakiCenterTableHalf,
          ishinomakiCornerTable,
          ishinomakiSideTable,
        ],
      }}
      app={null}
    />
  ),
};

export const FruityFilterRoasts: Story = {
  render: () => (
    <ProductCardsView
      data={{
        shopify_url: ROCKET_URL,
        currency: "NZD",
        products: [sipiFalls, merlyLeon],
      }}
      app={null}
    />
  ),
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
