export interface BorsaPriceRow {
  name: string;
  category: string | null;
  unit: string | null;
  avg: number | null;
  min: number | null;
  max: number | null;
  recordedDate?: string;
}

