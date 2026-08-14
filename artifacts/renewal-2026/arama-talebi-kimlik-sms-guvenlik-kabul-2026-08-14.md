# Arama Talebi Kimlik, SMS ve Endpoint Güvenlik Kabulü — 14 Ağustos 2026

## Sonuç

Arama talebi yalnız giriş yapmış ve doğrulanmış kimlikle oluşturulabilir. Canlıda SMS
sağlayıcısı pasif olduğu için MVP doğrulanmış e-posta hesabını kullanır; Google hesabıyla
giriş e-posta sahipliğini doğrular. Netgsm etkinleştirildiğinde aynı akış kullanıcıya bağlı,
15 dakika ömürlü HMAC OTP tokenını kabul eder. Telefonlar public DTO, talep kaydı,
Telegram bildirimi ve analitik olayına eklenmez.

## Canlı yapılandırma keşfi

Gizli değerler yazdırılmadan yalnız varlık/flag kontrolü yapıldı:

- `SMS_PROVIDER=none`.
- `NETGSM_USERCODE`, `NETGSM_PASSWORD`, `NETGSM_MSGHEADER`: tanımlı değil.
- `LISTING_REQUIRE_PHONE_OTP=false`.
- Telegram admin kanalı: aktif.
- SMTP host/kullanıcı/parola: aktif.

Bu nedenle yeni SMS sistemi kurulmadı ve Netgsm aktifmiş gibi davranılmadı.

## Kapatılan güvenlik açığı

Eski davranış production ortamında `SMS_PROVIDER=none` iken OTP gönderimini başarılı
sayabiliyor ve geliştirme loguna telefon/kod yazabiliyordu. Yeni davranış:

- Production `none` ve eksik Netgsm kimlik bilgisi fail-closed.
- Başarısız teslimde `503 sms_unavailable` dönüyor.
- SMS kabul edilmeden doğrulama satırı yazılmıyor; başarısız deneme günlük telefon
  kotasını kirletmiyor.
- Production loguna telefon veya OTP kodu yazılmıyor.
- OTP send 10/saat/IP, verify 20/saat/IP ve her ikisi de auth korumalı.
- Telefon bazında 60 saniye, günde 5; kodda 5 yanlış deneme ve 5 dakika TTL kuralları
  korunuyor.

## Kullanıcıya bağlı OTP kimliği

- `hf_phone_verifications.user_id` additive migration ile eklendi ve indekslendi.
- OTP kaydı auth kullanıcısına bağlanıyor.
- İmzalı token `phone + userId + exp` taşıyor; JWT secret üzerinden HMAC-SHA256 ile
  sabit-zamanlı doğrulanıyor.
- Token en fazla 2.048 karakter, 15 dakika ömürlü ve başka kullanıcı tarafından tekrar
  kullanılamıyor.
- Bozuk JSON, yanlış imza, değiştirilmiş ve süresi geçmiş token reddediliyor.
- Call-request endpoint'i doğrulanmış e-posta veya aynı kullanıcıya bağlı geçerli OTP
  kimliği yoksa `403 account_verification_required` dönüyor.

JWT ve cookie secretları production fallback olmadan zorunlu kalır. Public signup rolü
`customer/komisyoncu` allowlist'iyle sınırlıdır; yalnız sunucu `ADMIN_EMAILS` allowlist'i
admin rolü verebilir, istemci `admin/editor` seçemez.

## Canlı yan etkisiz kabul

Yeni release: `2e32cb55`, backend/frontend online, public health ve ilan sayfası HTTP 200.

- Auth olmayan `POST /listings/otp/send`: `401`.
- Auth olan fakat SMS kapalı OTP send: `503 sms_unavailable`.
- Aynı telefon için doğrulama satırı: istek öncesi `0`, sonrası `0`.
- Doğrulanmamış aktif hesapla uygun ilana call-request: `403 account_verification_required`;
  talep oluşturma ve bildirim aşamasına geçilmedi.
- Canlı şemada `hf_phone_verifications.user_id` mevcut ve nullable additive alan.

## Otomatik ve görsel kabul

- Call-request consent/status/kimlik/token testleri ve maskeli telefon testleri: 7/7.
- Backend TypeScript ve production build: geçti.
- Frontend TypeScript, hedef ESLint ve isolated production build: geçti.
- 390 x 844 mobil doğrulama paneli: `scrollWidth=clientWidth=390`.
- Görünür metin SMS'in kapalı olduğunu ve güvenli Google giriş yolunu açıkça söylüyor.

Görsel kanıt:
`output/playwright/e22-e24/unverified-call-request-mobile-2026-08-14.png`

Kod commitleri: `bf79bcc1`, `2e32cb55`.
