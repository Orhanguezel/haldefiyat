// src/modules/jobListings/repository.ts
import { db } from '../../db/client';
import { eq, and, asc, desc } from 'drizzle-orm';
import { jobListings, jobListingI18n } from './schema';

export async function repoListActiveJobs(locale: string) {
  return db
    .select({
      id: jobListings.id,
      department: jobListings.department,
      location: jobListings.location,
      employment_type: jobListings.employment_type,
      display_order: jobListings.display_order,
      title: jobListingI18n.title,
      slug: jobListingI18n.slug,
      description: jobListingI18n.description,
      requirements: jobListingI18n.requirements,
      created_at: jobListings.created_at,
    })
    .from(jobListings)
    .innerJoin(
      jobListingI18n,
      and(
        eq(jobListingI18n.job_listing_id, jobListings.id),
        eq(jobListingI18n.locale, locale),
      ),
    )
    .where(eq(jobListings.is_active, 1))
    .orderBy(asc(jobListings.display_order), desc(jobListings.created_at));
}

export async function repoGetJobBySlug(slug: string, locale: string) {
  const rows = await db
    .select({
      id: jobListings.id,
      department: jobListings.department,
      location: jobListings.location,
      employment_type: jobListings.employment_type,
      title: jobListingI18n.title,
      slug: jobListingI18n.slug,
      description: jobListingI18n.description,
      requirements: jobListingI18n.requirements,
      meta_title: jobListingI18n.meta_title,
      meta_description: jobListingI18n.meta_description,
      created_at: jobListings.created_at,
    })
    .from(jobListings)
    .innerJoin(
      jobListingI18n,
      and(
        eq(jobListingI18n.job_listing_id, jobListings.id),
        eq(jobListingI18n.locale, locale),
      ),
    )
    .where(and(eq(jobListingI18n.slug, slug), eq(jobListings.is_active, 1)))
    .limit(1);
  return rows[0] ?? null;
}

export async function repoAdminListJobs(locale: string) {
  return db
    .select({
      id: jobListings.id,
      department: jobListings.department,
      location: jobListings.location,
      employment_type: jobListings.employment_type,
      is_active: jobListings.is_active,
      display_order: jobListings.display_order,
      title: jobListingI18n.title,
      slug: jobListingI18n.slug,
      created_at: jobListings.created_at,
      updated_at: jobListings.updated_at,
    })
    .from(jobListings)
    .leftJoin(
      jobListingI18n,
      and(
        eq(jobListingI18n.job_listing_id, jobListings.id),
        eq(jobListingI18n.locale, locale),
      ),
    )
    .orderBy(asc(jobListings.display_order), desc(jobListings.created_at));
}

export async function repoAdminGetJob(id: string, locale: string) {
  const rows = await db
    .select({
      id: jobListings.id,
      department: jobListings.department,
      location: jobListings.location,
      employment_type: jobListings.employment_type,
      is_active: jobListings.is_active,
      display_order: jobListings.display_order,
      title: jobListingI18n.title,
      slug: jobListingI18n.slug,
      description: jobListingI18n.description,
      requirements: jobListingI18n.requirements,
      meta_title: jobListingI18n.meta_title,
      meta_description: jobListingI18n.meta_description,
      created_at: jobListings.created_at,
      updated_at: jobListings.updated_at,
    })
    .from(jobListings)
    .leftJoin(
      jobListingI18n,
      and(
        eq(jobListingI18n.job_listing_id, jobListings.id),
        eq(jobListingI18n.locale, locale),
      ),
    )
    .where(eq(jobListings.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function repoCreateJob(
  id: string,
  base: { department?: string; location?: string; employment_type?: string; is_active: number; display_order: number },
  i18n: { locale: string; title: string; slug: string; description?: string; requirements?: string; meta_title?: string; meta_description?: string },
) {
  await db.insert(jobListings).values({ id, ...base });
  await db.insert(jobListingI18n).values({ job_listing_id: id, ...i18n });
}

export async function repoUpdateJob(
  id: string,
  base?: { department?: string; location?: string; employment_type?: string; is_active?: number; display_order?: number },
  i18n?: { locale: string; title?: string; slug?: string; description?: string; requirements?: string; meta_title?: string; meta_description?: string },
) {
  if (base && Object.keys(base).length > 0) {
    await db.update(jobListings).set(base).where(eq(jobListings.id, id));
  }
  if (i18n && i18n.locale) {
    const { locale, ...i18nFields } = i18n;
    if (Object.keys(i18nFields).length > 0) {
      const existing = await db
        .select({ job_listing_id: jobListingI18n.job_listing_id })
        .from(jobListingI18n)
        .where(and(eq(jobListingI18n.job_listing_id, id), eq(jobListingI18n.locale, locale)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(jobListingI18n)
          .set(i18nFields)
          .where(and(eq(jobListingI18n.job_listing_id, id), eq(jobListingI18n.locale, locale)));
      } else if (i18nFields.title && i18nFields.slug) {
        await db.insert(jobListingI18n).values({
          job_listing_id: id,
          locale,
          title: i18nFields.title,
          slug: i18nFields.slug,
          description: i18nFields.description,
          requirements: i18nFields.requirements,
          meta_title: i18nFields.meta_title,
          meta_description: i18nFields.meta_description,
        });
      }
    }
  }
}

export async function repoDeleteJob(id: string) {
  await db.delete(jobListings).where(eq(jobListings.id, id));
}

export async function repoToggleJobActive(id: string, isActive: number) {
  await db.update(jobListings).set({ is_active: isActive }).where(eq(jobListings.id, id));
}

export async function repoReorderJobs(items: { id: string; display_order: number }[]) {
  for (const item of items) {
    await db.update(jobListings).set({ display_order: item.display_order }).where(eq(jobListings.id, item.id));
  }
}
