import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Latin Eagle Multiservices — Envíos, giros y productos latinos en Patchogue, NY";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "public/latin-eagle/logo-og.jpg"));
  const logoSrc = `data:image/jpeg;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", gap: 60, padding: 70, background: "linear-gradient(135deg,#0a0a0a 55%,#2a2006)", color: "white", fontFamily: "Arial" }}>
      <img src={logoSrc} width={340} height={336} alt="" style={{ borderRadius: 999, border: "8px solid #f2c230" }} />
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", fontSize: 26, fontWeight: 900, letterSpacing: 6, color: "#f2c230" }}>PATCHOGUE, NY</div>
        <div style={{ display: "flex", marginTop: 18, fontSize: 64, lineHeight: 1.02, fontWeight: 900, letterSpacing: -2 }}>Tu tienda latina de confianza</div>
        <div style={{ display: "flex", marginTop: 26, fontSize: 30, lineHeight: 1.3, color: "#e5e5e5" }}>Envíos a Ecuador y Colombia · Giros · Productos latinos · Farmacia</div>
        <div style={{ display: "flex", marginTop: 34, alignSelf: "flex-start", padding: "14px 26px", borderRadius: 16, background: "#f2c230", color: "#000", fontSize: 28, fontWeight: 900 }}>294 E Main St · (631) 505-7092</div>
      </div>
    </div>,
    size,
  );
}
