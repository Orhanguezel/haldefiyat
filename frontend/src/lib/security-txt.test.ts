import { describe, expect, it } from "vitest";
import { buildSecurityTxt } from "./security-txt";

describe("buildSecurityTxt", () => {
  it("builds an RFC-style policy from the configured contact", () => {
    expect(buildSecurityTxt({
      contactEmail: "security@example.com",
      siteUrl: "https://example.com/",
      now: new Date("2026-07-26T10:00:00Z"),
    })).toBe([
      "Contact: mailto:security@example.com",
      "Expires: 2027-07-26T10:00:00.000Z",
      "Canonical: https://example.com/.well-known/security.txt",
      "Preferred-Languages: tr, en",
      "",
    ].join("\n"));
  });

  it("rejects missing, malformed or insecure configuration", () => {
    expect(buildSecurityTxt({
      contactEmail: "",
      siteUrl: "https://example.com",
    })).toBeNull();
    expect(buildSecurityTxt({
      contactEmail: "invalid\nContact: mailto:attacker@example.com",
      siteUrl: "https://example.com",
    })).toBeNull();
    expect(buildSecurityTxt({
      contactEmail: "security@example.com",
      siteUrl: "http://example.com",
    })).toBeNull();
  });
});
