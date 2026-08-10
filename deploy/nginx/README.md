# deploy/nginx

VPS'teki nginx konfigurasyonunun **git'te izlenen kopyasi**. Bu dosyalar deploy
sirasinda otomatik uygulanmaz — VPS'teki gercek yol ile birebir ayni tutulur ki
konfig degisikligi izlenebilir olsun.

| Repo dosyasi | VPS yolu |
|---|---|
| `haldefiyat-csp.conf` | `/etc/nginx/snippets/haldefiyat-csp.conf` |

## Degisiklik akisi

1. Repo'daki dosyayi duzenle, commit et.
2. VPS'te ayni icerigi `/etc/nginx/snippets/...` altina yaz.
3. `nginx -t` → `nginx -s reload`.
4. Dogrula: `curl -sI https://haldefiyat.com/ | grep -i content-security-policy`

## Kurallar

- Yedek dosyalari **asla** `sites-enabled/` icine birakma — orasi `include
  sites-enabled/*` ile toptan yuklenir, `.bak` dosyasi ikinci bir server blogu
  olarak devreye girer. Yedekler `/etc/nginx/backups/` altina.
- CSP ihlalleri `report-uri /api/v1/csp-reports` ile backend'e dusuyor ve pm2
  log'una `event: csp_violation` olarak yaziliyor. Yeni bir 3. parti script
  eklendiginde once raporlara bak:

```bash
ssh vps-vistainsaat "grep csp_violation /root/.pm2/logs/hal-backend-out.log" \
  | grep -o '"blockedUri":"[^"]*"' | sort | uniq -c | sort -rn | head
```

## Bilinen kararlar

- **`https://*.doubleclick.net` script-src'de zorunlu.** Google Ads conversion
  tag'i (`AW-18007572524`) `googleads.g.doubleclick.net/pagead/viewthroughconversion/`
  uzerinden script yukluyor. Eksik oldugunda conversion + remarketing beacon'i
  sessizce bloklanir (2026-07-26 → 2026-08-10 arasi 1331 ihlal boyle olustu).
- **Google ccTLD'leri connect-src'de listelenir.** `/ads/ga-audiences` remarketing
  ping'i ziyaretcinin ulkesine gore `google.com.tr`, `google.de`, `google.az` gibi
  farkli domainlere gider; `*.google.com` bunlari kapsamaz ve CSP'de TLD joker
  karakteri yoktur, bu yuzden liste elle tutulur.
