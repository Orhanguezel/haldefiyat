/** Telegram teslimi Tanitio'nun sifreli `haldefiyat` tenant ayarindan yapilir. */
import { sendTanitioNotification } from "@/modules/tanitio-notifications/client";

/**
 * Telegram HTML modunda kacisma.
 *
 * Bildirimler `parse_mode=html` ile gidiyor ve Telegram metni chat kontrolunden
 * ONCE ayristiriyor: icinde kacissiz `<` veya `&` gecen tek bir alan tum mesaji
 * 400 ile dusuruyor ("can't parse entities"). Cagri yerleri hatayi yuttugu icin
 * bildirim sessizce kayboluyordu — "fiyat < 5 TL" yazan bir teklif hic
 * ulasmiyordu.
 *
 * Literal metinde kasitli etiket (`<b>`, `<a href>`) kullanilabilsin diye kacis
 * sablon ETIKETINDE yapilir: `tgHtml` yalnizca ARA DEGERLERI kacislar.
 */
export function escapeTgHtml(value: unknown): string {
  return String(value ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]!);
}

export function tgHtml(parts: TemplateStringsArray, ...values: unknown[]): string {
  return parts.reduce((out, part, i) => out + part + (i < values.length ? escapeTgHtml(values[i]) : ""), "");
}

export async function sendTelegramAlert(chatId: string, text: string): Promise<void> {
  const ok = await sendTanitioNotification({ target: "recipient", chatId, text, parseMode: "html" });
  if (!ok) throw new Error("Tanitio Telegram alici bildirimi teslim edilemedi");
}

export async function sendTelegramAdminAlert(text: string): Promise<void> {
  const ok = await sendTanitioNotification({ target: "admin", text, parseMode: "html" });
  if (!ok) throw new Error("Tanitio Telegram yonetici bildirimi teslim edilemedi");
}
