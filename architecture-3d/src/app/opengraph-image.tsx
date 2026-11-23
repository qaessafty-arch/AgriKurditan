import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

export const alt = SITE.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#101114", color: "#F5F3EF" }}>
        <div style={{ display: "flex", fontSize: 28, letterSpacing: 6, color: "#C9AF88", textTransform: "uppercase" }}>{SITE.name}</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, lineHeight: 1.04, maxWidth: 960 }}>{SITE.tagline}.</div>
          <div style={{ marginTop: 28, fontSize: 28, color: "#A6A6A2" }}>Interactive 3D architecture · Design studio · Consultations</div>
        </div>
        <div style={{ display: "flex", height: 6, width: 240, background: "#B69A72" }} />
      </div>
    ),
    size,
  );
}
