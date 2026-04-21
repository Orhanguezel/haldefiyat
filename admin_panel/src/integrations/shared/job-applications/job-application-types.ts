export type JobApplicationStatus = "pending" | "reviewed" | "shortlisted" | "rejected" | "hired";

export interface JobApplicationDto {
  id: string;
  job_listing_id: string;
  job_title: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  cover_letter?: string | null;
  cv_url: string | null;
  cv_asset_id?: string | null;
  status: JobApplicationStatus;
  admin_note?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface JobApplicationListQueryParams {
  locale?: string;
  job_listing_id?: string;
}

export interface JobApplicationStatusPayload {
  status: JobApplicationStatus;
  admin_note?: string;
}
