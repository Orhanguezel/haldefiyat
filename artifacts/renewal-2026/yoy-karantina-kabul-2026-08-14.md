# Tarihsel seri karantinası ve YoY yayın kapısı — canlı kabul

**Tarih:** 14 Ağustos 2026

**Kod:** `3182f15f` (tüketiciler + YoY kapısı), `299a563a` (blackout tarih normalizasyonu)

**Canlı:** `haldefiyat.com`, backend `8091`, frontend `3033`

## Sonuç

2023–Nisan 2026 döneminde donmuş olduğu doğrulanan Bursa, Denizli ve Eskişehir
serileri ile aktif Alanya anomali aralığı silinmeden merkezi `hf_market_blackouts`
filtresiyle public hesaplardan çıkarıldı. `*_wayback` kaynaklı doğrulanmış kurtarma
kayıtları görünür kalır. Kamuya açık YoY yüzdeleri, tam ve karşılaştırılabilir bir yıl
oluşmadan yayınlanmamak üzere **1 Mayıs 2027** tarihine kadar kapalıdır; bu tarihten
sonra da en az 5 eşleşmiş `(hal × ürün)` çifti gerekir.

## Kök neden ve ek düzeltme

Canlı kabul sırasında mevcut blackout yardımcısının MySQL `DATE` nesnesini
`String(date).slice(0, 10)` ile `"Fri Apr 21"` biçimine çevirdiği bulundu. Böylece
önceden yalnız endekse eklenmiş görünen karantina koşulu fiilen hiçbir satırı
ayıklamıyordu. `normalizeBlackoutDate` artık `Date` nesnesini ISO `YYYY-MM-DD`
biçimine çeviriyor, bozuk değerlerde sessiz devam etmek yerine hata veriyor.
Üç regresyon testi bu davranışı koruyor.

## Canlı veri kanıtı

| Ölçüm | Sonuç |
|---|---:|
| Aktif blackout aralığındaki ham satır | 350.778 |
| Wayback muaf/kurtarılmış satır | 5.473 |
| 2025 ham satır | 282.728 |
| 2025 blackout aralığına düşen satır | 116.702 |
| 2025 Wayback muaf satır | 1.907 |
| 2025 raporlamaya uygun satır | **167.933** |

Canlı `/api/v1/reports/annual?year=2025` yanıtındaki `overview.totalRows=167933`,
DB'deki `NOT EXISTS hf_market_blackouts` hesabıyla birebir eşleşti. Yanıt ayrıca
`dataQuality.frozenSeriesExcluded=true` ve etkilenen hal listesini taşır.

Domates 2025 örnekleminde 1.437 karantinalı ham gözlem API'den çıkarıldı; 24 Wayback
gözlemi 13 `(hal × ay × birim)` kovasına gruplanarak geçmiş grafiğinde korundu.
Bu sayı API'nin 13 etkilenen-hal 2025 kovasıyla birebir eşleşti.

## Kapsanan tüketiciler

- Ana fiyat liste/sayfalama ve latest-only CTE'leri
- Ürün 5 yıllık daily/weekly/monthly/auto geçmişi
- Varyant fiyatları ve widget
- Ulusal mover, sabit sepet, mevsimlik ve haftalık özetler
- Yıllık rapor ve yıllık rapor yıl listesi
- Şehir fiyat haritası, SEO uygun ürün taraması ve kaynak durumu
- RSS, Telegram fiyat komutu, fiyat alarmı ve ilan fiyat anomali kontrolü
- Endeksin mevcut merkezi blackout tüketimi

## YoY yüzey kabulü

- Widget: `yoyChangePct=null`, `yoyStatus=insufficient_history`.
- Domates varyant API'si: 14/14 satırda `yoyPct=null`, gerekçe alanı mevcut.
- Ürün fiyat tablosuna yıllık referans aktarılmıyor; sessiz `% geçen yıla` metni yok.
- “Yıllık Karşılaştırma” başlığı “Yıllara Göre Sezon Eğrileri” olarak düzeltildi;
  görünür veri kapsamı/Mayıs 2027 notu eklendi.
- Yıllık raporda ham arşiv değil doğrulanmış kapsam açıkça belirtiliyor.
- Güvenilmez şehir bazlı YoY içeren `elma-fiyat-analizi-mayis-2026` silinmeden
  `published → draft` yapıldı; public rota 404.
- Bülten karşılama metnindeki yıllık kıyas vaadi kaldırıldı.

## Test ve tarayıcı kabulü

- Backend: blackout tarih normalizasyonu 3/3; YoY politika sınırı 3/3; ilgili toplam 6/6.
- Backend TypeScript üretim derlemesi başarılı.
- Frontend YoY politika testi 2/2, TypeScript, ESLint ve Next.js üretim derlemesi başarılı.
- Mobil canlı ürün sayfası 390×844: `scrollWidth=390`, kapsam notu görünür,
  sessiz YoY metni yok, console hata/uyarı 0.
- Mobil canlı 2025 yıllık rapor: `scrollWidth=390`, 167.933 temiz satır ve kapsam notu görünür.
- PM2 `hal-backend` ve `hal-frontend` online; health 200, ürün sayfası 200.

Görseller:

- `output/playwright/e17-yoy/domates-mobile-2026-08-14.png`
- `output/playwright/e17-yoy/yillik-2025-mobile-2026-08-14.png`

Not: Taslağa alınan analizin 404 ağ isteği browser console'da beklenen bir resource
404 kaydı üretir; ürün ve yıllık rapor kabulünde console hatası yoktur.
