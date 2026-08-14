# Analiz, Rapor, Endeks ve Basın Kabulü — 14 Ağustos 2026

## Dağıtılan kapsam

- Ana deneyim sürümü: `29e31e22`
- Eski HTML rapor sırası ve gerçek yazar bağlantısı: `d4caceaa`
- Yıllık rapor mobil tablo düzeltmesi: `805a36a8`
- Canlı sayfalar: `/analiz`, `/analiz/agustos-2-hafta-2026-hal-raporu`, `/endeks`, `/rapor/yillik/2025`, `/basin`
- Mobil viewport: `390x844`

## Analiz listesi ve rapor ayrıntısı

- `/analiz?year=2026&type=weekly` canlı kabulünde `17 sonuç · 2 aktif filtre`, doğru seçili rapor tipi, tek H1 ve `390/390 px` taşmasız görünüm doğrulandı.
- Tarih, kategori ve rapor tipi GET parametreleriyle çalışıyor; aktif filtre sayısı, temizleme eylemi, sonuç sayısı ve boş durum var.
- Haftalık özet gerçek fiyat sorgusundan `439 ürün · 38 hal` ve `10.826` karantina dışı kayıt gösterdi.
- Yayımlanmış eski HTML raporları sunum katmanında yükselenler → düşenler → endeks sırasına alındı. Canlı başlık konumları sırasıyla `0`, `2`, `3` ölçüldü.
- PDF/yazdır, paylaş, kaynak/yöntem ve düzeltme/geri bildirim eylemlerinin her biri erişilebilir adla tek kez bulundu. `navigator.share` kabulü doğru başlık ve canlı URL ile geçti.
- Rapor tablolarının üçü de açıklamalı erişilebilir bölge içinde; dokümanda yatay taşma yok.

## Yazar ve yapılandırılmış veri

- `hf_analysis_reports.author_id`, etkin `hf_authors.full_name` ile eşleşen gerçek kayda idempotent migration ile bağlandı.
- Gelecekte üretilen haftalık raporlar `haldefiyat-veri-ekibi` yazar kaydını otomatik alıyor.
- Canlı haftalık raporun yazar bağlantısı `/yazar/haldefiyat-veri-ekibi`; API yanıtında `authorId=1` ve aynı profil adı doğrulandı.
- Canlı raporda `NewsArticle`, `Dataset` ve `BreadcrumbList` şemaları bulundu. Dataset kapsamı, görünür kartlarla aynı haftalık özet nesnesinden üretiliyor.

## Endeks, yıllık rapor ve basın

- `/endeks` grafiği `role="img"`, başlık ve açıklamayı birlikte veren `aria-labelledby` ile sunuluyor; 13 haftalık ayrıntılı tablo caption ile erişilebilir.
- Endeks özetinde ortak `ReportSummaryGrid` ile güncel endeks, baz hafta, sepet ve veri dönemi gösteriliyor; mobil doküman taşması yok.
- `/rapor/yillik/2025` ortak rapor eylemlerini ve özet bileşenini kullanıyor; üç tablonun da açıklayıcı caption'ı var.
- Yıllık rapordaki sezon tablosu mobilde min-width dayatmadan `356/358 px` içinde kalıyor; tüm sayfa `390/390 px`.
- Yıllık sayfada `Article`, `Dataset` ve `BreadcrumbList` şemaları canlı DOM'da doğrulandı.
- `/basin` üzerinde `Onay durumu: Manuel yayımlanmış` görünür; sabit kurumsal metnin otomatik oluşturulmadığı ve kendiliğinden yayınlanmadığı açıklanıyor.
- Kabul sayfalarının tarayıcı konsolunda `0` hata ve `0` uyarı görüldü.

## Otomatik kapılar

- Backend TypeScript ve production build: geçti.
- Backend tam test paketi: 27 dosya / 115 test / 249 assertion geçti.
- Frontend ESLint ve TypeScript: geçti.
- Frontend test paketi: 26 dosya / 79 test geçti.
- Frontend production build ve izole standalone asset senkronu: geçti.
- Canlı PM2: backend ve frontend `online`, frontend `unstable restarts=0`; temel rotalar HTTP 200.

## Görsel kanıt

- `output/playwright/theme-clean-data/analiz-rapor-mobile-2026-08-14.png`
- `output/playwright/theme-clean-data/yillik-rapor-mobile-2026-08-14.png`
