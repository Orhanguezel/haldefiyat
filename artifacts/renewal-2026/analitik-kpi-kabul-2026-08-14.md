# Analitik ve KPI Kabulü — 14 Ağustos 2026

## Ürün bulma ve çağrı hunisi

- Ürün keşif olayları: `search_opened`, `search_submitted`,
  `search_result_selected`, `price_viewed`; sıfır sonuç ayrıca ölçülüyor.
- Analytics izni varsa aynı yolculuk `hf_cta_events` içine
  `placement=product_search` ve kısa kontrollü olay adıyla yazılıyor.
- Payload sorgu, ürün adı, telefon, e-posta, not, kullanıcı ID veya kalıcı
  ziyaretçi anahtarı taşımıyor. Tekillik günlük tuzlu kısa hash ile sınırlı.
- Çağrı talebi `notified` yalnız Telegram teslimi ve DB durum yazımı başarılıysa
  event oluyor; accepted/declined/completed akışı ayrı ölçülüyor.

## Tarayıcı kabulü

14 Ağustos canlı Playwright kabulünde arama dialogu açıldı, PII'siz sahte
`domates` sonucu seçildi ve `/urun/domates` sayfasına gidildi. Beacon gövdeleri:

1. `product_search/opened`, path `/`
2. `product_search/submitted`, path `/`
3. `product_search/selected`, path `/`
4. `product_search/price_viewed`, path `/urun/domates`

Yönlendirme sonunda title `Domates Hal Fiyatı 2026 — Toptan & Piyasa Fiyatları`
ve tarayıcı konsol hata sayısı 0'dı. Tracking çağrıları testte yakalandı, canlı KPI
tablosuna sentetik kayıt yazılmadı.

## Dashboard ve karar kapısı

- `/admin/analytics/product-kpis` fiyat bulma ortalaması/örneklemi, arama başarı
  ve sıfır sonuç oranı, toptan/perakende karantina sayısı ile çağrı bildirim,
  kabul ve tamamlama oranını döndürüyor.
- Panel 30 yolculuk, 100 arama ve 30 çağrı altını **veri birikiyor** diye gösterir;
  veri yokluğunu sıfır performans diye raporlamaz.
- Canlı başlangıç bazı: ürün arama olayı ve çağrı talebi henüz yok; son 30 günde
  49.569 yayınlanmış fiyat, 0 toptan pending/karantina. Bu değerler rollout
  öncesi ölçüm başlangıcıdır, sonuç iddiası değildir.
- Fiyat bulma >15 sn, search success <%40, anomali %1 uyarı/%3 durdurma ve
  kontrol kohortuna göre %20 göreli düşüş eşikleri kayıtlıdır.
- Bülten, sosyal, reklam, API Pro ve kurumsal rapor hunileri birbirinden ayrıdır.
- Panelde uygulama audit, GSC organik ve nginx tüm istek kapsamlarının birbirinin
  yerine kullanılamayacağı; kısmi günün günlük kıyasa alınmayacağı yazılıdır.
- Tema cohort/rollback sözleşmesi `docs/TEMA-ROLLOUT-VE-KPI-KAPISI.md`, olay/payload
  sözleşmesi `docs/ANALYTICS-EVENT-SOZLESMESI.md` içindedir.

## Teknik doğrulama

- Frontend hedefli birleşik SEO+analytics tekrar koşusu: 4 dosya / 16 test geçti
  (önceki analytics paketi koşusu 5 dosya / 18 testti).
- Frontend typecheck geçti.
- Backend production build geçti.
- Admin typecheck ve izole production build geçti.
- Admin KPI endpoint'i oturumsuz çağrıda 401; public yüzeye açılmıyor.

## GA4 kararı

Birinci taraf KPI ölçümü GA4 property kararından bağımsız ve canlıdır. HalDeFiyat
için ayrı GA4 property oluşturma işlemi Google hesabında dış yetki gerektirir;
VistaSeeds property'sine yeni HalDeFiyat event'i yazılmayacaktır. Ayrı property
oluşturulana kadar birinci taraf panel tek karar kaynağıdır.
