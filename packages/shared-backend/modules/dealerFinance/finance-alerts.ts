// src/modules/dealerFinance/finance-alerts.ts
import { sendMailRaw } from '@agro/shared-backend/modules/mail';
import { escapeMailHtml, wrapMailBody, SITE_NAME } from '@agro/shared-backend/modules/mail';
import { telegramNotify } from '../telegram';
import {
  repoGetDealerProfile,
} from './repository';
import {
  repoSumAmountsByType,
  repoCountAllTransactions,
  repoCountOverdueTransactions,
} from './repository-aggregates';
import { repoGetUserEmailById } from './repository-user';
import { buildFinanceSummaryPayload } from '@agro/shared-backend/modules/dealerFinance';

const COOLDOWN_MS = 60 * 60 * 1000;
const lastAlertAt = new Map<string, number>();

function canSendAlert(userId: string): boolean {
  const t = lastAlertAt.get(userId);
  if (t != null && Date.now() - t < COOLDOWN_MS) return false;
  return true;
}

function markAlertSent(userId: string) {
  lastAlertAt.set(userId, Date.now());
}

export type SendDealerFinanceAlertsOpts = {
  /** Bayi POST’undaki saatlik limiti atla (admin toplu / cron) */
  skipCooldown?: boolean;
};

/** Uyarı varsa e-posta + (yapılandırılmışsa) Telegram’a bildirim */
export async function sendDealerFinanceAlerts(
  userId: string,
  opts?: SendDealerFinanceAlertsOpts,
): Promise<{
  sent: boolean;
  email: boolean;
  reason?: string;
}> {
  const profile = await repoGetDealerProfile(userId);
  if (!profile) return { sent: false, email: false, reason: 'no_profile' };

  const [totalsByType, txCount, overdueCount] = await Promise.all([
    repoSumAmountsByType(profile.id),
    repoCountAllTransactions(profile.id),
    repoCountOverdueTransactions(profile.id),
  ]);

  const summary = buildFinanceSummaryPayload(profile, totalsByType, txCount, overdueCount);
  if (summary.warnings.length === 0) {
    return { sent: false, email: false, reason: 'no_warnings' };
  }

  if (!opts?.skipCooldown && !canSendAlert(userId)) {
    return { sent: false, email: false, reason: 'rate_limited' };
  }

  const company = escapeMailHtml(profile.company_name ?? 'Bayi');
  const warnLines = summary.warnings.map((w) => `<li>${escapeMailHtml(w)}</li>`).join('');
  const bodyHtml = wrapMailBody(`
    <h2 style="font-size:18px;">Cari uyarı</h2>
    <p><strong>${company}</strong></p>
    <p>Kullanılabilir: <strong>${escapeMailHtml(String(summary.available))}</strong> · Limit: <strong>${escapeMailHtml(String(summary.credit_limit))}</strong></p>
    <p>Vadesi geçen işlem: <strong>${summary.overdue_count}</strong></p>
    <ul>${warnLines}</ul>
    <p>${SITE_NAME}</p>
  `);

  const textPlain = [
    `Cari uyari — ${profile.company_name ?? 'Bayi'}`,
    `Kullanilabilir: ${summary.available} · Limit: ${summary.credit_limit}`,
    `Vadesi gecen: ${summary.overdue_count}`,
    `Uyari kodlari: ${summary.warnings.join(', ')}`,
  ].join('\n');

  let emailOk = false;
  const userRow = await repoGetUserEmailById(userId);
  if (userRow?.email) {
    try {
      await sendMailRaw({
        to: userRow.email,
        subject: `${SITE_NAME} — Cari hesap uyarisi`,
        html: bodyHtml,
        text: textPlain,
      });
      emailOk = true;
    } catch {
      /* SMTP yapilandirmasi eksik olabilir */
    }
  }

  await telegramNotify({
    title: 'Bayi cari uyarisi',
    message: `${profile.company_name ?? 'Bayi'}: ${summary.warnings.join(', ')} · kullanilabilir ${summary.available}`,
  });

  if (emailOk) markAlertSent(userId);

  return { sent: true, email: emailOk };
}
