import { afterEach, describe, expect, it } from "vitest";

const originalNewsletterSecret = process.env.NEWSLETTER_SECRET;
const originalJwtSecret = process.env.JWT_SECRET;

afterEach(() => {
  if (originalNewsletterSecret === undefined) delete process.env.NEWSLETTER_SECRET;
  else process.env.NEWSLETTER_SECRET = originalNewsletterSecret;
  if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = originalJwtSecret;
});

describe("newsletter unsubscribe token secret", () => {
  it("uses the configured newsletter secret", async () => {
    process.env.NEWSLETTER_SECRET = "newsletter-test-secret";
    delete process.env.JWT_SECRET;
    const { makeUnsubToken, verifyUnsubToken } = await import("../src/modules/newsletter/token");
    const token = makeUnsubToken("user@example.com");
    expect(verifyUnsubToken("user@example.com", token)).toBe(true);
  });

  it("rejects startup use when no signing secret exists", async () => {
    delete process.env.NEWSLETTER_SECRET;
    delete process.env.JWT_SECRET;
    const { makeUnsubToken } = await import("../src/modules/newsletter/token");
    expect(() => makeUnsubToken("user@example.com")).toThrow("NEWSLETTER_SECRET or JWT_SECRET is required");
  });
});
