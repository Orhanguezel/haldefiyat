import { describe, expect, it } from "vitest";
import { formatDateTr, parseIsoDate } from "./date-format";

describe("date-format", () => {
  it("formats date-only values without timezone drift", () => {
    expect(formatDateTr("2026-08-09")).toBe("9 Ağustos 2026");
  });

  it("formats full ISO timestamps without appending a second time component", () => {
    expect(formatDateTr("2026-08-13T17:31:20.819Z")).toBe("13 Ağustos 2026");
  });

  it("returns null for invalid or missing values", () => {
    expect(parseIsoDate("not-a-date")).toBeNull();
    expect(formatDateTr("not-a-date")).toBeNull();
    expect(formatDateTr("Invalid Date")).toBeNull();
    expect(formatDateTr("undefined")).toBeNull();
    expect(formatDateTr("NaN")).toBeNull();
    expect(formatDateTr("2026-02-31")).toBeNull();
    expect(formatDateTr(undefined)).toBeNull();
    expect(formatDateTr(null)).toBeNull();
  });
});
