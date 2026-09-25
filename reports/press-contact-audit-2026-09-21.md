# Basın CRM iletişim denetimi — 21 Eylül 2026

## Sonuç

- Canlı `/admin/press` listesi incelendi: 71 kayıt var.
- 10 adet `dogrulanacak+...@haldefiyat.com` yer tutucu adres, kamuya açık kurumsal kaynaklarla temizlendi.
- Yer tutucu adres sayısı: **0**.
- Yinelenen e-posta sayısı: **0**.
- Alan adı posta alıcısı (MX) bulunmayan yeni adres sayısı: **0**.
- Bu çalışma sırasında e-posta gönderilmedi.

MX kaydının bulunması, tekil posta kutusunun kesin olarak çalıştığını garanti etmez. İlk gönderim küçük bir pilot grupla yapılmalı; bounce ve ret sonuçları CRM'e işlenmelidir.

## Düzeltilen kayıtlar

| Kayıt | Canlı e-posta | Kaynak / karar |
|---|---|---|
| Agro World Tarım Dünyası | `haber@aramedya.com` | Eski “Agro Haber” kaydı aktif ve doğrulanabilir olmadığı için aynı sektördeki aktif yayınla değiştirildi. Kaynak: <https://www.agroworlddergisi.com/kunye/> |
| HASAD Yayıncılık | `kitap@hasad.com.tr` | Kaynak: <https://www.hasad.com.tr/iletisim> |
| Mersin Times | `mersintimes@gmail.com` | Eski “Mersin Zamanı” kaydı aktif ve doğrulanabilir olmadığı için güncel Mersin yerel yayınıyla değiştirildi. Kaynak: <https://mersintimes.com/iletisim/> |
| Adana 5 Ocak | `adana5ocakgazetesi@gmail.com` | Kaynak: <https://www.5ocakgazetesi.com/iletisim> ve yayının resmî PDF künyesi |
| Antalya Ticaret Borsası | `info@antalyaborsa.org.tr` | Kaynak: <https://www.antalyaborsa.org.tr/iletisim> |
| ANTKOMDER | `info@antalyakomisyonculardernegi.com` | Kaynak: <https://antalyakomisyonculardernegi.com/iletisim> |
| Toprak Mahsulleri Ofisi | `tmo@tmo.gov.tr` | Yayımlanmış resmî TMO yazışma adresi. Kayıt tipi “diğer/kurum” olarak düzeltildi. |
| Habertürk — Ekonomi | `internet@haberturk.com` | Kişisel editör adresi yerine kurumsal haber iletişim adresi seçildi. Kaynak: <https://www.haberturk.com/kunye> |
| Gazete Duvar | `info@gazeteduvar.com.tr` | Kaynak: <https://www.gazeteduvar.com.tr/kunye-sayfasi> ve yayının resmî arşiv belgeleri |
| BBC Türkçe | `BBC.turkce@bbc.co.uk` | Kaynak: <https://www.bbc.com/turkce/send/u50853841> |

## Liste gerçekte ne içeriyor?

Admin ekranındaki “71 medya kişisi” ifadesi tüm kayıtları medya gibi gösteriyor; veri dağılımı şöyledir:

| Tip | Adet |
|---|---:|
| Haber ajansı | 3 |
| Gazete | 8 |
| Haber / yayın web sitesi | 12 |
| Dernek / birlik | 23 |
| Oda / ticaret borsası | 19 |
| Kamu kurumu / fakülte / diğer | 6 |
| **Toplam** | **71** |

Doğrudan basın-yayın segmenti **23 kayıt**, kurum/oda/dernek segmenti **48 kayıt**tır. Tek kampanyada 71 alıcıya aynı metni göndermek yerine bu iki kitle ayrı tutulmalıdır.

## Gönderim öncesi zorunlu kapılar

1. İlk basın kampanyası yalnız 23 basın-yayın kaydına göre hazırlanmalı.
2. Oda, borsa, dernek ve kamu kurumlarına ayrı konu ve metin kullanılmalı.
3. Her alıcıya tekil `To` ile gönderilmeli; toplu BCC kullanılmamalı.
4. Gönderen `noreply@haldefiyat.com`, yanıt adresi `info@gzlteknoloji.com` olmalı.
5. Çıkış/itiraz adresi ve suppression kontrolü gönderim akışında uygulanmalı.
6. İlk tur 5–10 alıcıyla pilot yapılmalı; bounce, ret ve yanıtlar CRM temas loglarına yazılmalı.

## Teknik durum

- [x] Basın CRM'e tekil gönderim uç noktası, HTML/düz metin önizleme, hash'e bağlı kullanıcı onayı, suppression kontrolü ve kalıcı hız sınırlı kuyruk eklendi. 21 Eylül 2026 pilotunda 8/8 ileti sağlayıcı tarafından kabul edildi.
- `source_url`, `verified_at`, `do_not_contact`, `bounce_reason` gibi ayrı alanlar yok; kaynak bilgileri `notes` içinde tutuluyor.
- Admin üst kartındaki “medya kişisi” etiketi kurumları da kapsadığı için yanıltıcı. “İletişim kaydı” olarak değiştirilmesi ve gerçek medya sayısının ayrıca gösterilmesi uygun olur.
- Canlı API 200 kayıtla sınırlı; admin istemcisi 500 istese de mevcut 71 kayıt için sonuç kaybı yok.
