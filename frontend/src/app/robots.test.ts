import { describe, expect, it } from "vitest";
import robots from "./robots";

describe("robots policy", () => {
  it("keeps generic API crawling blocked", () => {
    const policy = robots();
    const generic = Array.isArray(policy.rules)
      ? policy.rules.find((rule) => rule.userAgent === "*")
      : undefined;

    expect(generic?.disallow).toContain("/api/");
  });

  it("allows documented read-only data surfaces for AI crawlers", () => {
    const policy = robots();
    const ai = Array.isArray(policy.rules)
      ? policy.rules.find((rule) => Array.isArray(rule.userAgent))
      : undefined;

    expect(ai?.allow).toEqual(expect.arrayContaining([
      "/api/v1/prices",
      "/api/v1/index",
      "/api/v1/sources/status",
      "/api/docs/json",
    ]));
    expect(ai?.disallow).toContain("/api/");
  });
});
