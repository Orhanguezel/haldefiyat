import { describe, expect, it } from "vitest";
import { canShowPublicYoy, PUBLIC_YOY_RELIABLE_FROM } from "./yoy-policy";

describe("public YoY policy", () => {
  it("blocks missing and incomplete recovery windows", () => {
    expect(canShowPublicYoy(undefined)).toBe(false);
    expect(canShowPublicYoy("2027-04-30")).toBe(false);
  });

  it("opens on the documented full-year boundary", () => {
    expect(PUBLIC_YOY_RELIABLE_FROM).toBe("2027-05-01");
    expect(canShowPublicYoy("2027-05-01")).toBe(true);
  });
});
