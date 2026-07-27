import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from './env';
import { decryptAes256Gcm, encryptAes256Gcm } from './crypto';

export type StoredGoogleTokens = {
  access_token?: string;
  refresh_token: string;
  expiry_date?: number;
};

function accountFile(accountId: string) {
  if (!/^[a-f0-9-]{36}$/i.test(accountId)) throw new Error('invalid_mail_account_id');
  return path.resolve(env.MAIL_TOKEN_STORE_DIR, `${accountId}.token`);
}

async function ensureStore() {
  await mkdir(path.resolve(env.MAIL_TOKEN_STORE_DIR), { recursive: true, mode: 0o700 });
}

export async function writeGoogleTokens(accountId: string, tokens: StoredGoogleTokens) {
  await ensureStore();
  const target = accountFile(accountId);
  const temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, encryptAes256Gcm(JSON.stringify(tokens)), { mode: 0o600 });
  await rename(temporary, target);
}

export async function readGoogleTokens(accountId: string): Promise<StoredGoogleTokens | null> {
  try {
    const encrypted = await readFile(accountFile(accountId), 'utf8');
    return JSON.parse(decryptAes256Gcm(encrypted)) as StoredGoogleTokens;
  } catch (error) {
    if ((error as { code?: string }).code === 'ENOENT') return null;
    throw error;
  }
}

export async function deleteGoogleTokens(accountId: string) {
  await rm(accountFile(accountId), { force: true });
}
