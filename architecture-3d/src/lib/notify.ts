import "server-only";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

export async function notifyUser(userId: string, title: string, body: string, href?: string, email?: string) {
  await db.notification.create({ data: { userId, title, body, href } });
  if (email) await sendEmail(email, title, `${body}${href ? `\n\n${env.appUrl}${href}` : ""}`);
}

/** In-app notification for every administrator, plus an email to ADMIN_NOTIFY_EMAIL if configured. */
export async function notifyAdmins(title: string, body: string, href?: string) {
  const admins = await db.user.findMany({ where: { role: "ADMIN", disabled: false }, select: { id: true } });
  if (admins.length) await db.notification.createMany({ data: admins.map((a) => ({ userId: a.id, title, body, href })) });
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (to) await sendEmail(to, `[Lead] ${title}`, `${body}${href ? `\n\n${env.appUrl}${href}` : ""}`);
}
