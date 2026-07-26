# HalDeFiyat DNS E-posta Kimlik Doğrulama Denetimi — 2026-07-26

## Gönderen envanteri

- Canlı backend SMTP host: `smtp.resend.com`
- Port: `465`
- Envelope/API sağlayıcısı: Resend
- Görünür From: `HaldeFiyat <noreply@haldefiyat.com>`
- Kod yolları:
  - Fiyat alarmı e-postaları: `backend/src/modules/alerts/email.ts`
  - Newsletter ve test e-postaları:
    `backend/src/modules/notifications/weekly-mail-digest.ts`
  - Ortak transactional mail çağrıları:
    `@agro/shared-backend/core/mail`
- Kod ve canlı environment envanterinde ikinci bir SMTP/API sağlayıcısı
  bulunmadı. SMTP parolası veya API anahtarı rapora alınmadı.

## DNS doğrulaması

| Kayıt | Canlı değer | Sonuç |
|---|---|---|
| `TXT send.haldefiyat.com` | `v=spf1 include:amazonses.com ~all` | Tek SPF kaydı, Resend Return-Path için mevcut |
| `MX send.haldefiyat.com` | `10 feedback-smtp.sa-east-1.amazonses.com.` | SPF/MX bölgesi mevcut |
| `TXT resend._domainkey.haldefiyat.com` | Resend RSA public key | DKIM DNS anahtarı mevcut |
| `TXT _dmarc.haldefiyat.com` | `v=DMARC1; p=none;` | Gözlem politikası var, `rua` yok |
| `TXT haldefiyat.com` | Yalnız Google site verification | Kök SPF yok; mevcut Resend Return-Path modeli için ikinci SPF eklenmemeli |

Resend’in resmi alan adı modelinde SPF ve MX kayıtları varsayılan olarak `send`
Return-Path alt alanında, DKIM ise `resend._domainkey` altında tanımlanır.
Dolayısıyla kökte SPF bulunmaması tek başına hata değildir; köke ikinci ve
gereksiz SPF eklemek yerine gerçek envelope alanındaki tek kayıt korunmalıdır.

## Açık kabul

- DNS’te DKIM public key bulunması, gerçek iletinin `DKIM-Signature` ve
  `Authentication-Results` header’ında `dkim=pass` kanıtı değildir.
- Gerçek test mesajı alınabilecek bir mailbox veya mail-tester adresiyle SPF,
  DKIM ve DMARC alignment birlikte doğrulanmalıdır.
- DMARC raporlarının gideceği kontrollü mailbox belirlenmeden `rua` uydurulmaz.
- `rua` eklendikten sonra en az yedi günlük rapor incelenmeden `quarantine` veya
  `reject` politikasına geçilmez.

## 27 Temmuz canlı test gönderimi

- Canlı backend ile aynı `smtp.resend.com:465` ayarları kullanılarak yapılandırılmış
  yönetici Gmail adresine benzersiz bir kimlik doğrulama iletisi gönderildi.
- UTC zaman: `2026-07-26T22:41:45.499Z`
- SMTP sonucu: `accepted=1`, `rejected=0`
- Message-ID:
  `<40b5618c-176a-3c08-ba8f-bd2efbff881f@haldefiyat.com>`
- Bu sonuç Resend'in mesajı kabul ettiğini kanıtlar; alıcı tarafındaki
  `Authentication-Results` başlığı görülmeden SPF/DKIM/DMARC aligned-pass
  maddesi kapatılmaz.
- Gmail bağlantısı önerildi. Bağlantı sağlandığında yukarıdaki Message-ID ile
  ileti bulunup ham başlık kanıtı bu dosyaya eklenecek.

## DNS yönetimi durumu

- Yetkili nameserver'lar `dns1.turhost.com` ve `dns2.turhost.com`.
- Proje ve canlı sunucuda Turhost DNS API/oturum anahtarı bulunmadı.
- Kontrollü bir DMARC rapor posta kutusu da yapılandırmada tanımlı değil.
  Bu nedenle rastgele `rua` adresi yazılmadı ve yetkisiz DNS değişikliği
  denenmedi.

## Tekrar komutları

```bash
dig +short TXT send.haldefiyat.com
dig +short MX send.haldefiyat.com
dig +short TXT resend._domainkey.haldefiyat.com
dig +short TXT _dmarc.haldefiyat.com
```
