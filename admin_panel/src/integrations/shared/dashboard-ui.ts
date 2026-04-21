import type { AdminPermissionKey } from '@/navigation/permissions';
import { getAdminNavUrl } from '@/navigation/sidebar/sidebar-items';

export type DashboardModuleKey =
  | 'prices'
  | 'hf_products'
  | 'markets'
  | 'alerts'
  | 'production'
  | 'users'
  | 'site_settings';

export type DashboardModule = {
  key: DashboardModuleKey;
  href: string;
  permission?: AdminPermissionKey;
};

export const ADMIN_DASHBOARD_ROUTE_MAP: Record<string, string> = {
  prices: getAdminNavUrl('prices'),
  hf_products: getAdminNavUrl('hf_products'),
  markets: getAdminNavUrl('markets'),
  alerts: getAdminNavUrl('alerts'),
  production: getAdminNavUrl('production'),
  users: getAdminNavUrl('users'),
  site_settings: getAdminNavUrl('site_settings'),
  storage: getAdminNavUrl('storage'),
  email_templates: getAdminNavUrl('email_templates'),
  telegram: getAdminNavUrl('telegram'),
  audit: getAdminNavUrl('audit'),
};

export const ADMIN_DASHBOARD_SUMMARY_PERMISSION_MAP: Partial<Record<string, AdminPermissionKey>> = {
  prices: 'admin.prices',
  hf_products: 'admin.hf_products',
  markets: 'admin.markets',
  alerts: 'admin.alerts',
  production: 'admin.production',
};

export const ADMIN_DASHBOARD_MODULES: DashboardModule[] = [
  { key: 'prices', href: getAdminNavUrl('prices'), permission: 'admin.prices' },
  { key: 'hf_products', href: getAdminNavUrl('hf_products'), permission: 'admin.hf_products' },
  { key: 'markets', href: getAdminNavUrl('markets'), permission: 'admin.markets' },
  { key: 'alerts', href: getAdminNavUrl('alerts'), permission: 'admin.alerts' },
  { key: 'production', href: getAdminNavUrl('production'), permission: 'admin.production' },
  { key: 'users', href: getAdminNavUrl('users') },
  { key: 'site_settings', href: getAdminNavUrl('site_settings') },
];
