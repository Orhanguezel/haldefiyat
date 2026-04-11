import fs from "node:fs/promises";
import path from "node:path";

import puppeteer from "puppeteer";
import { sendMailRaw } from '../mail-api/service';

import { getOfferById, updateOffer } from "./repository";
import type { OfferRow } from "./schema";
import { renderOfferDocumentHtml } from "./template";

const UPLOADS_ROOT_DIR = path.resolve(process.cwd(), "uploads");
const OFFERS_DIR = path.join(UPLOADS_ROOT_DIR, "offers");

async function ensureOffersDir() {
  await fs.mkdir(OFFERS_DIR, { recursive: true });
}

function buildDocumentFilename(offer: OfferRow) {
  const base = (offer.offer_no || offer.id).replace(/[^a-zA-Z0-9-_]/g, "-");
  return `${base}.pdf`;
}

const POSSIBLE_EXECUTABLE_PATHS = [
  process.env.PUPPETEER_EXECUTABLE_PATH || "",
  process.env.CHROME_PATH || "",
  "/snap/bin/chromium",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/usr/bin/google-chrome-stable",
].filter(Boolean);

async function resolvePuppeteerExecutable(): Promise<string | undefined> {
  for (const candidate of POSSIBLE_EXECUTABLE_PATHS) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // try next path
    }
  }
  return undefined;
}

export async function generateOfferDocument(id: string) {
  const offer = await getOfferById(id);
  if (!offer) return null;

  await ensureOffersDir();
  const filename = buildDocumentFilename(offer);
  const filePath = path.join(OFFERS_DIR, filename);
  const relativePath = `/uploads/offers/${filename}`;
  const executablePath = await resolvePuppeteerExecutable();
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(renderOfferDocumentHtml(offer), { waitUntil: "networkidle0" });
    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "16mm",
        right: "12mm",
        bottom: "16mm",
        left: "12mm",
      },
    });
  } finally {
    await browser.close();
  }

  await updateOffer(id, { pdf_url: relativePath });

  return getOfferById(id);
}

export async function sendOfferEmail(id: string) {
  const offer = await getOfferById(id);
  if (!offer) return null;

  const html = `
    <h1>Teklif Bilgilendirmesi</h1>
    <p>Sayin ${offer.customer_name},</p>
    <p>Talebiniz icin hazirlanan teklif kaydi sistemimize eklenmistir.</p>
    <p><strong>Teklif No:</strong> ${offer.offer_no || "-"}</p>
    ${offer.pdf_url ? `<p><a href="${offer.pdf_url}">Teklif dokumanini goruntule</a></p>` : ""}
  `;

  await sendMailRaw({
    to: offer.email,
    subject: offer.subject || `Teklifiniz Hazir: ${offer.offer_no || offer.id}`,
    html,
    text: `Teklif No: ${offer.offer_no || offer.id}`,
  });

  await updateOffer(id, { status: "sent", email_sent_at: new Date() as never });
  return getOfferById(id);
}

export async function generateAndSendOffer(id: string) {
  const generated = await generateOfferDocument(id);
  if (!generated) return null;
  return sendOfferEmail(id);
}
