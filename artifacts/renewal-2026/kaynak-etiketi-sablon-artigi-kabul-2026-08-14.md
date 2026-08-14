# Kaynak etiketi ve şablon artığı kabulü — 14 Ağustos 2026

## Kapsam

- Public fiyat tablolarında ve kartlarında teknik `sourceApi` anahtarlarının gösterilmemesi.
- Veri Sağlığı sayfasında teknik adaptör anahtarı yerine kaynak türünün gösterilmesi.
- Katalogda tek tek tanımlanmamış ETL kaynaklarında market adı ve yapılandırılmış resmî alan adının fallback olarak kullanılması.
- Yıllık üretim API'sinde kaynak adı ve resmî dosya URL'sinin yayınlanması.
- Perakende karşılaştırmasındaki `tarim_kredi` anahtarının güncel public marka adıyla gösterilmesi.
- Kritik mobil rotalarda tarih/şablon/ham anahtar sızıntısı taraması.

## Uygulama

- Kod commitleri: `9263d154`, `4cb8504a`.
- Canlı frontend release: `.next-release-4cb8504a`.
- Backend kaynak fallback'i `sourceInfoFor` içinde market metadata'sına ve ETL `baseUrl` yapılandırmasına bağlandı.
- Frontend gösterimi `sourceDisplayName`, `sourceCompactLabel` ve `sourceTypeLabel` yardımcılarında fail-closed hale getirildi.
- Üretim API'sine `sourceName` ve `sourceUrl` alanları eklendi.
- KOOP Market public etiketi ve `tkkoop.com.tr` kaynak alan adı kataloğa eklendi.

## Otomatik doğrulama

- Frontend unit: 26 dosya / 76 test geçti.
- Backend unit/integration: test sırlarıyla 25 dosya / 111 test geçti.
- Yeni hedefli testler: frontend 4/4, backend 2/2.
- Frontend ESLint `--quiet`: hata yok.
- Frontend ve backend TypeScript `--noEmit`: geçti.
- Frontend izole production build ve standalone asset senkronizasyonu: geçti.
- Backend production build: geçti.

## Canlı API kabulü

- `GET /api/v1/sources/status`: HTTP 200; Bursa, Gaziantep, Antalya ve TOBB dahil eksik katalog kaynakları public ad ve resmî domain ile dönüyor.
- `GET /api/v1/production?limit=3`: HTTP 200; `sourceName=İBB Açık Veri — Su Ürünleri Yetiştiriciliği` ve resmî XLSX `sourceUrl` alanları mevcut.
- Local/origin/VPS HEAD: `4cb8504a`.

## Mobil tarayıcı kabulü — 390 × 844

Playwright ile aşağıdaki rotalar tarandı:

| Rota | H1 | Invalid Date / undefined / NaN / Lorem / object | Ham snake_case anahtar | Yatay taşma |
|---|---:|---:|---:|---:|
| `/fiyatlar` | 1 | 0 | 0 | 0 |
| `/canli-hal-fiyatlari` | 1 | 0 | 0 | 0 |
| `/urun/domates` | 1 | 0 | 0 | 0 |
| `/hal/izmir-hal` | 1 | 0 | 0 | 0 |
| `/analiz` | 1 | 0 | 0 | 0 |
| `/ilanlar` | 1 | 0 | 0 | 0 |
| `/harita` | 1 | 0 | 0 | 0 |
| `/data-health` | 1 | 0 | 0 | 0 |

- Sekiz rota toplamında tarayıcı konsolu: 0 hata, 0 uyarı.
- `/urun/domates` üzerinde `KOOP Market` görünür, `tarim_kredi` görünmez.
- `/data-health` 390 px'te ham anahtar ve yatay taşma üretmiyor.

## Sonuç

F1.36, F1.37 ve G1.3 kabul kriterleri canlı kanıtla tamamlandı.
