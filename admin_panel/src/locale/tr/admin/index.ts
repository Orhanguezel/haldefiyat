import alerts from "./alerts.json";
import audit from "./audit.json";
import auth from "./auth.json";
import comingSoon from "./coming-soon.json";
import common from "./common.json";
import contacts from "./contacts.json";
import customPages from "./custom-pages.json";
import dashboard from "./dashboard.json";
import emailTemplates from "./email-templates.json";
import ga4 from "./ga4.json";
import googleAds from "./google-ads.json";
import googleConnect from "./google-connect.json";
import gtm from "./gtm.json";
import markets from "./markets.json";
import meta from "./meta.json";
import newsletter from "./newsletter.json";
import popups from "./popups.json";
import prices from "./prices.json";
import production from "./production.json";
import searchConsole from "./search-console.json";
import sidebar from "./sidebar.json";
import siteSettings from "./site-settings.json";
import storage from "./storage.json";
import support from "./support.json";
import social from "./social.json";
import telegram from "./telegram.json";
import twitter from "./twitter.json";
import users from "./users.json";

const adminMessages = {
  audit: audit,
  auth: auth,
  alerts: alerts,
  comingSoon: comingSoon,
  common: common,
  contacts: contacts,
  "custom-pages": customPages,
  dashboard: dashboard,
  emailTemplates: emailTemplates,
  ga4: ga4,
  googleAds: googleAds,
  googleConnect: googleConnect,
  gtm: gtm,
  markets: markets,
  meta: meta,
  newsletter: newsletter,
  popups: popups,
  prices: prices,
  production: production,
  searchConsole: searchConsole,
  sidebar: sidebar,
  siteSettings: siteSettings,
  support: support,
  storage: storage,
  social: social,
  telegram: telegram,
  twitter: twitter,
  users: users,
} as const;

export default adminMessages;
