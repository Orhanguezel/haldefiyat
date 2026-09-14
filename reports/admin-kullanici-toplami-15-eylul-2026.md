# Kullanıcı toplamı — 15 Eylül 2026

Sorun: `/admin/users?limit=20&offset=20` ekranı toplam ve özet kartlarını yalnız yüklenen 20 satırdan hesaplıyordu. API sayfalama toplamı sağlamıyordu. Canlı veritabanı: 63 kullanıcı.

Düzeltme canlıda:

- Mevcut kullanıcı endpoint'ine isteğe bağlı `with_meta=true` eklendi. `items`, filtrelenmiş `total` ve sayfadan bağımsız genel `stats` döner. Parametresiz eski istemciler dizi yanıtını almaya devam eder.
- Toplam, aktif, yönetici, doğrulanmamış ve son yedi gün giriş sayıları veritabanından hesaplanır. Kartlar genel toplam; liste sayacı filtre sonucudur.
- Sayfa sayısı gerçek toplamdan hesaplanır. İkinci sayfa `63 kullanıcıdan 21–40 arası`, son sayfa `61–63` gösterir.
- Rol filtresi limit/offset öncesine taşındı; pasif filtrede metin `false` artık boolean false olarak yorumlanır. Arama ad, telefon ve e-postayı kapsar.

Doğrulama: ortak backend derlemesi geçti. Admin genel TypeScript kontrolü, değişiklik dışındaki tests/listing-upload.test.ts:9 fetch mock tür hatasına takılıyor; değişen dosyalarda hata bildirilmedi. İki regresyon testi, dokuz assertion başarılı. Canlı admin build `.next-release-20260915ab01`; backend ve admin PM2 servisleri sağlıklı.

Kimlik doğrulanmış API ve Playwright kontrolü: toplam 63, aktif 63, yönetici 2, doğrulanmamış 36, son yedi gün giriş 4. Yönetici filtresi 2 sonuç; pasif filtre 0 sonuç. Son sayfada 3 satır ve Sonraki düğmesi pasif. İkinci sayfada toplam 63 sabit.

Browser plugin mevcut olmadığı için Playwright CLI kullanıldı. Kanıtlar `artifacts/admin-users-total-2026-09-15/` altında. Backend değişiklikleri ortak `packages/shared-backend/modules/auth/` içindedir; yalnız HalDeFiyat backend süreci yeniden yüklendi. Eski dosyalar sunucuda `/tmp/hal-users-backup-20260915/source.tar` içinde saklandı.
