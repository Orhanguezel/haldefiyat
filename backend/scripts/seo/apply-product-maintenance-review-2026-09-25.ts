/**
 * 25 Eylul 2026 urun bakim incelemesi.
 *
 * - Bes dogrulanmis balik urununu ve Kuzu Kulagi editoryalini kaynaklarda
 *   desteklenmeyen sayisal/bolgesel iddialardan temizler.
 * - Kamit'i, kefal icin kullanilan mahalli ad oldugu icin Kefal ailesine baglar.
 * - Kimligi dogrulanamayan Masko Deniz editoryalini yayindan kaldirir.
 *
 * Varsayilan dry-run:
 *   bun scripts/seo/apply-product-maintenance-review-2026-09-25.ts
 * Uygulama:
 *   bun scripts/seo/apply-product-maintenance-review-2026-09-25.ts --apply
 */
import "dotenv/config";

import { revalidateFrontendTag } from "../../src/core/revalidate";
import { pool } from "../../src/db/client";

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
const REVIEWED_BY = "codex-source-review-2026-09-25";
const reviewed: Editorial[] = [
  {
    slug: "torik",
    about:
      "Torik, palamutla aynı tür olan Sarda sarda'nın piyasada iri boy sınıfı için kullanılan adıdır; ayrı bir balık türü değildir. Bu sayfa yalnız kaynak hallerde Torik adıyla ve kilogram birimiyle bildirilen toptan fiyatları toplar. Palamut veya donuk ürün kayıtları, kaynak adı farklıysa bu seriye otomatik olarak katılmaz.",
    priceFactors:
      "Torik fiyatında av miktarı, boy sınıfı, karaya çıkış ve sevkiyat noktası, tazelik ile soğuk zincir belirleyicidir. Aynı tür için kullanılan palamut ve torik adlarının halden hale farklı boy eşiklerine dayanabilmesi fiyat karşılaştırmasını etkileyebilir. Bu nedenle tek bir rakam yerine tarih, hal, birim ve fiyat aralığı birlikte okunmalıdır.",
    season:
      "Palamut ve torik göç eden yabani deniz ürünleridir; piyasadaki dönem ve miktar göç rotası, deniz koşulları ve avcılık kurallarına göre değişir. Sezon tarihleri ve av araçlarına ilişkin kurallar yıldan yıla güncellenebileceği için sabit bir ulusal takvim varsayılmaz. Güncel uygulamada Tarım ve Orman Bakanlığı duyuruları esas alınmalıdır.",
    productionRegion:
      "Torik yetiştiricilik ürünü değil, deniz avcılığı ürünüdür. Karadeniz, Marmara ve bağlantılı denizlerdeki göç ve avcılık hareketleri arzı etkileyebilir. Hal kaydındaki şehir, balığın mutlaka o ilde avlandığını değil, toptan fiyat kaydının o piyasada oluştuğunu gösterir.",
    qualityIndicators:
      "Taze torikte gözlerin berrak, solungaçların canlı renkli, derinin parlak ve et dokusunun sıkı olması beklenir. Keskin veya amonyak benzeri koku, çökmüş göz ve gevşek doku tazelik kaybına işaret edebilir. Teslimatta boy sınıfı, kilogram beyanı, buzlama ve taşıma sıcaklığı birlikte kontrol edilmelidir.",
    culinaryUses:
      "Torik; ızgara, tava, fırın, buğulama ve lakerda gibi farklı hazırlamalarda kullanılır. Yağlı yapısı ve dilim kalınlığı pişirme yöntemini etkiler. Taze, dondurulmuş ve işlenmiş ürünler aynı ticari kalem olmadığından fiyatları doğrudan karşılaştırılmamalıdır.",
    relatedSlugs: ["palamut", "lufer", "uskumru", "kolyoz"],
  },
  {
    slug: "kotek",
    about:
      "Kötek, resmî su ürünleri kaynaklarında Umbrina cirrosa için kullanılan piyasa adlarından biridir. Bazı yerlerde farklı yerel adlarla anılabildiği için bu sayfa yalnız kaynak hallerde Kötek adıyla bildirilen kilogram kayıtlarını gösterir. Perakende etiketleri ile toptan hal fiyatları aynı kapsamda değildir.",
    priceFactors:
      "Kötek fiyatını günlük av miktarı, balığın boyu, tazelik, karaya çıkış noktası ve sevkiyat koşulları etkiler. Tek bir halin farklı boyları aynı ad altında toplaması asgari ve azami fiyat aralığını genişletebilir. Sağlıklı karşılaştırma için ürün adı, birim, tarih ve kaynak hal birlikte değerlendirilmelidir.",
    season:
      "Kötek arzı deniz ve hava koşulları, avcılık faaliyeti ve yürürlükteki su ürünleri kurallarına göre değişir. Ülke genelinde her yıl aynı aylarda aynı miktarın geleceği varsayılamaz. Güncel yasak, boy ve araç sınırlamaları için Bakanlığın yürürlükteki tebliğleri kontrol edilmelidir.",
    productionRegion:
      "Kötek deniz avcılığıyla piyasaya giren bir üründür; kayıtlarda avlandığı saha ile satıldığı hal aynı yer olmayabilir. Bu nedenle sayfadaki şehir bilgisi menşe bilgisi olarak yorumlanmamalıdır. Kaynak av bölgesini ayrıca vermiyorsa sistem bölge tahmini üretmez.",
    qualityIndicators:
      "Taze üründe gözlerin berrak, solungaçların canlı renkli, derinin nemli ve etin sıkı olması beklenir. Ekşi veya amonyak benzeri koku, çökmüş göz ve yumuşak doku kalite kaybına işaret edebilir. Boy, bütünlük, buzlama ve soğuk zincir teslimatta birlikte kontrol edilmelidir.",
    culinaryUses:
      "Kötek bütün, dilim veya fileto olarak ızgara, fırın, tava ve buğulama tariflerinde değerlendirilebilir. Pişirme seçimi ürünün boyuna ve et kalınlığına göre değişir. Temizlenmiş, taze ve dondurulmuş ürünler ayrı ticari formlar olduğundan fiyatları aynı kabul edilmemelidir.",
    relatedSlugs: ["eskina-deniz", "minekop", "levrek", "mercan"],
  },
  {
    slug: "lagos",
    about:
      "Lagos, hal ve avcılık kayıtlarında Epinephelus cinsi grida-lagos grubu için kullanılan bir piyasa adıdır. Kaynak kayıt türü ayırmadığında bu sayfa belirli bir bilimsel tür iddiası kurmadan, Lagos adıyla bildirilen kilogram fiyatlarını gösterir. Toptan fiyat, perakende satış fiyatı değildir.",
    priceFactors:
      "Lagos fiyatında tür ve boy farkı, günlük av miktarı, tazelik, sevkiyat mesafesi ve soğuk zincir etkilidir. Kaynak hal ayrıntılı tür ya da boy sınıfı vermiyorsa farklı nitelikteki ürünler aynı fiyat aralığında görünebilir. Bu nedenle tarih ve hal bazındaki asgari-azami aralık ortalamadan daha açıklayıcı olabilir.",
    season:
      "Lagos avcılığı dönemsel ve teknik sınırlamalara tabidir; yürürlükteki ticari avcılık tebliği belirli dönem ve yöntemler için kurallar koyar. Kurallar değişebileceği için sayfada kalıcı bir serbest av takvimi verilmez. Ticaret veya av kararı için güncel resmî tebliğ kontrol edilmelidir.",
    productionRegion:
      "Lagos kayıtları Akdeniz ve Ege ile ilişkili toptan piyasalarda görülebilir; ancak hal şehri tek başına av yerini kanıtlamaz. Ürün başka bir limandan sevk edilmiş olabilir. Kaynak menşe veya av sahası bildirmiyorsa sistem bu bilgiyi tahmin etmez.",
    qualityIndicators:
      "Taze üründe göz, solungaç, deri ve et dokusu birlikte kontrol edilir; berrak göz, canlı solungaç ve sıkı doku olumlu göstergelerdir. Keskin koku, çökmüş göz ve gevşek doku tazelik kaybına işaret edebilir. Tür, boy, yasal asgari ölçü ve izlenebilirlik belgeleri ticari teslimatta ayrıca doğrulanmalıdır.",
    culinaryUses:
      "Lagos kalın et yapısına uygun olarak ızgara, fırın, buğulama ve çorba gibi hazırlamalarda kullanılabilir. Porsiyon ve pişirme süresi balığın boyuna ve kesim şekline göre ayarlanır. Yasal boy ve av kurallarına uymayan ürün satın alınmamalı, taze ve dondurulmuş fiyatları ayrı değerlendirilmelidir.",
    relatedSlugs: ["orfoz", "levrek", "mercan", "sinarit"],
  },
  {
    slug: "ispari",
    about:
      "İspari, kaynaklarda isparoz adı da kullanılabilen Diplodus annularis için yaygın piyasa adlarından biridir. Bu sayfa yalnız hallerde İspari adıyla ve kilogram birimiyle bildirilen toptan fiyatları bir araya getirir. Benzer görünen karagöz grubu balıklar kaynakta ayrı adla geçiyorsa bu seriye katılmaz.",
    priceFactors:
      "İspari fiyatını günlük av miktarı, boy, tazelik, ayıklama durumu ve sevkiyat koşulları etkiler. Küçük ve iri ürünlerin tek ad altında kaydedilmesi fiyat aralığını genişletebilir. Değerleri karşılaştırırken ürün adı, birim, tarih ve kaynak hal birlikte okunmalıdır.",
    season:
      "İspari yıl içinde farklı dönemlerde hale gelebilir; miktar avcılık faaliyeti, deniz-hava koşulları ve yerel arza göre değişir. Belirli bir ayı tüm Türkiye için sabit sezon olarak göstermek doğru değildir. Güncel avcılık kuralları ve boy sınırları için resmî tebliğ esas alınmalıdır.",
    productionRegion:
      "İspari yabani deniz balığıdır ve kıyısal avcılıkla piyasaya girer. Hal kaydının şehri, ürünün avlandığı bölgeyi kesin olarak göstermez; sevkiyatla başka bir piyasaya ulaşabilir. Kaynak av sahasını bildirmiyorsa sistem menşe tahmini yapmaz.",
    qualityIndicators:
      "Taze isparide gözlerin berrak, solungaçların canlı renkli, derinin parlak ve etin sıkı olması beklenir. Ekşi ya da amonyak benzeri koku, mat deri ve gevşek doku kalite kaybına işaret edebilir. Boy, bütünlük, buzlama ve soğuk zincir teslimatta birlikte kontrol edilmelidir.",
    culinaryUses:
      "İspari boyuna göre tava, ızgara, fırın veya buğulama yöntemleriyle hazırlanabilir. Küçük balıklarda temizleme ve kılçık ayıklama, kullanım amacına göre önem kazanır. Taze ve dondurulmuş ürünler aynı fiyat serisi gibi değerlendirilmemelidir.",
    relatedSlugs: ["karagoz", "mirmir", "mercan", "barbun"],
  },
  {
    slug: "sarikanat",
    about:
      "Sarıkanat, lüferle aynı tür olan Pomatomus saltatrix'in piyasadaki boy sınıflarından biridir; ayrı bir balık türü değildir. Bu sayfa yalnız kaynak hallerde Sarıkanat adıyla bildirilen kilogram fiyatlarını gösterir. Çinekop, lüfer ve kofana kayıtları kaynakta ayrı adlarla yer alıyorsa kendi serilerinde tutulur.",
    priceFactors:
      "Sarıkanat fiyatında boy sınıfı, günlük av miktarı, tazelik, karaya çıkış noktası ve sevkiyat koşulları belirleyicidir. Boy adlarının piyasa uygulamasında tutarlı kullanılmaması fiyat aralığını etkileyebilir. Karşılaştırma yaparken ürün adı, birim, tarih, hal ve asgari-azami değerler birlikte incelenmelidir.",
    season:
      "Lüfer grubunun piyasaya gelişi göç hareketleri, deniz koşulları ve avcılık kurallarıyla değişir. Sezon ve yasal boy sınırları dönemsel olarak güncellenebileceği için sabit bir takvim verilmez. Güncel ticari veya amatör avcılık kararı için Bakanlığın yürürlükteki tebliğleri esas alınmalıdır.",
    productionRegion:
      "Sarıkanat yabani deniz balığıdır; Karadeniz, Marmara, boğazlar ve bağlantılı denizlerdeki göç hareketleri arzı etkileyebilir. Hal kaydındaki şehir, ürünün mutlaka o ilde avlandığını göstermez. Kaynak menşe vermiyorsa sayfa ayrıca av bölgesi tahmini üretmez.",
    qualityIndicators:
      "Taze sarıkanatta gözlerin berrak, solungaçların canlı renkli, derinin parlak ve et dokusunun sıkı olması beklenir. Keskin koku, çökmüş göz ve gevşek doku tazelik kaybına işaret edebilir. Boy sınıfı, kilogram bilgisi, buzlama ve soğuk zincir teslimatta birlikte kontrol edilmelidir.",
    culinaryUses:
      "Sarıkanat ızgara, tava, fırın ve buğulama yöntemleriyle hazırlanabilir. Yağlı yapısı nedeniyle pişirme süresi ve sıcaklığı ürünün boyuna göre ayarlanmalıdır. Çinekop, sarıkanat ve lüfer gibi boy adları ticari olarak ayrı fiyatlandırılabileceğinden fiyatları doğrudan birleştirilmemelidir.",
    relatedSlugs: ["lufer", "cinekop", "palamut", "torik"],
  },
  {
    slug: "kuzu-kulagi",
    about:
      "Kuzu kulağı, Rumex cinsindeki yenilebilir yapraklı bitkiler için kullanılan bir piyasa adıdır; kaynak ve yöreye göre tür farkı bulunabilir. Bu sayfa Kuzu Kulağı adıyla bildirilen toptan fiyatları gösterir. Demet, bağ, paket veya kilogram gibi farklı satış birimleri birbirine dönüştürülmeden ayrı kayıt olarak korunur.",
    priceFactors:
      "Kuzu kulağı fiyatını hasat miktarı, yaprak kalitesi, demet veya paket büyüklüğü, sevkiyat süresi ve soğuk zincir etkiler. Birim farkı fiyat seviyesini doğrudan değiştirdiği için adet, bağ, demet ve kilogram değerleri aynı seride karşılaştırılmaz. Hal ve tarih bilgisi fiyatla birlikte okunmalıdır.",
    season:
      "Arz açık alan veya kontrollü yetiştirme koşullarına, iklime ve yerel toplama-üretim takvimine göre değişir. Tek bir bölgedeki hasat dönemi tüm Türkiye'ye genellenemez. Sayfadaki güncel kayıt tarihleri ürünün ilgili halde fiilen görüldüğü dönemi anlamak için esas alınmalıdır.",
    productionRegion:
      "Kuzu kulağı doğadan toplanan veya yetiştirilen yapraklı ürün olarak piyasaya gelebilir. Hal kaydı, ürünün satıldığı piyasayı belirtir; yetiştirildiği veya toplandığı yeri kesin olarak kanıtlamaz. Kaynak menşe bilgisi vermiyorsa sistem bölge tahmini yapmaz.",
    qualityIndicators:
      "Taze üründe yaprakların diri, temiz ve doğal rengini korumuş olması; ezilme, çürüme ve aşırı solma bulunmaması beklenir. Demet veya pakette birim ağırlığı ve yaprak bütünlüğü kontrol edilmelidir. Ürün hızla su kaybedebildiği için teslimat süresi ve uygun serinlik kaliteyi etkiler.",
    culinaryUses:
      "Kuzu kulağı salata, çorba, börek ve zeytinyağlı yemeklerde kullanılabilir; ekşimsi tadı ürünün ayırt edici özelliğidir. Tüketim öncesi yapraklar ayıklanıp iyice yıkanmalıdır. Toplama ürünlerinde tür kimliği bilinmiyorsa yalnız uzman tarafından doğrulanmış ürünler kullanılmalıdır.",
    relatedSlugs: ["labada", "pazi", "ispanak", "roka"],
  },
];

const affectedSlugs = [...reviewed.map((item) => item.slug), "kamit-deniz", "masko-deniz"];
const placeholders = affectedSlugs.map(() => "?").join(",");

async function snapshot() {
  const [rows] = await pool.query(
    `SELECT p.slug,p.canonical_slug,p.seo_index,p.data_quality,p.search_volume,
            e.source,e.reviewed_by,e.published_at
       FROM hf_products p
       LEFT JOIN hf_product_editorial e ON e.product_slug=p.slug
      WHERE p.slug IN (${placeholders}) ORDER BY p.slug`,
    affectedSlugs,
  );
  return rows;
}

async function main() {
  console.log(JSON.stringify({ mode: APPLY ? "apply" : "dry-run", before: await snapshot() }, null, 2));
  if (!APPLY) return;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of reviewed) {
      await connection.query(
        `INSERT INTO hf_product_editorial
          (product_slug,about_md,price_factors_md,season_md,production_region_md,
           quality_indicators_md,culinary_uses_md,related_slugs,source,reviewed_by,reviewed_at,published_at)
         VALUES (?,?,?,?,?,?,?,?,'manual',?,NOW(3),NOW(3))
         ON DUPLICATE KEY UPDATE about_md=VALUES(about_md),price_factors_md=VALUES(price_factors_md),
           season_md=VALUES(season_md),production_region_md=VALUES(production_region_md),
           quality_indicators_md=VALUES(quality_indicators_md),culinary_uses_md=VALUES(culinary_uses_md),
           related_slugs=VALUES(related_slugs),source='manual',reviewed_by=VALUES(reviewed_by),
           reviewed_at=NOW(3),published_at=NOW(3)`,
        [item.slug,item.about,item.priceFactors,item.season,item.productionRegion,item.qualityIndicators,item.culinaryUses,JSON.stringify(item.relatedSlugs),REVIEWED_BY],
      );
    }

    await connection.query(
      `UPDATE hf_products p JOIN hf_products k ON k.slug='kefal' AND p.unit=k.unit
       SET p.canonical_slug='kefal',p.seo_index=0,p.family_slug=NULL WHERE p.slug='kamit-deniz'`,
    );
    await connection.query(
      `INSERT INTO hf_redirects (source_path,type,target_url,note,is_active)
       VALUES ('/urun/kamit-deniz','301','/urun/kefal','Kamit kefal icin mahalli ad; kaynak incelemesi 2026-09-25',1)
       ON DUPLICATE KEY UPDATE type='301',target_url='/urun/kefal',note=VALUES(note),is_active=1`,
    );
    await connection.query(
      `UPDATE hf_product_editorial SET published_at=NULL,reviewed_by=?,reviewed_at=NOW(3)
       WHERE product_slug IN ('kamit-deniz','masko-deniz')`,
      [REVIEWED_BY],
    );
    await connection.query("UPDATE hf_products SET seo_index=0 WHERE slug='masko-deniz'");
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  for (let attempt = 0; attempt < 4; attempt += 1) await revalidateFrontendTag("prices");
  console.log(JSON.stringify({ after: await snapshot() }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(() => pool.end());
