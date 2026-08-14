# Satıcı Arama Tercihleri — Canlı Kabul (14 Ağustos 2026)

## Uygulanan sözleşme

- İlan sahibi ilan oluştururken arama talebini açıp kapatabilir.
- Talep açıksa `en kısa sürede`, `09:00–12:00`, `12:00–17:00` ve
  `17:00–20:00` seçeneklerinden en az birini belirler.
- Public API yalnız kabul durumu ve uygun zaman kodlarını döndürür; telefon ve
  ham veri dönmez.
- Backend, kapalı ilanda `call_requests_disabled`, satıcının seçmediği zamanda
  `slot_unavailable` yanıtı verir. Bu nedenle kural yalnız istemci filtresine
  bağlı değildir.
- Bağlı satıcı hesabı bulunmayan Telegram kaynaklı ilanlarda arama talebi
  varsayılan kapalıdır; sahipsiz geri arama talebi oluşturulmaz.

## Test ve build

- Backend odaklı testler: 2 dosya, 7 test, 7 başarılı.
- Backend production TypeScript build: başarılı.
- Frontend Next.js 16.2.12 production build: başarılı.
- Migration `20260814_add_listing_call_preferences.sql` canlı veritabanına
  sütun-varlık kontrolünden sonra bir kez uygulandı.

## Deploy ve canlı doğrulama

- Kod: `9efa0c0f` ve Telegram uyumluluk düzeltmesi `71c22405`.
- İzole release: `.next-release-71c2240`; standalone `server.js` ve release
  static dizini restart öncesi doğrulandı.
- `hal-backend` reload, `hal-frontend` restart sonrası ikisi de `online`.
- `/`, `/ilanlar`, `/ilan-ver`: HTTP 200.
- Canlı public liste API sonucu: `contactPhone:null`, `raw:null`,
  `callRequestsEnabled` mevcut, `callAvailability` dizi ve varsayılan dört slot.
- 390×844 gerçek tarayıcı kabulü: yatay taşma yok, `tel:` bağlantısı yok,
  arama bölümü ve mobil sticky CTA görünür, console hata/uyarı sayısı 0.
- Görsel kanıt: `.playwright-cli/page-2026-08-14T00-10-59-895Z.png`.

## Sonuç

F1.17 ile ilan detayının P4.65, P4.67, P4.68, P4.69 ve public telefon
sözleşmesinin P4.71 kabul ölçütleri karşılandı.
