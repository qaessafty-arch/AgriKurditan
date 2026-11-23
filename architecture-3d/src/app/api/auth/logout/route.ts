import { route } from "@/lib/api";
import { destroySession, getCurrentUser } from "@/lib/auth/session";
import { audit } from "@/lib/audit";

export const POST = route({}, async (_req, { ip }) => {
  const user = await getCurrentUser();
  await destroySession();
  if (user) await audit("auth.logout", { actorId: user.id, ip });
  return { ok: true };
});
