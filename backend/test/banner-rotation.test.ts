import { describe, expect, test } from "bun:test";
import { deliveryWeight, isVisitorFrequencyBlocked, pickWeightedBanner } from "../src/modules/banners/repository";

describe("banner weighted rotation", () => {
  test("returns null for an empty candidate list", () => {
    expect(pickWeightedBanner([])).toBeNull();
  });

  test("maps the random interval according to weights", () => {
    const rows = [{ id: 1, weight: 1 }, { id: 2, weight: 3 }];
    expect(pickWeightedBanner(rows, () => 0)?.id).toBe(1);
    expect(pickWeightedBanner(rows, () => 0.249)?.id).toBe(1);
    expect(pickWeightedBanner(rows, () => 0.25)?.id).toBe(2);
    expect(pickWeightedBanner(rows, () => 0.999)?.id).toBe(2);
  });

  test("converges on the configured display distribution", () => {
    const rows = [{ id: 1, weight: 1 }, { id: 2, weight: 3 }];
    let state = 123456789;
    const counts = new Map<number, number>();
    for (let index = 0; index < 10_000; index += 1) {
      state = (1664525 * state + 1013904223) >>> 0;
      const selected = pickWeightedBanner(rows, () => state / 2 ** 32);
      if (selected) counts.set(selected.id, (counts.get(selected.id) ?? 0) + 1);
    }
    const heavyShare = (counts.get(2) ?? 0) / 10_000;
    expect(heavyShare).toBeGreaterThan(0.73);
    expect(heavyShare).toBeLessThan(0.77);
  });

  test("never gives zero or negative weights an unfair empty range", () => {
    const rows = [{ id: 1, weight: 0 }, { id: 2, weight: -5 }];
    expect(pickWeightedBanner(rows, () => 0.1)?.id).toBe(1);
    expect(pickWeightedBanner(rows, () => 0.9)?.id).toBe(2);
  });
});

describe("guaranteed impression pacing", () => {
  const startAt = new Date("2026-07-01T00:00:00Z");
  const endAt = new Date("2026-07-11T00:00:00Z");
  const now = new Date("2026-07-06T00:00:00Z").getTime();

  test("boosts a campaign behind its delivery schedule", () => {
    expect(deliveryWeight({ weight: 10, impressionLimit: 1000, impressions: 100, startAt, endAt }, now)).toBe(30);
  });

  test("reduces a campaign far ahead of its delivery schedule", () => {
    expect(deliveryWeight({ weight: 10, impressionLimit: 1000, impressions: 900, startAt, endAt }, now)).toBeCloseTo(5.56, 1);
  });
});

describe("banner visitor frequency", () => {
  const banner = { visitorDailyImpressionLimit: 3, visitorCampaignImpressionLimit: 20 };

  test("blocks the daily, campaign and same-page limits", () => {
    expect(isVisitorFrequencyBlocked(banner, {
      totalImpressions: 4, dailyImpressions: 3, dailyDate: "2026-07-27", lastPageHash: "other",
    }, "page", "2026-07-27")).toBeTrue();
    expect(isVisitorFrequencyBlocked(banner, {
      totalImpressions: 20, dailyImpressions: 0, dailyDate: "2026-07-27", lastPageHash: "other",
    }, "page", "2026-07-27")).toBeTrue();
    expect(isVisitorFrequencyBlocked(banner, {
      totalImpressions: 1, dailyImpressions: 1, dailyDate: "2026-07-27", lastPageHash: "page",
      lastImpressionAt: new Date(),
    }, "page", "2026-07-27")).toBeTrue();
  });

  test("resets only the daily counter when the date changes", () => {
    expect(isVisitorFrequencyBlocked(banner, {
      totalImpressions: 4, dailyImpressions: 99, dailyDate: "2026-07-26", lastPageHash: "other",
    }, "page", "2026-07-27")).toBeFalse();
  });
});
