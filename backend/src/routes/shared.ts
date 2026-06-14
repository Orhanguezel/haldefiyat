import type { FastifyInstance } from "fastify";
import { registerAuth, registerUserAdmin } from "@agro/shared-backend/modules/auth";
import { registerStorage, registerStorageAdmin } from "@agro/shared-backend/modules/storage";
import { registerProfiles } from "@agro/shared-backend/modules/profiles";
import { registerSiteSettings, registerSiteSettingsAdmin } from "@agro/shared-backend/modules/siteSettings";
import { registerUserRoles } from "@agro/shared-backend/modules/userRoles";
import { registerHealth } from "@agro/shared-backend/modules/health";
import { registerCategoriesAdmin } from "@agro/shared-backend/modules/categories";
import { registerTheme, registerThemeAdmin } from "@agro/shared-backend/modules/theme";
import { registerNewsletterAdmin } from "@agro/shared-backend/modules/newsletter/admin.routes";
import { registerCustomPages } from "@agro/shared-backend/modules/customPages";
import { registerContacts, registerContactsAdmin } from "@agro/shared-backend/modules/contact";
import { registerNotifications } from "@agro/shared-backend/modules/notifications";
import { registerSupport, registerSupportAdmin } from "@agro/shared-backend/modules/support";
import { registerCustomPagesAdmin } from "@agro/shared-backend/modules/customPages";
import { registerEmailTemplatesAdmin } from "@agro/shared-backend/modules/emailTemplates/admin.routes";
import { registerAuditAdmin } from "@agro/shared-backend/modules/audit";
import { registerTwitterAdmin } from "@agro/shared-backend/modules/twitter";
import { registerGa4Admin } from "@agro/shared-backend/modules/ga4";
import { registerSearchConsoleAdmin } from "@agro/shared-backend/modules/searchConsole";
import { registerGtmAdmin } from "@agro/shared-backend/modules/gtm";
import { registerGoogleAdsAdmin } from "@agro/shared-backend/modules/googleAds";
import { registerGoogleConnectAdmin } from "@agro/shared-backend/modules/googleConnect";
import { registerMetaAdmin } from "@agro/shared-backend/modules/meta";
import { registerPopups, registerPopupsAdmin } from "@agro/shared-backend/modules/popups";

export async function registerSharedPublic(api: FastifyInstance) {
  await registerAuth(api);
  await registerHealth(api);
  await registerStorage(api);
  await registerSiteSettings(api);
  await registerUserRoles(api);
  await registerTheme(api);
  await registerProfiles(api);
  await registerCustomPages(api);
  await registerContacts(api);
  await registerNotifications(api);
  await registerSupport(api);
  await registerPopups(api);
}

export async function registerSharedAdmin(adminApi: FastifyInstance) {
  await registerSiteSettingsAdmin(adminApi);
  await registerUserAdmin(adminApi);
  await registerStorageAdmin(adminApi);
  await registerCategoriesAdmin(adminApi);
  await registerThemeAdmin(adminApi);
  await registerNewsletterAdmin(adminApi);
  await registerContactsAdmin(adminApi);
  await registerCustomPagesAdmin(adminApi);
  await registerSupportAdmin(adminApi);
  await registerEmailTemplatesAdmin(adminApi);
  await registerAuditAdmin(adminApi);
  await registerTwitterAdmin(adminApi);
  await registerGa4Admin(adminApi);
  await registerSearchConsoleAdmin(adminApi);
  await registerGtmAdmin(adminApi);
  await registerGoogleAdsAdmin(adminApi);
  await registerGoogleConnectAdmin(adminApi);
  await registerMetaAdmin(adminApi);
  await registerPopupsAdmin(adminApi);

  const { aiContentAssist } = await import("@agro/shared-backend/modules/ai/content");
  adminApi.post("/ai/content", aiContentAssist);
}
