import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@/lib/env";

export interface EmailResult { sent: boolean; reason?: string }

let transport: Transporter | null = null;
function getTransport() {
  if (!env.smtpConfigured) return null;
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  return transport;
}

/** Sends an email. Never pretends: returns { sent: false } when SMTP is not configured or fails. */
export async function sendEmail(to: string, subject: string, text: string): Promise<EmailResult> {
  const t = getTransport();
  if (!t) {
    if (!env.isProduction) console.info(`[email:dev] SMTP not configured. Would send to ${to}: ${subject}\n${text}\n`);
    return { sent: false, reason: "smtp_not_configured" };
  }
  try {
    await t.sendMail({ from: process.env.EMAIL_FROM, to, subject, text });
    return { sent: true };
  } catch (err) {
    console.error("[email] send failed", err);
    return { sent: false, reason: "send_failed" };
  }
}
