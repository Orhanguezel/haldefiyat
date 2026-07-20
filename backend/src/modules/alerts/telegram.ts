/**
 * Operasyonel Telegram uyarisi — ortak pakete tasindi.
 *
 * Gonderim mantigi artik `@agro/shared-backend/modules/telegram` icindeki `sendOpsAlert`
 * fonksiyonunda. Buradaki ince sarmalayici, mevcut cagrilarin (alerts, wayback-monitor,
 * etl/health) imzasini korumak icin duruyor — tek seferde toplu import degisikligi
 * yapilmiyor (bkz. ekosistem CLAUDE.md: canli projelerde modul modul gecis).
 *
 * Neden ortak pakete tasindi: ekosistem taramasinda dort projede TELEGRAM_BOT_TOKEN
 * tanimliydi ama chat id yoktu — bot vardi, uyari gidecek yer yoktu. Ortak yardimci
 * fallback zinciriyle (OPS_ALERT_TELEGRAM_CHAT_IDS > ETL_HEALTH_TELEGRAM_CHAT_IDS >
 * TELEGRAM_ADMIN_CHAT_ID > TELEGRAM_CHAT_ID) bunu tek yerden cozuyor.
 */

import { sendOpsAlert } from "@agro/shared-backend/modules/telegram";

export async function sendTelegramAlert(chatId: string, text: string): Promise<void> {
  const result = await sendOpsAlert(text, { chatIds: chatId });
  if (result.skipped) {
    console.warn(`[alerts:telegram] atlandi — ${result.reason}`);
  }
}

export { sendOpsAlert };
