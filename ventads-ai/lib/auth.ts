import { prisma } from "@/lib/db";

const DEMO_USER_EMAIL = "demo@ventads.ai";

/**
 * ventADS.ai has no real auth yet (MVP scope). Every record still carries a
 * userId so multi-tenant auth can be dropped in later without a data model
 * change — this resolves the single implicit demo user, creating it on
 * first use.
 */
export async function getCurrentUser() {
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
  });
  if (existing) return existing;

  return prisma.user.create({
    data: { email: DEMO_USER_EMAIL, name: "Demo" },
  });
}
