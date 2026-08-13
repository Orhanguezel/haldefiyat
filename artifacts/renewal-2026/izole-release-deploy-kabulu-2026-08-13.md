# İzole Release Deploy Kabulü — 13 Ağustos 2026

## Kök neden

Çalışan Next ISR süreci `.next/.../cache/fetch-cache` içine yazarken aynı dizinde
`next build` çalıştırılıyordu. Temizlik ile runtime yazımı yarışınca build üç ayrı turda
`ENOTEMPTY` verdi. Tekrar deneme çoğunlukla geçse de bu deterministik ve güvenli değildi.

## Uygulanan çözüm

- `next.config.ts`, kontrollü `NEXT_DIST_DIR` desteği aldı.
- Deploy release dizini: `.next-release-<git-sha>`.
- Static/public sync ve standalone symlink release dizinini kullanıyor.
- Build çıktısı pipe edilmiyor; `/tmp/hal-frontend-build-<sha>.log` dosyasına yazılıyor.
- `git pull --ff-only` deploy scriptine sabitlendi.
- Başarılı build tamamlanmadan aktif standalone symlink değiştirilmez.

## VPS kabulü

- Release: `.next-release-21e17c1e`
- İzole build ilk denemede `EXIT=0`.
- Release içi `server.js` ve release içi static dizini doğrulandı.
- Restart sonrası `/`, `/urun/domates`, `/hal/nevsehir-ticaret-borsasi`, `/ilanlar`: HTTP 200.
- Eski çalışan `.next` cache’i build sırasında değiştirilmedi; `ENOTEMPTY` oluşmadı.

## Açık operasyon borcu

Tek-instance `pm2 restart` sırasında nginx erişim logunda 20:14:04–20:14:06 UTC
arasında yaklaşık iki saniyelik 502 penceresi görüldü. İzole release bozuk build ve eski
chunk riskini kapatır, fakat tek process restart kesintisini tek başına kapatmaz. Gerçek
sıfır kesinti için immutable release ile uyumlu cluster rolling reload veya blue/green
iki port + nginx upstream switch tasarlanıp ayrı kabul edilmelidir.
