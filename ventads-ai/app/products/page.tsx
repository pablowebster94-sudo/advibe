import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const user = await getCurrentUser();
  const products = await prisma.product.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      images: { where: { role: "PRODUCT" }, take: 1 },
      campaigns: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
          ventADS<span className="text-accent-strong">.ai</span>
        </Link>
        <Link href="/new">
          <Button size="sm">Crear producto</Button>
        </Link>
      </header>

      <h1 className="text-2xl font-semibold text-foreground">Mis productos</h1>

      {products.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-border p-10 text-center text-sm text-muted">
          Todavía no creaste ningún producto.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              href={`/products/${product.id}`}
              title={[product.manufacturer, product.name, product.model]
                .filter(Boolean)
                .join(" ")}
              category={product.category}
              imageUrl={product.images[0]?.url ?? null}
              status={product.campaigns[0]?.status ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
