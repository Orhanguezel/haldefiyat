import { sendTelegramAdminAlert, tgHtml } from '@/modules/alerts/telegram';

export type FeatureTransferNotification = {
  listingId: number;
  title: string;
  days: number;
  amount: number;
  reference: string;
  senderName?: string;
  transferDate?: string;
};

const adminUrl = 'https://haldefiyat.com/admin/ilanlar?tab=transfers';
const amount = (value: number) => new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
}).format(value);

export function featureTransferAdminMessage(
  event: 'created' | 'reported',
  item: FeatureTransferNotification,
) {
  if (event === 'reported') {
    return (
      '🚨 <b>Havale bildirildi — banka kontrolü gerekli</b>\n\n' +
      tgHtml`İlan: #${item.listingId} · ${item.title}\n` +
      tgHtml`Paket: ${item.days} gün · ${amount(item.amount)}\n` +
      tgHtml`Gönderen: ${item.senderName ?? '-'}\n` +
      tgHtml`Transfer tarihi: ${item.transferDate ?? 'Belirtilmedi'}\n` +
      tgHtml`Açıklama kodu: ${item.reference}\n\n` +
      'Ödemeyi onaylamadan önce banka hareketini doğrulayın.\n' +
      adminUrl
    );
  }

  return (
    '💳 <b>Yeni ilan öne çıkarma havale talebi</b>\n\n' +
    tgHtml`İlan: #${item.listingId} · ${item.title}\n` +
    tgHtml`Paket: ${item.days} gün · ${amount(item.amount)}\n` +
    tgHtml`Açıklama kodu: ${item.reference}\n\n` +
    'Durum: Üyenin havaleyi göndermesi bekleniyor. Şu an banka kontrolü gerekmiyor.\n' +
    adminUrl
  );
}

export async function notifyAdminFeatureTransfer(
  event: 'created' | 'reported',
  item: FeatureTransferNotification,
) {
  const text = featureTransferAdminMessage(event, item);
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await sendTelegramAdminAlert(text);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, attempt * 300));
    }
  }
  throw lastError;
}
