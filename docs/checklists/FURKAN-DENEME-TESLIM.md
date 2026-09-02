# Furkan Gonca — 10 günlük deneme · teslim notları

**Tanımlandı:** 2026-09-02 · **Bitiş:** 2026-09-12 (10 gün)
**Kullanıcı:** furkan GONCA · `furkangonca0@gmail.com` · `4b673ca7-…`
**Durum:** `trialing`, Pro limiti (10.000 istek/gün), ödeme alınmadı

Süre dolunca gecelik iş (`subscription-expiry`, 00:10 UTC) anahtarı otomatik
`free`/100'e düşürür. Elle bir şey yapmaya gerek yok.

---

## Furkan'a gönderilecek mesaj (taslak — gönderilmedi)

> Merhaba Furkan Bey,
>
> Görüşmemizin ardından hesabınıza **10 günlük ücretsiz API erişimi** tanımladım
> (12 Eylül'e kadar, ödeme alınmıyor).
>
> **Anahtarınızı nasıl alacaksınız:**
> 1. haldefiyat.com'a giriş yapın
> 2. Hesabım → **API erişimi** sayfasına girin
> 3. "Anahtar oluştur" deyin — anahtar yalnız o an gösterilir, kaydedin
>
> **İstanbul hal fiyatlarını çekmek:**
> ```
> curl "https://haldefiyat.com/api/v1/prices?market=istanbul-hal-ibb&limit=100" \
>   -H "X-API-Key: hf_..."
> ```
> Bu tek çağrı o günün **tüm İstanbul fiyatlarını** getirir (94–105 ürün).
> Tek ürün isterseniz: `&product=domates`
>
> Yanıt başlıklarında kalan kotanızı görürsünüz (`x-ratelimit-remaining`).
>
> **Bilmenizde fayda var:**
> - Veri **günlüktür**, anlık değil. İBB günde bir yayınlıyor, biz de onu alıyoruz.
> - İBB'nin yayın yapmadığı günler oluyor (örn. 28 Ağustos – 1 Eylül arası bayram
>   nedeniyle veri yok). O günlerde en son yayınlanan gün görünür — yanıttaki
>   `recordedDate` alanı hangi güne ait olduğunu söyler.
> - Kapsam İstanbul geneli (İBB tek veri seti yayınlıyor, yaka ayrımı yapmıyor).
>
> Denemede takıldığınız yerde yazın. Süre sonunda kullanımınıza birlikte bakıp
> devam kararını veririz.

**Kanal notu:** Telefon (`0544 496 19 94`) tercih ettiği kanal olabilir; e-posta
ile birlikte kısa bir WhatsApp mesajı dönüşü hızlandırır.

---

## Kullanım raporu — 5. ve 10. günde çalıştır

**Günlük istek sayısı (anahtar bazında):**
```bash
curl -s "http://localhost:8091/api/v1/admin/api-keys/daily-usage?days=14" \
  -H "Authorization: Bearer $JWT" | python3 -m json.tool
```

**Hangi ürünleri çekmiş (asıl ilginç olan bu):**
```sql
SELECT DATE(l.created_at) gun,
       SUBSTRING_INDEX(SUBSTRING_INDEX(l.url,'product=',-1),'&',1) urun,
       COUNT(*) istek
FROM audit_request_logs l
JOIN hf_api_keys k ON k.id = l.api_key_id
JOIN users u ON u.id = k.user_id
WHERE u.email = 'furkangonca0@gmail.com'
  AND l.created_at >= NOW() - INTERVAL 14 DAY
GROUP BY gun, urun ORDER BY gun DESC, istek DESC;
```

**Saat dağılımı — otomatik mi çekiyor, elle mi bakıyor:**
```sql
SELECT HOUR(l.created_at) saat, COUNT(*) istek
FROM audit_request_logs l
JOIN hf_api_keys k ON k.id = l.api_key_id
JOIN users u ON u.id = k.user_id
WHERE u.email = 'furkangonca0@gmail.com' AND l.created_at >= NOW() - INTERVAL 14 DAY
GROUP BY saat ORDER BY saat;
```

Düzenli saatlerde tekrar eden istekler = entegrasyon kurmuşlar (iyi sinyal).
Dağınık ve seyrek = elle bakıyorlar, henüz entegre değiller.

## Karar anı (12 Eylül)

Pro 2.999 ₺/ay ile devam kararı için bakılacaklar:
- Günlük ortalama istek — kaç ürün, kaç kez
- Entegrasyon kurmuşlar mı (saat düzeni)
- İhale tarafını sordular mı

Not: kullanım düşükse Pro'nun 10.000/gün limiti fazla gelir; ücretsiz kademe
(100/gün) bile yeter. O durumda fiyat konuşulurken **limit değil, veri erişimi
ve süreklilik** satılmalı.
