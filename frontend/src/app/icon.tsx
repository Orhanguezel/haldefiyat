import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** PWA / sekme ikonu — `manifest.ts` `/icon` adresini kullanır (public PNG gerekmez). */
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
          background: "#84f04c",
          color: "#0a0e1a",
          fontSize: 280,
          fontWeight: 800,
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        }}
      >
        H
      </div>
    ),
    { ...size },
  );
}
