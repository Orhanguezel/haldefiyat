# HalDeFiyat DKIM Selector ve Alignment Kabulü — 2026-07-27

## Yöntem

Canlı backend'in kullandığı Resend SMTP yapılandırmasıyla, gerçek kişi olmayan
ve alınan mesajları birkaç saat içinde silen bağımsız DKIMValidator test
alıcısına tek bir teknik doğrulama iletisi gönderildi.

## Alıcı kanıtı

| Alan | Sonuç |
|---|---|
| Görünür From | `HaldeFiyat <noreply@haldefiyat.com>` |
| DKIM signing domain | `d=haldefiyat.com` |
| Selector | `s=resend` |
| Algoritma | `rsa-sha256` |
| DNS sorgusu | `resend._domainkey.haldefiyat.com` |
| Public key | Yetkili DNS'ten bulundu |
| Kriptografik doğrulama | `result = pass` |
| DKIM alignment | Exact: From ve signing domain `haldefiyat.com` |

Mesaj ayrıca Amazon SES'in kendi `d=amazonses.com` imzasını taşıyor; DMARC
alignment kabulü HalDeFiyat'a ait birincil `d=haldefiyat.com` imzasına dayanır.
Tam imza gövdesi ve geçici test alıcı adresi kalıcı dokümana yazılmadı.

## SPF ölçüm sınırı

Validator'ın inbound Mandrill aktarımı Return-Path başlığını özgün biçimde
göstermedi. SPF aracı bu nedenle görünür From adresini envelope sender kabul
ederek kök `haldefiyat.com` için `none` üretti. Bu, daha önce DNS'te doğrulanan
`send.haldefiyat.com` Return-Path SPF/MX modelinin gerçek envelope kabulü
değildir ve SPF pass/fail kararı olarak kullanılmadı.

## Durum

“DKIM selector ve alignment'ı gerçek test e-postasıyla doğrula” maddesi
**kapalıdır**. DMARC `rua` mailbox, yedi günlük aggregate rapor gözlemi ve
sonraki politika sıkılaştırması ayrı açık madde olarak kalır.

GEO/SEO sayacı: **62/66 tamamlandı, 4/66 açık**.
