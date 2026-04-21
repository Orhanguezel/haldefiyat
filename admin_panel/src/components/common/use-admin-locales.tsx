import * as Mod from '@/app/(main)/admin/_components/common/use-admin-locales';
const AnyMod = Mod as any;
const C = AnyMod.default ?? AnyMod.useAdminLocales;
export const useAdminLocales = AnyMod.useAdminLocales ?? C;
export default C;
export type {
  AdminLocaleMeta,
  AdminLocaleOption,
  UseAdminLocalesResult,
} from '@/integrations/shared';
