"use client";

import { createBrowserStore } from "./browserStore";
import type { OrderCustomer, OrderDelivery } from "./types";

/**
 * Checkout form draft, persisted to sessionStorage.
 *
 * Keeping it in an external store means a refresh (or an accidental back
 * navigation) never costs the shopper their typing — which on mobile is often
 * the difference between a completed order and an abandoned one.
 */
export type CheckoutDraft = {
  customer: OrderCustomer;
  delivery: OrderDelivery;
};

export const EMPTY_DRAFT: CheckoutDraft = {
  customer: { firstName: "", lastName: "", phone: "", email: "" },
  delivery: {
    address: "",
    apartment: "",
    city: "",
    // New York is the store's service area; still editable by the customer.
    state: "NY",
    zip: "",
    instructions: "",
  },
};

function parse(raw: string | null): CheckoutDraft {
  if (!raw) return EMPTY_DRAFT;
  try {
    const parsed = JSON.parse(raw) as Partial<CheckoutDraft>;
    return {
      customer: { ...EMPTY_DRAFT.customer, ...(parsed.customer ?? {}) },
      delivery: { ...EMPTY_DRAFT.delivery, ...(parsed.delivery ?? {}) },
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

export const checkoutDraft = createBrowserStore<CheckoutDraft>({
  key: "licor-store-24:checkout-draft:v1",
  storage: "session",
  serverSnapshot: EMPTY_DRAFT,
  parse,
});

export function updateCustomer(patch: Partial<OrderCustomer>): void {
  checkoutDraft.set((draft) => ({
    ...draft,
    customer: { ...draft.customer, ...patch },
  }));
}

export function updateDelivery(patch: Partial<OrderDelivery>): void {
  checkoutDraft.set((draft) => ({
    ...draft,
    delivery: { ...draft.delivery, ...patch },
  }));
}

export function clearCheckoutDraft(): void {
  checkoutDraft.set(EMPTY_DRAFT);
}
