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
}
