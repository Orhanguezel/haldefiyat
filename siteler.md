# Belediye Hal Fiyatı Siteleri — Tarama Notları

Son güncelleme: 2026-05-10

---

## ✅ ETL'e Eklendi

| Hal | URL | Yöntem | Ürün/gün | Notlar |
|-----|-----|--------|----------|--------|
| **Çorum** | https://www.corum.bel.tr/hal-fiyatlari | Scrapling (`stealthy`) | ~60 | JS-rendered — direkt fetch 0 satır döner |
| **Kütahya** | https://www.kutahya.bel.tr/hal.asp | Direct fetch | ~76 | SSR, `Ürün Adı \| Ürün Cinsi \| Min \| Max \| Avg` |
| **Manisa** | https://www.manisa.bel.tr/apps/sebzemeyvehali/ | Direct fetch | ~93 | `Tip \| Adı \| Birim \| En Az \| En Çok`, kategori Tip sütunundan |
| **Kahramanmaraş** | https://kahramanmaras.bel.tr/sebze-meyve-fiyatlari | Scrapling (`stealthy`) | ~37 | JS-rendered, 2 hal (KM + Elbistan), 2. tablo veri tablosu |
| **Çanakkale** | https://www.canakkale.bel.tr/tr/sayfa/1481-hal-fiyat-listesi | Scrapling (`stealthy`) | ~85 | TLS korumalı, kategori header satırlarından çıkarılır |
| **Yalova** | https://ebelediye.yalova.bel.tr/BilgiEdinme/FiyatListesi/ | Direct fetch | ~100 | Her satırda tarih sütunu var — 30 gün staleness filtresi |
| **Tekirdağ** | https://www.tekirdag.bel.tr/hal_fiyat_liste_detay/2151 | 2-adımlı Scrapling | ~33 | Listing: `/hal_fiyat_gunluk` → max ID → detail. Hafta sonu güncelleme yok. Sayfa tarihi HTML'den çıkarılır |

---

## ⏳ Bekleyen — İmplementable

| Hal | URL | Engel | Çözüm Planı |
|-----|-----|-------|-------------|
| **Amasya** | https://amasya.bel.tr/hal-fiyatlari/02052026-hal-fiyat-listesi | Haftalık (Cumartesi), URL slug `/{DDMMYYYY}-hal-fiyat-listesi` | Listing sayfası `/hal-fiyatlari`'ndan son linki çek; ya da tarihe göre slug üret |
| **Muğla** | https://www.mugla.bel.tr/halfiyatlari/07-mayis-2026-tarihli-toptanci-halleri-urun-fiyatlari | Tarih-specific URL (Türkçe ay adı), çoklu bölge tablosu | Türkçe ay adı map'i → slug üret; tablo multi-region |
| **Bolu** | https://www.bolu.bel.tr/01-05-2026-haftalik-fiyat-listesi/ | Haftalık fiyat listesi, URL slug tarih-based | Listing sayfasından son linki çek |
| **Tekirdağ (arşiv)** | https://www.tekirdag.bel.tr/hal_fiyat_gunluk | Hafta sonu güncelleme yok | Mevcut 2-adımlı fetch sayfa tarihini doğru okur, UNIQUE constraint çakışma yok |
| **Hatay** | https://hatay.bel.tr/hal-fiyatlari | Tarih listesi sayfası, her gün ayrı URL | Listing sayfasından bugünkü linki çek |
| **Adana** | https://www.adana.bel.tr/tr/hal-detay/2577 | Ardışık ID (Tekirdağ benzeri pattern) | Listing sayfasını bul, max ID stratejisi |

---

## ❌ Şimdilik Atlandı — Teknik Engel

| Hal | URL | Engel | Açıklama |
|-----|-----|-------|----------|
| **Trabzon** | https://kurumsal.trabzon.bel.tr/halurunfiyatlari | Özel `halfiyat.css` JS widget | Scrapling `dynamic` mode bile veri döndürmüyor — sayfa özel JS bileşeni kullanıyor |
| **Afyon** | https://www.afyon.bel.tr/idet/864/1039/mayis-ayi-gunluk-sebze-ve-meyve-toptan-fiyat-listesi | Latin-1 encoding, belgeler PDF | PDF parse gerekiyor |
| **Isparta** | https://www.isparta.bel.tr/hal-meyve-ve-sebze-fiyatlari | JS-rendered, tablo yok | Dynamic mode denendi, tbody içi boş geliyor |
| **Sivas** | https://www.sivas.bel.tr/sayfa/toptan-sebze-ve-meyve-fiyatlari | JS dynamic, 0 tablo | Dynamic mode bile tablo üretmiyor |
| **Samsun** | https://samsun.bel.tr/icerik/2026-yili-hal-fiyatlari | JS dynamic, 0 tablo | Dynamic mode sonucu da boş |

---

## ✅ Zaten Mevcut

| Hal | URL | Kaynak Key | Notlar |
|-----|-----|------------|--------|
| **Balıkesir** | https://halvepazarfiyatlari.balikesir.bel.tr/SebzeMeyveHal | `balikesir_resmi` | 2-step CSRF + POST — scraper-service'e session/cookie API gerekince aktif |
| **Eskişehir** | https://www.eskisehir.bel.tr/hal-fiyatlari | `eskisehir_resmi` | Aktif |
| **Bursa** | https://www.bursa.bel.tr/hal_fiyatlari | `bursa_resmi` | Aktif |
| **Konya** | https://www.konya.bel.tr/hal-fiyatlari | `konya_resmi` | Aktif |
| **Denizli** | https://www.denizli.bel.tr/Default.aspx?k=halfiyatlari | `denizli_html` | Aktif |
| **Antalya (Merkez)** | https://www.antalyakomisyonculardernegi.com/ | `antalya_merkez_antkomder` | Scrapling, aktif |
