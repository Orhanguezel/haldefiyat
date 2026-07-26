import { describe, expect, it, vi } from "vitest";
import {
  isSampledWebVitalsSession,
  isSyntheticUserAgent,
  webVitalsSampleRate,
} from "./web-vitals-sampling";

function memoryStorage(initial?: string) {
  let value = initial ?? null;
  return {
    getItem: vi.fn(() => value),
    setItem: vi.fn((_key: string, next: string) => {
      value = next;
    }),
  };
}

describe("Web Vitals sampling", () => {
  it("uses a 10% default and clamps configured rates", () => {
    expect(webVitalsSampleRate(undefined)).toBe(0.1);
    expect(webVitalsSampleRate("0.25")).toBe(0.25);
    expect(webVitalsSampleRate("-2")).toBe(0);
    expect(webVitalsSampleRate("4")).toBe(1);
    expect(webVitalsSampleRate("invalid")).toBe(0.1);
  });

  it("keeps the first sampling decision stable for the session", () => {
    const storage = memoryStorage();
    const first = isSampledWebVitalsSession({
      storage,
      storageKey: "sample",
      rate: 0.1,
      random: () => 0.05,
    });
    const second = isSampledWebVitalsSession({
      storage,
      storageKey: "sample",
      rate: 0.1,
      random: () => 0.99,
    });

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(storage.setItem).toHaveBeenCalledTimes(1);
  });

  it("falls back to a sampling decision when storage is unavailable", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: vi.fn(),
    };

    expect(isSampledWebVitalsSession({
      storage,
      storageKey: "sample",
      rate: 0.1,
      random: () => 0.05,
    })).toBe(true);
  });

  it("recognizes synthetic and crawler user agents", () => {
    expect(isSyntheticUserAgent("Mozilla/5.0 Chrome/125 Safari/537.36")).toBe(false);
    expect(isSyntheticUserAgent("Mozilla/5.0 Lighthouse")).toBe(true);
    expect(isSyntheticUserAgent("Google-InspectionTool/1.0")).toBe(true);
    expect(isSyntheticUserAgent("ExampleBot/2.0")).toBe(true);
  });
});
