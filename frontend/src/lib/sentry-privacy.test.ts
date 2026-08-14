import { describe, expect, it } from "vitest";
import type { ErrorEvent } from "@sentry/nextjs";
import { scrubSentryEvent } from "../../sentry-privacy";

describe("scrubSentryEvent", () => {
  it("removes request, user and unknown-key contact PII", () => {
    const event: ErrorEvent = {
      type: undefined,
      message: "Profil 0532 123 45 67 için hata",
      request: {
        url: "https://haldefiyat.com/ilanlar?q=orhan@example.com&phone=05321234567&utm_source=google",
        data: { note: "beni ara" },
        cookies: { session: "secret" },
        headers: { authorization: "Bearer secret", "x-debug": "orhan@example.com" },
      },
      user: { id: "safe-id", email: "orhan@example.com", username: "orhan", ip_address: "127.0.0.1" },
      extra: { payload: { contact: "+90 532 123 45 67", password: "secret" } },
      breadcrumbs: [{ message: "Mail orhan@example.com", data: { note: "özel", route: "0532 123 45 67" } }],
      exception: { values: [{ type: "Error", value: "orhan@example.com bulunamadı" }] },
    };

    const scrubbed = scrubSentryEvent(event);
    const serialized = JSON.stringify(scrubbed);

    expect(scrubbed.request?.data).toBeUndefined();
    expect(scrubbed.request?.cookies).toBeUndefined();
    expect(scrubbed.request?.headers?.authorization).toBe("[redacted]");
    expect(scrubbed.request?.url).toContain("utm_source=google");
    expect(scrubbed.user).toEqual({ id: "safe-id" });
    expect(serialized).not.toContain("orhan@example.com");
    expect(serialized).not.toContain("0532 123 45 67");
    expect(serialized).not.toContain("05321234567");
    expect(serialized).not.toContain("Bearer secret");
    expect(serialized).not.toContain('"password":"secret"');
  });
});
