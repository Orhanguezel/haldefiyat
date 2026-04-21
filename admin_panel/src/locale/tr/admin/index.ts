import alerts from "./alerts.json";
import audit from "./audit.json";
import auth from "./auth.json";
import comingSoon from "./coming-soon.json";
import common from "./common.json";
import customPages from "./custom-pages.json";
import dashboard from "./dashboard.json";
import emailTemplates from "./email-templates.json";
import markets from "./markets.json";
import prices from "./prices.json";
import production from "./production.json";
import sidebar from "./sidebar.json";
import siteSettings from "./site-settings.json";
import storage from "./storage.json";
import support from "./support.json";
import telegram from "./telegram.json";
import users from "./users.json";

const adminMessages = {
  audit: audit,
  auth: auth,
  alerts: alerts,
  comingSoon: comingSoon,
  common: common,
  "custom-pages": customPages,
  dashboard: dashboard,
  emailTemplates: emailTemplates,
  markets: markets,
  prices: prices,
  production: production,
  sidebar: sidebar,
  siteSettings: siteSettings,
  support: support,
  storage: storage,
  telegram: telegram,
  users: users,
} as const;

export default adminMessages;
