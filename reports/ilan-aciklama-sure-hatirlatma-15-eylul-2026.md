# İlan açıklaması, süre ve hatırlatma — 15 Eylül 2026

- Yeni ilan formunda açıklama zorunlu; boş ve yalnız boşluk içeren metinler hem istemcide hem API doğrulamasında reddedilir. Düzenlemede açıklama gönderiliyorsa boş bırakılamaz.
- Yeni ilanlarda geçerlilik tarihi Türkiye takvimine göre 14 gün sonrası seçili gelir. Kullanıcı tarihi değiştirebilir; mevcut ilan tarihleri topluca değiştirilmedi.
- Mevcut hatırlatma servisi ETL tamamlanmasına bağımlı olmaktan çıkarıldı. `listing-reminders` her gün 09.00 UTC / 12.00 Türkiye saatinde, bitişten üç gün önce ve son gün hatırlatma yapar.
- Hatırlatma anahtarı bitiş tarihini içerir; yenilenen ilan bir sonraki döneminde tekrar hatırlatma alabilir. Önceki anahtarla aynı dönem için gönderilmiş mesajlar sorguda dikkate alınır.
- SQL tarihi açık YYYY-MM-DD biçiminde döner; e-postada tarih doğru biçimlenir. Uzatma bağlantısı doğrudan ilgili hesap ilanına gider. Süre uzatma mevcut moderasyon/onay akışını korur.

Doğrulama: backend derlemesi, 14 backend testi (27 assertion), 3 frontend testi başarılı. Canlı SMTP bağlantı/kimlik doğrulaması başarılı; test amacıyla kullanıcıya e-posta gönderilmedi. PM2 logunda yeni günlük görev kayıtlı ve zaman dilimi UTC. Canlı veri: 16 ilan, 7 eski açıklamasız kayıt; bunların içeriği değiştirilmedi.

Canlı frontend sürümü `.next-release-20260915bc01`. Backend ve iki frontend worker yüklendi. Kanıtlar `artifacts/listing-rules-2026-09-15/` altında.

Kimlik doğrulanmış canlı tarayıcı: varsayılan tarih 29.09.2026 (15 Eylül +14 gün). Boşluk açıklamasıyla API isteği HTTP 400 ve description_required döndü; test ilanı oluşturulmadı.
