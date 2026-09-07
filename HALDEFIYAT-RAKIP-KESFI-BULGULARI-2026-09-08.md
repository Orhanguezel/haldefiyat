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
| 0 | İzlenen kod, git'te **izlenmeyen** dosyalara bağlı; ayrıca prod'a git dışından (rsync/scp) kopyalanmış — prod ile git ayrışmış | **EN ACİL** | Açık |
| 1 | Seed 099 `ALTER TABLE` kullanıyor — ikinci seed koşusunu kırar, arkasındaki `100_adana_hal_source.sql` hiç çalışmaz | **Yüksek** | Açık |
| 2 | Yandex yedeği kaldırıldı + delta kapısı `status='ok'` istiyor → delta pratikte hiç çalışmayabilir | **Yüksek** | Açık |
| 3 | `fallbacks` ölü değişken — kaldırılmış davranışı reklam eden metin | Orta | Açık |
| 4 | Delta kapısı `error_msg` metnine ve `engine` (seçilen) alanına bağlı | Orta | Açık |
| 5 | `tracked` eşleşmesi `LIKE '%domain%'` — özensiz alt dize | Orta | Açık |
| 6 | `SKIP_DOMAINS` sosyal sonuçları atıyor; ölçüm bunun en yoğun sinyal olduğunu gösterdi | Fırsat | Açık |
| 7 | `parser.ts` sezgiselleri ölçülebilir değer üretmiyor | Düşük | Açık |
| 8 | `getLastSnapshot`, `google-performance.ts`, `measurementNote` | — | **Doğru yapılmış** |

---

## 0. EN ACİL — izlenen kod, izlenmeyen dosyalara bağlı

**Bu, madde 1'den önce gelir:** madde 1 ancak yeniden seed edilince ısırır, bu
ise **bir sonraki commit'te** ısırır.

Modülün yeni işi git'te iki gruba bölünmüş durumda:

| Dosya | Git durumu |
|---|---|
| `modules/competitor-monitor/router.ts` | izleniyor (değişmiş) |
| `modules/competitor-monitor/discovery.ts` | izleniyor (değişmiş) |
| `modules/competitor-monitor/discovery-read.ts` | izleniyor (değişmiş) |
| `db/schema.ts` | izleniyor (değişmiş) |
| `modules/competitor-monitor/google-performance.ts` | **izlenmiyor** |
| `db/seed/sql/099_competitor_measurement.sql` | **izlenmiyor** |
| `db/seed/sql/098_cotton_monthly_series.sql` | **izlenmiyor** |
| `db/seed/sql/100_adana_hal_source.sql` | **izlenmiyor** |

Bağımlılık tek yönlü ve kırılgan:

- `router.ts:1` → `import { googlePerformance } from "./google-performance";`
  İçe aktardığı dosya **git'te yok.**
- `discovery.ts` `actualEngine`, `depth`, `gscStartDate`, `gscEndDate` alanlarına
  yazıyor (6 gönderme). Bu kolonları yaratan tek yer 099 — **git'te yok.**
  `097` (izleniyor) bu kolonları tanımlamıyor.
- `schema.ts` (izleniyor) kolonları Drizzle tarafında ilan ediyor (`:672`,
  `:673`, `:694`) — yani izlenen şema, izlenmeyen bir DDL'e dayanıyor.

**Yalnız izlenen dosyalar commit'lenirse ne olur:**

1. **Derleme anında kırılır** — `router.ts` var olmayan bir modülü içe aktarır.
2. Derleme geçse bile, temiz bir kurulumda keşif çalıştığı anda
   **`ER_BAD_FIELD_ERROR (1054) Unknown column 'actual_engine'`** alınır: 097
   kolonsuz tablo kurar, 099 repoda olmadığı için hiç çalışmaz.

Aynı sebeple, bu dosyalar bugün **yalnız bu makinede** var: temiz bir klon ya da
VPS'e git ile giden bir dağıtım 098/099/100 ve `google-performance.ts`'i hiç
görmez. `git clean -fd` de onları sessizce siler.

**Yapılması gereken:** bu yedi dosya tek bir atomik birim; **birlikte**
commit'lenmeli. Workspace kuralı gereği `git add -A` kullanılmamalı (başka
aracın işini süpürür) ama hedefli ekleme yaparken bu listenin tamamı verilmeli:

```
git add backend/src/modules/competitor-monitor/{router,discovery,discovery-read,google-performance}.ts \
        backend/src/db/schema.ts \
        backend/src/db/seed/sql/{098_cotton_monthly_series,099_competitor_measurement,100_adana_hal_source}.sql
```

(099'un içeriği commit'lenmeden önce madde 1'e göre düzeltilmeli — kolonlar
097'ye taşınıp 099 silinmeli. O zaman bu listeden 099 düşer.)

### 0b. Prod ile git birbirinden ayrılmış

Yukarıdaki bölünmenin prod'da bir karşılığı **yok** — çünkü prod'a her şey git
dışından gitmiş.

> **Kaynak:** aşağıdaki prod ölçümü bu belgeyi yazan oturuma ait değildir;
> hal-fiyatlari tarafında çalışan başka bir oturum tarafından **salt-okuma**
> olarak yapıldı (vps-vistainsaat / srv1493379, DB `hal_fiyatlari`). Bu belgeyi
> yazan taraf prod'a erişmedi. Lokal zaman damgaları burada bağımsız olarak
> doğrulandı ve bildirilen değerle birebir tutuyor.

Ölçülen:

- `099_competitor_measurement.sql` ve `google-performance.ts` **prod'da var.**
- Prod git HEAD'i `7ce015e`; bu dosyalar orada **hiçbir commit'te yok.**
- Prod'da `git status` **50 değişiklik** gösteriyor; competitor-monitor işinin
  tamamı orada izlenmeden duruyor.
- Zaman damgaları saniyesi saniyesine aynı:
  `099` → lokal ve prod, ikisi de `2026-09-07 22:34:51` (UTC).

Son madde belirleyici: `git checkout` dosyanın mtime'ını **korumaz**, checkout
anını yazar. Zaman damgasının saniyesine kadar korunması, dosyaların
**kopyalandığını** gösterir (rsync/scp).

Bu, bu reponun kendi `CLAUDE.md`'sinin **en tepesindeki** kuralın ihlali
(`CLAUDE.md:5`):

> 🚫 KESIN KURAL — DEPLOY SADECE GIT İLE (rsync/scp YASAK)

Kuralın gerekçesi de aynı dosyada yazıyor (`CLAUDE.md:35`): *"rsync ile deploy
edince local ve server git'ten ayrisip 'anlamsiz' hale gelir."* Tam olarak
gerçekleşen bu.

**Madde 0'daki çözüm bu yüzden eksik.** Atomik commit doğru ama tek başına
yetmiyor; ardından prod'un git'e geri hizalanması gerekiyor ve **sıra önemli:**

1. Önce prod'daki 50 değişikliğin git'e alınması (neyin kaldığı, neyin
   atılacağı kararı verilerek).
2. Sonra normal `deploy.sh` akışı.

Tersi sıra veri kaybettirir. Özellikle `git reset --hard` refleksi prod'daki 50
değişikliğin hepsini siler; `CLAUDE.md:21` bunu ayrıca uyarıyor ve bu repoda
2026-08-10'da yaşanmış 8 dakikalık bir kesinti kayıtlı. **Prod'da körlemesine
`git pull` / `reset --hard` yapılmamalı.**

Bu bulgu seed sırasından (madde 1) önceliklidir: madde 1 bir geliştirme
rahatsızlığı, bu ise prod'un git'ten yeniden üretilememesi demek.

**Ek uyarı — dosya oynak:** 099 git'te izlenmediği için karşılaştırılacak bir
sürüm yok ve tek bir çalışma oturumu içinde iki farklı içerikte gözlendi (bir
okumada `ADD COLUMN IF NOT EXISTS ...`, sonraki okumada düz `ADD COLUMN`;
mtime 00:34:51). Hangisinin önce geldiği kanıtlanamıyor. Bu dosya hakkında
karar verecek olan, **karardan hemen önce yeniden okumalı.**

## 1. Seed 099 `ALTER TABLE` kullanıyor — ikinci seed koşusunu kırar

**Yüksek.** `backend/src/db/seed/sql/099_competitor_measurement.sql` dört kolonu
`ALTER TABLE ... ADD COLUMN` ile ekliyor (dosyada `IF NOT EXISTS` **yok**, düz
`ADD COLUMN`). Workspace `CLAUDE.md` bunu açıkça yasaklıyor: *"`ALTER TABLE`
lokal ortamda KESİNLİKLE KULLANILAMAZ."*

**Ölçüldü** (MySQL 8.0.46, boş bir sonda tablosunda, 2026-09-08):

| İfade | Kolon yokken | Kolon varken |
|---|---|---|
| `ADD COLUMN depth INT NULL` — 099'daki gerçek ifade | başarılı | **hata 1060 `ER_DUP_FIELDNAME`** |
| `ADD COLUMN IF NOT EXISTS ...` — "idempotent" varyant | **hata 1064 `ER_PARSE_ERROR`** | — |

İkinci satır, bu dosyanın idempotent hale **getirilemeyeceğini** gösteriyor:
MySQL 8 `ADD COLUMN` için `IF NOT EXISTS` sözdizimini parse etmiyor (MariaDB
eder, MySQL etmez), dolayısıyla sözdizimi hatası kolonun varlığına bakmadan her
koşuda düşer. Yani "başına `IF NOT EXISTS` ekleyelim" bir çözüm değil, daha
kötüsü — 099'u **sıfırdan seed dahil her koşuda** patlatır.

Zincirin tamamı:

- `097_competitor_discovery_schema.sql` içindeki `CREATE TABLE` tanımlarında bu
  dört kolon **yok** (kontrol edildi: 0 eşleşme).
- Seed dosyaları elle kaydedilmiyor, **dizin otomatik taranıyor**
  (`backend/src/db/seed/index.ts:174-178`, `readdirSync(...).filter(f => f.endsWith(".sql"))`,
  sayısal sıralama). Yani 099 dizine konduğu anda sıraya giriyor.
- Çalıştırıcıda **hata toleransı yok** (`index.ts:145-147`,
  `for (const stmt of statements) await conn.query(stmt)`); ilk hata
  `main().catch` ile sürecin tamamını düşürüyor.

Sonuç:

- **Sıfırdan seed (varsayılan, DROP+CREATE):** 097 kolonsuz tablo kurar, 099
  ALTER'ları ekler → çalışır.
- **`--no-drop` ile yeniden seed** (VPS'te veri kaybetmeden seed etmenin yolu):
  097 `CREATE TABLE IF NOT EXISTS` no-op olur, 099 **1060** verir ve **seed
  099'da durur**.

Durmanın bedeli soyut değil: 099'dan sonra **`100_adana_hal_source.sql`** var ve
o koşuda hiç çalışmaz (her iki dosya da şu an git'te izlenmiyor — bkz. madde 0 —
yani bu senaryo bugün yalnız bu makinede geçerli). Yani şu an aktif yazılmakta olan Adana kaynağı, kendi
önündeki bir bariyer yüzünden yeniden seed'de kurulmuyor.

**Önerilen düzeltme:** dört kolonu 097'deki `CREATE TABLE` gövdelerine taşıyıp
099'u silmek. Kural zaten bunu söylüyor, fresh seed varsayılan yol olduğu için
maliyeti yok.

**Canlı ortam için not:** kolonlar canlıda hâlihazırda varsa (fresh seed ya da
elle ALTER ile) bu değişiklik canlıda ek bir işlem gerektirmez; yalnız seed ile
canlı şema hizalanmış olur. Kolonların canlıya **nasıl** girdiği bu belgeden
tespit edilemez — 099 sıfırdan seed'de başarıyla çalıştığı için "seed yaratamaz,
demek ki elle ALTER edilmiş" çıkarımı **kurmaz**; drift iddiası için ayrı kanıt
gerekir.

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
