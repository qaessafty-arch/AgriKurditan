import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { z, ZodError, type ZodType } from "zod";
import { HttpError, badRequest, forbidden, tooMany } from "@/lib/errors";
import { checkRate, type Limit } from "@/lib/security/rate-limit";
import { clientIp } from "@/lib/auth/session";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export interface RouteContext<P = Record<string, string>> {
  ip: string;
  params: P;
}

interface Options {
  /** Rate-limit bucket name and limit, keyed by client IP. */
  rate?: [string, Limit];
  /** Disable the same-origin check (only for endpoints that must accept cross-site posts). */
  allowCrossOrigin?: boolean;
}

/** Same-origin check for state-changing requests (CSRF defence in addition to SameSite cookies). */
export function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (origin) {
    try {
      const o = new URL(origin);
      if (host && o.host === host) return true;
      const app = new URL(process.env.APP_URL ?? "http://localhost:3000");
      return o.host === app.host;
    } catch {
      return false;
    }
  }
  return req.headers.get("sec-fetch-site") === "same-origin";
}

export function route<P extends Record<string, string> = Record<string, string>>(
  opts: Options,
  fn: (req: NextRequest, ctx: RouteContext<P>) => Promise<Response | unknown>,
) {
  return async (req: NextRequest, segment: { params: Promise<unknown> }) => {
    try {
      const ip = clientIp(req.headers);
      if (MUTATING.has(req.method) && !opts.allowCrossOrigin && !isSameOrigin(req)) throw forbidden("Cross-site request rejected.");
      if (opts.rate) {
        const [name, limit] = opts.rate;
        const r = checkRate(`${name}:${ip}`, limit);
        if (!r.ok) {
          return NextResponse.json({ error: tooMany().message }, { status: 429, headers: { "Retry-After": String(r.retryAfter) } });
        }
      }
      const params = ((await segment?.params) ?? {}) as P;
      const result = await fn(req, { ip, params });
      if (result instanceof Response) return result;
      return NextResponse.json(result ?? { ok: true }, { headers: { "Cache-Control": "no-store" } });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message, fields: err.fields }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json({ error: "Please check the highlighted fields.", fields: zodFields(err) }, { status: 400 });
  }
  console.error("[api] unhandled error", err);
  return NextResponse.json({ error: "Something went wrong on our side. Please try again." }, { status: 500 });
}

export function zodFields(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Read and validate a JSON body with a hard size cap. */
export async function readJson<T extends ZodType>(req: NextRequest, schema: T, maxBytes = 64 * 1024): Promise<z.infer<T>> {
  const len = Number(req.headers.get("content-length") ?? "0");
  if (len > maxBytes) throw badRequest("Request is too large.");
  const text = await req.text();
  if (text.length > maxBytes) throw badRequest("Request is too large.");
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw badRequest("Malformed JSON body.");
  }
  return schema.parse(data);
}
