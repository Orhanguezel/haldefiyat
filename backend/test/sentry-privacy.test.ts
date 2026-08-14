import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/node";
import { scrubBackendSentryEvent } from "../src/plugins/sentry-privacy";

describe("scrubBackendSentryEvent", () => {
  it("removes request payloads, auth data and contact PII recursively", () => {
    const event: ErrorEvent = {
      type: undefined,
      message: "0532 123 45 67 için hata",
      request: {
        url: "https://haldefiyat.com/api/v1/listings?email=orhan@example.com",
        data: { note: "beni ara" },
        cookies: { session: "secret" },
        headers: { authorization: "Bearer secret" },
      },
      user: { id: "safe-id", email: "orhan@example.com", username: "orhan", ip_address: "127.0.0.1" },
      extra: { payload: { contact: "+90 532 123 45 67", password: "secret" } },
      breadcrumbs: [{ message: "Mail orhan@example.com", data: { note: "özel", route: "0532 123 45 67" } }],
      exception: { values: [{ type: "Error", value: "orhan@example.com bulunamadı" }] },
    };

    const scrubbed = scrubBackendSentryEvent(event);
    const serialized = JSON.stringify(scrubbed);

    expect(scrubbed.request?.url).toBe("https://haldefiyat.com/api/v1/listings");
    expect(scrubbed.request?.data).toBeUndefined();
    expect(scrubbed.request?.cookies).toBeUndefined();
    expect(scrubbed.request?.headers).toBeUndefined();
    expect(scrubbed.user).toEqual({ id: "safe-id" });
    expect(serialized).not.toContain("orhan@example.com");
    expect(serialized).not.toContain("0532 123 45 67");
    expect(serialized).not.toContain("Bearer secret");
    expect(serialized).not.toContain('"password":"secret"');
  });
});
