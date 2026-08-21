import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ProductCard";

// Reads live product/campaign data on every request — without this, Next
// would prerender the dashboard once at build time and never show new
// products (no dynamic API is otherwise used to signal per-request render).
export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const products = await prisma.product.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      images: { where: { role: "PRODUCT" }, take: 1 },
      campaigns: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-14 px-6 py-10">
      <header className="flex items-center justify-between">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          ventADS<span className="text-accent-strong">.ai</span>
        </span>
        <Link href="/products" className="text-sm text-muted hover:text-foreground">
          Mis productos
        </Link>
      </header>

      <section className="flex flex-col gap-5">
        <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Convierte tu producto en anuncios listos para publicar.
        </h1>
        <p className="max-w-lg text-base text-muted">
          Sube información y fotos reales. ventADS.ai analiza el producto y genera
          conceptos, copy y creatividades para Meta Ads en minutos.
        </p>
        <div>
          <Link href="/new">
            <Button size="lg">Crear producto</Button>
          </Link>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Productos recientes</h2>
          {products.length > 0 && (
            <Link href="/products" className="text-sm text-accent-strong hover:underline">
              Ver todos
            </Link>
          )}
        </div>

        {products.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-border p-10 text-center text-sm text-muted">
            Todavía no creaste ningún producto. Empieza con &quot;Crear producto&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                href={
                  product.campaigns[0]
                    ? `/results/${product.campaigns[0].id}`
                    : `/products/${product.id}`
                }
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
      </section>
    </div>
  );
}
