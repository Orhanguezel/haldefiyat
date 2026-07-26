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

27 Temmuz ilk tekrar sorgusu günlük proje kotasına takıldı. Kota yenilendikten
sonra aynı mobil URL seti yeniden sorgulandı:

| URL | Google field-data kimliği | LCP p75 | INP p75 | CLS p75 | Değerlendirme |
|---|---|---:|---:|---:|---|
| `https://haldefiyat.com/` | `https://haldefiyat.com` | 3.080 ms | 170 ms | 0 | Origin fallback; URL paydasına alınmadı |
| `https://haldefiyat.com/fiyatlar` | Aynı URL | 2.829 ms | Veri yok | 0,02 | URL-level var; üç CWV metriği tamamlanmadığı için paydadan çıkarıldı |
| `https://haldefiyat.com/hal/antalya-hal-serik` | `https://haldefiyat.com` | 3.080 ms | 170 ms | 0 | Origin fallback; URL paydasına alınmadı |
| `https://haldefiyat.com/urun/limon` | Aynı URL | 2.652 ms | 117 ms | 0 | URL-level tam; LCP nedeniyle CWV-good değil |

Google'ın `loadingExperience.id` alanı istenen URL ile aynı değilse sonuç origin
fallback olarak değerlendirildi. Üç temel metriği de bulunan bağımsız URL
örnekleminde CWV-good baseline **0/1 (%0)**. Örneklem küçüktür; site geneline
genellenmez ve veri yokluğu başarı sayılmaz.

## Tekrar ölçüm ve hedef

- GSC: her pazartesi, son tamamlanmış 28 gün.
- CrUX origin/URL: aylık; aynı URL seti ve aynı fallback/payda kuralı.
- Origin LCP hedefi: p75 **≤2.500 ms**.
- INP hedefi: p75 **≤200 ms**; mevcut iyi durum korunmalı.
- CLS hedefi: p75 **≤0,1**; mevcut iyi durum korunmalı.
- GSC baseline karşılaştırmasında tıklama/gösterim kadar CTR ve ortalama konum
  birlikte izlenmeli.

## Ölçüm sınırı

Ortak `getGscDateRange("LAST_28_DAYS")` yardımcısındaki bir gün fazla aralık
hatası `cef6149` shared paket commit'iyle kapatıldı. Bu raporun ilk GSC
baseline'ı zaten API'ye doğrudan 27 Haziran–24 Temmuz verilerek tam 28 günlük
oluşturulmuştu; tarih düzeltmesi sayıları geriye dönük değiştirmedi.
