import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { regenerateCreative } from "@/lib/services/campaign-service";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const creative = await prisma.creative.findFirst({
    where: { id, concept: { campaign: { product: { userId: user.id } } } },
  });
  if (!creative) {
    return NextResponse.json({ error: "Creatividad no encontrada." }, { status: 404 });
  }

  try {
    // Creates a new PENDING job (next version) and dispatches a worker —
    // does not wait for the image to actually be generated.
    const created = await regenerateCreative(id);
    return NextResponse.json({ creative: created }, { status: 202 });
  } catch (error) {
    console.error("Regenerate setup failed", error);
    return NextResponse.json(
      { error: "No se pudo iniciar la regeneración." },
      { status: 500 }
    );
  }
}
