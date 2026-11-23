import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { audit } from "@/lib/audit";
import { conflict, notFound } from "@/lib/errors";

export const POST = route<{ id: string }>({}, async (_req, { params, ip }) => {
  const user = await requireCapability("orders:own");
  const order = await db.order.findUnique({ where: { id: params.id } });
  if (!order || order.userId !== user.id) throw notFound("Order not found.");
  if (order.status !== "PENDING_PAYMENT") throw conflict("Only unpaid orders can be cancelled. Contact us about refunds.");
  await db.order.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
  await audit("order.cancelled", { actorId: user.id, target: order.reference, ip });
  return { ok: true };
});
