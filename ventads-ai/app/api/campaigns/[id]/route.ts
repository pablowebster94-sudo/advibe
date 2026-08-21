import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  if (!campaign) {
    return NextResponse.json({ error: "Campaña no encontrada." }, { status: 404 });
  }
  return NextResponse.json({ campaign });
}
