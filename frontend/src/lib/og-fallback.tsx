import { ImageResponse } from "next/og";

/**
 * OG kapagi uretilemezse 502 yerine sade bir kapak.
 *
 * 17 Eyl 2026: /og/urun/kuru-uzum "Cannot read properties of undefined
 * (reading 'trim')", /og/fiyat/manisa/erik "RangeError: Offset is outside the
 * bounds of the DataView" ile cokuyordu; nginx "upstream prematurely closed
 * connection" yazip 502 donuyordu. Ikincisini GOOGLEBOT istemisti — yani
 * paylasim kartlari ve Google'in gordugu gorsel bos kaliyordu.
 *
 * Kok nedenler farkli (veri ve font/gorsel katmani) ama sonuc ayni: kapak yok.
 * Bu yuzden savunma tek yerde: render hata verirse marka zeminli bir kapak
 * doner. Bos kapak, kapaksizliktan iyidir.
 */

const INK = "#0A0E1A";
const BRAND = "#6FBD0F";
const size = { width: 1200, height: 630 };

export function ogFallbackResponse(baslik: string, altBaslik?: string | null): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: `linear-gradient(135deg, ${INK} 0%, #11203a 60%, ${INK} 100%)`,
          color: "#fff",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 30, color: BRAND, fontWeight: 700 }}>Güncel Hal Fiyatı</div>
        <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, marginTop: 12 }}>{baslik}</div>
        {altBaslik ? (
          <div style={{ fontSize: 28, color: "#9fb0c8", marginTop: 12 }}>{altBaslik}</div>
        ) : null}
        <div style={{ fontSize: 26, color: "#cdd7e6", marginTop: 40 }}>haldefiyat.com · Resmi belediye verileri</div>
      </div>
    ),
    {
      ...size,
      headers: {
        // Yedek kapak KISA onbelleklenir: asil kapak duzeldiginde hizla devralsin.
        "cache-control": "public, max-age=300, s-maxage=600",
      },
    },
  );
}
