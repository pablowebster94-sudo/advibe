import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Favicon / app icon for the storefront segment. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(140deg, #E01B22 0%, #7E0D12 100%)",
          color: "#ffffff",
          fontSize: 78,
          fontWeight: 700,
          fontFamily: "Arial",
          letterSpacing: -2,
        }}
      >
        LS
      </div>
    ),
    size,
  );
}
