/** Telegram teslimi Tanitio'nun sifreli `haldefiyat` tenant ayarindan yapilir. */
import { sendTanitioNotification } from "@/modules/tanitio-notifications/client";

export async function sendTelegramAlert(chatId: string, text: string): Promise<void> {
  const ok = await sendTanitioNotification({ target: "recipient", chatId, text, parseMode: "html" });
  if (!ok) throw new Error("Tanitio Telegram alici bildirimi teslim edilemedi");
}

export async function sendTelegramAdminAlert(text: string): Promise<void> {
  const ok = await sendTanitioNotification({ target: "admin", text, parseMode: "html" });
  if (!ok) throw new Error("Tanitio Telegram yonetici bildirimi teslim edilemedi");
}
