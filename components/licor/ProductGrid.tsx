import type { Product } from "@/lib/licor/types";
import ProductCard from "./ProductCard";

export default function ProductGrid({
  products,
  priorityCount = 0,
  className = "",
}: {
  products: Product[];
  priorityCount?: number;
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 ${className}`.trim()}
    >
      {products.map((product, index) => (
        <ProductCard
          key={product.slug}
          product={product}
          priority={index < priorityCount}
        />
      ))}
    </div>
  );
}
