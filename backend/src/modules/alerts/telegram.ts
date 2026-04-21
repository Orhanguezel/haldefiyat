import { env } from "@/core/env";

/**
 * Telegram Bot API uzerinden mesaj gonderir.
 * Token bos ise sessizce atlar (development icin).
 */
export async function sendTelegramAlert(chatId: string, text: string): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.warn("[alerts:telegram] TELEGRAM_BOT_TOKEN tanimli degil, atlandi");
    return;
  }

  const maskedToken = token.split(":")[0] + ":*****";
  console.log(`[alerts:telegram] Sending to ${chatId} using ${maskedToken}`);

  if (!chatId || !text) return;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    const resBody = await res.text().catch(() => "");
    if (!res.ok) {
      console.warn(`[alerts:telegram] HTTP ${res.status} — ${resBody.slice(0, 200)}`);
    } else {
      console.log(`[alerts:telegram] Success: ${resBody.slice(0, 100)}`);
    }
  } catch (err) {
    console.warn("[alerts:telegram] gonderim hatasi:", err instanceof Error ? err.message : String(err));
  }
}
