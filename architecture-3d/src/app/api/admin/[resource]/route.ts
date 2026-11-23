import { route, readJson } from "@/lib/api";
import { requireCapability } from "@/lib/auth/session";
import { RESOURCES } from "@/lib/admin-resources";
import { audit } from "@/lib/audit";
import { notFound } from "@/lib/errors";
import { LIMITS } from "@/lib/security/rate-limit";

export const POST = route<{ resource: string }>({ rate: ["admin", LIMITS.write] }, async (req, { params, ip }) => {
  const res = RESOURCES[params.resource];
  if (!res?.create) throw notFound();
  const actor = await requireCapability(res.capability);
  const data = await readJson(req, res.create.schema);
  const created = (await res.create.apply(data as never, actor)) as { id: string };
  await audit(`admin.${params.resource}.create`, { actorId: actor.id, target: created.id, ip });
  return { id: created.id };
});
