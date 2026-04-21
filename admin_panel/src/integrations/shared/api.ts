export const withQuery = (baseUrl: string, params?: Record<string, unknown>): string => {
  if (!params) return baseUrl;

  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      (typeof value === 'number' && Number.isNaN(value))
    ) {
      continue;
    }

    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  return query ? `${baseUrl}?${query}` : baseUrl;
};

export const cleanParams = (
  params?: Record<string, unknown>,
): Record<string, string | number | boolean> | undefined => {
  if (!params) return undefined;

  const out: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(params)) {
    if (
      value === undefined ||
      value === null ||
      value === '' ||
      (typeof value === 'number' && Number.isNaN(value))
    ) {
      continue;
    }

    if (typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string') {
      out[key] = value;
      continue;
    }

    out[key] = String(value);
  }

  return Object.keys(out).length ? out : undefined;
};
