import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { clinic as defaultClinic } from "@/data/clinic";
import { getClinicSettings } from "@/server/services/contentService";

export const alt = `${defaultClinic.name} - ${defaultClinic.descriptor} in ${defaultClinic.city}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const clinic = await getClinicSettings();
  const logoBuffer = await readFile(path.join(process.cwd(), "public", "images", "logo", "logo.png"));
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #134870 0%, #0b2540 100%)",
          color: "#ffffff",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 96,
              height: 96,
              borderRadius: 24,
              background: "#ffffff",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoSrc} width={76} height={76} alt="" />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>{clinic.name}</span>
            <span style={{ fontSize: 20, letterSpacing: 4, textTransform: "uppercase", opacity: 0.7 }}>
              {clinic.descriptor}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2, maxWidth: 900 }}>
            {clinic.tagline}
          </span>
          <span style={{ fontSize: 28, opacity: 0.8 }}>
            {clinic.city}, {clinic.stateFull} · Online appointment booking
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            right: -120,
            top: -120,
            width: 420,
            height: 420,
            borderRadius: 420,
            background: "rgba(59,196,180,0.35)",
            filter: "blur(40px)",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
