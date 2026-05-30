# Çeklist — Firma Logo / Görsel Yükleme (`/firmalar/ekle` + `/hesabim/firmam`)

> **Karar:** Orhan, 2026-05-30. Firma formuna **logo/görsel yükleme** eklenecek. **Başka oturumda**
> yapılacak — bu sadece hazırlık çeklisti. **KESİN KURAL: kod tekrarı YOK** — mevcut resim yükleme
> altyapısı (storage modülü + AvatarUpload) yeniden kullanılacak, sıfırdan yazılmayacak.
> **Rol:** Claude = plan/mimari · Codex = implementasyon · Orhan = test.

## Mevcut Gerçekler (bunlara dayan, yeniden yazma)
- **Backend upload endpoint HAZIR:** `POST /api/v1/storage/:bucket/upload` (multipart `file`),
  döner `{ url }`. (`packages/shared-backend/modules/storage/router.ts` → `uploadToBucket`.)
  Cloudinary veya local — env'e göre otomatik (`cloudinary.ts`). **Dokunma, kullan.**
- **Mevcut yükleme bileşeni:** `frontend/src/components/dashboard/profile/AvatarUpload.tsx`
  — `/storage/avatars/upload`'a FormData + Bearer atıp `{url}` alıyor, preview gösteriyor.
  **Bu mantık aynen yeniden kullanılacak** (kopyalanmayacak — aşağıda ortak bileşene çıkarılacak).
- **DB HAZIR:** `hf_firms.photo_url VARCHAR` zaten var (scraped firmalarda dolu). **Şema değişikliği YOK.**
- **Frontend tip HAZIR:** `Firm.photoUrl` (`lib/api.ts`) var; **public profil zaten `firm.photoUrl`'i
  render ediyor** (`firma/[slug]/page.tsx` → `<img src={firm.photoUrl}>`). Yeni gösterim gerekmez.
- **EKSİK olan tek şey:** (1) ortak upload bileşeni, (2) `firmWriteBodySchema`'da `photoUrl` alanı yok,
  (3) owner formunda yükleme alanı yok.

---

## FAZ 1 — Ortak `ImageUpload` bileşeni (DRY — kod tekrarını önle) `[Codex]`
- [ ] `frontend/src/components/ui/ImageUpload.tsx` oluştur — AvatarUpload'daki yükleme mantığını
  **buraya taşı**. Props: `{ bucket: string; value?: string | null; onChange: (url: string) => void;
  label?: string; aspect?: "square" | "wide"; disabled?: boolean }`.
  - İçeride: dosya seç → preview (`URL.createObjectURL`) → `FormData` → `POST /storage/${bucket}/upload`
    (Bearer `getStoredAccessToken`) → `{url}` → `onChange(url)`. Hata/uploading state. accept="image/*".
  - Dosya boyutu/tip guard (ör. ≤5MB, jpg/png/webp).
- [ ] **AvatarUpload'ı bu ortak bileşeni kullanacak şekilde refactor et** (kod tekrarı kalmasın).
  Davranışı koru (`avatar_url` update + toast). **Canlı bileşen — dikkatli, test et.**

## FAZ 2 — Backend: `photoUrl` kabulü `[Codex]`
- [ ] `backend/src/modules/firms/index.ts` → `firmWriteBodySchema`'ya:
  `photoUrl: z.string().trim().url().max(1024).nullable().optional()`.
- [ ] `repository.ts` create + update fonksiyonları `photoUrl`'i `photo_url`'e **persist** etsin
  (mevcut `citySlug`/`categories` koşullu spread deseni gibi: `...(input.photoUrl !== undefined ? { photoUrl: input.photoUrl } : {})`).
- [ ] **Bucket allowlist:** `uploadToBucket` bucket'ı kısıtlıyorsa `firms` (veya `firm-logos`) eklenmeli;
  kısıtlamıyorsa dokunma. **Önce kontrol et.**

## FAZ 3 — Owner formuna entegre `[Codex]`
- [ ] `FirmOwnerForm.tsx` firma alanları bölümüne **`<ImageUpload bucket="firms" value={form.photoUrl}
  onChange={(url) => setField("photoUrl", url)} label="Firma logosu" />`** ekle.
- [ ] `FirmPayload`'a `photoUrl?: string | null` ekle; `emptyFirm`, `fromFirm`, `normalizeFirmPayload`
  güncelle (create + manage ikisinde de gönderilsin).
- [ ] **manage** modunda mevcut logo önizlemesi (firma scraped logosu varsa görünsün, değiştirilebilsin).
- [ ] Logo opsiyonel — zorunlu değil (firma logosuz da kaydolabilir).

## FAZ 4 — Gösterim doğrulama `[Codex]`
- [ ] Public profil zaten `photoUrl` render ediyor → sadece **yeni yüklenen logo görünüyor mu** doğrula.
- [ ] `FirmCard` (dizin kartı) logoyu gösteriyor mu kontrol et; göstermiyorsa ekle (mevcut alan, yeni veri yok).

## Notlar / Kapsam Dışı
- **Excel/CSV import logosu YOK:** Excel import **ürün/fiyat** içindir (her satır bir fiyat); logo **firma
  başına tekil** bir görseldir, satır-bazlı import'a girmez. Logo yalnız form'dan yüklenir.
  ("import ile ekleyelim" = mevcut yükleme bileşenini *import edip yeniden kullan* demek; ürün importuna
  logo kolonu eklemek DEĞİL.)
- **Şema değişikliği YOK** (`photo_url` zaten var) — ALTER gerekmez.
- **Tek upload yolu:** storage modülü. Yeni endpoint/yükleme mantığı YAZMA.

## Kabul Kriterleri (Orhan testi, başka oturumda)
1. `/firmalar/ekle` → "Firma logosu" alanından görsel seç → preview → kaydet → profilde logo görünür.
2. `/hesabim/firmam` → mevcut logo görünür, değiştirilebilir.
3. AvatarUpload (profil fotoğrafı) hâlâ çalışıyor (refactor regresyonu yok).
4. Logosuz firma da kaydolabiliyor (opsiyonel). Typecheck temiz.

## Dosya Özeti
**Yeni:** `frontend/src/components/ui/ImageUpload.tsx`
**Değişen:** `AvatarUpload.tsx` (ortak bileşeni kullan), `FirmOwnerForm.tsx` (logo alanı + payload),
`backend/src/modules/firms/index.ts` (photoUrl zod), `repository.ts` (photo_url persist)
**Korunur:** storage modülü, `hf_firms.photo_url`, public profil gösterimi, Firm tipi.
