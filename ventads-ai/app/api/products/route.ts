import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { productInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  const products = await prisma.product.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { images: true, brand: true },
  });
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const { images, brandId, ...rest } = parsed.data;

  if (brandId) {
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });
    if (!brand) {
      return NextResponse.json({ error: "Marca no encontrada." }, { status: 404 });
    }
  }

  const product = await prisma.product.create({
    data: {
      ...rest,
      userId: user.id,
      brandId: brandId || undefined,
      images: {
        create: images.map((image, index) => ({
          url: image.url,
          role: image.role,
          width: image.width,
          height: image.height,
          sortOrder: index,
        })),
      },
    },
    include: { images: true, brand: true },
  });

  return NextResponse.json({ product }, { status: 201 });
}
