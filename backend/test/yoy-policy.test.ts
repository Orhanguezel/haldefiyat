import { describe, expect, it } from "bun:test";
import {
  PUBLIC_YOY_RELIABLE_FROM,
  canPublishYoy,
  publicYoyStatus,
} from "../src/modules/prices/yoy-policy";

describe("public YoY policy", () => {
  it("blocks missing and pre-recovery comparison windows", () => {
    expect(publicYoyStatus(null)).toBe("insufficient_history");
    expect(publicYoyStatus("2027-04-30", 20)).toBe("insufficient_history");
  });

  it("opens at the documented boundary when pair coverage is sufficient", () => {
    expect(PUBLIC_YOY_RELIABLE_FROM).toBe("2027-05-01");
    expect(canPublishYoy("2027-05-01", 5)).toBe(true);
  });

  it("still blocks sparse matched baskets after the date boundary", () => {
    expect(publicYoyStatus("2027-05-01", 4)).toBe("insufficient_pairs");
    expect(canPublishYoy("2028-01-01", 4)).toBe(false);
  });
});
