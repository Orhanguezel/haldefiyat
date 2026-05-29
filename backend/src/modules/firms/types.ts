export type FirmType = "komisyoncu" | "soguk_hava" | "nakliye" | "zirai_ilac";

export type FirmContext = {
  citySlug?: string | null;
  districtSlug?: string | null;
  categories?: string[];
  firmType: FirmType;
};

export type FetchedFirm = FirmContext & {
  externalId: string;
  slug: string;
  name: string;
  contactPerson?: string | null;
  phone?: string | null;
  address?: string | null;
  photoUrl?: string | null;
  sourceUrl: string;
  raw: Record<string, unknown>;
};

export type FirmListFilters = {
  city?: string;
  district?: string;
  type?: FirmType;
  q?: string;
  activeOnly?: boolean;
  status?: "pending" | "approved" | "rejected" | "all";
  limit?: number;
  offset?: number;
};

export type FirmEtlOptions = {
  city?: string;
  type?: FirmType | "all";
  all?: boolean;
  limit?: number;
  delayMs?: number;
  includeDetails?: boolean;
};

export type FirmEtlResult = {
  discovered: number;
  fetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  errors: string[];
};
