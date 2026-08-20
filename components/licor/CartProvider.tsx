"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { cartTotals, resolveLines, type ResolvedLine } from "@/lib/licor/cart";
import {
  addToCart,
  cartStore,
  clearCart,
  removeFromCart,
  setCartQuantity,
} from "@/lib/licor/cartStore";
import { trackAddToCart } from "@/lib/licor/analytics";
import { getProduct } from "@/lib/licor/catalog";
import type { CartLine, CartTotals } from "@/lib/licor/types";

type LastAdded = { slug: string; quantity: number; at: number };

type CartContextValue = {
  lines: CartLine[];
  items: ResolvedLine[];
  totals: CartTotals;
  /** False until localStorage has been read, so SSR and first paint agree. */
  ready: boolean;
  add: (slug: string, quantity?: number) => void;
  setQuantity: (slug: string, quantity: number) => void;
  remove: (slug: string) => void;
  clear: () => void;
  /** The most recent add, used by the confirmation toast. */
  lastAdded: LastAdded | null;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const state = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );
  const [lastAdded, setLastAdded] = useState<LastAdded | null>(null);

  const add = useCallback((slug: string, quantity = 1) => {
    addToCart(slug, quantity);
    const product = getProduct(slug);
    if (!product) return;
    trackAddToCart(product, quantity);
    setLastAdded({ slug, quantity, at: Date.now() });
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const { lines, ready } = state;
    return {
      lines,
      items: resolveLines(lines),
      totals: cartTotals(lines),
      ready,
      add,
      setQuantity: setCartQuantity,
      remove: removeFromCart,
      clear: clearCart,
      lastAdded,
    };
  }, [state, add, lastAdded]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside <CartProvider>.");
  }
  return context;
}
