# Tema renk kaynağı ve kontrollü istisnalar

Public uygulama bileşenleri semantik `--color-*`, `--trend-*`, `--map-*` ve gölge tokenlarını kullanır. `bun run check:theme-colors`, yeni bir hard-coded rengin bu yüzeylere sızmasını engeller.

Sabit renk kullanımına yalnız aşağıdaki teknik yüzeylerde izin verilir:

- CSS değişkenlerinin çalışmadığı Satori OG görselleri, PWA manifesti, tarayıcı tema metası ve uygulama ikonu.
- Başka sitelere gömülen, host teması bulunmayan bağımsız widget belgeleri.
- Reklamverenin kendi yaratıcı renkleriyle çalışan reklam/önizleme bileşenleri.
- Google OAuth marka işareti ve veri serilerini birbirinden ayıran grafik paletleri.
- Tema tokenlarının tanımlandığı `globals.css`, 410 minimal HTML cevabı ve test fixture'ları.

Bu istisnalar public sayfa temasına renk taşımak için kullanılamaz; yeni istisna gerekirse bu dosyada gerekçesi yazılmalı ve denetim allowlist'i ayrıca gözden geçirilmelidir.
