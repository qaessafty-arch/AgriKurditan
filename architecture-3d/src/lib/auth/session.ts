import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role, User } from "@prisma/client";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { hashToken, randomToken } from "@/lib/security/tokens";
import { can, type Capability } from "./permissions";
import { forbidden, unauthorized } from "@/lib/errors";

export const SESSION_COOKIE = "a3d_session";
const SESSION_DAYS = 30;
const TOUCH_INTERVAL_MS = 10 * 60 * 1000;

export type SessionUser = Pick<User, "id" | "email" | "name" | "role" | "phone" | "company" | "emailVerifiedAt" | "marketingOptIn" | "createdAt">;

export async function createSession(userId: string, meta: { ip?: string; userAgent?: string }) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.session.create({
    data: { tokenHash: hashToken(token), userId, expiresAt, ip: meta.ip?.slice(0, 64), userAgent: meta.userAgent?.slice(0, 255) },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  jar.delete(SESSION_COOKIE);
}

export async function destroyAllSessions(userId: string) {
  await db.session.deleteMany({ where: { userId } });
}

/** The signed-in user for this request, or null. Cached per request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token || token.length > 200) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true, phone: true, company: true, emailVerifiedAt: true, marketingOptIn: true, createdAt: true, disabled: true } } },
  });
  if (!session || session.expiresAt < new Date() || session.user.disabled) return null;
  if (Date.now() - session.lastSeenAt.getTime() > TOUCH_INTERVAL_MS) {
    await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => undefined);
  }
  const { disabled: _disabled, ...user } = session.user;
  return user;
});

/** For server components/pages: redirect to sign-in when not authenticated. */
export async function requirePageUser(next: string): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requirePageCapability(capability: Capability, next: string): Promise<SessionUser> {
  const user = await requirePageUser(next);
  if (!can(user.role, capability)) redirect("/account?denied=1");
  return user;
}

/** For API routes: throw 401/403 instead of redirecting. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw unauthorized();
  return user;
}

export async function requireCapability(capability: Capability): Promise<SessionUser> {
  const user = await requireUser();
  if (!can(user.role, capability)) throw forbidden();
  return user;
}

export function hasRole(user: SessionUser | null, ...roles: Role[]) {
  return Boolean(user && roles.includes(user.role));
}

export async function requestMeta() {
  const h = await headers();
  return { ip: clientIp(h), userAgent: h.get("user-agent") ?? undefined };
}

export function clientIp(h: Headers): string {
  if (process.env.TRUST_PROXY === "1") {
    const fwd = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (fwd) return fwd;
    const real = h.get("x-real-ip");
    if (real) return real;
  }
  return "direct";
}
