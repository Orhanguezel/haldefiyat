# Codex Brief — Dönüşüm Değeri ve Kayıp Ölçümü

**Tarih:** 14 Ağustos 2026 · **Tasarım:** Claude (mimar) · **Onay:** Orhan
**Bağlam:** Reklam harcaması YOK (kampanya PAUSED). Amaç Ads optimizasyonu değil;
"hangi tıklama bize fayda sağlıyor, ziyaretçiyi nerede kaybediyoruz" sorusuna
haftalık, bakılabilir tek cevap üretmek.

## Mevcut altyapı — ÜZERİNE İNŞA ET, yenisini kurma

- `docs/ANALYTICS-EVENT-SOZLESMESI.md` — event sözlüğü + PII yasağı (bağlayıcı).
- `hf_cta_events` — birinci taraf KPI kaydı (placement + kısa olay adı + günlük hash).
- `/admin/analytics/product-kpis` — fiyat bulma süresi, arama başarısı, sıfır sonuç.
- Huniler canlı: `search_*`, `price_filter_*`, `call_request_*`, newsletter funnel paneli.
- `audit_request_logs` — is_bot/is_internal ayrımlı istek kaydı, attribution kolonları.
- Telegram bildirim altyapısı (`telegram-channel` modülü) — haftalık özet buradan gider.

## İş 1 — Dönüşüm tanımları ve değer puanı

Tek kaynaklı config (backend, örn. `src/config/conversions.ts`); her dönüşüme ad,
event kaynağı ve **değer puanı** (TL değil, göreli ağırlık):

| Dönüşüm | Kaynak event | Puan |
|---|---|---|
| API anahtar başvurusu | keys modülü | 15 |
| Arama talebi (call_request_submit) | mevcut | 10 |
| İlan oluşturma | listings | 10 |
| Firma lead / claim başvurusu | firms | 10 |
| Bülten aboneliği | newsletter subscribe | 5 |
| Fiyat alarmı kurulumu | alerts | 5 |
| İletişim formu | contact | 3 |
| CSV export | mevcut cta | 2 |
| Ürün fiyat görüntüleme (price_viewed) | mevcut | 1 |

Puanlar config'te; kod içine dağıtma. Haftalık toplam puan = "site bu hafta ne
kadar fayda üretti" tek sayısı.

## İş 2 — Kayıp (drop-off) raporu

Haftalık pencere, oran + mutlak sayı birlikte:

1. `search_submitted → zero_results` oranı (ürün bulunamıyor = envanter/alias kaybı).
2. `search_result_selected → price_viewed` düşüşü.
3. `call_request_view → call_request_submit` düşüşü (form kaybı).
4. `call_request_submit → accepted/completed` düşüşü (satıcı tarafı kaybı).
5. Bülten form görüntüleme → subscribe düşüşü.
6. 404/410'a düşen iç tıklamalar (audit'ten; en çok kaybettiren 10 URL).
7. Filtre `price_filter_zero_results` en sık kombinasyonlar.

## İş 3 — Kaynak kırılımı (PII'siz)

Referrer SINIFI bazında (organik arama / direct / sosyal / harici site / iç):
ziyaret → dönüşüm puanı. gclid/Ads importu YOK (harcama yok; AW tag'i uykuda kalsın).
Ham referrer URL'si saklanmaz, yalnız sınıf + eTLD+1.

## İş 4 — Yüzeyler

- `/admin/analytics/donusum` tek sayfa: haftalık değer puanı trendi, dönüşüm
  tablosu, 7 kayıp metriği, kaynak kırılımı. Mevcut product-kpis sayfa desenini kopyala.
- Haftalık Telegram özeti (Pazartesi 09:00 TSİ, cron): toplam puan, en iyi 3
  dönüşüm, en kötü 3 kayıp, geçen haftayla fark. Mevcut telegram kanalına.

## Kesin kurallar

- Yeni event eklenecekse ÖNCE `ANALYTICS-EVENT-SOZLESMESI.md` + allowlist + PII testi.
- Yeni tablo/kolon gerekiyorsa hem migration hem **seed SQL** güncellenir
  (migration-only şema YASAK — 2026-08-14 hf_listing_call_requests vakası).
- PII yasak: telefon/e-posta/ad/serbest metin/ham query hiçbir rapora girmez.
- GA4 bu sistemin bağımlılığı DEĞİL; birinci taraf veri esastır. GA4 property
  (ekosistem-sosyal hub'ından açılacak) yalnız doğrulama katmanı olarak eklenir.
- Eşik: haftalık <30 dönüşüm örnekleminde yüzde yerine "veri birikiyor" göster
  (product-kpis'teki desenle aynı).
