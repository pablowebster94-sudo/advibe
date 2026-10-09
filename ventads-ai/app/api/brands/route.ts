import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";
import { prisma } from "../../../lib/db";
import { brandInputSchema } from "../../../lib/validation";
import { jsonRoute } from "@/lib/api-route";
import { storage } from "@/lib/services/storage";

export const runtime = "nodejs";

async function handleGET() {
  const user = await getCurrentUser();
  const brands = await prisma.brand.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  // Logo URL resolved for the Brand Kit editor (the key stays private).
  const withLogos = await Promise.all(
    brands.map(async (brand) => ({ ...brand, logoUrl: brand.logoKey ? await storage.urlFor(brand.logoKey) : null }))
  );
  return NextResponse.json({ brands: withLogos });
}

async function handlePOST(request: Request) {
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = brandInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos." },
      { status: 400 }
    );
  }

  const { colors, contactEmail, ...rest } = parsed.data;
  const brand = await prisma.brand.create({
    data: {
      ...rest,
      userId: user.id,
      contactEmail: contactEmail || undefined,
      colors: colors ? JSON.stringify(colors) : undefined,
    },
  });

  return NextResponse.json({ brand }, { status: 201 });
}

export const GET = jsonRoute("GET /api/brands", handleGET);
export const POST = jsonRoute("POST /api/brands", handlePOST);
