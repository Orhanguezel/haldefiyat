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

export async function registerSharedPublic(api: FastifyInstance) {
  await registerAuth(api);
  await registerHealth(api);
  await registerStorage(api);
  await registerSiteSettings(api);
  await registerUserRoles(api);
  await registerTheme(api);
  await registerProfiles(api);
}

export async function registerSharedAdmin(adminApi: FastifyInstance) {
  await registerSiteSettingsAdmin(adminApi);
  await registerUserAdmin(adminApi);
  await registerStorageAdmin(adminApi);
  await registerCategoriesAdmin(adminApi);
  await registerThemeAdmin(adminApi);
  await registerNewsletterAdmin(adminApi);
}
