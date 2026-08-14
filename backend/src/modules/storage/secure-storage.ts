import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import sharp from "sharp";
import {
  adminBulkDelete,
  adminDeleteAsset,
  adminDiagCloudinary,
  adminGetAsset,
  adminListAssets,
  adminListFolders,
  adminPatchAsset,
  buildPublicUrl,
  destroyCloudinaryById,
  getCloudinaryConfig,
  publicServe,
  repoGetByBucketPath,
  repoInsert,
  uploadBufferAuto,
} from "@agro/shared-backend/modules/storage";

const PUBLIC_UPLOAD_BUCKETS = new Set(["avatars", "listings"]);
const ALLOWED_DECLARED_MIME = new Map([
  ["image/jpeg", "jpeg"],
  ["image/jpg", "jpeg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const ALLOWED_DECODED_FORMATS = new Set(["jpeg", "png", "webp"]);
const MAX_PIXELS = 40_000_000;
const MAX_DIMENSION = 2_400;

class UploadValidationError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

function safeSegment(value: string, fallback: string): string {
  const safe = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^[_\.]+|[_\.]+$/g, "");
  return (safe || fallback).slice(0, 90);
}

function safeFolder(value: string | null | undefined): string | null {
  if (!value) return null;
  const segments = value.split("/").map((item) => safeSegment(item, "")).filter(Boolean).slice(0, 8);
  return segments.length ? segments.join("/").slice(0, 255) : null;
}

function safeMetadata(raw: string | undefined): Record<string, string> | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const entries = Object.entries(value)
      .filter(([key, item]) => /^[a-zA-Z0-9_.-]{1,50}$/.test(key) && typeof item === "string")
      .slice(0, 20)
      .map(([key, item]) => [key, (item as string).slice(0, 200)]);
    return entries.length ? Object.fromEntries(entries) : null;
  } catch {
    return null;
  }
}

function multipartField(fields: Record<string, unknown>, key: string): string | undefined {
  const field = fields[key] as { value?: unknown } | undefined;
  return field?.value == null ? undefined : String(field.value);
}

async function normalizedImage(raw: Buffer, declaredMime: string, maxBytes: number) {
  if (raw.length === 0) throw new UploadValidationError("empty_image", "Dosya bos olamaz");
  if (raw.length > maxBytes) throw new UploadValidationError("image_too_large", "Gorsel boyut sinirini asiyor");
  const declaredFormat = ALLOWED_DECLARED_MIME.get(declaredMime.toLowerCase());
  if (!declaredFormat) throw new UploadValidationError("unsupported_image_mime", "Yalniz JPG, PNG ve WebP kabul edilir");

  const pipeline = sharp(raw, { failOn: "warning", limitInputPixels: MAX_PIXELS });
  let metadata: sharp.Metadata;
  try {
    metadata = await pipeline.metadata();
  } catch {
    throw new UploadValidationError("invalid_image", "Dosya gecerli bir gorsel degil");
  }
  if (!metadata.format || !ALLOWED_DECODED_FORMATS.has(metadata.format) || metadata.format !== declaredFormat) {
    throw new UploadValidationError("image_mime_mismatch", "Dosya icerigi ile MIME turu uyusmuyor");
  }
  if (!metadata.width || !metadata.height || metadata.width > 12_000 || metadata.height > 12_000) {
    throw new UploadValidationError("invalid_image_dimensions", "Gorsel boyutlari desteklenmiyor");
  }

  // rotate() EXIF yonunu uygular; WebP yeniden kodlama EXIF/GPS/yorum/profil
  // metadata'sini tasimaz. Boyut ve piksel kapisi decompression bomb riskini sinirlar.
  const result = await pipeline
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85, effort: 4 })
    .toBuffer({ resolveWithObject: true });
  return { buffer: result.data, width: result.info.width, height: result.info.height };
}

async function persistImage(input: {
  req: FastifyRequest;
  raw: Buffer;
  declaredMime: string;
  originalName: string;
  bucket: string;
  folder?: string | null;
  metadata?: Record<string, string> | null;
  maxBytes: number;
}) {
  const cfg = await getCloudinaryConfig();
  if (!cfg) throw new UploadValidationError("storage_not_configured", "Storage yapilandirilmamis");
  const normalized = await normalizedImage(input.raw, input.declaredMime, input.maxBytes);
  const id = randomUUID();
  const base = safeSegment(input.originalName.replace(/\.[^.]+$/, ""), "image");
  const name = `${id}-${base}.webp`;
  const folder = safeFolder(input.folder) ?? input.bucket;
  const publicId = name.replace(/\.webp$/, "");
  const upload = await uploadBufferAuto(cfg, normalized.buffer, {
    folder,
    publicId,
    mime: "image/webp",
  });
  const path = `${folder}/${name}`;
  const provider = cfg.driver === "local" ? "local" : "cloudinary";
  const etag = typeof upload.etag === "string" ? upload.etag.slice(0, 64) : null;
  const requestUser = input.req.user;
  const userId = typeof requestUser === "object" && requestUser !== null && "id" in requestUser
    ? String((requestUser as { id: unknown }).id ?? "") || null
    : null;
  const record = {
    id,
    user_id: userId,
    name,
    bucket: input.bucket.slice(0, 64),
    path,
    folder,
    mime: "image/webp",
    size: normalized.buffer.length,
    width: upload.width ?? normalized.width,
    height: upload.height ?? normalized.height,
    url: upload.secure_url || null,
    hash: etag,
    etag,
    provider,
    provider_public_id: upload.public_id ?? null,
    provider_resource_type: upload.resource_type || "image",
    provider_format: upload.format ?? "webp",
    provider_version: typeof upload.version === "number" ? upload.version : null,
    metadata: input.metadata ?? null,
  };
  try {
    await repoInsert(record);
  } catch (error) {
    try {
      await destroyCloudinaryById(upload.public_id, upload.resource_type || "image", provider);
    } catch {
      // DB kaydi yazilamadiysa provider temizligi best-effort kalir.
    }
    throw error;
  }
  return {
    ...record,
    asset_id: id,
    url: buildPublicUrl(input.bucket, path, upload.secure_url, cfg),
  };
}

function uploadError(reply: FastifyReply, error: unknown) {
  if (error instanceof UploadValidationError) {
    const status = error.code === "storage_not_configured" ? 501 : 422;
    return reply.code(status).send({ error: { code: error.code, message: error.message } });
  }
  return reply.code(500).send({ error: { code: "upload_failed", message: "Gorsel yuklenemedi" } });
}

async function publicUpload(req: FastifyRequest<{ Params: { bucket: string } }>, reply: FastifyReply) {
  const bucket = req.params.bucket;
  if (!PUBLIC_UPLOAD_BUCKETS.has(bucket)) return reply.code(404).send({ error: { code: "upload_bucket_not_found" } });
  try {
    const file = await req.file();
    if (!file) return reply.code(400).send({ error: { code: "file_required" } });
    const raw = await file.toBuffer();
    const maxBytes = bucket === "avatars" ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
    return reply.code(201).send(await persistImage({
      req,
      raw,
      declaredMime: file.mimetype,
      originalName: file.filename,
      bucket,
      maxBytes,
    }));
  } catch (error) {
    return uploadError(reply, error);
  }
}

async function adminCreate(req: FastifyRequest, reply: FastifyReply) {
  try {
    const file = await req.file();
    if (!file) return reply.code(400).send({ error: { code: "file_required" } });
    const raw = await file.toBuffer();
    const fields = file.fields as unknown as Record<string, unknown>;
    const bucket = safeSegment(multipartField(fields, "bucket") ?? "default", "default");
    return reply.code(201).send(await persistImage({
      req,
      raw,
      declaredMime: file.mimetype,
      originalName: file.filename,
      bucket,
      folder: multipartField(fields, "folder"),
      metadata: safeMetadata(multipartField(fields, "metadata")),
      maxBytes: 8 * 1024 * 1024,
    }));
  } catch (error) {
    return uploadError(reply, error);
  }
}

async function adminBulkCreate(req: FastifyRequest, reply: FastifyReply) {
  try {
    const fields: Record<string, string> = {};
    const files: Array<{ raw: Buffer; mimetype: string; filename: string }> = [];
    for await (const part of req.parts()) {
      if (part.type === "field") {
        if (["bucket", "folder", "metadata"].includes(part.fieldname)) fields[part.fieldname] = String(part.value ?? "");
        continue;
      }
      files.push({ raw: await part.toBuffer(), mimetype: part.mimetype, filename: part.filename });
    }
    if (!files.length) return reply.code(400).send({ error: { code: "file_required" } });
    const bucket = safeSegment(fields.bucket ?? "default", "default");
    const items = [];
    for (const file of files) {
      items.push(await persistImage({
        req,
        raw: file.raw,
        declaredMime: file.mimetype,
        originalName: file.filename,
        bucket,
        folder: fields.folder,
        metadata: safeMetadata(fields.metadata),
        maxBytes: 8 * 1024 * 1024,
      }));
    }
    return reply.send({ count: items.length, items });
  } catch (error) {
    return uploadError(reply, error);
  }
}

/** Public okuma korunur; tüm yazımlar doğrulanmış kullanıcı ve güvenli resim pipeline'ı ister. */
export async function registerSecureStorage(app: FastifyInstance) {
  app.get("/storage/:bucket/*", publicServe);
  app.post("/storage/:bucket/upload", {
    preHandler: async (req, reply) => {
      if (!req.headers.authorization && !req.cookies?.access_token) {
        return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
      }
      try {
        await req.jwtVerify();
      } catch {
        return reply.code(401).send({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
      }
    },
  }, publicUpload);
}

export async function registerSecureStorageAdmin(app: FastifyInstance) {
  const base = "/storage";
  app.get(`${base}/assets`, adminListAssets);
  app.get(`${base}/assets/:id`, adminGetAsset);
  app.post(`${base}/assets`, adminCreate);
  app.post(`${base}/assets/bulk`, adminBulkCreate);
  app.patch(`${base}/assets/:id`, adminPatchAsset);
  app.delete(`${base}/assets/:id`, adminDeleteAsset);
  app.post(`${base}/assets/bulk-delete`, adminBulkDelete);
  app.get(`${base}/folders`, adminListFolders);
  app.get(`${base}/_diag/cloud`, adminDiagCloudinary);
}

/** Testler dış depolama çağırmadan dosyanın gerçek format ve metadata kapısını doğrular. */
export const secureImageUploadForTest = normalizedImage;
