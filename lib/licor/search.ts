import { PRODUCTS } from "./catalog";
import type { CategoryId, Product } from "./types";

export type SortKey = "featured" | "price-asc" | "price-desc" | "name-asc";

export type ShopFilters = {
  query: string;
  category: CategoryId | "all";
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
  onSale: boolean;
  inStockOnly: boolean;
  tag: string | null;
  sort: SortKey;
};

export const DEFAULT_FILTERS: ShopFilters = {
  query: "",
  category: "all",
  brands: [],
  minPrice: null,
  maxPrice: null,
  onSale: false,
  inStockOnly: false,
  tag: null,
  sort: "featured",
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Everything a product can be matched on, pre-normalized. */
function haystack(product: Product): string {
  return normalize(
    [
      product.name,
      product.brand,
      product.category,
      product.size,
      product.description,
      ...(product.tags ?? []),
    ].join(" "),
  );
}

/**
 * Instant search: every whitespace-separated term must appear somewhere in the
 * product. "don julio" and "julio don" both match Don Julio Blanco.
 */
export function searchProducts(
  query: string,
  products: Product[] = PRODUCTS,
): Product[] {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return products;
  return products.filter((product) => {
    const text = haystack(product);
    return terms.every((term) => text.includes(term));
  });
}

/** Rank matches so name/brand hits beat description hits. */
function relevance(product: Product, query: string): number {
  const terms = normalize(query).split(/\s+/).filter(Boolean);
  if (terms.length === 0) return 0;
  const name = normalize(product.name);
  const brand = normalize(product.brand);
  let score = 0;
  for (const term of terms) {
    if (name.startsWith(term)) score += 6;
    else if (name.includes(term)) score += 4;
    if (brand.startsWith(term)) score += 3;
    else if (brand.includes(term)) score += 2;
    if (normalize(product.category).includes(term)) score += 1;
  }
  return score;
}

function isOnSale(product: Product): boolean {
  return Boolean(product.compareAtPrice && product.compareAtPrice > product.price);
}

function matchesTag(product: Product, tag: string): boolean {
  if (tag === "best-seller") return Boolean(product.bestSeller);
  if (tag === "featured") return Boolean(product.featured);
  if (tag === "case") return Boolean(product.isCase) || (product.tags ?? []).includes("case");
  return (product.tags ?? []).includes(tag);
}

export function filterProducts(
  filters: ShopFilters,
  products: Product[] = PRODUCTS,
): Product[] {
  let result = products;

  if (filters.category !== "all") {
    result = result.filter((p) => p.category === filters.category);
  }
  if (filters.brands.length > 0) {
    const set = new Set(filters.brands);
    result = result.filter((p) => set.has(p.brand));
  }
  if (filters.minPrice !== null) {
    result = result.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice !== null) {
    result = result.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.onSale) {
    result = result.filter(isOnSale);
  }
  if (filters.inStockOnly) {
    result = result.filter((p) => p.availability !== "out-of-stock");
  }
  if (filters.tag) {
    result = result.filter((p) => matchesTag(p, filters.tag!));
  }
  if (filters.query.trim()) {
    result = searchProducts(filters.query, result);
  }

  return sortProducts(result, filters.sort, filters.query);
}

export function sortProducts(
  products: Product[],
  sort: SortKey,
  query = "",
): Product[] {
  const sorted = [...products];
  // With an active query, relevance always wins over the "featured" default.
  if (sort === "featured" && query.trim()) {
    return sorted.sort(
      (a, b) => relevance(b, query) - relevance(a, query) || a.name.localeCompare(b.name),
    );
  }
  switch (sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted.sort((a, b) => {
        const rank = (p: Product) =>
          (p.featured ? 0 : 1) * 2 + (p.availability === "out-of-stock" ? 4 : 0);
        return rank(a) - rank(b) || a.name.localeCompare(b.name);
      });
  }
}

/** Reads shop filters out of a URL query string. */
export function filtersFromParams(params: URLSearchParams): ShopFilters {
  const num = (key: string): number | null => {
    const raw = params.get(key);
    if (raw === null || raw.trim() === "") return null;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  };
  const sort = params.get("sort");
  const sortKeys: SortKey[] = ["featured", "price-asc", "price-desc", "name-asc"];

  return {
    query: params.get("q") ?? "",
    category: (params.get("category") as CategoryId | null) ?? "all",
    brands: params.getAll("brand").filter(Boolean),
    minPrice: num("min"),
    maxPrice: num("max"),
    onSale: params.get("sale") === "1",
    inStockOnly: params.get("stock") === "1",
    tag: params.get("tag"),
    sort: sortKeys.includes(sort as SortKey) ? (sort as SortKey) : "featured",
  };
}

/** Serializes filters back into a query string (omitting defaults). */
export function paramsFromFilters(filters: ShopFilters): string {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("q", filters.query.trim());
  if (filters.category !== "all") params.set("category", filters.category);
  for (const brand of filters.brands) params.append("brand", brand);
  if (filters.minPrice !== null) params.set("min", String(filters.minPrice));
  if (filters.maxPrice !== null) params.set("max", String(filters.maxPrice));
  if (filters.onSale) params.set("sale", "1");
  if (filters.inStockOnly) params.set("stock", "1");
  if (filters.tag) params.set("tag", filters.tag);
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  return params.toString();
}

export function activeFilterCount(filters: ShopFilters): number {
  let count = 0;
  if (filters.category !== "all") count += 1;
  count += filters.brands.length;
  if (filters.minPrice !== null) count += 1;
  if (filters.maxPrice !== null) count += 1;
  if (filters.onSale) count += 1;
  if (filters.inStockOnly) count += 1;
  if (filters.tag) count += 1;
  return count;
}
