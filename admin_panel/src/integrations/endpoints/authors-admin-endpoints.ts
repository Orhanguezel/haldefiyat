import { baseApi } from '@/integrations/base-api';

export interface AuthorAdmin {
  id: number;
  slug: string;
  fullName: string;
  title: string | null;
  bio: string | null;
  expertise: string[];
  avatarUrl: string | null;
  credentials: string | null;
  socialLinks: Record<string, string>;
  email: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AuthorPatch {
  slug?: string;
  fullName?: string;
  title?: string | null;
  bio?: string | null;
  expertise?: string[] | null;
  avatarUrl?: string | null;
  credentials?: string | null;
  socialLinks?: Record<string, string> | null;
  email?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export type AuthorCreate = Required<Pick<AuthorPatch, 'slug' | 'fullName'>> & AuthorPatch;

export const authorsAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAuthorsAdmin: builder.query<{ items: AuthorAdmin[] }, { active?: '1' | '0' | 'all'; limit?: number } | undefined>({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.active) search.set('active', params.active);
        if (params?.limit) search.set('limit', String(params.limit));
        const qs = search.toString();
        return { url: `/admin/authors${qs ? `?${qs}` : ''}` };
      },
      providesTags: [{ type: 'Authors' as const, id: 'LIST' }],
    }),
    createAuthorAdmin: builder.mutation<{ data: AuthorAdmin }, AuthorCreate>({
      query: (body) => ({ url: '/admin/authors', method: 'POST', body }),
      invalidatesTags: [{ type: 'Authors' as const, id: 'LIST' }],
    }),
    updateAuthorAdmin: builder.mutation<{ data: AuthorAdmin }, { id: number; patch: AuthorPatch }>({
      query: ({ id, patch }) => ({ url: `/admin/authors/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Authors' as const, id: 'LIST' },
        { type: 'Authors' as const, id },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListAuthorsAdminQuery,
  useCreateAuthorAdminMutation,
  useUpdateAuthorAdminMutation,
} = authorsAdminApi;
