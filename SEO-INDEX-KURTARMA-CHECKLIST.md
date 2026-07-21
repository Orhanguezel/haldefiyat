# SEO Index Kurtarma Checklist

> Amaç: "Keşfedilmiş/Taranmış — indexlenmemiş" ve "Bilinmiyor 1.219" URL'lerini
> indexe taşımak. **Teşhis (2026-07-22): sorun ince içerik DEĞİL** (örnek sayfalar
> 1.760–5.142 kelime, canonical OK, noindex yok). Sorun: **tarama bütçesi + site
> otoritesi + iç link derinliği + şablon benzerliği**.
>
> Rol: Claude = tasarım/kod, Codex = toplu implement, Orhan = GSC/operasyon.
> İşaretler: `[ ]` yapılacak · `[~]` kısmen var, güçlendir · `[x]` tamam.

## Durum Fotoğrafı (2026-07-22, GSC 28g, sc-domain:haldefiyat.com)

- Ürün (seoIndex): 1.320 toplam · 175 index · 1.145 noindex · 409 editoryelli
- GSC (ürün): 152 indexli · 533 noindex · 341 bilinmiyor · 1 keşfedildi-indexsiz · 1 tarandı-indexsiz
- GSC (tüm URL / İndexleme sekmesi): 270 indexli · 11 indexsiz · **1.219 bilinmiyor**
- Kalite geçidi ÇALIŞIYOR: 1.145 düşük ürün zaten noindex. Asıl darboğaz "bilinmiyor".

## Zaten VAR olan (tekrar yazma — güçlendir)

- [~] /firmalar dizin sayfası — `frontend/src/app/[locale]/(public)/firmalar/page.tsx`
- [~] /analiz ilgili rapor bloğu — `analiz/[slug]/page.tsx:137,333` (3 rapor)
- [~] /urun ilgili ürün bloğu — `urun/[slug]/page.tsx:254,643` ("Aynı kategoriden")
- [x] Firma sayfaları `seo_index=1` olana dek sitemap dışı, hub'lardan keşif — `sitemap.ts:109`
- [x] Ürün kalite geçidi (dataQuality + editorial → index/noindex)

---

## Faz 1 — İç Link Derinliği (EN YÜKSEK ROI)

Hedef: "Discovered — not indexed" URL'lerine indexli güçlü sayfalardan çok sayıda
link vermek; tık-derinliğini (homepage'ten mesafe) 2-3'e indirmek.

- [ ] **1.1 /firmalar hub'ını il×tip matrisine çevir.** Şu an muhtemelen düz liste.
      Her il için `/firmalar/{il}` + `/firmalar/{il}/{tip}` linklerini gruplu ver
      (81 il × {komisyoncu, hal, borsa}). Alfabetik + bölge kırılımı.
      Dosya: `firmalar/page.tsx`. Owner: Claude tasarım → Codex.
- [ ] **1.2 /hal ve /firmalar arası çapraz link.** Her hal detayında o ildeki firmalara,
      her firma sayfasında o ildeki hale link. (aynı il = güçlü tematik küme).
- [ ] **1.3 Ana sayfa + /analiz hub'ına "Son raporlar" bloğu** (son 6-8 analiz, tarih
      sıralı). Şu an /analiz/[slug] içi related var ama HUB'tan taze linkleme zayıf.
      Dosya: `analiz/page.tsx`, homepage desktop ağacı.
- [x] **1.4a /analiz related 3→6** (2026-07-22 yapıldı, `analiz/[slug]/page.tsx:137`).
- [ ] **1.4b /analiz "önceki/sonraki hafta" kronolojik zinciri** (marjinal ek, ops.).
- [x] **1.5 /urun related ZATEN GÜÇLÜ** — 12 kardeş ürün, rotasyonlu pencere
      (`urun/[slug]/page.tsx:254`). Ek gerekmez.
- [ ] **1.6 Footer/mega-nav'a tematik hub linkleri** (kategoriler, popüler iller,
      son raporlar) — her sayfadan derin URL'lere sabit link.

## Faz 2 — Şablon Sayfaları Farklılaştır

Google şablonu görüp "marjinal değer düşük" diyor. Her sayfanın ÜSTÜNE benzersiz veri.

- [ ] **2.1 Firma sayfası benzersiz özet** — o ilin firma sayısı, en çok işlem gören
      hal, ile özgü 1-2 cümle dinamik giriş (şablon değil).
- [ ] **2.2 Analiz raporu benzersiz H1 + özet** — haftaya özgü en çok artan/azalan 3
      ürün başlıkta/ilk paragrafta (zaten veri var, öne çıkar).
- [ ] **2.3 Ürün sayfası benzersiz açılış** — o ürünün bugünkü fiyat aralığı + en ucuz
      hal ilk ekranda (boilerplate metinden önce).

## Faz 3 — Ölçekte Budama — ⚠️ ZATEN UYGULANMIŞ (2026-07-22 tespit)

Kod tabanı budamayı zaten yapıyor — yeni toplu budamaya gerek YOK:
- [x] **Firma seo_index varsayılan 0** (`034_firms_schema.sql`) — sadece zengin/onaylı firma index havuzunda.
- [x] **/firmalar/{il}: `total >= 5 ? index : noindex`** (`firmalar/[slug]/page.tsx:150`) — 5'ten az firmalı iller noindex.
- [x] **/firmalar/{il}/{tip}: eşik altı kombo noindex** (`[slug]/[type]/page.tsx:84`).
- [x] **Ürün kalite geçidi** — 1.145 düşük ürün noindex.
- Profil (VPS 2026-07-22): 1.331 firma, ~63 ilde firma var, sadece 73 il/tip kombosu dolu →
  boş il/kombo sayfaları zaten noindex. **"discovered not indexed" olanlar ≥5 eşiğini geçen GERÇEK sayfalar.**
- [ ] **3.x Opsiyonel:** eşiği 5→8 çıkarmak isabetli mi? (marjinal; önce Faz 4/5'i dene). Karar: Orhan.

## Faz 4 — Seçili Manuel Index (AZ, cezasız)

- [ ] **4.1 Güncel analiz raporları + yüksek-değer ürünler** için GSC URL Inspection'dan
      tek tek "Request indexing" (haftada ~10-15). **Toplu Indexing API SPAM YOK.**
- [ ] **4.2 Yeni yayınlanan içeriği** IndexNow ile ping'le (zaten `indexnow-key.txt` var).
- [ ] **4.3 GSC'de "Sayfalar" raporundan "Discovered" kovasını haftalık izle** (azalıyor mu).

## Faz 5 — Otorite + Tazelik (uzun vade)

- [ ] **5.1 Backlink** — TARIMIKLIM-BACKLINK-TODO.md ile hizala; ekosistem içi
      (bereketfide/vistaseeds) → haldefiyat tematik linkler.
- [ ] **5.2 Düzenli tazelik** — fiyat sayfaları günlük güncelleniyor (lastmod doğru olsun).
- [ ] **5.3 Analiz üretimini düzenli tut** — haftalık rapor cron'u kesintisiz.

---

## Ölçüm / Kabul Kriteri

- [ ] Haftalık: GSC "Discovered — not indexed" ve "Crawled — not indexed" sayısı düşüyor.
- [ ] 4 hafta: "Bilinmiyor 1.219" belirgin azalıyor (Google kuyruğu tarıyor).
- [ ] İndexli URL (270) artış trendinde.
- [ ] Admin `/admin/search-console` → İndexleme sekmesi "İndexsiz" kovası küçülüyor.

## Notlar

- /hal/uzunkopru-ticaret-borsasi **bilerek noindex** — bu listede olması normal, index
  istenmiyorsa yok say.
- İç link altyapısı sıfırdan değil; **var olanı güçlendirme** işi (yukarıda `[~]`).
