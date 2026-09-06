import { storage } from "@/lib/services/storage";

export const runtime = "nodejs";

const EXTENSION_TO_CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Serves files written by the local storage provider. This route is the
 * only thing that knows uploads live on local disk — swapping to S3 later
 * means deleting this route (and pointing storage.urlFor at the bucket)
 * without touching any callers.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  const key = segments.join("/");
  const extension = key.split(".").pop()?.toLowerCase() ?? "";
  const contentType = EXTENSION_TO_CONTENT_TYPE[extension];

  if (!contentType) {
    return new Response("Not found", { status: 404 });
  }

  const download = new URL(request.url).searchParams.get("download");

  try {
    const buffer = await storage.read(key);
    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    };
    if (download) {
      headers["Content-Disposition"] = `attachment; filename="${download.replace(/[^a-z0-9_.-]/gi, "_")}"`;
    }
    return new Response(new Uint8Array(buffer), { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
