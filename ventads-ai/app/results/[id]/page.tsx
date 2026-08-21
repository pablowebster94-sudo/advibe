import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OBJECTIVES } from "@/lib/catalog/objectives";
import { STYLES } from "@/lib/catalog/styles";
import { ResultsView } from "@/components/results/ResultsView";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  const campaign = await prisma.campaign.findFirst({
    where: { id, product: { userId: user.id } },
    include: {
      product: { include: { images: true, brand: true } },
      concepts: {
        include: {
          copy: true,
          creatives: { orderBy: { version: "desc" } },
        },
      },
    },
  });

  if (!campaign) notFound();

  const title = [campaign.product.manufacturer, campaign.product.name, campaign.product.model]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm font-semibold tracking-tight text-foreground">
          ventADS<span className="text-accent-strong">.ai</span>
        </Link>
        <Link href={`/products/${campaign.productId}`} className="text-sm text-muted hover:text-foreground">
          Volver al producto
        </Link>
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted">
            {OBJECTIVES.find((o) => o.id === campaign.objective)?.label} ·{" "}
            {STYLES.find((s) => s.id === campaign.style)?.label}
          </span>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        </div>
        <a href={`/api/campaigns/${campaign.id}/export`}>
          <Button variant="secondary">Descargar todo (ZIP)</Button>
        </a>
      </div>

      <ResultsView campaign={campaign} />
    </div>
  );
}
