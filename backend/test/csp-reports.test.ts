import { describe, expect, it } from "bun:test";
import Fastify from "fastify";
import { normalizeCspReports, registerCspReports } from "../src/modules/csp-reports";

describe("CSP report normalization", () => {
  it("normalizes legacy report-uri payloads", () => {
    expect(normalizeCspReports({
      "csp-report": {
        "document-uri": "https://haldefiyat.com/",
        "violated-directive": "script-src-elem",
        "blocked-uri": "https://example.invalid/tracker.js",
        "source-file": "https://haldefiyat.com/app.js",
        "line-number": 42,
      },
    })).toEqual([{
      type: "csp-violation",
      age: null,
      documentUri: "https://haldefiyat.com/",
      violatedDirective: "script-src-elem",
      blockedUri: "https://example.invalid/tracker.js",
      sourceFile: "https://haldefiyat.com/app.js",
      lineNumber: 42,
      disposition: null,
      statusCode: null,
    }]);
  });

  it("normalizes Reporting API payloads", () => {
    expect(normalizeCspReports([{
      type: "csp-violation",
      age: 17,
      body: {
        documentURL: "https://haldefiyat.com/urun/domates",
        effectiveDirective: "img-src",
        blockedURL: "https://images.invalid/domates.jpg",
        sourceFile: "https://haldefiyat.com/chunk.js",
        lineNumber: 8,
        disposition: "report",
        statusCode: 200,
      },
    }])).toEqual([{
      type: "csp-violation",
      age: 17,
      documentUri: "https://haldefiyat.com/urun/domates",
      violatedDirective: "img-src",
      blockedUri: "https://images.invalid/domates.jpg",
      sourceFile: "https://haldefiyat.com/chunk.js",
      lineNumber: 8,
      disposition: "report",
      statusCode: 200,
    }]);
  });

  it("caps batch size and string lengths", () => {
    const payload = Array.from({ length: 25 }, () => ({
      body: {
        documentURL: "x".repeat(2_500),
        effectiveDirective: "y".repeat(400),
      },
    }));

    const reports = normalizeCspReports(payload);

    expect(reports).toHaveLength(20);
    expect(reports[0]?.documentUri).toHaveLength(2_000);
    expect(reports[0]?.violatedDirective).toHaveLength(300);
  });

  it("does not copy unknown payload fields into logs", () => {
    const [report] = normalizeCspReports({
      body: {
        documentURL: "https://haldefiyat.com/",
        cookies: "session=secret",
        requestBody: "private",
      },
      user: { email: "person@example.com" },
    });

    expect(report).not.toHaveProperty("cookies");
    expect(report).not.toHaveProperty("requestBody");
    expect(report).not.toHaveProperty("user");
  });

  it("removes query strings and fragments from logged HTTP URLs", () => {
    const [report] = normalizeCspReports({
      body: {
        documentURL: "https://haldefiyat.com/urun/domates?email=person%40example.com#prices",
        blockedURL: "https://tracker.invalid/pixel?id=secret",
        sourceFile: "https://haldefiyat.com/app.js?v=123",
      },
    });

    expect(report?.documentUri).toBe("https://haldefiyat.com/urun/domates");
    expect(report?.blockedUri).toBe("https://tracker.invalid/pixel");
    expect(report?.sourceFile).toBe("https://haldefiyat.com/app.js");
  });

  it("preserves CSP keywords and non-HTTP blocked URI values", () => {
    const [report] = normalizeCspReports({
      body: {
        blockedURL: "inline",
        sourceFile: "data",
      },
    });

    expect(report?.blockedUri).toBe("inline");
    expect(report?.sourceFile).toBe("data");
  });
});

describe("CSP report endpoint", () => {
  it("accepts a browser report and rejects oversized bodies", async () => {
    const app = Fastify({ logger: false });
    await registerCspReports(app);

    const accepted = await app.inject({
      method: "POST",
      url: "/csp-reports",
      payload: {
        "csp-report": {
          "document-uri": "https://haldefiyat.com/",
          "violated-directive": "script-src",
        },
      },
    });
    expect(accepted.statusCode).toBe(204);

    const oversized = await app.inject({
      method: "POST",
      url: "/csp-reports",
      payload: { body: { documentURL: `https://haldefiyat.com/?q=${"x".repeat(70_000)}` } },
    });
    expect(oversized.statusCode).toBe(413);

    await app.close();
  });
});
