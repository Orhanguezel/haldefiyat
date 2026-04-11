/**
 * @eco/shared-backend/modules
 *
 * Ekosistem ortak backend modulleri.
 * Her modul bagimsiz calisir, kendi schema/router/controller/repository'sine sahiptir.
 * Proje DB'si ayri olsa bile ayni modul kodu kullanilir (SaaS pattern).
 *
 * Kullanim:
 *   import { registerGallery } from '@eco/shared-backend/modules/gallery';
 *   import { registerAuth } from '@eco/shared-backend/modules/auth';
 *
 * Modul Listesi (24 modul):
 *
 * ICERIK & CMS
 *   - customPages    : Slug bazli CMS sayfalari
 *   - siteSettings   : Key-value site ayarlari (locale destekli)
 *   - newsletter     : Abone yonetimi
 *   - emailTemplates : Email sablon yonetimi
 *   - blog           : Blog/makale yonetimi (RSS import destekli)
 *   - slider         : Hero slider yonetimi
 *   - popups         : Pazarlama popup yonetimi
 *
 * URUN & KATALOG
 *   - products       : Urun katalogu (faqs, specs, reviews dahil)
 *   - categories     : Kategori yonetimi (i18n)
 *   - subcategories  : Alt kategori
 *   - gallery        : Gorsel galeri yonetimi
 *   - library        : Dijital kaynak kutuphanesi
 *   - references     : Referans / musteri hikayeleri
 *   - review         : Kullanici degerlendirmeleri
 *
 * AUTH & KULLANICI
 *   - auth           : JWT kimlik dogrulama, rol yonetimi
 *   - notifications  : Bildirim sistemi
 *   - wallet         : Kullanici cuzdani (Iyzico/PayTR entegrasyonlu)
 *
 * ILETISIM
 *   - contact        : Iletisim formu ve kayitlari
 *   - support        : Destek talebi (ticket sistemi)
 *   - telegram       : Telegram bot entegrasyonu
 *
 * IZLEME
 *   - audit          : HTTP/auth event log, analitik
 *   - theme          : UI tema ayarlari
 *
 * AI
 *   - ai             : Icerik olusturma (Groq/OpenAI)
 *
 * DEPOLAMA
 *   - storage        : Dosya yukleme (Cloudinary/local)
 */
