export interface JobListingDto {
  id: string;
  department: string | null;
  location: string | null;
  employment_type: "full_time" | "part_time" | "contract" | "intern";
  is_active: number | boolean;
  display_order: number;
  title: string | null;
  slug: string | null;
  description?: string | null;
  requirements?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface JobListingListQueryParams {
  locale?: string;
}

export interface JobListingCreatePayload {
  locale: string;
  title: string;
  slug: string;
  description?: string;
  requirements?: string;
  department?: string;
  location?: string;
  employment_type?: "full_time" | "part_time" | "contract" | "intern";
  is_active?: boolean;
  display_order?: number;
  meta_title?: string;
  meta_description?: string;
}

export type JobListingUpdatePayload = Partial<JobListingCreatePayload> & { locale: string };

export interface JobListingReorderPayload {
  items: Array<{
    id: string;
    display_order: number;
  }>;
}
