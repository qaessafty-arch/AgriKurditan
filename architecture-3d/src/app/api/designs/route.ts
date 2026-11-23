import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { designInput } from "@/lib/validation";
import { decodeDataUrl, storeFile, uploadUrl } from "@/lib/storage";
import { getEntitlements } from "@/lib/entitlements";
import { getSetting } from "@/lib/settings";
import { LIMITS } from "@/lib/security/rate-limit";
import { HttpError } from "@/lib/errors";

export const GET = route({}, async () => {
  const user = await requireCapability("designs:own");
  const designs = await db.design.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" }, take: 200 });
  return { designs: designs.map((d) => ({ id: d.id, name: d.name, presetId: d.presetId, config: d.config, thumbnail: uploadUrl(d.thumbnailId), updatedAt: d.updatedAt })) };
});

export const POST = route({ rate: ["write", LIMITS.write] }, async (req) => {
  const user = await requireCapability("designs:own");
  const input = await readJson(req, designInput, 1_500_000);
  const ent = await getEntitlements(user);
  if (!ent.has("studio_pro")) {
    const { freeDesignLimit } = await getSetting("studio");
    const count = await db.design.count({ where: { userId: user.id } });
    if (count >= freeDesignLimit) {
      throw new HttpError(402, `Your plan includes ${freeDesignLimit} saved designs. Delete one, or upgrade to Studio Pro for unlimited designs.`);
    }
  }
  const thumb = input.thumbnail ? await storeFile(decodeDataUrl(input.thumbnail), "design_thumbnail", user.id) : null;
  const design = await db.design.create({
    data: { userId: user.id, name: input.name, presetId: input.presetId, config: input.config, thumbnailId: thumb?.id },
  });
  return { design: { id: design.id, name: design.name, thumbnail: uploadUrl(design.thumbnailId), updatedAt: design.updatedAt } };
});
