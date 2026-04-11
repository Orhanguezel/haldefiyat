// src/modules/jobApplications/repository.ts
import { db } from '../../db/client';
import { eq, desc, and } from 'drizzle-orm';
import { jobApplications } from './schema';
import { jobListings, jobListingI18n } from '../jobListings/schema';

export async function repoCreateApplication(
  id: string,
  data: {
    job_listing_id: string;
    full_name: string;
    email: string;
    phone?: string;
    cover_letter?: string;
    cv_url?: string;
    cv_asset_id?: string;
  },
) {
  await db.insert(jobApplications).values({ id, ...data });
}

export async function repoAdminListApplications(jobListingId?: string, locale = 'tr') {
  const base = db
    .select({
      id: jobApplications.id,
      job_listing_id: jobApplications.job_listing_id,
      job_title: jobListingI18n.title,
      full_name: jobApplications.full_name,
      email: jobApplications.email,
      phone: jobApplications.phone,
      status: jobApplications.status,
      cv_url: jobApplications.cv_url,
      created_at: jobApplications.created_at,
    })
    .from(jobApplications)
    .leftJoin(jobListings, eq(jobListings.id, jobApplications.job_listing_id))
    .leftJoin(
      jobListingI18n,
      and(
        eq(jobListingI18n.job_listing_id, jobListings.id),
        eq(jobListingI18n.locale, locale),
      ),
    );

  if (jobListingId) {
    return base
      .where(eq(jobApplications.job_listing_id, jobListingId))
      .orderBy(desc(jobApplications.created_at));
  }
  return base.orderBy(desc(jobApplications.created_at));
}

export async function repoAdminGetApplication(id: string, locale = 'tr') {
  const rows = await db
    .select({
      id: jobApplications.id,
      job_listing_id: jobApplications.job_listing_id,
      job_title: jobListingI18n.title,
      full_name: jobApplications.full_name,
      email: jobApplications.email,
      phone: jobApplications.phone,
      cover_letter: jobApplications.cover_letter,
      cv_url: jobApplications.cv_url,
      cv_asset_id: jobApplications.cv_asset_id,
      status: jobApplications.status,
      admin_note: jobApplications.admin_note,
      created_at: jobApplications.created_at,
      updated_at: jobApplications.updated_at,
    })
    .from(jobApplications)
    .leftJoin(jobListings, eq(jobListings.id, jobApplications.job_listing_id))
    .leftJoin(
      jobListingI18n,
      and(
        eq(jobListingI18n.job_listing_id, jobListings.id),
        eq(jobListingI18n.locale, locale),
      ),
    )
    .where(eq(jobApplications.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function repoUpdateApplicationStatus(
  id: string,
  status: string,
  adminNote?: string,
) {
  const set: Record<string, unknown> = { status };
  if (adminNote !== undefined) set.admin_note = adminNote;
  await db.update(jobApplications).set(set).where(eq(jobApplications.id, id));
}

export async function repoDeleteApplication(id: string) {
  await db.delete(jobApplications).where(eq(jobApplications.id, id));
}
