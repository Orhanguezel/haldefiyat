const DEFAULT_TEST_SECRET_KEY = '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe';

function getRecaptchaSecret() {
  return process.env.RECAPTCHA_SECRET_KEY || DEFAULT_TEST_SECRET_KEY;
}

export function isRecaptchaEnabled() {
  const raw = process.env.RECAPTCHA_ENABLED;
  if (raw == null || raw === '') return true;
  return ['1', 'true', 'yes', 'on'].includes(String(raw).toLowerCase());
}

export function shouldBypassRecaptchaForOrigin(origin?: string | null) {
  if (!origin) return false;
  if (process.env.NODE_ENV === 'production') return false;

  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

export async function verifyRecaptchaToken(token: string, remoteIp?: string) {
  const params = new URLSearchParams();
  params.set('secret', getRecaptchaSecret());
  params.set('response', token);
  if (remoteIp) params.set('remoteip', remoteIp);

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    return { success: false, errorCodes: ['verification-request-failed'] as string[] };
  }

  const data = (await res.json()) as {
    success?: boolean;
    'error-codes'?: string[];
  };

  return {
    success: Boolean(data.success),
    errorCodes: Array.isArray(data['error-codes']) ? data['error-codes'] : [],
  };
}
