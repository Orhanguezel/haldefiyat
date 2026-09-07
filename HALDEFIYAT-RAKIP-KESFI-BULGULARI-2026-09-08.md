# Rakip İzleme Modülü — Dış Gözden Geçirme Bulguları (2026-09-08)

Bu belge `backend/src/modules/competitor-monitor/` modülünün **Tanitio'ya
(ekosistem-sosyal-medya) port edilmesi sırasında** çıkan bulguları toplar.
Amaç eleştiri değil: modülü satır satır okumak, normal geliştirmede
görülmeyen şeyleri görünür kıldı. Bulguların bir kısmı bu repoda düzeltilmeyi
bekliyor, bir kısmı zaten doğru yapılmış ve kayda geçirmek için burada.

**Yazan:** Claude oturumu (ekosistem-sosyal-medya tarafı).
**Bu repoda hiçbir kod dosyası değiştirilmedi** — yalnız okundu; bu belge tek eklemedir.
**Not:** `competitor-monitor` dosyalarının bir kısmı şu an başka bir aracın
(muhtemelen Codex) açık işi ve commit'lenmemiş durumda. Aşağıdaki tespitler
**8 Eylül 2026 tarihli çalışma ağacı** hâline göredir; o iş ilerledikçe bir
kısmı geçersizleşebilir.

---

## Özet

| # | Bulgu | Önem | Durum |
|---|---|---|---|
| 1 | Seed 099 `ALTER TABLE` kullanıyor — workspace kuralı ihlali, `--no-drop` seed'ini kırar | **Yüksek** | Açık |
| 2 | Yandex yedeği kaldırıldı + delta kapısı `status='ok'` istiyor → delta pratikte hiç çalışmayabilir | **Yüksek** | Açık |
| 3 | `fallbacks` ölü değişken — kaldırılmış davranışı reklam eden metin | Orta | Açık |
| 4 | Delta kapısı `error_msg` metnine ve `engine` (seçilen) alanına bağlı | Orta | Açık |
| 5 | `tracked` eşleşmesi `LIKE '%domain%'` — özensiz alt dize | Orta | Açık |
| 6 | `SKIP_DOMAINS` sosyal sonuçları atıyor; ölçüm bunun en yoğun sinyal olduğunu gösterdi | Fırsat | Açık |
| 7 | `parser.ts` sezgiselleri ölçülebilir değer üretmiyor | Düşük | Açık |
| 8 | `getLastSnapshot`, `google-performance.ts`, `measurementNote` | — | **Doğru yapılmış** |

---

## 1. Seed 099 `ALTER TABLE` kullanıyor — `--no-drop` seed'ini kırar

**Yüksek.** `backend/src/db/seed/sql/099_competitor_measurement.sql` dört kolonu
`ALTER TABLE ... ADD COLUMN` ile ekliyor. Workspace `CLAUDE.md` bunu açıkça
yasaklıyor: *"`ALTER TABLE` lokal ortamda KESİNLİKLE KULLANILAMAZ."*

Somut sonuç, kuralın gerekçesinden biraz farklı ama daha yakıcı:

- `backend/src/db/seed/sql/097_competitor_discovery_schema.sql` içindeki
  `CREATE TABLE` tanımlarında bu dört kolon **yok** (kontrol edildi: 0 eşleşme).
- Seed çalıştırıcısı (`backend/src/db/seed/index.ts:145-147`) her ifadeyi
  `await conn.query(stmt)` ile çalıştırıyor, **hata toleransı yok**; hata
  `main().catch` ile sürecin tamamını düşürüyor.
- Varsayılan yol DROP+CREATE olduğu için sıfırdan seed **çalışır** (097 kolonsuz
  tablo kurar, 099 ALTER'lar ekler).
- Ama `--no-drop` ile (yani VPS'te veri kaybetmeden yeniden seed) 097
  `CREATE TABLE IF NOT EXISTS` no-op olur, 099 ALTER'ı **ER_DUP_FIELDNAME (1060)**
  verir ve **seed 099'da durur** — 100 ve sonrasındaki hiçbir dosya çalışmaz.

MySQL 8 `ADD COLUMN IF NOT EXISTS` desteklemiyor, dolayısıyla bunu "idempotent
ALTER" ile kurtarmak mümkün değil.

**Önerilen düzeltme:** dört kolonu 097'deki `CREATE TABLE` gövdelerine taşıyıp
099'u silmek. Kural zaten bunu söylüyor ve fresh seed varsayılan yol olduğu için
maliyeti yok.

## 2. Yedek kaldırıldı + delta kapısı katı → fark pratikte hiç üretilmeyebilir

**Yüksek.** İki değişiklik tek tek doğru, birlikte birbirini kilitliyor.

- `discovery.ts:95` — Yandex yedeği kaldırıldı: *"Keep one engine per run.
  Missing pages are partial coverage, not another engine."* Koşu saflığı için
  savunulabilir bir tercih.
- `discovery.ts:108` — `status = failures === 0 ? "ok" : ... "partial"`.
- `discovery-read.ts` `discoveryDelta` — karşılaştırma için **her iki koşunun da**
  `status='ok'` ve `error_msg IS NULL` olmasını şart koşuyor.

Yani **tek bir sayfa alınamazsa o koşu bir daha asla karşılaştırmaya girmez.**
Bu reponun kendi ölçümüne göre yedeksiz hata oranı düşük değil: aynı sorgu
kümesi yedeksiz yeniden tarandığında **30 sorgunun 8'i boş döndü**. Yedekliyken
düşen sayfa 1-2 idi. Bu oranla "sıfır hatalı" bir koşu nadir olur; art arda iki
tanesinin denk gelmesi daha da nadir.

Tarihsel kayıt da bunu destekliyor: dört koşudan yalnız 3 ve 4 `ok` bitmişti ve
**ikisi de Yandex yedeğine düşerek** öyle bitmişti. Yedek kaldırıldığına göre
aynı koşular bugün `partial` biterdi — yani hiçbiri delta üretmezdi.

**Öneri — üçünden biri:**
- (a) Kapıyı "eksiksiz" yerine "**aynı sorgu kümesinde eksiksiz**" yapmak:
  iki koşuda da başarılı olan sorguların kesişimi üzerinden fark almak. Fark
  zaten sorgu kümesi eşitliği arıyor; kesişim kullanmak hem daha çok koşuyu
  karşılaştırılabilir kılar hem sahte sinyal üretmez.
- (b) Yedeği geri getirip `actual_engine`'i **gerçekten servis eden** motorla
  doldurmak (bkz. madde 4) ve karışık koşuyu reddetmek.
- (c) Mevcut hâli bırakıp arayüzde "bu koşu karşılaştırılmadı, sebebi şu"
  demek — en azından kullanıcı boş fark şeridini "değişiklik yok" sanmaz.

## 3. `fallbacks` ölü değişken

**Orta.** `discovery.ts:87`'de `let fallbacks = 0` tanımlı, hiçbir yerde
artırılmıyor (yedek kaldırıldığı için), ama `discovery.ts:109`'da hâlâ
`errorMsg` metnine giriyor: `` fallbacks ? `${fallbacks} sayfa Yandex yedeginden` : "" ``.
Koşul daima yanlış, dolayısıyla o metin hiç yazılmıyor.

Zararsız görünüyor ama kodu okuyan birine **var olmayan bir davranışı** vaat
ediyor: "demek ki yedek var" dedirtiyor. Madde 2'deki kararı verirken bu satır
yanıltıcı. Değişkeni ve metni birlikte silmek gerekir.

## 4. Delta kapısı metne ve *seçilen* motora bağlı

**Orta.** İki ayrı kırılganlık:

**(a) `error_msg IS NULL` bir doğruluk kapısı olarak kullanılıyor.** Bu alan
kullanıcıya gösterilen serbest metin. Bir gün oraya bilgilendirme amaçlı bir
not ekleyen ya da mevcut ifadeyi değiştiren biri, farkında olmadan delta'yı
sessizce kapatır. Ölçülebilir alanlar varken metne bağlanmamalı:
`queries_done = queries_total` "eksiksiz" için doğrudan ölçüdür.

**(b) Önceki koşu seçilirken `engine = ?` karşılaştırılıyor** — yani koşunun
**seçilen** motoru. Bugün yedek olmadığı için seçilen motor = servis eden motor,
dolayısıyla doğru çalışıyor. Ama bu doğruluk, madde 2'deki "yedek yok"
varsayımına bağlı: yedek geri gelirse, tamamı Yandex'e düşmüş bir "brave"
koşusu brave sanılıp gerçek bir brave koşusuyla eşleştirilir ve iki farklı
motorun sıralaması karşılaştırılmış olur. Sessiz bozulma.

`actual_engine` kolonu zaten eklendi; kesin kontrol elde:
`COUNT(DISTINCT actual_engine) = 1` tek motoru, `MIN(actual_engine)` hangi
motoru olduğunu verir. Şu an `discovery.ts:100` bu kolona `engine` (seçilen)
yazıyor — yedek yokken doğru, yedek dönerse yanlış olur.

> Tanitio tarafında bu kapı ölçüme bağlandı: `COUNT(DISTINCT actual_engine)=1`
> + `queries_done=queries_total` + iki koşunun **servis eden** motoru eşit +
> aynı derinlik + birebir aynı sorgu kümesi. Beş senaryo ile sınandı; kritik
> olanı, karışık motorlu koşunun `error_msg` boş olsa bile reddedilmesi.

## 5. `tracked` eşleşmesi özensiz alt dize

**Orta.** `discovery-read.ts:41`:

```sql
EXISTS(SELECT 1 FROM hf_competitor_sites s WHERE s.url LIKE CONCAT('%', b.domain, '%'))
```

Altı izlenen sitede sorun çıkarmaz, ama alt dize eşleşmesi yanlış pozitif
üretmeye açıktır: `hal.gov.tr` araması `eskihal.gov.tr.example.com` gibi bir
kayıtla eşleşir; ayrıca `url` içinde yol/sorgu dizesi geçen bir alan adı da
tutar. Doğrusu host'u normalize edip **eşitlikle** karşılaştırmak:

```sql
SUBSTRING_INDEX(REGEXP_REPLACE(LOWER(s.url), '^https?://(www\\.)?', ''), '/', 1) = b.domain
```

## 6. `SKIP_DOMAINS` en yoğun sinyali atıyor

**Fırsat, hata değil.** `discovery.ts:14` sosyal platformları "her aramada
çıkan gürültü" sayıp eliyor. Bu repoda ölçüldü: aynı sorgular filtresiz
tarandığında **22 sorgunun 14'ünde (%64) ilk 20'de bir `facebook.com` sonucu**
var, en iyisi 2. sırada; %27'sinde `instagram.com`.

Daha ilginci, çıkanların baskın türü **rakip hesap değil, Facebook grubu**:
`facebook.com/groups/limonpiyasasi/` gibi. Bir hal fiyatları sitesi için bu
"kimle yarışıyorum"dan daha kıymetli olabilir — okuyucunun fiyatı sorduğu yer
orası. Şu an bu satırlar hiç kaydedilmiyor, dolayısıyla sonradan analiz de
edilemiyor.

**Uyarı:** elemeyi kaldırmak tek başına yetmez, çünkü sosyal adresler tek tür
değil. Tanitio tarafında dört tür ayrıldı ve bu ayrım olmadan liste
kirleniyordu:

| Tür | Örnek | Ne yapılmalı |
|---|---|---|
| `account` | `instagram.com/limon.33.fiyatlari/` | izlemeye alınabilir |
| `group` | `facebook.com/groups/limonpiyasasi/` | ayrı liste — rakip değil, kitle |
| `content` | `instagram.com/medyaankaracom/reel/DC4…` | kanıt, kayıt değil |
| `platform_page` | `instagram.com/popular/bayrampasa-hal-fiyatlari/` | hiç gösterme |

Sonuncusu tuzak: naif `/^\/([^/]+)/` ayrıştırması buna `popular` adlı bir
"rakip" der. Tanitio'da sınıflandırıcı ve 15 testi
`backend/src/modules/competitor-discovery/social-handle.ts` altında; örnekler
bu reponun gerçek arama sonuçlarından alındı, doğrudan kopyalanabilir.

## 7. `parser.ts` sezgiselleri ölçülebilir değer üretmiyor

**Düşük** (bilgi amaçlı; bu modülün diğer yarısı). Bu reponun canlı verisinde
18 Mayıs'tan beri 79 snapshot birikmiş, 5 site:

- `product_count` 5 sitenin 3'ünde **her seferinde NULL** — `<tr>` / `class="product"`
  sayan regex JS ile render edilen sayfada çalışmıyor.
- NULL olmayan değerler de anlamlı değil (bir markette 27, bir sitede 9) — DOM
  artefaktı, ürün sayısı değil.
- 79 snapshot'ın diff'i **biri hariç** "Değişiklik yok."; o bir istisna da
  yanlış pozitifti (sebebi madde 8'de düzeltildi).
- Dolayısıyla `SIGNIFICANT_PRODUCT_DELTA = 10` eşiği pratikte **ölü kod**:
  `product_count` çoğunlukla NULL olduğu için karşılaştırma hiç kurulmuyor.

Aynı dönemde tek bir keşif koşusu, izleme listesinde hiç olmayan bir rakibi
buldu (30 sorgunun 28'inde, 20'sinde 1. sırada). Değer üreten yarı bu.

**Öneri:** snapshot yarısını ya kaldırmak ya da regex sezgiseli yerine yapısal
alanlara (fiyat listesi uzunluğu, sitemap girdi sayısı, JSON-LD ürün sayısı)
bağlamak. Tanitio portuna bu yarı **bilinçli olarak alınmadı.**

## 8. Doğru yapılmış olanlar — kayda geçsin

Bunlar port sırasında incelendi ve **doğru** bulundu; port bunları örnek aldı:

- **`checker.ts` `getLastSnapshot` düzeltmesi.** Başarısız çekim satırını
  "önceki" saymak, sonraki başarılı çekimde tüm özellikleri "yeni" gösterip
  sahte alarm üretiyordu; artık `scrapeOk = 1` şartı var. 79 snapshot'taki tek
  diff'in sebebi tam olarak buydu. **Genel kural olarak not edilmeye değer:
  başarısız/kısmi çekim asla baseline yapılmaz.**
- **`google-performance.ts` sınırı.** GSC metriğini ayrı ve tarihli bir anlık
  görüntü olarak tutup GSC yoksa `status:'unavailable'` dönmek, scrape edilmiş
  sıraya düşmemek doğru karar. Dosyadaki yorum bunu net söylüyor: *"Never
  substitute a scraped rank for GSC."* Tanitio'da aynı sınır iki ayrı sütun
  olarak uygulandı (taranan konum / Google konumu), GSC yoksa "veri yok".
- **`measurementNote` ve "tarama konumu" adlandırması.** "Pozisyon" başlığının
  Google sırası sanılması gerçek bir yanlış okuma kaynağıydı; ayrıca gösterim/
  tıklamanın rakibin değil **bizim** GSC verimiz olduğunu söylemek şart. Tanitio
  sayfasındaki etiketler bu revizyona bakılarak düzeltildi.
- **`GROUP_CONCAT(DISTINCT ...)`** ve **alan adı detayında `ROW_NUMBER()
  PARTITION BY query`**. İkisi de portta aynı hatayı kapattı: ilki "İlk 5
  rakip" sütunundaki tekrarı, ikincisi bir alan adının aynı sorguda birden çok
  URL ile çıkması hâlinde şişen detay listesini.
- **Delta'ya sorgu kümesi eşitliği şartı.** Sorgu kümesi GSC'den geldiği için
  koşudan koşuya kayar; kayan kümede "yeni alan adı" denen şeyin bir kısmı
  aslında yeni **sorgu**dur. Bu şart olmadan fark güvenilmez.
- **`actual_engine`, `depth`, `gsc_start_date/end_date` kolonlarının nullable
  olması.** Geçmiş koşulara uydurma köken atamamak doğru; port da aynı
  gerekçeyle nullable tuttu ve kökeni bilinmeyen koşuyu karşılaştırmıyor.

---

## Ek: iki repo arasındaki bilinçli farklar

Port birebir kopya değil; çok kiracılık ve farklı ürün amacı yüzünden ayrışan
noktalar (Tanitio tarafındaki karşılıkları):

| Konu | hal-fiyatlari | Tanitio |
|---|---|---|
| Koşu kilidi | modül seviyesinde `let running` | tenant başına, DB'de; bayat koşu 45 dk sonra serbest |
| Yedek motor | yok (tek koşu = tek motor) | var; `actual_engine` satır başına yazılır, karışık koşu delta'ya girmez |
| Sosyal sonuçlar | eleniyor | dört türe ayrılıp saklanıyor; `account` izlemeye alınabiliyor |
| Alan adı türü | resmî/perakende/haber sezgiseli | **alınmadı** — içinde sabit marka adları vardı (marka koda gömülmez kuralı) ve tarım dışı müşteride yanlış sınıflandırır |
| Sorgu kaynağı | GSC → ürün listesi yedeği | GSC → elle giriş; **tahmin yok** (uydurma sorgu uydurma rakip listesi üretir) |
| Marka filtresi | `publicOrigin`'den | tenant'ın kendi host/adından |
| Snapshot yarısı | var | alınmadı (madde 7) |

Tanitio tarafındaki karşılık dosyalar:
`ekosistem-sosyal-medya/backend/src/modules/competitor-discovery/` ve
`dashboard/src/app/rakip-kesfi/page.tsx`. Buradaki bir düzeltme oraya da
uygulanabilir; tersi de geçerli.
