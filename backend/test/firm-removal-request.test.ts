import { describe, expect, it } from "vitest";
import { removalRequestBodySchema } from "../src/modules/firms/validation";

describe("firma kaldirma talebi (KVKK m.11)", () => {
  const valid = {
    requesterName: "Mehmet Yılmaz",
    relationship: "sahibi" as const,
    contact: "+905321234567",
    reason: "Kaydımın yayından kaldırılmasını istiyorum.",
    contactConsent: true as const,
  };

  it("gecerli talebi kabul eder", () => {
    expect(removalRequestBodySchema.safeParse(valid).success).toBe(true);
  });

  it("gerekce ZORUNLU DEGIL — silme hakki gerekce sartina baglanamaz", () => {
    expect(removalRequestBodySchema.safeParse({ ...valid, reason: undefined }).success).toBe(true);
  });

  it("geri donus icin iletisim ve acik onay sarttir", () => {
    expect(removalRequestBodySchema.safeParse({ ...valid, contact: "" }).success).toBe(false);
    expect(removalRequestBodySchema.safeParse({ ...valid, contactConsent: false }).success).toBe(false);
    const { contactConsent: _omit, ...withoutConsent } = valid;
    expect(removalRequestBodySchema.safeParse(withoutConsent).success).toBe(false);
  });

  it("iliski beyani sinirli kumeden secilir", () => {
    expect(removalRequestBodySchema.safeParse({ ...valid, relationship: "yetkili" }).success).toBe(true);
    expect(removalRequestBodySchema.safeParse({ ...valid, relationship: "rakip" }).success).toBe(false);
  });

  it("asiri uzun gerekce reddedilir", () => {
    expect(removalRequestBodySchema.safeParse({ ...valid, reason: "a".repeat(2001) }).success).toBe(false);
  });
});
