import { describe, expect, test } from "bun:test";
import {
  applyReservationPaymentWindow,
  bannerPaymentValidationError,
  bannerUpsertSchema,
  canTransitionBannerLifecycle,
  normalizeBannerLifecycle,
} from "@/modules/banners";
import {
  layoutCapacityConflicts,
  validateBannerSourceState,
} from "@/modules/banners/repository";

const base = {
  position: "global_footer",
  title: "Test reklamı",
};

describe("banner kaynak türleri", () => {
  test("serbest banner alanlarını kabul eder", () => {
    const result = bannerUpsertSchema.safeParse({
      ...base,
      sourceType: "custom",
      imageUrl: "/uploads/test-banner.webp",
      linkUrl: "/tr/firmalar",
    });
    expect(result.success).toBeTrue();
  });

  test("ilandan banner alanlarını kabul eder", () => {
    const result = bannerUpsertSchema.safeParse({
      ...base,
      sourceType: "listing",
      listingId: 42,
      creativeTemplate: "listing",
    });
    expect(result.success).toBeTrue();
    if (result.success) expect(result.data.listingId).toBe(42);
  });

  test("firma ve sponsorluk bağlantısını kabul eder", () => {
    const result = bannerUpsertSchema.safeParse({
      ...base,
      sourceType: "firm",
      firmId: 18,
      sponsorshipId: 7,
      creativeTemplate: "sponsorship",
    });
    expect(result.success).toBeTrue();
    if (result.success) {
      expect(result.data.firmId).toBe(18);
      expect(result.data.sponsorshipId).toBe(7);
    }
  });

  test("geçersiz slot ve tarih alanlarını reddeder", () => {
    expect(bannerUpsertSchema.safeParse({ ...base, position: "uydurma_slot" }).success).toBeFalse();
    expect(bannerUpsertSchema.safeParse({ ...base, startAt: "yarın" }).success).toBeFalse();
  });
});

describe("banner yaşam döngüsü", () => {
  test("pasifleştirme taslak durumuna normalize edilir", () => {
    expect(normalizeBannerLifecycle({ isActive: false })).toEqual({
      isActive: false,
      lifecycleStatus: "draft",
    });
  });

  test("gelecek tarihli aktif reklam planlanır", () => {
    const result = normalizeBannerLifecycle({
      isActive: true,
      startAt: new Date(Date.now() + 86_400_000).toISOString(),
    });
    expect(result.lifecycleStatus).toBe("scheduled");
    expect(result.isActive).toBeTrue();
  });

  test("slot taşıma ve tarih uzatma patch alanları doğrulanır", () => {
    const moved = bannerUpsertSchema.partial().safeParse({
      position: "analiz_sidebar",
      endAt: "2026-09-30T23:59:59.000Z",
    });
    expect(moved.success).toBeTrue();
  });

  test("izinli ve yasak durum geçişlerini ayırır", () => {
    expect(canTransitionBannerLifecycle("draft", "reserved")).toBeTrue();
    expect(canTransitionBannerLifecycle("live", "completed")).toBeTrue();
    expect(canTransitionBannerLifecycle("archived", "live")).toBeFalse();
    expect(canTransitionBannerLifecycle("proposal", "live")).toBeFalse();
  });

  test("rezervasyona ödeme penceresi ekler", () => {
    const before = Date.now();
    const result = applyReservationPaymentWindow({
      lifecycleStatus: "reserved",
      paymentGraceHours: 48,
    });
    expect(result.reservationExpiresAt).toBeString();
    expect(result.paymentDueAt).toBe(result.reservationExpiresAt);
    expect(new Date(result.reservationExpiresAt!).getTime()).toBeGreaterThanOrEqual(before + 47 * 3_600_000);
  });
});

describe("banner ödeme yayın kapısı", () => {
  test("ödemesi bekleyen kampanyayı yayına almaz", () => {
    expect(bannerPaymentValidationError({
      lifecycleStatus: "scheduled",
      paymentStatus: "partial",
    })).toContain("odeme tamamlanmali");
  });

  test("ödenmiş veya gerekçeli istisna kampanyayı geçirir", () => {
    expect(bannerPaymentValidationError({
      lifecycleStatus: "live",
      paymentStatus: "paid",
    })).toBeNull();
    expect(bannerPaymentValidationError({
      lifecycleStatus: "scheduled",
      paymentStatus: "unpaid",
      paymentOverride: true,
      paymentOverrideReason: "Sözleşmeli kurumsal müşteri",
    })).toBeNull();
  });
});

describe("banner kapasite ve kaynak engelleri", () => {
  test("kapasitesi dolu satıra yeni rezervasyon yaptırmaz", () => {
    const conflicts = layoutCapacityConflicts(2, [{ scopeType: "global" }], [
      { id: 1, title: "A", desktopColumns: 2, targets: [{ scopeType: "global" }] },
      { id: 2, title: "B", desktopColumns: 2, targets: [{ scopeType: "city", scopeValue: "antalya" }] },
    ]);
    expect(conflicts.map((item) => item.id)).toEqual([1, 2]);
  });

  test("ayrık şehir hedefi aynı kapasiteyi paylaşabilir", () => {
    const conflicts = layoutCapacityConflicts(1, [{ scopeType: "city", scopeValue: "denizli" }], [
      { id: 1, title: "Antalya", desktopColumns: 1, targets: [{ scopeType: "city", scopeValue: "antalya" }] },
    ]);
    expect(conflicts).toEqual([]);
  });

  test("onaysız ilanı reklam kaynağı olarak reddeder", () => {
    const issues = validateBannerSourceState(
      { sourceType: "listing", endAt: "2026-08-10T00:00:00.000Z" },
      { listing: { status: "pending", isSuspicious: 0, validUntil: "2026-09-01", contactPhone: "555" } },
    );
    expect(issues.some((item) => item.code === "listing_invalid" && item.severity === "error")).toBeTrue();
  });

  test("süresi reklamdan önce dolan ilanı reddeder", () => {
    const issues = validateBannerSourceState(
      { sourceType: "listing", endAt: "2026-08-10T00:00:00.000Z" },
      { listing: { status: "approved", isSuspicious: 0, validUntil: "2026-08-01", contactPhone: "555" } },
    );
    expect(issues.some((item) => item.code === "listing_duration" && item.severity === "error")).toBeTrue();
  });

  test("iptal edilmiş veya tarih dışı sponsorluğu reddeder", () => {
    const now = new Date("2026-07-27T12:00:00.000Z");
    const cancelled = validateBannerSourceState(
      { sourceType: "firm" },
      {
        firm: { status: "approved", isActive: 1, phone: "555", contactPerson: null },
        sponsorship: {
          isActive: 0,
          startsAt: new Date("2026-07-01T00:00:00.000Z"),
          endsAt: new Date("2026-08-01T00:00:00.000Z"),
        },
      },
      now,
    );
    const expired = validateBannerSourceState(
      { sourceType: "firm" },
      {
        firm: { status: "approved", isActive: 1, phone: "555", contactPerson: null },
        sponsorship: {
          isActive: 1,
          startsAt: new Date("2026-06-01T00:00:00.000Z"),
          endsAt: new Date("2026-07-01T00:00:00.000Z"),
        },
      },
      now,
    );
    expect(cancelled.some((item) => item.code === "sponsorship_invalid")).toBeTrue();
    expect(expired.some((item) => item.code === "sponsorship_invalid")).toBeTrue();
  });
});
