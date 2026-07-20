/**
 * Bulten arsivi — ne gonderdigimizi kayit altina alir ve gonderim oncesi onay akisi saglar.
 *
 * Neden: bulten HTML'i her calismada yeniden uretilip dogrudan abonelere gidiyordu; hicbir
 * kopyasi saklanmiyordu. "Gecen hafta ne gonderdik" sorusunun cevabi yoktu, dolayisiyla
 * icerik hatasi ancak abonelere ulastiktan sonra, ekran goruntusuyle fark ediliyordu.
 *
 * Akis: createDraft() -> (admin panelde incele/duzenle) -> sendStored(id).
 * Cron dogrudan gonderdiginde de kayit 'sent' olarak dusulur, boylece arsiv her zaman tam.
 */

import { randomUUID } from "node:crypto";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { hfNewsletterSends } from "@/db/schema";

export type SendStatus = "draft" | "sent" | "skipped" | "failed";

export interface SendSummary {
  id:         string;
  kind:       string;
  status:     string;
  subject:    string;
  recipients: number;
  successes:  number;
  failures:   number;
  reason:     string | null;
  editedAt:   Date | null;
  sentAt:     Date | null;
  createdAt:  Date | null;
}

const SUMMARY = {
  id: hfNewsletterSends.id,
  kind: hfNewsletterSends.kind,
  status: hfNewsletterSends.status,
  subject: hfNewsletterSends.subject,
  recipients: hfNewsletterSends.recipients,
  successes: hfNewsletterSends.successes,
  failures: hfNewsletterSends.failures,
  reason: hfNewsletterSends.reason,
  editedAt: hfNewsletterSends.editedAt,
  sentAt: hfNewsletterSends.sentAt,
  createdAt: hfNewsletterSends.createdAt,
};

export async function recordSend(input: {
  kind?: string;
  status: SendStatus;
  subject: string;
  html: string;
  recipients?: number;
  successes?: number;
  failures?: number;
  reason?: string | null;
}): Promise<string> {
  const id = randomUUID();
  await db.insert(hfNewsletterSends).values({
    id,
    kind:       input.kind ?? "weekly",
    status:     input.status,
    subject:    input.subject,
    html:       input.html,
    recipients: input.recipients ?? 0,
    successes:  input.successes ?? 0,
    failures:   input.failures ?? 0,
    reason:     input.reason ?? null,
    sentAt:     input.status === "sent" ? sql`CURRENT_TIMESTAMP(3)` as unknown as Date : null,
  });
  return id;
}

export async function listSends(limit = 50): Promise<SendSummary[]> {
  return db
    .select(SUMMARY)
    .from(hfNewsletterSends)
    .orderBy(desc(hfNewsletterSends.createdAt))
    .limit(Math.min(Math.max(limit, 1), 200)) as unknown as Promise<SendSummary[]>;
}

export async function getSend(id: string) {
  const rows = await db
    .select()
    .from(hfNewsletterSends)
    .where(eq(hfNewsletterSends.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Yalnizca taslak duzenlenebilir. Gonderilmis bulten degistirilemez — abonenin gelen
 * kutusundaki kopya zaten degismiyor, arsivi degistirmek kaydi yalan haline getirir.
 */
export async function updateDraft(
  id: string,
  patch: { subject?: string; html?: string },
): Promise<{ ok: boolean; reason?: string }> {
  const existing = await getSend(id);
  if (!existing) return { ok: false, reason: "not-found" };
  if (existing.status !== "draft") return { ok: false, reason: "only-draft-editable" };
  if (patch.subject == null && patch.html == null) return { ok: false, reason: "empty-patch" };

  await db
    .update(hfNewsletterSends)
    .set({
      ...(patch.subject != null ? { subject: patch.subject } : {}),
      ...(patch.html != null ? { html: patch.html } : {}),
      editedAt: sql`CURRENT_TIMESTAMP(3)` as unknown as Date,
    })
    .where(eq(hfNewsletterSends.id, id));

  return { ok: true };
}

export async function markSent(
  id: string,
  result: { status: SendStatus; recipients: number; successes: number; failures: number; reason?: string | null },
): Promise<void> {
  await db
    .update(hfNewsletterSends)
    .set({
      status:     result.status,
      recipients: result.recipients,
      successes:  result.successes,
      failures:   result.failures,
      reason:     result.reason ?? null,
      sentAt:     sql`CURRENT_TIMESTAMP(3)` as unknown as Date,
    })
    .where(eq(hfNewsletterSends.id, id));
}

export async function deleteDraft(id: string): Promise<{ ok: boolean; reason?: string }> {
  const existing = await getSend(id);
  if (!existing) return { ok: false, reason: "not-found" };
  if (existing.status !== "draft") return { ok: false, reason: "only-draft-deletable" };
  await db.delete(hfNewsletterSends).where(eq(hfNewsletterSends.id, id));
  return { ok: true };
}
