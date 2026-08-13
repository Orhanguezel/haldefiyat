# Faz 0 Teknik Envanter ve Tasarım Bazı

**Tarih:** 13 Ağustos 2026

**Kapsam:** `frontend/src`, public route ağacı, tema/hydration, ortak bileşenler ve ana veri akışları.

## Özet

- Public sayfa sayısı: **58** (`frontend/src/app/[locale]/(public)/**/page.tsx`).
- TSX bileşen/sayfa sayısı: **213**.
- Client island sayısı: **90** (`use client`); ağır etkileşimli grafik, harita, arama ve form bileşenleri öncelikli inceleme alanıdır.
- Hard-coded renk sınıfı/hex eşleşmesi: **349**. Token katmanı mevcut fakat tüm yüzeylere uygulanmamış.
- Emoji içeren TS/TSX satırı: **170**. Bunlar içerik emojisi, durum ikonu ve dekoratif kullanım olarak ayrıştırılmalıdır; erişilebilir ikon yerine kullanılanlar kaldırılmalıdır.

## Tema ve hydration akışı

1. Root layout `suppressHydrationWarning` ile HTML'i üretir.
2. `next-themes`, `data-theme` attribute'unu istemcide yönetir ve sistem tercihini okuyabilir.
3. Kod sabiti `DEFAULT_THEME="light"` olmasına rağmen sağlayıcı `defaultTheme="dark"` kullanıyordu; ilk ziyaret davranışı çelişkiliydi.
4. Toggle mount öncesinde 36x36 placeholder döndürerek ikon hydration farkını önler.
5. Bağlayıcı tema kararı açık varsayılandır; sistem/kullanıcı seçimi sonradan korunur.

## Token ve hard-code envanteri

`globals.css` marka, semantik, nötr, yüzey, harita, font, gölge ve radius tokenlarını tanımlıyor. Borçlar:

- neon lime `hsl(102 85% ...)` fiyat-veri markası için fazla parlak;
- ambient orb ve dot-grid eski terminal/kripto yönünden kalma;
- Tailwind palette sınıfları token katmanını 349 noktada deliyor;
- radius, shadow ve genişlikler ortak bileşen yerine sayfa içinde tekrar ediyor;
- tema meta renkleri ile CSS marka rengi aynı sözleşmeden üretilmiyor.

Geçiş sırası: temel renkler → focus/radius/shadow → ortak Button/Input/Card/Table → sayfa aileleri → kalan hard-code denetimi.

## Public sayfa aileleri

- **Veri:** ana sayfa, fiyatlar, ürün, hal, şehir, harita, endeks, karşılaştırma, canlı hayvan, et, borsa.
- **Editoryal:** analiz, rapor, metodoloji, rehberler ve içerik sayfaları.
- **Pazar:** ilan listesi/detayı/verme, firmalar ve firma detayları.
- **Kurumsal:** API docs/Pro, embed/widget, reklam ve kurumsal bilgi.
- **Güven/yasal:** hakkımızda, iletişim, sahiplik-finansman, KVKK, gizlilik, kullanım koşulları, düzeltme.
- **Auth/kişisel:** giriş, kayıt, favoriler, uyarılar ve kullanıcı paneline geçiş yüzeyleri.

## Ortak UI önceliği

Yüksek tekrar: `Header`, `Footer`, `PageContainer`, `Button`, `Input`, `Badge`, `Breadcrumb`, `BannerSlot`, fiyat tabloları/kartları ve freshness badge. Orta tekrar: arama/select, pagination, product image, favorite ve newsletter. Sayfaya özel: Türkiye haritası, grafikler, listing formu ve API örnekleri.

## Veri endpoint/cache/fallback özeti

- Ana sayfa `force-dynamic`; widget, market, product, listing ve overview çağrılarını paralel yapıyor.
- API istemci katmanı `frontend/src/lib/api.ts` ve endpoint sözleşmeleri `frontend/src/config/api-endpoints.ts` altında merkezileşmiş.
- Mobil ana sayfa UA ile sunucuda ayrılıyor; masaüstü ağacı mobil istemciye gönderilmiyor.
- Fallback metinleri görünür `Bilinmiyor`/boş durum şeklinde olmalı; sentetik veya stale değer güncelmiş gibi gösterilmemeli.
- Revalidate/cache değerleri endpoint bazında sonraki performans ölçümünde doğrulanacaktır; ana sayfa dinamikliği cache ile varsayılmayacaktır.

## Telefon veri akışı

`DB listing/contact fields → repository/model → controller → public DTO sanitizer → list/detail API → ListingCard/detail page`. Public DTO `contactPhone:null`, `raw:null` döndürür; serbest metin telefon/e-posta redaksiyonu API'den önce uygulanır. Yetkili arama talebi ayrı `hf_listing_call_requests` kaydı ve durum makinesi üzerinden yürür. Owner/admin verisi public DTO ile birleştirilmez.

## Ürün veri akışı

`Kaynak satırı → ETL parse → normalize/match-key/alias → canonical product + unit → price row → product-unit-labels → public API → display-name guard → sayfa/tablo/widget`. Aynı ada sahip farklı birimler merge edilmez; kullanıcıya `Limon (Kg)` / `Limon (Kasa)` örneğindeki gibi birim etiketi gösterilir. Şüpheli eşleşme karantina/inceleme hattına yönlenmelidir.

## İlk kabul hedefleri

- İlk fiyat sonucuna mobil ve desktopta en fazla 1 arama + 1 seçim.
- İlk ziyarette açık tema; kullanıcının koyu tema tercihi kalıcı.
- Public ilan telefon sızıntısı: 0.
- `Invalid Date`, ham source key ve anlamsız `(...)`: kritik yüzeylerde 0.
- Ana sayfa/ürün/analiz/ilan/data-health için WCAG AA kritik ihlal: 0.
- Mobil LCP hedefi ≤2.5 s, CLS ≤0.1, INP ≤200 ms; gerçek baz değerleri canlı Lighthouse/CrUX kanıtıyla kaydedilir.

## Canlı tema ve ana sayfa ölçümü

Release `c9df3079` sonrası temiz tarayıcı profiliyle:

- ilk ziyaret `data-theme=light`, body zemini `rgb(246, 248, 247)`;
- kayıtlı `localStorage.theme=dark` tercihi reload sonrasında korunuyor, body zemini `rgb(11, 13, 20)`;
- masaüstü 1440×1100 sayfa yüksekliği 9.289 px;
- mobil 390×844 sunucu ağacı ilk ölçümde 16.465 px/13 section; IA sadeleştirmesi sonrası 11.759 px/9 section (yaklaşık %29 daha kısa);
- mobil ilk fiyat rotası ilk ekrandaki “Fiyatları incele” bağlantısıyla bir tık uzakta;
- ana sayfa, ürün ve ilan listesinde tarayıcı konsol hatası 0; ilan listesinde `tel:` bağlantısı 0;
- görsel kanıtlar `output/playwright/theme-clean-data/` altında tutuldu.

Mobil sayfa kısaltılmış olsa da 11.759 px/9 bölüm hâlâ ana görev sonrası ikincil içerik barındırır; gerçek etkileşim verisine göre ek özetleme yapılmalıdır.
