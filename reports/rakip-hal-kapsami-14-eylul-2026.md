# Rakip listesiyle hal kapsam karşılaştırması — 14 Eylül 2026

Kullanıcının verdiği 20 şehir üretim veritabanıyla karşılaştırıldı. 18 şehir hal kataloğunda mevcut. İki eksik: Malatya ve Aydın Acarlar. Mersin katalogda kayıtlı fakat resmî kaynak erişimi kapalı; son 30 günde fiyat kaydı yok. Hal kaydı bulunması ile güncel fiyat kapsamı aynı şey değildir.

| Şehir | Bizdeki hal | Son 30 gün içindeki son kayıt | Son 7 gün ürün sayısı |
|---|---|---|---:|
| Tokat | Tokat Toptancı Hali | 2026-09-14 | 37 |
| Kocaeli | Kocaeli Merkez Sebze Meyve Hali | 2026-09-14 | 60 |
| Bursa | Bursa Toptancı Hali | 2026-09-14 | 149 |
| İstanbul | İstanbul Bayrampaşa Toptancı Hali (İBB) | 2026-09-14 | 101 |
| Elazığ | Elazığ Belediyesi Toptancı Hali | 2026-09-14 | 30 |
| Ankara | Ankara Toptancı Hali | 2026-09-14 | 142 |
| Malatya | Eksik | — | 0 |
| İzmir | İzmir Toptancı Hali | 2026-09-14 | 178 |
| Çanakkale | Çanakkale Toptancı Hali | 2026-09-11 | 61 |
| Gaziantep | Gaziantep Toptancı Hali | 2026-09-11 | 21 |
| Kayseri | Kayseri Toptancı Hali | 2026-09-14 | 121 |
| Trabzon | Trabzon Toptancı Hali | 2026-09-14 | 80 |
| Kahramanmaraş | Kahramanmaraş Toptancı Hali | 2026-09-07 | 29 |
| Balıkesir | Balıkesir Toptancı Hali | 2026-09-14 | 112 |
| Manisa | Manisa Toptancı Hali | 2026-09-14 | 124 |
| Antalya | Antalya Toptancı Hali (Merkez) | 2026-09-12 | 77 |
| Antalya | Antalya Serik Hali | 2026-09-02 | 0 |
| Antalya | Antalya Kumluca Hali | 2026-09-02 | 0 |
| Antalya | Gazipaşa Toptancı Hali | 2026-09-02 | 0 |
| Antalya | Alanya Toptancı Hali | 2026-09-02 | 0 |
| Antalya | Demre Toptancı Hali | 2026-09-05 | 0 |
| Antalya | Finike Toptancı Hali | 2026-09-02 | 0 |
| Bolu | Bolu Toptancı Hali | 2026-09-11 | 40 |
| Aydın | Eksik | — | 0 |
| Denizli | Denizli Toptancı Hali | 2026-09-14 | 92 |
| Mersin | Mersin Toptancı Hali | — | 0 |

## Eksik kaynak araştırması ve engel

### Aydın Acarlar

Resmî arşiv bülteni bulundu:
https://aydin.bel.tr/Content/files/hal_fiyat/2025/Acarlar%20Hal%20B%C3%BClteni.pdf

Arama motorunun okuduğu belge tarihi 15.04.2025. Güncel bülten olarak kullanılmadı. Özellikle pembe domates bu eski belgede Adet yazıyor; kg varsayımıyla içe alınamaz. Güncel dosya ve gerçek birim doğrulaması gerekiyor.

### Malatya

Resmî belediye PDF arşivi bulundu:
https://www.malatya.bel.tr/upload/documents/hal-fiyatlari-17-19-eylul/hal-fiyatlari-17-19-eylul_5841.pdf

URL'deki gün/ay yıl veya güncellik kanıtı değildir. Arama sonucu eski bir belgeye işaret ediyor. Canlı belge indirilemediği için güncel fiyat olarak aktarılmadı. Eski kaynak dokümanındaki “Malatya'nın resmî yayını yok” iddiası düzeltildi.

### Bağlantı kontrolleri

- Yerel HTTPS: Aydın ve Malatya bağlantı zaman aşımı (25 saniye).
- Üretim sunucusu HTTPS www: iki kaynak bağlantı zaman aşımı (15 saniye).
- Yerel HTTP, www ve kök: iki kaynak bağlantı zaman aşımı (5 saniye).
- Mevcut merkezi scraper fast modu: iki kaynak da zaman aşımı / aborted.
- Web erişimi: belediye kökleri ve Malatya alt sayfası zaman aşımı.
- Mersin resmî fiyat sayfası: HTTP 403. Mevcut `mersin_resmi` devre dışı ayarı korundu.

## Sonuç ve uygulanacak adım

Yeni fiyat kaynağı veya boş indeksli hal sayfası açılmadı. Rakibin sayfasından fiyat kopyalanmadı, eski PDF bugünün tarihiyle yazılmadı. İki kaynak erişimi açıldığında mevcut belediye PDF akışına eklenecek: bülten bağlantısı keşfi, belgeden tarih ve birim okuma, parser fixture testi, mevcut ETL kalite kapılarıyla deneme, sonra günlük akış ve canlı hal/şehir-ürün sayfası doğrulaması.

Kanıt: `artifacts/market-coverage-2026-09-14/before.json`. Kapsam rakamları son 30 günlük ham kayıt kontrolüdür; tek tek satırların kamuya açık kalite filtresini geçtiği iddiası değildir.

## İkinci yükleme denemesi — 14 Eylül 2026

Kullanıcının tekrar deneme talebiyle ek kontroller yapıldı. Yerelde kök/www ve bilinen PDF adresleri yeniden denendi. İkinci sunucu `vps-guezel` üzerinden iki belediye de bağlantı zaman aşımı verdi. Google DNS A kayıtları yerel çözümlemeyle aynı: Aydın 85.111.93.92, Malatya 212.175.142.205. Bağımsız kamuya açık okuyucu üzerinden de her ikisi HTTP 422 / upstream navigation timeout döndürdü. Güncel tarihli, belediye kimliği ve birimi doğrulanabilir alternatif belge bulunamadı. Yüklenen fiyat sayısı: 0. Devam için erişilebilir güncel PDF veya doğrudan indirme bağlantısı gerekiyor. Kanıt: `artifacts/municipality-retry-2026-09-14/result.json` ve okuyucu yanıtları.

## Scraper mikroservisiyle tarayıcı denemesi

İki belediye için mevcut scraper mikroservisinin dynamic (tarayıcı) modu ve Çanakkale için tanımlı alternatif servis uç noktası kullanıldı. İki scrape isteği de istemcinin 55 saniyelik sınırında iptal oldu; HTML veya bülten bağlantısı alınamadı. Yerel scraper ve alternatif `scraper.guezelwebdesign.com` sağlık uçları HTTP 200, status/redis ok, browsers configured döndürdü. Dolayısıyla sağlık ucu çalışıyor; hedef scrape işlemlerinin neden tamamlanamadığı bu yanıtlardan kesinleştirilemez. Yeni fiyat aktarılmadı. JSON sonuçları `artifacts/municipality-retry-2026-09-14/*-scraper-browser.json`.
