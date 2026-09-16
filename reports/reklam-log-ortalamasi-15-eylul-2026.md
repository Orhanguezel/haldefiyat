# Reklam sayfası: log ortalaması

Google kartı kaldırıldı; tek rakam ve kısa tarih/kaynak satırı kullanıldı.

18 Ağustos–13 Eylül 2026, UTC sınırlarıyla 27 tamamlanmış gün: 101.588 uygun sayfa isteği / 27 = 3.762,52 günlük ortalama. Kamuya yaklaşık 3.800 günlük sayfa görüntülenmesi olarak yuvarlandı. 14 Eylül UTC henüz tamamlanmadığı için dışlandı.

Kaynak: canlı nginx döndürülmüş erişim logları; yeniden çalıştırılabilir betik ve kişisel veri içermeyen günlük özet `artifacts/advertise-traffic-2026-09-15/` altında.

Filtre: GET, 200, Mozilla/5.0 tarayıcı user-agent; bilinen botlar, RSC sorguları, API/admin, Next varlıkları, yüklemeler, statik dosyalar dışlandı. Bu log temelli yaklaşık sayfa görüntülenmesidir; tekil ziyaretçi, reklam gösterimi veya reklam tıklaması değildir. Kimliğini gizleyen botları ve tüm ön yüklemeleri mevcut log biçimi kesin ayıramaz; istemci tarafındaki tüm gezinmeler de bu ölçümde yoktur.

Veri 35 günden eski olduğunda kart mevcut hedef kitle metnine döner.

Canlı doğrulama: `.next-release-20260915be01`; iki frontend worker yenilendi. ESLint ve üretim derlemesi geçti. Playwright 1440 px ve 390 px: yeni kart ≈ 3.800, Google kartı yok, yatay taşma yok. Mobil kart yüksekliği 212 px. Ekran görüntüleri `output/playwright/advertise-page/log-desktop.png` ve `log-mobile.png`.
