import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { brandInputSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  const brands = await prisma.brand.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ brands });
}

export async function POST(request: Request) {
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
