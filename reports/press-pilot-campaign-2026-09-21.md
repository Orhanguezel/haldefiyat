# Basın pilot kampanyası — 21 Eylül 2026

## Durum

- Canlı Basın CRM kampanya kimliği: **6**
- Kampanya: **Pilot — 7–13 Eylül 2026 Basın Notu**
- Durum: **completed**
- Planlanan alıcı: **8**
- Gönderilen: **8/8**
- Onay: **21 Eylül 2026 16:22:33 UTC** — içerik/alıcı hash'i `7806d018c6a0fb083f3e2b3c4c69db32531174f650e270eb9d7c32d9912c63fb`
- Gönderim: **21 Eylül 2026 16:22:36–16:25:11 UTC**
- Gönderen: `HaldeFiyat <noreply@haldefiyat.com>`
- Yanıt adresi: `info@gzlteknoloji.com`

Basın CRM'e HTML + düz metin önizleme, içerik ve alıcı listesine bağlı açık onay,
suppression kapısı ve kalıcı hız sınırlı kuyruk eklendi. Önce
`info@gzlteknoloji.com` adresine test iletisi gönderildi; SMTP sunucusu iletiyi
`250` ile kabul etti. Ardından yalnız aşağıdaki sekiz alıcıya pilot gönderildi.
Sekiz kaydın tamamında sağlayıcı ileti kimliği var; hata, bounce ve belirsiz
teslim kaydı oluşmadı. Ardışık gönderimler arasındaki ölçülen aralık 19–29
saniyedir (ayar: en fazla 4 ileti/dakika, hedef aralık 15–25 saniye; işçi
polling süresi üst sınıra eklenebilir).

## CRM mesaj görünürlüğü — 21 Eylül 2026

- [x] Her yeni gönderimde konu, HTML, düz metin, gönderen ve Reply-To alıcı bazında değişmez snapshot olarak saklanıyor.
- [x] Pilot kampanyanın 8/8 geçmiş gönderim kaydı gerçek alıcıya özgü içerikle geri dolduruldu.
- [x] Medya kişisi > Temas paneline “Gönderilen mesaj” alanı, düz metin ve HTML sekmeleri eklendi.
- [x] T24 canlı kayıt API doğrulaması: `snapshotSource=delivery`, HTML 3.309 karakter, düz metin 1.181 karakter.

## Kurumsal logo ve yönetilebilir imza — 21 Eylül 2026

- [x] Basın e-postasının düz metin marka başlığı, bilinen turuncu-beyaz HaldeFiyat logosuyla değiştirildi.
- [x] Logo URL'si, logo alternatif metni, kısa açıklama, marka rengi, imza adı/açıklaması, e-posta ve web adresi Basın > Kampanyalar ekranındaki **E-posta marka ve imza ayarları** kartından yönetilebilir.
- [x] HTML imzası ve düz metin imzası aynı merkezi ayardan üretiliyor; kampanya metnindeki eski elle yazılmış HaldeFiyat imzası ikinci kez basılmıyor.
- [x] Marka ayarı gönderim ön kontrol hash'ine dahil edildi; değişiklik, daha önce verilmiş kampanya onayını geçersiz kılıyor ve yeniden önizleme/onay gerektiriyor.
- [x] Canlı logo URL'si `200 image/png`; gerçek tarayıcı önizlemesinde logo ve imza görünür.
- [x] Canlı iç test `info@gzlteknoloji.com` adresine kabul edildi: konu `[TEST ÖNİZLEME] HaldeFiyat logo ve imza`, sağlayıcı ileti kimliği `<2b5695bc-2d3f-d51c-ec50-20c369ee7473@haldefiyat.com>`.

Not: Yukarıdaki 8 pilot iletinin gönderim snapshot'ları tarihsel kayıt olarak değiştirilmedi. Yeni logo ve imza, yeni önizleme ve gönderimlerde uygulanır.

## Kalan listenin iki turlu gönderim planı — 22–23 Eylül 2026

Canlı 71 kayıt yeniden denetlendi: 8 pilot alıcıya daha önce gönderildi, 1 kayıt daha önce yanıt verdiği için yeniden temasa kapalı, kalan 62 hedef iki ayrı içerik grubuna alındı. Gruplar arasında alıcı çakışması yoktur; planlama anında geçersiz, mükerrer, engelli veya suppression eşleşmesi bulunmamıştır.

| Tur | Kampanya | Kitle | Alıcı | Başlangıç | Kuyruk aralığı | Konu |
|---|---|---|---:|---|---|---|
| 1 | `#7` | Gazete, yayın sitesi ve haber ajansı | 14 | 22 Eylül 2026 10:00 TSİ | 10:00–10:04:19 TSİ | Basın notu: HaldeFiyat Endeksi %1,2 yükseldi; 71 ürünün 46’sında gerileme |
| 2 | `#8` | Oda, borsa, dernek, kamu kurumu ve fakülte | 48 | 23 Eylül 2026 10:00 TSİ | 10:00–10:15:49 TSİ | HaldeFiyat haftalık veri özeti: 71 üründe hal fiyatı görünümü |

- [x] İki kampanya da içerik + marka ayarı + alıcı listesine bağlı preflight hash'i ile onaylandı.
- [x] Her alıcı tekil `To` ile, `noreply@haldefiyat.com` göndereni ve `info@gzlteknoloji.com` Reply-To adresiyle planlandı.
- [x] Hız sınırı kampanya başına en fazla 4 ileti/dakika; ileti aralığı 15–25 saniye.
- [x] HTML ve düz metin, yönetilen HaldeFiyat logosu ve imzasıyla üretilecek.
- [x] Planlama doğrulaması: 62 `planned`, 0 sağlayıcı teslimi; yani plan hazırlanırken erken gönderim olmadı.
- [x] Geleceğe planlama alanı Basın > Kampanyalar ekranına eklendi.

Planlanan süreler işçi polling aralığı nedeniyle birkaç saniye uzayabilir. Gönderim anında suppression, alıcı durumu ve onay hash'i tekrar kontrol edilir; değişiklik varsa kampanya güvenli biçimde durur.

### Logo istemcisi düzeltmesi ve güvenli bekleme

İlk marka testinde Hostinger dış HTTPS görselini gizlilik nedeniyle engelledi ve logo izin verilene kadar boş göründü. Bu nedenle kampanya `#7` ve `#8`, herhangi bir yeni alıcıya teslim yapılmadan `draft` durumuna geri alındı. Logo artık MIME içine `Content-ID: haldefiyat-logo@haldefiyat.com` ve `Content-Disposition: inline` ile gömülüyor; e-posta HTML'i `cid:` kaynağını kullanıyor.

- [x] CID render testi ve backend typecheck geçti (`6/6` test).
- [x] Düzeltilmiş test `info@gzlteknoloji.com` adresine SMTP tarafından kabul edildi: `[TEST DÜZELTİLDİ] HaldeFiyat gömülü logo ve imza`, ileti kimliği `<984ec911-7673-8eea-368d-41657058d13c@haldefiyat.com>`.
- [ ] Gerçek Hostinger gelen kutusunda görsel izni vermeden logo görünümü kullanıcı tarafından teyit edilmeli.
- [ ] Teyitten sonra `#7` ve `#8` yeniden hash onaylı olarak 22–23 Eylül 10:00 TSİ saatlerine alınmalı.

## Pilot alıcılar

| Kuruluş | E-posta | Segment |
|---|---|---|
| Ekonomim | `ekonomim@nbe.com.tr` | Ulusal ekonomi |
| Bloomberg HT | `editor@bloomberght.com` | Ulusal ekonomi / TV |
| Anadolu Ajansı — Ekonomi | `kurumsaliletisim@aa.com.tr` | Haber ajansı |
| Tarımdan Haber | `iletisim@tarimdanhaber.com` | Tarım yayını |
| Agro World Tarım Dünyası | `haber@aramedya.com` | Tarım yayını |
| Mersin Times | `mersintimes@gmail.com` | Yerel basın / Mersin |
| Adana 5 Ocak | `adana5ocakgazetesi@gmail.com` | Yerel basın / Adana |
| T24 | `bilgi@t24.com.tr` | Ulusal / veri gazeteciliği |

Bursa Olay mevcut durumda daha önce yanıt vermiş göründüğü için pilotun yeni alıcı grubuna alınmadı.

## Konu

> Basın notu: HaldeFiyat Endeksi %1,2 yükseldi; 71 ürünün 46’sında gerileme

## Taslak metin

Merhaba,

HaldeFiyat’ın 7–13 Eylül 2026 haftasına ilişkin hal fiyatları raporu yayımlandı.

Öne çıkan veriler:

- HaldeFiyat Endeksi önceki haftaya göre %1,2 artarak 71,82 puana yükseldi.
- Hafta içi hareketi ölçülen 71 ürünün 46’sında fiyat geriledi, 20’sinde yükseldi, 5’i yatay kaldı.
- Kapya biberin haller arası medyanı %30,7 gerilerken beyaz incir %57,8, nar %31,9 yükseldi.
- Analiz 10.613 fiyat gözlemi ile 39 hal ve borsa kaynağına dayanıyor.

Endeks sepeti ile ürün hareketlerinin kapsamı ve karşılaştırma yöntemi farklıdır; bu nedenle sonuç “bütün sebze ve meyveler pahalandı” şeklinde yorumlanmamalıdır.

Rapor:  
<https://haldefiyat.com/analiz/eylul-2-hafta-2026-hal-raporu>

Basın ve medya kiti:  
<https://haldefiyat.com/basin>

Endeks:  
<https://haldefiyat.com/endeks>

Haberleştirme için tablo, grafik, veri örneği veya kısa değerlendirme gerekirse memnuniyetle paylaşabiliriz.

Saygılarımızla,  
HaldeFiyat Veri Ekibi  
<https://haldefiyat.com>  
`info@gzlteknoloji.com`

## Gönderim öncesi kontrol

- [x] Yalnız basın-yayın kayıtları seçildi.
- [x] Suppression listesinde eşleşen pilot alıcı yok.
- [x] Alıcı kayıtları `target`; daha önce temas edilmemiş.
- [x] Kampanya `draft`; `scheduled_at` ve `sent_at` boş.
- [x] Her alıcı için CRM'de `planned` temas kaydı oluşturuldu.
- [x] Gerçek gönderim bağlantısı ve rate limit uygulandı; 8/8 sağlayıcı kabulü doğrulandı.
- [x] HTML gerçek tarayıcıda, düz metin içerik olarak son önizlemeden geçirildi.
- [x] Kullanıcı gönderim onayı güncel içerik/alıcı hash'ine bağlandı.
