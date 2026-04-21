// src/integrations/endpoints/admin/users/auth-admin-endpoints.ts
import { baseApi } from '@/integrations/base-api';
import type {
  AdminUserListQueryParams,
  AdminUserView,
  AdminUsersListParams,
  AdminUpdateUserBody,
  AdminSetActiveBody,
  AdminSetRolesBody,
  AdminSetPasswordBody,
  AdminRemoveUserBody,
} from '@/integrations/shared';
import {
  ADMIN_USERS_BASE,
  buildAdminUsersListParams,
  normalizeAdminUser,
  unwrapAdminUser,
  unwrapAdminUsersList,
} from '@/integrations/shared';

export const authAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** GET /users */
    adminList: b.query<AdminUserView[], AdminUsersListParams | undefined>({
      query: (params) => {
        const queryParams: AdminUserListQueryParams | undefined = params
          ? {
              ...params,
              sort:
                params.sort === 'last_sign_in_at'
                  ? 'last_login_at'
                  : params.sort,
            }
          : undefined;
        const qs = buildAdminUsersListParams(queryParams).toString();
        return { url: qs ? `${ADMIN_USERS_BASE}?${qs}` : ADMIN_USERS_BASE, method: 'GET' };
      },
      transformResponse: (res: unknown): AdminUserView[] => {
        return unwrapAdminUsersList(res).map(normalizeAdminUser);
      },
      providesTags: (result) =>
        result?.length
          ? [
              ...result.map((u) => ({ type: 'AdminUsers' as const, id: u.id })),
              { type: 'AdminUsers' as const, id: 'LIST' },
            ]
          : [{ type: 'AdminUsers' as const, id: 'LIST' }],
    }),

    /** GET /users/:id */
    adminGet: b.query<AdminUserView, { id: string }>({
      query: ({ id }) => ({ url: `${ADMIN_USERS_BASE}/${encodeURIComponent(id)}`, method: 'GET' }),
      transformResponse: (res: unknown): AdminUserView => normalizeAdminUser(unwrapAdminUser(res)),
      providesTags: (_r, _e, arg) => [{ type: 'AdminUsers' as const, id: arg.id }],
    }),

    /** PATCH /users/:id */
    adminUpdateUser: b.mutation<AdminUserView, AdminUpdateUserBody>({
      query: ({ id, ...patch }) => ({
        url: `${ADMIN_USERS_BASE}/${encodeURIComponent(id)}`,
        method: 'PATCH',
        body: patch,
      }),
      transformResponse: (res: unknown): AdminUserView => normalizeAdminUser(unwrapAdminUser(res)),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers' as const, id: arg.id },
        { type: 'AdminUsers' as const, id: 'LIST' },
      ],
    }),

    /** POST /users/:id/active */
    adminSetActive: b.mutation<{ ok: true }, AdminSetActiveBody>({
      query: ({ id, is_active }) => ({
        url: `${ADMIN_USERS_BASE}/${encodeURIComponent(id)}/active`,
        method: 'POST',
        body: { is_active },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers' as const, id: arg.id },
        { type: 'AdminUsers' as const, id: 'LIST' },
      ],
    }),

    /** POST /users/:id/roles */
    adminSetRoles: b.mutation<{ ok: true }, AdminSetRolesBody>({
      query: ({ id, roles }) => ({
        url: `${ADMIN_USERS_BASE}/${encodeURIComponent(id)}/roles`,
        method: 'POST',
        body: { roles },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers' as const, id: arg.id },
        { type: 'AdminUsers' as const, id: 'LIST' },
        { type: 'UserRoles' as const, id: 'LIST' },
      ],
    }),

    /** POST /users/:id/password */
    adminSetPassword: b.mutation<{ ok: true }, AdminSetPasswordBody>({
      query: ({ id, password }) => ({
        url: `${ADMIN_USERS_BASE}/${encodeURIComponent(id)}/password`,
        method: 'POST',
        body: { password },
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers' as const, id: arg.id },
        { type: 'AdminUsers' as const, id: 'LIST' },
      ],
    }),

    /** DELETE /users/:id */
    adminRemoveUser: b.mutation<{ ok: true }, AdminRemoveUserBody>({
      query: ({ id }) => ({
        url: `${ADMIN_USERS_BASE}/${encodeURIComponent(id)}`,
        method: 'DELETE',
      }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: (_r, _e, arg) => [
        { type: 'AdminUsers' as const, id: arg.id },
        { type: 'AdminUsers' as const, id: 'LIST' },
      ],
    }),
  }),
  overrideExisting: true,
});

export const {
  useAdminListQuery,
  useAdminGetQuery,
  useAdminUpdateUserMutation,
  useAdminSetActiveMutation,
  useAdminSetRolesMutation,
  useAdminSetPasswordMutation,
  useAdminRemoveUserMutation,
} = authAdminApi;

// Legacy/admin-panel aliases
export const useListUsersAdminQuery = useAdminListQuery;
export const useGetUserAdminQuery = useAdminGetQuery;
export const useUpdateUserAdminMutation = useAdminUpdateUserMutation;
export const useSetUserActiveAdminMutation = useAdminSetActiveMutation;
export const useSetUserRolesAdminMutation = useAdminSetRolesMutation;
export const useSetUserPasswordAdminMutation = useAdminSetPasswordMutation;
export const useRemoveUserAdminMutation = useAdminRemoveUserMutation;
