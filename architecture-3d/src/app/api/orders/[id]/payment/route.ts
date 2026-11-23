import { z } from "zod";
import { route } from "@/lib/api";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { LIMITS } from "@/lib/security/rate-limit";
import { storeFile } from "@/lib/storage";
import { audit } from "@/lib/audit";
import { notifyAdmins } from "@/lib/notify";
import { badRequest, conflict, notFound } from "@/lib/errors";

const fields = z.object({
  reference: z.string().trim().min(3, "Enter the transfer reference or receipt number").max(80),
  payerName: z.string().trim().max(120).optional(),
  amount: z.coerce.number().positive("Enter the amount you paid").max(1e11),
});

/** Customer submits proof of a manual payment. The order is NOT marked paid until staff verify it. */
export const POST = route<{ id: string }>({ rate: ["upload", LIMITS.upload] }, async (req, { params, ip }) => {
  const user = await requireCapability("orders:own");
  const order = await db.order.findUnique({ where: { id: params.id } });
  if (!order || order.userId !== user.id) throw notFound("Order not found.");
  if (order.status !== "PENDING_PAYMENT") throw conflict("This order is not waiting for payment.");
  if (Number(req.headers.get("content-length") ?? 0) > 9 * 1024 * 1024) throw badRequest("Upload is too large (max 8 MB).");

  const form = await req.formData();
  const input = fields.parse({ reference: form.get("reference"), payerName: form.get("payerName") || undefined, amount: form.get("amount") });
  const file = form.get("proof");
  const proof = file instanceof File && file.size > 0 ? await storeFile(Buffer.from(await file.arrayBuffer()), "payment_proof", user.id) : null;

  await db.$transaction([
    db.payment.create({
      data: { orderId: order.id, method: order.method, amount: input.amount, currency: order.currency, reference: input.reference, payerName: input.payerName, proofUploadId: proof?.id },
    }),
    db.order.update({ where: { id: order.id }, data: { status: "AWAITING_VERIFICATION" } }),
  ]);
  await audit("payment.submitted", { actorId: user.id, target: order.reference, ip, meta: { amount: input.amount } });
  await notifyAdmins(`Payment submitted for ${order.reference}`, `${input.amount} ${order.currency} — ref ${input.reference}. Verify against the bank statement.`, "/admin/payments");
  return { ok: true };
});
