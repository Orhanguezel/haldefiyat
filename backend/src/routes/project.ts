import type { FastifyInstance } from "fastify";
import { registerMarkets } from "@/modules/markets";
import { registerPrices } from "@/modules/prices";
import { registerAlerts } from "@/modules/alerts";
import { registerFavorites } from "@/modules/favorites";
import { registerHalAdmin } from "@/modules/hal-admin";

export async function registerProjectPublic(api: FastifyInstance) {
  await registerMarkets(api);
  await registerPrices(api);
  await registerAlerts(api);
  await registerFavorites(api);

  // P2: SSO entegrasyonu icin frontend'in auth durumunu dogrulayabilecegi stub endpoint.
  // Gercek /auth endpoint'leri shared-backend auth modulunde zaten kayitli (registerAuth).
  api.get("/auth-check", async (_req, reply) => {
    return reply.send({
      authenticated: false,
      note:          "SSO entegrasyonu icin /auth endpoint'leri P2'de eklenecek",
    });
  });
}

export async function registerProjectAdmin(adminApi: FastifyInstance) {
  await registerHalAdmin(adminApi);
}
