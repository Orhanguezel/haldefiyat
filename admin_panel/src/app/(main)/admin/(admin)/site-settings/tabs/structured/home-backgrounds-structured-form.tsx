'use client';

import React from 'react';
import { useAdminTranslations } from '@/i18n';
import { usePreferencesStore } from '@/stores/preferences/preferences-provider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X, Plus } from 'lucide-react';
import { AdminImageUploadField } from '@/app/(main)/admin/_components/common/admin-image-upload-field';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { SITE_SETTINGS_BACKGROUND_EMPTY_ITEM } from '@/integrations/shared';

export type BackgroundItem = {
  url: string;
  alt: string;
};

export type BackgroundsStructuredFormProps = {
  value: BackgroundItem[];
  onChange: (next: BackgroundItem[]) => void;
  disabled?: boolean;
};

export const BackgroundsStructuredForm: React.FC<BackgroundsStructuredFormProps> = ({
  value,
  onChange,
  disabled,
}) => {
  const adminLocale = usePreferencesStore((s) => s.adminLocale);
  const t = useAdminTranslations(adminLocale || undefined);
  const items = React.useMemo(() => {
    return Array.isArray(value) ? value : [];
  }, [value]);

  const setItem = (idx: number, patch: Partial<BackgroundItem>) => {
    const next = [...items];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };

  const addItem = () => {
    onChange([...items, { ...SITE_SETTINGS_BACKGROUND_EMPTY_ITEM }]);
  };

  const removeItem = (idx: number) => {
    onChange(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <Alert variant="default" className="py-2">
        <AlertDescription className="text-sm">
          {t('admin.siteSettings.structured.backgrounds.description')}
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="relative group p-4 border rounded-xl bg-muted/30 space-y-4">
             <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                  {t('admin.siteSettings.structured.backgrounds.itemTitle', {
                    index: String(idx + 1),
                  })}
                </span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="size-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeItem(idx)}
                  disabled={disabled}
                >
                  <X size={16} />
                </Button>
             </div>

             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="md:col-span-2 space-y-2">
                  <AdminImageUploadField
                    label={t('admin.siteSettings.structured.backgrounds.labels.file')}
                    bucket="public"
                    folder="uploads/backgrounds"
                    value={item.url}
                    onChange={(url) => setItem(idx, { url })}
                    disabled={disabled}
                  />
                </div>
                <div className="space-y-2">
                   <Label className="text-xs">
                     {t('admin.siteSettings.structured.backgrounds.labels.alt')}
                   </Label>
                   <Input 
                      value={item.alt}
                      onChange={(e) => setItem(idx, { alt: e.target.value })}
                      disabled={disabled}
                      placeholder={t('admin.siteSettings.structured.backgrounds.placeholders.alt')}
                      className="h-8"
                   />
                </div>
             </div>
          </div>
        ))}

        <Button 
          type="button" 
          variant="outline" 
          className="w-full h-12 border-dashed border-2"
          onClick={addItem}
          disabled={disabled}
        >
          <Plus size={16} className="mr-2" />
          {t('admin.siteSettings.structured.backgrounds.add')}
        </Button>
      </div>
    </div>
  );
};
