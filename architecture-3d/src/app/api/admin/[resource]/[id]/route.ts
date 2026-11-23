import { route, readJson } from "@/lib/api";
import { requireCapability } from "@/lib/auth/session";
import { RESOURCES } from "@/lib/admin-resources";
import { audit } from "@/lib/audit";
import { notFound } from "@/lib/errors";
import { LIMITS } from "@/lib/security/rate-limit";

type P = { resource: string; id: string };

export const PATCH = route<P>({ rate: ["admin", LIMITS.write] }, async (req, { params, ip }) => {
  const res = RESOURCES[params.resource];
  if (!res?.patch) throw notFound();
  const actor = await requireCapability(res.capability);
  const data = await readJson(req, res.patch.schema);
  await res.patch.apply(params.id, data as never, actor, ip);
  await audit(`admin.${params.resource}.update`, { actorId: actor.id, target: params.id, ip, meta: JSON.parse(JSON.stringify(data)) });
  return { ok: true };
});

export const DELETE = route<P>({ rate: ["admin", LIMITS.write] }, async (_req, { params, ip }) => {
  const res = RESOURCES[params.resource];
  if (!res?.remove) throw notFound();
  const actor = await requireCapability(res.capability);
  await res.remove(params.id, actor);
  await audit(`admin.${params.resource}.delete`, { actorId: actor.id, target: params.id, ip });
  return { ok: true };
});
