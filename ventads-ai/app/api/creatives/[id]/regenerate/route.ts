import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withResolvedCreativeUrl } from "@/lib/serialize";
import { jsonRoute } from "@/lib/api-route";

export const runtime = "nodejs";

async function handlePOST(
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
    // Loaded inside the handler: it pulls in sharp (native), and a module-load
    // failure there must still answer JSON through jsonRoute, never an HTML 500.
    const { regenerateCreative } = await import("@/lib/services/campaign-service");
    const created = await regenerateCreative(id);
    return NextResponse.json(
      { creative: await withResolvedCreativeUrl(created) },
      { status: 202 }
    );
  } catch (error) {
    console.error("Regenerate setup failed", error);
    return NextResponse.json(
      { error: "No se pudo iniciar la regeneración." },
      { status: 500 }
    );
  }
}

export const POST = jsonRoute("POST /api/creatives/:id/regenerate", handlePOST);
