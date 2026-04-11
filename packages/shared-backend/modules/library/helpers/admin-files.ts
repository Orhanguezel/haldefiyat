// src/modules/library/helpers/admin-files.ts

import type { FastifyRequest, FastifyReply } from 'fastify';
import { randomUUID } from 'crypto';
import { handleRouteError } from '../../_shared';

import {
  upsertLibraryFileBodySchema,
  patchLibraryFileBodySchema,
} from '../validation';

import {
  listLibraryFiles,
  createLibraryFile,
  updateLibraryFile,
  deleteLibraryFile,
} from '../repository';

import { toBool } from '../admin.controller';

/* ----------------------------- files (admin) ----------------------------- */

export async function listLibraryFilesAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const rows = await listLibraryFiles({ libraryId: id, onlyActive: false });
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}

export async function createLibraryFileAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id } = req.params as { id: string };
    const parsed = upsertLibraryFileBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
    }
    const b = parsed.data;

    const fileId = randomUUID();
    const now = new Date();

    await createLibraryFile({
      id: fileId,
      library_id: id,
      asset_id: typeof (b as any).asset_id !== 'undefined' ? (b as any).asset_id ?? null : null,
      file_url: typeof (b as any).file_url !== 'undefined' ? (b as any).file_url ?? null : null,
      name: String((b as any).name),
      size_bytes:
        typeof (b as any).size_bytes !== 'undefined' ? (b as any).size_bytes ?? null : null,
      mime_type:
        typeof (b as any).mime_type !== 'undefined' ? (b as any).mime_type ?? null : null,
      tags_json:
        typeof (b as any).tags !== 'undefined' ? JSON.stringify((b as any).tags ?? []) : null,
      display_order: typeof (b as any).display_order === 'number' ? (b as any).display_order : 0,
      is_active: toBool((b as any).is_active) ? 1 : 0,
      created_at: now as any,
      updated_at: now as any,
    } as any);

    const rows = await listLibraryFiles({ libraryId: id, onlyActive: false });
    return reply.code(201).send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}

export async function updateLibraryFileAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id, fileId } = req.params as { id: string; fileId: string };
    const parsed = patchLibraryFileBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: { message: 'invalid_body', issues: parsed.error.issues } });
    }
    const b = parsed.data as any;

    const patch: any = {};
    if (typeof b.asset_id !== 'undefined') patch.asset_id = b.asset_id ?? null;
    if (typeof b.file_url !== 'undefined') patch.file_url = b.file_url ?? null;
    if (typeof b.name !== 'undefined') patch.name = b.name;
    if (typeof b.size_bytes !== 'undefined') patch.size_bytes = b.size_bytes ?? null;
    if (typeof b.mime_type !== 'undefined') patch.mime_type = b.mime_type ?? null;
    if (typeof b.tags !== 'undefined')
      patch.tags_json = b.tags === null ? null : JSON.stringify(b.tags ?? []);
    if (typeof b.display_order !== 'undefined') patch.display_order = b.display_order;
    if (typeof b.is_active !== 'undefined') patch.is_active = toBool(b.is_active) ? 1 : 0;

    if (Object.keys(patch).length) {
      await updateLibraryFile(fileId, patch);
    }

    const rows = await listLibraryFiles({ libraryId: id, onlyActive: false });
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}

export async function removeLibraryFileAdmin(req: FastifyRequest, reply: FastifyReply) {
  try {
    const { id, fileId } = req.params as { id: string; fileId: string };
    const affected = await deleteLibraryFile(fileId);
    if (!affected) return reply.code(404).send({ error: { message: 'not_found' } });

    const rows = await listLibraryFiles({ libraryId: id, onlyActive: false });
    return reply.send(rows);
  } catch (err) {
    return handleRouteError(reply, req, err, 'LIBRARY_ADMIN');
  }
}
