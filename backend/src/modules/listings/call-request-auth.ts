/**
 * Arama talebi kimlik kapısı.
 *
 * Canlıda SMS kapalıyken doğrulanmış e-posta hesabı yeterlidir. SMS açıldığında aynı
 * HMAC/TTL OTP tokenı da kullanılabilir; ham telefon controller cevabına veya talep
 * kaydına eklenmez.
 */
export function hasVerifiedCallRequestIdentity(input: {
  accountVerified: boolean;
  otpPhone: string | null;
}): boolean {
  return input.accountVerified || Boolean(input.otpPhone);
}
