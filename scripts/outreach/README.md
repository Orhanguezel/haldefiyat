# İletişim adresi toplama araçları

Kurumların **kendi sitelerinde yayımlanmış** iletişim adreslerini toplar.
Politika, İhracat Radarı `decision-makers` modülüyle aynıdır:

- **LinkedIn kazınmaz** (kullanım şartları ihlali, hesap riski). Sitede yayımlanmış
  profil bağlantısı varsa kaydedilir, içeriği çekilmez.
- **Apollo / ücretli veri sağlayıcı kullanılmaz.**
- **E-posta tahmini (pattern) üretilmez** — yalnız gerçekten yayımlanmış adres alınır.
- Her adres için **kaynak URL** ve **MX kontrolü** kaydedilir. MX, kutunun var olduğunu
  kanıtlamaz; yalnız alan adının posta kabul ettiğini gösterir.

## Kullanım

```bash
cd backend && set -a && . ./.env && set +a
python3 ../scripts/outreach/iletisim-adresi-topla.py          # liste kod içinde
TARGETS_FILE=hedefler.json OUT_FILE=cikti.json python3 ...    # genel sürüm
```

`SCRAPER_URL` + `SCRAPER_API_KEY` gerekir (hal-fiyatlari `.env`'inde mevcut).

## Bilinen sınır — alan adı keşfi

Arama motorları (DuckDuckGo HTML, Bing, Google Maps) veri merkezi IP'lerini
blokluyor: sorgu 200 dönüyor ama sonuç linki içermiyor. Bu yüzden **alan adı
otomatik bulunamıyor**; hedef listesine alan adı elle verilmeli. Adres çıkarma
kısmı sorunsuz çalışıyor.

Ayrıca `mode: "fast"` yetmez — birçok site JS ile render ediliyor ve HTML boş
gelir. **`mode: "dynamic"` + `return_html: true`** şart (`mailto:` bağlantıları
yalnız HTML'de bulunur).

## Yasal ayrım — karıştırma

| | Basın | Ticari (firma) |
|---|---|---|
| Hukuk | Yayımlanmış editoryal adrese basın bülteni | 6563 sayılı Kanun + KVKK |
| Ön onay | Gerekmez | Tacir/esnafa gerekmez, **ama İYS kaydı + çıkış hakkı zorunlu** |
| Gönderim | Elle, kişiselleştirilmiş | İYS entegrasyonu olmadan başlama |

Toplu gönderim `noreply@haldefiyat.com` üzerinden **yapılmamalı**: bültenin
gönderim itibarını riske atar.

## Hedef listesi

`kurum-adaylari.txt` — `kategori|kurum adı|alan adı` biçiminde Türkiye tarım
ekosistemi kurumları. Kategoriler: `ihracat`, `borsa`, `meslek`, `sektor`,
`kurum`, `komisyoncu`, `fakulte`.

Akış:
1. Adayları DNS ile ele (A veya MX kaydı yoksa alan adı yanlış demektir)
2. Kalanları toplayıcıdan geçir
3. `kurum-adres-db-ekle.py` ile `hf_press_contacts`'a yaz (kategori `tags`'te)

2026-08-18 ilk turda: 79 aday → 61 DNS geçerli → 44 adres bulundu.
Basın turuyla birlikte toplam **61 gerçek adres**.

## Neden bazıları bulunamıyor

- Alan adı tahmini yanlış (ör. `antalyatb.org.tr` yok, gerçeği farklı)
- Site iletişimi yalnız form ile veriyor, e-posta yayımlamıyor
- Adres görsel içinde veya JS ile gizlenmiş
- Site 500/timeout veriyor

Bunlar elle bir kez doğrulanıp `kurum-adaylari.txt`'ye doğru alan adıyla
yazılırsa sonraki turda otomatik gelir.
