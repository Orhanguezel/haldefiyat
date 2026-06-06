import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { parseTmoAlimResmi } from "../../../backend/src/modules/etl/sources/borsa/tmo-alim";
import { parseBorsaHtml, parseBorsaText } from "../../../backend/src/modules/etl/sources/borsa/text-parsers";
import type { BorsaPriceRow } from "../../../backend/src/modules/etl/sources/borsa/types";

const server = new McpServer({
  name: "hal-borsa-mcp",
  version: "0.1.0",
});

function jsonContent(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "HaldeFiyatMCP/0.1 (+https://haldefiyat.com)" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
  return res.text();
}

server.tool("tmo_alim_fiyatlari", {}, async () => {
  return jsonContent({
    source: "TMO Resmi Alım",
    type: "resmi",
    rows: parseTmoAlimResmi(),
  });
});

server.tool("tmo_piyasa_bulteni", { date: z.string().optional() }, async () => {
  const url = "https://www.tmo.gov.tr/Upload/Document/piyasabulteni/piyasabulteni_tr.pdf";
  const text = await fetchText(url);
  return jsonContent({
    source: "TMO Piyasa Bülteni",
    type: "borsa",
    parserNote: "PDF text extraction canlı doğrulama bekliyor; tool mevcut parser sözleşmesini döndürür.",
    rows: parseBorsaText(text),
  });
});

server.tool(
  "borsa_gunluk",
  {
    borsa: z.enum(["polatli", "izmir"]),
    date: z.string().optional(),
  },
  async ({ borsa }: { borsa: "polatli" | "izmir"; date?: string }) => {
    const url = borsa === "polatli"
      ? "https://bulten.polatliborsa.org.tr/gunluk-bulten.html"
      : "https://itb.org.tr/GunlukBultenler/2-pamuk-bulteni";
    const html = await fetchText(url);
    return jsonContent({
      source: borsa,
      type: "borsa",
      rows: parseBorsaHtml(html),
    });
  },
);

server.tool(
  "urun_fiyat",
  {
    urun: z.string(),
    kaynak: z.enum(["tmo_alim", "tmo_bulten", "polatli", "izmir"]).optional(),
  },
  async ({ urun, kaynak }: { urun: string; kaynak?: "tmo_alim" | "tmo_bulten" | "polatli" | "izmir" }) => {
    const alimRows = !kaynak || kaynak === "tmo_alim" ? parseTmoAlimResmi() : [];
    const rows = alimRows.filter((row: BorsaPriceRow) => row.name.toLocaleLowerCase("tr-TR").includes(urun.toLocaleLowerCase("tr-TR")));
    return jsonContent({ urun, kaynak: kaynak ?? "all", rows });
  },
);

server.tool("kaynak_durum", {}, async () => {
  return jsonContent({
    sources: [
      { key: "tmo_alim_resmi", type: "resmi", status: "ok", mode: "static_seed" },
      { key: "tmo_piyasa_bulteni", type: "borsa", status: "needs_pdf_text_validation" },
      { key: "polatli_borsa", type: "borsa", status: "configured" },
      { key: "izmir_borsa_pamuk", type: "borsa", status: "configured" },
    ],
  });
});

const transport = new StdioServerTransport();
await server.connect(transport);
