# Codex Brief — HalDeFiyat Per-Kullanıcı Gmail / Takvim / Görev Entegrasyonu

**Hazırlayan:** Claude (Mimar) · **Tarih:** 2026-07-27 · **Uygulayan:** Codex · **Deploy/doğrulama:** Claude
**Amaç:** Admin panelde her kullanıcı kendi Google hesabını (Gmail + Takvim + Görev) bağlasın →
kendi Gmail'inden **basın outreach maili göndersin/okusun**, **takvimde takip/follow-up etkinliği**
oluştursun. Sonraki faz: basın CRM (kampanya→kişi) gönderimleri `hf_press_outreach_logs`'a otomatik loglansın.

## Kaynaklar (birebir referans — kopyala-uyarla)
- **Çalışan port (öncelikli):** `/home/orhan/Documents/Projeler/osgb-yazilim/backend/src/modules/mailAccounts/{service.ts,controller.ts,router.ts,index.ts}` + `admin_panel/src/app/(main)/admin/(admin)/entegrasyonlar/`
- **Orijinal:** `/home/orhan/Documents/Projeler/market_pulse/backend/src/modules/mail-accounts/` + `037_user_mail_accounts_schema.sql`
- **OSGB brief'i (mantık):** `/home/orhan/Documents/Projeler/osgb-yazilim/BRIEF-CODEX-ENTEGRASYON-MAIL-TAKVIM-TASK.md`

OSGB portu market_pulse'tan **tek-kiracıya** indirilmiş; hal-fiyatlari için OSGB portu neredeyse
birebir uyarlanır. Aşağıdaki hal-fiyatlari farklarına dikkat et.

## ÖN KOŞULLAR (Orhan + Claude — kod ÇALIŞMASI için şart)
1. **Google Cloud Console** (Orhan): mevcut OAuth client'a (site_settings `google_ads_client_id`/`google_ads_client_secret`) —
   - Scope ekle: `gmail.send`, `gmail.readonly`, `calendar`, `tasks`, `userinfo.email`, `userinfo.profile`.
   - Yetkili redirect URI: `https://haldefiyat.com/api/v1/mail/accounts/gmail/callback`.
   - Hassas scope'lar (gmail/calendar) → **test kullanıcısı** modu (Orhan+ekip test user) VEYA Google doğrulaması.
2. **Prod `.env`** (Claude/Orhan): `MAIL_ENCRYPTION_KEY` = `openssl rand -hex 40`. **`requireEnv` — fallback YOK** (CLAUDE.md). `.env.example` boş satır.
3. **Deps** (Codex ekler, Claude root'ta `bun install`): `googleapis`. IMAP istenmiyor → `imapflow` ve IMAP dallarını çıkar (Gmail-OAuth only).

## BACKEND (Codex)

### 1. Şema — `backend/src/db/seed/sql/057_user_mail_accounts_schema.sql`
- OSGB 059'daki 3 tabloyu al (market_pulse 037 tek-kiracı hali):
  - `user_mail_accounts`: owner_user_id (users FK), provider `enum('gmail_oauth')`, email, display_name, enc_access_token, enc_refresh_token, token_expiry, scopes(json), status `enum('connected','expired','error','disconnected')`, last_error, last_synced_at, created/updated.
  - `user_google_event`: id, owner_user_id, external_id, title, description, starts_at, ends_at, location, raw_data(json), updated_at.
  - `user_google_task`: id, owner_user_id, external_id, subject, body, due_at, status, completed_at, raw_data(json), source, updated_at.
- **KURAL:** `CREATE TABLE IF NOT EXISTS`, idempotent, `ALTER TABLE` YASAK (CLAUDE.md). `owner_user_id` her sorguda filtre.

### 2. Kripto — `backend/src/core/crypto.ts`
- market_pulse `_shared/crypto`'dan `encryptAes256Gcm`/`decryptAes256Gcm` portu. `MAIL_ENCRYPTION_KEY` `requireEnv` (env.ts'e ekle). Token'lar DB'de **daima şifreli**, loga yazma.

### 3. Modül — `backend/src/modules/mailAccounts/`
- OSGB `mailAccounts/` kopyala-uyarla. hal-fiyatlari farkları:
  - Auth: `getAuthUserId(req)` (`@agro/shared-backend/modules/_shared`) — OSGB'nin `requireOsgbUye` yerine hal-fiyatlari `requireAuth` + `getAuthUserId`.
  - `callbackUrl()` → `${PUBLIC_BASE_URL}/api/v1/mail/accounts/gmail/callback` (prod `haldefiyat.com`). Google client id/secret site_settings'ten (`getGoogleSettings` deseni — GSC/Ads ile aynı, `getGoogleAdsSettings`'e bak).
  - Scope listesine `calendar` + `gmail.*` ekle.
  - `signState/verifyState`: HMAC + exp (CSRF), `JWT_SECRET` ile.
  - Fonksiyonlar: `createGmailConnectUrl`, `handleGmailCallback`, `listAccounts`, `deleteAccount`, `sendMailViaAccount`, `getGmailClient`, `syncGoogleCalendar`, `getGoogleCalendarStatus`, `createCalendarEvent`, (opsiyonel) `syncGoogleTasks`.
  - `entitlements`/modül-gate YOK → hal-fiyatlari admin route zaten `requireAuth+requireAdmin` altında.

### 4. Router `/mail/accounts...`
- `list`, `gmail/connect`, `gmail/callback` (**auth'suz — state doğrular**, Google redirect cookie taşımaz), `delete/:id`, `send`, `inbox`, `messages/:id`, `calendar/sync`, `calendar/status`, `calendar/event` (oluştur).
- **Kayıt:** callback dışı route'lar admin (requireAuth+requireAdmin) altında; callback ayrı public + state imzasıyla. `backend/src/routes/project.ts`'e ekle.

## FRONTEND (Codex — admin_panel)
- OSGB `entegrasyonlar/` sayfasını + RTK endpoints/types'ı uyarla.
- **`/admin/entegrasyonlar`** sayfası: kartlar — **Gmail Bağla**, **Takvim Bağla** — bağlı/değil + Bağlan/Kes + son senkron. "Bağlan" → `GET /mail/accounts/gmail/connect` → dönen URL'ye redirect → Google onay → callback → geri dön.
- Sidebar öğesi (`sidebar-items.ts`) + locale anahtarı (`admin.sidebar.items.entegrasyonlar` — **locale JSON'a EKLE**, aksi halde ham anahtar görünür, bkz. banners olayı).

## BASIN TAKİBİ ENTEGRASYONU (hal-fiyatlari'ya özgü — bu işin ASIL amacı)
- `hf_press_outreach_logs` tablosu ZATEN VAR (campaign_id, contact_id, channel, status, note, published_url, contacted_at).
- **`sendMailViaAccount`** basın kişisine gönderdiğinde: opsiyonel `{campaignId, contactId}` alırsa gönderim sonrası `hf_press_outreach_logs`'a `channel='email', status='sent', contactedAt=now` satırı yaz + `hf_press_contacts.status='contacted'`, `last_contacted_at` güncelle.
- **Takvim:** basın follow-up için `createCalendarEvent` (ör. "X gazetesi — takip araması") → press kişisiyle ilişkilendir (event note'a contactId).
- Press admin sayfasında (`/admin/press`) kişi satırına "Mail gönder" (bağlı Gmail'den) + "Takvime follow-up ekle" aksiyonları (Faz 2, ayrı brief olabilir).

## GÜVENLİK (CLAUDE.md — ZORUNLU)
- `MAIL_ENCRYPTION_KEY`/`JWT_SECRET`/`COOKIE_SECRET` → `requireEnv`, fallback YOK, `.env.example` boş.
- Token'lar daima şifreli; loga yazma. Her kullanıcı yalnız kendi `owner_user_id` kaydı.
- OAuth `state` HMAC+exp, callback'te doğrula. Ekosistem paket kuralı: `bun install` yalnız ROOT'tan.

## Sıra
1. Ön koşullar (Orhan: Google Cloud scope+redirect; Claude: MAIL_ENCRYPTION_KEY).
2. Şema 057 + crypto.ts + env.
3. mailAccounts modül + router + route kaydı → Gmail bağla/gönder + takvim.
4. Frontend entegrasyonlar sayfası + sidebar + locale.
5. Basın takibi entegrasyonu (outreach log + follow-up) — Faz 2.

## Claude yapar
- Google Cloud OAuth prerequisite'i Orhan'a ilet; `MAIL_ENCRYPTION_KEY` üret + prod .env.
- Deploy (git akışı) + kabul: Gmail bağlama uçtan uca (connect→callback→send test), token şifreli, callback state doğrulama.
