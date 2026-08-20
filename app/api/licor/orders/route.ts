import { NextResponse } from "next/server";
import { getProduct } from "@/lib/licor/catalog";
import { COMMERCE } from "@/lib/licor/config";
import { generateOrderId, validateOrder } from "@/lib/licor/orders";
import { paymentMode } from "@/lib/licor/payments";

/**
 * Order intake.
 *
 * Runs in "order request" mode while no payment gateway is configured: the
 * order is validated, priced server-side from the catalog (never from the
 * client's numbers) and assigned a reference the customer can quote by phone.
 *
 * Persistence is intentionally not wired to an invented backend. Hook the
 * `persistOrder` call below up to the store's real system (database, email,
 * SMS, POS, CRM) when it is available.
 */

export const dynamic = "force-dynamic";

type IncomingItem = { slug?: unknown; quantity?: unknown };

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const customer = (body.customer ?? {}) as Record<string, string>;
  const delivery = (body.delivery ?? {}) as Record<string, string>;
  const rawItems = Array.isArray(body.items) ? (body.items as IncomingItem[]) : [];
  const ageConfirmed = body.ageConfirmed === true;

  // Re-price from the catalog. Client-supplied prices are never trusted.
  const items = rawItems.flatMap((item) => {
    if (typeof item?.slug !== "string") return [];
    const product = getProduct(item.slug);
    if (!product || product.availability === "out-of-stock") return [];
    const quantity =
      typeof item.quantity === "number" ? Math.max(1, Math.floor(item.quantity)) : 0;
    if (quantity <= 0) return [];
    return [
      {
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        size: product.size,
        quantity,
        price: product.price,
      },
    ];
  });

  const errors = validateOrder({
    customer,
    delivery,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    ageConfirmed,
  });

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      { ok: false, errors, error: "Please review the highlighted fields." },
      { status: 422 },
    );
  }

  const subtotal = round(
    items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  );
  const totals = {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal,
    savings: 0,
    delivery: COMMERCE.deliveryFee,
    total: round(subtotal + COMMERCE.deliveryFee),
  };

  const orderId = generateOrderId();

  await persistOrder({
    orderId,
    customer,
    delivery,
    items,
    totals,
    receivedAt: new Date().toISOString(),
  });

  return NextResponse.json({
    ok: true,
    orderId,
    totals,
    paymentMode: paymentMode(),
  });
}

/**
 * Integration point for the store's real order handling.
 * Today it logs server-side so orders are not silently lost during setup.
 */
async function persistOrder(order: Record<string, unknown>): Promise<void> {
  console.info("[licor/orders] order received", JSON.stringify(order));
}

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
