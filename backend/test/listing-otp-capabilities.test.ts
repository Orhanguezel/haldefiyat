import { afterEach, expect, test } from "bun:test";
import { env } from "../src/core/env";
import { listingOtpCapabilities } from "../src/modules/listings/otp-capabilities";
const original = { sms: structuredClone(env.SMS), node: env.NODE_ENV, required: env.LISTING_REQUIRE_PHONE_OTP };
afterEach(() => { env.SMS = structuredClone(original.sms); env.NODE_ENV = original.node; env.LISTING_REQUIRE_PHONE_OTP = original.required; });
test("disabled production SMS never advertises verification availability", () => {
  env.NODE_ENV = "production";
  env.SMS.provider = "none";
  env.LISTING_REQUIRE_PHONE_OTP = false;
  expect(listingOtpCapabilities()).toEqual({ enabled: false, required: false });
});
test("provider credentials are required and mandatory verification is not bypassed", () => {
  env.NODE_ENV = "production";
  env.SMS.provider = "netgsm";
  env.SMS.netgsm = { ...env.SMS.netgsm, usercode: "", password: "", msgheader: "" };
  env.LISTING_REQUIRE_PHONE_OTP = true;
  expect(listingOtpCapabilities()).toEqual({ enabled: false, required: true });
  env.SMS.netgsm = { ...env.SMS.netgsm, usercode: "test", password: "test", msgheader: "test" };
  expect(listingOtpCapabilities()).toEqual({ enabled: true, required: true });
});
