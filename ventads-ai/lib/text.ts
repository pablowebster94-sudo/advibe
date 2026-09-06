/** Product features/benefits are stored as newline-separated text. */
export function toList(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function fromList(items: string[]): string {
  return items.map((item) => item.trim()).filter(Boolean).join("\n");
}

export function formatPrice(price: number | null | undefined, currency: string) {
  if (price == null) return null;
  try {
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${currency} ${price.toLocaleString("es-EC")}`;
  }
}
