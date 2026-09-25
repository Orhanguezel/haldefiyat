import { pool } from "@/db/client";
import { activatePressCampaign, approvePressCampaign, preflightPressCampaign } from "@/modules/press-pr/delivery";

type Plan = {
  slug: string;
  name: string;
  subject: string;
  pitch: string;
  segmentTags: string[];
  publicationTypes: string[];
  startAt: string;
  expectedRecipients: number;
};

const sharedFacts = [
  "HaldeFiyat Endeksi önceki haftaya göre %1,2 artarak 71,82 puana yükseldi.",
  "Hafta içi hareketi ölçülen 71 ürünün 46’sında fiyat geriledi, 20’sinde yükseldi, 5’i yatay kaldı.",
  "Kapya biberin haller arası medyanı %30,7 gerilerken beyaz incir %57,8, nar %31,9 yükseldi.",
  "Analiz 10.613 fiyat gözlemi ile 39 hal ve borsa kaynağına dayanıyor.",
];

const plans: Plan[] = [
  {
    slug: "basin-tur-2-2026-09-22",
    name: "Basın turu 2 — 7–13 Eylül 2026 veri notu",
    subject: "Basın notu: HaldeFiyat Endeksi %1,2 yükseldi; 71 ürünün 46’sında gerileme",
    pitch: [
      "Merhaba,",
      "",
      "HaldeFiyat’ın 7–13 Eylül 2026 haftasına ilişkin hal fiyatları raporu yayımlandı.",
      "",
      "Öne çıkan veriler:",
      "",
      ...sharedFacts.map((fact) => `• ${fact}`),
      "",
      "Endeks sepeti ile ürün hareketlerinin kapsamı ve karşılaştırma yöntemi farklıdır; bu nedenle sonuç “bütün sebze ve meyveler pahalandı” şeklinde yorumlanmamalıdır.",
      "",
      "Rapor:",
      "https://haldefiyat.com/analiz/eylul-2-hafta-2026-hal-raporu",
      "",
      "Basın ve medya kiti:",
      "https://haldefiyat.com/basin",
      "",
      "Endeks:",
      "https://haldefiyat.com/endeks",
      "",
      "Haberleştirme için tablo, grafik, veri örneği veya kısa değerlendirme gerekirse memnuniyetle paylaşabiliriz.",
    ].join("\n"),
    segmentTags: ["basin", "yayin", "tur-2"],
    publicationTypes: ["newspaper", "website", "agency"],
    startAt: "2026-09-22T07:00:00.000Z",
    expectedRecipients: 14,
  },
  {
    slug: "kurum-tur-1-2026-09-23",
    name: "Kurum turu 1 — 7–13 Eylül 2026 veri özeti",
    subject: "HaldeFiyat haftalık veri özeti: 71 üründe hal fiyatı görünümü",
    pitch: [
      "Merhaba,",
      "",
      "HaldeFiyat’ın 7–13 Eylül 2026 haftasına ilişkin hal fiyatları veri özeti yayımlandı.",
      "",
      "Öne çıkan veriler:",
      "",
      ...sharedFacts.map((fact) => `• ${fact}`),
      "",
      "Çalışmalarınızda kaynak göstermek, bölgesel karşılaştırma yapmak veya ürün hareketlerini incelemek için raporu ve açık HaldeFiyat sayfalarını kullanabilirsiniz.",
      "",
      "Haftalık rapor:",
      "https://haldefiyat.com/analiz/eylul-2-hafta-2026-hal-raporu",
      "",
      "HaldeFiyat Endeksi:",
      "https://haldefiyat.com/endeks",
      "",
      "Güncel hal fiyatları:",
      "https://haldefiyat.com/fiyatlar",
      "",
      "Veri kapsamı veya karşılaştırma yöntemi hakkında bilgi gerekirse bu e-postayı yanıtlayabilirsiniz.",
    ].join("\n"),
    segmentTags: ["kurum", "oda", "borsa", "dernek"],
    publicationTypes: ["association", "chamber", "other"],
    startAt: "2026-09-23T07:00:00.000Z",
    expectedRecipients: 48,
  },
];

async function ensureCampaign(plan: Plan): Promise<number> {
  const [existing] = await pool.query<any[]>("SELECT id,status FROM hf_press_campaigns WHERE slug=? LIMIT 1", [plan.slug]);
  if (existing[0]) {
    if (["active", "completed"].includes(existing[0].status)) return Number(existing[0].id);
    return Number(existing[0].id);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute<any>(
      `INSERT INTO hf_press_campaigns
         (slug,name,subject,pitch,segment_tags,from_email,reply_to_email,rate_per_minute,delay_min_seconds,delay_max_seconds,status)
       VALUES (?,?,?,?,?,'noreply@haldefiyat.com','info@gzlteknoloji.com',4,15,25,'draft')`,
      [plan.slug, plan.name, plan.subject, plan.pitch, JSON.stringify(plan.segmentTags)],
    );
    const campaignId = Number(result.insertId);
    const placeholders = plan.publicationTypes.map(() => "?").join(",");
    await connection.execute(
      `INSERT INTO hf_press_outreach_logs (campaign_id,contact_id,channel,status,note,contacted_at)
       SELECT ?,id,'email','planned',?,NULL FROM hf_press_contacts
        WHERE status='target' AND publication_type IN (${placeholders})`,
      [campaignId, `Otomatik iki turlu gönderim planı: ${plan.startAt}`, ...plan.publicationTypes],
    );
    await connection.commit();
    return campaignId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

for (const plan of plans) {
  const campaignId = await ensureCampaign(plan);
  const [campaignRows] = await pool.query<any[]>("SELECT status,scheduled_at FROM hf_press_campaigns WHERE id=?", [campaignId]);
  if (campaignRows[0]?.status === "active" || campaignRows[0]?.status === "completed") {
    console.log(JSON.stringify({ campaignId, slug: plan.slug, state: campaignRows[0].status, scheduledAt: campaignRows[0].scheduled_at }));
    continue;
  }
  const preflight = await preflightPressCampaign(campaignId);
  if (preflight.total !== plan.expectedRecipients || !preflight.canSend) {
    throw new Error(`${plan.slug}: preflight beklenenden farklı: ${JSON.stringify({ total: preflight.total, counts: preflight.counts })}`);
  }
  await approvePressCampaign(campaignId, preflight.preflightHash, "user-explicit-2026-09-21");
  const activated = await activatePressCampaign(campaignId, preflight.preflightHash, new Date(plan.startAt));
  console.log(JSON.stringify({ ...activated, slug: plan.slug, counts: preflight.counts }));
}

await pool.end();
