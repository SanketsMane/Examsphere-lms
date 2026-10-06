import { ImageResponse } from "next/og";

// Default preview for links shared on WhatsApp, LinkedIn, X etc. Pages without their own
// opengraph-image inherit it; the text only states what the site offers.
export const alt = "ExamSphere — JEE, NEET, Foundation & MBBS preparation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0B1B3F 0%, #13306B 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 700, color: "#FF8A3D", letterSpacing: 1 }}>ExamSphere</div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.1, marginTop: 24, maxWidth: 980 }}>
          Your journey to success begins here.
        </div>
        <div style={{ fontSize: 34, marginTop: 36, color: "#CBD5E1" }}>
          JEE · NEET · Foundation (Class 6–10) · MBBS
        </div>
        <div style={{ fontSize: 28, marginTop: 14, color: "#94A3B8" }}>
          Live classes · Practice · Mock tests · Mentorship
        </div>
      </div>
    ),
    size
  );
}
