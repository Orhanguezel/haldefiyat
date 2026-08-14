import { describe, expect, test } from "bun:test";
import { toPublicSourceHealthEvent } from "@/modules/prices/source-health";

describe("public source health events", () => {
  test("maps a real ETL row to a safe public success summary", () => {
    expect(toPublicSourceHealthEvent({
      id: 42,
      sourceApi: "antalya_merkez",
      runDate: "2026-08-14",
      occurredAt: "2026-08-14T04:15:00.000Z",
      rowsInserted: 1234,
      status: "ok",
      errorMsg: "must never be exposed",
    })).toMatchObject({
      id: 42,
      sourceApi: "antalya_merkez",
      status: "ok",
      runDate: "2026-08-14",
      occurredAt: "2026-08-14T04:15:00.000Z",
      rowsInserted: 1234,
      message: "1.234 satır başarıyla işlendi.",
    });
  });

  test("normalizes unknown status and never copies raw error content", () => {
    const event = toPublicSourceHealthEvent({
      id: 43,
      sourceApi: "unknown_source",
      status: "fatal",
      rowsInserted: -5,
      errorMsg: "mysql://internal-host/private/path",
    });

    expect(event.status).toBe("error");
    expect(event.rowsInserted).toBe(0);
    expect(event.message).toBe("Aktarım tamamlanamadı; ekip tarafından yeniden denenecek.");
    expect(JSON.stringify(event)).not.toContain("internal-host");
    expect(JSON.stringify(event)).not.toContain("private/path");
  });
});

