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
