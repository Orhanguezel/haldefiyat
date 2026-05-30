# İndeksleme Analiz Raporu — 2026-05-25

Kaynak: `haldefiyat.com-Coverage-2026-05-25.zip` (Google Search Console export, 2026-04-20 → 2026-05-18 penceresi)

---

## 1. Tek Cümleyle Tanı

**1141 ürün sayfasının ezici çoğunluğu ETL'den ham gelen düşük kaliteli slug/isimlerden oluşan near-duplicate şablonlar; Google bunları "Keşfedildi - dizine eklenmiş değil" olarak işaretliyor. Teknik bir tarayıcı/render sorunu yok — sorun veri kalitesi ve sayfa üretim stratejisinde.**

---

## 2. GSC Sayisal Özeti

| Tarih | Dizine eklenmedi | Dizine eklenen | Gösterimler |
|---|---:|---:|---:|
| 2026-04-20 | **3** | 2 | 9 |
| 2026-05-11 | **14** | 23 | 79 |
| 2026-05-12 | **1.146** | 68 | 52 |
| 2026-05-18 | **1.301** | 199 | 77 |

→ **11→12 Mayıs arasında 14'ten 1.146'ya sıçrama.** Bu, sitemap'in 1141 ürün sayfası ile şişirildiği gündür (canlı `sitemap.xml` toplam 1185 URL, 1141'i `/urun/...`).

### Önemli sorunlar (GSC kategorileri)

| Sebep | Sayfa |
|---|---:|
| **Keşfedildi - şu anda dizine eklenmiş değil** | **1.137** |
| **Tarandı - şu anda dizine eklenmiş değil** | **143** |
| Doğru standart etikete sahip alternatif sayfa | 8 |
| Yönlendirmeli sayfa | 6 |
| `noindex` etiketi tarafından hariç tutuldu | 4 |
| Bulunamadı (404) | 1 |
| Standart sayfa olmadan kopya | 1 |
| Robots.txt tarafından engellendi | 1 |

**1.137 (keşfedildi-indexlenmedi) ≈ 1.141 (ürün sayfası)** — birebir örtüşme. Asıl yara burada.

---

## 3. Kanıt Tabanlı Kök Nedenler

### 3.1 ETL kaynaklı slug enflasyonu (asıl sebep)

`GET /api/v1/prices/products` çağrısı 1141 ürün döndürüyor. İçerik analizi:

- **747 ürün adı tamamen UPPERCASE** (`A.MARUL`, `ACI ÇARLİ BİBER`) — hal tezgâhı CSV formatı, kimse böyle aramıyor.
- **47 üründe nokta var** (`A.MARUL`, `B.MARUL`).
- **14 ürün tek-harf kısaltma ile başlıyor** (`a-marul`, `b-marul`).
- **53 farklı biber sayfası, 40 domates, 37 elma, 29 marul, 27 üzüm, 22 fasulye, 21 limon, 20 portakal, 19 patates...**

Aynı temel ürün için 20-50 küçük varyant sayfa = **near-duplicate cluster**. Google bunlardan birini (ya hiçbirini) seçer; geri kalanı "düşük katma değer" sayar.

### 3.2 Soft 404 (kritik teknik bug)

```bash
$ curl -o /dev/null -w "%{http_code}\n" https://haldefiyat.com/urun/notexist-zzzz
200
```

[`frontend/src/app/[locale]/(public)/urun/[slug]/page.tsx:94-100`](frontend/src/app/%5Blocale%5D/%28public%29/urun/%5Bslug%5D/page.tsx#L94-L100) — ürün bulunamadığında `notFound()` çağrılmıyor, JSX render ediliyor → **200 OK + "Ürün bulunamadı" mesajı**. Google bunu sonsuz çöp URL'ye çeviriyor.

### 3.3 Case-insensitive duplicate

```bash
$ curl -o /dev/null -w "%{http_code}\n" https://haldefiyat.com/urun/A-MARUL
200   # ← lowercase ile aynı içerik, ayrı URL
```

Aynı ürün her büyük/küçük harf kombinasyonu için ayrı sayfa olabilir → arbitrary duplicate.

### 3.4 Host canonical yok

```bash
$ curl -sI https://www.haldefiyat.com/  | grep HTTP   # 200 OK
$ curl -sI https://haldefiyat.com/      | grep HTTP   # 200 OK
```

www ve apex ikisi de **200 OK** dönüyor. 301 zorlaması yok → Google'a hangisi canonical belirsiz. Bu, 8 "alternatif standart" + 1 "standart olmadan kopya" kayıtlarını besleyen ana sebep.

### 3.5 Locale redirect 307 (geçici)

```bash
$ curl -sI https://haldefiyat.com/tr/urun/a-marul | grep -i "HTTP\|location"
HTTP/1.1 307 Temporary Redirect
location: /urun/a-marul
```

307 = geçici → Google hedef URL'yi canonical kabul etmez. **308 (kalıcı) olmalı**.

### 3.6 Sitemap stratejisi ham (filtresiz)

[`frontend/src/app/sitemap.ts:22-39`](frontend/src/app/sitemap.ts#L22-L39) — `prices/products?limit=500` çağrısı 1141 satır döndürüyor (limit parametresi backend'de uygulanmıyor) ve **hepsi sitemap'e dökülüyor**. Sitemap "Google'a hangi sayfaları indeksle" der; biz "1141 düşük kaliteli URL'i indeksle" diyoruz, Google reddediyor.

### 3.7 Editoriyel içerik şablonu çok dar

Bir ürün sayfasının görünür metin uzunluğu **~410 kelime** ve sadece H1 değişiyor — `Hakkında`, `Fiyatı etkileyen faktörler`, FAQ blokları **tüm 1141 ürün için neredeyse aynı**. Bu near-duplicate sinyali pekiştiriyor.

### 3.8 `export const dynamic = "force-dynamic"`

Hem `/urun/[slug]` hem `sitemap.ts` force-dynamic. Her istekte yeniden render → Google'ın gözünde cache stabilitesi yok. Bu thin-content cezasını ağırlaştırmaz ama crawl budget'ı israf eder.

---

## 4. Trend Yorumu

- **20 Nis → 11 May arası:** doğal organik büyüme (3 → 23 indexed, sağlıklı).
- **11 → 12 May:** ürün sayfası generate edip sitemap'e koymuşuz. Indexed 23 → 68 (3x artış iyi), ama keşfedildi-indexlenmedi 14 → **1.146**.
- **12 → 18 May:** Google deniyor, kabul etmiyor. Indexed 68 → 199, ama eklenmedi 1.146 → **1.301** (yeni 155 düşük kaliteli URL daha geldi).
- **Trend:** gösterimler 79'dan 77'ye düşüyor — yeni sayfalar trafiğe katkı yapmıyor, ortalamayı bozuyor.

**Sonuç:** "Daha çok sayfa = daha çok trafik" değil. Mevcut durumda **az ama kaliteli** stratejiye dönmek lazım.

---

## 5. Çözüm Stratejisi (Yön)

İki paralel ana hat:

1. **Hijyen (1-2 gün, hızlı kazanç):** soft 404 fix, case normalization, host canonical 301, locale 308, sitemap filtreleme. Bu Google'ın "discovered" havuzunu temizler.

2. **Veri kalitesi (1 hafta):** ürün master list — slug normalization, duplicate consolidation, `seo_index` whitelist. Hedef: 1141 → **150-300 gerçek indexlenebilir sayfa**.

Detaylı checklist: [`INDEKSLEME-CHECKLIST.md`](INDEKSLEME-CHECKLIST.md)

---

## 6. Hangi Sayfalar Bırakılır, Hangileri Çıkarılır?

İndeks havuzu için aday kriterleri (whitelist):

| Kriter | Eşik |
|---|---|
| Son 30 günde fiyat verisi olan | ✅ zorunlu |
| Min. 3 farklı halde fiyatlanmış | ✅ zorunlu |
| `nameTr` Title-Case (UPPERCASE değil) | ✅ zorunlu |
| Slug'da nokta yok, tek harf prefix yok | ✅ zorunlu |
| Aynı tür için master slug seçimi (`biber` → master, `aci-carli-biber` → kategori altında) | ✅ konsolidasyon |
| Türkçe arama hacmi tahmin > 50/ay | 🟡 v2'de Google Trends ile doğrula |

Geri kalanlar:
- **Hala görünür ama `noindex`**: kullanıcı doğrudan link gelirse erişebilir, Google indekslemez.
- **Sitemap'ten çıkar**: Google'a "burayı tarama" sinyali.
- **Master slug'a 301**: aynı şeyin 53 varyantı varsa hepsi master'a yönlendirilir.

---

## 7. Notlar

- 1 sayfa "Robots.txt tarafından engellendi" → `/_next/`, `/api/` disallow'undan biri, beklenen.
- 4 sayfa `noindex` → `/favoriler`, `/hesabim`, vb. user-dashboard, beklenen.
- 8 alternatif canonical → muhtemelen `/tr/...` veya www mirror, host canonical fix bunu temizler.
- 1 404 → varlığı zaten tespit edilmiş, soft-404 fix bunu kapsar.

---

## 8. Cross-Reference

- Sayfa: [`frontend/src/app/[locale]/(public)/urun/[slug]/page.tsx`](frontend/src/app/%5Blocale%5D/%28public%29/urun/%5Bslug%5D/page.tsx)
- Sitemap: [`frontend/src/app/sitemap.ts`](frontend/src/app/sitemap.ts)
- Robots: [`frontend/src/app/robots.ts`](frontend/src/app/robots.ts)
- Repo: [`backend/src/modules/prices/repository.ts:342`](backend/src/modules/prices/repository.ts#L342) (`listProducts`)
- ETL master plan: [`CLAUDE.md`](CLAUDE.md) — Scrapling entegrasyonu, source listesi
- Önceki çalışmalar: [`KALAN-ISLER.md`](KALAN-ISLER.md)
