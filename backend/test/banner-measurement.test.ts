import { describe, expect, test } from "bun:test";
import {
  adDeviceFromUserAgent,
  adMetricScope,
  isNonHumanAdTraffic,
  safeAdDestination,
} from "@/modules/banners";
import {
  adClickCooldownAllows,
  summarizeCampaignMetrics,
} from "@/modules/banners/repository";

describe("reklam trafik ölçüm filtresi", () => {
  test("bot, eksik user-agent ve düşük bot skorunu filtreler", () => {
    expect(isNonHumanAdTraffic({})).toBeTrue();
    expect(isNonHumanAdTraffic({ "user-agent": "Googlebot/2.1" })).toBeTrue();
    expect(isNonHumanAdTraffic({ "user-agent": "Mozilla/5.0", "cf-bot-score": "12" })).toBeTrue();
    expect(isNonHumanAdTraffic({ "user-agent": "Mozilla/5.0", "cf-bot-score": "90" })).toBeFalse();
  });

  test("tekrarlanan tıklamayı cooldown süresinde reddeder", () => {
    const now = new Date("2026-07-27T12:00:00.000Z").getTime();
    expect(adClickCooldownAllows(new Date(now - 10_000), now, 30)).toBeFalse();
    expect(adClickCooldownAllows(new Date(now - 30_000), now, 30)).toBeTrue();
    expect(adClickCooldownAllows(null, now, 30)).toBeTrue();
  });
});

describe("reklam cihaz, slot ve yönlendirme ölçümü", () => {
  test("mobil ve masaüstü cihazını ayırır", () => {
    expect(adDeviceFromUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Mobile")).toBe("mobile");
    expect(adDeviceFromUserAgent("Mozilla/5.0 (X11; Linux x86_64) Chrome/140")).toBe("desktop");
  });

  test("en özgül sayfa kapsamını ölçüm anahtarına yazar", () => {
    expect(adMetricScope({ page_type: "listing_detail", city: "denizli", listing: "42" })).toBe("listing:42");
    expect(adMetricScope({ page_type: "home" })).toBe("page_type:home");
    expect(adMetricScope({})).toBe("global");
  });

  test("güvenli iç ve dış hedefleri kabul edip açık yönlendirmeyi reddeder", () => {
    expect(safeAdDestination("/ilan/black-diamond-erik")).toBe("/ilan/black-diamond-erik");
    expect(safeAdDestination("https://example.com/kampanya")).toBe("https://example.com/kampanya");
    expect(safeAdDestination("//evil.example")).toBeNull();
    expect(safeAdDestination("javascript:alert(1)")).toBeNull();
  });
});

describe("dashboard, CSV ve PDF toplamları", () => {
  test("tüm rapor biçimlerinin kullandığı kampanya toplamını tek kez hesaplar", () => {
    const rows = [
      { impressions: 100, uniqueImpressions: 80, clicks: 12, uniqueClicks: 10 },
      { impressions: 60, uniqueImpressions: 45, clicks: 8, uniqueClicks: 6 },
    ];
    expect(summarizeCampaignMetrics(rows)).toEqual({
      impressions: 160,
      uniqueImpressions: 125,
      clicks: 20,
      uniqueClicks: 16,
    });
  });

  test("cihaz kırılımlarının toplamı genel toplamla eşleşir", () => {
    const desktop = summarizeCampaignMetrics([{ impressions: 90, uniqueImpressions: 70, clicks: 9, uniqueClicks: 8 }]);
    const mobile = summarizeCampaignMetrics([{ impressions: 70, uniqueImpressions: 55, clicks: 11, uniqueClicks: 8 }]);
    const total = summarizeCampaignMetrics([
      { impressions: desktop.impressions, uniqueImpressions: desktop.uniqueImpressions, clicks: desktop.clicks, uniqueClicks: desktop.uniqueClicks },
      { impressions: mobile.impressions, uniqueImpressions: mobile.uniqueImpressions, clicks: mobile.clicks, uniqueClicks: mobile.uniqueClicks },
    ]);
    expect(total).toEqual({ impressions: 160, uniqueImpressions: 125, clicks: 20, uniqueClicks: 16 });
  });
});
