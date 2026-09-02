import { describe, expect, it } from "bun:test";
import { createHmac } from "crypto";
import { verifyStripeSignature } from "@/modules/billing";

/**
 * Webhook imzasi odeme akisinin TEK guvenlik kapisidir: gecerli imza abonelik
 * acar, yani para karsiligi erisim verir. Sahte istek gecerse odeme yapmadan
 * Pro alinabilir. Bu yuzden dogrulama SDK'siz yazildi ve burada kanitlaniyor.
 */
const SECRET = "whsec_test_secret";

function sign(body: string, secret = SECRET, at = Math.floor(Date.now() / 1000)): string {
  const sig = createHmac("sha256", secret).update(`${at}.`).update(Buffer.from(body)).digest("hex");
  return `t=${at},v1=${sig}`;
}

describe("stripe webhook imzasi", () => {
  const body = JSON.stringify({ id: "evt_1", type: "checkout.session.completed" });

  it("gecerli imzayi kabul eder", () => {
    expect(verifyStripeSignature(Buffer.from(body), sign(body), SECRET)).toBe(true);
  });

  it("baska bir sirla uretilmis imzayi reddeder", () => {
    expect(verifyStripeSignature(Buffer.from(body), sign(body, "whsec_baska"), SECRET)).toBe(false);
  });

  it("gövde degistirilmisse reddeder", () => {
    const header = sign(body);
    const kurcalanmis = JSON.stringify({ id: "evt_1", type: "customer.subscription.deleted" });
    expect(verifyStripeSignature(Buffer.from(kurcalanmis), header, SECRET)).toBe(false);
  });

  it("eski imzayi reddeder (replay penceresi)", () => {
    const eski = Math.floor(Date.now() / 1000) - 6 * 60;
    expect(verifyStripeSignature(Buffer.from(body), sign(body, SECRET, eski), SECRET)).toBe(false);
  });

  it("bozuk basligi reddeder", () => {
    expect(verifyStripeSignature(Buffer.from(body), "sacmalik", SECRET)).toBe(false);
    expect(verifyStripeSignature(Buffer.from(body), "t=123", SECRET)).toBe(false);
  });

  it("birden fazla v1 imzasindan biri tutarsa kabul eder (anahtar donusu)", () => {
    const at = Math.floor(Date.now() / 1000);
    const dogru = createHmac("sha256", SECRET).update(`${at}.`).update(Buffer.from(body)).digest("hex");
    expect(verifyStripeSignature(Buffer.from(body), `t=${at},v1=deadbeef,v1=${dogru}`, SECRET)).toBe(true);
  });
});
