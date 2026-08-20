"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { trackSearch } from "@/lib/licor/analytics";
import { CATEGORIES, allBrands, priceRange } from "@/lib/licor/catalog";
import { route } from "@/lib/licor/config";
import { formatPrice } from "@/lib/licor/format";
import {
  activeFilterCount,
  filterProducts,
  filtersFromParams,
  paramsFromFilters,
  type ShopFilters,
  type SortKey,
} from "@/lib/licor/search";
import ProductGrid from "./ProductGrid";
import { CloseIcon, FilterIcon, SearchIcon } from "./Icons";
import { ActionButton, LinkButton } from "./ui";

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name-asc", label: "Name: A–Z" },
];

const TAG_LABELS: Record<string, string> = {
  weekend: "Weekend deals",
  "best-seller": "Best sellers",
  case: "Beer cases",
  premium: "Premium spirits",
  featured: "Featured",
  "top-shelf": "Top shelf",
  limited: "Limited",
};

const BRANDS = allBrands();
const [MIN_PRICE, MAX_PRICE] = priceRange();

/**
 * Catalog browser. All filter state lives in the URL, so every filtered view is
 * shareable, linkable from an ad, and survives a refresh or a back navigation.
 */
export default function ShopBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filters = useMemo(
    () => filtersFromParams(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  // Local mirror so typing stays instant; the URL catches up on a debounce.
  const [queryDraft, setQueryDraft] = useState(filters.query);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // When the URL query changes from somewhere else (the header search, a deal
  // link, the back button), adopt it. Adjusting state during render is the
  // supported way to react to a changed input without an extra render pass.
  const [syncedQuery, setSyncedQuery] = useState(filters.query);
  if (syncedQuery !== filters.query) {
    setSyncedQuery(filters.query);
    setQueryDraft(filters.query);
  }

  const apply = useCallback(
    (next: ShopFilters, options: { replace?: boolean } = {}) => {
      const query = paramsFromFilters(next);
      const href = query ? `${route("/shop")}?${query}` : route("/shop");
      if (options.replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    [router],
  );

  // Debounced URL sync for the search field.
  useEffect(() => {
    if (queryDraft === filters.query) return;
    const timer = window.setTimeout(() => {
      apply({ ...filters, query: queryDraft }, { replace: true });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [queryDraft, filters, apply]);

  const results = useMemo(() => filterProducts(filters), [filters]);

  // One Search event per settled query.
  useEffect(() => {
    if (!filters.query.trim()) return;
    const timer = window.setTimeout(
      () => trackSearch(filters.query, results.length),
      600,
    );
    return () => window.clearTimeout(timer);
  }, [filters.query, results.length]);

  const filterCount = activeFilterCount(filters);

  function update(patch: Partial<ShopFilters>) {
    apply({ ...filters, ...patch });
  }

  function toggleBrand(brand: string) {
    const brands = filters.brands.includes(brand)
      ? filters.brands.filter((b) => b !== brand)
      : [...filters.brands, brand];
    update({ brands });
  }

  function clearAll() {
    apply({
      query: filters.query,
      category: "all",
      brands: [],
      minPrice: null,
      maxPrice: null,
      onSale: false,
      inStockOnly: false,
      tag: null,
      sort: filters.sort,
    });
    setDrawerOpen(false);
  }

  const filterPanel = (
    <div className="flex flex-col gap-7">
      <FilterGroup title="Category">
        <div className="flex flex-wrap gap-2">
          <Chip
            active={filters.category === "all"}
            onClick={() => update({ category: "all" })}
          >
            All
          </Chip>
          {CATEGORIES.map((category) => (
            <Chip
              key={category.id}
              active={filters.category === category.id}
              onClick={() => update({ category: category.id })}
            >
              {category.name}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Brand">
        <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto pr-1">
          {BRANDS.map((brand) => (
            <Chip
              key={brand}
              active={filters.brands.includes(brand)}
              onClick={() => toggleBrand(brand)}
            >
              {brand}
            </Chip>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title={`Price (${formatPrice(MIN_PRICE)} – ${formatPrice(MAX_PRICE)})`}>
        <div className="flex items-center gap-2">
          <PriceInput
            label="Min"
            value={filters.minPrice}
            placeholder={String(MIN_PRICE)}
            onCommit={(value) => update({ minPrice: value })}
          />
          <span className="text-white/30">–</span>
          <PriceInput
            label="Max"
            value={filters.maxPrice}
            placeholder={String(MAX_PRICE)}
            onCommit={(value) => update({ maxPrice: value })}
          />
        </div>
      </FilterGroup>

      <FilterGroup title="Offers">
        <div className="flex flex-col gap-2.5">
          <Toggle
            checked={filters.onSale}
            onChange={(checked) => update({ onSale: checked })}
            label="On sale only"
          />
          <Toggle
            checked={filters.inStockOnly}
            onChange={(checked) => update({ inStockOnly: checked })}
            label="In stock only"
          />
        </div>
      </FilterGroup>

      {filterCount > 0 ? (
        <ActionButton variant="ghost" size="md" onClick={clearAll}>
          Clear filters ({filterCount})
        </ActionButton>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
      {/* Search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 focus-within:border-[#D4AF37]/60">
          <SearchIcon className="h-4 w-4 shrink-0 text-white/45" />
          <input
            type="search"
            value={queryDraft}
            onChange={(event) => setQueryDraft(event.target.value)}
            placeholder="Search Don Julio, Hennessy, whiskey, beer…"
            aria-label="Search products"
            enterKeyHint="search"
            className="min-h-12 w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/35 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {queryDraft ? (
            <button
              type="button"
              onClick={() => setQueryDraft("")}
              aria-label="Clear search"
              className="flex h-9 w-9 shrink-0 items-center justify-center text-white/40 transition hover:text-white"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-4 text-[11px] font-black uppercase tracking-[0.14em] text-white transition hover:border-[#D4AF37]/50 lg:hidden"
          >
            <FilterIcon className="h-4 w-4" />
            Filters
            {filterCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#E01B22] px-1 text-[10px]">
                {filterCount}
              </span>
            ) : null}
          </button>

          <label className="sr-only" htmlFor="shop-sort">
            Sort products
          </label>
          <select
            id="shop-sort"
            value={filters.sort}
            onChange={(event) => update({ sort: event.target.value as SortKey })}
            className="min-h-12 rounded-xl border border-white/12 bg-[#0C0C0E] px-3 text-[11px] font-bold uppercase tracking-[0.1em] text-white outline-none transition focus:border-[#D4AF37]/60"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active filter summary */}
      {filterCount > 0 ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {filters.category !== "all" ? (
            <RemovableChip onRemove={() => update({ category: "all" })}>
              {CATEGORIES.find((c) => c.id === filters.category)?.name}
            </RemovableChip>
          ) : null}
          {filters.brands.map((brand) => (
            <RemovableChip key={brand} onRemove={() => toggleBrand(brand)}>
              {brand}
            </RemovableChip>
          ))}
          {filters.tag ? (
            <RemovableChip onRemove={() => update({ tag: null })}>
              {TAG_LABELS[filters.tag] ?? filters.tag}
            </RemovableChip>
          ) : null}
          {filters.onSale ? (
            <RemovableChip onRemove={() => update({ onSale: false })}>On sale</RemovableChip>
          ) : null}
          {filters.inStockOnly ? (
            <RemovableChip onRemove={() => update({ inStockOnly: false })}>
              In stock
            </RemovableChip>
          ) : null}
          {filters.minPrice !== null ? (
            <RemovableChip onRemove={() => update({ minPrice: null })}>
              Min {formatPrice(filters.minPrice)}
            </RemovableChip>
          ) : null}
          {filters.maxPrice !== null ? (
            <RemovableChip onRemove={() => update({ maxPrice: null })}>
              Max {formatPrice(filters.maxPrice)}
            </RemovableChip>
          ) : null}
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex min-h-9 items-center px-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45 underline-offset-4 transition hover:text-white hover:underline"
          >
            Clear all
          </button>
        </div>
      ) : null}

      <div className="mt-6 grid gap-8 lg:grid-cols-[248px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-32">{filterPanel}</div>
        </aside>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/45">
            {results.length} {results.length === 1 ? "product" : "products"}
            {filters.query.trim() ? ` for “${filters.query.trim()}”` : ""}
          </p>

          {results.length > 0 ? (
            <ProductGrid products={results} priorityCount={4} className="mt-4" />
          ) : (
            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center">
              <p className="text-base font-bold text-white">No products found</p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">
                Try a different search or clear the filters. You can also call the
                store and we will check availability for you.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <ActionButton variant="gold" size="md" onClick={clearAll}>
                  Clear filters
                </ActionButton>
                <LinkButton href={route("/contact")} variant="ghost" size="md">
                  Contact the store
                </LinkButton>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-3xl border-t border-white/12 bg-[#08080A]">
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">{filterPanel}</div>
            <div
              className="border-t border-white/[0.08] px-5 py-4"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
            >
              <ActionButton
                variant="primary"
                size="lg"
                className="w-full"
                onClick={() => setDrawerOpen(false)}
              >
                Show {results.length} {results.length === 1 ? "product" : "products"}
              </ActionButton>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-10 items-center rounded-full border px-3.5 text-[11px] font-bold uppercase tracking-[0.08em] transition ${
        active
          ? "border-[#D4AF37] bg-[#D4AF37] text-black"
          : "border-white/12 bg-white/[0.03] text-white/70 hover:border-white/30 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function RemovableChip({
  children,
  onRemove,
}: {
  children: React.ReactNode;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove filter: ${typeof children === "string" ? children : ""}`.trim()}
      className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 pl-3.5 pr-2.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#E7C766] transition hover:border-[#D4AF37] hover:bg-[#D4AF37]/20"
    >
      {children}
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/10">
        <CloseIcon className="h-2.5 w-2.5" />
      </span>
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm text-white/75">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="peer sr-only"
      />
      <span className="flex h-5 w-9 items-center rounded-full bg-white/12 p-0.5 transition peer-checked:bg-[#E01B22] peer-checked:[&>span]:translate-x-4">
        <span className="h-4 w-4 rounded-full bg-white transition" />
      </span>
      {label}
    </label>
  );
}

function PriceInput({
  label,
  value,
  placeholder,
  onCommit,
}: {
  label: string;
  value: number | null;
  placeholder: string;
  onCommit: (value: number | null) => void;
}) {
  const text = value === null ? "" : String(value);
  const [draft, setDraft] = useState(text);
  const [syncedValue, setSyncedValue] = useState(text);
  if (syncedValue !== text) {
    setSyncedValue(text);
    setDraft(text);
  }

  function commit() {
    const trimmed = draft.trim();
    if (trimmed === "") {
      onCommit(null);
      return;
    }
    const parsed = Number(trimmed);
    onCommit(Number.isFinite(parsed) && parsed >= 0 ? parsed : null);
  }

  return (
    <label className="flex-1">
      <span className="sr-only">{label} price</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        value={draft}
        placeholder={placeholder}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit();
          }
        }}
        className="min-h-11 w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition focus:border-[#D4AF37]/60"
      />
    </label>
  );
}
