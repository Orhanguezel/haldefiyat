import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import Fastify, { type FastifyInstance } from "fastify";
import { requireAdmin } from "@agro/shared-backend/middleware/roles";
import { registerBannersAdmin } from "@/modules/banners";
import { canManageFirmCampaign } from "@/modules/banners/repository";

let app: FastifyInstance;

beforeAll(async () => {
  app = Fastify();
  await app.register(async (admin) => {
    admin.addHook("onRequest", async (req) => {
      const role = String(req.headers["x-test-role"] ?? "");
      (req as typeof req & { user: unknown }).user = { role, roles: role ? [role] : [] };
    });
    admin.addHook("onRequest", requireAdmin);
    await registerBannersAdmin(admin);
  }, { prefix: "/api/v1/admin" });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("reklam yönetimi rol sınırları", () => {
  test("editör fiyat değiştiremez", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/admin/banners/pricing/quote",
      headers: { "x-test-role": "editor" },
      payload: { slotKey: "global_footer", durationDays: 7, manualPrice: 1, overrideReason: "Test gerekçesi" },
    });
    expect(response.statusCode).toBe(403);
  });

  test("satış personeli ödeme onayı veremez", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/admin/banners/3/payments",
      headers: { "x-test-role": "sales" },
      payload: { amount: 100, paymentMethod: "cash", paidAt: "2026-07-28T10:00:00.000Z" },
    });
    expect(response.statusCode).toBe(403);
  });

  test("harici reklam kodu yalnız admin route'una ulaşabilir", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/v1/admin/banners",
      headers: { "x-test-role": "editor" },
      payload: { position: "global_footer", title: "Kod reklamı", type: "code", sourceType: "code", code: "<div>Reklam</div>" },
    });
    expect(response.statusCode).toBe(403);
  });

  test("audit kayıtları için mutasyon endpoint'i yoktur", async () => {
    const routes = app.printRoutes({ commonPrefix: false });
    expect(routes).toContain("/audit (GET, HEAD)");
    expect(routes).not.toContain("/audit (PATCH)");
    const response = await app.inject({
      method: "PATCH",
      url: "/api/v1/admin/banners/3/audit",
      headers: { "x-test-role": "admin" },
      payload: { action: "sil" },
    });
    expect(response.statusCode).toBe(404);
  });
});

describe("reklam veren firma izolasyonu", () => {
  test("başka firmanın kampanyasını yönetemez", () => {
    const access = { firmId: 12, role: "manager" };
    expect(canManageFirmCampaign(access, 12, 12)).toBeTrue();
    expect(canManageFirmCampaign(access, 12, 13)).toBeFalse();
    expect(canManageFirmCampaign(access, 13, 13)).toBeFalse();
  });

  test("salt izleyici değişiklik talebi oluşturamaz", () => {
    expect(canManageFirmCampaign({ firmId: 12, role: "viewer" }, 12, 12)).toBeFalse();
  });
});
