# İndeksleme Düzeltme Checklist

Bağlam: [`INDEKSLEME-ANALIZ-2026-05-25.md`](INDEKSLEME-ANALIZ-2026-05-25.md). Önce o okunmalı.

Görev paylaşımı:

- 🧠 **Claude (mimar/stratejist):** karar, schema tasarımı, prompt/agent yazımı, review.
- 🤖 **Codex (implementer):** kod yazımı, migration, test, deploy.
- 👤 **Orhan (operatör):** GSC submit, manuel doğrulama, prod cutover.

İşaretler: `[ ]` yapılmadı, `[x]` tamam, `[~]` devam.

---

## FAZ 0 — Hızlı Hijyen (1 gün)

Bu faz Google'ın "Crawled / Discovered not indexed" havuzunu temizler. **Önce bunlar bitmeden Faz 1'e geçmek anlamsız** — yeni temiz sayfalar bile aynı tuzaklara düşer.

### 0.1 Soft 404 fix — `/urun/[slug]` `notFound()` çağrısı

- [X] 🤖 **Codex:** [`frontend/src/app/[locale]/(public)/urun/[slug]/page.tsx:94`](frontend/src/app/%5Blocale%5D/%28public%29/urun/%5Bslug%5D/page.tsx#L94) — `if (!product)` bloğunda JSX yerine `import { notFound } from "next/navigation"; notFound();` çağır.
- [X] 🤖 **Codex:** Aynı kontrol `generateMetadata` içinde de zaten yapılıyor; orada da `notFound()` çağrılırsa 404 hem metadata hem body için tutarlı olur.
- [X] 🤖 **Codex:** `/hal/[slug]` ve `/analiz/[slug]` route'larında da aynı pattern var mı kontrol et — varsa düzelt.
- [X] 👤 **Orhan:** Deploy sonrası `curl -o /dev/null -w "%{http_code}" https://haldefiyat.com/urun/zzz-yok` → **404** dönmeli.

### 0.2 Case-insensitive URL — middleware veya nginx ile lowercase 301

- [X] 🧠 **Claude karar:** **Next middleware (proxy.ts)** — `/urun/*`, `/hal/*`, `/analiz/*` path'lerinde uppercase varsa lowercase'e 301 redirect. Sebep: nginx'te yapmak basit ama tek-locale tutarlılığı için middleware'de tüm slug normalizasyonu tek dosyadan kontrol edilebilir. Codex bu kararla uyguladı.
- [X] 🤖 **Codex:** `frontend/src/proxy.ts` içine slug-pattern path'leri için lowercase 301 kuralı ekle. Sadece `[a-z0-9-]` dışı karakter görürse redirect; başka path'lere dokunma.
- [X] 👤 **Orhan:** `curl -sI https://haldefiyat.com/urun/A-MARUL` → **301 → /urun/a-marul** olmalı.

### 0.3 Host canonical — `www.haldefiyat.com` → `haldefiyat.com` 301

- [X] 👤 **Orhan + 🤖 Codex:** VPS'te `/etc/nginx/sites-available/haldefiyat` aç. www subdomain için ayrı server block ekle: `server_name www.haldefiyat.com; return 301 https://haldefiyat.com$request_uri;`
- [X] 👤 **Orhan:** SSL cert www'i kapsıyor mu kontrol (`certbot certificates`). Kapsamıyorsa `certbot --expand -d haldefiyat.com -d www.haldefiyat.com`.
- [X] 👤 **Orhan:** `nginx -t && nginx -s reload`, sonra `curl -sI https://www.haldefiyat.com/` → **301**.

### 0.4 Locale redirect 307 → 308

- [X] 🧠 **Claude:** Karar: [`docs/seo/05-locale-redirect.md`](docs/seo/05-locale-redirect.md) — `localePrefix: "as-needed"` → `"never"`. Tek locale (`tr`) olduğu için davranış aynı, ama redirect status 308 olur. İkinci dil eklendiğinde geri `"as-needed"` + manuel 308 mantığı.
- [X] 🤖 **Codex:** [`frontend/src/proxy.ts`](frontend/src/proxy.ts) ve [`frontend/src/i18n/routing.ts`](frontend/src/i18n/routing.ts) — locale redirect'leri **308 permanent** olacak şekilde ayarla.
- [X] 👤 **Orhan:** `curl -sI https://haldefiyat.com/tr/urun/a-marul` → **308 → /urun/a-marul**.

### 0.5 Sitemap'i geçici olarak küçült — sadece kanıtlanmış sayfalar

- [X] 🤖 **Codex:** [`frontend/src/app/sitemap.ts`](frontend/src/app/sitemap.ts) — `fetchActiveProducts()` çağrısının sonucunu filtreleyerek sadece **son 30 günde fiyat verisi olan + nameTr'de UPPERCASE/nokta olmayan** ürünleri sitemap'e dahil et. Bu Faz 1'e kadar geçici filtre (hedef: 1141 → ~250).
- [X] 🤖 **Codex:** Backend tarafında yardımcı endpoint `/api/v1/prices/products/seo-eligible?since=30d` ekle. Bu endpoint Faz 1'de DB whitelist'i ile değiştirilecek.
- [X] 👤 **Orhan:** Deploy sonrası `curl -s https://haldefiyat.com/sitemap.xml | grep -c '<url>'` → **< 300** olmalı.

### 0.6 GSC'de eski URL'leri "geçici kaldır" + yeni sitemap submit

- [ ] 👤 **Orhan:** GSC > URL Removals → patterned removal: hiçbir şey kaldırma (Google zaten indekslememiş). Yeni sitemap submit yeterli.
- [ ] 👤 **Orhan:** Sitemap'i tekrar fetch ettir (GSC > Sitemaps > yeniden gönder).

---

## FAZ 1 — Ürün Master List (3-5 gün)

ETL'den gelen ham ürün adları temizlenip canonical bir master listeye dönüştürülür. Hedef: 1141 → ~250 indexlenebilir + ~890 "var ama noindex / aliased" ürün.

### 1.1 Schema değişikliği — `hf_products` tablosuna SEO alanları

- [X] 🧠 **Claude tasarım:** Detay: [`docs/seo/01-schema-design.md`](docs/seo/01-schema-design.md). 5 yeni kolon (`display_name`, `canonical_slug`, `seo_index`, `data_quality`, `search_volume`), 2 yeni indeks. ETL coexistence kuralı (yeni kolonlar ETL upsert dışında tutulur) önemli — Codex brief'inde yer alıyor.
- [X] 🤖 **Codex:** [`backend/src/db/seed/sql/020_hal_domain_schema.sql`](backend/src/db/seed/sql/020_hal_domain_schema.sql) içine kolonlar eklendi. Canlıda destructive `db:seed:fresh` yerine 2026-05-25'te yedek sonrası idempotent migration uygulandı: `display_name`, `canonical_slug`, `seo_index`, `data_quality`, `search_volume`, indexler ve `hf_product_editorial` doğrulandı.
- [X] 🤖 **Codex:** TypeScript `hfProducts` schema type'ını güncelle.

### 1.2 Migration: ham nameTr'den display_name üret

- [X] 🤖 **Codex:** `backend/scripts/normalize-product-names.ts` yaz:
  - Tüm UPPERCASE'leri `toLocaleLowerCase("tr") + Title-Case`.
  - "A.MARUL" → manuel mapping (ya "Aysberg Marul" ya "Amerikan Marul" — DB'deki referans veriden çözülmez, manuel CSV gerekli).
  - "ACI ÇARLİ BİBER" → "Acı Çarli Biber".
  - Çift boşluk, leading/trailing space temizle.
- [X] 🧠 **Claude:** Mapping kuralları + 23 satır onaylandı (2 dalga): [`data/seo/manual-name-mapping.csv`](data/seo/manual-name-mapping.csv). 12 isim açma + 8 master'a canonical + 3 is_active=0 (e-kulak, ucburun-koy-b, yesil-dolma-b). Kural dokümanı: [`docs/seo/03-name-mapping.md`](docs/seo/03-name-mapping.md). **Codex:** CSV `is_active` kolonu eklendi, apply script güncellenmeli.

### 1.3 Duplicate consolidation — master slug seçimi

- [X] 🧠 **Claude analiz:** 50 cluster (>=5 sayfa) + 188 singleton = 238 master. 175 trash suffix. Detay: [`docs/seo/02-master-slug-strategy.md`](docs/seo/02-master-slug-strategy.md) — cluster haritası tablosu var.
- [X] 🧠 **Strateji: A (Hub-and-Spoke) — Orhan onayı 2026-05-25.** Variant'lar canonical ile master'a equity aktarır, URL'ler canlı kalır. ~238 master indekslenir, ~903 variant noindex+canonical.
- [X] 🤖 **Codex:** Karar sonrası `canonical_slug` ve `seo_index` alanlarını doldur (SQL migration). Canlıda `data_quality` hesaplandı, normalize apply çalıştı, master CSV'den 110 uygulanabilir karar yazıldı. Eksik master fix-up sonrası sonuç: `seo_index=1` **38**, sitemap **82 URL**, `biber/sogan/lahana/sarimsak` canonical'sız variant sayısı **0**.
- [X] 🧠 **Claude + Orhan 2026-05-25:** Eksik master kararları:
  - **biber** (56 variant) → yeni `biber` master INSERT
  - **sogan** (31 variant) → mevcut `sogan-kuru` master, `sogan-taze` ayrı master
  - **lahana** (12 variant) → yeni `lahana` master INSERT
  - **sarimsak** (8 variant) → yeni `sarimsak` master INSERT, `sarimsak-taze` ayrı
  - **k-sogan düzeltme:** önceki "Kuru Soğan kendi master" → `canonical='sogan-kuru'`, manuel-name-mapping.csv güncellendi.
- [X] 🤖 **Codex:** Fix-up brief'i uygula: [`backend/scripts/seo/insert-missing-masters.sql`](backend/scripts/seo/insert-missing-masters.sql) + [`backend/scripts/seo/02b-missing-clusters-fill.sql`](backend/scripts/seo/02b-missing-clusters-fill.sql). Canlı `hf_products` yedeği: `/tmp/hal-db-backups/hf_products-pre-missing-masters-20260525-002611.sql.gz`. Doğrulama: `/urun/biber-dolma` → 301 `/urun/biber`, `/urun/sogan-mor` → 301 `/urun/sogan-kuru`, `/urun/lahana-mor` → 301 `/urun/lahana`, `/urun/sarimsak-kuru` → 301 `/urun/sarimsak`; yeni master sayfaları 200.

### 1.4 Frontend — display_name kullan, canonical_slug 301

- [X] 🤖 **Codex:** `/urun/[slug]` page'inde:
  - `product.canonical_slug && product.canonical_slug !== slug` ise `redirect()` (301) ile master slug'a yönlendir.
  - H1, title, meta description'da `nameTr` yerine `displayName` kullan.
  - `product.seo_index === 0` ise `<meta name="robots" content="noindex,follow">` üret.
- [X] 🤖 **Codex:** `fetchProducts()` ve sitemap'te sadece `seo_index=1` ürünleri çek.
- [X] 🤖 **Codex:** Canlı deploy doğrulaması: `/urun/marul-a` → **301 `/urun/marul`**, `/urun/domates-ikinci` → **301 `/urun/domates`**, `/urun/e-kulak` → **404**, `prices/products?seoIndex=true` → **32 ürün**, sitemap → **76 URL**.

### 1.5 Editoryel içerik — variant uzunluğu artır

- [X] 🧠 **Claude:** Mevcut [`frontend/src/lib/product-content.ts`](frontend/src/lib/product-content.ts) incelendi (27 manual + jenerik fallback — near-duplicate kaynağı). DB'ye taşıma planı: [`docs/seo/04-editorial-content.md`](docs/seo/04-editorial-content.md). Template + tam örnek: [`data/seo/editorial-drafts/_TEMPLATE.md`](data/seo/editorial-drafts/_TEMPLATE.md), [`data/seo/editorial-drafts/marul.md`](data/seo/editorial-drafts/marul.md).
- [X] 🧠 **Claude:** LLM prompt final: [`docs/seo/06-editorial-llm-prompt.md`](docs/seo/06-editorial-llm-prompt.md). Validation kuralları + maliyet (Groq $0 / OpenAI $0.25 / Claude $0.32) + batch.
- [X] 🧠 **Claude:** 238 master öncelik CSV: [`data/seo/editorial-priority.csv`](data/seo/editorial-priority.csv). B1-cluster(50) > B2-high(50) > B3-medium(80) > B4-low(58).
- [X] 🤖 **Codex:** [`backend/scripts/seo/generate-editorial-drafts.ts`](backend/scripts/seo/generate-editorial-drafts.ts) eklendi (Groq/OpenAI/Anthropic provider, validation, `--dry-run`, `--apply`, `--priority`, DB upsert). Canlıya kopyalandı ve dry-run doğrulandı. Canlı `.env` içinde LLM anahtarı yok (`GROQ_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` boş), bu yüzden draft üretimi başlatılmadı.
- [ ] 👤 **Orhan:** Admin review queue (`/admin/editorial?status=draft`), haftada 20-30 ürün review hedefi.
- [X] 🤖 **Codex:** `hf_product_editorial` tablosu seed schema'ya eklendi.

---

## FAZ 2 — Trafik Genişletme (2-3 hafta)

Faz 1'den sonra sağlam temel var, organik trafik için yeni içerik tipleri.

### 2.1 Kategori hub sayfaları

- [X] 🧠 **Claude:** Hub sayfa zenginleştirme stratejisi: [`docs/seo/07-hub-page-enrichment.md`](docs/seo/07-hub-page-enrichment.md). Variant fiyat tablosu (`<VariantPriceTable>`), `variantGuide` LLM alanı, ilgili master linkleri. 4 Codex alt-görevi: variants endpoint, frontend component, page.tsx koşullu render, sitemap güncellemesi.
- [X] 🤖 **Codex:** Master ürün sayfalarında "Bu ürünün variant'ları" bölümü ekle (canonical_slug=current_slug olanları listele).
- [X] 🤖 **Codex:** Hub fiyat zenginleştirme deploy edildi: `GET /api/v1/prices/variants/:masterSlug`, [`VariantPriceTable`](frontend/src/components/sections/VariantPriceTable.tsx), master sayfa rozet + tablo render. Canlı doğrulama: `/api/v1/prices/variants/biber?range=7d` → 35 fiyatlı varyant, `/urun/biber` içinde variant tablo metni render ediliyor.

### 2.2 Şehir-ürün cross sayfaları (hub-and-spoke)

- [X] 🧠 **Claude karar: YAPMA.** Detay: [`docs/seo/09-city-product-crosspages.md`](docs/seo/09-city-product-crosspages.md). 6.902 yeni near-duplicate URL yaratır, mevcut sorunun 6× büyük versiyonu. Alternatif: master sayfada şehir filtresi (zaten var, query param ile canonical değişmez).
- [X] 🤖 **Codex (Faz 2.5):** `hf_markets` tablosuna `seo_index` kolonu + default 1 eklendi; `prices/markets?seoIndex=true` ve sitemap market filtresi deploy edildi. Canlı yedek: `/tmp/hal-db-backups/hf_markets-pre-seo-index-20260525-004429.sql.gz`. Doğrulama: `prices/markets?seoIndex=true` → 29 hal, sitemap içinde `/hal/izmir-hal` vb. URL'ler var.

### 2.3 Blog / haberler — fiyat trendleri

- [X] 🧠 **Claude:** Strateji + 5 içerik tipi + üretim pipeline'ı: [`docs/seo/10-content-publishing-strategy.md`](docs/seo/10-content-publishing-strategy.md). Mevcut `/analiz` zaten 8 makale yayınlamış; sistematik hale getirilmesi planı (haftalık rapor + ürün derin dalışı + sezon rehberi + evergreen + acil haber). Aylık ~9 makale, ~8.000 kelime hedef.
- [x] 🤖 **Codex (Faz 2.3a):** [`backend/scripts/seo/generate-weekly-report.ts`](backend/scripts/seo/generate-weekly-report.ts) eklendi; ETL/weekly summary verisinden `hf_analysis_reports` içine `draft` üretir, `--notify` ile Telegram review mesajı atar. Canlı dry-run doğrulandı. Analiz sayfasında NewsArticle JSON-LD + Breadcrumb zaten aktif; [`news-sitemap.xml`](frontend/src/app/news-sitemap.xml/route.ts) eklendi ve `robots.txt` içine bağlandı. LLM API anahtarı olmadığı için bu ilk sürüm mevcut veri tabanlı generator'ı kullanır; yayın hâlâ Orhan onaylıdır.
- [ ] 👤 **Orhan (Faz 2.3b):** Author profile sayfa (`/yazarlar/orhan-guzel`), her AI rapora min 1 kişisel yorum cümlesi.

---

## FAZ 3 — Ölçüm ve İyileştirme (sürekli)

- [X] 🧠 **Claude:** Snapshot rapor şablonu + hedef tablosu + erken uyarı tetikleri: [`docs/seo/08-measurement-snapshots.md`](docs/seo/08-measurement-snapshots.md). İlk snapshot hedef tarihi: **2026-06-01 (Çarşamba)** — Faz 0 deploy + 7g.
- [ ] 👤 **Orhan:** İlk snapshot 2026-06-01 — CSV export → `data/seo/snapshots/2026-06-01/` → `INDEKSLEME-ANALIZ-2026-06-01.md` doldur.
- [ ] 👤 **Orhan:** Faz 1 deploy +14g sonrası ikinci snapshot.
- [X] 🤖 **Codex (Faz 3.1, opsiyonel):** GSC API entegrasyonu + `hf_seo_snapshots` tablosu eklendi. Dosyalar: [`backend/scripts/seo/gsc-snapshot.ts`](backend/scripts/seo/gsc-snapshot.ts), [`backend/src/db/seed/sql/032_seo_snapshots_schema.sql`](backend/src/db/seed/sql/032_seo_snapshots_schema.sql). Canlı tablo oluşturuldu, dry-run doğrulandı (`--limit=5`). GSC service account env yoksa script API çağırmadan durur; cron için credentials gerekli.

---

## Notlar (kalıcı kararlar)

- **Hard kod yasak:** Master slug listesi config dosyasından (`backend/src/config/seo-masters.ts` veya DB'den) gelecek, kod içinde yazılmayacak (CLAUDE.md kuralı).
- **ALTER TABLE yasak:** Tüm schema değişiklikleri seed SQL içinde, `bun run db:seed:fresh` ile.
- **Codex paralel çalışma uyarısı:** Aynı dosyada Codex + Claude paralel ise [CLAUDE.md - &#34;Codex paralel cakisma riski&#34;](CLAUDE.md) notuna göre VPS'te grep ile dogrula.
- **Önce hijyen, sonra büyüme:** Faz 0 bitmeden Faz 1'e geçilirse 250 yeni iyi sayfa da Discovered havuzunda boğulur.

---

## Codex'e Görev Brief Şablonu

Codex'e iş açarken kullan:

```
GÖREV: [Faz X.Y başlık]
BAĞLAM: INDEKSLEME-ANALIZ-2026-05-25.md ve INDEKSLEME-CHECKLIST.md oku.
DEĞIŞTIR: [dosya:satır referansları]
TEST: [curl/api komutu, beklenen sonuç]
KURAL: ALTER TABLE yok, hard-coded değer yok, en fazla 200 satır.
DEPLOY: cd backend && bun run build ardından pm2 reload <isim> --update-env.
```

Örnek (Faz 0.1):

```
GÖREV: /urun/[slug] soft 404 fix
BAĞLAM: INDEKSLEME-ANALIZ-2026-05-25.md bölüm 3.2
DEĞIŞTIR: frontend/src/app/[locale]/(public)/urun/[slug]/page.tsx satır 94-100
TEST: curl -o /dev/null -w "%{http_code}" https://haldefiyat.com/urun/zzz-yok → 404
KURAL: notFound() Next 14+ standart, başka değişiklik yapma.
DEPLOY: cd frontend && bun run build && pm2 reload hal-frontend --update-env
```
