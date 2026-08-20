import Image from "next/image";
import BottleArt from "./BottleArt";
import type { Product } from "@/lib/licor/types";

/**
 * Renders the product photo when the catalog provides one, and falls back to
 * generated artwork otherwise. Add `image: "/licor/products/foo.jpg"` to a
 * product in lib/licor/catalog.ts to swap in real photography.
 */
export default function ProductImage({
  product,
  className = "",
  sizes = "(max-width: 768px) 45vw, 260px",
  priority = false,
}: {
  product: Product;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (product.image) {
    return (
      <Image
        src={product.image}
        alt={`${product.brand} ${product.name}`}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-contain ${className}`.trim()}
      />
    );
  }
  return <BottleArt product={product} className={`h-full w-full ${className}`.trim()} />;
}
