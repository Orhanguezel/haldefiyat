# HalDeFiyat — GEO + SEO Açık İşler

> Kaynak checklist:
> `HALDEFIYAT-GEO-SEO-AKSIYON-CEKLISTI.md`
>
> Tarih: 2026-07-27 · Durum: **7 açık madde**
>
> Bu dosya yalnız açık işleri içerir. Tamamlanmış 59 madde, kapanış kanıtlarıyla
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

- [ ] Backlink/referring-domain, unlinked mention ve branded search baseline'ı ile beş gerçek rakip gap analizi oluştur.
## Stratejik — Bu çeyrek

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
