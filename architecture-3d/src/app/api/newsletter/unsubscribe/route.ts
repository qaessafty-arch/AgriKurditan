import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/security/tokens";
import { env } from "@/lib/env";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const sub = token.length > 20 && token.length < 200 ? await db.newsletterSubscriber.findUnique({ where: { tokenHash: hashToken(token) } }) : null;
  if (sub) await db.newsletterSubscriber.update({ where: { id: sub.id }, data: { unsubscribedAt: new Date() } });
  return NextResponse.redirect(`${env.appUrl}/newsletter?status=${sub ? "unsubscribed" : "invalid"}`);
}
