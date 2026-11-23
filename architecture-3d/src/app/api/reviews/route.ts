import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { text } from "@/lib/validation";
import { LIMITS } from "@/lib/security/rate-limit";
import { notifyAdmins } from "@/lib/notify";
import { HttpError } from "@/lib/errors";

const schema = z.object({ rating: z.number().int().min(1).max(5), title: text(100, 3), body: text(2000, 20) });

/** Reviews can only be written by customers with a consultation, quote or paid order, and are moderated. */
export const POST = route({ rate: ["form", LIMITS.publicForm] }, async (req) => {
  const user = await requireCapability("reviews:write");
  const input = await readJson(req, schema);
  const [orders, consults, quotes] = await Promise.all([
    db.order.count({ where: { userId: user.id, status: "PAID" } }),
    db.consultation.count({ where: { userId: user.id, status: { in: ["CONFIRMED", "COMPLETED"] } } }),
    db.quoteRequest.count({ where: { userId: user.id, status: { in: ["QUOTED", "ACCEPTED"] } } }),
  ]);
  if (orders + consults + quotes === 0) throw new HttpError(403, "Reviews are open to clients who have worked with us (a paid order, confirmed consultation or received quote).");
  await db.review.create({ data: { userId: user.id, rating: input.rating, title: input.title, body: input.body } });
  await notifyAdmins("New review awaiting approval", `${input.rating}★ — ${input.title}`, "/admin/reviews");
  return { message: "Thank you. Your review will appear once it has been checked." };
});
