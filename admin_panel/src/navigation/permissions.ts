export type PanelRole = 'admin' | 'seller';

export type AdminPermissionKey =
  | 'admin.dashboard'
  | 'admin.prices'
  | 'admin.hf_products'
  | 'admin.markets'
  | 'admin.etl_logs'
  | 'admin.alerts'
  | 'admin.contacts'
  | 'admin.production'
  | 'admin.custom_pages'
  | 'admin.support'
  | 'admin.email_templates'
  | 'admin.users'
  | 'admin.site_settings'
  | 'admin.storage'
  | 'admin.telegram'
  | 'admin.audit';

export type AdminNavKey =
  | 'dashboard'
  | 'prices'
  | 'quick_entry'
  | 'hf_products'
  | 'markets'
  | 'etl_logs'
  | 'alerts'
  | 'contacts'
  | 'production'
  | 'custom_pages'
  | 'support'
  | 'email_templates'
  | 'users'
  | 'site_settings'
  | 'storage'
  | 'telegram'
  | 'audit';

const ADMIN_ONLY: PanelRole[] = ['admin'];

const ADMIN_PERMISSION_ROLE_MAP: Record<AdminPermissionKey, PanelRole[]> = {
  'admin.dashboard': ADMIN_ONLY,
  'admin.prices': ADMIN_ONLY,
  'admin.hf_products': ADMIN_ONLY,
  'admin.markets': ADMIN_ONLY,
  'admin.etl_logs': ADMIN_ONLY,
  'admin.alerts': ADMIN_ONLY,
  'admin.contacts': ADMIN_ONLY,
  'admin.production': ADMIN_ONLY,
  'admin.custom_pages': ADMIN_ONLY,
  'admin.support': ADMIN_ONLY,
  'admin.email_templates': ADMIN_ONLY,
  'admin.users': ADMIN_ONLY,
  'admin.site_settings': ADMIN_ONLY,
  'admin.storage': ADMIN_ONLY,
  'admin.telegram': ADMIN_ONLY,
  'admin.audit': ADMIN_ONLY,
};

export function canAccessAdminPermission(role: PanelRole, key: AdminPermissionKey): boolean {
  const allowed = ADMIN_PERMISSION_ROLE_MAP[key] ?? ADMIN_ONLY;
  return allowed.includes(role);
}

const ADMIN_NAV_PERMISSION_MAP: Partial<Record<AdminNavKey, AdminPermissionKey>> = {
  dashboard: 'admin.dashboard',
  prices: 'admin.prices',
  hf_products: 'admin.hf_products',
  markets: 'admin.markets',
  etl_logs: 'admin.etl_logs',
  alerts: 'admin.alerts',
  contacts: 'admin.contacts',
  production: 'admin.production',
  custom_pages: 'admin.custom_pages',
  support: 'admin.support',
  email_templates: 'admin.email_templates',
  users: 'admin.users',
  site_settings: 'admin.site_settings',
  storage: 'admin.storage',
  telegram: 'admin.telegram',
  audit: 'admin.audit',
};

export function getAdminNavRoles(key: AdminNavKey): PanelRole[] {
  const permissionKey = ADMIN_NAV_PERMISSION_MAP[key];
  if (!permissionKey) return ADMIN_ONLY;
  return ADMIN_PERMISSION_ROLE_MAP[permissionKey] ?? ADMIN_ONLY;
}

const ADMIN_PERMISSION_PATHS: Record<AdminPermissionKey, string[]> = {
  'admin.dashboard': ['/admin/dashboard'],
  'admin.prices': ['/admin/prices', '/admin/prices/quick-entry'],
  'admin.hf_products': ['/admin/hf-products'],
  'admin.markets': ['/admin/markets'],
  'admin.etl_logs': ['/admin/etl-logs'],
  'admin.alerts': ['/admin/alerts'],
  'admin.contacts': ['/admin/contacts'],
  'admin.production': ['/admin/production'],
  'admin.custom_pages': ['/admin/custom-pages'],
  'admin.support': ['/admin/support'],
  'admin.email_templates': ['/admin/email-templates'],
  'admin.users': ['/admin/users'],
  'admin.site_settings': ['/admin/site-settings'],
  'admin.storage': ['/admin/storage'],
  'admin.telegram': ['/admin/telegram'],
  'admin.audit': ['/admin/audit'],
};

function stripQueryAndHash(pathname: string): string {
  const [noHash] = pathname.split('#', 1);
  const [clean] = (noHash ?? pathname).split('?', 1);
  return clean || '/';
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function canAccessAdminPath(role: PanelRole, pathname: string): boolean {
  if (role === 'admin') return true;
  const clean = stripQueryAndHash(pathname);

  return (Object.keys(ADMIN_PERMISSION_PATHS) as AdminPermissionKey[]).some((permissionKey) => {
    if (!canAccessAdminPermission(role, permissionKey)) return false;
    const prefixes = ADMIN_PERMISSION_PATHS[permissionKey] ?? [];
    return prefixes.some((prefix) => matchesPrefix(clean, prefix));
  });
}
