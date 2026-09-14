import { describe, expect, test } from "bun:test";
import { consecutiveEmptyRuns } from "@/modules/etl/health";

type Run = Parameters<typeof consecutiveEmptyRuns>[0][number];

function run(overrides: Partial<Run> = {}): Run {
  return {
    id: 1,
    sourceApi: "test_source",
    runDate: "2026-09-12",
    rowsFetched: 0,
    rowsInserted: 0,
    rowsSkipped: 0,
    durationMs: 10,
    status: "ok",
    errorMsg: null,
    createdAt: new Date("2026-09-12T07:30:00Z"),
    ...overrides,
  };
}

describe("ETL health empty-run detection", () => {
  test("counts genuine successful runs that fetched and inserted no rows", () => {
    expect(consecutiveEmptyRuns([run(), run({ id: 2 }), run({ id: 3 })])).toBe(3);
  });

  test("does not treat an unchanged published bulletin as an empty-source failure", () => {
    expect(consecutiveEmptyRuns([
      run({
        rowsFetched: 6,
        rowsSkipped: 6,
        errorMsg: "Kaynak yeni bulten yayinlamadi (son: 2026-05-14, 121 gun once)",
      }),
      run(),
      run(),
    ])).toBe(0);
  });

  test("still counts fetched-zero runs even if an unrelated message exists", () => {
    expect(consecutiveEmptyRuns([run({ errorMsg: "HTTP 200 ama tablo bos" }), run()])).toBe(2);
  });
});
