import { describe, expect, it } from "bun:test";
import { isStripeCustomer, MANUAL_CUSTOMER_PREFIX } from "@/modules/billing/repository";

/**
 * Elle verilen denemede Stripe musterisi yoktur; stripe_customer_id NOT NULL
 * oldugu icin sentinel bir deger tasir. Bu degerin Stripe uclarina gecmesi
 * checkout'u ve musteri portalini kirar — ayrim tek yerden yapilir.
 */
describe("manuel deneme musteri kimligi", () => {
  it("gercek Stripe musterisini taniyor", () => {
    expect(isStripeCustomer("cus_QabcDEF123")).toBe(true);
  });

  it("elle deneme sentinel'ini Stripe musterisi saymaz", () => {
    expect(isStripeCustomer(`${MANUAL_CUSTOMER_PREFIX}4b673ca7-df6d-48e4-bb4f-f42ebe186959`)).toBe(false);
  });

  it("bos ve tanimsiz degerler Stripe musterisi degildir", () => {
    expect(isStripeCustomer(null)).toBe(false);
    expect(isStripeCustomer(undefined)).toBe(false);
    expect(isStripeCustomer("")).toBe(false);
  });

  it("cus_ ile baslamayan hicbir deger gecmez", () => {
    // Sentinel'in ne oldugu degismis olsa bile kapi "cus_" sartina bagli kalir.
    expect(isStripeCustomer("manual_trial")).toBe(false);
    expect(isStripeCustomer("sub_123")).toBe(false);
    expect(isStripeCustomer("customer_123")).toBe(false);
  });
});
