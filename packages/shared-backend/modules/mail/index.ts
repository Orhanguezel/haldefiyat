import {
  sendBereketMail,
  sendBereketWelcomeMail,
  sendBereketPasswordChangedMail,
} from '../../core/mail';

export const SITE_NAME = process.env.SITE_NAME || process.env.NEXT_PUBLIC_SITE_NAME || 'Tarim Dijital Ekosistem';

export function escapeMailHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function wrapMailBody(inner: string): string {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5">${inner}</body></html>`;
}

export async function sendMailRaw(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  await sendBereketMail(input);
}

export async function sendWelcomeMail(input: {
  to: string;
  user_name: string;
  user_email: string;
}): Promise<void> {
  await sendBereketWelcomeMail(input);
}

export async function sendPasswordChangedMail(input: {
  to: string;
  user_name?: string;
}): Promise<void> {
  await sendBereketPasswordChangedMail(input);
}
