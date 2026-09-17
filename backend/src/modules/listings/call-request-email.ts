import { sendBereketMail } from "@agro/shared-backend/core/mail";
import { env } from "@/core/env";

const SLOT_LABELS = {
  asap: "En kısa sürede",
  morning: "09:00–12:00",
  afternoon: "12:00–17:00",
  evening: "17:00–20:00",
} as const;

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

export async function retryCallRequestDelivery(send: () => Promise<unknown>, attempts = 3): Promise<boolean> {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await send();
      return true;
    } catch {
      // SMTP transport zaten timeout uygular. Cron/istek iscisini uyutarak bloke
      // etmemek icin sinirli yeniden denemeler beklemesiz yapilir.
    }
  }
  return false;
}

export async function sendSellerCallRequestEmail(input: {
  to: string;
  listingTitle: string;
  listingSlug: string;
  preferredSlot: keyof typeof SLOT_LABELS;
  note: string | null;
  requestId: number;
}): Promise<boolean> {
  // Panel yolu /hesabim/ilanlarim; /dashboard/ilanlarim 404 veriyordu (17 Eyl 2026).
  const dashboardUrl = `https://haldefiyat.com/hesabim/ilanlarim`;
  const safeTitle = escapeHtml(input.listingTitle);
  const safeNote = input.note ? escapeHtml(input.note) : null;
  return retryCallRequestDelivery(() => sendBereketMail({
    to: input.to,
    // Gonderen adresinin posta kutusu yok; satici yaniti gercek kutuya dussun.
    replyTo: env.CONTACT_EMAIL,
    subject: `Arama talebi: ${input.listingTitle.slice(0, 120)}`,
    text: `İlanınız için ${SLOT_LABELS[input.preferredSlot]} zaman tercihiyle arama talebi geldi. Talep no: ${input.requestId}. ${dashboardUrl}`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17211b">
      <h2>Yeni arama talebi</h2>
      <p><strong>${safeTitle}</strong> ilanınız için güvenli arama talebi geldi.</p>
      <p>Tercih edilen zaman: <strong>${SLOT_LABELS[input.preferredSlot]}</strong></p>
      ${safeNote ? `<p>Not: ${safeNote}</p>` : ""}
      <p>Talep no: ${input.requestId}</p>
      <p><a href="${dashboardUrl}">Talebi panelde inceleyin</a></p>
      <p style="color:#66736b;font-size:12px">Alıcının telefon ve e-posta bilgileri bu bildirimde paylaşılmaz.</p>
    </div>`,
  }), 3);
}


/**
 * Ilana MESAJ/TEKLIF geldiginde saticiya bildirim.
 *
 * Arama talebi icin bu bildirim vardi, mesaj icin yoktu: teklif yalniz ops
 * Telegram kanalina ve admin paneline dusuyordu. Satici paneline girmedigi
 * surece kendisine gelen tekliften haberi olmuyordu (17 Eyl 2026).
 *
 * ALICININ TELEFONU BU E-POSTAYA KONMAZ. Numara panelde gorunur; boylece
 * iletisim bilgisi e-posta kutularinda dolasmaz ve satici en azindan bir kez
 * siteye girer. Harman App de ayni yolu izliyor.
 */
export async function sendSellerInquiryEmail(input: {
  to: string;
  listingId: number;
  listingTitle: string;
  buyerName: string | null;
  offerPrice: number | null;
  message: string | null;
}): Promise<boolean> {
  const url = `https://haldefiyat.com/hesabim/ilanlarim/${input.listingId}`;
  const safeTitle = escapeHtml(input.listingTitle);
  const safeName = input.buyerName ? escapeHtml(input.buyerName) : null;
  const safeMessage = input.message ? escapeHtml(input.message.slice(0, 400)) : null;
  const teklif = input.offerPrice != null && Number.isFinite(input.offerPrice)
    ? input.offerPrice.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : null;

  return retryCallRequestDelivery(() => sendBereketMail({
    to: input.to,
    // Gonderen adresinin posta kutusu yok; satici yaniti gercek kutuya dussun.
    replyTo: env.CONTACT_EMAIL,
    subject: teklif
      ? `Yeni teklif (${teklif} TL): ${input.listingTitle.slice(0, 90)}`
      : `Yeni mesaj: ${input.listingTitle.slice(0, 110)}`,
    text: [
      `"${input.listingTitle}" ilanınıza yeni bir mesaj geldi.`,
      safeName ? `Gönderen: ${input.buyerName}` : null,
      teklif ? `Teklif: ${teklif} TL` : null,
      input.message ? `Mesaj: ${input.message.slice(0, 400)}` : null,
      `İlanınızı açın: ${url}`,
      "Gönderenin telefon numarası güvenlik gereği bu e-postada paylaşılmaz; ilan panelinizde görünür.",
    ].filter(Boolean).join("\n"),
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#17211b">
      <h2>${teklif ? "Yeni teklif geldi" : "Yeni mesaj geldi"}</h2>
      <p><strong>${safeTitle}</strong> ilanınıza bir alıcı ${teklif ? "teklif bıraktı" : "mesaj gönderdi"}.</p>
      ${safeName ? `<p>Gönderen: <strong>${safeName}</strong></p>` : ""}
      ${teklif ? `<p style="font-size:18px">Teklif: <strong>${teklif} TL</strong></p>` : ""}
      ${safeMessage ? `<p>Mesaj: ${safeMessage}</p>` : ""}
      <p><a href="${url}" style="display:inline-block;background:#1f8f3a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">İlanımı aç</a></p>
      <p style="color:#66736b;font-size:12px">Gönderenin telefon numarası güvenlik gereği bu e-postada paylaşılmaz; ilan panelinizde görünür.</p>
    </div>`,
  }), 3);
}
