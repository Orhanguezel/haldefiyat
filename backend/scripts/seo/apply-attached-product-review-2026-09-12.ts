/**
 * 12 Eylul 2026 urun SEO incelemesinde onaylanan sayfalari guvenli bicimde
 * zenginlestirir ve yalnizca mevcut indeks kapisini gecenleri acar.
 *
 * Varsayilan dry-run:
 *   bun scripts/seo/apply-attached-product-review-2026-09-12.ts
 * Canli uygulama:
 *   bun scripts/seo/apply-attached-product-review-2026-09-12.ts --apply
 */
import "dotenv/config";
import { revalidateFrontendTag } from "../../src/core/revalidate";
import { pool } from "../../src/db/client";
import { submitToIndexNow } from "../../src/modules/indexnow";

type Editorial = {
  slug: string;
  about: string;
  priceFactors: string;
  season: string;
  productionRegion: string;
  qualityIndicators: string;
  culinaryUses: string;
  relatedSlugs: string[];
};

const APPLY = process.argv.includes("--apply");
const REVIEWED_BY = "codex-seo-review-2026-09-12";

const editorials: Editorial[] = [
  {
    slug: "palamut",
    about:
      "Palamut, bilimsel adı Sarda sarda olan, sürüler hâlinde göç eden ve Türkiye'de özellikle Karadeniz ile Marmara balıkçılığı açısından önem taşıyan yabani bir deniz balığıdır. Bu sayfadaki değerler perakende etiket fiyatı değil, belediye ve resmî kaynaklardan derlenen toptan piyasa kayıtlarıdır. Piyasada palamut ile daha iri boydaki torik aynı türün farklı boyları olarak anılabilse de burada yalnızca Palamut adıyla yayımlanan kilogram kayıtları karşılaştırılır.",
    priceFactors:
      "Palamut fiyatında av miktarı, balığın boyu, karaya çıkarıldığı liman, sevkiyat mesafesi ve soğuk zincirin korunması belirleyicidir. Sürülerin kıyıya yaklaşmasıyla kısa sürede yükselen arz fiyatı aşağı çekebilir; fırtına, avın kesilmesi veya şehirler arası sevkiyat ise fiyatı yükseltebilir. Hallerin ürün boyu ve satış birimini farklı tanımlayabilmesi nedeniyle tek bir fiyat yerine tarih ve hal bazındaki aralığa bakmak daha sağlıklıdır.",
    season:
      "Palamut arzı çoğunlukla yaz sonundan sonbahar sonuna kadar güçlenir; göç rotası ve deniz koşulları sezonun başlangıcını ve süresini her yıl değiştirebilir. 2026 yılında küçük ölçekli uzatma ağı balıkçıları için avcılık 15 Ağustos'ta, genel gırgır sezonu ise 1 Eylül'de açılmıştır. Av takvimi ve yöntemlere ilişkin güncel kurallar için Tarım ve Orman Bakanlığının duyuruları esas alınmalıdır.",
    productionRegion:
      "Palamut yetiştiricilik ürünü değildir; piyasaya avcılıkla girer. Türkiye'deki arzın önemli bölümü Karadeniz ve Marmara'daki avcılık ve karaya çıkış noktalarından gelir, sezonun seyrine göre Ege bağlantılı kayıtlar da görülebilir. Hal fiyatındaki şehir adı balığın mutlaka o şehirde avlandığını değil, kaydın o toptan piyasada oluştuğunu gösterir.",
    qualityIndicators:
      "Taze palamutta gözlerin berrak ve dışa bombeli, solungaçların canlı kırmızı-pembe, derinin parlak ve etin sıkı olması beklenir. Keskin veya amonyak benzeri koku, çökmüş göz, gevşek doku ve karın bölgesinde dağılma tazelik kaybına işaret eder. Ürün tesliminde boy sınıfı, kilogram/adet beyanı, buzlama ve taşıma sıcaklığı birlikte kontrol edilmelidir.",
    culinaryUses:
      "Palamut ızgara, tava, fırın, buğulama ve pilaki gibi hazırlamalarda değerlendirilir. Yağ oranı ve dilim kalınlığı pişirme yöntemini etkiler. Dondurulmuş palamut ayrı bir ticari kalem olduğundan, taze ürün fiyatıyla doğrudan karşılaştırılmamalıdır.",
    relatedSlugs: ["hamsi", "istavrit", "levrek", "mercan"],
  },
  {
    slug: "iskorpit",
    about:
      "İskorpit, Türkiye'deki balık hallerinde birden fazla Scorpaena türü için kullanılabilen, kayalık diplerde yaşayan yabani deniz balıklarının ortak piyasa adıdır. Ege ve Akdeniz başta olmak üzere kıyı balıkçılığında görülür. Bu sayfa perakende satış fiyatı değil, İskorpit adıyla yayımlanmış toptan hal kayıtlarını gösterir; tür ve boy ayrımı kaynakta ayrıca verilmediğinde fiyat aralığı genişleyebilir.",
    priceFactors:
      "İskorpit fiyatı balığın türü ve boyu, günlük av miktarı, tazelik, ayıklama durumu ve karaya çıkış noktasına göre değişir. Tekne çıkışını sınırlayan hava koşulları arzı azaltabilir. Aynı gün küçük ve iri balıkların tek ürün adı altında kaydedilmesi, asgari ve azami fiyat arasındaki farkı büyütebilir; bu nedenle ortalama fiyat mutlaka hal ve tarih bilgisiyle birlikte okunmalıdır.",
    season:
      "İskorpit yılın farklı dönemlerinde piyasaya çıkabilse de arz düzenli değildir; dip balıkçılığı faaliyeti, hava koşulları ve yürürlükteki av araçları kısıtları günlük miktarı etkiler. Belirli bir ayı ülke çapında sabit hasat dönemi gibi göstermek yanıltıcıdır. Ticari avcılık kuralları dönemsel olarak değişebildiğinden güncel Bakanlık tebliğleri kontrol edilmelidir.",
    productionRegion:
      "İskorpit yetiştiricilikten değil deniz avcılığından gelir. Ege ve Akdeniz kıyılarındaki kayalık-dip habitatları ile Marmara ve Karadeniz'deki uygun alanlarda avlanabilir. Hal kaydı, ürünün satışa sunulduğu toptan piyasayı belirtir; avlandığı deniz veya liman bilgisi kaynakta yer almıyorsa ayrıca çıkarım yapılmaz.",
    qualityIndicators:
      "Taze üründe gözler berrak, solungaçlar kırmızı-pembe, deri nemli ve et dokusu sıkı olmalıdır. Ekşi ya da amonyak benzeri koku, çökmüş göz ve yumuşak doku kalite kaybı göstergesidir. İskorpitin sırt bölgesindeki dikenleri yaralanmaya yol açabildiğinden ayıklama işlemi deneyimli kişilerce, koruyucu önlemle yapılmalıdır.",
    culinaryUses:
      "İskorpit yoğun aromalı eti nedeniyle balık çorbası, buğulama, fırın ve tava tariflerinde kullanılır. İri ve küçük ürünün et verimi farklı olduğundan kullanım amacı satın alma sırasında belirlenmelidir. Temizleme sırasında dikenlere dikkat edilmeli, ürün uygun soğuk zincirde tutulmalı ve yeterince pişirilmelidir.",
    relatedSlugs: ["mercan", "mirmir", "barbun", "levrek"],
  },
];

const slugs = editorials.map((item) => item.slug);
const placeholders = slugs.map(() => "?").join(",");

const signalsSql = `
  SELECT p.slug, p.seo_index, p.data_quality, p.search_volume,
         COUNT(ph.id) AS rows30,
         COUNT(DISTINCT ph.market_id) AS markets30,
         COUNT(DISTINCT ph.recorded_date) AS days30,
         MAX(ph.recorded_date) AS last_date,
         e.published_at,
         CHAR_LENGTH(COALESCE(e.about_md, '')) +
         CHAR_LENGTH(COALESCE(e.price_factors_md, '')) +
         CHAR_LENGTH(COALESCE(e.season_md, '')) +
         CHAR_LENGTH(COALESCE(e.production_region_md, '')) +
         CHAR_LENGTH(COALESCE(e.quality_indicators_md, '')) +
         CHAR_LENGTH(COALESCE(e.culinary_uses_md, '')) AS editorial_chars
  FROM hf_products p
  LEFT JOIN hf_price_history ph
    ON ph.product_id = p.id
   AND ph.recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
  LEFT JOIN hf_product_editorial e ON e.product_slug = p.slug
  WHERE p.slug IN (${placeholders})
  GROUP BY p.id, p.slug, p.seo_index, p.data_quality, p.search_volume,
           e.published_at, e.about_md, e.price_factors_md, e.season_md,
           e.production_region_md, e.quality_indicators_md, e.culinary_uses_md
  ORDER BY p.slug
`;

async function readSignals() {
  const [rows] = await pool.query(signalsSql, slugs);
  return rows;
}

async function main() {
  console.log(JSON.stringify({ mode: APPLY ? "apply" : "dry-run", before: await readSignals() }, null, 2));
  if (!APPLY) return;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of editorials) {
      const sections = [item.about, item.priceFactors, item.season, item.productionRegion, item.qualityIndicators, item.culinaryUses];
      if (sections.some((section) => section.length < 220)) {
        throw new Error(`${item.slug}: editoryel bolumlerden biri kalite esiginin altinda`);
      }
      await connection.query(
        `INSERT INTO hf_product_editorial
          (product_slug, about_md, price_factors_md, season_md, production_region_md,
           quality_indicators_md, culinary_uses_md, related_slugs, source,
           reviewed_by, reviewed_at, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'manual', ?, NOW(3), NOW(3))
         ON DUPLICATE KEY UPDATE
           about_md=VALUES(about_md), price_factors_md=VALUES(price_factors_md),
           season_md=VALUES(season_md), production_region_md=VALUES(production_region_md),
           quality_indicators_md=VALUES(quality_indicators_md), culinary_uses_md=VALUES(culinary_uses_md),
           related_slugs=VALUES(related_slugs), source='manual', reviewed_by=VALUES(reviewed_by),
           reviewed_at=NOW(3), published_at=COALESCE(published_at, NOW(3))`,
        [item.slug, ...sections, JSON.stringify(item.relatedSlugs), REVIEWED_BY],
      );
    }

    await connection.query(
      `UPDATE hf_products p
       LEFT JOIN (
         SELECT product_id, COUNT(*) rows30, COUNT(DISTINCT market_id) markets30
         FROM hf_price_history
         WHERE recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY product_id
       ) s ON s.product_id=p.id
       LEFT JOIN hf_product_editorial e ON e.product_slug=p.slug
       SET p.data_quality=LEAST(100,
         (COALESCE(s.rows30,0)>=1)*40 + (COALESCE(s.markets30,0)>=3)*25 +
         (COALESCE(NULLIF(p.display_name,''),p.name_tr) NOT LIKE '%.%' AND
          COALESCE(NULLIF(p.display_name,''),p.name_tr) NOT REGEXP '^[[:alpha:]]([.]|[[:space:]])')*15 +
         (COALESCE(JSON_LENGTH(p.aliases),0)>=1)*10 + (e.published_at IS NOT NULL)*10)
       WHERE p.slug IN (${placeholders})`,
      slugs,
    );

    // Genel kapi: 3+ market. Tutarlı nis kapi: son 30 gunde 15+ ayri gun.
    // Her ikisinde de yayinli ozgun editoryel ve dq>=70 zorunlu.
    await connection.query(
      `UPDATE hf_products p
       JOIN hf_product_editorial e ON e.product_slug=p.slug AND e.published_at IS NOT NULL
       JOIN (
         SELECT product_id, COUNT(DISTINCT market_id) markets30,
                COUNT(DISTINCT recorded_date) days30
         FROM hf_price_history
         WHERE recorded_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY product_id
       ) s ON s.product_id=p.id
       SET p.seo_index=1
       WHERE p.slug IN (${placeholders}) AND p.is_active=1 AND p.canonical_slug IS NULL
         AND p.data_quality>=70 AND (s.markets30>=3 OR s.days30>=15)`,
      slugs,
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const after = await readSignals();
  // Frontend iki PM2 worker ile calisiyor. Tag gecersizlestirme worker-yerel
  // olabildigi icin ic load balancer uzerinden birkac kez donerek ikisini de yenile.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    await revalidateFrontendTag("prices");
  }
  const indexNow = await submitToIndexNow(slugs.map((slug) => `/urun/${slug}`));
  console.log(JSON.stringify({ after, indexNow }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => pool.end());
