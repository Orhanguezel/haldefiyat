/**
 * CTA huni olcumu — kayit + okuma.
 *
 * Neden: ~900 engaged pageview/gun'e karsilik 11 bulten abonesi var. "CTA ekleyelim"
 * demek kolay ama CTA'lar zaten yerinde; eksik olan hangi adimda kaybettigimizi
 * gosteren veri. Bu modul huniyi birinci taraf olarak olcer:
 *
 *   impression -> focus -> submit -> success
 *
 * Adim adim bakinca sorunun hangisi oldugu ayrisir:
 *   dusuk impression        -> CTA gorulmuyor (yerlesim/scroll derinligi sorunu)
 *   impression var focus yok -> teklif ilgi cekmiyor (METIN testi burada)
 *   focus var submit yok     -> form/guven sorunu (alan sayisi, KVKK metni)
 *   submit var success yok   -> teknik hata (dogrulama, endpoint)
 */

import { and, gte, sql } from "drizzle-orm";
import { createHash } from "node:crypto";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { db } from "@/db/client";
import { hfCtaEvents } from "@/db/schema";

/** Huninin adimlari — sirali. Bilinmeyen event adi kabul edilmez. */
export const CTA_EVENTS = ["impression", "focus", "submit", "success", "invalid", "error"] as const;
type CtaEvent = (typeof CTA_EVENTS)[number];

/** Bilinen yerlesimler. Serbest metin kabul edilirse tablo cop olur. */
export const CTA_PLACEMENTS = [
  "mobile_home_sticky",
  "home_bottom",
  "price_list_strip",
  "live_price",
] as const;

interface CtaBody {
  placement: string;
  event: string;
  path?: string;
  device?: string;
}

/**
 * Ziyaretci parmak izi — kisi takibi DEGIL, tekil sayim icin.
 *
 * IP + User-Agent + O GUNUN tarihi birlikte hash'lenir. Gun degisince ayni ziyaretci
 * farkli hash alir, yani kalici bir kimlik olusmaz. Tuz olarak JWT_SECRET kullanilir
 * ki hash disaridan yeniden uretilemesin.
 */
function visitorHash(req: FastifyRequest): string {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "";
  const ua = (req.headers["user-agent"] as string) || "";
  const day = new Date().toISOString().slice(0, 10);
  const salt = process.env.JWT_SECRET || "";
  return createHash("sha256").update(`${ip}|${ua}|${day}|${salt}`).digest("hex").slice(0, 16);
}

export async function registerCtaTracking(app: FastifyInstance) {
  app.post<{ Body: CtaBody }>(
    "/track/cta",
    {
      schema: {
        body: {
          type: "object",
          required: ["placement", "event"],
          properties: {
            placement: { type: "string", enum: [...CTA_PLACEMENTS] },
            event: { type: "string", enum: [...CTA_EVENTS] },
            path: { type: "string", maxLength: 255 },
            device: { type: "string", enum: ["mobile", "desktop"] },
          },
          additionalProperties: false,
        },
      },
    },
    async (req, reply) => {
      // Olcum, olctugu isi cokertmemeli: hata firlatmaz, her durumda 204 doner.
      try {
        await db.insert(hfCtaEvents).values({
          placement: req.body.placement,
          event: req.body.event as CtaEvent,
          path: (req.body.path || "/").slice(0, 255),
          device: req.body.device === "mobile" ? "mobile" : "desktop",
          visitorHash: visitorHash(req),
        });
      } catch (err) {
        req.log.warn({ err }, "[cta] olay yazilamadi");
      }
      return reply.code(204).send();
    },
  );
}

export interface CtaFunnelRow {
  placement:   string;
  device:      string;
  impression:  number;
  focus:       number;
  submit:      number;
  success:     number;
  /** Goren kisilerin yuzde kaci abone oldu. Asil optimize edilecek sayi. */
  conversionPct: number | null;
  /** Gorenlerin yuzde kaci yazmaya basladi — teklif/metin ilgisinin olcusu. */
  engagePct:     number | null;
}

/**
 * Huni ozeti. Tekil ziyaretci sayar (ayni kisinin iki gosterimi bir sayilir),
 * yoksa sticky CTA her sayfada yeniden gorunup orani yapay dusurur.
 */
export async function ctaFunnel(days = 30): Promise<CtaFunnelRow[]> {
  const since = new Date(Date.now() - days * 86_400_000);

  const rows = (await db
    .select({
      placement: hfCtaEvents.placement,
      device:    hfCtaEvents.device,
      event:     hfCtaEvents.event,
      n:         sql<number>`COUNT(DISTINCT ${hfCtaEvents.visitorHash})`,
    })
    .from(hfCtaEvents)
    .where(and(gte(hfCtaEvents.createdAt, since)))
    .groupBy(hfCtaEvents.placement, hfCtaEvents.device, hfCtaEvents.event)) as Array<{
    placement: string; device: string; event: string; n: number;
  }>;

  const byKey = new Map<string, CtaFunnelRow>();
  for (const r of rows) {
    const key = `${r.placement}|${r.device}`;
    let row = byKey.get(key);
    if (!row) {
      row = {
        placement: r.placement, device: r.device,
        impression: 0, focus: 0, submit: 0, success: 0,
        conversionPct: null, engagePct: null,
      };
      byKey.set(key, row);
    }
    if (r.event in row) (row as unknown as Record<string, number>)[r.event] = Number(r.n);
  }

  const pct = (part: number, whole: number) =>
    whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;

  return [...byKey.values()]
    .map((r) => ({
      ...r,
      conversionPct: pct(r.success, r.impression),
      engagePct:     pct(r.focus, r.impression),
    }))
    .sort((a, b) => b.impression - a.impression);
}
