/** Domain types for the Licor Store 24 storefront. */

export type CategoryId =
  | "whiskey"
  | "tequila"
  | "vodka"
  | "cognac"
  | "rum"
  | "gin"
  | "champagne"
  | "beer"
  | "wine"
  | "mixers"
  | "other";

export type Category = {
  id: CategoryId;
  name: string;
  /** Short line used on category cards. */
  blurb: string;
  /** Accent used by the generated bottle artwork and category tiles. */
  palette: { base: string; glass: string; liquid: string };
};

export type Availability = "in-stock" | "low-stock" | "out-of-stock";

export type Product = {
  /** URL slug — stable identifier used by routes and the cart. */
  slug: string;
  name: string;
  brand: string;
  category: CategoryId;
  /** Bottle/pack size exactly as it should be displayed, e.g. "750ml". */
  size: string;
  /** DEMO price in USD. Replace with real pricing before going live. */
  price: number;
  /** Optional "was" price. When set and higher than `price` a discount shows. */
  compareAtPrice?: number;
  description: string;
  /** Stock units. `null` means "not tracked". */
  stock: number | null;
  availability: Availability;
  /** Optional image path under /public. When omitted, generated artwork is used. */
  image?: string;
  featured?: boolean;
  bestSeller?: boolean;
  /** Marks 12-packs and cases for the BEER CASES section. */
  isCase?: boolean;
  tags?: string[];
};

export type Deal = {
  id: string;
  title: string;
  subtitle: string;
  /** Optional editable discount label, e.g. "-15%". Empty string hides the badge. */
  badge: string;
  /** Filter applied when the deal card is opened. */
  filter: { category?: CategoryId; onSale?: boolean; tag?: string };
  accent: "red" | "gold";
};

export type CartLine = {
  slug: string;
  quantity: number;
};

export type CartTotals = {
  itemCount: number;
  subtotal: number;
  savings: number;
  delivery: number;
  total: number;
};

export type OrderCustomer = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

export type OrderDelivery = {
  address: string;
  apartment: string;
  city: string;
  state: string;
  zip: string;
  instructions: string;
};

export type OrderPayload = {
  customer: OrderCustomer;
  delivery: OrderDelivery;
  items: Array<{
    slug: string;
    name: string;
    brand: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  totals: CartTotals;
  ageConfirmed: boolean;
};
