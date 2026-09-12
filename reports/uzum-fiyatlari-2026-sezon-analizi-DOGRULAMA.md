# Üzüm Sezon Analizi Taslağı — Bağımsız Doğrulama Raporu

**Tarih:** 12 Eylül 2026 · **Doğrulanan belge:** `uzum-fiyatlari-2026-sezon-analizi-taslak.md` (Codex taslağı)
**Yöntem:** Taslağın SQL'i canlı DB'de yeniden çalıştırıldı; ardından sitenin kendi yayın süzgeçleriyle
yeniden hesaplandı. 11 dış kaynağın her biri ayrı ayrı açıldı (TÜİK ve EİB sayfaları tarayıcı dışında
içerik vermediği için basın/Bakanlık aynası ve ham HTML ile çapraz kontrol yapıldı; TBMM PDF'i OCR ile okundu).

## Karar

**Taslak bu haliyle yayınlanamaz; düzeltilmiş haliyle yayınlanabilir.** Dış kaynak iddialarının çoğu
doğru (11'de 8 tam, 3 yanlış rakam). Asıl sorun iç veride: taslağın 19.901 kayıtlık tabanı, sitenin
kendisinin güvenilmez sayıp yayından çıkardığı verileri içeriyor ve manşetteki yıllık kıyas (−%31,6)
bunun ürettiği bir artefakt. Düzeltmeler taslağa uygulandı; aşağıda her biri gerekçesiyle var.

---

## A. İç veri (HaldeFiyat DB)

### A1. Taslağın tabanının %38'i sitenin blackout'a aldığı dönemlerden geliyor

| Süzgeç | Satır | Taban içindeki pay |
|---|---:|---:|
| Taslağın tabanı (1–1.000 TL/kg, kg, 2024-01-01…2026-09-12) | 19.901 | %100 |
| `hf_market_blackouts` içinde (Bursa 3.368, Denizli 2.535, Eskişehir 1.680, Kütahya 36) | 7.619 | **%38,3** |
| min–maks makası > 3× (türetilmiş "ortalama" çöp) | 4.935 | **%24,8** |
| hal.gov.tr ulusal toplamı (şehir haliyle karıştırılmış) | 1.449 | %7,3 |
| **Temiz taban** (blackout hariç, makas ≤ 3, şehir halleri) | **9.247** | %46,5 |

Bursa/Denizli/Eskişehir'in 2024-01-01…2026-04 arası dönemi hafızadaki "2025'te şişik üç hal" bulgusuyla
aynı: site bu dönemi zaten yayından çıkarmış (`hf_market_blackouts` id 3 vb.). Taslağın SQL'i bu tabloyu
hiç okumuyor.

### A2. Üç yıl boyunca her gün aynı fiyatı yazan donmuş seri manşete girmiş

`bursa-hal` × `uzum` × `bursa_resmi`: **1.076 satır, 2023-04-21 → 2026-04-21, tek fiyat: 152,50 TL/kg**.
Taslağın çekirdeksiz tablosunda `uzum` master'ının 2023/2024/2025 Temmuz–Eylül medyanları da bu yüzden
"152,50 · 1 hal · 31 gözlem". Ve taslağın manşet rakamı "Nisan 2026 medyanı 152,50" tam bu değere denk
geliyor. Blackout id 3 tam bu seriyi kapsıyor; süzgeç uygulanınca kendiliğinden düşüyor.

### A3. Yıllık kıyas −%31,6 değil; eşleşmiş çiftlerde ≈ −%20

| Yöntem | Eyl 2024 | Eyl 2025 | Eyl 2026 | 2026/2025 |
|---|---:|---:|---:|---:|
| Taslak (ham taban, tam ay medyanı) | 45,00 | 65,00 | 44,48 | **−%31,6** |
| Blackout hariç | 32,00 | 42,94 | 45,00 | +%4,8 |
| Blackout hariç + makas ≤ 3 | 35,00 | 50,00 | 47,50 | −%5,0 |
| **Eşleşmiş hal×ürün çiftleri, 1–12 Eylül her iki yılda (9 çift)** | — | — | — | **−%18,4 basit / −%20,0 ağırlıklı** |

Eşleşmiş çiftler: Ankara beyaz −35, çekirdeksiz −23, kardinal −24, siyah −45; İzmir beyaz −11, siyah −14;
Konya çekirdeksiz **+12,5**, muhtelif −9, siyah −17. Yani düşüş var ama bölgeye göre ayrışıyor; Konya'da
çekirdeksiz yükselmiş. "2024'e neredeyse eşit" iddiası da desteklenmiyor: 2024'te temiz veri veren hal
sayısı kıyas için yetersiz.

Taslağın çekirdeksiz-özel "−%23,8 / −%33,3" iddiası temiz süzgeçte **40,00 vs 39,75 (≈0)** çıkıyor — ama
2025'te 4, 2026'da 12 hal olduğu için o eşitlik de sepet kıyası değil. Doğru ifade hal bazlı: Ankara −23,
Konya +12.

### A4. Düzeltilmiş aylık tablo (temiz taban, şehir halleri)

| Ay | 2024 | 2025 | 2026 | n 2026 |
|---|---:|---:|---:|---:|
| Nisan | 140,00 | 150,00 | 235,00 | 284 |
| Mayıs | 75,00 | 150,00 | 200,00 | 479 |
| Haziran | 45,00 | 90,00 | 150,00 | 737 |
| Temmuz | 35,00 | 75,00 | 85,00 | 959 |
| Ağustos | 37,50 | 50,00 | 52,50 | 1.025 |
| Eylül (1–12) | 35,00 | 50,00 | 47,50 | 395 |

Nisan→Eylül 2026: **−%79,8** (taslak: −%70,8). Yön aynı, sebep aynı (ilkbahar = ithal/depo, sonbahar =
yerli hasat); rakamlar farklı. 2024–2025 sütunları ince (n 82–282), yıl kıyası için kullanılmamalı.

Çekirdeksiz (temiz): Tem/Ağu/Eyl — 2024: 32,5/32/27,5 (2 hal) · 2025: 70/40/39,75 (3–4 hal) ·
2026: 95/50/40 (10–12 hal). Taslaktaki 60/60/60 · 67,5/60/52,5 · 90/50/40 satırları blackout'lu halleri içeriyordu.

12 Eylül tablosu (çeşit × hal) **doğru** — satır satır birebir tuttu.

---

## B. Dış kaynaklar — iddia bazında

| # | İddia | Sonuç | Not |
|---|---|---|---|
| 1 | TÜİK 2026 1. tahmin: üzüm **+%53**, 21 Mayıs 2026 | ✓ | 3.849 bin ton; basın 21.05.2026 tarihli, tarih doğru. Bakanlık aynasındaki 3 Haziran yeniden yayım tarihidir. TÜİK sayfası JS, basın+Bakanlık ile teyit |
| 2 | TÜİK 2025 2. tahmin: **−%24,5** | ✓ | 3.468 → 2.620 bin ton (tahmin). **Gerçekleşen 2025: 2.515.152 ton** (Bakanlık/TBMM) — taslakta yoktu, eklendi. +%53 bu tabana göre (2.515×1,53 = 3.849 ✓) |
| 3 | Sigorta: kurutmalık 9,78 mlr TL %35,5; sofralık 2,61 mlr %9,5 | ✓ | Tam yıl 2025 (toplam bitkisel ödeme 27,72 mlr TL) |
| 3 | Don payı **%79,7** | ✗ | %79,7 = **II. dönem** (Tem–Ara). Tam yıl **%80,4**. Düzeltildi |
| 4 | Manisa kuru üzümün %85'i; 4 kg yaş → 1 kg kuru | ✓ | Kaynak aynen; ek: sofralığın %20'si, geç hasatta 5–6 kg |
| 5 | TBMM: Manisa 592.106 ton yaş, 148.027 ton kuru | ✓ | OCR ile okundu. Ek: TMO 2025 alım fiyatı 9 numara **120 TL/kg**, 05.11.2025'e kadar 7.529 ton alım; Manisa 2024 yaş üzüm 1.139.027 ton |
| 6 | EİB 2024/25: 153.593 ton, 546,5 M$, 25 yılın en düşüğü | ✓ | Basın (Ekonomim, Malatya Cadde) ile teyit. Ek: birim fiyat **+%51**, 2023/24 207 bin ton / 489 M$. **Dipnot URL'si boş JS kabuğu** (ham HTML'de rakam yok) — dipnota çalışan link eklendi |
| 7 | Manisa TB 27 Ağu 2026: 210 bin ton tescil; 140 bin ton / 455 M$ (22 Ağu) | ✓ | Birebir. Ek: sezon açılışı sembolik mezat 4.000 TL |
| 8 | TARİŞ 10 Eyl 2026: **80 TL/kg** avans, kalite farkı gözetmeksizin | ✓ | **Aynı haberde 2025 fiyatı 120 TL/kg (9 numara)** → −%33. Taslak bunu atlamış; eklendi — hal verisinden daha temiz bir yıllık sinyal |
| 9 | USDA: dünya sofralık üzüm 27,9 → **28,87 M ton** (üretim); 10 yıllık CAGR ~%2 | ✗ | 27,842 / 28,886 **tüketim** satırı. Üretim: 2023/24 **28,32** → 2024/25 **29,44** → 2025/26 tahmini **29,99** M ton (Aralık 2025 sirküleri). CAGR kaynaksız; 6 yıllık veri %3,3 verir. Ek: **Türkiye 1.945 → 1.490 bin ton (−%23)** — TÜİK ile tutarlı. Düzeltildi |
| 10 | USDA AB: 1,52 M ton; İtalya 850 bin +%16; İspanya −%12; çekirdeksiz tercihi; enerji/lojistik/işçilik | ✓ | Tablo 10 birebir (1.519.600; İspanya 320 bin; Yunanistan 240 bin +%14). USDA'nın metni "+%8", tablosu "+%14" — kendi iç tutarsızlığı |
| 11 | EİB konferans: dünya **1,086 M ton**, ihracat 486.802, Türkiye 165 bin | ✗ | Dünya üretimi **1,079 M ton** (2025, −%7, önceki 1,157). 1,086 muhtemelen 2015 konferansındaki "1 milyon 85 bin" ile karışmış. Ek: Türkiye ihracatı 145 bin ton (%30). 18–21 Kasım 2025, Güney Afrika. Düzeltildi |
| 12 | TÜİK 2. tahmin **23 Ekim 2026** | ✗ | UVYT + Bakanlık aynası: **27 Ekim 2026**. Düzeltildi |
| — | Aritmetik (3,56 $/kg, 3,25 $/kg, −%70,8, −%31,6, −%23,8) | ✓ | Hepsi kendi girdilerine göre doğru; girdiler değişince −%70,8 → −%79,8, −%31,6 → ≈−%20 |

Bir tutarsızlık daha: taslak "ilk tahmin gerçekleşirse üretim 2024 seviyesine **yaklaşabilir**" diyor;
3,85 M ton, 2024'ün 3,47 M tonunu **%11 aşar**. Düzeltildi.

---

## C. Taslakta olmayan ama kanıtlı ve güçlü veriler (eklendi)

- **TARİŞ avans fiyatı 120 → 80 TL/kg (−%33)** ve TMO 2025 alım fiyatı 120 TL/kg: tezi (bol arz →
  gevşeyen fiyat) hal verisinden daha temiz destekliyor.
- **2025 gerçekleşen yaş üzüm üretimi 2.515.152 ton** (−%27,5 vs 2024): TÜİK tahminini (2.620) aşağı revize eder.
- **USDA Türkiye sofralık üzüm −%23 (2025/26)**: bağımsız kaynaktan aynı don etkisi.
- **EİB 2024/25 birim fiyat +%51**: "kıtlık birim değeri yükseltti" cümlesinin sayısal kanıtı.

---

## D. Uygulanan değişiklikler

**Taslak (`…-taslak.md`)** — git'te takipli, fark `git diff` ile görülür:
Kısa sonuç (taban 9.247, Nisan 235, Eylül 47,50, YoY ≈−%20 eşleşmiş çift), aylık tablo, −%79,8, çekirdeksiz
tablo ve yorumu, don %80,4, 2025 gerçekleşme 2.515.152 ton + 2024'ü aşma düzeltmesi, EİB +%51 bağlamı,
TARİŞ 120→80 ve TMO alımı, USDA üretim/Türkiye satırları, konferans 1,079, TÜİK 27 Ekim, dipnot 1'e Bakanlık aynası,
dipnot 6/9/11 linkleri, yöntem bölümüne süzgeç açıklaması.

**SQL (`…-veri-sorgulari.sql`)**: blackout, makas ≤ 3 ve şehir-hali süzgeçleri eklendi; eşleşmiş çift
sorgusu eklendi. Artık sitenin yayın metodolojisiyle aynı sonuçları üretir.

## E. Hâlâ dikkat

- EİB'in iki dipnot sayfası tarayıcı dışında içerik vermiyor; rakamlar basınla teyitli. Yayında EİB'i
  kaynak göstermek doğru, ama linkin okuyucuda boş sayfa açma riski var.
- USDA AB raporu metin/tablo tutarsız (+%8 / +%14); tablo değerleri kullanıldı.
- Eşleşmiş çift sayısı 9 — küçük örnek. Metinde "yaklaşık %20" denmeli, virgüllü kesinlik verilmemeli.
- Hal verisi `avg_price`'ın %79'u min–maks orta noktası (sentetik). Makas süzgeci en kötüleri atıyor,
  sorunu çözmüyor; "medyan" ifadesi bu yüzden yerinde.
