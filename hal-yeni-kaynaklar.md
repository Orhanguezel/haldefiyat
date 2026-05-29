# Yeni Kaynak İncelemesi — halkatalogu.com (firma dizini)

> İnceleme: 2026-05-29. Soru: tüm hallerdeki firmaları buradan çekebilir miyiz? Microservis gerekir mi?

## Verdict: ✅ EVET çekilebilir — microservis GEREKMEZ

Site anti-bot'suz, **server-rendered HTML**, düz `curl --compressed` ile HTTP 200.
Mevcut Scrapling `scraper-service`'e gerek yok (o, JS-render/anti-bot fiyat siteleri için).
Telefon **görsel değil metin** → OCR yok. Basit fetch + HTML parse yeterli.

## URL Yapısı (enumerasyon)

| Seviye | Pattern | Örnek | Not |
|---|---|---|---|
| İl listesi | `/il/{slug}` | `/il/adana` | 81 il (dropdown `<option value="adana">`) |
| İl + sayfa | `/il/{slug}?sayfa=N` | `/il/istanbul?sayfa=2` | ~40 firma/sayfa. **DİKKAT: param gerçekten farklı sonuç dönüyor mu, impl'de doğrula** |
| İl + ilçe | `/il/{slug}/{ilce}` | `/il/adana/kozan` | alt-kırılım |
| İl + kategori | `/il/{slug}/{kategori}` | `/il/adana/kavun-karpuz`, `/sevkiyat` | ürün/hizmet filtresi |
| Firma detay | `/hal/{id}-{slug}` | `/hal/334-babacan-45`, `/hal/2056-topuzlar-komisyon-evi` | id sayısal |
| Ek dizinler | `/soguk-hava-depolari`, `/nakliyeciler`, `/zirai-ilac` | — | bonus domainler |

## Firma Detay Alanları (text, parse edilebilir)
- Firma adı (`<h1>`), **Yetkili** (kişi), **Adres**, **Telefon**
- Firma fotoğrafı: `/img/hal/{uploadId}.jpg` (telefon DEĞİL — fotoğraf)
- İl/ilçe/kategori bağlamı URL'den

## Ölçek (sayfa-1 örnekleri)
İstanbul 40+, Adana 37, Bursa 23, Ankara 19, Antalya 18, İzmir 14. Pagination'lı büyük iller dahil
tahmini **~2.500–4.000 firma**.

## Önerilen Mimari (microservis YOK)

hal-fiyatlari backend'inde yeni domain modülü — fiyat ETL pattern'inin aynısı:

1. **DB:** `hf_firms` (id, external_id, slug, name, contact_person, address, phone, city_slug,
   district_slug, categories JSON, source_url, raw JSON, is_active, created/updated) — seed SQL'e CREATE.
   Opsiyonel `hf_firm_categories` (soğuk hava / nakliye / zirai ilaç ayrımı).
2. **ETL modülü** `backend/src/modules/firms/`:
   - `fetcher.ts`: 81 il slug → `/il/{slug}?sayfa=N` (boş sayfaya kadar) → `/hal/{id}-...` linkleri topla → detay fetch → parse.
   - `repository.ts`: external_id (URL'deki id) ile upsert. Idempotent.
   - `index.ts`: public `GET /api/v1/firms?city=&q=`, `GET /firms/:slug`; admin `POST /admin/firms/etl/run`.
3. **Cron:** firma verisi yavaş değişir → haftalık/aylık (fiyat ETL'i gibi `cron.ts`'e ekle).
4. **Fetch:** düz `Bun.fetch` + gzip. Nazik ol: il-içi gecikme (~500ms), User-Agent set, retry.

## Frontend Değeri
- Her `/hal/{market}` sayfasında "Bu haldeki firmalar" bölümü.
- Yeni `/firmalar` dizini (il/ilçe/kategori filtreli) → SEO + B2B trafiği.
- İleride: firma ↔ ürün eşleştirme (hangi firma neyi satıyor).

## Riskler / Dikkat
- **ToS/atıf:** kamuya açık dizin ama içerik 3. tarafın. Toplu çekimde kaynak/atıf + nazik rate-limit.
  Ticari yeniden yayında hukuki gözden geçir.
- Pagination'ın gerçekten farklı sonuç döndürdüğü doğrulanmalı (yoksa il-içi tam kapsama eksik kalır).
- robots.txt yok (404) → teknik engel yok, ama "izin var" anlamına gelmez; nazik davran.
