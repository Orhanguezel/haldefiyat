# Tema Rollout ve KPI Kapısı

**Karar tarihi:** 14 Ağustos 2026  
**Tema:** Temiz Veri; Pazar Defteri yalnız editoryal ikincil yüzey

## Cohort sözleşmesi

Tema rollout'u `control`, `clean_data_10`, `clean_data_50`, `clean_data_100`
cohort'larıyla yönetilir. Atama analytics izni olan anonim kullanıcı için günlük
tuzlu hash'in deterministik kovasıyla; giriş yapmış kullanıcı için sunucu tarafı
kararlı kullanıcı kovasıyla yapılır. Cohort adı event payload'ında yalnız
allowlist değer olarak taşınır. IP, user id, telefon veya e-posta analytics'e
gönderilmez.

Botlar, admin/internal trafik ve synthetic QA ölçümden çıkarılır. Aynı kullanıcı
deney süresince cohort değiştirmez. Ads kampanyası değişimi ile tema yüzdesi aynı
24 saat penceresinde değiştirilmez; attribution karışması önlenir.

## Aşamalar ve bekleme

1. `control`: güvenlik/veri düzeltmeleri tema deneyinden bağımsızdır.
2. `%10`: ana sayfa + canonical ürün + ilan detay; en az 24 saat ve minimum
   örneklem.
3. `%50`: yalnız hata/KPI kapıları yeşilse; en az 48 saat.
4. `%100`: analiz, ilan listesi, harita/data-health, API Pro ve yasal yüzeylerle
   ortak token sistemi.

Mevcut 14 Ağustos yayını işlevsel olarak `%100` durumundadır. Bundan sonraki
tema varyasyonu veya büyük IA değişimi bu cohort sözleşmesini kullanır; mevcut
canlı temayı geriye dönük olarak yapay bir A/B sonucu gibi raporlamaz.

## Genişletme kapısı

- Public 5xx <%0,10; deploy dışı 502 sıfır.
- Yeni PII sızıntısı, canonical mismatch, redirect chain ve kritik WCAG ihlali 0.
- LCP ≤2,5 sn, CLS ≤0,1, INP ≤200 ms; ölçüm aracı yoksa aşama genişletilmez.
- En az 30 fiyat bulma yolculuğu ve 100 arama oluşmadan arama KPI'sı karar vermez.
- Kontrole göre search success veya call conversion %20 göreli düşmez.
- Toptan anomali oranı <%1; %1–3 arası veri incelemesi, ≥%3 rollout durdurma.

## Rollback

Kritik gizlilik, authz, veri yanlışlığı veya canonical hatasında örneklem
beklenmeden ilgili özellik kapatılır. Tema/KPI regresyonunda cohort son güvenli
yüzdeye indirilir; git-only deploy ile son kabul edilmiş release'e dönülür,
frontend izole dist korunur ve PM2 restart sonrası canlı smoke tekrarlanır.
Olay kaydına release SHA, başlangıç/bitiş, etkilenen route, metrik, rollback SHA
ve doğrulama kanıtı yazılır. Veri şeması geri alınmaz; additive migration geriye
uyumlu bırakılır.
