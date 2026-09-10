import { afterEach, beforeEach, expect, mock, test } from 'bun:test';
let token = 'expired';
mock.module('@/integrations/api-base', () => ({ BASE_URL: 'https://qa.example.invalid/api/v1' }));
mock.module('@/integrations/core/token', () => ({ tokenStore: { get: () => token, set: (value: string) => { token = value; } } }));
const { api, uploadListingImage } = await import('../src/app/(main)/admin/(admin)/ilanlar/_lib/api');
const originalFetch = globalThis.fetch;
const fetchMock = mock();
const response = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status });
beforeEach(() => { token = 'expired'; fetchMock.mockReset(); globalThis.fetch = fetchMock as typeof fetch; });
afterEach(() => { globalThis.fetch = originalFetch; });

test('retries the same multipart upload after renewing an expired session', async () => {
  fetchMock.mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({ access_token: 'renewed' })).mockResolvedValueOnce(response({ url: '/uploads/listings/murdum.webp' }, 201));
  const file = new File(['photo'], 'murdum.jpeg', { type: 'image/jpeg' });
  expect(await uploadListingImage(file)).toBe('/uploads/listings/murdum.webp');
  expect(fetchMock.mock.calls[1][0]).toEndWith('/auth/token/refresh');
  const first = fetchMock.mock.calls[0][1];
  const retry = fetchMock.mock.calls[2][1];
  expect(retry.body).toBe(first.body);
  expect(retry.body.get('file').name).toBe('murdum.jpeg');
  expect(retry.headers.get('Content-Type')).toBeNull();
  expect(retry.headers.get('Authorization')).toBe('Bearer renewed');
});

test('shows a useful message when refresh has expired', async () => {
  fetchMock.mockResolvedValueOnce(response({}, 401)).mockResolvedValueOnce(response({}, 401));
  await expect(uploadListingImage(new File(['x'], 'x.jpeg', { type: 'image/jpeg' }))).rejects.toThrow('Yeniden giriş');
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('rejects unsupported files before upload', async () => {
  await expect(uploadListingImage(new File(['x'], 'x.svg', { type: 'image/svg+xml' }))).rejects.toThrow('JPG');
  expect(fetchMock).not.toHaveBeenCalled();
});

test('does not retry a forbidden request', async () => {
  fetchMock.mockResolvedValueOnce(response({}, 403));
  expect((await api('/admin/listings')).status).toBe(403);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test('shares a refresh for simultaneous listing requests', async () => {
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    if (url.endsWith('/token/refresh')) { await new Promise(resolve => setTimeout(resolve, 5)); return response({ access_token: 'renewed' }); }
    return (init.headers as Headers).get('Authorization') === 'Bearer renewed' ? response({}) : response({}, 401);
  });
  await Promise.all([api('/admin/listings'), api('/admin/listings/inquiries')]);
  expect(fetchMock.mock.calls.filter(([url]) => url.endsWith('/token/refresh'))).toHaveLength(1);
});
