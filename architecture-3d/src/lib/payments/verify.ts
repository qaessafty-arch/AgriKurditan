import "server-only";
import { db } from "@/lib/db";
import { audit } from "@/lib/audit";
import { notifyUser } from "@/lib/notify";
import { badRequest, conflict, notFound } from "@/lib/errors";
import { grantsAccess, periodEnd } from "./fulfil";

/** Staff decision on a submitted payment. Verification is the only path to a PAID order. */
export async function decidePayment(paymentId: string, staffId: string, decision: "verify" | "reject", reason?: string, ip?: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId }, include: { order: { include: { offering: true, user: true } } } });
  if (!payment) throw notFound("Payment not found.");
  if (payment.status !== "SUBMITTED") throw conflict("This payment has already been reviewed.");
  const { order } = payment;

  if (decision === "reject") {
    if (!reason) throw badRequest("Give a reason so the customer can correct it.", { reason: "Required" });
    await db.$transaction([
      db.payment.update({ where: { id: payment.id }, data: { status: "REJECTED", verifiedById: staffId, verifiedAt: new Date(), rejectReason: reason } }),
      db.order.update({ where: { id: order.id }, data: { status: "PENDING_PAYMENT" } }),
    ]);
    await audit("payment.rejected", { actorId: staffId, target: order.reference, ip, meta: { reason } });
    await notifyUser(order.userId, `Payment for ${order.reference} could not be verified`, reason, `/account/orders/${order.id}`, order.user.email);
    return;
  }

  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.payment.update({ where: { id: payment.id }, data: { status: "VERIFIED", verifiedById: staffId, verifiedAt: now } });
    await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: now } });
    if (grantsAccess(order.interval, order.offering.entitlement)) {
      // Renewals extend from the end of the current period, not from today.
      const current = await tx.subscription.findFirst({
        where: { userId: order.userId, offeringId: order.offeringId, status: "ACTIVE", endsAt: { gt: now } },
        orderBy: { endsAt: "desc" },
      });
      const start = current?.endsAt ?? now;
      await tx.subscription.create({
        data: {
          userId: order.userId, offeringId: order.offeringId, orderId: order.id, entitlement: order.offering.entitlement,
          startsAt: start, endsAt: periodEnd(start, order.interval, order.offering.kind),
        },
      });
    }
  });
  await audit("payment.verified", { actorId: staffId, target: order.reference, ip, meta: { amount: payment.amount.toString(), currency: payment.currency } });
  await notifyUser(order.userId, `Payment received for ${order.reference}`, `Thank you. ${order.itemName} is now active on your account.`, `/account/orders/${order.id}`, order.user.email);
}
