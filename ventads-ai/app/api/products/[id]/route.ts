import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { withResolvedImageUrl } from "@/lib/serialize";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const images = await Promise.all(product.images.map(withResolvedImageUrl));

  return NextResponse.json({ product: { ...product, images } });
}
