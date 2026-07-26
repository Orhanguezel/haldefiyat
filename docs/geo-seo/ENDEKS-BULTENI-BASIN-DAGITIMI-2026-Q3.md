# HalDeFiyat Endeks Bülteni ve Basın Dağıtımı — 2026 Q3

## Canlı yayın kabulü

27 Temmuz 2026 kontrolünde özgün yayın serisi canlı ve süreklidir:

- Son tamamlanmış endeks: 2026-29, 85,2215; 15 ürün; 13–19 Temmuz.
- Haftalık seri örnekleri: Temmuz 1., 2. ve 3. hafta; Haziran 1.–4. hafta;
  Mayıs 4.–5. hafta.
- Aylık seri: `Haziran 2026 Aylık Hal Raporu: Sebze Fırladı, Meyve Ucuzladı`.
- Canonical arşiv: `https://haldefiyat.com/analiz`
- Endeks: `https://haldefiyat.com/endeks`

Bu nedenle “bülten oluştur” kabulü yalnız plan değil, yayımlanmış haftalık ve
aylık özgün veri serisiyle karşılanır.

## Basın listesi

- Dağıtım listesi:
  `docs/press/haldefiyat-press-distribution-q3-2026.csv`
- 12 doğrulanmış e-posta satırı.
- Segmentler: ulusal ekonomi, sektörel tarım, meslek kuruluşu, kamu, ulusal
  ajans ve yerel üretici.
- Her satırda haber uyumu, pitch şablonu, sıklık, doğrulama kaynağı ve durum
  bulunur.
- Liste kör toplu gönderim listesi değildir. Aynı kurumdaki iki adres ayrı
  editoryal işlev taşıyorsa korunur; bounce/ret/block sonucu CRM'de işlenir.

## Yayın takvimi

| Zaman | Çıktı | Dağıtım koşulu |
|---|---|---|
| Pazartesi 09:00 TRT | Tamamlanan haftanın endeks raporu | Endeks hafta/tarih/sepet kontrolleri geçerse |
| Ayın ilk iş haftası | Önceki ayın aylık hal raporu | Ortak-hal karşılaştırması, veri kapsamı ve editoryal review varsa |
| Olay bazlı | Ürün/şehir özel veri notu | ≥3 kaynak/hal veya açıkça belirtilmiş dar kapsam varsa |
| Çeyrek sonu | Veri kataloğu ve yöntem güncellemesi | Sürüm, kaynak kapsamı ve revizyon notu tamamlanırsa |

## Bülten sözleşmesi

Her haftalık/aylık bülten şu alanları taşır:

1. Kesin dönem ve son veri tarihi.
2. Endeks değeri, önceki dönem değişimi ve sepet ürün sayısı.
3. En çok yükselen/düşen en fazla üç ürün; hal/kapsam sayısıyla.
4. Bir cümlelik neden yorumu; veriyle kanıtlanmayan nedensellikten kaçınır.
5. Metodoloji ve sınırlılık.
6. Canonical analiz URL'si, endeks URL'si ve gerekiyorsa CSV/API URL'si.
7. Editoryal review/yazar ve gerçek yayın/değişiklik tarihi.

## Pitch eşlemesi

- Haftalık önemli hareket:
  `weekly_index_story_pitch`; yalnız değişim editoryal haber değeri taşıyorsa.
- Aylık rapor:
  `monthly_index_story_pitch`; ekonomi/tarım/ajans segmentine.
- Yıllık rapor:
  `annual_report_release`; tamamlanmış yıl ve doğrulanmış rapor sonrası.
- Platform tanıtımı:
  `press_release_launch`; sürekli tekrar edilmez.

Konu satırı rakam içerebilir ancak raporda bulunmayan yüzde veya “rekor” ifadesi
kullanılamaz.

## Gönderim öncesi kontrol

- [ ] Rapor canlı URL'si 200, self-canonical ve index/follow.
- [ ] Endeks haftası/tarihleri tamamlanmış haftaya ait.
- [ ] Başlık/özet ile görünür tablo değerleri eşleşiyor.
- [ ] Kaynak, kapsam, yöntem ve sınırlılık görünür.
- [ ] İletişim adresinin doğrulama kaynağı mevcut.
- [ ] Yayına özel segment/story fit eşleşiyor.
- [ ] UTM: `utm_source=press&utm_medium=earned&utm_campaign={campaign}`.
- [ ] Test e-postasında linkler ve Türkçe karakterler kontrol edildi.

## Mention ölçümü

`hf_press_outreach_logs` tek gerçek kayıt kaynağıdır:

- `planned → sent → replied → published` akışı,
- bounce/rejected kayıtları,
- canonical `publishedUrl`,
- linked/unlinked,
- dofollow/nofollow/sponsored/unknown,
- ilk görüldüğü ve son doğrulandığı tarih,
- referral session ve kampanya UTM'si.

90 günlük hedef: en az 5 bağımsız mention, 3 ilgili referring domain ve
pitch→yayın dönüşümünde ≥%10. Ücretli/sponsorlu içerik kazanılmış mention
sayılmaz.

## Yetki sınırı

Bu çalışma hiçbir alıcıya mesaj göndermedi. Kampanya ancak rapor verisi son kez
doğrulandıktan ve gönderim Orhan tarafından başlatıldıktan sonra `sent` olur.
