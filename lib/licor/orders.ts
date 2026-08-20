import type { OrderPayload } from "./types";

/** Field-level validation shared by the checkout form and the order API. */
export type ValidationErrors = Record<string, string>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidUsPhone(value: string): boolean {
  const digits = digitsOnly(value).replace(/^1/, "");
  return digits.length === 10;
}

export function isValidZip(value: string): boolean {
  return /^\d{5}(-\d{4})?$/.test(value.trim());
}

export function validateOrder(payload: {
  customer: Partial<OrderPayload["customer"]>;
  delivery: Partial<OrderPayload["delivery"]>;
  itemCount: number;
  ageConfirmed: boolean;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  const { customer, delivery } = payload;

  if (!customer.firstName?.trim()) errors.firstName = "First name is required.";
  if (!customer.lastName?.trim()) errors.lastName = "Last name is required.";
  if (!customer.phone?.trim()) errors.phone = "Phone is required.";
  else if (!isValidUsPhone(customer.phone)) errors.phone = "Enter a valid 10-digit phone number.";
  if (!customer.email?.trim()) errors.email = "Email is required.";
  else if (!EMAIL.test(customer.email.trim())) errors.email = "Enter a valid email address.";

  if (!delivery.address?.trim()) errors.address = "Delivery address is required.";
  if (!delivery.city?.trim()) errors.city = "City is required.";
  if (!delivery.state?.trim()) errors.state = "State is required.";
  if (!delivery.zip?.trim()) errors.zip = "ZIP code is required.";
  else if (!isValidZip(delivery.zip)) errors.zip = "Enter a valid ZIP code.";

  if (payload.itemCount <= 0) errors.items = "Your cart is empty.";
  if (!payload.ageConfirmed) errors.ageConfirmed = "You must confirm you are 21 or older.";

  return errors;
}

/** LS24-<base36 timestamp>-<random>, uppercase and easy to read on the phone. */
export function generateOrderId(now: number = Date.now()): string {
  const stamp = now.toString(36).toUpperCase().slice(-6);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 6);
  return `LS24-${stamp}-${rand}`;
}
