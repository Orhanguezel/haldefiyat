# HalDeFiyat Trafik Analizi — 1–8 Haziran 2026 (8 gün)

> Kaynak: VPS `/var/log/nginx/haldefiyat.access.log*`. Üretim: 2026-06-09 (VPS UTC).
> Not: 8 Haziran ~22 saatlik kısmi gün; yine de en yüksek gün.

## Özet
| Metrik | Değer |
|---|---|
| Toplam istek | **221,431** |
| İnsan trafik (istek*) | **204,556** (~25,570/gün) |
| Bot/Crawler | 16,875 |
| Mobil / Masaüstü | **%70 / %30** |
| Mobil oranı (1→8 Haz) | %63 → **%77** |
| gclid (Ads tıklama) | 2,566 istek / 949 uniq IP |
| ★ Gerçek JS pageview | **3,402 (~425/gün)** |

\* İstek sayısı, ziyaretçi değil. Gerçek engaged insan ≈ **425 pageview/gün**.

## Ay-içi karşılaştırma (1-4 Haz vs 5-8 Haz)
| Metrik | 1-4 Haz | 5-8 Haz | Değişim |
|---|---|---|---|
| Günlük insan istek | 24,600 | 26,539 | **+%8** |
| Mobil oran | %65 | %75 | **+10 puan** |
| Gerçek pageview/gün | 370 | 480 | **+%30** |

## Günlük
| Tarih | İnsan | Bot | Toplam | Uniq IP | Mobil% |
|---|---|---|---|---|---|
| 1 Haz | 25,657 | 4,153 | 29,810 | 402 | %63 |
| 2 Haz | 22,372 | 1,474 | 23,846 | 284 | %64 |
| 3 Haz | 19,192 | 1,660 | 20,852 | 300 | %63 |
| 4 Haz | 31,179 | 1,869 | 33,048 | 431 | %67 |
| 5 Haz | 25,241 | 1,236 | 26,477 | 400 | %68 |
| 6 Haz | 23,812 | 1,990 | 25,802 | 317 | %76 |
| 7 Haz | 24,583 | 2,295 | 26,878 | 439 | %78 |
| 8 Haz* | 32,520 | 2,198 | 34,718 | 467 | %77 |
| **TOPLAM** | **204,556** | **16,875** | **221,431** | — | **%70** |

## Bulgular
- **Sağlıklı + büyüyor:** 2. yarı +%8 trafik, gerçek pageview +%30.
- **Mobil kayması hızlandı:** %63 → %77 (Ads mobil tüketici ağırlıklı, organik değil).
- **Gerçek pageview ~425/gün** — "25 bin insan/gün" istek hacmidir, kişi değil (track beacon honesty).
- **Backend stabil** (5xx ihmal edilebilir), AI crawler yoğun (GPTBot/ClaudeBot → GEO).
- **Borsa dikeyi canlı** (bu dönem eklendi): /borsa + /urun/bugday vb. fiyatlı.

## Aksiyon
- gclid hâlâ `/` ana sayfaya düşüyor → `/fiyatlar` veya `/canli-hal-fiyatlari` (bounce↓, newsletter CTA).
- **Newsletter ~boş** — funnel'ın son halkası, öncelik (abone yoksa retention yok).
- Mobil %77 → mobil deneyim/PWA önceliği (MOBIL-WEB-PWA-CHECKLIST).
