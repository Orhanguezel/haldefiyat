# OTURUM BRIEF — Ölçüm Gerçeği + Funnel Aktivasyonu (P0)

**Üretim:** 2026-06-01 (Claude) · **Çalıştırma:** bir sonraki oturum, Claude + Codex **birlikte** · **Operasyon:** Orhan
**Bağlam:** `reports/analiz-26-31-mayis-2026.pdf` · Aksiyonlar: `KALAN-ISLER.md › 🔴 AKTİF ÖNCELİK` · Bulgular: `KALAN-ISLER-DOCS.md › TRAFIK-ANALIZ-BULGULAR-2026-06-01`

---

## 0. Bu oturumun TEK amacı

> Ads ~6× trafik getiriyor (3.220 → 19.248 insan/gün) ama **kiralık** ve **ölçülemiyor**: GA4 hal-fiyatlari için ayrı değil (VistaSeeds property'sine akıyor), funnel uçtan uca kanıtlanmadı. **Bu oturumda yeni feature YAZILMAZ** — mevcut (zaten kurulu) funnel uçtan uca **doğrulanır** ve GA4 **aktive edilir.** "Ads parası kitleye dönüyor mu?" sorusu sayıyla cevaplanır hale gelir.

**Kapsam dışı (bu oturumda DEĞİL):** P1 (İstanbul ETL, SEO şehir sayfaları, kuru kaynaklar) — ayrı oturum. Yeni newsletter/landing/conversion kodu yazmak — zaten var, sadece doğrula/düzelt.

### Mevcut durum (2026-06-01 doğrulandı — sıfırdan yazma!)
| Parça | Durum | Dosya |
|---|---|---|
| Newsletter subscribe | ✅ 201 dönüyor | `backend/src/modules/newsletter/router.ts` |
| Single opt-in + welcome mail + HMAC unsubscribe | ✅ kodda var | `router.ts`, `welcome-email.ts`, `token.ts` |
| `trackConversion()` (4 event + gclid/utm + SHA-256 email) | ✅ kodda var | `frontend/src/lib/analytics.ts` |
| Analytics bileşeni (GA4/GTM/Ads, consent mode) | ✅ kodda var | `frontend/src/components/seo/Analytics.tsx` |
| Signup formları | ✅ var | `CtaNewsletter.tsx`, `MobileHomeNewsletterCta.tsx`, `LivePriceNewsletter.tsx`, `abonelik/page.tsx` |
| `/canli-hal-fiyatlari` landing | ✅ 200 | `frontend/src/app/[locale]/(public)/canli-hal-fiyatlari/page.tsx` |
| **Ayrı GA4 property** | ❌ YOK (en büyük açık) | — |
| **Funnel uçtan uca kanıt** | ❌ yapılmadı | — |

**İlgili mevcut brief'ler (sıfırdan değil, referans):** `docs/codex-briefs/M11-2-conversion-events.md`, `M11-3-attribution-capture.md`, `M11-4-landing-canli-hal-fiyatlari.md`, `newsletter-activation.md`.

---

## 1. Ön-uçuş (oturumun başında, Claude — 10 dk)

Bunlar netleşmeden kod/deploy yok:

```bash
# A. GA4 ID şu an nereden geliyor + değeri ne? (en kritik soru)
cd /home/orhan/Documents/Projeler/tarim-dijital-ekosistem
grep -rn "ga4Id\|adsConversionId\|gtmId\|NEXT_PUBLIC_GA\|G-\|AW-1800" projects/hal-fiyatlari/frontend/src/app/**/layout.tsx
grep -rn "Analytics\b" projects/hal-fiyatlari/frontend/src/app --include=*.tsx
# ga4Id env'den mi (NEXT_PUBLIC_*) yoksa site_settings DB'den mi besleniyor → kaynağı bul

# B. Formlar trackConversion("newsletter_signup") çağırıyor mu?
grep -rn "trackConversion" projects/hal-fiyatlari/frontend/src

# C. Welcome mail hangi gönderici ile gidiyor? (DKIM/Resend uyumu — spam riski)
sed -n '1,60p' projects/hal-fiyatlari/backend/src/modules/newsletter/welcome-email.ts
grep -rn "sendBereketMail\|from:\|MAIL_FROM\|RESEND" packages/shared-backend/core/mail* 2>/dev/null | head
```

**Çıktı kararı (Claude → Orhan/Codex):** Ön-uçuş 3 soruyu cevaplar → (A) GA4 ID kaynağı + mevcut değer, (B) hangi formlar conversion event'i bağlı/bağlı değil, (C) welcome mail gönderici domaini doğru mu (haldefiyat.com DKIM vs bereket). Bulunan açıklar Codex görevine yazılır.

---

## 2. CLAUDE BRIEF'İ (mimar + doğrulayıcı)

Rol: teşhis et, uçtan uca test et, açıkları spec'le, Codex çıktısını review et. Kod yazmaz; doğrular ve yönlendirir.

### C1 — Newsletter funnel'ı uçtan uca kanıtla (canlı)
```bash
# 1) Subscribe → 201 + DB kaydı
curl -s -X POST https://haldefiyat.com/api/v1/newsletter/subscribe \
  -H 'Content-Type: application/json' \
  -d '{"email":"orhan+nltest1@gmail.com","source":"brief-verify"}' -w "\nHTTP %{http_code}\n"
ssh vps-vistainsaat 'mysql -u haldefiyat -pHal2026\!secure hal_fiyatlari -e \
  "SELECT id,email,is_verified,locale,meta,unsubscribed_at FROM newsletter_subscribers WHERE email=\"orhan+nltest1@gmail.com\";"'
```
- [ ] 201 + satır düştü, `is_verified=1`, `meta` source doğru
- [ ] **Welcome mail Inbox'a düştü mü** (Orhan gmail kontrol) — spam'e düşerse C-açık: gönderici domaini (memory `smtp-email-alerts-deferred`: Resend + haldefiyat.com DKIM olmalı, bereket değil)
- [ ] Aynı email tekrar → 200 `reactivated` (duplicate welcome mail YOK)
- [ ] Unsubscribe: welcome mail'deki linke tıkla → `unsubscribed_at` doluyor; geçersiz token → 400

### C2 — GA4/conversion akışını teşhis et
- [ ] Ön-uçuş B: hangi signup formları `trackConversion("newsletter_signup", …, {email})` çağırıyor — eksikleri listele (Codex'e C-görev)
- [ ] `lib/attribution.ts` gclid/utm cookie'yi gerçekten yakalıyor mu (M11-3 implement edildi mi) — `getAttribution()` dönüşü
- [ ] Consent mode: `hf_cookie_consent` kabul edilmeden gtag event'i denied modda mı (CookieConsentBanner.tsx)

### C3 — Codex çıktısını review + kabul
- [ ] GA4 ID swap'ı tek kanonik tag mı (eski/yabancı tag kalmadı) — `view-source` veya DevTools Network'te `gtag/js?id=` tek ve doğru ID
- [ ] Build temiz, deploy sonrası `/_next/static` 500 yok (CLAUDE.md: frontend `pm2 restart`, reload değil)

### C4 — Oturum kapanış raporu
- [ ] Funnel durumu tablosunu güncelle (✅/❌), kalan açıkları `KALAN-ISLER.md` P0'a işle, hangi P0 maddesi kapandı işaretle

---

## 3. CODEX BRIEF'İ (implementer)

Rol: Claude'un teşhisinden çıkan **somut, sınırlı** düzeltmeleri yap. Spec'siz iş yapma; her madde Claude onayından geçer.

> ⚠️ Kurallar: **Deploy SADECE git** (rsync/scp YASAK). Frontend/admin → `pm2 restart` (reload DEĞİL). ALTER TABLE YASAK (şema değişirse seed SQL + fresh). Shared `newsletter` subscribe'a DOKUNMA — bu local modül (`backend/src/modules/newsletter/`). Hardcode YASAK (GA4 ID env/DB'den).

### X1 — GA4 ID kaynağını hal-fiyatlari property'sine bağla (Orhan ID verince)
- [ ] Orhan'dan yeni `G-XXXXXXXX` gelince: ga4Id kaynağına yaz (ön-uçuş A'da bulunan yer — `NEXT_PUBLIC_*` env VEYA `site_settings`)
- [ ] Eski/yabancı GA4 veya VistaSeeds tag'i varsa kaldır → **tek kanonik tag**
- [ ] `adsConversionId` = `AW-18007572524` doğru bağlı mı teyit (Analytics.tsx prop'u)
- [ ] Deploy: git push → VPS git reset --hard → `cd frontend && bun run build` → `pm2 restart hal-frontend --update-env`

### X2 — Eksik formlara conversion event bağla (Claude C2 listesine göre)
- [ ] Claude'un işaretlediği signup formlarında submit başarılı (201/200) sonrası `trackConversion("newsletter_signup", { value: 1 }, { email })` çağır
- [ ] `/canli-hal-fiyatlari` landing'deki `LivePriceNewsletter` formu da bağlı olmalı (Ads landing → en kritik)
- [ ] Yalnızca eksik olanları ekle — zaten bağlı olanı tekrar etme (M11-2 kısmen yapmış olabilir)

### X3 — Welcome mail gönderici düzeltmesi (Claude C1 spam tespiti varsa)
- [ ] `sendBereketMail` haldefiyat.com DKIM'li gönderici kullanmıyorsa → Resend/haldefiyat from adresine çevir (memory `smtp-email-alerts-deferred`). Shared mail core'u kırma; hal-fiyatlari'ya özel from parametresi geç
- [ ] Test: yeni subscribe → mail Inbox (spam değil)

### X4 — (Gerekirse) attribution/consent açığı
- [ ] C2'de gclid/utm yakalanmıyor çıkarsa M11-3 spec'ine göre `attribution.ts` tamamla
- [ ] Sadece Claude doğrulaması bunu açık bulursa

---

## 4. ORHAN BRIEF'İ (manuel / harici — koda bağlı değil)

- [ ] **GA4 property aç:** GA4 Admin → Property oluştur "Haldefiyat" → veri akışı `haldefiyat.com` → `G-XXXXXXXX` al, Codex'e ver (ADS-SETUP #3)
- [ ] **Google Ads bağla:** Vista Seeds Ads → Bağlantılı hesaplar → Haldefiyat GA4
- [ ] **GA4 DebugView doğrula:** kendi tarayıcından subscribe → DebugView'de `newsletter_signup` + `gclid`/`utm_*` görünüyor mu
- [ ] **Ads landing final URL:** kampanya → final URL `/` → `/canli-hal-fiyatlari` (gclid sızıntısı: tıklamaların çoğu anasayfaya düşüyor)
- [ ] **Conversion eşleştir:** Google Ads → Dönüşümler → `newsletter_signup`'ı AW-18007572524 ile eşleştir → "Doğrulandı" (24-48h)

---

## 5. Yürütme sırası (bağımlılıklar)

```
[Orhan] GA4 property aç + G-XXXX al   ─┐  (oturumdan önce yapılabilirse ideal)
                                        ▼
[Claude] Ön-uçuş (A/B/C) ──► [Claude] C1 funnel canlı test
   │                                    │
   ├─► açık bulgular ──► [Codex] X1 GA4 swap ─► X2 event bağla ─► X3 mail fix
   │                                    │
   ▼                                    ▼
[Claude] C3 review + kabul ◄─── deploy (pm2 restart)
   │
   ▼
[Orhan] DebugView + Ads conversion eşleştir + landing URL
   │
   ▼
[Claude] C4 kapanış: KALAN-ISLER.md P0-A/B/C işaretle
```

## 6. Bu oturum BAŞARILI sayılır eğer (kabul kriterleri)
- [ ] Tek kanonik hal-fiyatlari GA4 tag'i canlıda, eski/yabancı tag yok
- [ ] Test subscribe → DB kaydı + Inbox'a welcome mail + çalışan unsubscribe (3/3)
- [ ] `newsletter_signup` event'i (en az anasayfa + /canli-hal-fiyatlari formundan) gtag'e düşüyor (DevTools Network kanıtı)
- [ ] GA4 DebugView'de event + gclid/utm görünür
- [ ] Ads kampanya final URL `/canli-hal-fiyatlari`
- [ ] **Sonuç:** "dün Ads'ten kaç tıklama → kaç abone" sorusu GA4/DB'den sayıyla cevaplanabiliyor

## 7. Geri dönüş / risk
- GA4 swap sonrası veri akmazsa: consent mode denied'da takılı olabilir (kullanıcı cookie kabul etmeli) — `GoogleConsentMode` mantığını kontrol et
- Frontend deploy sonrası ChunkLoadError/500 → CLAUDE.md kuralı: `pm2 restart hal-frontend hal-admin --update-env` (reload değil)
- Welcome mail spam'e düşerse acil değil — funnel'ı bloke etmez, X3 ile çözülür
