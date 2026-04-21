import * as Mod from '@/app/(main)/admin/_components/common/rich-content-editor';
const AnyMod = Mod as any;
const C = AnyMod.default ?? AnyMod.RichContentEditor;
export const RichContentEditor = AnyMod.RichContentEditor ?? C;
export default C;
export type { RichContentEditorProps } from '@/integrations/shared';
