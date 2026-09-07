# Pamuk fiyat serisi ve analiz standardı

Pamuk fiyat analizlerinin ana kanıtı resmî ticaret borsası bültenleridir. Haberler olay bağlamı sağlayabilir; fiyat serisinin ve yıllık değişim hesabının yerine geçmez.

## Tamamlanan seri — 7 Eylül 2026

- Kaynaklar: Şanlıurfa Ticaret Borsası tarih aralığı tescil bültenleri ve İzmir Ticaret Borsası aylık pamuk bültenleri.
- 2013 Ocak başlangıcı. ŞUTB 2026-09-07 kesimi; İTB son mevcut aylık dosya Temmuz 2026.
- 328 bülten/istek incelendi. 2.254 geçerli kayıt: ŞUTB 1.986, İTB 268. 183 boyut kombinasyonu ayrı seri kimliğiyle tutuldu; bunların hepsi kesintisiz seri değildir.
- ŞUTB ST.1 beyaz / HTS / PEŞİN: 165 dönem. KÜTLÜ PAMUK / HMS / PEŞİN: 125 dönem.
- 74 eksik/tutarsız satır veya yanlış belge karantinada. Kaynak bağlantılarının 163 ay listelenmesi 163 ay geçerli fiyat olduğu anlamına gelmez.
- Aynı seri ve tamamlanmış aynı takvim ayı için 1.335 yıllık karşılaştırma üretildi.
- Canlı tablo: `hf_cotton_observations`. Aylık veri mevcut günlük `hf_price_history` içine yazılmaz.
- Canlı seri sayfası: https://haldefiyat.com/analiz/pamuk-fiyatlari-gecmisi-2013-2026-borsa-serisi
- Excel: https://haldefiyat.com/uploads/cotton-series/2026-09-07/pamuk-aylik-fiyat-serisi.xlsx

## Yayın kapısı

- Ürün formu (kütlü/lif/linter), kaynak borsa, tam kalite etiketi, işlem türü, ödeme türü, fiyat türü, birim ve ortalama yöntemi eşleşmeden seriler birleştirilmez.
- Aynı etikette dahi randıman, mahsul yılı ve parti kalitesi bilinmiyorsa açıkça belirtilir. Tescil tarihi hasat tarihi değildir.
- Kaynakta yayımlanan ortalama (`avg_price`) ile tutar/miktardan türetilen fiyat (`derived_weighted_price`) ayrı tutulur. İkincisi borsanın ortalaması gibi sunulmaz.
- Tamamlanmamış ay tam ayla yüzdesel kıyaslanmaz. Boş değer sıfır yapılmaz; eksik dönemler doldurulmaz.
- `min <= avg <= max`, pozitif fiyat/miktar, birim, tekil kayıt anahtarı, belge dönemi ve kaynak dosyası özeti doğrulanır. Şüpheli kayıt düzeltilmiş gibi gösterilmez; karantinaya gider.
- Veri çekim hatası varsa ithalat durur. Yanlış bülten/boş fiyat kaynak açığı olarak belgelenir.
- Bir satırdaki fiyat artışı üretici kârlılığı, ülke ortalaması veya yeni mahsul açılışı olarak yorumlanmaz.
- Her iddia veri satırına ve resmî kaynak URL'sine dayanır; grafikte kapsam, birim ve eksik dönemler görünürdür.

## Yeniden üretim

Yerel proje kökünden:

```bash
python3 backend/scripts/cotton-series/collect.py --through 2026-09-07
python3 -m unittest discover -s backend/test/cotton-series -v
python3 backend/scripts/cotton-series/export.py
cd backend
bun scripts/cotton-series/import.ts ../data/cotton-series
bun scripts/cotton-series/import.ts ../data/cotton-series --apply
```

Python bağımlılıkları `backend/scripts/cotton-series/requirements.txt`; PDF metni için `pdftotext` gerekir. Önbellek kaynak URL'siyle adreslenir; `--refresh` aynı tarihin resmî kaynak düzeltmelerini yeniden çeker. `coverage.json`, `quarantine.json`, `summary.json` incelenmeden yayın yapılmaz.

İthalat yalnız kontrol edilmiş kaynak/ay bölümlerini transaction içinde yeniler; önceki kısmi ayın aynı ayda birikmesi engellenir. Yeniden çalıştırma kayıt çoğaltmaz. Ham cevaplar ve SHA-256 özetleri özel `data/cotton-series/raw` arşivinde korunur; canlı indirme dizinine ham HTML konulmaz.

`publish.ts` bu 7 Eylül yayın paketi için tek seferlik araçtır; aynı slug varsa işlemi durdurur. `export.py` içindeki yayın metni de bu kesim tarihine aittir. Yeni kesimde collector/import tekrar kullanılabilir; grafik/yayın metni yeni tarihe göre editoryal olarak güncellenmelidir. Otomatik yayın veya yeni cron kurulmadı.

Aydın OCR ve İzmir günlük XLS/PDF arşivleri bu aylık serinin kapsamına dahil değildir. Eski genel Pamuk günlük serisindeki 459 kayıt da bu doğrulanmış seriye dahil edilmedi.
