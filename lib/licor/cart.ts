import { COMMERCE } from "./config";
import { getProduct } from "./catalog";
import type { CartLine, CartTotals, Product } from "./types";

export const CART_STORAGE_KEY = "licor-store-24:cart:v1";
export const MAX_LINE_QUANTITY = 99;

export type ResolvedLine = {
  product: Product;
  quantity: number;
  lineTotal: number;
  lineCompareAtTotal: number;
};

function clampQuantity(quantity: number, product?: Product): number {
  const max =
    product && product.stock !== null && product.stock > 0
      ? Math.min(product.stock, MAX_LINE_QUANTITY)
      : MAX_LINE_QUANTITY;
  return Math.max(0, Math.min(Math.floor(quantity), max));
}

/** Adds `quantity` of `slug`, merging with an existing line. Pure. */
export function addLine(
  lines: CartLine[],
  slug: string,
  quantity = 1,
): CartLine[] {
  const product = getProduct(slug);
  if (!product || product.availability === "out-of-stock") return lines;

  const existing = lines.find((line) => line.slug === slug);
  const next = clampQuantity((existing?.quantity ?? 0) + quantity, product);
  if (next <= 0) return lines.filter((line) => line.slug !== slug);

  return existing
    ? lines.map((line) => (line.slug === slug ? { ...line, quantity: next } : line))
    : [...lines, { slug, quantity: next }];
}

/** Sets an absolute quantity. A quantity of 0 removes the line. Pure. */
export function setLineQuantity(
  lines: CartLine[],
  slug: string,
  quantity: number,
): CartLine[] {
  const product = getProduct(slug);
  const next = clampQuantity(quantity, product);
  if (next <= 0) return removeLine(lines, slug);
  if (!lines.some((line) => line.slug === slug)) return addLine(lines, slug, next);
  return lines.map((line) =>
    line.slug === slug ? { ...line, quantity: next } : line,
  );
}

export function removeLine(lines: CartLine[], slug: string): CartLine[] {
  return lines.filter((line) => line.slug !== slug);
}

/** Drops lines whose product no longer exists or went out of stock. */
export function resolveLines(lines: CartLine[]): ResolvedLine[] {
  return lines.flatMap((line) => {
    const product = getProduct(line.slug);
    if (!product || product.availability === "out-of-stock") return [];
    const quantity = clampQuantity(line.quantity, product);
    if (quantity <= 0) return [];
    return [
      {
        product,
        quantity,
        lineTotal: round(product.price * quantity),
        lineCompareAtTotal: round(
          (product.compareAtPrice ?? product.price) * quantity,
        ),
      },
    ];
  });
}

export function cartTotals(lines: CartLine[]): CartTotals {
  const resolved = resolveLines(lines);
  const subtotal = round(resolved.reduce((sum, l) => sum + l.lineTotal, 0));
  const compareAt = round(
    resolved.reduce((sum, l) => sum + l.lineCompareAtTotal, 0),
  );
  const itemCount = resolved.reduce((sum, l) => sum + l.quantity, 0);
  const delivery = COMMERCE.deliveryFee;

  return {
    itemCount,
    subtotal,
    savings: round(Math.max(0, compareAt - subtotal)),
    delivery,
    total: round(subtotal + delivery),
  };
}

export function itemCount(lines: CartLine[]): number {
  return cartTotals(lines).itemCount;
}

/** Currency-safe rounding to 2 decimals. */
function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Defensive parse of whatever localStorage hands back. */
export function parseStoredCart(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((entry) => {
      if (typeof entry !== "object" || entry === null) return [];
      const { slug, quantity } = entry as Record<string, unknown>;
      if (typeof slug !== "string") return [];
      const qty = typeof quantity === "number" ? Math.floor(quantity) : 0;
      if (qty <= 0 || !getProduct(slug)) return [];
      return [{ slug, quantity: Math.min(qty, MAX_LINE_QUANTITY) }];
    });
  } catch {
    return [];
  }
}
