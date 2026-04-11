import 'server-only';
import { fetchSetting } from '@/i18n/server';
import { asObj, asStr } from './helpers';

export interface SeoPageData {
  title: string;
  description: string;
  og_image: string | null;
  no_index: boolean;
}

export async function fetchSeoPages(locale: string): Promise<Record<string, SeoPageData>> {
  const setting = await fetchSetting('seo_pages', locale);
  if (!setting) return {};
  
  const value = asObj(setting.value);
  const result: Record<string, SeoPageData> = {};
  
  for (const [key, val] of Object.entries(value)) {
    const obj = asObj(val);
    result[key] = {
      title: asStr(obj.title),
      description: asStr(obj.description),
      og_image: obj.og_image ? asStr(obj.og_image) : null,
      no_index: Boolean(obj.no_index),
    };
  }
  
  return result;
}

export async function fetchSeoPage(locale: string, pageKey: string): Promise<SeoPageData | null> {
  const allPages = await fetchSeoPages(locale);
  return allPages[pageKey] || null;
}
