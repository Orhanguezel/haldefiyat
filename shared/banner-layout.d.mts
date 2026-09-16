export type AdFormat = 'full' | 'half' | 'third' | 'tall';
export interface AdLayout { position?: string; format?: string | null; desktopRow?: number; desktopColumns?: number; gridColumn?: number; }
export const AD_FORMATS: Record<AdFormat, { label: string; columns: number; rows: number; previewWidth: number }>;
export const AD_ROW_HEIGHT: number;
export const AD_GAP: number;
export const AD_MOBILE_HEIGHT: number;
export const AD_MAX_ROWS: number;
export function adSlotProfile(position: string): { columns: number; maxRows: number; formats: AdFormat[] };
export function adFormat(banner: AdLayout): AdFormat;
export function adRectangle(banner: AdLayout): { row: number; column: number; rows: number; columns: number };
export function adLayoutError(banner: AdLayout): string | null;
export function adRectanglesOverlap(a: AdLayout, b: AdLayout): boolean;
export function adDeviceOverlap(a?: string, b?: string): boolean;
export function adCells(banner: AdLayout): string[];
