# Arama talebi maskeli profil özeti kabulü — 14 Ağustos 2026

- Yetkili `GET /api/v1/listings/call-requests/contact-summary` eklendi.
- Endpoint kullanıcı/profil telefonunu sunucuda birleştirir; istemciye hiçbir zaman tam telefon dönmez.
- Örnek maske biçimi: `05** *** ** 67`; yalnız ilk mobil hane ve son iki hane görünür.
- Yanıt sözleşmesi: `maskedPhone`, `phonePresent`, `accountVerified`.
- İlan arama talebi formu maskeli özeti gösterir; telefon yoksa kullanıcıyı kendi profil sayfasına yönlendirir.
- Yetkisiz canlı istek: HTTP 401.
- Geçici, 5 dakika geçerli imzalı kullanıcı oturumuyla canlı kabul: `maskedFormat=true`, `phonePresent=true`, `fullPhoneAbsent=true`. Test sırasında token ve ham telefon çıktıya yazdırılmadı.
- Saf maskeleme + public redaction testleri: 6/6 geçti.
- Backend TypeScript build ve frontend Next.js 16.2.12 production build başarılı; backend/frontend PM2 reload edildi.
