'use client';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';

type ComingSoonProps = {
  moduleName?: string;
};

const MODULE_LABEL_KEYS: Record<string, string> = {
  'email-templates': 'modules.emailTemplates',
  reports: 'modules.reports',
};

export function ComingSoon({ moduleName }: ComingSoonProps) {
  const t = useAdminT('admin.comingSoon');
  const labelKey = moduleName ? MODULE_LABEL_KEYS[moduleName] : null;
  const label = labelKey ? t(labelKey) : t('modules.default');

  return (
    <div className="flex h-full flex-col items-center justify-center space-y-3 text-center">
      <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground uppercase tracking-[0.2em]">
        {t('badge')}
      </span>
      <h1 className="font-semibold text-2xl">{label}</h1>
      <p className="max-w-lg text-muted-foreground">
        {t('description', { module: label })}
      </p>
    </div>
  );
}
