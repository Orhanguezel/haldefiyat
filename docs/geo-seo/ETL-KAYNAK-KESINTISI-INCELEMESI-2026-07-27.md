# Kocaeli, Mersin ve Çanakkale ETL Kesinti İncelemesi — 2026-07-27

Bu çalışma GEO/SEO checklist'inden ayrı operasyonel veri akışı incelemesidir.

## Durum özeti

| Kaynak | Son başarılı veri | Yerel ağ | Canlı VPS | Merkezi scraper | Karar |
|---|---:|---|---|---|---|
| Kocaeli | 2026-05-08 | 25 sn timeout | 25 sn timeout | Eski kontrollerde sonuç yok | Yayıncı servis dönmeden kapalı |
| Mersin | 2026-05-19 | HTTP 403 | HTTP 403 | Önceki fast deneme 403 | Alternatif izinli çıkış/kaynak gerekli |
| Çanakkale | 2026-05-26 | HTTP 200, 0,54 sn | 25 sn timeout | fast + stealthy timeout | Farklı çıkış IP/proxy gerekli |

## Çanakkale ayrıntısı

Bağımsız bağlantıda belediyenin resmî sayfası erişilebilir ve tablo başlığı
`07.07.2026` tarihini gösteriyor. Mevcut parser statik URL nedeniyle bu tarihi
satırlara taşımıyordu; kaynak yeniden açılsaydı eski tablo istek gününün fiyatı
olarak yazılabilirdi.

`parseCanakkaleHtml` sayfa başlığındaki tarihi okuyup tüm fiyat satırlarının
`recordedDate` alanına ekleyecek biçimde düzeltildi. Gerçek sayfada:

- HTTP 200
- 88 geçerli fiyat satırı
- tüm satırlarda `recordedDate=2026-07-07`
- ilk örnek: Barbunya (Taze), min 140, max 170, ortalama 155 TL/kg

İki birim testi hem tarihli hem tarihsiz fallback davranışını kapsıyor.
Backend typecheck ve production build başarılıdır. Canlı commit: `756b1cdd`.

Kaynak hâlâ `defaultEnabled: false` kalmalıdır. Canlı VPS veya tanımlı scraper
sayfayı süre sınırı içinde alamadığı müddetçe etkinleştirme veri üretmez.

## Mersin ayrıntısı

Hem `/hal-fiyatlari` hem `/hal-fiyatlari-day` yerel ve canlı ağdan HTTP 403
veriyor. Aynı davranış farklı istemci yollarında görüldüğü için mevcut durum
yalnız user-agent veya TLS fingerprint problemi olarak değerlendirilemez.

27 Temmuz tekrar kontrolünde `www`, çıplak alan adı ve HTTP→HTTPS varyantları
aynı 403 sonucuna ulaştı. Arama motoru dizininde sayfanın genel açıklamasının
bulunması uygulama sunucusuna izinli otomasyon erişimi sağlamıyor. Canlıdaki
scraper container'larında residential/genel proxy env'i tanımlı değil; tüm
istemciler datacenter çıkışında kalıyor.

Güvenli çözüm seçenekleri:

1. Belediyeden API/otomasyon erişimi veya IP allowlist talep etmek.
2. Kullanım ve veri lisansı doğrulanmış residential/izinli proxy çıkışı
   tanımlamak.
3. Aynı Mersin hal verisini sağlayan resmî, makine-okunur alternatif kaynak
   bulmak ve veri eşitliği testi yapmak.

403'ü aşmak için saldırgan bypass, CAPTCHA çözümü veya sahte trafik yöntemi
kullanılmamalıdır.

## Kocaeli ayrıntısı

Kocaeli endpoint'i yerel ve canlı ağda DNS sonrasında HTTP yanıtı vermeden
zaman aşımına uğruyor. Bu, yalnız canlı sunucu IP engeli görünümünde değildir.
Mevcut POST parser ve form sözleşmesini değiştirmek sunucu yanıt vermediği için
sorunu çözmez.

Yeniden kontrol sırası:

1. Ana belediye hostu ve `/hal-fiyatlari/` için TCP/TLS/HTTP kontrolü.
2. Sayfa dönerse form alanları `date` ve `hal` sözleşmesinin yeniden keşfi.
3. Parser dry-run ve geçmiş tarih testi.
4. Tek kaynaklı kontrollü canlı ETL.

## Yeniden açma kabul kapıları

Her kaynak için:

- canlı çalışma ortamından üç ardışık HTTP başarı;
- parser'da en az bir geçerli satır ve gerçek kaynak tarihi;
- tarih güncelliği açıkça ölçülmüş;
- fiyat sıhhat filtresi ve birim eşlemesi temiz;
- kontrollü tek-kaynak ETL sonucu `status=ok`;
- aynı kaynak/tarih tekrarında idempotent upsert;
- sonraki planlı cron ve freshness alarmı temiz.

Bu kapılar geçmeden env/config üzerinden kaynak etkinleştirilmemelidir.
