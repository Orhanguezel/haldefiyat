# Hesap çıkış düğmesi — 15 Eylül 2026

Üst menüdeki masaüstü ve mobil çıkış düğmeleri kaldırıldı. Oturum açmış kullanıcıya hesap bağlantısı ve İlan Ver çağrısı sunulur. Çıkış işlemi hesabın mevcut masaüstü yan menüsü ve mobil hesap başlığında korunur.

Mobil hesap menüsü reklamların üstüne taşındı; Çıkış yap düğmesi yatay kayan sekmelere girmeden görünür. Mevcut bekleme ve hata durumları korunur.

Kapsam: HeaderNavClient ve dashboard layout. Çıkış API'si değiştirilmedi.

Canlı sürüm `.next-release-20260915ae01`; derleme ve iki worker yüklemesi başarılı. Playwright: 1440 px masaüstünde üst menü çıkış sayısı 0, hesapta görünür çıkış sayısı 1. 390 px mobilde üst menüde çıkış yok; hesap çıkışı reklamların üstünde, ilk ekran içinde. Gerçek çıkış tıklaması sonrası giriş sayfasına geçildi. Konsolda hata yok.
