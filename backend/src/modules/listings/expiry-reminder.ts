/**
 * Ilan suresi dolmadan once uzatma hatirlatmasi.
 *
 * Neden: public ilan listesi `valid_until >= CURRENT_DATE()` filtresiyle calisir ve bir
 * expire cron'u suresi geceni `expired` yapar. Yani ilan sessizce yayindan kalkar; sahibine
 * hicbir sey soylenmez. 2026-07-20'de sitedeki TEK ilanin suresi o gun doluyordu — kimse
 * haberdar degildi ve ertesi gun ilan sayfasi bosalacakti.
 *
 * Mevcut bir ilani kaybetmek, yeni ilan kazanmaktan kolay: bu yuzden hatirlatma,
 * ilan sayisini artirma isinin ilk adimi.
 */

import { and, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfListingReminders, hfListings } from "@/db/schema";
import { sendBereketMail } from "@agro/shared-backend/core/mail";

/** Suresi dolmadan kac gun once hatirlatilacak. */
const DAYS_BEFORE = 3;
const KIND = "expiry_3d";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://haldefiyat.com").replace(/\/$/, "");

export interface ExpiryReminderResult {
  candidates: number;
  sent:       number;
  failed:     number;
}

function esc(v: string): string {
  return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHtml(input: { name: string; title: string; slug: string; validUntil: string }): string {
  const date = new Date(`${input.validUntil}T12:00:00Z`).toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="padding:20px 24px;border-bottom:2px solid #16a34a;">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#16a34a;">İlan Hatırlatması</div>
      <h1 style="margin:6px 0 0;font-size:20px;color:#0f172a;">İlanınızın süresi ${DAYS_BEFORE} gün sonra doluyor</h1>
    </div>
    <div style="padding:24px;color:#374151;font-size:14px;line-height:1.7;">
      <p style="margin:0 0 16px;">Merhaba ${esc(input.name)},</p>
      <p style="margin:0 0 16px;">
        <strong>${esc(input.title)}</strong> başlıklı ilanınızın geçerlilik tarihi
        <strong>${date}</strong>. Bu tarihten sonra ilan yayından kalkar ve alıcılar tarafından görülmez.
      </p>
      <p style="margin:0 0 20px;">Ürününüz hâlâ satılıktaysa tek tıkla süresini uzatabilirsiniz.</p>
      <a href="${SITE_URL}/hesabim/ilanlarim"
         style="display:inline-block;background:#16a34a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:6px;font-weight:600;">
        İlanımı uzat
      </a>
      <p style="margin:22px 0 0;font-size:13px;color:#6b7280;">
        İlanı görüntülemek için:
        <a href="${SITE_URL}/ilan/${encodeURIComponent(input.slug)}" style="color:#16a34a;">${esc(input.title)}</a>
      </p>
      <p style="margin:12px 0 0;font-size:13px;color:#6b7280;">
        Ürününüz satıldıysa bir şey yapmanıza gerek yok; ilan kendiliğinden yayından kalkar.
      </p>
    </div>
    <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-align:center;">
      HaldeFiyat · İlanlar ücretsizdir, komisyon alınmaz.
    </div>
  </div>
</body></html>`;
}

/**
 * Suresi `DAYS_BEFORE` gun sonra dolacak onayli ilanlarin sahiplerine mail atar.
 *
 * `hf_listing_reminders` UNIQUE(listing_id, kind) sayesinde ayni ilan icin ikinci mail
 * gitmez — cron iki kez calissa da, deploy sirasinda tekrar tetiklense de guvenli.
 */
export async function sendListingExpiryReminders(): Promise<ExpiryReminderResult> {
  const rows = await db.execute(sql`
    SELECT l.id, l.slug, l.title, l.valid_until AS validUntil,
           COALESCE(NULLIF(l.contact_name, ''), u.full_name, 'İlan sahibi') AS name,
           u.email AS email
    FROM hf_listings l
    JOIN users u ON u.id = l.user_id
    LEFT JOIN hf_listing_reminders r ON r.listing_id = l.id AND r.kind = ${KIND}
    WHERE l.status = 'approved'
      AND l.valid_until = CURDATE() + INTERVAL ${DAYS_BEFORE} DAY
      AND r.id IS NULL
      AND u.email IS NOT NULL AND u.email <> ''
  `);

  const list = (Array.isArray(rows) ? rows[0] : rows) as unknown as Array<{
    id: number; slug: string; title: string; validUntil: unknown; name: string; email: string;
  }>;

  const out: ExpiryReminderResult = { candidates: list.length, sent: 0, failed: 0 };

  for (const item of list) {
    const validUntil = String(item.validUntil).slice(0, 10);
    try {
      await sendBereketMail({
        to: item.email,
        subject: `İlanınızın süresi ${DAYS_BEFORE} gün sonra doluyor — ${item.title}`,
        html: buildHtml({ name: item.name, title: item.title, slug: item.slug, validUntil }),
      });

      // Once mail, sonra kayit: kayit atilip mail gitmemesindense, mail gidip kayit
      // atilamamasi yeglenir (ikinci mail riski, hic gitmemesinden iyi).
      await db.insert(hfListingReminders).values({ listingId: item.id, kind: KIND });
      out.sent++;
    } catch (err) {
      out.failed++;
      console.warn(
        `[listing-expiry] ${item.slug} hatirlatmasi gonderilemedi:`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  return out;
}

void and;
void eq;
void isNull;
