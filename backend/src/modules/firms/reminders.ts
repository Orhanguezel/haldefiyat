import { sql } from "drizzle-orm";
import { db } from "@/db/client";
import { sendEmailAlert } from "@/modules/alerts/email";
import { sendToExternalIds } from "@/modules/notifications/onesignal";

type ReminderTarget = {
  firmId: number;
  firmSlug: string;
  firmName: string;
  ownerUserId: string;
  email: string | null;
};

type ReminderResult = {
  date: string;
  dryRun: boolean;
  total: number;
  emailed: number;
  pushed: number;
  skipped: number;
};

export async function runFirmDailyPriceReminders(options: { date?: string; dryRun?: boolean } = {}): Promise<ReminderResult> {
  const date = options.date ?? new Date().toISOString().slice(0, 10);
  const targets = await listFirmDailyPriceReminderTargets(date);
  if (options.dryRun) {
    return { date, dryRun: true, total: targets.length, emailed: 0, pushed: 0, skipped: 0 };
  }
  let emailed = 0;
  let pushed = 0;
  let skipped = 0;
  for (const target of targets) {
    const url = `https://haldefiyat.com/hesabim/firmam`;
    const message = `${target.firmName} için bugünün hal fiyatlarını girmeyi unutmayın.`;
    if (target.email) {
      await sendEmailAlert(target.email, "Bugünün hal fiyatlarını girin", buildReminderEmail(target, url));
      emailed += 1;
    }
    const push = await sendToExternalIds([target.ownerUserId], {
      title: "Günlük fiyat girişi",
      message,
      url,
      data: { firmId: target.firmId, firmSlug: target.firmSlug, type: "firm_daily_price_reminder" },
    });
    if (push) pushed += 1;
    if (!target.email && !push) skipped += 1;
  }
  return { date, dryRun: false, total: targets.length, emailed, pushed, skipped };
}

async function listFirmDailyPriceReminderTargets(date: string): Promise<ReminderTarget[]> {
  const result = await db.execute(sql`
    SELECT
      f.id AS firmId,
      f.slug AS firmSlug,
      f.name AS firmName,
      f.owner_user_id AS ownerUserId,
      u.email AS email
    FROM hf_firms f
    INNER JOIN users u ON u.id = f.owner_user_id AND u.is_active = 1
    LEFT JOIN hf_firm_prices fp ON fp.firm_id = f.id AND fp.recorded_date = ${date}
    WHERE f.owner_user_id IS NOT NULL
      AND f.status = 'approved'
      AND f.is_active = 1
      AND fp.id IS NULL
    ORDER BY f.name ASC
    LIMIT 500
  `);
  const rows = (Array.isArray(result) ? result[0] : result) as unknown as Array<{
    firmId: number | string;
    firmSlug: string;
    firmName: string;
    ownerUserId: string;
    email: string | null;
  }>;
  return rows.map((row) => ({
    firmId: Number(row.firmId),
    firmSlug: row.firmSlug,
    firmName: row.firmName,
    ownerUserId: row.ownerUserId,
    email: row.email,
  }));
}

function buildReminderEmail(target: ReminderTarget, url: string): string {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Günlük hal fiyatları</h2>
      <p><strong>${escapeHtml(target.firmName)}</strong> için bugünün fiyatlarını henüz girmediniz.</p>
      <p>Ürün bazında en düşük, ortalama ve en yüksek fiyatları girerek firma profilinizi güncel tutabilirsiniz.</p>
      <p><a href="${url}" style="display:inline-block;background:#e85d2a;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none">Fiyatları gir</a></p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px">Bu mesaj HaldeFiyat.com tarafından otomatik gönderildi.</p>
    </div>
  `;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
