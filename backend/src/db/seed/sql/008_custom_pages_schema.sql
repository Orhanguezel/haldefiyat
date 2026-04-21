SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- ── Tablolar ────────────────────────────────────────────────────────────────

DROP TABLE IF EXISTS `custom_pages_i18n`;
DROP TABLE IF EXISTS `custom_pages`;

CREATE TABLE `custom_pages` (
  `id`               CHAR(36)     NOT NULL,
  `module_key`       VARCHAR(100) NOT NULL DEFAULT 'kurumsal',
  `is_published`     TINYINT      NOT NULL DEFAULT 0,
  `display_order`    INT          NOT NULL DEFAULT 0,
  `featured_image`   VARCHAR(500)          DEFAULT NULL,
  `storage_asset_id` CHAR(36)              DEFAULT NULL,
  `images`           JSON                  DEFAULT (JSON_ARRAY()),
  `storage_image_ids` JSON                 DEFAULT (JSON_ARRAY()),
  `created_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`       DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `custom_pages_module_idx`    (`module_key`),
  KEY `custom_pages_published_idx` (`is_published`),
  KEY `custom_pages_order_idx`     (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `custom_pages_i18n` (
  `page_id`          CHAR(36)     NOT NULL,
  `locale`           VARCHAR(10)  NOT NULL DEFAULT 'tr',
  `title`            VARCHAR(500) NOT NULL,
  `slug`             VARCHAR(500) NOT NULL,
  `content`          LONGTEXT              DEFAULT NULL,
  `summary`          LONGTEXT              DEFAULT NULL,
  `meta_title`       VARCHAR(255)          DEFAULT NULL,
  `meta_description` VARCHAR(500)          DEFAULT NULL,
  UNIQUE KEY `ux_cp_i18n_locale_slug` (`locale`, `slug`),
  KEY `fk_cp_i18n_page` (`page_id`),
  CONSTRAINT `fk_cp_i18n_page`
    FOREIGN KEY (`page_id`) REFERENCES `custom_pages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Seed: yasal sayfalar ─────────────────────────────────────────────────────

SET @gizlilik_id     = '11111111-0001-0001-0001-000000000001';
SET @kullanim_id     = '11111111-0002-0002-0002-000000000002';
SET @kvkk_id         = '11111111-0003-0003-0003-000000000003';
SET @hakkimizda_id   = '11111111-0004-0004-0004-000000000004';

INSERT INTO `custom_pages`
  (`id`, `module_key`, `is_published`, `display_order`)
VALUES
  (@gizlilik_id, 'yasal', 1, 10),
  (@kullanim_id, 'yasal', 1, 20),
  (@kvkk_id,     'yasal', 1, 30),
  (@hakkimizda_id, 'kurumsal', 1, 5);

INSERT INTO `custom_pages_i18n`
  (`page_id`, `locale`, `title`, `slug`, `meta_title`, `meta_description`, `content`)
VALUES

-- ── 1. Gizlilik Politikası ───────────────────────────────────────────────────
(
  @gizlilik_id, 'tr',
  'Gizlilik Politikası',
  'gizlilik-politikasi',
  'Gizlilik Politikası — HaldeFiyat',
  'HaldeFiyat gizlilik politikası: kişisel verilerinizi nasıl topladığımızı, kullandığımızı ve koruduğumuzu öğrenin.',
  '<h2>Gizlilik Politikası</h2>
<p><strong>Son güncellenme:</strong> Nisan 2026</p>

<h3>1. Veri Sorumlusu</h3>
<p>Bu platformu işleten veri sorumlusu <strong>HaldeFiyat</strong>''dır. İletişim: <a href="mailto:iletisim@haldefiyat.com">iletisim@haldefiyat.com</a></p>

<h3>2. Toplanan Veriler</h3>
<ul>
  <li><strong>Hesap verileri:</strong> E-posta adresi, şifre özeti (kayıt sırasında)</li>
  <li><strong>Kullanım verileri:</strong> Ziyaret edilen sayfalar, arama sorguları, favori ürünler</li>
  <li><strong>Teknik veriler:</strong> IP adresi, tarayıcı türü, cihaz bilgisi, çerez kimlikleri</li>
  <li><strong>Uyarı verileri:</strong> Fiyat uyarısı oluşturduğunuzda belirttiğiniz e-posta veya Telegram bilgisi</li>
</ul>

<h3>3. Verilerin Kullanım Amacı</h3>
<ul>
  <li>Hizmetlerin sunulması ve kişiselleştirilmesi</li>
  <li>Fiyat uyarılarının iletilmesi</li>
  <li>Bülten aboneliğinin yönetilmesi</li>
  <li>Güvenlik, dolandırıcılık önleme ve teknik sorun giderme</li>
  <li>Anonim kullanım istatistikleri ile hizmet kalitesinin iyileştirilmesi</li>
</ul>

<h3>4. Çerezler</h3>
<p>Platform; oturum yönetimi ve tercih kaydı için zorunlu çerezler kullanır. Google Analytics gibi üçüncü taraf çerezlere ilişkin tercihlerinizi tarayıcı ayarlarınızdan yönetebilirsiniz.</p>

<h3>5. Üçüncü Taraflarla Paylaşım</h3>
<p>Kişisel verileriniz; yasal yükümlülükler, platform altyapısı (barındırma, e-posta iletimi) ve açık onayınız dışında üçüncü taraflarla paylaşılmaz.</p>

<h3>6. Veri Saklama</h3>
<p>Hesap verileri hesabınız aktif olduğu sürece saklanır. Hesabınızı silmeniz durumunda verileriniz 30 gün içinde kalıcı olarak silinir.</p>

<h3>7. Haklarınız</h3>
<p>KVKK kapsamındaki haklarınız için <a href="/kvkk">KVKK Aydınlatma Metni</a> sayfasını inceleyiniz veya <a href="/iletisim">İletişim</a> formunu kullanınız.</p>'
),

-- ── 2. Kullanım Koşulları ────────────────────────────────────────────────────
(
  @kullanim_id, 'tr',
  'Kullanım Koşulları',
  'kullanim-kosullari',
  'Kullanım Koşulları — HaldeFiyat',
  'HaldeFiyat kullanım koşulları: platformu kullanmadan önce lütfen okuyunuz.',
  '<h2>Kullanım Koşulları</h2>
<p><strong>Son güncellenme:</strong> Nisan 2026</p>

<h3>1. Kabul</h3>
<p>HaldeFiyat''ı kullanarak bu koşulları kabul etmiş sayılırsınız. Kabul etmiyorsanız lütfen platformu kullanmayınız.</p>

<h3>2. Hizmet Tanımı</h3>
<p>HaldeFiyat; Türkiye''deki hal fiyatlarını takip etmenize, fiyat uyarısı oluşturmanıza ve geçmiş fiyat verilerini incelemenize olanak sağlayan bağımsız bir bilgi platformudur. Sunulan fiyat verileri bilgilendirme amaçlıdır; ticari karar almak için tek başına kullanılmamalıdır.</p>

<h3>3. Kullanıcı Yükümlülükleri</h3>
<ul>
  <li>Platformu yalnızca yasal amaçlarla kullanmak</li>
  <li>Diğer kullanıcıları veya sistemi tehlikeye atacak işlemlerden kaçınmak</li>
  <li>Hesap bilgilerinizin gizliliğini korumak</li>
  <li>Otomatik veri toplama (scraping) araçları kullanmamak</li>
</ul>

<h3>4. Fikri Mülkiyet</h3>
<p>Platform tasarımı, logosu, yazılımı ve orijinal içerikleri HaldeFiyat''a aittir. İzinsiz kopyalanamaz, dağıtılamaz veya ticari amaçla kullanılamaz.</p>

<h3>5. Sorumluluk Sınırı</h3>
<p>HaldeFiyat, fiyat verilerinin doğruluğunu veya eksiksizliğini garanti etmez. Platforma dayanarak alınan ticari kararlardan doğan zararlardan sorumlu tutulamaz.</p>

<h3>6. Hizmet Değişiklikleri</h3>
<p>HaldeFiyat, önceden bildirimde bulunmaksızın hizmetleri kısmen veya tamamen değiştirme, askıya alma ya da sonlandırma hakkını saklı tutar.</p>

<h3>7. Uygulanacak Hukuk</h3>
<p>Bu koşullar Türk Hukuku''na tabidir. Uyuşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.</p>

<h3>8. İletişim</h3>
<p>Sorularınız için: <a href="/iletisim">iletisim@haldefiyat.com</a></p>'
),

-- ── 3. KVKK Aydınlatma Metni ─────────────────────────────────────────────────
(
  @kvkk_id, 'tr',
  'KVKK Aydınlatma Metni',
  'kvkk',
  'KVKK Aydınlatma Metni — HaldeFiyat',
  '6698 sayılı KVKK kapsamında kişisel verilerinizin işlenmesine ilişkin aydınlatma metni.',
  '<h2>Kişisel Verilerin Korunması Kanunu (KVKK) Aydınlatma Metni</h2>
<p><strong>Son güncellenme:</strong> Nisan 2026</p>
<p>6698 sayılı Kişisel Verilerin Korunması Kanunu uyarınca sizi bilgilendirmek amacıyla hazırlanmıştır.</p>

<h3>1. Veri Sorumlusu</h3>
<p><strong>HaldeFiyat</strong> — <a href="mailto:iletisim@haldefiyat.com">iletisim@haldefiyat.com</a></p>

<h3>2. İşlenen Kişisel Veriler</h3>
<table>
  <thead><tr><th>Kategori</th><th>Veri Türü</th></tr></thead>
  <tbody>
    <tr><td>Kimlik</td><td>Ad-soyad (isteğe bağlı profil bilgisi)</td></tr>
    <tr><td>İletişim</td><td>E-posta adresi, Telegram kullanıcı adı</td></tr>
    <tr><td>İşlem Güvenliği</td><td>IP adresi, oturum bilgisi, erişim logları</td></tr>
    <tr><td>Pazarlama</td><td>Bülten abonelik tercihi (açık onay ile)</td></tr>
  </tbody>
</table>

<h3>3. İşleme Amaçları ve Hukuki Dayanaklar</h3>
<ul>
  <li><strong>Hizmet sunumu:</strong> Sözleşmenin ifası (KVKK m.5/2-c)</li>
  <li><strong>Fiyat uyarıları:</strong> Açık rıza (KVKK m.5/1)</li>
  <li><strong>Güvenlik ve log kaydı:</strong> Veri sorumlusunun meşru menfaati (KVKK m.5/2-f)</li>
  <li><strong>Bülten gönderimi:</strong> Açık rıza (KVKK m.5/1)</li>
</ul>

<h3>4. Aktarım</h3>
<p>Kişisel verileriniz; barındırma (hosting) altyapısı ve e-posta iletim hizmeti kapsamında yurt içindeki teknik hizmet sağlayıcılarla paylaşılabilir. Yurt dışına aktarım yapılmamaktadır.</p>

<h3>5. Saklama Süresi</h3>
<p>Verileriniz, ilgili amaçla sınırlı olmak üzere hesabınız aktif olduğu süre boyunca ve ilgili mevzuatın öngördüğü süreler kadar saklanır.</p>

<h3>6. Haklarınız (KVKK m.11)</h3>
<ul>
  <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
  <li>İşlenmişse buna ilişkin bilgi talep etme</li>
  <li>İşlenme amacını ve amaca uygun kullanılıp kullanılmadığını öğrenme</li>
  <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
  <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
  <li>Silinmesini veya yok edilmesini isteme</li>
  <li>İşlemenin otomatik sistemlerle yapılması halinde aleyhine sonuç doğurmasına itiraz etme</li>
  <li>Kanuna aykırı işleme nedeniyle zarara uğraması halinde zararın giderilmesini talep etme</li>
</ul>

<h3>7. Başvuru</h3>
<p>Haklarınızı kullanmak için <a href="/iletisim">İletişim</a> sayfasından yazılı başvuruda bulunabilirsiniz. Başvurunuz en geç 30 gün içinde yanıtlanır.</p>'
),
(
  @hakkimizda_id, 'tr', 
  'Hakkımızda', 
  'hakkimizda',
  'Hakkımızda — HaldeFiyat', 
  'Türkiye''nin en kapsamlı dijital hal fiyatları platformu olan HaldeFiyat hakkında detaylı bilgi edinin.',
  'HaldeFiyat, Türkiye''nin dijital tarım dönüşümüne katkı sağlamak amacıyla kurulan, üretici ile tüketici arasındaki bilgi boşluğunu verinin gücüyle kapatan bağımsız bir platformdur. Geleneksel tarım ticaretinde fiyat bilgisine erişim her zaman kısıtlı ve dağınıktı. HaldeFiyat olarak, her sabah gün doğumunda Türkiye''nin dört bir yanındaki hallerden akan binlerce satırlık veriyi topluyor, tasnif ediyor ve herkesin anlayabileceği stratejik bir bilgiye dönüştürüyoruz.'
);
