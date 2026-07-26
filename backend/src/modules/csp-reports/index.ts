import type { FastifyInstance } from "fastify";

type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord {
  return typeof value === "object" && value !== null ? value as JsonRecord : {};
}

function text(value: unknown, max = 2_000): string | null {
  return typeof value === "string" ? value.slice(0, max) : null;
}

export function normalizeCspReports(payload: unknown): JsonRecord[] {
  const reports = Array.isArray(payload) ? payload : [payload];
  return reports.slice(0, 20).map((raw) => {
    const envelope = record(raw);
    const body = record(envelope.body ?? envelope["csp-report"] ?? envelope);
    return {
      type: text(envelope.type, 100) ?? "csp-violation",
      age: typeof envelope.age === "number" ? envelope.age : null,
      documentUri: text(body.documentURL ?? body["document-uri"]),
      violatedDirective: text(body.effectiveDirective ?? body["violated-directive"], 300),
      blockedUri: text(body.blockedURL ?? body["blocked-uri"]),
      sourceFile: text(body.sourceFile ?? body["source-file"]),
      lineNumber: typeof (body.lineNumber ?? body["line-number"]) === "number"
        ? body.lineNumber ?? body["line-number"]
        : null,
      disposition: text(body.disposition, 30),
      statusCode: typeof body.statusCode === "number" ? body.statusCode : null,
    };
  });
}

export async function registerCspReports(api: FastifyInstance) {
  api.post(
    "/csp-reports",
    {
      bodyLimit: 64 * 1024,
      config: { rateLimit: { max: 60, timeWindow: "1 minute" } },
    },
    async (req, reply) => {
      const reports = normalizeCspReports(req.body);
      for (const report of reports) {
        req.log.warn({ event: "csp_violation", report }, "CSP violation report");
      }
      return reply.code(204).send();
    },
  );
}
