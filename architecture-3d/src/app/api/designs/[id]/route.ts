import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { designInput } from "@/lib/validation";
import { decodeDataUrl, deleteStoredFile, storeFile, uploadUrl } from "@/lib/storage";
import { notFound } from "@/lib/errors";
import { LIMITS } from "@/lib/security/rate-limit";

async function own(id: string, userId: string) {
  const design = await db.design.findUnique({ where: { id } });
  if (!design || design.userId !== userId) throw notFound("Design not found.");
  return design;
}

export const GET = route<{ id: string }>({}, async (_req, { params }) => {
  const user = await requireCapability("designs:own");
  const d = await own(params.id, user.id);
  return { design: { id: d.id, name: d.name, presetId: d.presetId, config: d.config, thumbnail: uploadUrl(d.thumbnailId), updatedAt: d.updatedAt } };
});

export const PATCH = route<{ id: string }>({ rate: ["write", LIMITS.write] }, async (req, { params }) => {
  const user = await requireCapability("designs:own");
  const existing = await own(params.id, user.id);
  const input = await readJson(req, designInput.partial(), 1_500_000);
  let thumbnailId = existing.thumbnailId;
  if (input.thumbnail) {
    const thumb = await storeFile(decodeDataUrl(input.thumbnail), "design_thumbnail", user.id);
    if (existing.thumbnailId) {
      const old = await db.upload.findUnique({ where: { id: existing.thumbnailId } });
      if (old) await deleteStoredFile(old);
    }
    thumbnailId = thumb.id;
  }
  const d = await db.design.update({
    where: { id: existing.id },
    data: { name: input.name, presetId: input.presetId, config: input.config, thumbnailId },
  });
  return { design: { id: d.id, name: d.name, thumbnail: uploadUrl(d.thumbnailId), updatedAt: d.updatedAt } };
});

export const DELETE = route<{ id: string }>({ rate: ["write", LIMITS.write] }, async (_req, { params }) => {
  const user = await requireCapability("designs:own");
  const d = await own(params.id, user.id);
  await db.design.delete({ where: { id: d.id } });
  if (d.thumbnailId) {
    const up = await db.upload.findUnique({ where: { id: d.thumbnailId } });
    if (up) await deleteStoredFile(up);
  }
  return { ok: true };
});
