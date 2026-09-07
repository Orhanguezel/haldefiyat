# Rakip görünürlüğü ve resmi Adana kaynağı — 8 Eylül 2026

Canlı kapanış kanıtı ve ilk araştırma `artifacts/competitor-seo-2026-09-08/` altındadır.

- `migrate.ts`: Eski kurulumlar için mevcut kolonları kontrol ederek tekrar çalışabilir. Yeni/tekrar seed tanımı 097 içindedir; 099 no-op kalır. Eski SERP kayıtlarına motor veya tarih uydurmaz.
- `import-adana.ts <archive-directory> [--apply]`: varsayılan salt okunur doğrulama. Resmi detay URL’leri, HTML ve SHA256 manifestiyle 10 Haziran–7 Eylül 2026 arşivini işler. Günlük iş için kullanılmaz; bu sabit tarihli kurtarma paketidir. Normalleştirme, ürün inceleme kuyruğu ve fiyat karantinası mevcut ETL yoludur. Koruma atlanmaz.
- `apply-editorial.ts <revisions.json>`: yalnız dört mevcut yayımlanmış ürün içeriğini değiştirir; otomasyon insan incelemesi yapılmış gibi işaretlemez. Önceki satırlar artifact `editorial-before.json` içinde.
- Günlük Adana: `adana_resmi` mevcut `runDailyEtl` listesine dahil. Kaynak bülteninin başlığından gerçek tarih alınır. 0/0 satırları atlanır. Belediye liste URL’si `/tr/hal-fiyat-listesi`; eski tahmini `/tr/hal-fiyatlari` soft404 döner.
- Mersin: resmi form alanları `published` ve `product_category`; kategoriler 3/4. Scrapling ve doğrudan çağrı sözleşmesi eşitlendi. Kaynak WAF 403 döndüğü için etkinleştirilmedi; istek tarihiyle eski fiyat yazılmaz.
- Genel limon şehir serisi: `family_slug=limon` çeşitlerinin aynı birimdeki, karartma dışındaki kayıtları. Bu değişken çeşit örnekleminden haftalık yüzde veya şehir ucuzluk iddiası üretilmez. Mayer ayrı seridir; eşik koşulları dolmadan noindex kalır.
- Google metrikleri: ayrı tarihlenmiş son 28 gün GSC görünümü, bir saat process cache. SERP motoru Google yerine geçirilmez. Yeni taramalar tek motor kullanır; kısmi/eski/karışık koşular kayıp kıyasına alınmaz.

Dağıtım yalnız görevdeki dosyalara yapıldı. Backend `.js` dosyaları seçilerek taşındı; frontend/admin `.next-release-2026090801` ile mevcut uygulama klasörlerinde derlendi. `/tmp/hal-deploy.lock` kullanıldı. Geri dönüş dosyaları sunucuda `/tmp/hal-seo-recovery-before/`; frontend/admin eski symlink hedefleri burada saklı. Geri dönüşte aynı kilit altında önceki dosyaları/hedefleri geri koyup yalnız ilgili PM2 uygulaması yeniden yüklenir. Eklenen nullable kolonların silinmesi gerekmez.
