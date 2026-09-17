# HaldeFiyat trafik analizi — 14 Eylül 2026

31 Ağustos–13 Eylül devam raporunun salt okunur kanıtları.

- `google.json`: GSC final/taze verisi, dönem/sayfa/sorgu/cihaz/ülke, GA4 host filtreli yanıtlar.
- `google-extra.json`: beş URL Inspection ve GTM canlı sürüm özeti.
- `logs.json`: UTC log günlük toplamları; IP/ham kullanıcı kayıtları içermez. Bir bozuk HTTP satırı dışlandı.
- `db.json`: canlı DB toplu iş/ETL ölçümleri. Sorgular `collect-db.ts` içinde.
- `live.json`: URL durum, canonical, robots ve HTTP indirme ölçümleri.
- `psi.json`: kota engeli; geçerli yeni hız skoru yok.
- `analysis.json`, CSV dosyaları: hesaplar ve karşılaştırmalar.
- `analyze.py`, `build-report.py`: hesap ve belge üretimi. `build-report.py` mevcut raporun tasarımını kullanır.
- `validation.json`: aritmetik, PDF metin ve sayfa kontrolü.

GSC toplamı property düzeyindedir. Sayfa toplamları byPage semantiği nedeniyle birebir aynı değildir; sorgu boyutu gizlenen sorguları içermez. Pozisyonlar gösterim ağırlıklıdır. Ana karşılaştırmada kısmi 13 Eylül verisi yoktur. GA4 İstanbul, GSC Los Angeles, log/DB UTC tarih sınırları kullanılır. Metrikler toplanmaz.

PDF ve HTML `reports/analiz-31-agustos-13-eylul-2026.*` dosyalarındadır. Önceki rapor korunmuştur.
