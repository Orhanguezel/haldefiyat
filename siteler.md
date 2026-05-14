# Belediye Hal Fiyatı Siteleri — Tarama Notları

Son güncelleme: 2026-05-10 (akşam)

---

## ✅ ETL'e Eklendi

| Hal                          | URL                                                          | Yöntem                  | Ürün/gün | Notlar                                                                                                                                 |
| ---------------------------- | ------------------------------------------------------------ | ------------------------ | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Çorum**             | https://www.corum.bel.tr/hal-fiyatlari                       | Scrapling (`stealthy`) | ~60         | JS-rendered — direkt fetch 0 satır döner                                                                                            |
| **Kütahya**           | https://www.kutahya.bel.tr/hal.asp                           | Direct fetch             | ~76         | SSR,`Ürün Adı \| Ürün Cinsi \| Min \| Max \| Avg`                                                                                   |
| **Manisa**             | https://www.manisa.bel.tr/apps/sebzemeyvehali/               | Direct fetch             | ~93         | `Tip \| Adı \| Birim \| En Az \| En Çok`, kategori Tip sütunundan                                                                     |
| **Kahramanmaraş**     | https://kahramanmaras.bel.tr/sebze-meyve-fiyatlari           | Scrapling (`stealthy`) | ~37         | JS-rendered, 2 hal (KM + Elbistan), 2. tablo veri tablosu                                                                              |
| **Çanakkale**         | https://www.canakkale.bel.tr/tr/sayfa/1481-hal-fiyat-listesi | Scrapling (`stealthy`) | ~85         | TLS korumalı, kategori header satırlarından çıkarılır                                                                           |
| **Yalova**             | https://ebelediye.yalova.bel.tr/BilgiEdinme/FiyatListesi/    | Direct fetch             | ~100        | Her satırda tarih sütunu var — 30 gün staleness filtresi                                                                           |
| **Tekirdağ**          | https://www.tekirdag.bel.tr/hal_fiyat_gunluk                 | 2-adımlı Scrapling     | ~33         | Listing → max ID → detail; sayfa tarihi HTML'den çıkarılır; hafta sonu güncelleme yok                                           |
| **Trabzon**            | https://kurumsal.trabzon.bel.tr/halurunfiyatlari             | Scrapling (`dynamic`)  | ~68         | JS widget (`halfiyat.css`), Playwright render gerekti; div kart yapısı; ürün görselleri de indirildi                            |
| **Serik**              | https://www.batiakdeniztv.com/serik-hal-fiyatlari            | Direct fetch             | ~12         | BatıAkdeniz TV, 2-sütunlu tablo `Ürünler\|₺/kg`; `**` = fiyat yok → atla                                                      |
| **Kumluca**            | https://www.batiakdeniztv.com/kumluca-hal-fiyatlari          | Direct fetch             | ~22         | BatıAkdeniz TV, aynı parser                                                                                                          |
| **Gazipaşa**          | https://www.batiakdeniztv.com/gazipasa-hal-fiyatlari         | Direct fetch             | ~20         | BatıAkdeniz TV, yeni market:`gazipasa-hal`                                                                                          |
| **Alanya**             | https://www.batiakdeniztv.com/alanya-hal-fiyatlari           | Direct fetch             | ~8          | BatıAkdeniz TV, yeni market:`alanya-hal`; seyrek veri                                                                               |
| **Demre**              | https://www.batiakdeniztv.com/demre-hal-fiyatlari            | Direct fetch             | ~23         | BatıAkdeniz TV, yeni market:`demre-hal`                                                                                             |
| **Finike**             | https://www.batiakdeniztv.com/finike-hal-fiyatlari           | Direct fetch             | ~22         | BatıAkdeniz TV, yeni market:`finike-hal`                                                                                            |
| **Bolu**               | https://www.bolu.bel.tr (anasayfa)                           | Direct fetch (2-adım)   | ~50         | WordPress SSR; anasayfadan en güncel `/{DD-MM-YYYY}-toptanci-hal-fiyat-listesi/` URL'i çek; 12 sütunlu tablo, her satır 2 ürün |
| **Tekirdağ (arşiv)** | https://www.tekirdag.bel.tr/hal_fiyat_gunluk                 | 2-adımlı Scrapling     | ~212 gün   | `id:NNN` backfill modu eklendi; ID 1940–2151 toplu insert (~8000+ satır); ID sayısından tarih çıkarılır<br />                |

## ❌ Şimdilik Atlandı — Teknik Engel

| Hal               | URL                                                            | Engel                        | Açıklama                                                                                                                                                 |
| ----------------- | -------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Amasya**  | https://amasya.bel.tr/hal-fiyatlari                            | Listing HTML, içerik PDF    | Listing sayfasından URL çekilebilir (`/hal-fiyatlari/{DDMMYYYY}-hal-fiyat-listesi`), ama tıklayınca `.pdf` dosyası geliyor — PDF parse gerekiyor |
| **Muğla**  | https://www.mugla.bel.tr/halfiyatlari                          | Scrapling da boş döndü    | Direct fetch + Scrapling `stealthy` her ikisi de 0 byte; redirect loop var; muhtemelen CloudFlare veya CDN engeli                                        |
| **Hatay**   | https://hatay.bel.tr/hal-fiyatlari                             | JS-rendered, Scrapling boş  | `stealthy` + `dynamic` her ikisi de 0 byte/0 tablo döndü; güçlü bot koruması                                                                     |
| **Adana**   | https://www.adana.bel.tr/tr/hal-detay/2577                     | Site erişilemiyor           | HTTP timeout (`000`); domain yanıt vermiyor                                                                                                             |
| **Afyon**   | https://www.afyon.bel.tr/idet/864/1039                         | PDF format                   | Belgeler PDF olarak yükleniyor; HTML tablo yok                                                                                                            |
| **Isparta** | https://www.isparta.bel.tr/hal-meyve-ve-sebze-fiyatlari        | JS-rendered,`dynamic` boş | Playwright ile render edilse de tbody içeriği gelmiyor                                                                                                   |
| **Sivas**   | https://www.sivas.bel.tr/sayfa/toptan-sebze-ve-meyve-fiyatlari | JS-rendered,`dynamic` boş | Her iki Scrapling mode'u da 0 satır döndü                                                                                                               |
| **Samsun**  | https://samsun.bel.tr/icerik/2026-yili-hal-fiyatlari           | JS-rendered,`dynamic` boş | Dynamic mode test edildi; HTML içeriği boş geliyor                                                                                                      |

---

## ✅ Zaten Mevcut

| Hal                        | URL                                                        | Kaynak Key                   | Notlar                                                                     |
| -------------------------- | ---------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| **Balıkesir**       | https://halvepazarfiyatlari.balikesir.bel.tr/SebzeMeyveHal | `balikesir_resmi`          | 2-step CSRF + POST — scraper-service'e session/cookie API gerekince aktif |
| **Eskişehir**       | https://www.eskisehir.bel.tr/hal-fiyatlari                 | `eskisehir_resmi`          | Aktif                                                                      |
| **Bursa**            | https://www.bursa.bel.tr/hal_fiyatlari                     | `bursa_resmi`              | Aktif                                                                      |
| **Konya**            | https://www.konya.bel.tr/hal-fiyatlari                     | `konya_resmi`              | Aktif                                                                      |
| **Denizli**          | https://www.denizli.bel.tr/Default.aspx?k=halfiyatlari     | `denizli_html`             | Aktif                                                                      |
| **Antalya (Merkez)** | https://www.antalyakomisyonculardernegi.com/               | `antalya_merkez_antkomder` | Scrapling, aktif                                                           |
