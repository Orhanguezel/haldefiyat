import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "@/core/env";

let cached: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!env.SMTP_HOST) return null;
  if (cached) return cached;

  cached = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER && env.SMTP_PASS
      ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
      : undefined,
  });

  return cached;
}

/**
 * Fiyat alarmi email'i gonderir.
 * SMTP_HOST tanimli degilse sessizce atlar (development icin).
 */
export async function sendEmailAlert(to: string, subject: string, html: string): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("[alerts:email] SMTP_HOST tanimli degil, atlandi");
    return;
  }

  if (!to || !subject) return;

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.warn("[alerts:email] gonderim hatasi:", err instanceof Error ? err.message : String(err));
  }
}

export function buildAlertEmailHtml(params: {
  productName: string;
  marketName: string | null;
  latestPrice: number;
  thresholdPrice: number;
  direction: "above" | "below";
  recordedDate: string;
}): string {
  const dirText = params.direction === "above" ? "ustune cikti" : "altina indi";
  const marketLine = params.marketName
    ? `<p><strong>Hal:</strong> ${escape(params.marketName)}</p>`
    : "";
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
      <h2>Fiyat Alarmi: ${escape(params.productName)}</h2>
      <p><strong>${escape(params.productName)}</strong> fiyati belirlediginiz esigin ${dirText}.</p>
      ${marketLine}
      <p><strong>Guncel fiyat:</strong> ${params.latestPrice.toFixed(2)} TL/kg</p>
      <p><strong>Esik degeri:</strong> ${params.thresholdPrice.toFixed(2)} TL/kg</p>
      <p><strong>Tarih:</strong> ${escape(params.recordedDate)}</p>
      <p style="color:#6b7280;font-size:12px;margin-top:24px">Bu mesaj HaldeFiyat.com tarafindan otomatik gonderildi.</p>
    </div>
  `;
}

function escape(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
