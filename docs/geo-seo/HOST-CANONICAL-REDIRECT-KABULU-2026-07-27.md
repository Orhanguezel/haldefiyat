# HalDeFiyat Host Canonical Redirect Kabulü — 27.07.2026

## Sorun

`haldefiyat.com.tr`, ana `.com` alan adıyla aynı sunucu ve içerikten HTTPS 200
döndürüyordu. Canonical etiketi `.com` olsa da alternatif host arama
sonuçlarında ayrı URL olarak görünebiliyordu.

## Uygulama

- TLS sertifikasının şu dört hostu kapsadığı doğrulandı:
  `haldefiyat.com`, `www.haldefiyat.com`, `haldefiyat.com.tr`,
  `www.haldefiyat.com.tr`.
- Ana uygulama TLS bloğu yalnız `haldefiyat.com` için bırakıldı.
- `haldefiyat.com.tr` ayrı TLS bloğunda path ve query korunarak
  `https://haldefiyat.com$request_uri` hedefine 301 yapıldı.
- Tüm HTTP hostları doğrudan aynı canonical HTTPS hedefe yönlendirildi.
- `www` varyantlarının mevcut canonical yönlendirmesi korundu.

Aktif ve available Nginx dosyaları eşitlendi. Yedekler:

- `/etc/nginx/sites-available/haldefiyat.bak-20260726T234609Z`
- `/etc/nginx/sites-available/haldefiyat.enabled.bak-20260726T234638Z`

## Canlı kabul

| İstek | Sonuç |
|---|---|
| `http://haldefiyat.com.tr/a?b=1` | `301 https://haldefiyat.com/a?b=1` |
| `https://haldefiyat.com.tr/a?b=1` | `301 https://haldefiyat.com/a?b=1` |
| `https://www.haldefiyat.com.tr/a?b=1` | `301 https://haldefiyat.com/a?b=1` |
| `https://www.haldefiyat.com/a?b=1` | `301 https://haldefiyat.com/a?b=1` |
| `https://haldefiyat.com/` | `200` |

`nginx -t` başarılı, servis active. HalDeFiyat dosyasına ait yeni protocol
uyarısı bırakılmadı. Sunucudaki başka sitelere ait önceden var olan
BereketFide/VistaSeeds server-name uyarıları bu değişikliğin dışında tutuldu.
