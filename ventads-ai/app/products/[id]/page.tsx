import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CATEGORIES } from "@/lib/catalog/categories";
import { OBJECTIVES } from "@/lib/catalog/objectives";
import { STYLES } from "@/lib/catalog/styles";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { NewCampaignForm } from "@/components/NewCampaignForm";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  READY: "Listo",
  PENDING: "Generando",
  FAILED: "Con errores",
};

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  const product = await prisma.product.findFirst({
    where: { id, userId: user.id },
    include: {
      images: true,
      brand: true,
      campaigns: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!product) notFound();

  const title = [product.manufacturer, product.name, product.model]
    .filter(Boolean)
    .join(" ");
  const categoryLabel =
    CATEGORIES.find((c) => c.id === product.category)?.label ?? product.category;
  const productImages = product.images.filter((image) => image.role === "PRODUCT");

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
          ventADS<span className="text-accent-strong">.ai</span>
        </Link>
        <Link href="/products" className="text-sm text-muted hover:text-foreground">
          Mis productos
        </Link>
      </header>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted">{categoryLabel}</span>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {product.brand && (
          <span className="text-sm text-muted">Marca: {product.brand.name}</span>
        )}
      </div>

      {productImages.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {productImages.map((image) => (
            <div
              key={image.id}
              className="relative h-28 w-28 overflow-hidden rounded-[var(--radius-sm)] border border-border bg-surface-muted"
            >
              <Image src={image.url} alt="" fill sizes="112px" className="object-contain" />
            </div>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-foreground">Campañas generadas</h2>
        {product.campaigns.length === 0 ? (
          <p className="text-sm text-muted">Todavía no generaste creatividades para este producto.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {product.campaigns.map((campaign) => (
              <li key={campaign.id}>
                <Link
                  href={`/results/${campaign.id}`}
                  className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border bg-surface px-4 py-3 text-sm hover:border-accent-strong"
                >
                  <span className="text-foreground">
                    {OBJECTIVES.find((o) => o.id === campaign.objective)?.label} ·{" "}
                    {STYLES.find((s) => s.id === campaign.style)?.label}
                  </span>
                  <span className="text-xs text-muted">
                    {STATUS_LABEL[campaign.status] ?? campaign.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <NewCampaignForm productId={product.id} />
    </div>
  );
}
