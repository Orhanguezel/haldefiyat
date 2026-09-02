# Kapalı zarf ihale pazaryeri — fizibilite ve boşluk analizi

**Tarih:** 2026-09-02 · **Durum:** değerlendirme
**Tetikleyen:** Furkan Gonca görüşmesi; asıl hedef deneme API'si değil, **ihale pazaryeri**.

## Hedeflenen akış

1. Son tüketici (ör. X Catering) **ihale açar**: 15 Eylül teslim, X kalite, 8.000 kg domates
2. Üye toptancı / komisyoncu / bireysel satıcı **fiyat teklifi verir**
3. **Teklif verenler birbirinin teklifini GÖREMEZ** (kapalı zarf)
4. Alıcı, kendi ödeme/teslim koşullarına göre **ihaleyi kabul eder**
5. **İki taraf da puanlanır**; puan listedeki sırayı belirler

Bu, ilan tahtasından farklı bir üründür: ilan "ilan et, arayan arasın", ihale
"süreli yarışma + kazanan seçimi + itibar". Aşağıda mevcut altyapının ne kadarını
karşıladığı ölçüldü.

---

## Mevcut altyapıdan doğrudan kullanılabilenler

Beklediğimden fazlası hazır:

| İhtiyaç | Mevcut karşılığı |
|---|---|
| İhale = alım talebi | `hf_listings.listing_type = 'alim'` ✅ |
| Ürün, miktar, birim | `product_slug`, `quantity`, `quantity_unit` ✅ |
| Kalite şartı | `quality` ✅ |
| Ambalaj | `packaging` ✅ |
| Teklif son tarihi | `valid_until` ✅ |
| Taraf rolü | `party_role`: uretici / komisyoncu / alici / diger ✅ |
| Fiyat tipi | `price_type`: sabit / pazarlik / **hal_endeksli** ✅ (hal endeksine bağlı teklif — bizim farkımız) |
| Şehir/ilçe | `city_slug`, `district_slug` ✅ |
| Teklif kaydı | `hf_listing_inquiries.offer_price` ✅ (çekirdek var) |
| Moderasyon, telefon doğrulama, OTP, süre bitimi | ✅ |
| Aday teklif havuzu | `hf_firms` — **1.336 firma** ✅ |
| Komisyoncu rolü | `user_roles` içinde var ✅ |

**Kapalı zarf bugün fiilen sağlanıyor** — teklifleri hiçbir açık uç yayınlamıyor.
Ama bu *tasarımla* değil, *tesadüfen* böyle (aşağıya bak).

---

## Boşluklar — gerçek iş burada

### 1. İhaleyi açan kendi tekliflerini GÖREMİYOR ⛔

En kritik eksik. `hf_listing_inquiries`'i okuyan tek uç `GET /admin/listings/inquiries`
— **yalnız admin**. İlan sahibi için bir uç yok.

Yani bugün X Catering ihale açsa, gelen teklifleri göremez; biz elle iletiriz.
İhale ürününün *çekirdeği* budur.

### 2. Kabul / kazanan seçimi yok ⛔

Teklif durumu `new / contacted / closed`. "Kabul edildi", "reddedildi", "kazandı"
kavramı yok; kazananın kaydedildiği bir anlaşma nesnesi de yok. Puanlama buna
dayanacağı için önce bu gerekir.

### 3. Teslim tarihi ile teklif son tarihi ayrışmıyor ⛔

`valid_until` tek alan. İhalede **iki** tarih var: teklif verme son günü ve
**teslim tarihi** (15 Eylül). Şu an teslim tarihi için yer yok — açıklamaya
yazılırsa makine okuyamaz, eşleştirme ve hatırlatma yapılamaz.

### 4. Ödeme/teslim koşulları yapılandırılmamış ⛔

"Kendisine uygun ödeme koşulu / teslim koşuluna göre kabul eder" diyorsunuz. Bunun
için koşulların **alan** olması gerekir (vade gün, peşin/vadeli, teslim yeri,
nakliye kime ait). Bugün yok; serbest metin karşılaştırılamaz.

### 5. Puanlama hiç yok ⛔

Ne tabloda ne kolonda puan var (`hf_firms`'te de yok). Sıfırdan tasarım gerekir.

**Ve burada bir tasarım tuzağı var:** puan ancak **tamamlanmış işlem** üzerine
kurulursa anlamlıdır. Biz teslimatın gerçekleştiğini ya da ödemenin yapıldığını
göremiyoruz. Karşı taraf onayına dayanmayan puan, iki tarafın anlaşıp birbirini
puanlamasıyla kolayca şişirilir. Puanı açmadan önce "işlem tamamlandı" sinyalinin
nereden geleceğine karar vermek şart — aksi halde liste sırasını manipüle
edilebilir bir sayı belirler.

### 6. Kapalı zarf garantisi yazılı değil ⚠️

Bugün teklifler gizli çünkü onları açan uç yok. İhale ürününde gizlilik bir
**vaat** olur: para kararı ona dayanır. Açıkça kurallanmalı (teklif yalnız ihale
sahibine ve yalnız son tarihten sonra görünür gibi), ve denetim kaydı tutulmalı.
Yanlışlıkla eklenecek bir `include=inquiries` parametresi bugün sessizce bu
vaadi bozar.

### 7. API'den ihale açma — anahtar kimlik taşımıyor ⚠️

Önceki raporda yazdığım boşluk aynen duruyor: `X-API-Key` yalnız kota sayıyor,
`req.user` set etmiyor. `POST /listings` JWT istiyor. Anahtara **kapsam (scope)**
alanı eklenmeden yazma yetkisi vermek doğru değil — sızan anahtar bugün veri
okur, yarın müşteri adına ihale açar.

### 8. "Üye toptancı" kavramı yok ⚠️

1.336 firmanın yalnız **2'si** sahiplenilmiş. Teklif verecek üye havuzu pratikte
boş. İhale açılır ama teklif gelmezse ürün ölü doğar. Bu bir yazılım sorunu
değil, **operasyon sorunu**: ihaleden önce komisyoncu tarafını doldurmak gerekir.

---

## İstanbul kapsamı — istediğiniz zaten var

"Avrupa da olsun, hepsine açık olsun" dediniz. Kontrol ettim:

İBB'nin Anadolu ve Avrupa sayfalarının **inline parametreleri birebir aynı**
(`tUsr`/`tPas`/`tVal`/`HalTurId=2`). Yani İBB **tek bir İstanbul veri seti**
yayınlıyor; ayrı Avrupa verisi yok. `HalTurId` 1/3/4 boş dönüyor.

→ Ayrı kaynak yazmaya gerek yok, mevcut `istanbul_ibb` zaten İstanbul genelini
kapsıyor. Kodda ve CLAUDE.md'de "Anadolu Yakası" diyen **yanlış notlar
düzeltildi** (bu yanlış not, gereksiz bir iş kalemi üretecekti).

Ürün kapsamı: 94–105 ürün, hepsi API'den erişilebilir, ürün filtresi çalışıyor.

---

## Değerlendirme

Mevcut ilan altyapısı ihalenin **veri modelinin ~%60'ını** zaten karşılıyor;
eksikler ürünün *karar* katmanında: teklifleri görme, kazananı seçme, koşulları
karşılaştırma, puanlama.

**Kaba iş tahmini** (tasarım + uygulama + test):

| Parça | Tahmin | Not |
|---|---|---|
| İhale alanları (teslim tarihi, koşullar) + teklif modeli | 1 gün | şema + doğrulama |
| İhale sahibi teklif görünümü (panel + API) | 1 gün | kapalı zarf kuralı burada uygulanır |
| Kabul/kazanan + anlaşma kaydı | 1 gün | puanlamanın dayanağı |
| API anahtarına scope + ihale açma | 1 gün | güvenlik eşiği |
| Puanlama (tasarım dahil) | 1,5–2 gün | "işlem tamamlandı" sinyali çözülmeden başlanmamalı |
| **Toplam** | **~5–6 gün** | tek geliştirici, kesintisiz |

## Önerim — sırayı değiştirelim

Furkan'a 10 günlük **okuma** denemesi vermeye devam edelim (yarım gün iş, tek
eksik deneme bitiş cron'u). Ama ihaleyi deneme kapsamına sokmayalım.

Gerekçe: ihalenin değeri **teklif gelmesine** bağlı. Bugün teklif verecek üye
havuzu 2 firma. Önce şunu ölçelim:

1. Furkan gerçekten veri çekiyor mu (10 gün, gerçek kullanım)
2. **Elle bir ihale deneyelim**: X Catering'in ilk talebini biz açalım, birkaç
   komisyoncuya telefonla soralım, teklifleri elle toplayıp iletelim. Yazılım
   yazmadan akışın gerçekten yürüyüp yürümediğini görürüz.

Bu "elle prova" bir günlük iş değil, birkaç telefon. Karşılığında öğrendiğimiz
şey 5–6 günlük yazılımın doğru şeyi inşa edip etmediği. Komisyoncular teklif
vermezse — ki 1.336 firmadan 2'si sahiplenmiş durumda — sorun yazılımda olmaz.

## Karar bekleyen sorular

1. **Puan neye dayanacak?** Teslimat/ödeme gerçekleştiğini nasıl bileceğiz?
   (Çözülmeden puanlama yazılmamalı)
2. **Biz taraf mıyız?** Anlaşmazlıkta sorumluluk kimde, komisyon alacak mıyız?
   Bu, kullanım şartlarını ve KVKK metnini değiştirir.
3. **Teklifler ne zaman görünür?** Son tarihten sonra mı, anında mı? (Kapalı zarf
   tanımı bu)
4. **Üye havuzu nasıl dolacak?** İhaleden önce çözülmesi gereken asıl darboğaz.
