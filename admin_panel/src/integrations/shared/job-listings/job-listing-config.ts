import type { JobListingCreatePayload, JobListingDto } from "./job-listing-types";

export const JOB_LISTINGS_ADMIN_BASE = "/admin/jobs";
export const JOB_LISTINGS_DEFAULT_LOCALE = "tr";

export type JobListingDetailTabKey = "content" | "seo";
export type JobEmploymentType = "full_time" | "part_time" | "contract" | "intern";

export interface JobListingDetailFormState {
  locale: string;
  title: string;
  slug: string;
  description: string;
  requirements: string;
  department: string;
  location: string;
  employment_type: JobEmploymentType;
  is_active: boolean;
  display_order: number;
  meta_title: string;
  meta_description: string;
}

export function createEmptyJobListingDetailForm(locale: string): JobListingDetailFormState {
  return {
    locale,
    title: "",
    slug: "",
    description: "",
    requirements: "",
    department: "",
    location: "",
    employment_type: "full_time",
    is_active: true,
    display_order: 0,
    meta_title: "",
    meta_description: "",
  };
}

export function mapJobListingToDetailForm(
  item: JobListingDto | null | undefined,
  locale: string,
): JobListingDetailFormState {
  const fallback = createEmptyJobListingDetailForm(locale);
  if (!item) return fallback;

  return {
    locale,
    title: item.title || "",
    slug: item.slug || "",
    description: item.description || "",
    requirements: item.requirements || "",
    department: item.department || "",
    location: item.location || "",
    employment_type: item.employment_type || "full_time",
    is_active: item.is_active === true || item.is_active === 1,
    display_order: item.display_order ?? 0,
    meta_title: item.meta_title || "",
    meta_description: item.meta_description || "",
  };
}

export function buildJobListingsListQueryParams(input: { locale?: string }): JobListingListQueryParams {
  return {
    locale: input.locale || JOB_LISTINGS_DEFAULT_LOCALE,
  };
}

export function buildJobListingPayload(form: JobListingDetailFormState, locale: string): JobListingCreatePayload {
  return {
    locale,
    title: form.title.trim(),
    slug: form.slug.trim(),
    description: form.description.trim() || undefined,
    requirements: form.requirements.trim() || undefined,
    department: form.department.trim() || undefined,
    location: form.location.trim() || undefined,
    employment_type: form.employment_type,
    is_active: form.is_active,
    display_order: form.display_order,
    meta_title: form.meta_title.trim() || undefined,
    meta_description: form.meta_description.trim() || undefined,
  };
}

type JobListingListQueryParams = {
  locale?: string;
};
