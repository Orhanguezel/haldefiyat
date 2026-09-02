# Furkan Gonca — 10 günlük deneme API'si · Fizibilite raporu

**Tarih:** 2026-09-02 · **Durum:** değerlendirme, henüz uygulanmadı
**Müşteri:** furkan GONCA · `furkangonca0@gmail.com` · kayıt 2026-09-02 11:21, rol `customer`

Telefon görüşmesinde iki talep konuşuldu. Aşağıda ikisi de **veriyle** kontrol
edildi; ne verebileceğimiz ve neyi vaat etmememiz gerektiği ayrı ayrı yazıldı.

---

## Talep 1 — İstanbul hal fiyatlarını ürün bazında çekmek

### Bugün hazır olan

| Konu | Durum |
|---|---|
| Kapsam | İstanbul Toptancı Hali (İBB) · **94–105 ürün** |
| Ürün filtresi | ✅ `GET /api/v1/prices?market=istanbul-hal-ibb&product=domates` |
| Tüm gün tek çağrıda | ✅ `?market=istanbul-hal-ibb&limit=100` → 94 ürün, tek istek |
| Kimlik + kota | ✅ `X-API-Key` başlığı, yanıtta `x-ratelimit-*` |
| Kullanım takibi | ✅ `audit_request_logs` (path + tam URL + `api_key_id`) |

Kota açısından rahatız: günde bir çağrı tüm İstanbul fiyatlarını getiriyor.
Saatlik çekseler bile 24 istek/gün — **ücretsiz kademe (100/gün) fazlasıyla yeter.**

### ⚠️ "Anlık" diyemeyiz — ve veri şu an bayattı

Bunu görüşmede net söylemeliyiz:

1. **Veri günlüktür, anlık değildir.** İBB günde bir kez yayınlıyor; bizim de
   tek kaynağımız o. "Anlık hal fiyatı" vaat edilirse ilk günde yanlışlanır.

2. **Bulduğum canlı hata:** ETL her sabah "92 satır" raporluyordu ama
   **28 Ağustos'tan beri yeni tarihli tek satır yazmamıştı** — veri 6 gün bayattı
   ve hiçbir alarm çalmadı. Sebep: sabah 07:52 koşusu T-1 (dün) istiyor, İBB
   günün verisini gün içinde dolduruyor, boş bulunca 7 gün geriye yürüyüp eski
   günü yeniden yazıyor. Sayaç "92" gösteriyor çünkü *ayrıştırılan* satırı sayıyor,
   *yeni tarihli* satırı değil.
   → Elle tetikleyip bugünün 94 satırını çektim (veri artık güncel) ve
   **akşam ikinci çekim cron'u eklendi** (17:00 TRT, açıkça bugünü ister).

3. **Kaynakta gerçek boşluklar var.** 28 Ağustos – 1 Eylül arası İBB hiç yayın
   yapmamış (bayram dönemi). Bu bizim hatamız değil ama müşteri "her gün veri"
   beklerse hayal kırıklığı olur. Sözleşmede "İBB'nin yayınladığı günler" demeli.

4. **Yalnız Anadolu Yakası.** Avrupa Yakası hali için kaynağımız yok
   (`istanbul_ibb_avrupa` hâlâ "eklenecek" listesinde). Müşteri Avrupa Yakası
   bekliyorsa bu ayrı bir iş.

### İzleme — istediğimiz şey zaten mümkün

"Ne kadar yoğunlukta kullanıyorlar" sorusu bugün yanıtlanabilir:
`audit_request_logs` her isteğin yolunu, tam sorgu dizesini ve `api_key_id`'sini
tutuyor. Yani **hangi ürünü, kaç kez, hangi saatte çektiklerini** raporlayabiliriz.
Admin ucu hazır: `GET /api/v1/admin/api-keys/daily-usage?days=14`.

---

## Talep 2 — İlan sayfasında talep açmak ("100 kilo domates")

Bu, ikisi arasında **ticari değeri yüksek olan** — çünkü komisyoncu tarafını
harekete geçiriyor ve bizim pazaryeri tarafımızı besliyor.

### İyi haber: veri modeli zaten hazır

- `hf_listings.listing_type` **`satis` / `alim`** ayrımını zaten destekliyor.
  Yani "alım talebi" yeni bir kavram değil, şemada var.
- Komisyoncu yanıt akışı da var: `POST /listings/:id/inquiry` (herkese açık) +
  arama talebi akışı. Yani talep açılınca komisyoncular yazabilir.
- `/ilanlar` sayfası canlı.

### Boşluk: API anahtarı kimlik taşımıyor

`POST /listings` **JWT** istiyor. `X-API-Key` ise yalnızca kota sayıyor ve denetim
kaydına iz bırakıyor — `req.user` set etmiyor. Yani müşteri kendi sisteminden
makine-makine ilan açamaz.

Üç seçenek var:

| Seçenek | İş | Değerlendirme |
|---|---|---|
| **A. API anahtarına kimlik ver** | Anahtar doğrulandığında `req.user`'ı anahtarın sahibine set et; yalnız beyaz listedeki uçlarda geçerli olsun | **Önerilen.** Temiz, tekrar kullanılabilir, diğer müşterilere de açılır. Dikkat: anahtar artık *yazma* yetkisi taşır — kapsam (scope) alanı şart. |
| B. Servis hesabıyla JWT | Müşteriye uzun ömürlü JWT ver | Hızlı ama JWT süresi/iptali zayıf, sızarsa tüm hesap gider |
| C. Elle | Talebi bize e-posta/WhatsApp ile iletsinler, biz açalım | Sıfır iş, ama "API" vaadi değil; deneme için kabul edilebilir |

Anahtarın yazma yetkisi kazanması **güvenlik açısından yeni bir eşik**: bugün
anahtar sızsa en fazla veri okunur, yarın sızarsa müşteri adına ilan açılabilir.
Bu yüzden A seçeneğinde anahtar başına `scope` (`read` / `listings:write`) alanı
eklemeden ilerlemeyi önermiyorum.

---

## 10 günlük deneme nasıl kurulur

Yeni kurduğumuz abonelik şeması denemeyi **doğal olarak** destekliyor:
`hf_api_subscriptions.status = 'trialing'` + `current_period_end = bugün + 10 gün`
→ kullanıcının tüm anahtarları Pro limitine geçer, ödeme alınmaz.

**Ama bir boşluk var:** süre dolduğunda anahtarı düşürecek bir iş yok.
`syncKeyTiers` yalnızca Stripe webhook'unda çalışıyor. Denemeyi açarsak
**süresi dolan abonelikleri gecelik tarayıp düşüren bir cron** gerekiyor —
yoksa deneme sonsuza kadar Pro kalır.

Deneme için Pro limiti (10.000/gün) gerçekte gereksiz; günlük kullanım 1–24 istek.
Ama "sınırsız" hissi vermek ve kotayı düşünmeden test etmelerini sağlamak için
mantıklı.

---

## Öneri

**Deneme kapsamını ikiye bölelim:**

**Faz 1 — hemen (bu hafta, ~yarım gün iş):**
- Furkan'a 10 günlük `trialing` aboneliği + API anahtarı
- Sadece **okuma**: İstanbul günlük fiyatları, ürün filtresiyle
- Kullanım raporunu 5. ve 10. günde çıkar (hangi ürün, kaç istek, hangi saat)
- Gereken tek kod işi: **deneme bitiş cron'u** (aksi halde süre dolmaz)

**Faz 2 — talep API'si (deneme sonrası, ~1–1,5 gün iş):**
- Anahtara `scope` alanı + `listings:write` yetkisi
- `POST /listings` API anahtarıyla açılabilsin, `listingType: "alim"`
- Açılan talep `/ilanlar`'da görünür, komisyoncular yanıtlar
- Faz 1'in kullanım verisi bunun gerçekten isteneceğini gösterir

**Neden bölüyorum:** Faz 1 bugünkü altyapıyla neredeyse hazır ve gerçek kullanım
verisi üretir. Faz 2 ise anahtara yazma yetkisi verdiği için güvenlik tasarımı
gerektiriyor; onu, müşterinin gerçekten kullandığını gördükten sonra yapmak daha
doğru.

## Görüşmede söylenmemesi gerekenler

- ❌ "Anlık fiyat" — günlük, İBB'nin yayınladığı gün
- ❌ "Her gün veri" — kaynakta boşluklar oluyor (28 Ağu–1 Eyl)
- ❌ "İstanbul geneli" — yalnız Anadolu Yakası
- ✅ "İBB'nin yayınladığı günlerde, 94–105 ürün, ürün bazında filtrelenebilir"

## Açık sorular (Furkan'a sorulacak)

1. Avrupa Yakası fiyatı gerekiyor mu? (varsa ayrı iş)
2. Kaç ürünle ilgileniyorlar — hepsi mi, belirli bir liste mi?
3. Talep açma tarafını gerçekten API'den mi istiyorlar, yoksa panelden elle
   açmak yeterli mi? (Faz 2'nin gerekip gerekmediğini bu belirler)
4. Deneme sonunda ücretli devam beklentisi ne? (Pro 2.999 ₺/ay ile uyumlu mu)
