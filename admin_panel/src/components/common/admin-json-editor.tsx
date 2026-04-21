import * as Mod from '@/app/(main)/admin/_components/common/admin-json-editor';
const AnyMod = Mod as any;
const C = AnyMod.default ?? AnyMod.AdminJsonEditor;
export const AdminJsonEditor = AnyMod.AdminJsonEditor ?? C;
export default C;
export type { AdminJsonEditorProps } from '@/integrations/shared';
