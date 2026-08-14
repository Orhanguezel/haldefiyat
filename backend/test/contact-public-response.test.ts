import { describe, expect, test } from "bun:test";

import { sanitizePublicContactResponse } from "@/routes/shared";

describe("public contact response privacy", () => {
  test("returns only the request receipt for a created contact", () => {
    const response = sanitizePublicContactResponse(201, {
      id: "contact-123",
      name: "Test User",
      email: "private@example.com",
      phone: "+90 555 000 00 00",
      message: "private message",
      ip: "127.0.0.1",
    });

    expect(response).toEqual({ ok: true, status: "received", requestId: "contact-123" });
    expect(JSON.stringify(response)).not.toContain("private@example.com");
    expect(JSON.stringify(response)).not.toContain("555");
  });

  test("does not rewrite validation or honeypot responses", () => {
    expect(sanitizePublicContactResponse(400, { error: "INVALID_BODY" })).toEqual({ error: "INVALID_BODY" });
    expect(sanitizePublicContactResponse(200, { ok: true })).toEqual({ ok: true });
  });
});
