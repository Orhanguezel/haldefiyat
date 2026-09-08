# ETL sağlık uyarısı + sosyal medya temizliği — bulgular

**8 Eylül 2026.** ETL alarmı (1 kritik, 13 uyarı) tek tek incelendi. Sosyal medya
tarafı bu repodan temizlendi. **`ekosistem-sosyal-medya` reposuna hiçbir yazma
yapılmadı** — Tanitio'yu ilgilendiren bulgular aşağıda, orada uygulanmak üzere.

---

## 1. Düzeltilen gerçek veri hatası: `avg > max`

**Belirti:** `istanbul_ibb` her gün iki satırı sıhhat reddine düşürüyordu.

```
Ahududu:       avg (891) > max (774)
Yaban Mersini: avg (945) > max (798)
```

Ortalama, en yüksek fiyattan büyük olamaz — bu bir hesap hatasıydı, kaynak
sorunu değil.

**Kök neden — iki katmanlı.**

*Katman 1: eşik her değere ayrı uygulanıyordu.* `scaleSuspiciousCents` "≥1000
ise kuruştur, 100'e böl" kuralını `min`, `max` ve `avg`'ye **bağımsız**
uyguluyordu. 1000'i çapraz geçen satır kendi içinde tutarsız kalıyordu:

| | ham | ≥1000 mü? | sonuç |
|---|---|---|---|
| min | 1008 | evet | 10,08 |
| max | 774 | hayır | 774 |
| avg | (1008+774)/2 = 891 | hayır | 891 |

Aritmetik tersine çevrildiğinde rapor edilen 891/774 çifti **yalnızca** bu yolla
oluşabiliyor; Yaban Mersini de aynı desende (ham min 1092 → 10,92).

*Katman 2: İBB zaten kuruş yayımlamıyor.* Kendi kayıtlarımızda İBB fiyatları
**5 TL (Dereotu) – 980 TL (Yaban Mersini)** aralığında. Kuruş olsaydı Dereotu
0,05 TL olurdu. Üstelik ham Ahududu değeri 774–1008 iken **aynı gün Antalya
bülteni Ahududu'yu 800,00–1.040,00 TL/kg** yayımlıyor — yani 774–1008 gerçek TL
fiyatı. Sezgisel yalnızca pahalı ithal üründe tetikleniyor ve doğru fiyatı
100'e bölerek yok ediyordu.

**Yapılan:**
1. Kuruş kararı artık **satır başına bir kez** veriliyor (satırın en büyük
   değerine bakılır) ve üç değere de aynı uygulanıyor — min/max/avg ilişkisi
   her durumda korunuyor.
2. `istanbul_ibb`, `CENT_SCALED_SOURCES` listesinden **çıkarıldı**. Bursa da
   2026-06-09'da aynı sebeple çıkarılmıştı.

**Bu sezgiselin üçüncü kez zarar verişi** (Bursa → Kayseri koli fiyatları →
İBB). Kalan üç kaynakta (`balikesir_resmi`, `hal_gov_tr_ulusal`,
`kayseri_resmi`) bozulma kanıtı bulunmadı, dokunulmadı; ama fiyat aralıkları
(3–995 TL, ortalama 58–74 TL) hiçbirinin kuruş yayımlamadığını düşündürüyor.
**Önerilen sonraki iş:** her biri için ham kaynak değeriyle saklanan değeri
karşılaştırıp sezgiselin gerçekten iş yapıp yapmadığını ölçmek. İş yapmıyorsa
tamamen kaldırılmalı.

---

## 2. Kritik alarm aslında geçici kesinti

`polatli_borsa` → `HTTP 500 @ bulten.polatliborsa.org.tr` **KRİTİK** olarak
bildirildi. Kaynak şu anda sağlam: yerel IP'den üç deneme ve VPS'ten bir deneme,
**dördü de HTTP 200** (4.135 bayt).

CLAUDE.md'de bu desen zaten kayıtlı: *"21 günde 5 kez geçici HTTP 500; hemen
ardından normal"* — bu yüzden `fetchWithServerRetry` (yalnız 5xx, 3 deneme,
artan bekleme) eklenmişti. Bugün üç deneme de kesinti penceresine denk gelmiş.

**Öneri:** geçici 5xx'in KRİTİK'e yükselmesi alarm yorgunluğu üretiyor. Kaynak
bir sonraki koşuda düzeliyorsa uyarı seviyesinde kalmalı; KRİTİK, art arda
**iki koşu** başarısız olduğunda verilmeli.

---

## 3. Karantina uyarılarının çoğu sistemin doğru çalışması

13 uyarının 9'u `PRICE_QUARANTINED:*` — yani karantina aykırı değeri yakalamış.
Bu bir arıza değil, korumanın çalıştığının kanıtı. Ancak her gün 13 satırlık
alarm gelmesi gerçek sorunu (yukarıdaki `avg > max` gibi) gölgeliyor.

**Öneri:** alarm metnini iki bölüme ayır — "müdahale gerektiren" (fetch hatası,
sıhhat reddi, ardışık boş koşu) ve "bilgi" (karantinaya alınan tekil ürünler).
İkincisi günlük özet sayısı olarak verilsin, ürün ürün listelenmesin.

**İncelenmesi gereken tekil kalemler:**

| Kaynak | Belirti | Not |
|---|---|---|
| `canakkale_resmi` | MANTAR, MARUL (3 çeşit) → `PRODUCT_UNIT_MISMATCH` | Ürün birim kimliği ile kaynak birimi çelişiyor; adet/kg ayrımı olabilir |
| `canakkale_resmi` | ZENCEFİL → absürd fiyat > 1500 TL | Zencefil İBB'de 198–233 TL; 1500+ muhtemelen kaynak hatası |
| `tobb_borsa_konya` | üst üste 3 koşuda 0 satır | Konya borsası 14.05'te durmuştu; hâlâ yayın yok |
| Manisa / kiraz | 45 TL, akran medyanı 114 TL (0,39x) | Kiraz sezonu bitti; muhtemelen bayat satır ya da yanlış eşleşme |
| Ulusal / pancar | 8,31 TL, akran medyanı 33,25 TL | Şeker pancarı ile kırmızı pancar karışmış olabilir |
| Ulusal / domates-ayas | 6,18 TL, akran medyanı 40,63 TL | Ayaş domatesi ayrı çeşit; eşleştirme kontrol edilmeli |

---

## 4. Sosyal medya tarafı bu repodan temizlendi

**Karar:** yayın ve takip tek yerden, Tanitio'dan. hal-fiyatlari bu işi
yapmayacak, panelinde de göstermeyecek.

**Kaldırılanlar** (`69e134f4` + bu tur):
- `/admin/twitter`, `/admin/facebook`, `/admin/instagram`
- `/admin/ga4`, `/admin/google-ads`, `/admin/gtm`, `/admin/meta`
- Menü girdileri, etiketler, `navigation/permissions` anahtar ve rota eşlemeleri
- Ölü kalan lucide ikon import'ları
- Hiçbir kodun okumadığı 6 adet FB/IG kimlik alanı (`facebook_page_access_token`
  vb.) — seed'den ve canlı DB'den (`41043c79`)

**Bilerek bırakılanlar ve gerekçesi:**

| Ne | Neden |
|---|---|
| `/admin/search-console` | GSC API'si programatik kullanılıyor: rakip keşfi, analiz kalite paneli, SEO index, seo-volume, cron |
| `/admin/google-connect` | O API'nin **yetkilendirme kapısı**. Kaldırılsaydı refresh token bozulduğunda GSC'yi yeniden yetkilendirmenin yolu kalmazdı |
| `/admin/banners` | Reklam pazaryeri — gelir tarafı, sosyal takip değil |
| `modules/social/cards/*` | Tanitio'nun **çektiği içerik kaynağı**. Silinseydi günlük bülten kartları üretilemezdi |
| `modules/social/repository.ts` | Tanitio DB'sini **salt-okunur** okuyan görüntüleyici. Silinseydi Tanitio'nun FB/IG gönderileri haldefiyat.com'da görünmez olurdu |
| Telegram + WhatsApp yayıncıları | hal-fiyatlari'nın kendi kanalları, çift başlı değil |
| `twitter:card` SEO ayarları | Meta etiketi, yayın değil |

**Yan etki:** Meta Pixel paneli kalktı; `meta_pixel_id` ve `meta_capi_token`
ayarları `site_settings`'te duruyor, pixel çalışmaya devam eder ama buradan
düzenlenemez. Yönetimi Tanitio'ya geçer.

---

## 5. Tanitio tarafında yapılması gerekenler (bu repodan yapılmadı)

1. **Instagram'da 19 hata birikmiş.** `platform_accounts` kaydında
   `error_count=19`, `last_error` boş; Facebook'ta 0. Yeni içerik üretmeden
   önce bakılmalı, yoksa hazırlanan reel'ler yayına düşmez.
2. **`last_error` doldurulmuyor.** Hata sayılıyor ama mesaj saklanmıyor —
   teşhis imkânsız. Hata yazıcısı mesajı da kaydetmeli.
3. **Sitedeki Instagram adresi düzeltildi** (`halde_fiyat`), Tanitio referans
   alındı. Facebook linki de düzeltildi: site Business Suite varlık kimliğine
   (`1093315187207024`) link veriyordu, artık gerçek sayfa adresine veriyor.
   Graph API tarafındaki `page_id` **değiştirilmedi** — orası doğru.
4. **Facebook sayfasının "Telefon" alanı** +49 WhatsApp numarasını gösteriyor;
   sitede arama hattı +90. Meta panelinden hizalanabilir.
