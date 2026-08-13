# HalDeFiyat Tema Karar Kaydı

**Karar tarihi:** 13 Ağustos 2026

**Durum:** Bağlayıcı

**Ana yön:** Temiz Veri

**İkincil yön:** Pazar Defteri (yalnız analiz, rapor ve uzun okuma yüzeylerinde)

## Karar özeti

HalDeFiyat'ın temel işi fiyatı, kaynağı, birimi ve veri tazeliğini hızlı ve güvenilir biçimde göstermektir. Bu nedenle yedi karşılaştırmalı panoda en tutarlı yön olan **Temiz Veri** bütün public ve dashboard yüzeylerinin ana tasarım sistemidir. **Pazar Defteri** yönünün kırık beyaz/sıcak yüzey ve editoryal vurgu dili yalnız analiz, metodoloji ve rapor okuma alanlarında kontrollü olarak kullanılır. **Tarladan Sofraya** tam tema olarak kullanılmaz; fotoğraf ağırlığı LCP ve lisans borcu yaratır, gerçek veri iddiasını zayıflatabilir ve e-ticaret algısı oluşturur.

## 1–5 karar matrisi

| Ölçüt | Pazar Defteri | Temiz Veri | Tarladan Sofraya |
|---|---:|---:|---:|
| Fiyatı ilk bakışta bulma | 4 | 5 | 4 |
| Kaynak ve tazelik güveni | 4 | 5 | 3 |
| Mobil okunabilirlik | 4 | 5 | 3 |
| Üretici/komisyoncu/tüketici yakınlığı | 5 | 4 | 5 |
| B2B/API uygunluğu | 3 | 5 | 2 |
| Reklam ile verinin ayrışması | 4 | 5 | 3 |
| Mevcut token sistemine uygulanabilirlik | 4 | 5 | 3 |
| Kontrast ve erişilebilirlik | 4 | 5 | 3 |
| Görsel lisans borcu | 5 | 5 | 2 |
| Mobil LCP riski | 5 | 5 | 2 |
| Gerçek veri algısı | 4 | 5 | 3 |
| E-ticaret algısından uzaklık | 5 | 5 | 2 |
| **Toplam / 60** | **51** | **59** | **35** |

Puanlar `konsept-gorselleri/01`–`07` panolarında ana sayfa, ürün, analiz, ilan, çağrı talebi, harita ve API Pro yüzeyleri ayrı ayrı incelenerek verilmiştir.

## Kesin tasarım kararları

- **Logo:** Mevcut HalDeFiyat logosu korunur. Yeni yapay logo veya yeniden markalama yapılmaz. Küçük ekranda metin işareti için aynı ad ve koyu yeşil vurgu kullanılır.
- **Ana renk:** Kurumsal koyu yeşil `#065f3b`; etkileşim yeşili `#0f7a4d`; açık vurgu `#e8f5ee`. Neon/lime varsayılan marka rengi kaldırılır.
- **Semantik renk:** Yükseliş/düşüş yalnız renkle anlatılmaz; ok/etiket ve metin birlikte kullanılır. Fiyat değişiminde yeşil=kâr gibi yanıltıcı yorum yapılmaz.
- **Zemin:** Açık tema ilk ziyaret varsayılanıdır. Ana zemin `#f7f9f8`, kart `#ffffff`, editoryal yüzey `#fbf7ee` olur. Koyu tema kullanıcı tercihidir ve korunur.
- **Font:** Arayüz ve veri için IBM Plex Sans; kısa başlıklar için Outfit. Uzun editoryal metinde mevcut fontlar korunur; üçüncü font yüklenmez.
- **Kart dili:** İnce sınır, düşük gölge, 12–16 px yarıçap; cam/neon/orb/kripto-terminal estetiği kullanılmaz.
- **Tablo dili:** Başlıklar koyu yeşil veya nötr yüzey, sağa hizalı sayısal sütunlar, görünür birim, zebra yerine hafif satır ayracı; mobilde yatay kaydırma veya özet kart.
- **Fotoğraf:** Yalnız lisansı/atıfı kayıtlı gerçek görsel; fiyat ve kaynak verisinin yerine geçmez. Hero fotoğrafı varsayılan değildir. Mobil LCP adayında fotoğraf kullanılmaz.
- **Hareket:** Kayan ticker ve sürekli sayaç animasyonu varsayılan tasarım öğesi değildir. `prefers-reduced-motion` desteklenir.
- **Dil:** “Alışverişe başla” gibi e-ticaret CTA'ları kullanılmaz. “Fiyatları incele”, “Hal seç”, “Arama talebi gönder” gibi platformun gerçek işlevini anlatan dil kullanılır.

## Sayfa ailesi uygulaması

| Aile | Ana yön | İkincil kullanım |
|---|---|---|
| Ana sayfa, fiyat, ürün, hal, harita | Temiz Veri | Sıcak vurgu yok veya çok sınırlı |
| Analiz, rapor, metodoloji | Temiz Veri | Pazar Defteri editoryal yüzeyleri |
| İlan ve arama talebi | Temiz Veri | Güven metinlerinde sıcak nötr yüzey |
| API Pro, kurumsal, dashboard | Temiz Veri | Yok |
| Yasal ve auth | Temiz Veri | Okuma yüzeyinde sıcak nötr zemin |

## Yayın ve kabul kuralı

Ortak tokenlar ve küçük bileşenler önce uygulanır; ana sayfa, ürün detayı ve ilan çağrı paneli gerçek içerikle tarayıcıda kabul edilmeden geniş yüzey yayını tamamlanmış sayılmaz. Açık/koyu tema, 390 px mobil, klavye odağı, kontrast ve azaltılmış hareket kontrolü zorunludur. Değişiklikler tek kontrollü release içinde canlıya alınır ve önceki tema git release'i ile geri döndürülebilir.
