import { ImageResponse } from "next/og";

export const alt = "Enfoque Visual — Propiedades y vehículos en Ecuador";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 70, background: "#111", color: "white", fontFamily: "Arial" }}>
      <div style={{ display: "flex", fontSize: 30, fontWeight: 900, letterSpacing: -1 }}>ENFOQUE<span style={{ color: "#777" }}>VISUAL</span></div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 84, lineHeight: 0.95, fontWeight: 900, letterSpacing: -4 }}>Encuentra algo que</div>
        <div style={{ display: "flex", fontSize: 84, lineHeight: 0.95, fontWeight: 900, letterSpacing: -4, color: "#d9ff3f" }}>valga la pena.</div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 30, color: "#aaa" }}>Propiedades y vehículos con fotografía, video e información clara.</div>
      </div>
      <div style={{ display: "flex", fontSize: 24, color: "#777" }}>Cuenca · Gualaceo · Azuay · Ecuador</div>
    </div>,
    size,
  );
}
