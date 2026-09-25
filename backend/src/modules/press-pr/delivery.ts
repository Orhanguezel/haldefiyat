import { createHash } from "node:crypto";
import type { FastifyInstance } from "fastify";

import { pool } from "@/db/client";
import { sendBereketMail } from "@agro/shared-backend/core/mail";
import { isValidEmail, normalizeEmail } from "@agro/shared-backend/core/email-validate";
import { isEmailSuppressed, suppressEmail } from "@/modules/newsletter/suppression";
import { unsubHeaders, unsubUrl } from "@/modules/newsletter/token";
import { DEFAULT_PRESS_EMAIL_BRANDING, loadPressEmailBranding, type PressEmailBranding } from "./email-branding";

const MAX_CAMPAIGN_RECIPIENTS = 50;
const DEFAULT_FROM = "noreply@haldefiyat.com";
const DEFAULT_REPLY_TO = "info@gzlteknoloji.com";
const PRESS_LOGO_CID = "haldefiyat-logo@haldefiyat.com";
const MAX_EMBEDDED_LOGO_BYTES = 1_500_000;

let cachedEmbeddedLogo: { url: string; content: Buffer; contentType: string } | null = null;

type CampaignRow = {
  id: number;
  name: string;
  subject: string;
  pitch: string;
  from_email: string;
  reply_to_email: string;
  rate_per_minute: number;
  delay_min_seconds: number;
  delay_max_seconds: number;
  approved_preflight_hash: string | null;
  status: "draft" | "active" | "completed" | "archived";
};

type RecipientRow = {
  log_id: number;
  contact_id: number;
  log_status: string;
  organization: string;
  email: string;
  contact_status: "target" | "contacted" | "replied" | "published" | "blocked";
};

export type PressPreflightStatus = "allowed" | "blocked" | "invalid" | "duplicate" | "suppressed";

export type PressPreflight = {
  campaignId: number;
  total: number;
  counts: Record<PressPreflightStatus, number>;
  canSend: boolean;
  approved: boolean;
  preflightHash: string;
  sender: { from: string; replyTo: string };
  rate: { perMinute: number; delayMinSeconds: number; delayMaxSeconds: number };
  branding: PressEmailBranding;
  preview: { subject: string; html: string; text: string };
  items: Array<RecipientRow & { email: string; preflightStatus: PressPreflightStatus; preflightReason: string }>;
};

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function linkify(value: string, accentColor: string): string {
  return escapeHtml(value).replace(/(https?:\/\/[^\s<]+)/g, `<a href="$1" style="color:${accentColor};text-decoration:underline">$1</a>`);
}

function stripLegacySignature(pitch: string, branding: PressEmailBranding): string {
  const normalized = pitch.replace(/\r\n/g, "\n").trim();
  const marker = normalized.toLocaleLowerCase("tr-TR").lastIndexOf("\nsaygılarımızla,");
  if (marker < 0) return normalized;
  const tail = normalized.slice(marker).toLocaleLowerCase("tr-TR");
  const signals = [branding.signatureName, branding.email, branding.website, "haldefiyat veri ekibi"]
    .map((value) => value.toLocaleLowerCase("tr-TR"))
    .filter(Boolean);
  return signals.some((signal) => tail.includes(signal)) ? normalized.slice(0, marker).trim() : normalized;
}

export function renderPressCampaign(
  pitch: string,
  email?: string,
  branding: PressEmailBranding = DEFAULT_PRESS_EMAIL_BRANDING,
  logoSrc = branding.logoUrl,
): { html: string; text: string } {
  const clean = stripLegacySignature(pitch, branding);
  const blocks: string[] = [];
  let bullets: string[] = [];
  const flushBullets = () => {
    if (!bullets.length) return;
    blocks.push(`<ul style="margin:0 0 18px;padding-left:22px">${bullets.map((line) => `<li style="margin:0 0 7px">${linkify(line, branding.accentColor)}</li>`).join("")}</ul>`);
    bullets = [];
  };
  for (const raw of clean.split("\n")) {
    const line = raw.trim();
    if (!line) { flushBullets(); continue; }
    if (/^[•*-]\s+/.test(line)) { bullets.push(line.replace(/^[•*-]\s+/, "")); continue; }
    flushBullets();
    blocks.push(`<p style="margin:0 0 14px">${linkify(line, branding.accentColor)}</p>`);
  }
  flushBullets();

  const unsubscribe = email ? unsubUrl(email) : "https://haldefiyat.com/abonelik";
  const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body style="margin:0;background:#f8fafc;color:#0f172a;font-family:Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">HaldeFiyat haftalık hal fiyatları basın notu</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;background:#fff;border:1px solid #e2e8f0;border-radius:12px"><tr><td style="padding:22px 28px;background:#fff;color:#0f172a;border-bottom:3px solid ${branding.accentColor};border-radius:12px 12px 0 0"><img src="${escapeHtml(logoSrc)}" width="220" height="82" alt="${escapeHtml(branding.logoAlt)}" style="display:block;width:220px;height:auto;max-width:80%;border:0"><div style="font-size:12px;margin-top:10px;color:#64748b">${escapeHtml(branding.tagline)}</div></td></tr><tr><td style="padding:28px;font-size:15px;line-height:1.65">${blocks.join("")}<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:26px;border-top:1px solid #e5e7eb"><tr><td style="padding-top:18px;border-left:4px solid ${branding.accentColor};padding-left:14px"><strong style="font-size:15px;color:#0f172a">${escapeHtml(branding.signatureName)}</strong><div style="font-size:13px;color:#64748b;margin-top:2px">${escapeHtml(branding.signatureTitle)}</div><div style="font-size:13px;margin-top:8px"><a href="mailto:${escapeHtml(branding.email)}" style="color:${branding.accentColor};text-decoration:none">${escapeHtml(branding.email)}</a><span style="color:#94a3b8"> · </span><a href="${escapeHtml(branding.website)}" style="color:${branding.accentColor};text-decoration:none">${escapeHtml(branding.website.replace(/^https?:\/\//, ""))}</a></div></td></tr></table><hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0"><p style="margin:0;color:#64748b;font-size:12px">Bu basın notlarını almak istemiyorsanız <a href="${escapeHtml(unsubscribe)}" style="color:${branding.accentColor}">abonelikten çıkabilirsiniz</a> veya bu e-postayı yanıtlayabilirsiniz.</p></td></tr></table></td></tr></table></body></html>`;
  const text = `${clean}\n\nSaygılarımızla,\n${branding.signatureName}\n${branding.signatureTitle}\n${branding.email}\n${branding.website}\n\n---\nBu basın notlarını almak istemiyorsanız abonelikten çıkabilirsiniz: ${unsubscribe}\nVeya bu e-postayı yanıtlayabilirsiniz.`;
  return { html, text };
}

async function loadEmbeddedLogo(branding: PressEmailBranding) {
  if (cachedEmbeddedLogo?.url === branding.logoUrl) return cachedEmbeddedLogo;
  const response = await fetch(branding.logoUrl, { signal: AbortSignal.timeout(10_000) });
  const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() || "";
  if (!response.ok || !contentType.startsWith("image/")) throw new Error(`press_logo_fetch_failed:${response.status}`);
  const content = Buffer.from(await response.arrayBuffer());
  if (!content.length || content.length > MAX_EMBEDDED_LOGO_BYTES) throw new Error("press_logo_invalid_size");
  cachedEmbeddedLogo = { url: branding.logoUrl, content, contentType };
  return cachedEmbeddedLogo;
}

async function loadCampaign(campaignId: number): Promise<CampaignRow> {
  const [rows] = await pool.query<any[]>(
    `SELECT id,name,subject,pitch,from_email,reply_to_email,rate_per_minute,delay_min_seconds,delay_max_seconds,approved_preflight_hash,status
       FROM hf_press_campaigns WHERE id=? LIMIT 1`, [campaignId],
  );
  if (!rows[0]) throw Object.assign(new Error("campaign_not_found"), { statusCode: 404 });
  return rows[0] as CampaignRow;
}

async function loadRecipients(campaignId: number): Promise<RecipientRow[]> {
  const [rows] = await pool.query<any[]>(
    `SELECT l.id log_id,l.contact_id,l.status log_status,c.organization,c.email,c.status contact_status
       FROM hf_press_outreach_logs l JOIN hf_press_contacts c ON c.id=l.contact_id
      WHERE l.campaign_id=? AND l.channel='email' ORDER BY l.id`, [campaignId],
  );
  return rows as RecipientRow[];
}

export async function preflightPressCampaign(campaignId: number): Promise<PressPreflight> {
  const [campaign, recipients, branding] = await Promise.all([
    loadCampaign(campaignId),
    loadRecipients(campaignId),
    loadPressEmailBranding(),
  ]);
  const seen = new Set<string>();
  const items: PressPreflight["items"] = [];
  const counts: Record<PressPreflightStatus, number> = { allowed: 0, blocked: 0, invalid: 0, duplicate: 0, suppressed: 0 };

  for (const row of recipients) {
    const email = normalizeEmail(row.email);
    let preflightStatus: PressPreflightStatus = "allowed";
    let preflightReason = "eligible_press_contact";
    if (row.log_status === "sent") { preflightStatus = "allowed"; preflightReason = "eligible_press_contact"; }
    else if (!isValidEmail(email)) { preflightStatus = "invalid"; preflightReason = "email_format_invalid"; }
    else if (seen.has(email)) { preflightStatus = "duplicate"; preflightReason = "duplicate_in_campaign"; }
    else if (await isEmailSuppressed(email)) { preflightStatus = "suppressed"; preflightReason = "active_suppression"; }
    else if (["blocked", "replied", "published"].includes(row.contact_status)) { preflightStatus = "blocked"; preflightReason = `contact_${row.contact_status}`; }
    seen.add(email);
    counts[preflightStatus] += 1;
    items.push({ ...row, email, preflightStatus, preflightReason });
  }

  const ratePerMinute = Math.max(1, Math.min(4, Number(campaign.rate_per_minute || 4)));
  const minimumGap = Math.ceil(60 / ratePerMinute);
  const delayMinSeconds = Math.max(minimumGap, Number(campaign.delay_min_seconds || minimumGap));
  const delayMaxSeconds = Math.max(delayMinSeconds, Number(campaign.delay_max_seconds || delayMinSeconds));
  const snapshot = {
    campaign: { id: campaign.id, subject: campaign.subject, pitch: campaign.pitch, from: campaign.from_email, replyTo: campaign.reply_to_email },
    rate: { perMinute: ratePerMinute, delayMinSeconds, delayMaxSeconds },
    branding,
    recipients: items.map((item) => ({ logId: item.log_id, contactId: item.contact_id, email: item.email, status: item.preflightStatus, reason: item.preflightReason })),
  };
  const preflightHash = createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
  const preview = renderPressCampaign(campaign.pitch, undefined, branding);
  const canSend = recipients.length > 0 && recipients.length <= MAX_CAMPAIGN_RECIPIENTS && counts.allowed === recipients.length;
  return {
    campaignId, total: recipients.length, counts, canSend,
    approved: canSend && campaign.approved_preflight_hash === preflightHash,
    preflightHash,
    sender: { from: campaign.from_email || DEFAULT_FROM, replyTo: campaign.reply_to_email || DEFAULT_REPLY_TO },
    rate: snapshot.rate,
    branding,
    preview: { subject: campaign.subject, ...preview }, items,
  };
}

export async function approvePressCampaign(campaignId: number, expectedHash: string, approvedBy: string | null) {
  const preflight = await preflightPressCampaign(campaignId);
  if (preflight.preflightHash !== expectedHash) throw Object.assign(new Error("preflight_changed"), { statusCode: 409 });
  if (!preflight.canSend) throw Object.assign(new Error("preflight_blocked"), { statusCode: 422, counts: preflight.counts });
  await pool.execute(
    `UPDATE hf_press_campaigns SET approved_preflight_hash=?,approved_at=NOW(3),approved_by=?,approval_snapshot=?,last_error=NULL WHERE id=?`,
    [preflight.preflightHash, approvedBy, JSON.stringify(preflight), campaignId],
  );
  return { ...preflight, approved: true };
}

export async function activatePressCampaign(campaignId: number, expectedHash: string, requestedStartAt?: Date) {
  const preflight = await preflightPressCampaign(campaignId);
  if (!preflight.canSend) throw Object.assign(new Error("preflight_blocked"), { statusCode: 422, counts: preflight.counts });
  if (preflight.preflightHash !== expectedHash || !preflight.approved) throw Object.assign(new Error("approval_required_or_changed"), { statusCode: 409 });
  const requestedStartMs = requestedStartAt?.getTime();
  let scheduledAt = requestedStartMs && requestedStartMs > Date.now() ? requestedStartMs : Date.now();
  const campaignStartAt = new Date(scheduledAt);
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const item of preflight.items) {
      await connection.execute(
        `UPDATE hf_press_outreach_logs SET status='planned',scheduled_at=?,failure_class=NULL,last_error=NULL WHERE id=? AND status='planned'`,
        [new Date(scheduledAt), item.log_id],
      );
      const span = preflight.rate.delayMaxSeconds - preflight.rate.delayMinSeconds;
      scheduledAt += (preflight.rate.delayMinSeconds + Math.floor(Math.random() * (span + 1))) * 1000;
    }
    await connection.execute(
      `UPDATE hf_press_campaigns SET status='active',scheduled_at=?,next_send_at=?,last_error=NULL WHERE id=?`,
      [campaignStartAt, campaignStartAt, campaignId],
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  return { ok: true, campaignId, queued: preflight.total, scheduledAt: campaignStartAt.toISOString() };
}

export type MailFailureClass = "hard_bounce" | "complaint" | "invalid_recipient" | "temporary_provider" | "quota" | "auth" | "infrastructure" | "uncertain";

export function classifyMailFailure(error: unknown): { class: MailFailureClass; retryable: boolean; suppress: boolean; pauseCampaign: boolean } {
  const row = error && typeof error === "object" ? error as Record<string, unknown> : {};
  const message = [row.message, row.code, row.response, row.responseCode].filter(Boolean).join(" ").toLowerCase();
  const code = Number(row.responseCode);
  if (/complaint|abuse report|feedback loop|fbl\b/.test(message)) return { class: "complaint", retryable: false, suppress: true, pauseCampaign: false };
  if (/authentication|auth(?:entication)? failed|invalid credentials|bad credentials|ea?uth|535\b|534\b|5\.7\.8/.test(message)) return { class: "auth", retryable: false, suppress: false, pauseCampaign: true };
  if (/quota|rate limit|too many requests|daily limit|throttl|452\b|4\.2\.2|429\b/.test(message) || code === 429) return { class: "quota", retryable: true, suppress: false, pauseCampaign: false };
  if (/invalid (?:recipient|address)|bad address|mailbox syntax|no recipients|5\.1\.3/.test(message)) return { class: "invalid_recipient", retryable: false, suppress: false, pauseCampaign: false };
  if (/user unknown|mailbox (?:not found|does not exist|unavailable)|unknown recipient|no such user|5\.1\.1/.test(message)) return { class: "hard_bounce", retryable: false, suppress: true, pauseCampaign: false };
  if (/econnrefused|enotfound|database|connection pool|smtp_host_not_configured|press_logo_/.test(message)) return { class: "infrastructure", retryable: true, suppress: false, pauseCampaign: false };
  if (Number.isFinite(code) && code >= 400 && code < 500) return { class: "temporary_provider", retryable: true, suppress: false, pauseCampaign: false };
  return { class: "uncertain", retryable: false, suppress: false, pauseCampaign: false };
}

async function reserveOneDelivery() {
  const connection = await pool.getConnection();
  try {
    const [[lock]] = await connection.query<any[]>("SELECT GET_LOCK('hal_press_delivery',0) acquired");
    if (!lock?.acquired) return null;
    await connection.beginTransaction();
    const [rows] = await connection.query<any[]>(
      `SELECT l.id log_id,l.campaign_id,l.contact_id,l.attempt_count,c.email,c.organization,
              p.subject,p.pitch,p.reply_to_email,p.approved_preflight_hash
         FROM hf_press_outreach_logs l
         JOIN hf_press_campaigns p ON p.id=l.campaign_id
         JOIN hf_press_contacts c ON c.id=l.contact_id
        WHERE p.status='active' AND l.channel='email' AND l.status='planned'
          AND COALESCE(l.scheduled_at,NOW(3))<=NOW(3) AND COALESCE(p.next_send_at,NOW(3))<=NOW(3)
        ORDER BY l.scheduled_at,l.id LIMIT 1 FOR UPDATE`,
    );
    const job = rows[0];
    if (!job) { await connection.commit(); return null; }
    await connection.execute("UPDATE hf_press_outreach_logs SET status='processing' WHERE id=? AND status='planned'", [job.log_id]);
    await connection.commit();
    return job;
  } catch (error) {
    try { await connection.rollback(); } catch {}
    throw error;
  } finally {
    try { await connection.query("SELECT RELEASE_LOCK('hal_press_delivery')"); } catch {}
    connection.release();
  }
}

export async function processOnePressDelivery(): Promise<{ state: string; logId?: number }> {
  const job = await reserveOneDelivery();
  if (!job) return { state: "idle" };
  const email = normalizeEmail(job.email);
  try {
    const preflight = await preflightPressCampaign(Number(job.campaign_id));
    if (!preflight.approved || preflight.preflightHash !== job.approved_preflight_hash) {
      await pool.execute("UPDATE hf_press_outreach_logs SET status='planned' WHERE id=?", [job.log_id]);
      await pool.execute("UPDATE hf_press_campaigns SET status='draft',last_error='approval_changed' WHERE id=?", [job.campaign_id]);
      return { state: "paused_approval_changed", logId: job.log_id };
    }
    const current = preflight.items.find((item) => item.log_id === job.log_id);
    if (!current || current.preflightStatus !== "allowed") {
      await pool.execute("UPDATE hf_press_outreach_logs SET status='skipped',failure_class='send_gate',last_error=? WHERE id=?", [current?.preflightReason || "recipient_missing", job.log_id]);
      return { state: "skipped", logId: job.log_id };
    }

    const embeddedLogo = await loadEmbeddedLogo(preflight.branding);
    const rendered = renderPressCampaign(job.pitch, email, preflight.branding, `cid:${PRESS_LOGO_CID}`);
    await pool.execute(
      `UPDATE hf_press_outreach_logs
          SET smtp_handoff_at=NOW(3),attempt_count=attempt_count+1,
              sent_subject=?,sent_html=?,sent_text=?,sent_from_email=?,sent_reply_to_email=?
        WHERE id=?`,
      [job.subject, rendered.html, rendered.text, preflight.sender.from, job.reply_to_email || DEFAULT_REPLY_TO, job.log_id],
    );
    const result = await sendBereketMail({
      to: email,
      subject: job.subject,
      html: rendered.html,
      text: rendered.text,
      replyTo: job.reply_to_email || DEFAULT_REPLY_TO,
      headers: unsubHeaders(email),
      attachments: [{
        filename: "haldefiyat-logo.png",
        content: embeddedLogo.content,
        contentType: embeddedLogo.contentType,
        cid: PRESS_LOGO_CID,
        contentDisposition: "inline",
      }],
    });
    const gap = preflight.rate.delayMinSeconds + Math.floor(Math.random() * (preflight.rate.delayMaxSeconds - preflight.rate.delayMinSeconds + 1));
    await pool.execute(
      `UPDATE hf_press_outreach_logs SET status='sent',sent_at=NOW(3),contacted_at=NOW(3),provider_message_id=?,failure_class=NULL,last_error=NULL WHERE id=?`,
      [String((result as any)?.messageId || "").slice(0, 255) || null, job.log_id],
    );
    await pool.execute("UPDATE hf_press_contacts SET status='contacted',last_contacted_at=NOW(3) WHERE id=? AND status='target'", [job.contact_id]);
    await pool.execute("UPDATE hf_press_campaigns SET next_send_at=DATE_ADD(NOW(3),INTERVAL ? SECOND) WHERE id=?", [gap, job.campaign_id]);
    const [[remaining]] = await pool.query<any[]>("SELECT COUNT(*) n FROM hf_press_outreach_logs WHERE campaign_id=? AND channel='email' AND status IN ('planned','processing')", [job.campaign_id]);
    if (Number(remaining?.n || 0) === 0) await pool.execute("UPDATE hf_press_campaigns SET status='completed',sent_at=NOW(3),next_send_at=NULL WHERE id=?", [job.campaign_id]);
    return { state: "sent", logId: job.log_id };
  } catch (error) {
    const decision = classifyMailFailure(error);
    const message = String((error as any)?.message || error).slice(0, 500);
    if (decision.suppress && isValidEmail(email)) await suppressEmail({ email, reason: decision.class === "complaint" ? "complaint" : "hard_bounce", provider: "smtp", detail: message });
    const attempts = Number(job.attempt_count || 0) + 1;
    const retry = decision.retryable && attempts < 3;
    const status = retry ? "planned" : decision.class === "hard_bounce" ? "bounced" : decision.class === "uncertain" ? "uncertain" : "failed";
    await pool.execute(
      `UPDATE hf_press_outreach_logs SET status=?,scheduled_at=${retry ? "DATE_ADD(NOW(3),INTERVAL 5 MINUTE)" : "scheduled_at"},failure_class=?,last_error=? WHERE id=?`,
      [status, decision.class, message, job.log_id],
    );
    if (decision.pauseCampaign) await pool.execute("UPDATE hf_press_campaigns SET status='draft',last_error=? WHERE id=?", [message, job.campaign_id]);
    return { state: status, logId: job.log_id };
  }
}

let runnerBusy = false;
export function startPressDeliveryRunner(app: FastifyInstance): void {
  const tick = async () => {
    if (runnerBusy) return;
    runnerBusy = true;
    try {
      const result = await processOnePressDelivery();
      if (result.state !== "idle") app.log.info(result, "[press-delivery] kuyruk adimi");
    } catch (error) {
      app.log.error({ error }, "[press-delivery] kuyruk hatasi");
    } finally { runnerBusy = false; }
  };
  const timer = setInterval(() => { void tick(); }, 5_000);
  timer.unref();
  void tick();
}
