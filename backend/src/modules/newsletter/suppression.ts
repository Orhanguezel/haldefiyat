import { pool } from "@/db/client";
import { isValidEmail, normalizeEmail } from "@agro/shared-backend/core/email-validate";

export const SUPPRESSION_REASONS = ["hard_bounce", "complaint", "manual"] as const;
export type SuppressionReason = (typeof SUPPRESSION_REASONS)[number];

export function isSuppressionReason(value: unknown): value is SuppressionReason {
  return typeof value === "string" && (SUPPRESSION_REASONS as readonly string[]).includes(value);
}

export async function isEmailSuppressed(email: string): Promise<boolean> {
  const clean = normalizeEmail(email);
  if (!isValidEmail(clean)) return true;
  const [rows] = await pool.query<any[]>("SELECT 1 FROM hf_newsletter_suppressions WHERE email = ? LIMIT 1", [clean]);
  return Boolean(rows[0]);
}

export async function suppressedEmailSet(): Promise<Set<string>> {
  const [rows] = await pool.query<any[]>("SELECT email FROM hf_newsletter_suppressions");
  return new Set((rows ?? []).map((row) => normalizeEmail(row.email)).filter(Boolean));
}

export async function listSuppressions(limit = 200) {
  const [rows] = await pool.query<any[]>(
    `SELECT id, email, reason, provider, provider_event_id AS providerEventId,
            detail, occurred_at AS occurredAt, created_by AS createdBy
       FROM hf_newsletter_suppressions
      ORDER BY occurred_at DESC LIMIT ?`,
    [Math.max(1, Math.min(limit, 500))],
  );
  return rows ?? [];
}

export async function suppressEmail(input: {
  email: string;
  reason: SuppressionReason;
  provider?: string | null;
  providerEventId?: string | null;
  detail?: string | null;
  createdBy?: string | null;
}) {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) throw new Error("invalid_email");
  await pool.execute(
    `INSERT INTO hf_newsletter_suppressions
       (email, reason, provider, provider_event_id, detail, occurred_at, created_by)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP(3), ?)
     ON DUPLICATE KEY UPDATE
       reason = VALUES(reason), provider = VALUES(provider),
       provider_event_id = COALESCE(VALUES(provider_event_id), provider_event_id),
       detail = VALUES(detail), occurred_at = CURRENT_TIMESTAMP(3),
       created_by = VALUES(created_by)`,
    [
      email,
      input.reason,
      input.provider?.trim().slice(0, 64) || null,
      input.providerEventId?.trim().slice(0, 191) || null,
      input.detail?.trim().slice(0, 500) || null,
      input.createdBy ?? null,
    ],
  );
  await pool.execute("UPDATE newsletter_subscribers SET unsubscribed_at = COALESCE(unsubscribed_at, CURRENT_TIMESTAMP(3)) WHERE email = ?", [email]);
  return { email, reason: input.reason };
}

export async function removeSuppression(emailInput: string): Promise<boolean> {
  const email = normalizeEmail(emailInput);
  if (!isValidEmail(email)) return false;
  const [result] = await pool.execute("DELETE FROM hf_newsletter_suppressions WHERE email = ?", [email]);
  return Number((result as { affectedRows?: number }).affectedRows ?? 0) > 0;
}
