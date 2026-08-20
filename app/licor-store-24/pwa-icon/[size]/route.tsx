import { ImageResponse } from "next/og";

/**
 * PNG app icons for the web manifest, rendered at the requested size.
 * Only the sizes the manifest declares are served.
 */
const ALLOWED = new Set([192, 512]);

export function generateStaticParams() {
  return Array.from(ALLOWED, (size) => ({ size: String(size) }));
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ size: string }> },
) {
  const { size: raw } = await context.params;
  const size = Number(raw);
  if (!ALLOWED.has(size)) {
    return new Response("Not found", { status: 404 });
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0B",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: size * 0.78,
            height: size * 0.78,
            borderRadius: size * 0.19,
            background: "linear-gradient(140deg, #E01B22 0%, #7E0D12 100%)",
            border: `${Math.max(2, size * 0.014)}px solid rgba(212,175,55,0.6)`,
            color: "#ffffff",
            fontSize: size * 0.34,
            fontWeight: 700,
            letterSpacing: -size * 0.012,
          }}
        >
          LS
        </div>
      </div>
    ),
    { width: size, height: size },
  );
}
