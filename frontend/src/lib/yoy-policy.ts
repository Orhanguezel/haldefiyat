export const PUBLIC_YOY_RELIABLE_FROM = "2027-05-01";

export function canShowPublicYoy(latestDate: string | null | undefined): boolean {
  const iso = latestDate ? String(latestDate).slice(0, 10) : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) && iso >= PUBLIC_YOY_RELIABLE_FROM;
}
