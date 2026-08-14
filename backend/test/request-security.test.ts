import { describe, expect, test } from "bun:test";
import { isCrossSiteCookieMutation } from "@/security/request-security";

const base = {
  method: "POST",
  accessCookie: "jwt",
  allowedOrigins: ["https://haldefiyat.com", "https://admin.haldefiyat.com"],
};

describe("cookie mutation CSRF gate", () => {
  test("rejects cross-site cookie mutations", () => {
    expect(isCrossSiteCookieMutation({ ...base, secFetchSite: "cross-site" })).toBeTrue();
    expect(isCrossSiteCookieMutation({ ...base, origin: "https://evil.example" })).toBeTrue();
  });

  test("allows same-origin cookies, bearer clients and read requests", () => {
    expect(isCrossSiteCookieMutation({ ...base, origin: "https://haldefiyat.com" })).toBeFalse();
    expect(isCrossSiteCookieMutation({ ...base, origin: "https://evil.example", authorization: "Bearer token" })).toBeFalse();
    expect(isCrossSiteCookieMutation({ ...base, method: "GET", origin: "https://evil.example" })).toBeFalse();
  });
});

