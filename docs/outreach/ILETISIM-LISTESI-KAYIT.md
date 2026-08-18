# Tarım İletişim Listesi — Kayıt

**Tarih:** 18 Ağustos 2026 · **Yöntem:** kurumların kendi sitelerinden otomatik toplama
**Durum:** 61 gerçek adres · 10 hedef hâlâ placeholder

## Ne toplandı

| Kategori | Adet |
|---|---:|
| Ticaret borsası | 18 |
| Basın (ulusal/yerel/tarım) | 16 |
| Sektör birliği | 11 |
| İhracatçı birliği | 6 |
| Meslek örgütü | 5 |
| Kamu / akademi | 5 |
| **Toplam** | **61** |

Öncesinde tabloda 28 kayıt vardı ve **hepsi placeholder**'dı
(`dogrulanacak+<slug>@haldefiyat.com`) — yani kullanılabilir tek adres yoktu.

## Nerede duruyor

- **Kanonik kayıt:** `hf_press_contacts` tablosu. Her satırda e-posta, kategori (`tags`),
  ve `notes` içinde **kaynak URL + tarama tarihi + alternatif adresler**.
- **Paylaşılabilir kopya:** `exports/haldefiyat-tarim-iletisim-2026-08-18.csv`
- **Ham tarama çıktısı (kanıt):** `artifacts/outreach-2026-08/*.json`
- **Araçlar + aday listesi:** `scripts/outreach/`

## Toplama politikası (değişmez)

- Yalnız kurumun **kendi sitesinde yayımlanmış** adres alınır.
- **LinkedIn kazınmaz** (ToS ihlali), **Apollo/ücretli kaynak kullanılmaz**.
- **E-posta tahmini (pattern) üretilmez.**
- KEP adresleri (`*@hs01.kep.tr`) alınmaz — resmî tebligat kanalıdır, iletişim adresi değil.
- Her adres için MX kontrolü yapılır (kutunun varlığını kanıtlamaz, alan adının posta
  kabul ettiğini gösterir). 61/61 MX geçti.

## Temas kaydı nasıl tutulur

Biri ile iletişime geçildiğinde `hf_press_outreach_logs` tablosuna satır yazılır:
`contact_id`, `channel`, `status`, `note`, `published_url`, `contacted_at`.
İlgili kişinin `hf_press_contacts.status` alanı da güncellenir:
`target → contacted → replied → published` (veya `blocked`).

Şu an log tablosu **boş** — henüz kimseye yazılmadı.

## Yasal ayrım — karıştırma

| | Basın (16) | Kurum/ticari (45) |
|---|---|---|
| Hukuk | Yayımlanmış editoryal adrese basın bülteni | 6563 sayılı Kanun + KVKK |
| Ön onay | Gerekmez | Tacir/esnafa gerekmez, **ama İYS kaydı + çıkış hakkı zorunlu** |
| Gönderim | Elle, kişiselleştirilmiş | İYS olmadan toplu gönderim yapma |

**`noreply@haldefiyat.com` üzerinden toplu gönderim yapılmaz** — bültenin gönderim
itibarını riske atar. Bu ölçekte elle/Gmail gönderim hem yasal hem daha etkili.

## Açık kalanlar

- 10 basın hedefi placeholder: Agro Haber, Hasat, Mersin Zamanı, Adana 5 Ocak,
  Antalya Ticaret Borsası, ANTKOMDER, TMO, Habertürk, Gazete Duvar, BBC Türkçe.
- Bulunamayan kurumlar: EİB, İİB, OAİB, KİB, BAİB, TOBB, TÜİK, Tarım Kredi, ESK,
  Adana TB, Ege/Selçuk Ziraat Fakültesi vb.
- **Ölçek engeli:** arama motorları (DuckDuckGo/Bing/Google Maps) veri merkezi IP'sini
  blokluyor; alan adı otomatik bulunamıyor. Yüzlerce kuruma çıkmanın yolu TOBB ve TZOB'un
  resmî üye dizin sayfaları — doğru URL'ler elle bir kez tespit edilmeli.
- İl tarım müdürlükleri `{il}.tarimorman.gov.tr` kalıbıyla çözülebilir (test edildi, çalışıyor).
