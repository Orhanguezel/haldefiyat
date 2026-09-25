import { describe, expect, test } from 'bun:test';
import { featureTransferAdminMessage } from './feature-transfer-notification';

const transfer = {
  listingId: 62,
  title: 'YüCE <grup>',
  days: 7,
  amount: 2000,
  reference: 'HF123',
  senderName: 'Yüce & Ortakları',
  transferDate: '2026-09-25',
};

describe('feature transfer admin notification', () => {
  test('new request is clearly described as waiting, not paid', () => {
    const text = featureTransferAdminMessage('created', transfer);
    expect(text).toContain('Yeni ilan öne çıkarma havale talebi');
    expect(text).toContain('Üyenin havaleyi göndermesi bekleniyor');
    expect(text).toContain('Şu an banka kontrolü gerekmiyor');
    expect(text).toContain('₺2.000,00');
    expect(text).toContain('?tab=transfers');
  });

  test('reported payment asks for bank verification and escapes user content', () => {
    const text = featureTransferAdminMessage('reported', transfer);
    expect(text).toContain('banka kontrolü gerekli');
    expect(text).toContain('YüCE &lt;grup&gt;');
    expect(text).toContain('Yüce &amp; Ortakları');
    expect(text).toContain('Ödemeyi onaylamadan önce banka hareketini doğrulayın');
  });
});
