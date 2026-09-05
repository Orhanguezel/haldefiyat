# Şehir × Ürün Sayfa Ailesi — Fizibilite (2026-09-05)

Kaynak: rakip keşfi 3. koşusu (Brave, 30 GSC sorgusu), GSC 28 gün / 2.000 sorgu, hf_price_history 90 gün.

## 1. Rakipler ne yapıyor

| Rakip | URL kalıbı | Örnek | Not |
|---|---|---|---|
| harmanapps.com | `/<urun>-fiyati/<sehir>` + `/hal-borsa-fiyatlari/<sehir>` | `/limonmayer-fiyati/adana`, `/hal-borsa-fiyatlari/ankara` | 30 sorgunun 26'sında, ort. #3,7. Cloudflare arkasında, sayfa yapısı okunamadı. Başlık kalıbı "**{Şehir} {Ürün} Fiyatları Bugün Kaç TL 2026**". |
| tarimziraat.com | `/fiyat/<sehir>_<urun>_fiyatlari-b<sehir>,<urun>.html` | `adana_limon_fiyatlari-b1,30.html` | ~1.075 kelime, tablo yok, tek H3; yine de "adana limon" ve "mersin limon"da #1. Kelime çok, yapı zayıf: bizim veri üstünlüğümüz burada. |
| halfiyatlari.tr | `/<sehir>/` + `/<sehir>/<ilce>/` | `/istanbul/bayrampasa/` | ~800 kelime, 5 H2, 13 grafik. Şehir sayfalarında bizden önde (Kocaeli #2, Konya #3). Ürün × şehir yok. |

Üç rakibin ortak noktası: **şehir adı URL'de ve başlıkta**. Bizde şehir yalnız `/hal/<slug>` (hal adı) ve `/urun/<slug>` içindeki şehir satırında var.

## 2. Talep (GSC, 28 gün, ilk 2.000 sorgu)

| Sorgu tipi | Sorgu | Gösterim | Tıklama | Pay |
|---|---|---|---|---|
| ürün (şehirsiz) | 1.056 | 87.456 | 3.201 | %44 |
| şehir (ürünsüz: "x hal fiyatları") | 217 | 43.653 | 2.044 | %22 |
| **şehir × ürün** | **235** | **35.525** | **1.017** | **%18** |
| diğer | 492 | 32.419 | 1.491 | %16 |

Şehir × ürün diliminde CTR %2,9, ortalama pozisyon 6–9: görünüyoruz ama ulusal ürün sayfasıyla giriyoruz; rakip şehir sayfası bizi geçiyor. En büyükleri: adana limon 4.251, mersin limon 3.525, adana mayer limon 1.373, adana limon piyasası 1.001, adana mandalina 774, nevşehir patates 419, bursa domates 322.

**Kritik uyumsuzluk:** talebin en büyük kısmı Adana/Mersin; bu iki ilin hali çevrimiçi liste yayınlamıyor (IP engeli / kaynak yok). Oralarda şehir × ürün sayfası **veriyle** kurulamaz; `/piyasa/<slug>` elle yazılan bölgesel sayfa (erdemli-limon, adana-mayer-limon) doğru araç.

## 3. Veri kapasitesi (aktif hal, 90 gün, ulusal hal.gov.tr hariç)

| Gün bandı | (ürün, şehir) çifti | Şehir | Ürün |
|---|---|---|---|
| 60+ | 862 | 13 | 213 |
| 30–59 | 457 | 17 | 187 |
| 10–29 | 286 | 20 | 164 |

60+ gün şehirleri: Bursa 134 ürün, Konya 95, Kayseri 94, Manisa 82, Denizli 78, Kütahya 74, İstanbul 64, Trabzon 57, Çorum 49, Eskişehir 49, Kocaeli 47, Antalya (Serik/Kumluca/Demre) 27, Yalova 12. Ankara 54 gün, İzmir 68, Gaziantep 54 → 45 gün eşiğiyle girer. **Her çift tek hal'e dayanır** (markets=1): sayfa "o halin o ürünü" demek; ince içerik riski gerçek (firma sayfalarında 1.230 URL bu yüzden indexlenmedi).

## 4. Öneri: pilot, tam aile değil

Rota: `/fiyat/<sehir>/<urun>` (örn. `/fiyat/bursa/domates`). Statik değil, veriden üretilen; sitemap'e yalnız kapı koşulunu geçenler girer.

Kapı (hepsi birden): ürün `seo_index=1` ve master; çiftte son 90 günde ≥45 veri günü; ürün `search_volume ≥ 5.000` **veya** GSC'de o şehir+ürün sorgusu ≥100 gösterim; hal aktif ve son 14 günde veri var. Kapıyı kaybeden sayfa **noindex**'e düşer, 404 olmaz (haftalık `runSeoIndexMaintenance` ile aynı ritim).

Sayfayı rakipten ayıran, kopyalanamayan içerik (hepsi API'den, sabit sayı yok): bugünkü fiyat + hal adı + tarih; 90 gün trend grafiği (bu çifte özel); ulusal medyana göre fark (%) ve şehrin sırası; haftalık değişim cümlesi; aynı halde aynı gün en çok değişen 5 ürün (iç link); komşu şehirlerde aynı ürün (iç link, çapraz sayfa); ürünün editoryal "fiyat etkenleri" ve "sezon" blokları (hf_product_editorial, zaten var). Başlık kalıbı: "**{Şehir} {Ürün} Fiyatları — {Hal adı} güncel, 5 Eylül 2026**"; H1 "{Şehir} {Ürün} Fiyatları".

Pilot kapsamı: 12 şehir × ilk 25 ürün ≈ **~250 URL** (kapıyı geçen). Ölçüm 4 hafta: index oranı ≥%70, pilot sorgularda pozisyon ≥2 basamak iyileşme, CTR ≥%4. Geçerse aile 862 çifte açılır; kalırsa sayfalar noindex'e alınır, URL'ler 301 ile `/urun/<slug>`'a döner.

Adana/Mersin talebi için ayrı yol: `/piyasa/` altında 3 sayfa daha (adana-limon genel, mersin-limon, adana-mandalina) — elle yazılır, veri diğer illerden.

## 5. Yapılmayacaklar
- Ankara hal verisi 54 günlük ve tek kaynak; "ankara hal fiyatları" (3.083 gösterim) için önce `/hal/ankara-hal` sayfasını güçlendirmek (ilçe/semt adı: "Ankara Toptancı Hali (Yenimahalle)") daha ucuz.
- Şehir sayfası (`/<sehir>/`) ailesi açmak: `/hal/<slug>` zaten var; hal adına ilçe eklemek (Bayrampaşa örneği) yetiyor.
- 862 çifti tek seferde açmak: firma sayfası dersi.

## 6. Kararlar (Orhan)
1. Pilot onayı: `/fiyat/<sehir>/<urun>` ~250 URL.
2. Kapı eşikleri (45 gün / 5.000 hacim) — değiştirilebilir.
3. Adana/Mersin için 3 elle yazılan piyasa sayfası.
