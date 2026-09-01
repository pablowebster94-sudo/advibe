import { ZipArchive } from "archiver";
import { Readable } from "node:stream";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getConceptType } from "@/lib/catalog/concepts";
import { getFormat } from "@/lib/catalog/formats";
import { storage } from "@/lib/services/storage";

export const runtime = "nodejs";

function latestReadyByConceptFormat(
  concepts: {
    id: string;
    type: string;
    creatives: { format: string; version: number; status: string; imageKey: string | null }[];
  }[]
) {
  const items: { label: string; imageKey: string }[] = [];
  for (const concept of concepts) {
    const byFormat = new Map<string, (typeof concept.creatives)[number]>();
    for (const creative of concept.creatives) {
      const current = byFormat.get(creative.format);
      if (!current || creative.version > current.version) byFormat.set(creative.format, creative);
    }
    for (const creative of byFormat.values()) {
      if (creative.status === "COMPLETED" && creative.imageKey) {
        items.push({
          label: `${getConceptType(concept.type).label}-${getFormat(creative.format).label}`,
          imageKey: creative.imageKey,
        });
      }
    }
  }
  return items;
}

/** Bundles every ready creative in a campaign into a single ZIP download. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();

  const campaign = await prisma.campaign.findFirst({
    where: { id, product: { userId: user.id } },
    include: { concepts: { include: { creatives: true } } },
  });
  if (!campaign) {
    return new Response("Not found", { status: 404 });
  }

  const items = latestReadyByConceptFormat(campaign.concepts);
  const archive = new ZipArchive({ zlib: { level: 9 } });

  for (const item of items) {
    const buffer = await storage.read(item.imageKey);
    const safeName = item.label
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-");
    archive.append(buffer, { name: `${safeName}.png` });
  }
  archive.finalize();

  return new Response(Readable.toWeb(archive) as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="ventads-${campaign.id}.zip"`,
    },
  });
}
