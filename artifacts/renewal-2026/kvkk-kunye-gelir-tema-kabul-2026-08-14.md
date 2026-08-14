# KVKK, Künye, Gelir ve Tema Rollout Kabulü

**Tarih:** 14 Ağustos 2026

**Ortam:** Canlı `https://haldefiyat.com` + `vps-vistainsaat`

**Kapsam:** E25–E34, F1.27, F1.39

## Sonuç

- KVKK ve sahiplik/finansman sayfaları gerçek işletmeci ve rol ayrımıyla canlıdır.
- Arama talebi ile OTP için süreli silme işi canlı cron/servis katmanına bağlanmıştır.
- `GZL Teknoloji`, Atakan Şahin ve Orhan Güzel rol ayrımı yayımlanmıştır; doğrulanmamış adres/şehir üretilmemiştir.
- Temiz Veri tema kararı 12 ölçütlü matrise bağlıdır; Pazar Defteri yalnız editoryal ikincil yüzeydir.
- HalDeFiyat Google Ads entegrasyonunun kapanan v21 varsayılanı v25'e yükseltilmiş ve canlı salt-okunur sorguyla doğrulanmıştır.
- Statik ve dinamik OG yüzeyleri doğru boyutta görüntü üretir; tema release'inden sonra tema/font/asset kaynaklı CSP ihlali yoktur.

## KVKK ve saklama kanıtı

Canlı sayfa kontrolleri:

- `/kvkk`: HTTP 200; veri sorumlusu GZL Teknoloji, arama talebi için 90 gün, OTP için süre sonu + 1 gün ve audit için 30 gün metni mevcut.
- `/sahiplik-finansman`: HTTP 200; Atakan Şahin sahip/sektör ağı, Orhan Güzel teknik yürütme; ilan fiyatının hal fiyatından ayrı olduğu ve konsept paket fiyatlarının mock olduğu açık.
- `listing-privacy-retention` canlı çalıştırıldı: terminal arama talebi silinen `0`, süresi geçmiş OTP silinen `4`.
- Call-request/retention testleri: 8/8 geçti; backend TypeScript kontrolü geçti.

Uygulanan yaşam döngüsü:

| Veri | Silme eşiği |
|---|---|
| `hf_listing_call_requests` terminal durumları | Son güncellemeden 90 gün sonra |
| `hf_phone_verifications` | Doğrulama süresi + 1 gün sonra |
| İstek/audit kayıtları | Mevcut 30 günlük audit retention işi |

Resmî kontrol kaynakları:

- KVKK, Aydınlatma Yükümlülüğü: <https://www.kvkk.gov.tr/Icerik/2033/Aydinlatma-Yukumlulugu->
- KVKK, Aydınlatma Yükümlülüğünün Yerine Getirilmesi Hakkında Kamuoyu Duyurusu: <https://www.kvkk.gov.tr/Icerik/6765/AYDINLATMA-YUKUMLULUGUNUN-YERINE-GETIRILMESI-HAKKINDA-KAMUOYU-DUYURUSU>

Teknik uygulama; kimlik, amaç, aktarım, toplama yöntemi/hukuki sebep ve ilgili kişi haklarını açık başlıklarda tutar. Nihai mevzuat/sözleşme değerlendirmesi hukuk danışmanının görevini ortadan kaldırmaz.

## Künye ve gelir kanıtı

Bağlayıcı kayıt: `docs/GELIR-VE-KUNYE-KARAR-KAYDI.md`.

14 Ağustos canlı DB sayımı:

- `hf_firm_claims`: 3 toplam, 3 onaylı, 0 bekleyen.
- `hf_firms`: 1.335 toplam, 1.333 sahipsiz, 2 doğrulanmış.

Bu sayım E34'teki eski “0 başvuru” varsayımını geçersiz kılar. Gelir pilot sırası A lead-gen → B claim/öne çıkarma → C B2B veri/rapor/API olarak kaydedildi. Mock paket fiyatları satışa kapalıdır.

## Google Ads rollout kanıtı

Kök neden: ortak REST istemcisi `v21` kullanıyordu. Google'ın sürüm takviminde v21'in kapanış penceresi Ağustos 2026, güncel kararlı sürüm v25'tir:

- <https://developers.google.com/google-ads/api/docs/sunset-dates>
- <https://developers.google.com/google-ads/api/docs/get-started/make-first-call>

Uygulama:

- Ortak paket commit'i: `shared-ecosystem-packages@3b79a46`.
- Varsayılan endpoint `v25`; `GOOGLE_ADS_API_VERSION` acil override olanağı korunuyor.
- Ortak paket typecheck/build geçti, VPS `git pull --ff-only` ile güncellendi, backend build + `pm2 reload` sonrası health HTTP 200.
- Canlı varsayılan v25 salt-okunur doğrulama: `verified=true`, erişilebilir hesap `10`.
- HalDeFiyat kampanyası: `PAUSED`, günlük kayıtlı bütçe 290 TL; son 30 gün gösterim `0`, tıklama `0`, maliyet `0`, dönüşüm `0`.
- Eski “aktif 150 TL/gün” çeklist varsayımı canlı hesapla uyuşmadığından düzeltildi. Tema rollout'u aktif HalDeFiyat Ads trafiğine maruz kalmadı.
- `AW-18007572524` etiketi `/`, `/canli-hal-fiyatlari` ve `/urun/domates` canlı HTML'inde mevcut.

Hiçbir kampanya, bütçe veya teklif ayarı değiştirilmedi; sorgular salt okunurdur.

## OG ve CSP kabulü

| Canlı yüzey | Sonuç |
|---|---|
| `/uploads/og/home.png` | PNG 1200×630 |
| `/og/default` | PNG 1200×630 |
| `/og/metodoloji?ratio=16x9` | PNG 1200×675 |
| `/og/urun/domates` | PNG 1200×630 |
| `/og/rapor/yillik/2025?ratio=16x9` | PNG 1200×675 |

- Canlı yanıtta enforce `Content-Security-Policy` başlığı mevcut.
- PM2 arşivinde toplam 7 CSP raporu var; son kayıt 13 Ağustos 2026 06:07 UTC ve tema release'i `c9df3079`dan öncedir.
- Son ihlaller Chrome eklentisi `clicktranslator.com` ve Google reklam ölçüm çağrısı kaynaklıdır; tema fontu, görseli veya yeni asset'i kaynaklı kayıt yoktur.
- Tema release'inden kabul anına kadar yeni `csp_violation` kaydı: `0`.

## Açık dış bağımlılık

Künye adresi/şehir bilgisi doğrulanmış bir kaynakta bulunmadığı için yayımlanmadı. F1.38 bu tek eksik alan nedeniyle kısmi kalır; teknik işlerin kabulünü engellemez.
