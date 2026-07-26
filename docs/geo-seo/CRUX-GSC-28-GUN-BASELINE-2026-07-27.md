# HalDeFiyat CrUX ve GSC 28 Günlük Baseline — 2026-07-27

## GSC Web arama

- Property: `sc-domain:haldefiyat.com`
- Tarih aralığı: **27 Haziran–24 Temmuz 2026**
- Veri günü: **28/28**
- Kaynak: Google Search Console Search Analytics API

| Metrik | Baseline |
|---|---:|
| Tıklama | 9.744 |
| Gösterim | 289.062 |
| CTR | %3,371 |
| Ortalama konum | 6,326 |

Sorgu canlı OAuth ile kesin başlangıç/bitiş tarihleri verilerek çalıştırıldı.
GSC'nin yaklaşık iki günlük veri gecikmesi nedeniyle 25 Temmuz yerine son tam
veri günü olan 24 Temmuz kullanıldı.

## CrUX origin alan verisi

26 Temmuz 2026 tarihli PSI/CrUX kanıtından:

| Metrik | Origin p75 | Sınıf |
|---|---:|---|
| LCP | 3.080 ms | AVERAGE / iyileştirilmeli |
| FCP | 2.420 ms | AVERAGE / iyileştirilmeli |
| INP | 170 ms | FAST / iyi |
| CLS | 0 | FAST / iyi |

Kaynak: `docs/codex-briefs/geo-seo-implementation.md`, “GÖREV 3 girdisi —
LCP teşhisi (PSI mobil + CrUX, 2026-07-26)”.

Bu değerler gerçek kullanıcı alan verisidir; Lighthouse laboratuvar sonucu
değildir. Ana iyileştirme alanı origin LCP'dir. INP ve CLS korunmalıdır.

## CrUX URL-level alan verisi

| URL | Durum |
|---|---|
| `https://haldefiyat.com/` | Ayrı URL-level CrUX kaydı mevcut kanıtta tutulmamış |
| `https://haldefiyat.com/fiyatlar` | Yetersiz/erişilemeyen alan verisi |
| `https://haldefiyat.com/hal/antalya-hal-serik` | Yetersiz/erişilemeyen alan verisi |
| `https://haldefiyat.com/urun/limon` | Yetersiz/erişilemeyen alan verisi |

27 Temmuz tekrar sorgusunda PageSpeed Insights API günlük proje kotası dolu
olduğu için origin/URL ayrımı yeniden indirilemedi. URL-level veri yokluğu
performansın iyi veya kötü olduğu anlamına gelmez; lab Lighthouse değerleri bu
hücrelere yazılmadı.

## Tekrar ölçüm ve hedef

- GSC: her pazartesi, son tamamlanmış 28 gün.
- CrUX origin/URL: aylık; API kotası yenilendiğinde aynı URL seti.
- Origin LCP hedefi: p75 **≤2.500 ms**.
- INP hedefi: p75 **≤200 ms**; mevcut iyi durum korunmalı.
- CLS hedefi: p75 **≤0,1**; mevcut iyi durum korunmalı.
- GSC baseline karşılaştırmasında tıklama/gösterim kadar CTR ve ortalama konum
  birlikte izlenmeli.

## Ölçüm sınırı

Ortak `getGscDateRange("LAST_28_DAYS")` yardımcısı başlangıcı bitişten 28 gün
geri aldığı için kapsayıcı tarih aralığında 29 takvim günü üretiyor. Bu rapor o
etiketi kullanmadı; API'ye doğrudan 27 Haziran–24 Temmuz verilerek 28 günlük
baseline oluşturuldu.

