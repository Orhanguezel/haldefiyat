import { sendBereketMail } from "@agro/shared-backend/core/mail";

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
  const dashboardUrl = `https://haldefiyat.com/dashboard/ilanlarim`;
  const safeTitle = escapeHtml(input.listingTitle);
  const safeNote = input.note ? escapeHtml(input.note) : null;
  return retryCallRequestDelivery(() => sendBereketMail({
    to: input.to,
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
