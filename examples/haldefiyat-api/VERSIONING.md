# API Versioning Policy

- Kararlı public taban yolu `/api/v1`'dir.
- Geriye uyumlu alan eklemeleri ve yeni endpoint'ler `v1` içinde yapılabilir.
- Alan silme, alan anlamını değiştirme, tür değiştirme veya mevcut başarılı
  isteği hataya çevirme breaking change'dir ve `/api/v2` gerektirir.
- Kullanımdan kaldırma en az 90 gün önce changelog, API dokümanı ve mümkünse
  `Deprecation`/`Sunset` HTTP başlıklarıyla duyurulur.
- Tarih, freshness, kaynak ve kalite alanları sözleşmenin parçasıdır; sessizce
  kaldırılmaz.
- Preview/tahmin endpoint'leri kararlılık seviyesini dokümanda ayrıca belirtir.

Sürüm numarası URL major sürümünü ifade eder. OpenAPI belgesinin `info.version`
alanı ise belge/sözleşme revizyonudur.
