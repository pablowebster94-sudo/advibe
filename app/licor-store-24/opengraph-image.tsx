import { ImageResponse } from "next/og";
import { BUSINESS } from "@/lib/licor/config";

export const alt = `${BUSINESS.name} — ${BUSINESS.concept}`;
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
          padding: "72px",
          background:
            "linear-gradient(135deg, #0A0A0B 0%, #170406 52%, #0A0A0B 100%)",
          color: "#ffffff",
          fontFamily: "Arial",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 76,
              height: 76,
              borderRadius: 18,
              background: "linear-gradient(135deg, #E01B22 0%, #8E0F14 100%)",
              border: "2px solid rgba(212,175,55,0.55)",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            LS
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 26,
              letterSpacing: 10,
              color: "#D4AF37",
              fontWeight: 700,
            }}
          >
            {BUSINESS.concept}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1020 }}>
          <div style={{ display: "flex", fontSize: 96, lineHeight: 1, fontWeight: 700 }}>
            LICOR STORE 24
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 20,
              fontSize: 52,
              lineHeight: 1.05,
              fontWeight: 700,
              color: "#D4AF37",
            }}
          >
            {BUSINESS.headline}
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 28, color: "#B7B2AC" }}>
            {BUSINESS.subheadline}
          </div>
        </div>

        <div style={{ display: "flex", gap: 32, fontSize: 26, color: "#ffffff" }}>
          <div style={{ display: "flex" }}>{BUSINESS.phones[0].label}</div>
          <div style={{ display: "flex", color: "#5E5A55" }}>·</div>
          <div style={{ display: "flex" }}>{BUSINESS.phones[1].label}</div>
          <div style={{ display: "flex", color: "#5E5A55" }}>·</div>
          <div style={{ display: "flex", color: "#B7B2AC" }}>{BUSINESS.serviceArea}</div>
        </div>
      </div>
    ),
    size,
  );
}
