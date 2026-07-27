import crypto from 'node:crypto';
import { env } from './env';

function key(): Buffer {
  const value = env.MAIL_ENCRYPTION_KEY;
  if (Buffer.byteLength(value, 'utf8') < 32) {
    throw new Error('MAIL_ENCRYPTION_KEY must be at least 32 bytes');
  }
  return crypto.createHash('sha256').update(value, 'utf8').digest();
}

export function encryptAes256Gcm(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
}

export function decryptAes256Gcm(value: string): string {
  const [ivRaw, tagRaw, encryptedRaw] = value.split('.');
  if (!ivRaw || !tagRaw || !encryptedRaw) throw new Error('invalid_encrypted_value');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
