import { route, readJson } from "@/lib/api";
import { requireCapability } from "@/lib/auth/session";
import { saveSetting, settingSchemas, type SettingKey } from "@/lib/settings";
import { audit } from "@/lib/audit";
import { notFound } from "@/lib/errors";
import { z } from "zod";

export const PUT = route<{ key: string }>({}, async (req, { params, ip }) => {
  if (!(params.key in settingSchemas)) throw notFound();
  const actor = await requireCapability("admin:settings");
  const key = params.key as SettingKey;
  const value = await readJson(req, z.record(z.string(), z.unknown()));
  await saveSetting(key, value);
  await audit("admin.settings.update", { actorId: actor.id, target: key, ip });
  return { ok: true };
});
