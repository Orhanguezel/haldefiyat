import { unsubUrl } from "./token";

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://haldefiyat.com").replace(/\/$/, "");
}

export function buildWelcomeEmail(email: string): { subject: string; html: string } {
  const site = siteUrl();
  const subject = "HaldeFiyat Bültenine Hoş Geldin 🌱";
  const html = `<!DOCTYPE html>
<html lang="tr"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="padding:20px 24px;border-bottom:2px solid #16a34a;">
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;color:#16a34a;">HaldeFiyat</div>
      <h1 style="margin:6px 0 0;font-size:20px;color:#0f172a;">Aboneliğin oluştu ✓</h1>
    </div>
    <div style="padding:24px;color:#374151;font-size:14px;line-height:1.6;">
      <p style="margin:0 0 14px;">Her <strong>Pazartesi sabahı</strong> Türkiye hallerinden haftalık fiyat özetini sana göndereceğiz:
      en çok değişen ürünler, geçen yıla göre karşılaştırma ve hal notları.</p>
      <p style="margin:0;">
        <a href="${site}/canli-hal-fiyatlari" style="display:inline-block;margin-top:6px;padding:10px 18px;background:#16a34a;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:13px;">Canlı fiyatlara göz at →</a>
      </p>
    </div>
    <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;text-align:center;">
      Bu bülteni sen istedin. İstemiyorsan <a href="${unsubUrl(email)}" style="color:#6b7280;">tek tıkla abonelikten çıkabilirsin</a>.
    </div>
  </div>
</body></html>`;
  return { subject, html };
}
