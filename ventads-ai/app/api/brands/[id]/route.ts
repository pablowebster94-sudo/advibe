import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { brandUpdateSchema } from "@/lib/validation";
import { jsonRoute } from "@/lib/api-route";

export const runtime = "nodejs";

/** Brand Kit edits (logo, colors, WhatsApp, CTA, footer, template). */
async function handlePATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const body = await request.json().catch(() => null);
  const parsed = brandUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos." }, { status: 400 });
  }
  const existing = await prisma.brand.findFirst({ where: { id, userId: user.id } });
  if (!existing) return NextResponse.json({ error: "Marca no encontrada." }, { status: 404 });

  const { colors, ...rest } = parsed.data;
  const brand = await prisma.brand.update({
    where: { id },
    data: {
      ...rest,
      ...(colors !== undefined ? { colors: colors ? JSON.stringify(colors) : null } : {}),
    },
  });
  return NextResponse.json({ brand });
}

export const PATCH = jsonRoute("PATCH /api/brands/:id", handlePATCH);
