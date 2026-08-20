"use client";

import { createBrowserStore } from "./browserStore";
import {
  CART_STORAGE_KEY,
  addLine,
  parseStoredCart,
  removeLine,
  setLineQuantity,
} from "./cart";
import type { CartLine } from "./types";

export type CartState = {
  lines: CartLine[];
  /** False on the server and during hydration, true once storage was read. */
  ready: boolean;
};

const SERVER_STATE: CartState = { lines: [], ready: false };

export const cartStore = createBrowserStore<CartState>({
  key: CART_STORAGE_KEY,
  serverSnapshot: SERVER_STATE,
  parse: (raw) => ({ lines: parseStoredCart(raw), ready: true }),
  serialize: (state) => JSON.stringify(state.lines),
  syncAcrossTabs: true,
});

function update(next: (lines: CartLine[]) => CartLine[]): void {
  cartStore.set((state) => {
    const lines = next(state.lines);
    return lines === state.lines ? state : { lines, ready: true };
  });
}

export function addToCart(slug: string, quantity = 1): void {
  update((lines) => addLine(lines, slug, quantity));
}

export function setCartQuantity(slug: string, quantity: number): void {
  update((lines) => setLineQuantity(lines, slug, quantity));
}

export function removeFromCart(slug: string): void {
  update((lines) => removeLine(lines, slug));
}

export function clearCart(): void {
  update((lines) => (lines.length === 0 ? lines : []));
}
