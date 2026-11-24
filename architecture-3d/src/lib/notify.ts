import "server-only";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { fmt, isLocale, localePath, type Locale } from "@/i18n/config";
import { EMAILS, NOTICES, type EmailKey, type NoticeKey } from "@/i18n/server-text";

/** In-app notification (and optional email) in the user's preferred language. */
export async function notifyUser(userId: string, key: NoticeKey, vars: Record<string, string | number>, href?: string, emailTo?: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { locale: true } });
  const locale: Locale = isLocale(user?.locale) ? user.locale : "en";
  const t = NOTICES[locale][key];
  const title = fmt(t.title, vars), body = fmt(t.body, vars);
  await db.notification.create({ data: { userId, title, body, href } });
  if (emailTo) await sendEmail(emailTo, title, `${body}${href ? `\n\n${env.appUrl}${localePath(href, locale)}` : ""}`);
}

/** Transactional email in a given language. */
export function sendLocalizedEmail(locale: Locale, to: string, key: EmailKey, vars: Record<string, string | number>) {
  const t = EMAILS[locale][key];
  return sendEmail(to, fmt(t.subject, vars), fmt(t.body, vars));
}

/** In-app notification for every administrator, plus an email to ADMIN_NOTIFY_EMAIL if configured (staff tools are English). */
export async function notifyAdmins(title: string, body: string, href?: string) {
  const admins = await db.user.findMany({ where: { role: "ADMIN", disabled: false }, select: { id: true } });
  if (admins.length) await db.notification.createMany({ data: admins.map((a) => ({ userId: a.id, title, body, href })) });
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (to) await sendEmail(to, `[Lead] ${title}`, `${body}${href ? `\n\n${env.appUrl}${href}` : ""}`);
}
