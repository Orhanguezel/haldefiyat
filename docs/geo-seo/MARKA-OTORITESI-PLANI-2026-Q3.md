# HalDeFiyat Marka Otoritesi Planı — 2026 Q3

## Amaç ve sınır

Amaç, HalDeFiyat'ı özgün ve denetlenebilir Türkiye hal fiyat verisinin
alıntılanabilir kaynağı haline getirmektir. Başarı; kazanılmış bağımsız mention,
referring domain, markalı arama, veri/rapor citation ve nitelikli referral ile
ölçülür. Wikipedia maddesi açmak hedef veya KPI değildir; bağımsız kayda
değerlik oluşmadan promosyonel madde oluşturulmaz.

Bu belge yayın/dağıtım planıdır. Herhangi bir basın kişisine e-posta
gönderilmedi, Reddit gönderisi veya YouTube videosu yayımlanmadı.

## Mevcut hazır altyapı

- Canlı kaynak merkezi: `/basin`, `/endeks`, `/api-docs`, `/analiz` — 27
  Temmuz 2026'da HTTP 200.
- Basın CRM'i: `hf_press_contacts`, `hf_press_campaigns`,
  `hf_press_outreach_logs` ve `/admin/press`.
- Pitch şablonları: lansman, yıllık rapor ve haftalık endeks hikâyesi.
- Başlangıç listesi: `docs/press/haldefiyat-press-contacts-initial.csv`;
  başlık hariç 11 doğrulanmış iletişim satırı.
- Veri varlık kataloğu:
  `docs/geo-seo/VERI-KATALOGU-2026-07-27.csv`.
- İlk ölçüm baseline'ları: branded GSC 5 gösterim/4 tıklama; Anthropic
  web-search citation 18/40; dış AI referrer 21 günde 28 landing.

## Veri kataloğu yayın kapısı

Her veri varlığı için canonical URL, format, güncelleme sıklığı, kaynak yöntemi,
owner, kalite kapısı, citation biçimi ve lisans durumu katalogda tutulur.
data.gov.tr, Kaggle veya üçüncü taraf depoya veri yüklemeden önce:

1. Birincil kaynağın yeniden kullanım koşulu ve atıf zorunluluğu kaydedilir.
2. Kişisel veri/ticari sır içermediği ve toplulaştırmanın yanıltıcı olmadığı
   kontrol edilir.
3. Veri sözlüğü, kapsam, tarih aralığı, birim, eksik veri ve revizyon politikası
   yayımlanır.
4. Sürüm, checksum, üretim tarihi ve değişiklik kaydı eklenir.
5. HalDeFiyat yeniden kullanım lisansı hukuk/owner onayı olmadan “open data”
   diye etiketlenmez.

Katalogdaki `license_status` açık olmayan varlıklar harici platforma
yüklenemez. İlk owner kararı gereken konu, API/veri çıktılarında uygulanacak
lisans ve atıf metnidir.

## 30/60/90 günlük program

| Dönem | Teslim | Kanal | Owner | Kabul kanıtı |
|---|---|---|---|---|
| Gün 1–30 | Her pazartesi tek veri hikâyesi: endeks değeri, en güçlü 3 hareket, yöntem ve canonical analiz URL'si | Site + basın CRM | Editorial/Data | 4 yayımlanmış analiz; kaynak tarihi ve review kaydı |
| Gün 1–30 | Basın listesini ekonomi, tarım, yerel üretim illeri, ajans ve araştırma olarak etiketle; bounce/opt-out kayıtlarını temizle | `/admin/press` | PR | Geçerli durumlu ≥30 kişi; kaynak URL ve son doğrulama tarihi |
| Gün 1–30 | İki “veriyi nasıl okursunuz?” video taslağı: hal fiyatı nasıl belirlenir; min/max/ortalama ne demek | YouTube hazırlık | Editorial | Script, veri kaynağı, ekran kaydı planı ve UTM'li landing |
| Gün 1–30 | İlgili Türkçe toplulukların kurallarını ve self-promotion politikasını kaydet | Reddit hazırlık | Community | En fazla 5 uygun topluluk; kural URL'si ve izinli format |
| Gün 31–60 | Dört haftalık endeks pitch'i; yalnız konuya uyan editörlere kişiselleştirilmiş gönderim | Basın | PR | Outreach log; gönderildi/yanıt/yayın URL'si |
| Gün 31–60 | Ayda 2 açıklayıcı video yayımla; fiyat tahmini/garantisi verme | YouTube | Editorial | 2 video; açıklamada kaynak/metodoloji/canonical URL ve UTM |
| Gün 31–60 | Ayda en fazla 2 özgün veri gönderisi; önce bulgu ve yöntem, link yalnız kurala uygunsa | Reddit | Community | Mod silme oranı, yorum, nitelikli referral; spam yok |
| Gün 61–90 | Aylık veri paketi ve yeniden kullanılabilir iki grafik; gazeteci için CSV örneği | Basın/veri kataloğu | Data + PR | Sürüm/tarih/metodoloji ve indirilebilir kanıt |
| Gün 61–90 | Kazanılmış mention ve citation değerlendirmesi; hangi konu/şehir/ürün link kazandı | Dashboard/rapor | SEO + PR | Bağımsız domain, link niteliği, unlinked mention ve referral tablosu |

## Kanal ilkeleri

### Basın ve bağımsız mention

- Pitch, “platformumuzu tanıtın” yerine tek doğrulanabilir veri bulgusuyla açılır.
- Her rakamda veri tarihi, kapsam, yöntem ve canonical kaynak URL'si bulunur.
- Aynı metin toplu gönderilmez; yayın türüne ve şehre göre konu eşleştirilir.
- `hf_press_outreach_logs` içinde kampanya, kişi, tarih, durum, yanıt ve yayın
  URL'si zorunludur.
- Ücretli/sponsorlu yayın kazanılmış mention sayılmaz ve ayrı etiketlenir.

### YouTube

- Presence değil, arama niyeti serileri: “Bugün fiyat ne?”, “Fiyat neden
  değişti?”, “Veri nasıl okunur?”.
- Her video tek canonical sayfaya ve metodolojiye bağlanır; UTM:
  `utm_source=youtube&utm_medium=video&utm_campaign={series}`.
- Ana KPI izlenme değil: 30 saniye tutma, ortalama izlenme yüzdesi, siteye
  nitelikli referral ve video sonrası markalı sorgu değişimi.
- Hedef: ayda 2 video; 90 günde ≥6 video, ≥%35 ortalama izlenme ve ≥30 nitelikli
  site oturumu. Kanal baseline'ı ilk yayın haftasında alınır.

### Reddit

- Topluluk kuralları kontrol edilmeden paylaşım yapılmaz; yapay oy, çoklu hesap,
  link spam ve kopya gönderi yoktur.
- Gönderi bir veri sorusunu kendi içinde cevaplar; site linki gerekli kaynak
  olarak ve yalnız izin veriliyorsa eklenir.
- UTM:
  `utm_source=reddit&utm_medium=community&utm_campaign={topic}`.
- Hedef: ayda en fazla 2 nitelikli gönderi; silinme oranı <%20, 90 günde ≥20
  anlamlı yorum ve ≥20 engaged referral. Uygun topluluk bulunmazsa paylaşım
  sayısı hedef uğruna zorlanmaz.

## KPI tablosu

| KPI | Baseline | 90 günlük hedef | Kaynak | Sıklık | Owner |
|---|---:|---:|---|---|---|
| Kazanılmış bağımsız mention | Backlink sağlayıcısı olmadığı için henüz ölçülemedi | ≥5 doğrulanmış yayın | Press logs + manuel URL doğrulama | Haftalık | PR |
| Yeni kaliteli referring domain | Henüz ölçülemedi | ≥3 ilgili bağımsız domain | Backlink aracı/GSC Links export | Aylık | SEO |
| Markalı GSC gösterimi | 5 / 28 gün | ≥25 / 28 gün | GSC query | Aylık | SEO |
| AI citation oranı | %45 | Aynı platform/modelde ≥%50 | Sabit 40 sorgu | Aylık | GEO |
| Basın pitch yayın dönüşümü | Henüz kampanya baseline'ı yok | ≥%10 | Outreach log | Kampanya sonrası | PR |
| YouTube nitelikli referral | İlk yayın öncesi 0/baseline yok | ≥30 / 90 gün | GA4 + UTM | Aylık | Editorial |
| Reddit engaged referral | İlk yayın öncesi 0/baseline yok | ≥20 / 90 gün | GA4 + UTM | Aylık | Community |

Sayısal backlink baseline'ı alınana kadar referring-domain hedefi geçici
planlama hedefidir; arama motoru sonuç sayısı backlink sayısı gibi kullanılmaz.

## Aylık kapanış kaydı

Her ay şu alanlarla tek rapor yayımlanır:

`period`, `asset/story`, `outreach_count`, `response_count`,
`earned_publication_url`, `linked/unlinked`, `nofollow/sponsored/unknown`,
`referral_sessions`, `branded_impressions`, `AI_citation_rate`,
`youtube_retention`, `reddit_removal`, `decision/next_action`.

Başarısız yayın veya yanıtsız pitch silinmez; negatif sonuçlar da kampanya
logunda korunur.
