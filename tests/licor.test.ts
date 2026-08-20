import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addLine,
  cartTotals,
  parseStoredCart,
  removeLine,
  resolveLines,
  setLineQuantity,
} from "../lib/licor/cart";
import { getProduct, PRODUCTS } from "../lib/licor/catalog";
import { COMMERCE } from "../lib/licor/config";
import { discountPercent, formatPhone, formatPrice } from "../lib/licor/format";
import {
  DEFAULT_FILTERS,
  filterProducts,
  filtersFromParams,
  paramsFromFilters,
  searchProducts,
} from "../lib/licor/search";
import { generateOrderId, isValidUsPhone, isValidZip, validateOrder } from "../lib/licor/orders";
import { DEALS, dealQuery } from "../lib/licor/deals";

// ── Catalog integrity ───────────────────────────────────────────────────────

test("catalog slugs are unique and URL safe", () => {
  const slugs = PRODUCTS.map((product) => product.slug);
  assert.equal(new Set(slugs).size, slugs.length, "duplicate slug in catalog");
  for (const slug of slugs) {
    assert.match(slug, /^[a-z0-9-]+$/, `slug is not URL safe: ${slug}`);
  }
});

test("discounted products always cost less than the compare-at price", () => {
  for (const product of PRODUCTS) {
    if (product.compareAtPrice === undefined) continue;
    assert.ok(
      product.compareAtPrice > product.price,
      `${product.slug} has a compare-at price at or below its price`,
    );
  }
});

test("out-of-stock products report zero stock and vice versa", () => {
  for (const product of PRODUCTS) {
    if (product.availability === "out-of-stock") {
      assert.equal(product.stock, 0, `${product.slug} is sold out but has stock`);
    }
    if (product.stock === 0) {
      assert.equal(
        product.availability,
        "out-of-stock",
        `${product.slug} has no stock but is not marked sold out`,
      );
    }
  }
});

test("every requested demo product is present", () => {
  const names = PRODUCTS.map((product) => product.name.toLowerCase());
  const required = [
    "don julio",
    "hennessy",
    "buchanan",
    "jack daniel",
    "cîroc",
    "johnnie walker",
    "chivas regal",
    "milagro",
    "jäger",
    "corona",
    "modelo",
    "heineken",
  ];
  for (const needle of required) {
    assert.ok(
      names.some((name) => name.includes(needle)),
      `missing demo product: ${needle}`,
    );
  }
});

// ── Cart ────────────────────────────────────────────────────────────────────

const IN_STOCK = PRODUCTS.find((p) => p.availability === "in-stock")!.slug;
const SOLD_OUT = PRODUCTS.find((p) => p.availability === "out-of-stock")!.slug;

test("addLine merges quantities for the same product", () => {
  let lines = addLine([], IN_STOCK, 2);
  lines = addLine(lines, IN_STOCK, 3);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].quantity, 5);
});

test("addLine ignores unknown and sold-out products", () => {
  assert.deepEqual(addLine([], "does-not-exist", 1), []);
  assert.deepEqual(addLine([], SOLD_OUT, 1), []);
});

test("addLine never exceeds the tracked stock", () => {
  const product = getProduct(IN_STOCK)!;
  const lines = addLine([], IN_STOCK, (product.stock ?? 0) + 50);
  assert.equal(lines[0].quantity, product.stock);
});

test("setLineQuantity to zero removes the line", () => {
  const lines = addLine([], IN_STOCK, 2);
  assert.deepEqual(setLineQuantity(lines, IN_STOCK, 0), []);
});

test("setLineQuantity adds the product when it is not in the cart yet", () => {
  const lines = setLineQuantity([], IN_STOCK, 3);
  assert.equal(lines.length, 1);
  assert.equal(lines[0].quantity, 3);
});

test("removeLine drops only the requested product", () => {
  const other = PRODUCTS.find(
    (p) => p.slug !== IN_STOCK && p.availability === "in-stock",
  )!.slug;
  const lines = addLine(addLine([], IN_STOCK, 1), other, 1);
  const result = removeLine(lines, IN_STOCK);
  assert.deepEqual(
    result.map((line) => line.slug),
    [other],
  );
});

test("resolveLines drops products that vanished from the catalog", () => {
  const resolved = resolveLines([
    { slug: IN_STOCK, quantity: 1 },
    { slug: "ghost-product", quantity: 4 },
  ]);
  assert.equal(resolved.length, 1);
  assert.equal(resolved[0].product.slug, IN_STOCK);
});

test("cartTotals sums line totals, savings and free delivery", () => {
  const discounted = PRODUCTS.find(
    (p) => p.compareAtPrice && p.availability === "in-stock",
  )!;
  const totals = cartTotals([{ slug: discounted.slug, quantity: 2 }]);

  assert.equal(totals.itemCount, 2);
  assert.equal(totals.subtotal, round(discounted.price * 2));
  assert.equal(
    totals.savings,
    round((discounted.compareAtPrice! - discounted.price) * 2),
  );
  assert.equal(totals.delivery, COMMERCE.deliveryFee);
  assert.equal(totals.total, round(totals.subtotal + COMMERCE.deliveryFee));
});

test("cartTotals of an empty cart is zero", () => {
  const totals = cartTotals([]);
  assert.equal(totals.itemCount, 0);
  assert.equal(totals.subtotal, 0);
  assert.equal(totals.total, COMMERCE.deliveryFee);
});

test("parseStoredCart rejects malformed storage payloads", () => {
  assert.deepEqual(parseStoredCart(null), []);
  assert.deepEqual(parseStoredCart("not json"), []);
  assert.deepEqual(parseStoredCart('{"slug":"x"}'), []);
  assert.deepEqual(parseStoredCart('[{"slug":123,"quantity":1}]'), []);
  assert.deepEqual(parseStoredCart(`[{"slug":"${IN_STOCK}","quantity":0}]`), []);
  assert.deepEqual(parseStoredCart(`[{"slug":"${IN_STOCK}","quantity":2}]`), [
    { slug: IN_STOCK, quantity: 2 },
  ]);
});

// ── Search & filters ────────────────────────────────────────────────────────

test("search matches by brand, name and category, in any word order", () => {
  assert.ok(searchProducts("don julio").some((p) => p.slug === "don-julio-blanco"));
  assert.ok(searchProducts("julio don").some((p) => p.slug === "don-julio-blanco"));
  assert.ok(searchProducts("hennessy").length > 0);
  // Category terms also match products that merely mention them in their
  // description (Baileys is made with Irish whiskey), which is intended — the
  // whole category must still come back.
  for (const category of ["whiskey", "beer", "tequila"] as const) {
    const hits = new Set(searchProducts(category).map((p) => p.slug));
    for (const product of PRODUCTS.filter((p) => p.category === category)) {
      assert.ok(hits.has(product.slug), `"${category}" did not match ${product.slug}`);
    }
  }
});

test("category searches rank that category first", () => {
  for (const category of ["whiskey", "beer", "tequila"] as const) {
    const results = filterProducts({ ...DEFAULT_FILTERS, query: category });
    assert.equal(results[0].category, category);
  }
});

test("search is accent and case insensitive", () => {
  assert.ok(searchProducts("CIROC").some((p) => p.slug === "ciroc-vodka"));
  assert.ok(searchProducts("jagermeister").some((p) => p.slug === "jagermeister"));
});

test("an empty query returns the whole catalog", () => {
  assert.equal(searchProducts("").length, PRODUCTS.length);
  assert.equal(searchProducts("   ").length, PRODUCTS.length);
});

test("search ranks name matches above description matches", () => {
  const results = filterProducts({ ...DEFAULT_FILTERS, query: "hennessy" });
  assert.equal(results[0].brand, "Hennessy");
});

test("category filter narrows to one category", () => {
  const results = filterProducts({ ...DEFAULT_FILTERS, category: "beer" });
  assert.ok(results.length > 0);
  assert.ok(results.every((p) => p.category === "beer"));
});

test("brand filter accepts multiple brands", () => {
  const results = filterProducts({
    ...DEFAULT_FILTERS,
    brands: ["Corona", "Heineken"],
  });
  assert.ok(results.length > 0);
  assert.ok(results.every((p) => p.brand === "Corona" || p.brand === "Heineken"));
});

test("price filters are inclusive bounds", () => {
  const results = filterProducts({ ...DEFAULT_FILTERS, minPrice: 20, maxPrice: 30 });
  assert.ok(results.length > 0);
  assert.ok(results.every((p) => p.price >= 20 && p.price <= 30));
});

test("sale filter returns only discounted products", () => {
  const results = filterProducts({ ...DEFAULT_FILTERS, onSale: true });
  assert.ok(results.length > 0);
  assert.ok(results.every((p) => p.compareAtPrice && p.compareAtPrice > p.price));
});

test("in-stock filter hides sold-out products", () => {
  const results = filterProducts({ ...DEFAULT_FILTERS, inStockOnly: true });
  assert.ok(results.every((p) => p.availability !== "out-of-stock"));
});

test("case tag returns the beer 12 packs", () => {
  const results = filterProducts({ ...DEFAULT_FILTERS, tag: "case" });
  assert.equal(results.length, 3);
  assert.ok(results.every((p) => p.isCase));
});

test("sorting by price works in both directions", () => {
  const asc = filterProducts({ ...DEFAULT_FILTERS, sort: "price-asc" });
  const desc = filterProducts({ ...DEFAULT_FILTERS, sort: "price-desc" });
  assert.ok(asc[0].price <= asc[asc.length - 1].price);
  assert.ok(desc[0].price >= desc[desc.length - 1].price);
});

test("filters survive a round trip through the query string", () => {
  const filters = {
    ...DEFAULT_FILTERS,
    query: "don julio",
    category: "tequila" as const,
    brands: ["Don Julio", "Milagro"],
    minPrice: 20,
    maxPrice: 60,
    onSale: true,
    inStockOnly: true,
    tag: "premium",
    sort: "price-asc" as const,
  };
  const restored = filtersFromParams(new URLSearchParams(paramsFromFilters(filters)));
  assert.deepEqual(restored, filters);
});

test("default filters serialize to an empty query string", () => {
  assert.equal(paramsFromFilters(DEFAULT_FILTERS), "");
});

test("every deal card links to a filter that returns products", () => {
  for (const deal of DEALS) {
    const query = dealQuery(deal).replace(/^\?/, "");
    const filters = filtersFromParams(new URLSearchParams(query));
    assert.ok(
      filterProducts(filters).length > 0,
      `deal "${deal.id}" resolves to an empty catalog view`,
    );
  }
});

// ── Checkout validation ─────────────────────────────────────────────────────

const VALID_CUSTOMER = {
  firstName: "Alex",
  lastName: "Rivera",
  phone: "631-555-0134",
  email: "alex@example.com",
};

const VALID_DELIVERY = {
  address: "100 Main St",
  apartment: "",
  city: "Brooklyn",
  state: "NY",
  zip: "11201",
  instructions: "",
};

test("a complete order passes validation", () => {
  const errors = validateOrder({
    customer: VALID_CUSTOMER,
    delivery: VALID_DELIVERY,
    itemCount: 2,
    ageConfirmed: true,
  });
  assert.deepEqual(errors, {});
});

test("validation flags every missing required field", () => {
  const errors = validateOrder({
    customer: {},
    delivery: {},
    itemCount: 0,
    ageConfirmed: false,
  });
  for (const field of [
    "firstName",
    "lastName",
    "phone",
    "email",
    "address",
    "city",
    "state",
    "zip",
    "items",
    "ageConfirmed",
  ]) {
    assert.ok(errors[field], `expected an error for ${field}`);
  }
});

test("validation rejects a bad email, phone and ZIP", () => {
  const errors = validateOrder({
    customer: { ...VALID_CUSTOMER, email: "nope", phone: "12" },
    delivery: { ...VALID_DELIVERY, zip: "abc" },
    itemCount: 1,
    ageConfirmed: true,
  });
  assert.ok(errors.email);
  assert.ok(errors.phone);
  assert.ok(errors.zip);
});

test("an unconfirmed age blocks the order", () => {
  const errors = validateOrder({
    customer: VALID_CUSTOMER,
    delivery: VALID_DELIVERY,
    itemCount: 1,
    ageConfirmed: false,
  });
  assert.ok(errors.ageConfirmed);
});

test("US phone and ZIP helpers accept common formats", () => {
  assert.ok(isValidUsPhone("631-882-2462"));
  assert.ok(isValidUsPhone("(631) 882 2462"));
  assert.ok(isValidUsPhone("+1 631 882 2462"));
  assert.ok(!isValidUsPhone("882-2462"));
  assert.ok(isValidZip("11201"));
  assert.ok(isValidZip("11201-1234"));
  assert.ok(!isValidZip("1120"));
});

test("order ids are prefixed and unique", () => {
  const ids = new Set(Array.from({ length: 200 }, () => generateOrderId()));
  assert.equal(ids.size, 200);
  for (const id of ids) assert.match(id, /^LS24-[A-Z0-9]+-[A-Z0-9]{4}$/);
});

// ── Formatting ──────────────────────────────────────────────────────────────

test("prices render as USD with two decimals", () => {
  assert.equal(formatPrice(0), "$0.00");
  assert.equal(formatPrice(54.9), "$54.90");
  assert.equal(formatPrice(1234.5), "$1,234.50");
});

test("discountPercent only reports a real discount", () => {
  assert.equal(discountPercent(40, 50), 20);
  assert.equal(discountPercent(40), null);
  assert.equal(discountPercent(40, 40), null);
  assert.equal(discountPercent(40, 30), null);
});

test("phone numbers render in US dash format", () => {
  assert.equal(formatPhone("+16318822462"), "631-882-2462");
  assert.equal(formatPhone("6317081009"), "631-708-1009");
});

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
