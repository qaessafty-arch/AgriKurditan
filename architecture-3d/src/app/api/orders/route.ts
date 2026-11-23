import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { optionalText } from "@/lib/validation";
import { LIMITS } from "@/lib/security/rate-limit";
import { humanReference } from "@/lib/security/tokens";
import { getSetting } from "@/lib/settings";
import { availableMethods } from "@/lib/payments/methods";
import { audit } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notify";
import { badRequest, forbidden, notFound } from "@/lib/errors";

const schema = z.object({ offeringSlug: z.string().max(80), method: z.enum(["bank_transfer", "cash"]), notes: optionalText(1000) });

export const POST = route({ rate: ["write", LIMITS.write] }, async (req, { ip }) => {
  const user = await requireCapability("orders:own");
  const input = await readJson(req, schema);
  const offering = await db.offering.findUnique({ where: { slug: input.offeringSlug } });
  if (!offering || !offering.published) throw notFound("This offer is not available.");
  if (offering.price === null) throw badRequest("This offer is priced on request. Please request a quote instead.");
  if (offering.audience.length > 0 && !offering.audience.includes(user.role) && user.role !== "ADMIN") {
    throw forbidden("This offer is for a different account type.");
  }
  const payments = await getSetting("payments");
  if (!availableMethods(payments).some((m) => m.id === input.method)) throw badRequest("That payment method is not available.");

  // One open order per offering: return the existing one instead of duplicating.
  const open = await db.order.findFirst({ where: { userId: user.id, offeringId: offering.id, status: { in: ["PENDING_PAYMENT", "AWAITING_VERIFICATION"] } } });
  if (open) return { id: open.id, reference: open.reference, existing: true };

  const order = await db.order.create({
    data: {
      reference: humanReference("A3D"), userId: user.id, offeringId: offering.id, itemName: offering.name,
      amount: offering.price, currency: offering.currency, interval: offering.interval, method: input.method, notes: input.notes,
    },
  });
  await audit("order.created", { actorId: user.id, target: order.reference, ip, meta: { offering: offering.slug, amount: order.amount.toString() } });
  await notifyAdmins(`New order ${order.reference}`, `${offering.name} — awaiting payment`, "/admin/orders");
  return { id: order.id, reference: order.reference, existing: false };
});
