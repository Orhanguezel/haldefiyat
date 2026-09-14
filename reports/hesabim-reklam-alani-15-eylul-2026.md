# Hesabım reklam alanı — 15 Eylül 2026

Hesap alanının üstüne mevcut GZL Teknoloji bannerı ile HalDeFiyat reklam başvuru kartı eklendi. Hesap alt sayfalarında aynı ortak yerleşim kullanılır. Masaüstünde yan yana, dar ekranda alt alta görünür.

GZL için mevcut Teklif al formu; reklam başvurusu için mevcut `/reklam-ver` sayfası kullanılır. Yeni form veya başvuru kanalı oluşturulmadı. Rakibin görüntülenme sayısı taşınmadı. GZL bileşeni doğrudan gösterilen kurum içi tanıtımdır; ayrı bir ücretli kampanya/yerleşim kaydı açılmadı.

Değişiklikler: `frontend/src/components/ads/AccountAdvertising.tsx` ve dashboard ortak layout.

Canlı sürüm: `.next-release-20260915ac01`. Frontend derlemesi ve iki worker'ın sırayla yeniden yüklenmesi tamamlandı. Playwright ile 1440 px masaüstünde yan yana; 390 px mobilde tek sütun ve yatay taşma olmadığı doğrulandı. Teklif diyaloğu açılıp kapandı. Reklam başvuru hedefi HTTP 200. Tarayıcı konsolunda hata yok. Görseller `output/playwright/account-advertising/desktop.png` ve `mobile.png`.
