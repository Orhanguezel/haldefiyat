import { describe, expect, it } from "bun:test";
import { retryCallRequestDelivery } from "../src/modules/listings/call-request-email";

describe("call request email delivery retry", () => {
  it("retries a transient failure and stops after success", async () => {
    let calls = 0;
    const delivered = await retryCallRequestDelivery(async () => {
      calls += 1;
      if (calls < 3) throw new Error("transient");
    });
    expect(delivered).toBeTrue();
    expect(calls).toBe(3);
  });

  it("fails closed after the bounded attempt count", async () => {
    let calls = 0;
    const delivered = await retryCallRequestDelivery(async () => {
      calls += 1;
      throw new Error("down");
    }, 2);
    expect(delivered).toBeFalse();
    expect(calls).toBe(2);
  });
});
