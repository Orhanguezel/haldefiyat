# AGENTS.md - Hal Fiyatlari

## Sosyal medya sahipligi (2026-09-12)

HaldeFiyat icin Facebook, Instagram, X ve diger sosyal medya icerik uretimi,
taslak/kuyruk yonetimi ve yayinlama yalniz `ekosistem-sosyal-medya` icindeki
`haldefiyat` tenantina aittir. Bu repoda sosyal taslak/yayin cron'u veya ikinci
bir publisher acilmaz. Telegram operasyon bildirimleri, fiyat alarmlari ve site
icerigi bu sinirin disindadir.

Telegram ve WhatsApp Kanal bildirimlerinde fiyat/rapor olayini bu repo uretir;
bot anahtari, yonetici sohbeti, Telegram kanal hedefi, kanal ac/kapa kapisi ve
WhatsApp Kanal taslak koprusu `ekosistem-sosyal-medya` icindeki `haldefiyat`
tenant ayarlarindan yonetilir. Gunluk Telegram kanal raporu ve WhatsApp taslagi
`modules/tanitio-notifications/client.ts` ile Tanitio bildirim gecidine gider.
Bu iki akis icin burada ikinci bir hedef/transport kurulmaz. HaldeFiyat'in gelen
Telegram bot komutlari site-domain islevi olarak bu repoda kalir.

## Aktif Codex Brief'leri (2026-05-28)

> **Madde 11 — Ads Optimizasyon (Claude tasarladi, Codex implement edecek):**
> [`docs/codex-briefs/M11-readme.md`](./docs/codex-briefs/M11-readme.md)
>
> 6 brief, paralel grup A (engelli bagimliligi olmayan): M11.1 audit fix,
> M11.2 conversion events, M11.8 remarketing tag. Sonra grup B: M11.3 attribution,
> M11.4 landing page, M11.5 admin dashboard. Hepsi acceptance kriterli, dosya
> yollari + ornek kod ile birlikte spec edilmis.

## Canli Erisim Notu

Canli servis `vps-vistainsaat` sunucusundadir. SSH erisimi key ile yapilir: `ssh vps-vistainsaat`.

## Pamuk fiyat analizi

Pamuk geçmişi ve fiyat karşılaştırmalarında resmî borsa serisi esas alınır;
haber aktarımı sayısal kanıtın yerine geçmez. Veri, kalite ve yayın kuralları:
[`backend/scripts/cotton-series/README.md`](./backend/scripts/cotton-series/README.md).
