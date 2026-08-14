import { describe, expect, it } from "bun:test";
import { normalizeAuditUser } from "../src/plugins/audit-user";

function requestWithUser(user: unknown) {
  return { user } as Parameters<typeof normalizeAuditUser>[0];
}

describe("audit request user identity", () => {
  it("reads the standard JWT sub claim", () => {
    expect(normalizeAuditUser(requestWithUser({ sub: "buyer-1", role: "user" }))).toEqual({
      userId: "buyer-1",
      isAdmin: 0,
    });
  });

  it("keeps the legacy id claim and admin role support", () => {
    expect(normalizeAuditUser(requestWithUser({ id: "admin-1", roles: ["admin"] }))).toEqual({
      userId: "admin-1",
      isAdmin: 1,
    });
  });

  it("does not invent an identity for malformed payloads", () => {
    expect(normalizeAuditUser(requestWithUser(null))).toEqual({ userId: null, isAdmin: 0 });
    expect(normalizeAuditUser(requestWithUser({ role: "user" }))).toEqual({ userId: null, isAdmin: 0 });
  });
});
