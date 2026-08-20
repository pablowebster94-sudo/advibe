import type { CartTotals, OrderCustomer, OrderDelivery } from "@/lib/licor/types";

/** sessionStorage key prefix for a placed order's confirmation snapshot. */
export const ORDER_STORAGE_PREFIX = "licor-store-24:order:";

export type StoredOrder = {
  orderId: string;
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
  placedAt: string;
};

export function readStoredOrder(orderId: string): StoredOrder | null {
  try {
    const raw = window.sessionStorage.getItem(`${ORDER_STORAGE_PREFIX}${orderId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredOrder;
    return parsed?.orderId === orderId ? parsed : null;
  } catch {
    return null;
  }
}
