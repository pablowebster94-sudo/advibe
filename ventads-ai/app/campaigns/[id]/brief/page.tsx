import Link from "next/link";
import { notFound } from "next/navigation";
import { BriefForm } from "@/components/campaign/BriefForm";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * The campaign brief screen. The form and the strategy panel live in a client
 * component because the plan recomputes on every save; this shell only
 * resolves the campaign and checks it belongs to the caller.
 */

export const runtime = "nodejs";

export const metadata = {
  title: "Brief de campaña · VentAds",
};

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const campaign = await prisma.campaign.findFirst({
    where: { id, product: { userId: user.id } },
    include: { product: { include: { brand: true } } },
  });

  if (!campaign) notFound();

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          Inicio
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/results/${campaign.id}`} className="hover:text-foreground">
          {campaign.product.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Brief</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-2xl font-black text-foreground">Brief de campaña</h1>
        <p className="mt-1 text-sm text-muted">
          {campaign.product.brand?.name
            ? `${campaign.product.brand.name} · ${campaign.product.name}`
            : campaign.product.name}{" "}
          · objetivo {campaign.objective}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Describe la oferta como se la explicarías a un cliente. A la derecha
          verás, mientras escribes, qué campaña se construiría, si el
          presupuesto la sostiene y qué datos faltan. Nada sale a Meta sin tu
          aprobación.
        </p>
      </header>

      <BriefForm campaignId={campaign.id} />
    </main>
  );
}
