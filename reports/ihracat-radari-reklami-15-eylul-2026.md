# İhracat Radarı reklamı — canlı yayın

Hazırlık: 22f692c7 commitinde Claude ortak yazarlığıyla banner, logo ve ekleme betiği bulundu. Canlıda bileşen ve kampanya kayıtları yoktu. Mevcut banner sistemi kullanıldı; ayrı reklam sunucusu kurulmadı.

Yayınlanan kayıtlar (bedelsiz kurum içi reklam):
- 19: ilan detayı yan alanı; ürün adına göre ithalatçı bulma hizmetine yönlenir.
- 20: firma detayı yan alanı, mevcut Hostinger reklamından sonraki satır; GTİP/HS hizmetine yönlenir.
- 21: site altı ikinci satır; İhracat Radarı ana sayfasına yönlenir.

Mobil için radar ve uzun açıklamalar gizlenerek logo, kısa mesaj ve CTA korundu. Gerçek 390 px sayfada yükseklik 106 px; yatay taşma yok. Masaüstü radar animasyonu ve azaltılmış hareket tercihi korundu.

Doğrulama: BannerVisual 13 test ve ESLint geçti. Üretim derlemesi `.next-release-20260915bf01`; iki frontend worker sağlıklı yenilendi. İlan ve firma sayfalarında üç kampanya doğrulandı; logo yüklendi. Her tıklama ucu beklenen hedefe 302 döndü (kampanya başına bir QA isteği). Hedef hizmet sayfaları erişilebilir.

Kanıtlar: `artifacts/ihracat-banner-2026-09-15/`; görseller `output/playwright/ihracat-banner/`. Geri alma için yalnız 19,20,21 numaralı kampanyalar pasifleştirilebilir; önceki frontend sürümü `.next-release-20260915be01`.
