import "server-only";
import { mkdir, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import type { Upload } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { badRequest } from "@/lib/errors";

export type UploadPurpose = "land_photo" | "payment_proof" | "design_thumbnail" | "project_cover";

const ALLOWED: Record<string, { ext: string; magic: (b: Buffer) => boolean }> = {
  "image/jpeg": { ext: "jpg", magic: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  "image/png": { ext: "png", magic: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  "image/webp": { ext: "webp", magic: (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP" },
  "application/pdf": { ext: "pdf", magic: (b) => b.subarray(0, 5).toString("ascii") === "%PDF-" },
};

export const MAX_UPLOAD_BYTES: Record<UploadPurpose, number> = {
  land_photo: 8 * 1024 * 1024,
  payment_proof: 8 * 1024 * 1024,
  design_thumbnail: 1024 * 1024,
  project_cover: 6 * 1024 * 1024,
};

const PURPOSE_TYPES: Record<UploadPurpose, string[]> = {
  land_photo: ["image/jpeg", "image/png", "image/webp"],
  payment_proof: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  design_thumbnail: ["image/jpeg", "image/png", "image/webp"],
  project_cover: ["image/jpeg", "image/png", "image/webp"],
};

/** Detect the real file type from its bytes. Client-declared MIME types are never trusted. */
export function sniffMime(buf: Buffer): string | null {
  for (const [mime, def] of Object.entries(ALLOWED)) if (buf.length > 12 && def.magic(buf)) return mime;
  return null;
}

const localRoot = () => path.join(process.cwd(), "storage");

async function s3() {
  const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
  const client = new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT || undefined,
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "", secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "" },
  });
  return { client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, bucket: process.env.S3_BUCKET ?? "" };
}

export async function storeFile(buf: Buffer, purpose: UploadPurpose, userId: string | null, opts: { isPublic?: boolean } = {}): Promise<Upload> {
  if (buf.length === 0) throw badRequest("The file is empty.");
  if (buf.length > MAX_UPLOAD_BYTES[purpose]) throw badRequest(`File is too large (max ${Math.round(MAX_UPLOAD_BYTES[purpose] / 1024 / 1024)} MB).`);
  const mime = sniffMime(buf);
  if (!mime || !PURPOSE_TYPES[purpose].includes(mime)) throw badRequest("Unsupported file type. Use JPEG, PNG or WebP images" + (purpose === "payment_proof" ? " or a PDF." : "."));
  const now = new Date();
  const key = `${purpose}/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}/${randomBytes(16).toString("hex")}.${ALLOWED[mime]!.ext}`;

  if (env.storageDriver === "s3") {
    const { client, PutObjectCommand, bucket } = await s3();
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: mime }));
  } else {
    const file = path.join(localRoot(), key);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, buf, { flag: "wx" });
  }
  return db.upload.create({ data: { storageKey: key, mime, sizeBytes: buf.length, purpose, userId, isPublic: opts.isPublic ?? false } });
}

export async function readStoredFile(upload: Upload): Promise<Buffer> {
  if (env.storageDriver === "s3") {
    const { client, GetObjectCommand, bucket } = await s3();
    const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: upload.storageKey }));
    return Buffer.from(await res.Body!.transformToByteArray());
  }
  const file = path.resolve(localRoot(), upload.storageKey);
  if (!file.startsWith(localRoot() + path.sep)) throw badRequest("Invalid storage key.");
  return readFile(file);
}

export async function deleteStoredFile(upload: Upload) {
  try {
    if (env.storageDriver === "s3") {
      const { client, DeleteObjectCommand, bucket } = await s3();
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: upload.storageKey }));
    } else {
      await unlink(path.resolve(localRoot(), upload.storageKey));
    }
  } catch (err) {
    console.error("[storage] delete failed", upload.storageKey, err);
  }
  await db.upload.delete({ where: { id: upload.id } }).catch(() => undefined);
}

/** Decode a data URL produced by canvas.toDataURL. */
export function decodeDataUrl(dataUrl: string): Buffer {
  const m = /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!m) throw badRequest("Invalid image data.");
  return Buffer.from(m[2] as string, "base64");
}

export const uploadUrl = (id: string | null | undefined) => (id ? `/api/uploads/${id}` : null);
