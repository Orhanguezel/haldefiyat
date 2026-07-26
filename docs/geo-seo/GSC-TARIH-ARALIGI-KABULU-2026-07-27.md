# GSC Tarih Aralığı Canlı Kabulü — 2026-07-27

## Sorun

Google Search Console Search Analytics API'de `startDate` ve `endDate`
kapsayıcıdır. Ortak `getGscDateRange` yardımcısı başlangıç tarihini seçilen gün
sayısının tamamı kadar geri aldığı için aralıklar bir gün fazla üretiliyordu:
`LAST_7_DAYS` 8, `LAST_28_DAYS` 29 ve `LAST_3_MONTHS` 91 takvim günü.
Karşılaştırmalı analitikteki önceki dönem hesabında da aynı sapma vardı.

## Uygulama

- Shared paket:
  `packages/shared-backend/modules/searchConsole/service.ts`
- Önceki dönem:
  `packages/shared-backend/modules/searchConsole/analytics.service.ts`
- Her iki başlangıç hesabı da kapsayıcı sınırlar için `days - 1` gün geri
  alacak biçimde düzeltildi.
- Shared paket commit'i:
  `cef6149 fix(gsc): make date ranges inclusive-exact`

## Doğrulama

Yerel shared-backend TypeScript kontrolü çıkış kodu 0 ile tamamlandı.
27 Temmuz 2026 çalışma tarihinde yerel ve canlı yardımcı aynı sonuçları verdi:

| Seçim | Başlangıç | Bitiş | Kapsayıcı gün |
|---|---:|---:|---:|
| `LAST_7_DAYS` | 2026-07-18 | 2026-07-24 | 7 |
| `LAST_28_DAYS` | 2026-06-27 | 2026-07-24 | 28 |
| `LAST_3_MONTHS` | 2026-04-26 | 2026-07-24 | 90 |

Bitiş tarihinin iki gün geride olması mevcut GSC veri gecikmesi politikasıdır;
bu düzeltme yalnızca kapsayıcı aralığın uzunluğunu kesinleştirir.

## Canlı kabul

- Canlı shared paket HEAD: `cef6149`
- Backend production build: başarılı
- PM2 `hal-backend`: online
- İç `http://127.0.0.1:8091/api/health`: HTTP 200
- Dış `https://haldefiyat.com/api/health`: HTTP 200
- Geçici build dizini geri yüklendi ve geçici ad kalmadı.

İlk smoke denemesinde yanlışlıkla `3002` portu sorgulandı ve bağlantı
kurulamadı. `.env` ile doğrulanan gerçek `8091` portunda kontrol tekrarlandı;
servis ve dış Nginx yanıtları başarılıydı.

## Durum

Bu ayrı teknik bulgu **kapalıdır**. Ana GEO/SEO checklist sayacı etkilenmedi:
61/66 tamamlandı, 5/66 açık.
