import crypto from 'node:crypto';
import { google, type calendar_v3, type gmail_v1, type tasks_v1 } from 'googleapis';
import type { RowDataPacket } from 'mysql2';
import { sendBereketMail } from '@agro/shared-backend/core/mail';
import { getGoogleSettings } from '@agro/shared-backend/modules/siteSettings';
import { env } from '@/core/env';
import { decryptAes256Gcm } from '@/core/crypto';
import { deleteGoogleTokens, readGoogleTokens, writeGoogleTokens } from '@/core/mailTokenStore';
import { pool } from '@/db/client';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];
const RETURN_TO = '/admin/entegrasyonlar';

type AccountRow = {
  id: string;
  owner_user_id: string;
  provider: 'gmail_oauth' | 'imap_smtp';
  email: string;
  display_name: string | null;
  enc_access_token: string | null;
  enc_refresh_token: string | null;
  token_expiry: string | null;
  scopes: string | null;
  status: 'connected' | 'expired' | 'error' | 'disconnected';
  last_synced_at: string | null;
};

const safe = (row: AccountRow, configured = Boolean(row.enc_refresh_token)) => ({
  id: row.id,
  provider: row.provider,
  email: row.email,
  display_name: row.display_name,
  token_expiry: row.token_expiry,
  scopes: row.scopes,
  status: row.status,
  last_synced_at: row.last_synced_at,
  configured,
});

function callbackUrl() {
  return `${env.PUBLIC_URL.replace(/\/+$/, '')}/api/v1/mail/accounts/gmail/callback`;
}

async function oauthClient() {
  const settings = await getGoogleSettings();
  if (!settings.clientId || !settings.clientSecret) throw new Error('google_oauth_not_configured');
  return new google.auth.OAuth2(settings.clientId, settings.clientSecret, callbackUrl());
}

function signState(userId: string) {
  const body = Buffer.from(JSON.stringify({
    userId,
    nonce: crypto.randomUUID(),
    exp: Date.now() + 10 * 60_000,
    returnTo: RETURN_TO,
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', env.JWT_SECRET).update(body).digest('base64url');
  return `${body}.${signature}`;
}

export function verifyState(state: string) {
  const [body, signature] = state.split('.');
  if (!body || !signature) throw new Error('invalid_state');
  const expected = crypto.createHmac('sha256', env.JWT_SECRET).update(body).digest();
  const actual = Buffer.from(signature, 'base64url');
  if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
    throw new Error('invalid_state');
  }
  const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as {
    userId?: string; exp?: number; returnTo?: string;
  };
  if (!payload.userId || !payload.exp || payload.exp < Date.now()) throw new Error('expired_state');
  if (payload.returnTo !== RETURN_TO) throw new Error('invalid_return_to');
  return { userId: payload.userId, returnTo: payload.returnTo };
}

export async function listAccounts(userId: string) {
  const [rows] = await pool.execute(
    `SELECT id, owner_user_id, provider, email, display_name, enc_access_token,
            enc_refresh_token, token_expiry, scopes, status, last_synced_at
       FROM user_mail_accounts WHERE owner_user_id = ? ORDER BY created_at DESC`,
    [userId],
  );
  return Promise.all((rows as AccountRow[]).map(async (row) =>
    safe(row, Boolean((await readGoogleTokens(row.id))?.refresh_token || row.enc_refresh_token)),
  ));
}


export async function createGmailConnectUrl(userId: string) {
  const client = await oauthClient();
  return {
    url: client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: true,
      scope: SCOPES,
      state: signState(userId),
    }),
  };
}

export async function handleGmailCallback(code: string, state: string) {
  const { userId, returnTo } = verifyState(state);
  const client = await oauthClient();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const profile = await google.oauth2({ version: 'v2', auth: client }).userinfo.get();
  if (!profile.data.email) throw new Error('gmail_email_missing');
  if (!tokens.refresh_token) throw new Error('gmail_refresh_token_missing');
  const [existing] = await pool.query<Array<RowDataPacket & { id: string }>>(
    'SELECT id FROM user_mail_accounts WHERE owner_user_id=? AND email=? LIMIT 1',
    [userId, profile.data.email],
  );
  const accountId = existing[0]?.id ?? crypto.randomUUID();
  await writeGoogleTokens(accountId, {
    access_token: tokens.access_token ?? undefined,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date ?? undefined,
  });
  await pool.execute(
    `INSERT INTO user_mail_accounts
      (id, owner_user_id, provider, email, display_name, enc_access_token,
       enc_refresh_token, token_expiry, scopes, status, last_error)
     VALUES (?, ?, 'gmail_oauth', ?, ?, NULL, NULL, ?, ?, 'connected', NULL)
     ON DUPLICATE KEY UPDATE display_name=VALUES(display_name),
       enc_access_token=NULL,
       enc_refresh_token=NULL,
       token_expiry=VALUES(token_expiry), scopes=VALUES(scopes),
       status='connected', last_error=NULL`,
    [
      accountId,
      userId,
      profile.data.email,
      profile.data.name ?? null,
      tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      tokens.scope || SCOPES.join(' '),
    ],
  );
  return `${env.FRONTEND_URL.replace(/\/+$/, '')}${returnTo}?google=connected`;
}

async function primaryAccount(userId: string) {
  const [rows] = await pool.execute(
    `SELECT * FROM user_mail_accounts
      WHERE owner_user_id=? AND provider='gmail_oauth' AND status='connected'
      ORDER BY updated_at DESC LIMIT 1`,
    [userId],
  );
  return (rows as AccountRow[])[0] ?? null;
}

async function authFor(account: AccountRow) {
  let stored = await readGoogleTokens(account.id);
  // Bir defalık legacy taşıma: şifreli DB tokenı özel dosya kasasına alınır ve
  // DB kolonları hemen temizlenir.
  if (!stored && account.enc_refresh_token) {
    stored = {
      refresh_token: decryptAes256Gcm(account.enc_refresh_token),
      access_token: account.enc_access_token ? decryptAes256Gcm(account.enc_access_token) : undefined,
      expiry_date: account.token_expiry ? new Date(account.token_expiry).getTime() : undefined,
    };
    await writeGoogleTokens(account.id, stored);
    await pool.execute(
      'UPDATE user_mail_accounts SET enc_access_token=NULL,enc_refresh_token=NULL WHERE id=?',
      [account.id],
    );
  }
  if (!stored?.refresh_token) throw new Error('google_refresh_token_missing');
  const client = await oauthClient();
  client.setCredentials({
    refresh_token: stored.refresh_token,
    access_token: stored.access_token,
    expiry_date: stored.expiry_date,
  });
  client.on('tokens', async (tokens) => {
    stored = {
      refresh_token: tokens.refresh_token ?? stored!.refresh_token,
      access_token: tokens.access_token ?? stored!.access_token,
      expiry_date: tokens.expiry_date ?? stored!.expiry_date,
    };
    await writeGoogleTokens(account.id, stored);
    await pool.execute(
      `UPDATE user_mail_accounts SET enc_access_token=NULL,enc_refresh_token=NULL,
       token_expiry=COALESCE(?,token_expiry), status='connected', last_error=NULL WHERE id=?`,
      [
        tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        account.id,
      ],
    );
  });
  return client;
}

function hasScope(account: AccountRow, scope: string) {
  return String(account.scopes || '').split(/\s+/).includes(scope);
}

export async function deleteAccount(userId: string, id: string) {
  const [rows] = await pool.execute(
    'SELECT * FROM user_mail_accounts WHERE id=? AND owner_user_id=? LIMIT 1',
    [id, userId],
  );
  const account = (rows as AccountRow[])[0];
  const stored = account ? await readGoogleTokens(account.id) : null;
  const revokeToken = stored?.access_token || (account?.enc_access_token ? decryptAes256Gcm(account.enc_access_token) : null);
  if (revokeToken) {
    try {
      const client = await oauthClient();
      await client.revokeToken(revokeToken);
    } catch { /* Google revoke best effort; local deletion remains authoritative. */ }
  }
  await deleteGoogleTokens(id);
  await pool.execute('DELETE FROM user_mail_accounts WHERE id=? AND owner_user_id=?', [id, userId]);
}

function statusFor(account: AccountRow | null, scope: string) {
  return {
    connected: Boolean(account && hasScope(account, scope)),
    reconnect_required: Boolean(account && !hasScope(account, scope)),
    email: account?.email ?? null,
    last_synced_at: account?.last_synced_at ?? null,
  };
}

export async function getGoogleTasksStatus(userId: string) {
  return statusFor(await primaryAccount(userId), 'https://www.googleapis.com/auth/tasks');
}

export async function getGoogleCalendarStatus(userId: string) {
  return statusFor(await primaryAccount(userId), 'https://www.googleapis.com/auth/calendar');
}

export async function listOwnGoogleTasks(userId: string) {
  const [rows] = await pool.query<Array<RowDataPacket & {
    id: string; subject: string; body: string | null; due_at: string | null;
    status: string; source: string; updated_at: string;
  }>>(
    `SELECT id,subject,body,
            DATE_FORMAT(due_at,'%Y-%m-%dT%H:%i:%s') AS due_at,
            status,source,
            DATE_FORMAT(updated_at,'%Y-%m-%dT%H:%i:%s') AS updated_at
       FROM user_google_task WHERE owner_user_id=?
      ORDER BY status='done',due_at IS NULL,due_at,updated_at DESC LIMIT 200`,
    [userId],
  );
  return rows;
}

export async function listOwnGoogleEvents(userId: string) {
  const [rows] = await pool.query<Array<RowDataPacket & {
    id: string; title: string; description: string | null; starts_at: string | null;
    ends_at: string | null; location: string | null; updated_at: string;
  }>>(
    `SELECT id,title,description,
            DATE_FORMAT(starts_at,'%Y-%m-%dT%H:%i:%s') AS starts_at,
            DATE_FORMAT(ends_at,'%Y-%m-%dT%H:%i:%s') AS ends_at,
            location,DATE_FORMAT(updated_at,'%Y-%m-%dT%H:%i:%s') AS updated_at
       FROM user_google_event WHERE owner_user_id=?
        AND (ends_at IS NULL OR ends_at>=DATE_SUB(NOW(),INTERVAL 1 DAY))
      ORDER BY starts_at IS NULL,starts_at LIMIT 200`,
    [userId],
  );
  return rows;
}

export async function syncGoogleTasks(userId: string) {
  const account = await primaryAccount(userId);
  if (!account || !hasScope(account, 'https://www.googleapis.com/auth/tasks')) {
    throw new Error('google_tasks_not_connected');
  }
  const api = google.tasks({ version: 'v1', auth: await authFor(account) });
  const remote = new Map<string, tasks_v1.Schema$Task>();
  let pageToken: string | undefined;
  do {
    const response = await api.tasks.list({
      tasklist: '@default', maxResults: 100, pageToken, showCompleted: true, showHidden: false,
    });
    for (const item of response.data.items ?? []) if (item.id && !item.deleted) remote.set(item.id, item);
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  const [rows] = await pool.execute(
    'SELECT * FROM user_google_task WHERE owner_user_id=?',
    [userId],
  );
  const locals = rows as Array<Record<string, unknown>>;
  const byExternal = new Map(locals.map((item) => [String(item.external_id || ''), item]));
  let imported = 0; let exported = 0; let updated = 0;
  for (const item of remote.values()) {
    const local = byExternal.get(item.id!);
    if (!local) {
      await pool.execute(
        `INSERT INTO user_google_task
          (id,owner_user_id,external_id,subject,body,due_at,status,completed_at,raw_data,source)
         VALUES(UUID(),?,?,?,?,?,?,?,?, 'google')`,
        [userId, String(item.id), item.title || '(Adsız Google görevi)', item.notes ?? null,
          item.due ? new Date(item.due) : null, item.status === 'completed' ? 'done' : 'open',
          item.completed ? new Date(item.completed) : null, JSON.stringify(item)],
      );
      imported++;
    } else if (String(local.source) === 'osgb' && new Date(String(local.updated_at)).getTime() > new Date(item.updated || 0).getTime() + 1000) {
      await api.tasks.patch({ tasklist: '@default', task: item.id!, requestBody: {
        title: String(local.subject), notes: local.body ? String(local.body) : undefined,
        due: local.due_at ? new Date(String(local.due_at)).toISOString() : undefined,
        status: local.status === 'done' ? 'completed' : 'needsAction',
      } });
      exported++;
    } else {
      await pool.execute(
        `UPDATE user_google_task SET subject=?,body=?,due_at=?,status=?,completed_at=?,
          raw_data=?,source='google' WHERE id=? AND owner_user_id=?`,
        [item.title || '(Adsız Google görevi)', item.notes ?? null, item.due ? new Date(item.due) : null,
          item.status === 'completed' ? 'done' : 'open', item.completed ? new Date(item.completed) : null,
          JSON.stringify(item), String(local.id), userId],
      );
      updated++;
    }
  }
  for (const local of locals.filter((item) => !item.external_id && item.source === 'osgb')) {
    const response = await api.tasks.insert({ tasklist: '@default', requestBody: {
      title: String(local.subject), notes: local.body ? String(local.body) : undefined,
      due: local.due_at ? new Date(String(local.due_at)).toISOString() : undefined,
      status: local.status === 'done' ? 'completed' : 'needsAction',
    } });
    if (response.data.id) {
      await pool.execute('UPDATE user_google_task SET external_id=?,raw_data=? WHERE id=? AND owner_user_id=?',
        [response.data.id, JSON.stringify(response.data), String(local.id), userId]);
      exported++;
    }
  }
  await pool.execute('UPDATE user_mail_accounts SET last_synced_at=NOW(3),last_error=NULL WHERE id=?', [account.id]);
  return { ok: true, imported, exported, updated, total_remote: remote.size };
}

function eventTime(event: calendar_v3.Schema$Event, field: 'start' | 'end') {
  const value = event[field]?.dateTime || event[field]?.date;
  return value ? new Date(value) : null;
}

export async function syncGoogleCalendar(userId: string) {
  const account = await primaryAccount(userId);
  if (!account || !hasScope(account, 'https://www.googleapis.com/auth/calendar')) {
    throw new Error('google_calendar_not_connected');
  }
  const api = google.calendar({ version: 'v3', auth: await authFor(account) });
  const remote = new Map<string, calendar_v3.Schema$Event>();
  let pageToken: string | undefined;
  do {
    const response = await api.events.list({
      calendarId: 'primary', singleEvents: true, showDeleted: false,
      maxResults: 250, pageToken, timeMin: new Date(Date.now() - 90 * 86_400_000).toISOString(),
    });
    for (const item of response.data.items ?? []) if (item.id && item.status !== 'cancelled') remote.set(item.id, item);
    pageToken = response.data.nextPageToken ?? undefined;
  } while (pageToken);

  const [rows] = await pool.execute('SELECT * FROM user_google_event WHERE owner_user_id=?', [userId]);
  const locals = rows as Array<Record<string, unknown>>;
  const byExternal = new Map(locals.map((item) => [String(item.external_id || ''), item]));
  let imported = 0; let exported = 0; let updated = 0;
  for (const item of remote.values()) {
    const local = byExternal.get(item.id!);
    if (!local) {
      await pool.execute(
        `INSERT INTO user_google_event
          (id,owner_user_id,external_id,title,description,starts_at,ends_at,location,raw_data)
         VALUES(UUID(),?,?,?,?,?,?,?,?)`,
        [userId, String(item.id), item.summary || '(Adsız etkinlik)', item.description ?? null,
          eventTime(item, 'start'), eventTime(item, 'end'), item.location ?? null, JSON.stringify(item)],
      );
      imported++;
    } else {
      await pool.execute(
        `UPDATE user_google_event SET title=?,description=?,starts_at=?,ends_at=?,location=?,raw_data=?
          WHERE id=? AND owner_user_id=?`,
        [item.summary || '(Adsız etkinlik)', item.description ?? null, eventTime(item, 'start'),
          eventTime(item, 'end'), item.location ?? null, JSON.stringify(item), String(local.id), userId],
      );
      updated++;
    }
  }
  for (const local of locals.filter((item) => !item.external_id)) {
    const response = await api.events.insert({ calendarId: 'primary', requestBody: {
      summary: String(local.title), description: local.description ? String(local.description) : undefined,
      location: local.location ? String(local.location) : undefined,
      start: { dateTime: new Date(String(local.starts_at)).toISOString() },
      end: { dateTime: new Date(String(local.ends_at)).toISOString() },
    } });
    if (response.data.id) {
      await pool.execute('UPDATE user_google_event SET external_id=?,raw_data=? WHERE id=? AND owner_user_id=?',
        [response.data.id, JSON.stringify(response.data), String(local.id), userId]);
      exported++;
    }
  }
  await pool.execute('UPDATE user_mail_accounts SET last_synced_at=NOW(3),last_error=NULL WHERE id=?', [account.id]);
  return { ok: true, imported, exported, updated, total_remote: remote.size };
}

function encodeHeader(value: string) {
  return `=?UTF-8?B?${Buffer.from(value).toString('base64')}?=`;
}

export type SendMailInput = {
  to: string; subject: string; html: string; text?: string; replyTo?: string | null;
  attachments?: Array<{ filename: string; content: Buffer; contentType?: string }>;
};

export async function sendMailViaAccount(userId: string, input: SendMailInput) {
  const account = await primaryAccount(userId);
  if (!account) {
    await sendBereketMail({ ...input, replyTo: input.replyTo ?? undefined });
    return { ok: true, provider: 'site_smtp' as const };
  }
  const gmail = google.gmail({ version: 'v1', auth: await authFor(account) });
  const boundary = `osgb-${crypto.randomUUID()}`;
  const alternative = `osgb-alt-${crypto.randomUUID()}`;
  const lines = [
    `From: ${account.display_name ? `${encodeHeader(account.display_name)} <${account.email}>` : account.email}`,
    `To: ${input.to}`, `Subject: ${encodeHeader(input.subject)}`, 'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ...(input.replyTo ? [`Reply-To: ${input.replyTo}`] : []), '',
    `--${boundary}`, `Content-Type: multipart/alternative; boundary="${alternative}"`, '',
    `--${alternative}`, 'Content-Type: text/plain; charset=UTF-8', '', input.text || input.html.replace(/<[^>]+>/g, ' '),
    `--${alternative}`, 'Content-Type: text/html; charset=UTF-8', '', input.html, `--${alternative}--`,
    ...(input.attachments ?? []).flatMap((attachment) => [
      `--${boundary}`,
      `Content-Type: ${attachment.contentType || 'application/octet-stream'}; name="${attachment.filename.replaceAll('"', '')}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachment.filename.replaceAll('"', '')}"`,
      '', attachment.content.toString('base64').replace(/(.{76})/g, '$1\r\n'),
    ]),
    `--${boundary}--`,
  ];
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: Buffer.from(lines.join('\r\n')).toString('base64url') },
  });
  return { ok: true, provider: 'gmail_oauth' as const };
}

function gmailHeader(headers: gmail_v1.Schema$MessagePartHeader[] | undefined, name: string) {
  return headers?.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value ?? null;
}

/** Yalnız oturum sahibinin primaryAccount(userId) hesabını okur. */
export async function listInbox(userId: string, limit = 20) {
  const account = await primaryAccount(userId);
  if (!account) return { account: null, messages: [], nextPageToken: null };
  const gmail = google.gmail({ version: 'v1', auth: await authFor(account) });
  const response = await gmail.users.messages.list({
    userId: 'me', q: 'in:inbox', maxResults: Math.min(Math.max(limit, 1), 50),
  });
  const messages = await Promise.all((response.data.messages ?? []).map(async ({ id }) => {
    const result = await gmail.users.messages.get({
      userId: 'me', id: id!, format: 'metadata',
      metadataHeaders: ['From', 'To', 'Subject', 'Date'],
    });
    return {
      id: result.data.id!, thread_id: result.data.threadId ?? null,
      from: gmailHeader(result.data.payload?.headers, 'From'),
      to: gmailHeader(result.data.payload?.headers, 'To'),
      subject: gmailHeader(result.data.payload?.headers, 'Subject') || '(Konu yok)',
      date: gmailHeader(result.data.payload?.headers, 'Date'),
      snippet: result.data.snippet ?? '',
      unread: Boolean(result.data.labelIds?.includes('UNREAD')),
    };
  }));
  return { account: safe(account, true), messages, nextPageToken: response.data.nextPageToken ?? null };
}

function collectGmailBody(part: gmail_v1.Schema$MessagePart | undefined, body: { text: string[]; html: string[] }) {
  if (!part) return;
  const decoded = part.body?.data ? Buffer.from(part.body.data, 'base64url').toString('utf8') : '';
  if (part.mimeType === 'text/plain' && decoded) body.text.push(decoded);
  if (part.mimeType === 'text/html' && decoded) body.html.push(decoded);
  for (const child of part.parts ?? []) collectGmailBody(child, body);
}

/** Mesaj kimliği verilse dahi Google sorgusu yalnız oturum sahibinin hesabında yapılır. */
export async function getMessage(userId: string, messageId: string) {
  const account = await primaryAccount(userId);
  if (!account) return null;
  const gmail = google.gmail({ version: 'v1', auth: await authFor(account) });
  const result = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
  const body = { text: [] as string[], html: [] as string[] };
  collectGmailBody(result.data.payload, body);
  return {
    id: result.data.id!, thread_id: result.data.threadId ?? null,
    from: gmailHeader(result.data.payload?.headers, 'From'),
    to: gmailHeader(result.data.payload?.headers, 'To'),
    subject: gmailHeader(result.data.payload?.headers, 'Subject') || '(Konu yok)',
    date: gmailHeader(result.data.payload?.headers, 'Date'),
    snippet: result.data.snippet ?? '',
    unread: Boolean(result.data.labelIds?.includes('UNREAD')),
    text: body.text.join('\n\n'), html: body.html.join('\n\n'),
  };
}
