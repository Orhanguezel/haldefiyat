import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import { getStringProp, isObject, truncateText } from '@/integrations/shared/common';

type MaybeMessage = { message?: unknown };
type MaybeError = { error?: unknown };
type MaybeStatus = { status?: unknown };
type MaybeData = { data?: unknown };

export type NormalizedError = {
  message: string;
  status?: number;
};

export type FetchResult<T> = {
  data: T | null;
  error: NormalizedError | null;
};

export type RTKError = FetchBaseQueryError | SerializedError | Record<string, unknown>;

export function normalizeError(err: unknown): NormalizedError {
  if (isObject(err) && 'status' in err) {
    const statusRaw = (err as MaybeStatus).status;
    const status = typeof statusRaw === 'number' ? statusRaw : undefined;
    const data = (err as MaybeData).data;

    if (typeof data === 'string' && data.trim()) {
      return { message: truncateText(data, 280), status };
    }

    if (isObject(data)) {
      const candidate =
        getStringProp(data, 'message') ??
        getStringProp(data, 'error') ??
        getStringProp(data, 'detail') ??
        getStringProp(data, 'hint') ??
        getStringProp(data, 'description') ??
        getStringProp(data, 'msg');

      if (candidate) return { message: truncateText(candidate, 280), status };

      try {
        return { message: truncateText(JSON.stringify(data), 280), status };
      } catch {
        // fall through
      }
    }

    const rawError = (err as MaybeError).error;
    if (typeof rawError === 'string' && rawError.trim()) {
      return { message: truncateText(rawError, 280), status };
    }

    return { message: status ? `request_failed_${status}` : 'request_failed', status };
  }

  if (isObject(err) && 'message' in err) {
    const message = (err as MaybeMessage).message;
    if (typeof message === 'string') {
      return { message: truncateText(message, 280) };
    }
  }

  if (err instanceof Error) return { message: truncateText(err.message, 280) };
  return { message: 'unknown_error' };
}

export async function coerceSerializableFetchErrorData<T extends { error?: FetchBaseQueryError }>(
  result: T,
): Promise<T> {
  const err = result?.error;
  if (!err) return result;

  const data = (err as { data?: unknown }).data;

  try {
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      let text = '';
      try {
        text = await data.text();
      } catch {
        // ignore
      }

      (err as { data?: unknown }).data = text || `[binary ${data.type || 'unknown'} ${data.size ?? ''}B]`;
      return result;
    }

    if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
      const dec = new TextDecoder();
      (err as { data?: unknown }).data = dec.decode(new Uint8Array(data));
      return result;
    }
  } catch {
    (err as { data?: unknown }).data = String(data ?? '');
  }

  return result;
}
