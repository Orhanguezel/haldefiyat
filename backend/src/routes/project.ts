import type { FastifyInstance } from "fastify";
import { registerMarkets } from "@/modules/markets";
import { registerPrices } from "@/modules/prices";
import { registerAlerts } from "@/modules/alerts";
import { registerFavorites } from "@/modules/favorites";
import { registerProduction } from "@/modules/production";
import { registerHalAdmin } from "@/modules/hal-admin";
import { registerCompetitorMonitor } from "@/modules/competitor-monitor";
import { registerTelegramBotPublic, registerTelegramBotAdmin } from "@/modules/telegram-bot";
import { registerUser } from "@/modules/user/router";
import { registerIndex } from "@/modules/index";
import { registerAnalysis, registerAnalysisAdmin } from "@/modules/analysis";
import { registerInflationPublic, registerInflationAdmin } from "@/modules/inflation";
import { registerPressPrAdmin } from "@/modules/press-pr";
import { registerApiKeysPublic, registerApiKeysAdmin } from "@/modules/api-keys";
import { registerFeeds } from "@/modules/feeds";
import { registerAnnualReport } from "@/modules/annual-report";
import { registerAnalyticsAdmin } from "@/modules/analytics";
import { registerAuditConsumersAdmin } from "@/modules/audit-consumers";
import { registerRedirectsPublic, registerSeoOpsAdmin } from "@/modules/redirects";
import { registerHalNewsletter } from "@/modules/newsletter/router";
import { registerTracking } from "@/modules/tracking/router";
import { registerFirmsAdmin, registerFirmsPublic } from "@/modules/firms";
import { registerAuthorsAdmin, registerAuthorsPublic } from "@/modules/authors";
import { registerListingsAdmin, registerListingsPublic } from "@/modules/listings";
import { registerSocial, registerSocialAdmin } from "@/modules/social";
import { registerSeoVolumeAdmin } from "@/modules/seo-volume";
import { registerBanners, registerBannersAdmin } from "@/modules/banners";
import { registerGscPublic } from "@/modules/seo/gsc-export";

export async function registerProjectPublic(api: FastifyInstance) {
  await registerMarkets(api);
  await registerPrices(api);
  await registerAlerts(api);
  await registerFavorites(api);
  await registerProduction(api);
  await registerUser(api);
  await registerIndex(api);
  await registerAnalysis(api);
  await registerInflationPublic(api);
  await registerApiKeysPublic(api);
  await registerFeeds(api);
  await registerAnnualReport(api);
  await registerTelegramBotPublic(api);
  await registerHalNewsletter(api);
  await registerTracking(api);
  await registerRedirectsPublic(api);
  await registerFirmsPublic(api);
  await registerListingsPublic(api);
  await registerAuthorsPublic(api);
  await registerSocial(api);
  await registerBanners(api);
  await registerGscPublic(api);

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
  await registerCompetitorMonitor(adminApi);
  await registerAnalysisAdmin(adminApi);
  await registerPressPrAdmin(adminApi);
  await registerTelegramBotAdmin(adminApi);
  await registerInflationAdmin(adminApi);
  await registerApiKeysAdmin(adminApi);
  await registerAnalyticsAdmin(adminApi);
  await registerAuditConsumersAdmin(adminApi);
  await registerSeoOpsAdmin(adminApi);
  await registerSeoVolumeAdmin(adminApi);
  await registerFirmsAdmin(adminApi);
  await registerListingsAdmin(adminApi);
  await registerAuthorsAdmin(adminApi);
  await registerBannersAdmin(adminApi);
  await registerSocialAdmin(adminApi);
}
