/** Single layout contract used by the API, editor and public renderer. */
export const AD_FORMATS = Object.freeze({
  full: { label: 'Tam genişlik', columns: 6, rows: 1, previewWidth: 1120 },
  half: { label: 'Yarım genişlik', columns: 3, rows: 1, previewWidth: 552 },
  third: { label: 'Üçte bir / kompakt', columns: 2, rows: 1, previewWidth: 363 },
  tall: { label: 'Dikey · iki satır', columns: 2, rows: 2, previewWidth: 363 },
});
export const AD_ROW_HEIGHT = 280;
export const AD_GAP = 16;
export const AD_MOBILE_HEIGHT = 120;
export const AD_MAX_ROWS = 20;
export function adSlotProfile(position) {
  const narrow = position.endsWith('_sidebar');
  const strip = ['global_top', 'home_ticker_below'].includes(position);
  return { columns: narrow ? 2 : 6, maxRows: strip ? 1 : narrow ? 3 : 2, formats: narrow ? ['third','tall'] : strip ? ['full'] : ['full','half','third','tall'] };
}
export function adFormat(banner) {
  if (Object.hasOwn(AD_FORMATS, banner.format)) return banner.format;
  if (adSlotProfile(banner.position || '').columns === 2) return 'third';
  return banner.desktopColumns === 3 ? 'third' : banner.desktopColumns === 2 ? 'half' : 'full';
}
export function adRectangle(banner) {
  const format = adFormat(banner), shape = AD_FORMATS[format];
  return { row: banner.desktopRow ?? 1, column: banner.gridColumn ?? 1, rows: shape.rows, columns: shape.columns };
}
export function adLayoutError(banner) {
  const profile = adSlotProfile(banner.position || ''), format = adFormat(banner), box = adRectangle(banner);
  if (banner.format && !Object.hasOwn(AD_FORMATS, banner.format)) return 'Geçersiz reklam formatı.';
  if (!profile.formats.includes(format)) return 'Bu alan seçilen reklam formatını desteklemiyor.';
  if (!Number.isInteger(box.row) || box.row < 1 || box.row + box.rows - 1 > profile.maxRows) return 'Reklam satır sınırını aşıyor.';
  if (!Number.isInteger(box.column) || box.column < 1 || box.column + box.columns - 1 > profile.columns) return 'Reklam alanın yatay sınırını aşıyor.';
  return null;
}
export function adRectanglesOverlap(a, b) {
  const x = adRectangle(a), y = adRectangle(b);
  return x.column < y.column + y.columns && y.column < x.column + x.columns && x.row < y.row + y.rows && y.row < x.row + x.rows;
}
export function adDeviceOverlap(a = 'all', b = 'all') { return a === 'all' || b === 'all' || a === b; }
export function adCells(banner) {
  const box = adRectangle(banner), cells = [];
  for (let r = box.row; r < box.row + box.rows; r++) for (let c = box.column; c < box.column + box.columns; c++) cells.push(`${r}:${c}`);
  return cells;
}
