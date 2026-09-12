import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Swim Private Hub -- booking & manajemen les renang";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #4f46e5 0%, #1e1b4b 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 96,
            height: 96,
            borderRadius: 24,
            background: "rgba(255,255,255,0.15)",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
            fontSize: 48,
          }}
        >
          🏊
        </div>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, color: "#ffffff" }}>
          Swim Private Hub
        </div>
        <div style={{ display: "flex", marginTop: 16, fontSize: 28, color: "rgba(255,255,255,0.85)" }}>
          Booking jadwal renang dengan coach favoritmu
        </div>
      </div>
    ),
    { ...size }
  );
}
