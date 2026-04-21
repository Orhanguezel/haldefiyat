// =============================================================
// FILE: src/integrations/shared/admin-ui.ts
// FINAL — Admin UI copy (site_settings.ui_admin) normalizer
// =============================================================

import { parseJsonObject, uiText } from '@/integrations/shared/common';
import type { AdminNavCopy } from '@/navigation/sidebar/sidebar-items';

export type AdminUiCommonCopy = {
  actions: {
    create: string;
    edit: string;
    delete: string;
    save: string;
    cancel: string;
    refresh: string;
    search: string;
    filter: string;
    close: string;
    back: string;
    confirm: string;
  };
  states: {
    loading: string;
    error: string;
    empty: string;
    updating: string;
    saving: string;
  };
};

export type AdminUiPageCopy = Record<string, string>;

export type AdminUiCopy = {
  app_name: string;
  app_version?: string;
  developer_branding?: {
    name: string;
    url: string;
    full_name: string;
  };
  nav: AdminNavCopy;
  common: AdminUiCommonCopy;
  pages: Record<string, AdminUiPageCopy>;
};

const emptyCommon: AdminUiCommonCopy = {
  actions: {
    create: '',
    edit: '',
    delete: '',
    save: '',
    cancel: '',
    refresh: '',
    search: '',
    filter: '',
    close: '',
    back: '',
    confirm: '',
  },
  states: {
    loading: '',
    error: '',
    empty: '',
    updating: '',
    saving: '',
  },
};

const emptyNav: AdminNavCopy = {
  labels: {
    general:       '',
    content:       '',
    hr:            '',
    communication: '',
    users_group:   '',
    system:        '',
  },
  items: {
    dashboard:        '',
    products:         '',
    categories:       '',
    custom_pages:     '',
    gallery:          '',
    references:       '',
    library:          '',
    blog:             '',
    support:          '',
    job_listings:     '',
    job_applications: '',
    contacts:         '',
    email_templates:  '',
    offers:           '',
    users:            '',
    site_settings:    '',
    storage:          '',
    theme:            '',
    telegram:         '',
    audit:            '',
    db_admin:         '',
    popups:           '',
    payment_attempts: '',
  },
};

export function normalizeAdminUiCopy(raw: unknown): AdminUiCopy {
  const o = parseJsonObject(raw);
  const navRaw = parseJsonObject(o.nav);
  const labelsRaw = parseJsonObject(navRaw.labels);
  const itemsRaw = parseJsonObject(navRaw.items);

  const labels: AdminNavCopy['labels'] = {
    general:       uiText(labelsRaw.general),
    content:       uiText(labelsRaw.content),
    hr:            uiText(labelsRaw.hr),
    communication: uiText(labelsRaw.communication),
    users_group:   uiText(labelsRaw.users_group),
    system:        uiText(labelsRaw.system),
  };

  const items: AdminNavCopy['items'] = {
    dashboard:        uiText(itemsRaw.dashboard),
    products:         uiText(itemsRaw.products),
    categories:       uiText(itemsRaw.categories),
    custom_pages:     uiText(itemsRaw.custom_pages),
    gallery:          uiText(itemsRaw.gallery),
    references:       uiText(itemsRaw.references),
    library:          uiText(itemsRaw.library),
    blog:             uiText(itemsRaw.blog),
    support:          uiText(itemsRaw.support),
    job_listings:     uiText(itemsRaw.job_listings),
    job_applications: uiText(itemsRaw.job_applications),
    contacts:         uiText(itemsRaw.contacts),
    email_templates:  uiText(itemsRaw.email_templates),
    offers:           uiText(itemsRaw.offers),
    users:            uiText(itemsRaw.users),
    site_settings:    uiText(itemsRaw.site_settings),
    storage:          uiText(itemsRaw.storage),
    theme:            uiText(itemsRaw.theme),
    telegram:         uiText(itemsRaw.telegram),
    audit:            uiText(itemsRaw.audit),
    db_admin:         uiText(itemsRaw.db_admin),
    popups:           uiText(itemsRaw.popups),
    payment_attempts: uiText(itemsRaw.payment_attempts),
  };

  const commonRaw = parseJsonObject(o.common);
  const actionsRaw = parseJsonObject(commonRaw.actions);
  const statesRaw = parseJsonObject(commonRaw.states);

  const common: AdminUiCommonCopy = {
    actions: {
      create: uiText(actionsRaw.create),
      edit: uiText(actionsRaw.edit),
      delete: uiText(actionsRaw.delete),
      save: uiText(actionsRaw.save),
      cancel: uiText(actionsRaw.cancel),
      refresh: uiText(actionsRaw.refresh),
      search: uiText(actionsRaw.search),
      filter: uiText(actionsRaw.filter),
      close: uiText(actionsRaw.close),
      back: uiText(actionsRaw.back),
      confirm: uiText(actionsRaw.confirm),
    },
    states: {
      loading: uiText(statesRaw.loading),
      error: uiText(statesRaw.error),
      empty: uiText(statesRaw.empty),
      updating: uiText(statesRaw.updating),
      saving: uiText(statesRaw.saving),
    },
  };

  const pagesRaw = parseJsonObject(o.pages);
  const pages: Record<string, AdminUiPageCopy> = {};
  for (const [k, v] of Object.entries(pagesRaw)) {
    const row = parseJsonObject(v);
    const out: AdminUiPageCopy = {};
    for (const [rk, rv] of Object.entries(row)) {
      out[rk] = uiText(rv);
    }
    pages[k] = out;
  }

  const devRaw = parseJsonObject(o.developer_branding);

  return {
    app_name: uiText(o.app_name),
    app_version: uiText(o.app_version),
    developer_branding: devRaw ? {
      name: uiText(devRaw.name),
      url: uiText(devRaw.url),
      full_name: uiText(devRaw.full_name),
    } : undefined,
    nav: {
      labels: { ...emptyNav.labels, ...labels },
      items: { ...emptyNav.items, ...items },
    },
    common: {
      actions: { ...emptyCommon.actions, ...common.actions },
      states: { ...emptyCommon.states, ...common.states },
    },
    pages,
  };
}
