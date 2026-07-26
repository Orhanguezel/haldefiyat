# HalDeFiyat Public API Examples

Base URL: `https://haldefiyat.com/api/v1`

Bu dizin yalnız kimlik doğrulama istemeyen, kamuya açık ve dokümante edilen
endpoint'leri örnekler. Üretim verisini indirirken kaynak adı, veri tarihi,
birim ve `qualityFlags` alanlarını koruyun.

## Hızlı başlangıç

Node.js 20+:

```bash
node examples/haldefiyat-api/client.mjs domates
```

Notebook:

`haldefiyat-analysis.ipynb` dosyasını Jupyter/Colab'da açın. Notebook yalnız
Python standart kütüphanesini kullanır.

## Sözleşme ve araçlar

- Public OpenAPI: `openapi-public.yaml`
- Postman: `HalDeFiyat-Public-API.postman_collection.json`
- Sürüm politikası: `VERSIONING.md`
- Değişiklik kaydı: `CHANGELOG.md`

API yanıtları kaynakların yayın takvimine bağlıdır. `latestRecordedDate`,
`recordedDate`, `isStale` ve `qualityFlags` kontrol edilmeden “bugünün fiyatı”
olarak sunulmamalıdır.
