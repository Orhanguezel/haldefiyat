import * as Mod from '@/app/(main)/admin/_components/common/admin-locale-select';
const AnyMod = Mod as any;
const C = AnyMod.default ?? AnyMod.AdminLocaleSelect;
export const AdminLocaleSelect = AnyMod.AdminLocaleSelect ?? C;
export default C;
export type {
  AdminLocaleOption,
  AdminLocaleSelectProps,
} from '@/integrations/shared';
