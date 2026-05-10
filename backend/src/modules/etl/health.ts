import { desc } from "drizzle-orm";
import { activeSources } from "@/config/etl-sources";
import { db } from "@/db/client";
import { hfEtlRuns } from "@/db/schema";
import { env } from "@/core/env";
import { sendEmailAlert } from "@/modules/alerts/email";
import { sendTelegramAlert } from "@/modules/alerts/telegram";

type EtlHealthSeverity = "critical" | "warning";

interface EtlHealthIssue {
  source: string;
  severity: EtlHealthSeverity;
  reason: string;
  lastRunAt: Date | null;
}

let lastSentSignature = "";

export async function checkAndNotifyEtlHealth(): Promise<{
  checked: number;
  critical: number;
  warning: number;
  notified: boolean;
}> {
  const issues = await checkEtlHealth();
  const critical = issues.filter((i) => i.severity === "critical").length;
  const warning = issues.filter((i) => i.severity === "warning").length;

  if (issues.length === 0) {
    lastSentSignature = "";
    return { checked: activeSources().length, critical, warning, notified: false };
  }

  const signature = issues
    .map((i) => `${i.severity}:${i.source}:${i.reason}`)
    .sort()
    .join("|");

  if (signature === lastSentSignature) {
    return { checked: activeSources().length, critical, warning, notified: false };
  }

  await notifyEtlHealth(issues);
  lastSentSignature = signature;
  return { checked: activeSources().length, critical, warning, notified: true };
}

export async function checkEtlHealth(): Promise<EtlHealthIssue[]> {
  const sources = activeSources();
  const sourceSet = new Set(sources.map((s) => s.key));
  const ignoreEmpty = new Set(env.ETL.healthIgnoreEmptySources);
  const runs = await db.select().from(hfEtlRuns).orderBy(desc(hfEtlRuns.id)).limit(800);
  const bySource = new Map<string, typeof runs>();

  for (const run of runs) {
    if (!sourceSet.has(run.sourceApi)) continue;
    const list = bySource.get(run.sourceApi) ?? [];
    list.push(run);
    bySource.set(run.sourceApi, list);
  }

  const now = Date.now();
  const staleMs = env.ETL.healthStaleHours * 60 * 60 * 1000;
  const issues: EtlHealthIssue[] = [];

  for (const source of sources) {
    const sourceRuns = bySource.get(source.key) ?? [];
    const latest = sourceRuns[0];

    if (!latest) {
      issues.push({
        source: source.key,
        severity: "critical",
        reason: "henuz hic ETL logu yok",
        lastRunAt: null,
      });
      continue;
    }

    const latestAt = latest.createdAt ? new Date(latest.createdAt) : null;
    if (!latestAt || now - latestAt.getTime() > staleMs) {
      issues.push({
        source: source.key,
        severity: "critical",
        reason: `son ETL ${env.ETL.healthStaleHours} saatten eski`,
        lastRunAt: latestAt,
      });
      continue;
    }

    if (latest.status === "error" || latest.status === "partial") {
      issues.push({
        source: source.key,
        severity: "critical",
        reason: `${latest.status}: ${latest.errorMsg ?? "detay yok"}`,
        lastRunAt: latestAt,
      });
      continue;
    }

    if (!ignoreEmpty.has(source.key) && consecutiveEmptyRuns(sourceRuns) >= env.ETL.healthEmptyRunThreshold) {
      issues.push({
        source: source.key,
        severity: "warning",
        reason: `ust uste ${env.ETL.healthEmptyRunThreshold} kosuda 0 satir`,
        lastRunAt: latestAt,
      });
    }
  }

  return issues;
}

function consecutiveEmptyRuns(runs: Array<typeof hfEtlRuns.$inferSelect>): number {
  let count = 0;
  for (const run of runs) {
    if (run.status !== "ok" || run.rowsInserted > 0) break;
    count++;
  }
  return count;
}

async function notifyEtlHealth(issues: EtlHealthIssue[]): Promise<void> {
  const subject = `[HaldeFiyat] ETL saglik uyarisi: ${issues.length} kaynak`;
  const text = buildText(issues);
  const html = `<pre style="font-family:ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap">${escapeHtml(text)}</pre>`;

  await Promise.all([
    ...env.ETL.healthTelegramChatIds.map((chatId) => sendTelegramAlert(chatId, escapeTelegram(text))),
    ...env.ETL.healthNotifyEmails.map((email) => sendEmailAlert(email, subject, html)),
  ]);
}

function buildText(issues: EtlHealthIssue[]): string {
  const lines = [
    "HaldeFiyat ETL saglik uyarisi",
    `Kritik: ${issues.filter((i) => i.severity === "critical").length}, Uyari: ${issues.filter((i) => i.severity === "warning").length}`,
    "",
  ];
  for (const issue of issues) {
    const last = issue.lastRunAt ? issue.lastRunAt.toISOString().replace("T", " ").slice(0, 19) : "-";
    lines.push(`[${issue.severity.toUpperCase()}] ${issue.source}`);
    lines.push(`Son kosu: ${last}`);
    lines.push(`Sebep: ${issue.reason}`);
    lines.push("");
  }
  lines.push("Detay: https://haldefiyat.com/admin/admin/etl-logs");
  return lines.join("\n");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeTelegram(s: string): string {
  return escapeHtml(s);
}
