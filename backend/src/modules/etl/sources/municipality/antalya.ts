/**
 * Antalya Buyuksehir gunluk hal bulteni (PDF).
 *
 * NEDEN: bagli oldugumuz ANTKOMDER dernek yayini 23 Haziran 2026'da durdu
 * ("Fiyat Bekleniyor"), Antalya Toptanci Hali 77 gundur kurumus gorunuyordu.
 * Belediye ayni veriyi kendi panelinden gunluk PDF olarak yayimliyor.
 *
 * Akis: JSON ucu tarih alir, o gunun PDF adresini doner → PDF indirilir →
 * `pdftotext -layout` ile metne cevrilir → iki sutunlu tablo ayristirilir.
 * Uc oturum/cerez istemiyor; gecmis tarihleri de kabul ediyor (backfill mumkun).
 *
 * Tarih ISTEKTEN DEGIL BELGEDEN alinir: baslik satirindaki tarih esas,
 * boylece kaynak yeni bulten yayimlamadiginda eski liste bugunun tarihiyle
 * yeniden yazilmaz.
 */
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export interface AntalyaRow {
  name: string;
  category: string | null;
  unit: string | null;
  avg: number | null;
  min: number | null;
  max: number | null;
  recordedDate: string;
}

const UNITS: Record<string, string> = { kg: "kg", adet: "adet", "bağ": "bag", demet: "demet", koli: "koli", paket: "paket" };
const UNIT_PATTERN = "Kg|Adet|Bağ|Demet|Koli|Paket";
// "1.040,00" → 1040 ; binlik ayirici nokta, ondalik virgul.
const money = (raw: string): number => Number(raw.replace(/\./g, "").replace(",", "."));

/** Bolum basliklari da iki sutuna dagilmis: SEBZELER solda, MEYVELER/ITHAL sagda. */
const SECTIONS: Array<[RegExp, string]> = [
  [/SEBZELER/u, "sebze"],
  [/MEYVELER/u, "meyve"],
  [/İTHAL/u, "meyve"],
];

/**
 * Sag sutunun basladigi kolon. PDF'in iki sutunlu duzeni sabit degil, o yuzden
 * satirlarda ikinci eslesmenin en sol konumundan turetilir; tek sutunlu bir
 * varyant gelirse her sey sol sutun sayilir.
 */
function secondColumnStart(lines: string[], rx: RegExp): number {
  let min = Infinity;
  for (const line of lines) {
    const starts = [...line.matchAll(rx)].map((m) => m.index ?? 0);
    if (starts.length >= 2) min = Math.min(min, starts[1]!);
  }
  return Number.isFinite(min) ? min - 40 : Infinity;
}

export function parseAntalyaHalText(text: string): AntalyaRow[] {
  const dateMatch = /GÜNLÜK\s+FİYAT\s+LİSTESİ\s+(\d{2})\.(\d{2})\.(\d{4})/u.exec(text)
    ?? /(\d{2})\.(\d{2})\.(\d{4})/u.exec(text);
  if (!dateMatch) throw new Error("Antalya bulteninde tarih bulunamadi");
  const recordedDate = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
  if (new Date(`${recordedDate}T12:00:00Z`).toISOString().slice(0, 10) !== recordedDate) {
    throw new Error(`Antalya bulteninde gecersiz tarih: ${recordedDate}`);
  }

  const lines = text.split("\n");
  const rowRx = new RegExp(String.raw`(\d{1,3})\s+(\S.*?)\s+(${UNIT_PATTERN})\s+([\d.]+,\d{2})\s+([\d.]+,\d{2})`, "gu");
  const boundary = secondColumnStart(lines, rowRx);
  const category = { left: null as string | null, right: null as string | null };
  const rows: AntalyaRow[] = [];

  for (const line of lines) {
    for (const [pattern, label] of SECTIONS) {
      const hit = pattern.exec(line);
      if (hit) category[(hit.index ?? 0) < boundary ? "left" : "right"] = label;
    }

    for (const m of line.matchAll(rowRx)) {
      const name = m[2]!.replace(/\s+/g, " ").trim();
      const unit = UNITS[m[3]!.toLocaleLowerCase("tr-TR")] ?? null;
      const min = money(m[4]!);
      const max = money(m[5]!);
      // 0 fiyat "kotasyon yok" demektir, bedava mal degil.
      if (!name || !unit || !Number.isFinite(min) || !Number.isFinite(max)) continue;
      if (min <= 0 || max < min) continue;
      rows.push({
        name,
        category: category[(m.index ?? 0) < boundary ? "left" : "right"],
        unit,
        avg: null,
        min,
        max,
        recordedDate,
      });
    }
  }

  if (rows.length === 0) throw new Error("Antalya bulteninde gecerli fiyat satiri yok");
  return rows;
}

/**
 * PDF baytlarini metne cevirir. poppler-utils (pdftotext) hem lokalde hem VPS'te kurulu.
 *
 * PDF stdin'den DEGIL gecici dosyadan okunur: execFile'in `input` secenegi yok
 * (o spawnSync'e ait), stdin acik birakilinca pdftotext suresiz bekliyor.
 */
export async function pdfToText(pdf: Buffer): Promise<string> {
  const file = join(tmpdir(), `hal-antalya-${randomUUID()}.pdf`);
  try {
    await writeFile(file, pdf);
    const { stdout } = await run("pdftotext", ["-layout", "-enc", "UTF-8", file, "-"], {
      maxBuffer: 32 * 1024 * 1024,
    });
    return stdout;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/ENOENT/.test(message)) throw new Error("pdftotext bulunamadi (poppler-utils kurulu degil)");
    throw new Error(`pdftotext basarisiz: ${message}`);
  } finally {
    await rm(file, { force: true }).catch(() => undefined);
  }
}

interface PdfLookup { PdfUrl?: string; PdfDate?: string; Mesaj?: string }

/** Verilen gun icin PDF adresini sorar; kaynak o gun yayin yapmadiysa null doner. */
export async function lookupAntalyaPdfUrl(baseUrl: string, date: string): Promise<string | null> {
  const res = await fetch(`${baseUrl}/Methods.aspx/GetGunlukHalFiyatPdf`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${baseUrl}/hal-gunluk-fiyat`,
    },
    body: JSON.stringify({ tarih: date }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`Antalya PDF sorgusu HTTP ${res.status}`);
  const body = (await res.json()) as { d?: PdfLookup };
  const url = body.d?.PdfUrl;
  if (!url) return null; // { Mesaj: "Fiyat listesi bulunamadı." }
  return new URL(url, baseUrl).href;
}

export async function fetchAntalyaHalBulletin(baseUrl: string, date: string): Promise<AntalyaRow[] | null> {
  const pdfUrl = await lookupAntalyaPdfUrl(baseUrl, date);
  if (!pdfUrl) return null;
  const res = await fetch(pdfUrl, { signal: AbortSignal.timeout(60_000) });
  if (!res.ok) throw new Error(`Antalya PDF indirilemedi HTTP ${res.status}`);
  return parseAntalyaHalText(await pdfToText(Buffer.from(await res.arrayBuffer())));
}
