import { COMMERCE } from "./config";

/**
 * Payment integration point.
 *
 * No payment gateway is connected yet and none is invented here. The checkout
 * runs in "order request" mode: the order is recorded and confirmed, and the
 * store settles payment directly with the customer.
 *
 * To switch on Stripe (or any other provider) later:
 *   1. set COMMERCE.payment.provider = "stripe" in lib/licor/config.ts
 *   2. implement `createCheckoutSession` below against the provider SDK
 *   3. the checkout form will redirect to the returned `url` instead of
 *      completing the order locally.
 */

export type PaymentMode = "order-request" | "gateway";

export function paymentMode(): PaymentMode {
  return COMMERCE.payment.provider ? "gateway" : "order-request";
}

export type CheckoutSession = {
  /** Provider-hosted checkout URL to redirect the customer to. */
  url: string;
  id: string;
};

export type CheckoutSessionInput = {
  orderId: string;
  amount: number;
  currency: string;
  email: string;
};

export async function createCheckoutSession(
  input: CheckoutSessionInput,
): Promise<CheckoutSession | null> {
  if (!COMMERCE.payment.provider) return null;
  // Implement the provider call here, e.g.:
  //   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  //   const session = await stripe.checkout.sessions.create({
  //     client_reference_id: input.orderId,
  //     customer_email: input.email,
  //     ...
  //   });
  //   return { id: session.id, url: session.url! };
  void input;
  throw new Error(
    `Payment provider "${COMMERCE.payment.provider}" is enabled but not implemented yet.`,
  );
}
