# HalDeFiyat — GEO + SEO Açık İşler

> Kaynak checklist:
> `HALDEFIYAT-GEO-SEO-AKSIYON-CEKLISTI.md`
>
> Tarih: 2026-07-27 · Durum: **12 açık madde**
>
> Bu dosya yalnız açık işleri içerir. Tamamlanmış 54 madde, kapanış kanıtlarıyla
> ana aksiyon checklist'inde korunur. Burada tamamlanan bir madde `[x]`
> yapıldıktan sonra ana checklist'e taşınmalı ve iki dosyanın sayaçları birlikte
> güncellenmelidir.
>
> Lighthouse/SRI ile dependency audit tek satırdayken doğrulanabilir kabul ve
> registry bağımlı kalan iş olarak ikiye ayrıldı; toplam takip maddesi 66 oldu.

## P0 — DNS ve canlı kabul

### SPF ve DMARC — 🧑 Orhan / DNS

- [ ] DKIM selector ve alignment'ı gerçek test e-postasıyla doğrula.
- [ ] DMARC `rua` mailbox ekle; rapor gözleminden sonra `p=quarantine; pct=25`, `pct=100` ve gerekirse `reject` sırasını uygula.

Kabul: SPF pass, DKIM pass ve DMARC aligned pass; yedi günlük raporda
beklenmedik meşru gönderici bulunmuyor.

## P1 — Schema ve kurumsal şeffaflık

### Schema validator çıktıları — 🔎 Claude

- [ ] Schema.org Validator ve Rich Results Test çıktılarını URL bazında arşivle.

## P2 — Teknik SEO ve canlı tarama

### Anahtar kelime yoğunluğu canlı kontrolü

- [ ] Değişiklik sonrası görünür metni, title/meta/H1-H2 dağılımını ve SSR HTML'i yeniden tara; GSC sorgu/CTR etkisini 28 gün izle ve sonucu kaydet.

## P2 — Ölçüm ve KPI baseline

- [ ] 30–50 Türkçe hedef sorguyla AI sorgu benchmark'ı oluştur; platform, tarih, marka geçişi ve citation kaydını aylık tekrarla.
- [ ] Backlink/referring-domain, unlinked mention ve branded search baseline'ı ile beş gerçek rakip gap analizi oluştur.
- [ ] Schema-valid URL, indexable sitemap, CWV-good URL ve AI-referrer trafiği için operasyonel KPI'ları tanımla.
- [ ] Her KPI için baseline, hedef, kaynak, owner ve kontrol sıklığı belirle; “GEO skoru”nu tek metrik olarak kullanma.

## Stratejik — Bu çeyrek

- [ ] Marka otoritesi için veri kataloğu, tarım/ekonomi basın mention'ları ve ölçülebilir YouTube/Reddit planı oluştur; Wikipedia'yı KPI yapma.
- [ ] Açık veri API pazarlaması için GitHub örnek istemci/notebook, Postman collection, OpenAPI, changelog ve versioning hazırla.
- [ ] Haftalık/aylık özgün endeks bülteni ve basın listesi oluştur.
- [ ] “Turkey vegetable prices” odağında İngilizce genişleme fizibilitesi hazırla.

## Operasyon sırası

1. SPF, DKIM ve DMARC.
2. Şeffaflık metinleri ve sorumlu kurum bilgisi.
3. Schema validator ve tam canlı teknik crawl.
4. Anahtar kelime yoğunluğu sonrası tarama ve 28 günlük GSC/CTR izlemesi.
5. CrUX, GSC, AI görünürlük ve backlink baseline'ları.
6. Stratejik otorite ve uluslararası genişleme çalışmaları.

## İlgili dosyalar

- Tamamlanan işler: `HALDEFIYAT-GEO-SEO-AKSIYON-CEKLISTI.md`
- Uygulama kaydı: `docs/geo-seo/IMPLEMENTASYON-OTURUMU-2026-07-26.md`
- Brief: `docs/codex-briefs/geo-seo-implementation.md`
