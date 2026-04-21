'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useListCategoriesAdminQuery } from '@/integrations/hooks';
import type { CategoryDto } from '@/integrations/shared';

interface AdminCategorySelectProps {
  moduleKey: string;
  locale: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AdminCategorySelect({
  moduleKey,
  locale,
  value,
  onChange,
  placeholder = 'Kategori Seçin',
  disabled = false,
  className = 'w-full',
}: AdminCategorySelectProps) {
  const { data: categories = [], isLoading } = useListCategoriesAdminQuery({
    module_key: moduleKey,
    locale,
    is_active: true,
  });

  const selectedValue = value || 'none';

  return (
    <Select
      value={selectedValue}
      onValueChange={(val) => onChange(val === 'none' ? '' : val)}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={isLoading ? 'Yükleniyor...' : placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Seçilmedi</SelectItem>
        {categories.map((cat: CategoryDto) => (
          <SelectItem key={cat.id} value={String(cat.id)}>
            {cat.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
