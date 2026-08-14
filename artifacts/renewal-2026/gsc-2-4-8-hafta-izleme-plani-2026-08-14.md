# GSC 2/4/8 Hafta İzleme Planı

**Başlangıç:** 14 Ağustos 2026  
**Teknik sahip:** Orhan / SEO operasyonu  
**Veri kaynağı:** HalDeFiyat'ın mevcut tek GSC bulk/cron indiricisi ve
`gsc_url_index` cache'i. İkinci URL Inspection istemcisi kurulmayacak.

## Başlangıç bazı

- Canonical master havuzu: **623 URL**.
- GSC cache'inde incelenmiş master: **622 URL**.
- Indexed-benzeri master: **183 URL**.
- 14 Ağustos canlı sitemap: **407 benzersiz canonical URL**.
- Eski/varyant havuzu: **612 URL**; **388** redirect olarak görülüyor.
- Sitemap yeniden gönderme denemesi, mevcut readonly OAuth scope nedeniyle
  `403 ACCESS_TOKEN_SCOPE_INSUFFICIENT` ile engelli. Bu durum ikinci bir inspector
  yazılarak aşılmayacak; yetkili credential sağlandığında mevcut akış kullanılacak.

## Ölçüm takvimi

| Kapı | Tarih | Karşılaştırma | Zorunlu çıktı |
|---|---|---|---|
| T+2 hafta | 28 Ağustos 2026 | 14 Ağustos bazı | indeks durumu dağılımı, sitemap/canonical örneklemi, yeni 404/soft-404 |
| T+4 hafta | 11 Eylül 2026 | baz + T+2 | indexed trendi, discovered/crawled-not-indexed, Google/user canonical farkı |
| T+8 hafta | 9 Ekim 2026 | baz + T+2 + T+4 | kalıcı trend, içerik ailelerine göre kazanım/kayıp, sonraki göç kararı |

Her kapıda ayrıca son 28 günlük click, impression, CTR ve ortalama konum raporu
alınır. GSC organik arama verisi, nginx tüm trafik verisiyle aynı sayı gibi
sunulmaz.

## Çalıştırma sözleşmesi

Credential hazır olduğunda mevcut araç kullanılır:

```bash
cd backend
bun scripts/seo/gsc-snapshot.ts --dry-run --limit=20
bun scripts/seo/gsc-snapshot.ts --apply --inspect --limit=100
```

Günlük incremental URL Inspection işi mevcut `gsc-index-refresh` cron'unda,
kota dostu batch ile kalır. Snapshot sonucu `hf_seo_snapshots`; son URL durumu
mevcut `gsc_url_index` tablosunda tutulur. Ham sonuç ve delta raporu ilgili tarih
altında arşivlenir.

## Kırmızı eşikler

- Indexed-benzeri master sayısı iki ardışık kapıda düşerse veya tek kapıda
  bazdan **%10'dan fazla** düşerse yayın/regresyon incelemesi açılır.
- Yeni canonical mismatch **>0**, redirect chain **>0**, yeni 404/soft-404 **>0**
  ise ilgili URL ailesi rollout'u durdurulur.
- Sitemap URL sayısı beklenmedik şekilde **%5'ten fazla** değişirse veri kapısı,
  canonical filtre ve yayın durumu diff'i alınır.
- `Crawled - currently not indexed` veya `Discovered - currently not indexed`
  iki kapı boyunca artarsa thin/duplicate/orphan örneklemi yeniden taranır.
- GSC clickleri haftalık mevsimsellik notu olmadan bazdan **%20'den fazla**
  düşerse canonical, robots, sunucu hatası ve sorgu bazlı kayıp birlikte incelenir.

## Credential gelene kadar yapılabilenler

Canlı sitemap, canonical, redirect ve schema taraması yerel/production kabul
paketinde sürer. GSC tarafındaki yeni Google kararı credential olmadan tahmin
edilmez; son cache değeri güncelmiş gibi etiketlenmez. Yetkili scope sağlanması
dış bağımlılıktır, planın veya mevcut tek-indirici mimarisinin eksikliği değildir.

