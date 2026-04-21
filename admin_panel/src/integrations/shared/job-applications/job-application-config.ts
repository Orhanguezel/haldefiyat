import type {
  JobApplicationDto,
  JobApplicationListQueryParams,
  JobApplicationStatus,
  JobApplicationStatusPayload,
} from "./job-application-types";

export const JOB_APPLICATIONS_ADMIN_BASE = "/admin/job-applications";
export const JOB_APPLICATIONS_DEFAULT_LOCALE = "tr";

export const JOB_APPLICATION_STATUS_OPTIONS: JobApplicationStatus[] = [
  "pending",
  "reviewed",
  "shortlisted",
  "rejected",
  "hired",
];

export interface JobApplicationDetailFormState {
  status: JobApplicationStatus;
  admin_note: string;
}

export function buildJobApplicationsListQueryParams(input: {
  locale?: string;
  jobListingId?: string;
}): JobApplicationListQueryParams {
  return {
    locale: input.locale || JOB_APPLICATIONS_DEFAULT_LOCALE,
    job_listing_id: input.jobListingId || undefined,
  };
}

export function mapJobApplicationToDetailForm(
  item: JobApplicationDto | null | undefined,
): JobApplicationDetailFormState {
  return {
    status: item?.status || "pending",
    admin_note: item?.admin_note || "",
  };
}

export function buildJobApplicationStatusPayload(form: JobApplicationDetailFormState): JobApplicationStatusPayload {
  return {
    status: form.status,
    admin_note: form.admin_note.trim() || undefined,
  };
}
