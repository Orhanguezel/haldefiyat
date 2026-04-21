import { ACCESS_TOKEN_STORAGE_KEY, createBrowserTokenStore } from '@/integrations/shared';

export const tokenStore = createBrowserTokenStore(ACCESS_TOKEN_STORAGE_KEY);
