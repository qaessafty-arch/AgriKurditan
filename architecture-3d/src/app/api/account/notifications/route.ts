import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";

const schema = z.object({ ids: z.array(z.string().max(40)).max(200).optional(), all: z.boolean().optional() });

export const POST = route({}, async (req) => {
  const user = await requireUser();
  const input = await readJson(req, schema);
  await db.notification.updateMany({
    where: { userId: user.id, readAt: null, ...(input.all ? {} : { id: { in: input.ids ?? [] } }) },
    data: { readAt: new Date() },
  });
  return { ok: true };
});
