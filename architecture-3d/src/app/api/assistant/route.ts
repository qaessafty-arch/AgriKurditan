import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { LIMITS } from "@/lib/security/rate-limit";
import { storeFile } from "@/lib/storage";
import { generateBrief } from "@/lib/ai";
import { briefInputSchema } from "@/lib/ai/schema";
import { RULES_TEXT } from "@/lib/ai/rules-text";
import { requestLocale } from "@/i18n/errors";
import { isLocale } from "@/i18n/config";
import { badRequest } from "@/lib/errors";
import type { Photo } from "@/lib/ai/claude";

const MAX_PHOTOS = 4;

export const POST = route({ rate: ["ai", LIMITS.ai] }, async (req) => {
  if (Number(req.headers.get("content-length") ?? 0) > 34 * 1024 * 1024) throw badRequest("Upload is too large. Use up to 4 photos of 8 MB each.");
  const user = await getCurrentUser();
  const form = await req.formData();
  const input = briefInputSchema.parse({
    description: form.get("description"),
    buildingType: form.get("buildingType"),
    location: form.get("location") || undefined,
    landWidth: form.get("landWidth"),
    landDepth: form.get("landDepth"),
    floors: form.get("floors") || undefined,
    bedrooms: form.get("bedrooms") || undefined,
    budget: form.get("budget") || undefined,
    currency: form.get("currency") || undefined,
    styles: form.getAll("styles"),
  });
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length > MAX_PHOTOS) throw badRequest(`Attach at most ${MAX_PHOTOS} photos.`);

  const photos: Photo[] = [];
  const uploadIds: string[] = [];
  for (const f of files) {
    const buf = Buffer.from(await f.arrayBuffer());
    const up = await storeFile(buf, "land_photo", user?.id ?? null); // validates type and size by content
    uploadIds.push(up.id);
    photos.push({ mime: up.mime as Photo["mime"], base64: buf.toString("base64") });
  }

  const formLocale = form.get("locale");
  const locale = isLocale(formLocale) ? formLocale : requestLocale(req.headers);
  const result = await generateBrief(input, photos, locale);
  const brief = await db.aiBrief.create({
    data: { userId: user?.id, provider: result.provider, model: result.model, input, output: result.output, uploadIds },
  });
  return { id: brief.id, ...result, disclaimer: RULES_TEXT[locale].disclaimer };
});
