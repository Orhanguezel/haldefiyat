# Editoryal seri → ödeme kanıtı

Mevcut Stripe Checkout ve abonelik akışı korunur. Kullanıcının mevcut analitik rızası hâlâ `accepted` ise `hf_attr` içindeki utm_source, utm_medium, utm_campaign ve utm_content checkout gövdesine aktarılır. GCLID, arama terimi, iniş URL'si ve diğer alanlar aktarılmaz. Sunucu yalnız 1–120 karakterlik etiketleri kabul eder; content_series değeri k1–k5 utm_content önekinden türetilir. Kullanıcı kimliğini istemci metadata'sı değiştiremez.

Aynı etiketler Checkout Session metadata'sına ve subscription_data.metadata alanına ayrı ayrı yazılır. Böylece ilk oturum ve yenileme faturası mevcut Stripe nesnelerinde ilişkilendirilir. [Stripe metadata dokümanı](https://docs.stripe.com/metadata) bu iki alanın ayrı aktarılmasını ve abonelik metadata'sının fatura parent.subscription_details.metadata alanına kopyalanmasını belgeliyor. Önceden yapılandırılmış webhook API sürümleri için subscription_details.metadata şekli de okunur. Bu dar değişiklik API sürümünü veya ödeme davranışını değiştirmez.

İmzalı webhook mevcut hf_stripe_events defterine kaydedildikten ve mevcut işleyici başarıyla tamamlandıktan sonra yalnız şu koşullarda `editorial_payment_verified` yapılandırılmış logu üretilir:

- `invoice.payment_succeeded`, `livemode=true`, `status=paid`;
- pozitif tam sayı `amount_paid` (para biriminin küçük birimi), geçerli fatura kimliği ve para birimi;
- metadata'dan doğrulanabilen k1–k5 seri etiketi.

Checkout tamamlandı, abonelik etkinleşti, deneme başladı veya sıfır tutarlı fatura ödendi olayları gelir sayılmaz. Ödeme defteri mevcut hf_stripe_events.payload içinde kalıcıdır; yeni tablo veya ikinci muhasebe oluşturulmaz. Raporlamada olay sayısı yerine benzersiz `invoiceId` kullanılır, para birimleri ayrı toplanır. Webhook olay kimliğiyle mevcut tekrar koruması sürer. Satışların net geliri için iade/itirazlar ayrıca mevcut ödeme kayıtlarından değerlendirilmelidir; bu log brüt ödenen faturanın kanıtıdır.

Bu uygulama yeni gerçek ödeme kanıtı üretmedi. Geçmiş metadata'sız ödemeler bir seriye tahminle atanmaz. Stripe webhook uç noktasının invoice.payment_succeeded olayına zaten abone olup olmadığı dağıtım kabulünde kontrol edilmelidir; bu çalışma canlı Stripe ayarı değiştirmez.

Doğrulama: backend billing-attribution.test.ts 4 test / 15 assertion; frontend checkout-attribution.test.ts 1 test. Testler rıza iptali, alan filtreleme, kimlik değiştirme girişimi, metadata eşliği, eski/yeni fatura şekli ve deneme/sıfır/test/unpaid olaylarının dışlanmasını kapsar. Canlı checkout, ücretlendirme veya webhook gönderimi yapılmadı.
