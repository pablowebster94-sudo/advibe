import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "AdVibe Agencia — Creamos marcas que destacan, venden y crecen.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "70px",
          background: "linear-gradient(135deg, #05070b 0%, #0b1020 55%, #1d1450 100%)",
          color: "white",
          fontFamily: "Arial",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 8, color: "#9db0ff" }}>ADVIBE AGENCIA</div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1000 }}>
          <div style={{ display: "flex", fontSize: 72, lineHeight: 1, fontWeight: 700 }}>Creamos marcas que</div>
          <div style={{ display: "flex", fontSize: 72, lineHeight: 1, fontWeight: 700, color: "#9db0ff" }}>destacan, venden y crecen.</div>
          <div style={{ display: "flex", marginTop: 28, fontSize: 27, color: "#b8c0d4" }}>Marketing · Contenido · Web · IA · Automatización</div>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#737d94" }}>Ecuador · advibeagencia.com</div>
      </div>
    ),
    size
  );
}
