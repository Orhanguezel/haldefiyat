# Ürün Birleştirme (Dedup) Playbook — hal-fiyatlari

> **Amaç:** `hf_products`'taki ETL kaynaklı dublike / yazım-hatası / format varyantlarını
> aile aile temizlemek. Dublikeleri doğru çeşide **301**'lemek, **noindex**'i minimize etmek.
> Bu iş **tüm ürünlerde** sürecek; her oturum kaldığı yerden devam eder.
>
> **Karar (2026-06-15, Orhan):** noindex mümkün olduğunca olmasın → thin dublikeler 301,
> ölü ürünler 410. Mevsimsel ürünler (90–365g stale, ~27 adet) **noindex KALIR**.

İlgili hafıza: `auto-merge-onerici.md` (özet) · `seo-index-expansion-plan.md` · `seo-pagekey-collision-hal-detay.md`

---

## 1. Araç — "Birleştirme önerileri" paneli

hf-products list sayfası → **GitMerge** butonu → `GET /api/v1/admin/hal/products/merge-suggestions`.

**Kök-isim (base noun) aile gruplaması:** Her ürünün isim token'ları içinden **global frekansı
en yüksek** olan kök kabul edilir. `marul`/`fasulye`/`elma` her varyantta tekrarlandığı için
niteleyicilerden (kıvırcık, aysberg, kırmızı) ayrışır → aynı kök = **tek aile**. Böylece
"Kırmızı Marul", "Aysberg Marul", bozuk ETL isimleri hepsi tek ailede toplanır.

**UI — aile içi tekrarlı alt-birleştirme:** Bir ailede birden çok gerçek çeşit olabilir
(marul → kıvırcık / aysberg / lolorosso / göbekli, hepsi ayrı indexli). Bir çeşit grubunu seç →
en çok hal'liyi **master yap** → **Birleştir**. Merged varyantlar listeden düşer, master + kalanlar
durur, başka çeşidi ayrıca birleştir. Varsayılan **seçimsiz** (büyük ailede kaza önler);
"Tümünü seç" kısayolu pür-dublike aileler için.

Kod: `backend/src/modules/hal-admin/index.ts` (merge + merge-suggestions endpoint'leri),
`admin_panel/.../hf-products/_components/merge-suggestions-panel.tsx`.

---

## 2. İş akışı — her aile için 4 adım

### Adım 1 — Tam aileyi DB'den çek (panel kümesi bazen eksik!)
Panel base-noun ile gruplar ama bazı varyantlar farklı kök alır; **DB'de `LIKE` ile** tüm slug'ları gör:

```sql
SELECT p.id, p.slug, p.display_name, p.seo_index,
 (SELECT COUNT(DISTINCT market_id) FROM hf_price_history
  WHERE product_id=p.id AND recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) AS hal
FROM hf_products p
WHERE p.canonical_slug IS NULL AND p.slug LIKE "%KÖK%"
ORDER BY hal DESC;
```

### Adım 2 — Çeşit taksonomisi kur
Bölüm 3'teki karar kurallarına göre: hangi çeşit master kalacak, hangileri nereye 301.

### Adım 3 — Merge API ile birleştir
```
POST /api/v1/admin/hal/products/merge
body: {"masterId": N, "variantIds": [a, b, c, ...]}
```
JWT üretimi (VPS, `JWT_SECRET` **`backend/.env`**'den — proje kökünde değil):
```bash
ssh vps-vistainsaat 'cd /var/www/tarim-dijital-ekosistem/projects/hal-fiyatlari
export JWT_SECRET=$(grep -E "^JWT_SECRET=" backend/.env | cut -d= -f2-)
JWT=$(python3 -c "
import hmac,hashlib,base64,json,os,time
def b(d):
 d=d.encode() if isinstance(d,str) else d
 return base64.urlsafe_b64encode(d).rstrip(b\"=\").decode()
hh=b(json.dumps({\"alg\":\"HS256\",\"typ\":\"JWT\"}));pp=b(json.dumps({\"sub\":\"4f618a8d-6fdb-498c-898a-395d368b2193\",\"role\":\"admin\",\"iat\":int(time.time()),\"exp\":int(time.time())+3600}))
print(hh+\".\"+pp+\".\"+b(hmac.new(os.environ[\"JWT_SECRET\"].encode(),(hh+\".\"+pp).encode(),hashlib.sha256).digest()))
")
curl -s -X POST -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d "{\"masterId\":N,\"variantIds\":[...]}" \
  http://localhost:8091/api/v1/admin/hal/products/merge'
```

### Adım 4 — Canlı 301 doğrula
```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://haldefiyat.com/urun/SLUG"
# yanlış-yazım → DOĞRU çeşit, thin → generic kök olmalı
```

---

## 3. Karar kuralları

| Durum | Aksiyon |
|---|---|
| **İndexli (≥3 hal) gerçek çeşit** | AYRI TUT (master). Farklı çeşitleri asla tek master'a toplama (aysberg≠kıvırcık, fuji≠granny, salkım≠cherry, çekirdeksiz≠siyah). |
| **Yazım hatası / aynı şeyin farklı yazımı** | **DOĞRU çeşide** 301 (generic'e değil): gransmit→granny-smith, Çeri→Cherry, iceberg→aysberg, lemas→lamas, 4×Washington→washington, Anşagadın→ayse-kadin, polorosso→lolorosso. |
| **Thin çeşit (<3 hal)** | **generic kök**'e 301. Index kapısı ≥3 → ayrı sayfa olamaz; isim alias olur, veri büyürse ayrılır. |
| **Format/menşe/grade qualifier** (kutu, kasa, koli, organik, köy, yerli, ithal, 1.kalite, sanayi) | generic kök'e 301 (gerçek çeşit değil). |

**Mekanik notlar:**
- Merge fiyat geçmişini **taşımaz** ama varyant fiyatı master sayfasında `variantPricesByMaster`
  (canonical_slug aggregation) ile görünür → veri kaybolmaz.
- ETL eşleşmesi **bozulmaz** — alias map name+alias ile çözer; merge varyant ismini master alias'ına ekler.
- Yanlış yazımı düzeltmek için **slug RENAME YAPMA** (hedef slug doluysa 409 verir, tasarımca). Onun yerine doğru ürünle **MERGE** et.
- Merge editorial'ı master'a taşır (master'da yoksa varyantın en zenginini).

---

## 4. "FARKLI ÜRÜN" tuzakları — `LIKE`'ın yanlış topladıkları

Aynı kök/string'i paylaşan ama **bambaşka ürün** olanlar. Birleştirme, AYRI bırak:

| Tuzak | Gerçekte |
|---|---|
| `frenk-uzumu` | Frenk üzümü = currant (Ribes), asma değil |
| `erik-malta` | Malta eriği = loquat / yenidünya (Eriobotrya) |
| `kabak-cicegi` | Kabak çiçeği (ayrı ürün, sebze değil) |
| `limon-otu` | Lemongrass (limon değil) |
| `yer-elmasi` / `yerelmasi` | Yer elması = Jerusalem artichoke (elma değil) |
| `tatli-patates` | Tatlı patates = sweet potato (farklı sebze) |
| `karalahana` | Kara lahana = kale (beyaz/kırmızı lahanadan ayrı) |
| `bruksel-lahana(si)` | Brüksel lahanası = Brussels sprouts |
| `cennet-elmasi`, `trabzon-hurmasi` | Persimmon |
| `turp-otu` / `turp-salgam` | Turp yaprağı / şalgam (turnip) |
| `cagla-kayisi` | Çağla = ham yeşil kayısı (olgun kayısıdan ayrı) |
| `deniz-patlicani` | Patlıcan değil |
| `yesillik-maydanoz-nane-tere-roka-dere` | Karışık yeşillik paketi (tek ot değil) |

> **Kural:** her ailede her üye için "bu gerçekten aynı ürün mü?" diye sor.

---

## 5. QUALIFIER bug pattern (önemli)

Cross-cutting jenerik token'lar **sahte aile** yapar (base-noun onları kök sanıp alakasız ürünleri toplar).
Bulununca backend `QUALIFIER` set'ine ekle (`hal-admin/index.ts` → merge-suggestions endpoint) → build → deploy.

Şu ana dek eklenenler: renk (kırmızı/yeşil/sarı/beyaz/mor/siyah…), tazelik/menşe/boy/birim,
otu/ot/yaprak/çiçek/tatlı/acı/ekşi/sap/filiz/tohum, **yas** ("Yaş-Taze" → dereotu+kekik+badem
karışıyordu), **yeni** ("Yeni Dünya"/loquat + "Papates Yeni"/"Salatalık Yeni" karışıyordu).

**Yeni sahte aile görürsen** (bir kökte alakasız ürünler) → ortak jenerik token'ı QUALIFIER'a ekle.

---

## 6. Tamamlanan aileler (yeniden dokunma)

elma · fasulye · marul · domates · üzüm · kabak · erik · portakal · limon · patlıcan · armut ·
biber · mandalina · patates · turp · muz · hamsi · kayısı · kiraz · havuç · kavun · lahana · nane ·
yeni-dünya (loquat) · karpuz · tere · uskumru · adaçayı

**Zaten temiz** (panelde çıkar ama hepsi ayrı indexli çeşit — DOKUNMA): domates(9), biber(7), portakal(6), turp(7).

## 7. Devam

Panelde kalan küçük aileler (soğan, salatalık, şeftali, …) aynı 4-adım akışıyla. Her aile sonrası
canlı 301 doğrula. Mevsimsel ürünler noindex kalır.
