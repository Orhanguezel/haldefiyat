# Üst menü ilan çağrısı — 15 Eylül 2026

Masaüstü ve mobil menüde, oturum açmamış ziyaretçilere gösterilen “Ücretsiz Başla” düğmesi “İlan Ver” olarak değiştirildi. Hedef `/kayit` yerine `/ilan-ver`; “Giriş Yap” düğmesi korundu. İlan verme sayfasının mevcut giriş/kayıt bağlantıları `next=/ilan-ver` dönüşünü korur.

Kapsam: `frontend/src/components/header/HeaderNavClient.tsx`.

Canlı sürüm `.next-release-20260915ad01`. Derleme ve iki frontend worker'ın sırayla yüklenmesi tamamlandı. Tarayıcıda masaüstü düğmesine tıklanarak ilan sayfasına geçiş ve giriş bağlantısındaki ilan dönüş adresi doğrulandı. Mobil menüde yeni CTA görünür; eski metin yok. Anonim oturum kontrolünün 401 yanıtları mevcut davranıştır.
