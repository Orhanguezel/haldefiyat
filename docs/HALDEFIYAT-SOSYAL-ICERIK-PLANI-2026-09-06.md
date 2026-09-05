# HaldeFiyat Sosyal İçerik Planı — Tanitio denetimi ve yeniden kurulum (2026-09-06)

Kapsam: Facebook (Haldefiyat), Instagram (@halde_fiyat), Telegram kanalı, WhatsApp kanalı, X (@haldefiyat).
Denetim kaynağı: `ekosistem_sosyal` DB (social_posts, platform_accounts, post_analytics), Tanitio kodu
(`cron/data-content.ts`, `source-connectors/{profiles,x-charts,instagram-frame,haldefiyat-meta-card}.ts`),
hal-fiyatlari `telegram-channel/report-image.ts`, canlı gönderi görselleri (deploy yedeğinden).

## 1. Mevcut durum — ne yayınlanıyor

| Kanal | Motor | Sıklık | Görsel | Durum |
|---|---|---|---|---|
| Telegram kanalı | hal-fiyatlari `publishDailyReport` | her gün | 1200×1800 dikey kart, gerçek ürün fotoğrafı, 5 artan + 5 düşen, şehir, ₺, %, alt bant adres | **İyi** — referans format |
| WhatsApp kanalı | aynı görsel, admin sohbetine taslak | her gün, elle | Telegram kartı | İyi, elle |
| Facebook + Instagram | Tanitio `data-content` (haldefiyat tenant, 31 Ağu'dan beri açık) | günde 3 (09:00 movers, 16:00 sıralama, 11:00 haftalık endeks) + Pazar | 1200×675 yatay bar grafiği, 1080×1350 tuvale **siyah bantla** sığdırılmış | **Kötü** — aşağıda |
| X | hal-fiyatlari social modülü | kapalı (10 Ağu, kredi) | — | Kapalı |

Son 30 günde FB/IG'ye 14 gönderi çıktı (12 AI, 2 elle); 20 gönderi iptal edildi.

## 2. FB/IG'de neden kötü (kanıtlı)

1. **Görsel:** bar grafiği 16:9, 4:5 tuvale "contain" ile sığdırılıyor → üst ve altta %45 siyah boşluk (canlı gönderi 04.09.). Logo yok, ürün fotoğrafı yok, şehir yok, yüzdeler "-60.0%" (nokta ondalık), kaynak satırı "hal fiyat verisi" gibi belirsiz.
2. **Seçim:** her gün aynı bandın ürünleri: -60,0 / -59,4 / -57,4… Sebep `HF_DATA_MAX_CHANGE_PCT=60` tavanı; motor en büyük değişimi alıyor, tavanın altında kalan **en uç** kayıtlar seçiliyor. Sonuç: Rambutan, Kivano, Frenk üzümü, kereviz sapı, deniz börülcesi gibi düşük hacimli/egzotik ürünler ve tek hal'lik sıçramalar. Okuyucunun aradığı domates, biber, patates, soğan, limon değil.
3. **Metin:** LLM serbest yazıyor ("Limon Konya'da %60 düşüşle 30 TL'ye geriledi" — Konya limon üreticisi değil, tek hal kaydı). Aynı haftalık endeks metni 02.09, 04.09 ve 05.09'da üç kez farklı cümlelerle paylaşıldı (tekrar koruması sourceRef'e bakıyor, rapora değil).
4. **Medya kalıcılığı:** gönderi medya URL'leri `panel.tanitio.com/uploads/ig-cards/...` **404**. Dosyalar 04.09 deploy'unda "untracked" olarak `/root/deploy-backups/untracked-20260904b/` altına taşınmış; canlı `backend/uploads/ig-cards` boş. Meta gönderiyi kendi kopyasıyla gösteriyor ama panelde, feed'de ve yeniden paylaşımda görsel yok. Aynı risk her deploy'da.
5. **Ölçüm yok:** `post_analytics` 21 gönderi için hep 0 (beğeni, erişim, gösterim). `platform_accounts`'taki FB/IG token'ları Graph API'de "cannot parse" — yayın `.env` `FB_PAGE_ACCESS_TOKEN` ile gidiyor, insights toplayıcı DB token'ını kullanıyor → hiç veri toplanmıyor. IG hesabında error_count=1, mesaj yok.
6. **Marka:** kart paleti Tanitio'nun lacivert/turuncusu (logodan ölçülmüş) ama site zümrüt; Telegram kartı zümrüt. Üç kanal üç ayrı görünüm. Karar bekliyor (30 Ağu'dan beri).

Telegram kartının da bir zaafı var: seçim aynı `trendingChanges` ile yapılıyor → 5 Eylül kartında Eylül'de kiraz (Trabzon ₺175 +74,5, İzmir ₺200), deniz börülcesi, ahududu var. Format iyi, seçim değil.

## 3. Hedef: tek görsel sistem, dört kanal

**İlke:** Görsel ve metin **hal-fiyatlari** üretir (veri, ürün fotoğrafı manifesti, birim/karantina bilgisi orada). Tanitio **yayın ve ölçüm** katmanıdır (Meta bağlantısı, onay kuyruğu, analitik, ajans paneli). Google/Meta'ya iki ayrı marka görünümü değil, Telegram'da beğenilen kart ailesi her kanala.

### 3.1 Kart ailesi (hal-fiyatlari üretir, üç boyut: 1200×1800 TG/WA, 1080×1350 IG/FB, 1200×675 X/OG)

| Kod | Seri | Ne gösterir | Gün/saat (TR) |
|---|---|---|---|
| K1 | **Günün Hareketleri** | 4 artan + 4 düşen, fotoğraf, şehir, ₺, % (Telegram kartının aynısı) | her gün 09:30 |
| K2 | **Mutfak Sepeti** | 8–10 temel ürün (domates, biber, patlıcan, salatalık, patates, soğan, limon, elma, muz, marul) fotoğraflı ızgara, bugün ₺ + hafta oku | her gün 13:00 |
| K3 | **Şehir Şehir** | tek ürün, 6–8 şehirde bugünkü fiyat, en ucuz/en pahalı vurgusu; ürün rotasyonla (sezon + GSC talebi) | Sal-Per 18:30 |
| K4 | **Haftalık Sinyal** | endeks değeri + haftalık %, 3 yükselen 3 düşen, analiz linki | Pazar 19:00 (tek sefer) |
| K5 | **Sezon / Rehber** | rehber sayfalarından (turşuluk, salçalık, kışlık) tek kart | Cuma 12:30, 2 haftada bir |
| K6 | **Güven** | "bu rakam nereden geliyor" metodoloji kartı | ayda 1 |

Hepsi aynı şablon: üstte logo + seri adı + tarih, gövde, altta zümrüt bant `haldefiyat.com/...` (WhatsApp ileri iletme dersi), kaynak satırı "Belediye halleri + HKS · {tarih}".

### 3.2 Seçim kuralları (K1 için, Telegram'a da uygulanır)
- Yalnız `seo_index=1` master ürünler; `search_volume ≥ 1.000` **veya** sabit temel-ürün listesi.
- Değişim bandı %8–%45; %45 üstü "olağandışı" olarak ayrı işaretlenir, karta girmez (uç kayıt = veri hatası olasılığı).
- Aynı ürün karta iki kez girmez (Kiraz Trabzon + Kiraz İzmir değil; en çok hal'de görülen şehir seçilir).
- Ürünün o gün en az 2 hal'de kaydı olmalı (tek hal sıçraması dışlanır).
- Sezon kapısı: ürünün son 14 günde en az 5 hal'de kaydı yoksa (sezon dışı kiraz gibi) karta girmez.
- Karantina (`hf_price_quarantine`) ve blackout kayıtları dışlanır (zaten var).

### 3.3 Metin kuralları
- LLM yok. Şablonlu, kısa, Türkçe: ilk satır sinyal ("Domates 5 halde ucuzladı: ₺32,50 (−%12)"), 3–5 satır liste, son satır link. Link ilk 2 satırda (WhatsApp/IG katlama).
- Yüzde TR biçimi (%12,5), ürün adı görünen ad (Salçalık Domates), şehir adı hal adının önünde.
- Hashtag seti sabit 4: #HalFiyatları #HaldeFiyat #SebzeMeyve #{ürün}.
- Tekrar koruması **içerik anahtarıyla** (rapor slug + tarih), sourceRef'le değil.

### 3.4 Mimari
1. hal-fiyatlari: `modules/social/cards/` — mevcut `report-image.ts` genelleştirilir (boyut/oran parametreli, seri şablonları K1–K6), `GET /api/v1/social/cards/today?series=K1&size=ig` (imzalı, anonim değil) JSON: `{imageUrl, caption, hashtags, link, contentKey, recordedDate}`. Cron 08:45 TR üretir, storage `uploads/social-cards/` (Cloudinary değil; **deploy.sh yedeklemez, uploads git-ignore + `rsync --exclude` korunur** — 04.09 vakası hal tarafında yaşanmasın diye kontrol edilir).
2. Tanitio `data-content.ts` haldefiyat dalı: mevcut şablonlar kapatılır; yeni `CardFeed` şablonu hal ucundan kartı çeker, `social_posts`'a **draft** yazar (onay modu ilk 2 hafta), `platform:'both'`, medya = hal URL'si (Tanitio'ya kopyalanmaz → 404 riski biter; `absoluteUrl` kuralı sağlanır).
3. Telegram/WhatsApp yayıncıları aynı `cards` modülünden beslenir (kod tekrarı kalkar).
4. X: hal social modülü aynı kartın 1200×675 halini kullanır; **kredi kararı Orhan'da**, plan X'i kapsar ama açmaz.

### 3.5 Ölçüm
- Tanitio insights toplayıcı için haldefiyat FB/IG hesaplarının token'ları panelden **yeniden bağlanır** (Meta OAuth akışı, Orhan) → `post_analytics` dolar.
- Haftalık rapor: gönderi başına erişim, beğeni, link tıklaması (UTM `utm_source=instagram&utm_medium=social&utm_campaign=k1-daily`), siteye gelen oturum (GA4 `sessionSource`).
- Başarı eşiği (4 hafta): IG erişim/gönderi ≥ 300, FB ≥ 150, link tıklaması ≥ %1,5; Telegram kanalı abone artışı referans.

## 4. Fazlar

| Faz | İş | Kim | Süre | Kabul |
|---|---|---|---|---|
| 0 | Tanitio haldefiyat `data-content` **durdur** (`DATA_CONTENT_TENANTS`'tan çıkar) — kötü kart akışı bugün kesilir; Telegram sürer | Claude | 10 dk | FB/IG'ye yeni AI gönderi düşmez |
| 0 | Meta token'larını panelden yeniden bağla; IG error_count temizle | Orhan | 15 dk | Graph `me` 200, insights akar |
| 0 | Palet kararı: zümrüt (site) mi turuncu/lacivert (logo) mu | Orhan | karar | tek palet |
| 1 | hal `cards` modülü: K1 + K2 üç boyutta, seçim kuralları, caption şablonu, endpoint, cron | Claude tasarım → Codex | 2 gün | 3 gün üst üste doğru kart, uç kayıt yok |
| 1 | Telegram/WhatsApp yayıncıları `cards`'a taşınır | Codex | 0,5 gün | Telegram kartı değişmeden aynı çıktı |
| 2 | Tanitio `CardFeed` şablonu (draft, both), 2 hafta onaylı yayın | Claude | 1 gün | draft'lar panelde görünür, Orhan onaylar |
| 2 | K3 Şehir Şehir + K4 Haftalık (analiz duyurusu ile birleşir, tekrar biter) | Codex | 1 gün | Pazar tek gönderi |
| 3 | Otomatik yayına geçiş (onay kaldırılır), UTM + GA4 raporu, K5/K6 | Claude | 1 gün | 4 haftalık ölçüm raporu |
| 3 | X'i aynı karttan besleme (kredi açılırsa) | Orhan karar | — | — |

## 5. Yapılmayacaklar
- AI metin üretimi FB/IG'de (mevcut olaylar: placeholder URL, Portekizce kayması, "Konya limon").
- 16:9 grafiği 4:5'e sığdırma; Instagram için kart doğrudan 4:5 üretilir.
- Tanitio'ya ikinci bir veri kopyası; medya URL'si hal'de yaşar.
- Egzotik/uç ürünlerle "ilgi çekme" (Rambutan −%59). Güven ürünüdür, temel gıda anlatılır.

## 6. Kararlar (Orhan)
1. Faz 0'ı bugün uygulayayım mı (AI akışını durdurmak)? Onaylanırsa `DATA_CONTENT_TENANTS` düzenlenir, PM2 restart (Tanitio backend, ~3 sn).
2. Palet.
3. Onaylı (draft) dönem 2 hafta mı, daha kısa mı?
4. X kredisi.
