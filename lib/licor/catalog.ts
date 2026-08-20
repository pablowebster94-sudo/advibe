import type { Category, CategoryId, Product } from "./types";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * DEMO CATALOG — EDIT THIS FILE TO MANAGE THE STORE
 * ─────────────────────────────────────────────────────────────────────────────
 * Every product, price, size, stock level and promotion lives here as plain
 * data, never inside a component. Swapping this module for an API call or a
 * database query later is a drop-in change.
 *
 * ⚠️ ALL PRICES BELOW ARE PLACEHOLDER **DEMO** VALUES. They are not Licor
 * Store 24's real prices and must be replaced before the store goes live.
 * The storefront shows a demo-pricing disclosure while COMMERCE.demoPricing
 * is true (see lib/licor/config.ts).
 */

export const CATEGORIES: Category[] = [
  {
    id: "whiskey",
    name: "Whiskey",
    blurb: "Scotch, bourbon & blends",
    palette: { base: "#7A3B12", glass: "#2A1408", liquid: "#C8791F" },
  },
  {
    id: "tequila",
    name: "Tequila",
    blurb: "Blanco, reposado & añejo",
    palette: { base: "#8C7A1E", glass: "#141405", liquid: "#EBE3A6" },
  },
  {
    id: "vodka",
    name: "Vodka",
    blurb: "Clean, crisp & premium",
    palette: { base: "#2C4C6B", glass: "#0A1620", liquid: "#DCEBF7" },
  },
  {
    id: "cognac",
    name: "Cognac",
    blurb: "French luxury spirits",
    palette: { base: "#8A5410", glass: "#201204", liquid: "#D99A2B" },
  },
  {
    id: "rum",
    name: "Rum",
    blurb: "Light, dark & spiced",
    palette: { base: "#6B3418", glass: "#1A0D05", liquid: "#B96A2A" },
  },
  {
    id: "gin",
    name: "Gin",
    blurb: "Botanical & dry",
    palette: { base: "#25604A", glass: "#07160F", liquid: "#CFEADC" },
  },
  {
    id: "champagne",
    name: "Champagne",
    blurb: "Bubbles for the moment",
    palette: { base: "#8C6C1E", glass: "#1A1405", liquid: "#F2D98C" },
  },
  {
    id: "beer",
    name: "Beer",
    blurb: "Singles, 6 & 12 packs",
    palette: { base: "#8A6A14", glass: "#160F03", liquid: "#E3B23C" },
  },
  {
    id: "wine",
    name: "Wine",
    blurb: "Red, white & rosé",
    palette: { base: "#6B1226", glass: "#170409", liquid: "#A62740" },
  },
  {
    id: "mixers",
    name: "Mixers",
    blurb: "Tonics, sodas & juice",
    palette: { base: "#1E5F63", glass: "#06171A", liquid: "#8FE0DF" },
  },
  {
    id: "other",
    name: "Other",
    blurb: "Liqueurs, shots & extras",
    palette: { base: "#3A2B6B", glass: "#0C0818", liquid: "#9E8CE0" },
  },
];

export const CATEGORY_BY_ID: Record<CategoryId, Category> = CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category;
    return acc;
  },
  {} as Record<CategoryId, Category>,
);

export const PRODUCTS: Product[] = [
  // ── TEQUILA ───────────────────────────────────────────────────────────────
  {
    slug: "don-julio-blanco",
    name: "Don Julio Blanco",
    brand: "Don Julio",
    category: "tequila",
    size: "750ml",
    price: 54.99,
    description:
      "Crisp agave-forward blanco tequila with citrus and a clean, peppery finish. The reference bottle for margaritas and neat pours alike.",
    stock: 24,
    availability: "in-stock",
    featured: true,
    bestSeller: true,
    tags: ["premium", "top-shelf"],
  },
  {
    slug: "milagro-tequila-silver",
    name: "Milagro Tequila Silver",
    brand: "Milagro",
    category: "tequila",
    size: "750ml",
    price: 32.99,
    compareAtPrice: 37.99,
    description:
      "Triple-distilled 100% blue agave silver tequila. Bright, smooth and built for cocktails.",
    stock: 30,
    availability: "in-stock",
    featured: true,
    tags: ["weekend"],
  },

  // ── COGNAC ────────────────────────────────────────────────────────────────
  {
    slug: "hennessy-vs",
    name: "Hennessy V.S",
    brand: "Hennessy",
    category: "cognac",
    size: "750ml",
    price: 44.99,
    description:
      "The classic V.S cognac — oak, toasted almond and a warm, full body. A staple of any bar cart.",
    stock: 18,
    availability: "in-stock",
    featured: true,
    bestSeller: true,
    tags: ["premium", "top-shelf"],
  },

  // ── WHISKEY ───────────────────────────────────────────────────────────────
  {
    slug: "buchanans-deluxe-12",
    name: "Buchanan's Deluxe 12",
    brand: "Buchanan's",
    category: "whiskey",
    size: "750ml",
    price: 39.99,
    compareAtPrice: 44.99,
    description:
      "Blended Scotch aged 12 years. Smooth, lightly smoky and effortlessly drinkable over ice.",
    stock: 22,
    availability: "in-stock",
    featured: true,
    bestSeller: true,
    tags: ["weekend"],
  },
  {
    slug: "jack-daniels-old-no-7",
    name: "Jack Daniel's Old No. 7",
    brand: "Jack Daniel's",
    category: "whiskey",
    size: "750ml",
    price: 27.99,
    description:
      "Charcoal-mellowed Tennessee whiskey. Sweet vanilla, caramel and toasted oak.",
    stock: 40,
    availability: "in-stock",
    featured: true,
    bestSeller: true,
  },
  {
    slug: "johnnie-walker-black-label",
    name: "Johnnie Walker Black Label",
    brand: "Johnnie Walker",
    category: "whiskey",
    size: "750ml",
    price: 36.99,
    description:
      "12-year blended Scotch with dried fruit, vanilla and a signature wisp of smoke.",
    stock: 26,
    availability: "in-stock",
    featured: true,
    bestSeller: true,
    tags: ["top-shelf"],
  },
  {
    slug: "chivas-regal-12",
    name: "Chivas Regal 12",
    brand: "Chivas Regal",
    category: "whiskey",
    size: "750ml",
    price: 33.99,
    compareAtPrice: 38.99,
    description:
      "Rich blended Scotch with honey, hazelnut and ripe apple. Aged a minimum of 12 years.",
    stock: 20,
    availability: "in-stock",
    featured: true,
    tags: ["weekend"],
  },
  {
    slug: "bulleit-bourbon",
    name: "Bulleit Bourbon",
    brand: "Bulleit",
    category: "whiskey",
    size: "750ml",
    price: 29.99,
    description:
      "High-rye Kentucky bourbon. Bold, spicy and clean — an Old Fashioned favorite.",
    stock: 16,
    availability: "in-stock",
  },

  // ── VODKA ─────────────────────────────────────────────────────────────────
  {
    slug: "ciroc-vodka",
    name: "Cîroc",
    brand: "Cîroc",
    category: "vodka",
    size: "750ml",
    price: 34.99,
    description:
      "Grape-based French vodka, distilled five times. Silky, fresh and citrus-bright.",
    stock: 28,
    availability: "in-stock",
    featured: true,
    bestSeller: true,
    tags: ["premium"],
  },
  {
    slug: "titos-handmade-vodka",
    name: "Tito's Handmade Vodka",
    brand: "Tito's",
    category: "vodka",
    size: "750ml",
    price: 24.99,
    description:
      "Corn-based American vodka, distilled six times. Smooth and endlessly mixable.",
    stock: 45,
    availability: "in-stock",
    bestSeller: true,
  },

  // ── RUM ───────────────────────────────────────────────────────────────────
  {
    slug: "bacardi-superior",
    name: "Bacardí Superior",
    brand: "Bacardí",
    category: "rum",
    size: "750ml",
    price: 19.99,
    description:
      "Light, dry white rum with almond and vanilla notes. The base of the daiquiri and mojito.",
    stock: 34,
    availability: "in-stock",
  },
  {
    slug: "captain-morgan-spiced",
    name: "Captain Morgan Original Spiced",
    brand: "Captain Morgan",
    category: "rum",
    size: "750ml",
    price: 21.99,
    compareAtPrice: 24.99,
    description:
      "Caribbean rum with vanilla and warm baking spice. Made for cola and ginger beer.",
    stock: 30,
    availability: "in-stock",
    tags: ["weekend"],
  },

  // ── GIN ───────────────────────────────────────────────────────────────────
  {
    slug: "tanqueray-london-dry",
    name: "Tanqueray London Dry",
    brand: "Tanqueray",
    category: "gin",
    size: "750ml",
    price: 26.99,
    description:
      "Four botanicals, crisp juniper and a clean dry finish. A gin & tonic benchmark.",
    stock: 19,
    availability: "in-stock",
  },
  {
    slug: "bombay-sapphire",
    name: "Bombay Sapphire",
    brand: "Bombay",
    category: "gin",
    size: "750ml",
    price: 28.99,
    description:
      "Ten botanicals vapour-infused for a bright, aromatic and smooth London dry gin.",
    stock: 14,
    availability: "low-stock",
  },

  // ── CHAMPAGNE ─────────────────────────────────────────────────────────────
  {
    slug: "moet-chandon-imperial-brut",
    name: "Moët & Chandon Impérial Brut",
    brand: "Moët & Chandon",
    category: "champagne",
    size: "750ml",
    price: 64.99,
    description:
      "Bright green apple and citrus with a fine, elegant bead. The celebration bottle.",
    stock: 12,
    availability: "in-stock",
    featured: true,
    tags: ["premium", "top-shelf"],
  },
  {
    slug: "veuve-clicquot-yellow-label",
    name: "Veuve Clicquot Yellow Label",
    brand: "Veuve Clicquot",
    category: "champagne",
    size: "750ml",
    price: 74.99,
    compareAtPrice: 82.99,
    description:
      "Full-bodied brut champagne with white fruit, brioche and a long, dry finish.",
    stock: 8,
    availability: "low-stock",
    tags: ["premium", "limited"],
  },

  // ── BEER (singles) ────────────────────────────────────────────────────────
  {
    slug: "corona-extra-6-pack",
    name: "Corona Extra — 6 Pack",
    brand: "Corona",
    category: "beer",
    size: "6 × 12oz bottles",
    price: 11.99,
    description:
      "Crisp Mexican lager, best served ice cold with lime. The easiest beer on the list.",
    stock: 60,
    availability: "in-stock",
    featured: true,
  },
  {
    slug: "modelo-especial-6-pack",
    name: "Modelo Especial — 6 Pack",
    brand: "Modelo",
    category: "beer",
    size: "6 × 12oz bottles",
    price: 12.49,
    description:
      "Rich, full-flavored pilsner-style lager with a clean, crisp finish.",
    stock: 55,
    availability: "in-stock",
  },
  {
    slug: "heineken-6-pack",
    name: "Heineken — 6 Pack",
    brand: "Heineken",
    category: "beer",
    size: "6 × 12oz bottles",
    price: 12.99,
    description:
      "Dutch lager brewed with pure malt. Balanced, slightly bitter and refreshing.",
    stock: 50,
    availability: "in-stock",
  },

  // ── BEER CASES ────────────────────────────────────────────────────────────
  {
    slug: "corona-extra-12-pack",
    name: "Corona Extra — 12 Pack",
    brand: "Corona",
    category: "beer",
    size: "12 × 12oz bottles",
    price: 21.99,
    compareAtPrice: 23.99,
    description:
      "The party-size Corona case. Crisp, light and made for a crowd.",
    stock: 42,
    availability: "in-stock",
    isCase: true,
    featured: true,
    bestSeller: true,
    tags: ["case", "weekend"],
  },
  {
    slug: "modelo-especial-12-pack",
    name: "Modelo Especial — 12 Pack",
    brand: "Modelo",
    category: "beer",
    size: "12 × 12oz cans",
    price: 22.99,
    compareAtPrice: 25.49,
    description:
      "A full case of Modelo Especial. Golden, full-flavored and consistently a best seller.",
    stock: 38,
    availability: "in-stock",
    isCase: true,
    featured: true,
    bestSeller: true,
    tags: ["case", "weekend"],
  },
  {
    slug: "heineken-12-pack",
    name: "Heineken — 12 Pack",
    brand: "Heineken",
    category: "beer",
    size: "12 × 12oz bottles",
    price: 23.99,
    compareAtPrice: 26.49,
    description:
      "Twelve bottles of the green-label classic. Cold, crisp and always in rotation.",
    stock: 33,
    availability: "in-stock",
    isCase: true,
    featured: true,
    tags: ["case"],
  },

  // ── WINE ──────────────────────────────────────────────────────────────────
  {
    slug: "josh-cellars-cabernet-sauvignon",
    name: "Josh Cellars Cabernet Sauvignon",
    brand: "Josh Cellars",
    category: "wine",
    size: "750ml",
    price: 15.99,
    description:
      "Dark fruit, mocha and soft tannins. An easy, food-friendly California cabernet.",
    stock: 26,
    availability: "in-stock",
  },
  {
    slug: "kim-crawford-sauvignon-blanc",
    name: "Kim Crawford Sauvignon Blanc",
    brand: "Kim Crawford",
    category: "wine",
    size: "750ml",
    price: 17.99,
    compareAtPrice: 19.99,
    description:
      "Marlborough sauvignon blanc — passionfruit, grapefruit and a zesty finish.",
    stock: 21,
    availability: "in-stock",
    tags: ["weekend"],
  },

  // ── MIXERS ────────────────────────────────────────────────────────────────
  {
    slug: "fever-tree-tonic-water-4-pack",
    name: "Fever-Tree Indian Tonic Water — 4 Pack",
    brand: "Fever-Tree",
    category: "mixers",
    size: "4 × 200ml",
    price: 6.99,
    description:
      "Clean quinine tonic with natural botanicals. The mixer that respects the gin.",
    stock: 48,
    availability: "in-stock",
  },
  {
    slug: "red-bull-4-pack",
    name: "Red Bull Energy Drink — 4 Pack",
    brand: "Red Bull",
    category: "mixers",
    size: "4 × 8.4oz cans",
    price: 9.99,
    description: "The classic energy mixer. Chilled and ready to go.",
    stock: 52,
    availability: "in-stock",
  },

  // ── OTHER ─────────────────────────────────────────────────────────────────
  {
    slug: "jagermeister",
    name: "Jägermeister",
    brand: "Jägermeister",
    category: "other",
    size: "750ml",
    price: 25.99,
    compareAtPrice: 28.99,
    description:
      "56 herbs, roots and spices. Serve it ice cold — the original shot bottle.",
    stock: 29,
    availability: "in-stock",
    featured: true,
    bestSeller: true,
    tags: ["weekend"],
  },
  {
    slug: "baileys-irish-cream",
    name: "Baileys Original Irish Cream",
    brand: "Baileys",
    category: "other",
    size: "750ml",
    price: 26.99,
    description:
      "Irish whiskey and cream with cocoa and vanilla. Great neat, over ice or in coffee.",
    stock: 0,
    availability: "out-of-stock",
  },
];

export const PRODUCT_BY_SLUG = new Map(PRODUCTS.map((p) => [p.slug, p]));

export function getProduct(slug: string): Product | undefined {
  return PRODUCT_BY_SLUG.get(slug);
}

/** Distinct brands, alphabetical — powers the brand filter. */
export function allBrands(products: Product[] = PRODUCTS): string[] {
  return Array.from(new Set(products.map((p) => p.brand))).sort((a, b) =>
    a.localeCompare(b),
  );
}

/** Categories that actually have at least one product. */
export function activeCategories(products: Product[] = PRODUCTS): Category[] {
  const used = new Set(products.map((p) => p.category));
  return CATEGORIES.filter((c) => used.has(c.id));
}

export function countByCategory(
  products: Product[] = PRODUCTS,
): Record<string, number> {
  return products.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});
}

export function priceRange(products: Product[] = PRODUCTS): [number, number] {
  if (products.length === 0) return [0, 0];
  const prices = products.map((p) => p.price);
  return [Math.floor(Math.min(...prices)), Math.ceil(Math.max(...prices))];
}

export const FEATURED_PRODUCTS = PRODUCTS.filter((p) => p.featured);
export const BEST_SELLERS = PRODUCTS.filter((p) => p.bestSeller);
export const BEER_CASES = PRODUCTS.filter((p) => p.isCase);

/** Same category first, then anything from the same brand. */
export function relatedProducts(product: Product, limit = 4): Product[] {
  const sameCategory = PRODUCTS.filter(
    (p) => p.slug !== product.slug && p.category === product.category,
  );
  const sameBrand = PRODUCTS.filter(
    (p) =>
      p.slug !== product.slug &&
      p.brand === product.brand &&
      p.category !== product.category,
  );
  const seen = new Set<string>();
  return [...sameCategory, ...sameBrand, ...FEATURED_PRODUCTS]
    .filter((p) => {
      if (p.slug === product.slug || seen.has(p.slug)) return false;
      seen.add(p.slug);
      return true;
    })
    .slice(0, limit);
}
