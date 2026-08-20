"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { trackSearch } from "@/lib/licor/analytics";
import { route } from "@/lib/licor/config";
import { formatPrice } from "@/lib/licor/format";
import { searchProducts, sortProducts } from "@/lib/licor/search";
import ProductImage from "./ProductImage";
import { CloseIcon, SearchIcon } from "./Icons";

const SUGGESTIONS = ["Don Julio", "Hennessy", "Whiskey", "Beer", "Tequila"];

/**
 * Instant catalog search. Results update as you type; the Search analytics
 * event is debounced so a single query is reported once.
 */
export default function SearchBox({
  autoFocus = false,
  onNavigate,
  className = "",
  placeholder = "Search Don Julio, Hennessy, whiskey, beer…",
}: {
  autoFocus?: boolean;
  onNavigate?: () => void;
  className?: string;
  placeholder?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return sortProducts(searchProducts(query), "featured", query).slice(0, 6);
  }, [query]);

  // Debounced Search event — one per settled query, not per keystroke.
  useEffect(() => {
    if (!query.trim()) return;
    const timer = window.setTimeout(() => trackSearch(query, results.length), 700);
    return () => window.clearTimeout(timer);
  }, [query, results.length]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    trackSearch(trimmed, results.length);
    setOpen(false);
    onNavigate?.();
    router.push(`${route("/shop")}?q=${encodeURIComponent(trimmed)}`);
  }

  const showPanel = open && (query.trim().length > 0 || results.length > 0);

  return (
    <div ref={containerRef} className={`relative ${className}`.trim()}>
      <form onSubmit={submit} role="search">
        <label htmlFor="licor-search" className="sr-only">
          Search products
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 transition focus-within:border-[#D4AF37]/60 focus-within:bg-white/[0.07]">
          <SearchIcon className="h-4 w-4 shrink-0 text-white/45" />
          <input
            id="licor-search"
            type="search"
            value={query}
            autoFocus={autoFocus}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            enterKeyHint="search"
            autoComplete="off"
            className="min-h-12 w-full bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/35 [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="flex h-9 w-9 shrink-0 items-center justify-center text-white/40 transition hover:text-white"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </form>

      {showPanel ? (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-xl border border-white/12 bg-[#0C0C0E] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.95)]">
          {results.length > 0 ? (
            <>
              <ul className="max-h-[60vh] divide-y divide-white/[0.06] overflow-y-auto">
                {results.map((product) => (
                  <li key={product.slug}>
                    <Link
                      href={route(`/product/${product.slug}`)}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className="flex items-center gap-3 px-3 py-3 transition hover:bg-white/[0.05]"
                    >
                      <span className="relative flex h-12 w-10 shrink-0 items-center justify-center rounded-md bg-black/60">
                        <ProductImage product={product} sizes="40px" className="p-1" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-white">
                          {product.name}
                        </span>
                        <span className="block truncate text-[11px] uppercase tracking-[0.14em] text-white/40">
                          {product.brand} · {product.size}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-bold text-[#D4AF37]">
                        {formatPrice(product.price)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={submit}
                className="min-h-12 w-full border-t border-white/[0.08] bg-white/[0.03] px-3 py-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#D4AF37] transition hover:bg-white/[0.07]"
              >
                See all results
              </button>
            </>
          ) : (
            <div className="px-4 py-5">
              <p className="text-sm text-white/60">
                No products match “{query.trim()}”.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setQuery(suggestion)}
                    className="inline-flex min-h-10 items-center rounded-full border border-white/12 px-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70 transition hover:border-[#D4AF37]/60 hover:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
