# HalDeFiyat — GEO + SEO Açık İşler

> Kaynak checklist:
> `HALDEFIYAT-GEO-SEO-AKSIYON-CEKLISTI.md`
>
> Tarih: 2026-07-27 · Durum: **4 açık madde**
>
> Bu dosya yalnız açık işleri içerir. Tamamlanmış 62 madde, kapanış kanıtlarıyla
> ana aksiyon checklist'inde korunur. Burada tamamlanan bir madde `[x]`
> yapıldıktan sonra ana checklist'e taşınmalı ve iki dosyanın sayaçları birlikte
> güncellenmelidir.
>
> Lighthouse/SRI ile dependency audit tek satırdayken doğrulanabilir kabul ve
> registry bağımlı kalan iş olarak ikiye ayrıldı; toplam takip maddesi 66 oldu.

## P0 — DNS ve canlı kabul

### SPF ve DMARC — 🧑 Orhan / DNS

- [ ] DMARC `rua` mailbox ekle; rapor gözleminden sonra `p=quarantine; pct=25`, `pct=100` ve gerekirse `reject` sırasını uygula.

Kabul: SPF pass, DKIM pass ve DMARC aligned pass; yedi günlük raporda
beklenmedik meşru gönderici bulunmuyor.

Mevcut kanıt/engel:

- DKIM gerçek test iletisiyle kapandı: selector `resend`, signing domain
  `haldefiyat.com`, doğrulama `pass`; görünür From ile exact alignment.
- DNS Turhost'ta; sunucuda DNS API erişimi ve doğrulanmış `rua` mailbox yok.
  Mailbox + DNS değişikliği sonrası en az 7 günlük `p=none` gözlemi zorunlu.

## P1 — Schema ve kurumsal şeffaflık

### Schema validator çıktıları — 🔎 Claude

- [ ] Schema.org Validator ve Rich Results Test çıktılarını URL bazında arşivle.

Mevcut kanıt/engel: 8 URL için Schema.org Validator error=0/warning=0 ham
çıktıları arşivli. Google Rich Results Test anonim otomasyonda reCAPTCHA ve
“Log in and try again” veriyor; oturumlu etkileşimli Google çıktısı gerekli.

## P2 — Teknik SEO ve canlı tarama

### Anahtar kelime yoğunluğu canlı kontrolü

- [ ] Değişiklik sonrası görünür metni, title/meta/H1-H2 dağılımını ve SSR HTML'i yeniden tara; GSC sorgu/CTR etkisini 28 gün izle ve sonucu kaydet.

Mevcut kanıt/engel: teknik yeniden tarama ve ham rapor tamam. Değişiklik sonrası
tam 28 günlük GSC penceresi en erken **24 Ağustos 2026** tarihinde dolar.

## P2 — Ölçüm ve KPI baseline

- [ ] Backlink/referring-domain, unlinked mention ve branded search baseline'ı ile beş gerçek rakip gap analizi oluştur.

Mevcut kanıt/engel: branded GSC baseline ve beş gerçek organik rakip kayıtlı.
Sunucuda Ahrefs/Semrush/Moz/Majestic/DataForSEO erişimi yok; Search Console
Links export veya doğrulanmış backlink sağlayıcısı olmadan referring-domain ve
dofollow sayıları tahmin edilmeyecek.
## Stratejik — Bu çeyrek

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
