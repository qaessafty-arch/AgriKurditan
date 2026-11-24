import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALE_HEADER, isLocale, localePath, negotiate, splitLocale } from "@/i18n/config";

/**
 * Locale routing: /ar/... and /ckb/... are rewritten to the shared routes with an x-a3d-locale header.
 * Unprefixed requests follow the visitor's saved choice (cookie), or their browser language on the first
 * visit, so server-side redirects such as /login keep the visitor in their language.
 */
export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const { locale, path } = splitLocale(pathname);
  const saved = req.cookies.get(LOCALE_COOKIE)?.value;

  // Staff tools are English-only and language-neutral: never prefixed, never redirected.
  const neutral = (p: string) => p === "/admin" || p.startsWith("/admin/") || p.startsWith("/render/");
  if (locale && neutral(path)) return NextResponse.redirect(new URL(`${path}${search}`, req.url));
  if (!locale && neutral(pathname)) {
    const headers = new Headers(req.headers);
    headers.set(LOCALE_HEADER, DEFAULT_LOCALE);
    return NextResponse.next({ request: { headers } });
  }

  if (locale === "en") {
    const res = NextResponse.redirect(new URL(`${path}${search}`, req.url));
    res.cookies.set(LOCALE_COOKIE, "en", { path: "/", maxAge: 31536000, sameSite: "lax" });
    return res;
  }

  if (locale) {
    const headers = new Headers(req.headers);
    headers.set(LOCALE_HEADER, locale);
    const url = req.nextUrl.clone();
    url.pathname = path;
    const res = NextResponse.rewrite(url, { request: { headers } });
    if (saved !== locale) res.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return res;
  }

  // Unprefixed: honour a saved non-English choice, or negotiate on the first visit.
  const wanted = isLocale(saved) ? saved : negotiate(req.headers.get("accept-language"));
  if (wanted !== DEFAULT_LOCALE) {
    const res = NextResponse.redirect(new URL(`${localePath(pathname, wanted)}${search}`, req.url));
    if (!saved) res.cookies.set(LOCALE_COOKIE, wanted, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return res;
  }
  const headers = new Headers(req.headers);
  headers.set(LOCALE_HEADER, DEFAULT_LOCALE);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Pages only: no API routes, build assets, metadata files or static files.
  matcher: ["/((?!api|_next/static|_next/image|renders|favicon.ico|robots.txt|sitemap.xml|opengraph-image|.*\\.[a-zA-Z0-9]{2,5}$).*)"],
};
