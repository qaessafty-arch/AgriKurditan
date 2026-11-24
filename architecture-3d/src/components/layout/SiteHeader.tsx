"use client";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { NAV } from "@/lib/site";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { Link, useI18n } from "@/i18n/client";
import { fmt, splitLocale } from "@/i18n/config";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitcher } from "./LanguageSwitcher";

export interface HeaderUser {
  name: string;
  role: string;
  unread: number;
}

const NAV_KEYS = { "/projects": "projects", "/services": "services", "/explore": "explore", "/studio": "studio", "/assistant": "assistant", "/pricing": "pricing" } as const;

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const { m } = useI18n();
  const pathname = splitLocale(usePathname()).path;
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const overlay = pathname === "/";
  const immersive = pathname.startsWith("/explore") || pathname.startsWith("/studio");

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const solid = !overlay || scrolled || open;
  const label = (href: keyof typeof NAV_KEYS) => m.nav[NAV_KEYS[href]];

  return (
    <header className={cn("z-40 w-full transition-colors duration-300", overlay ? "fixed inset-x-0 top-0" : "sticky top-0", solid ? "glass border-b hairline" : "bg-transparent")}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-[#101114]">
        {m.common.skip}
      </a>
      <div className={cn("flex h-16 items-center gap-4 xl:gap-6", immersive ? "px-4 lg:px-6" : "container")}>
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-ink" aria-label={m.common.home}>
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden className="text-accent">
            <path d="M3 22V9l10-6 10 6v13" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 22v-8h10v8M3 22h20" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span className="font-display text-xl tracking-wide" dir="ltr">Architecture&nbsp;3D</span>
        </Link>

        <nav aria-label="Main" className="ms-2 hidden flex-1 items-center gap-0.5 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined}
                className={cn("rounded px-2.5 py-2 text-sm transition-colors xl:px-3", active ? "text-ink" : "text-muted hover:text-ink")}>
                {label(item.href)}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-1.5">
          <Suspense><LanguageSwitcher className="hidden sm:flex" compact /></Suspense>
          <ThemeToggle />
          {user ? (
            <Link href="/account" className="relative hidden items-center gap-2 rounded px-2 py-1.5 text-sm text-ink hover:bg-ink/5 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/20 text-xs font-semibold text-accent-ink">{user.name.slice(0, 1).toUpperCase()}</span>
              <span className="max-w-[9rem] truncate">{user.name.split(" ")[0]}</span>
              {user.unread > 0 && (
                <span className="absolute -end-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-[#101114]" aria-label={fmt(m.common.unreadNotifications, { n: user.unread })}>
                  {user.unread}
                </span>
              )}
            </Link>
          ) : (
            <Link href="/login" className="hidden rounded px-3 py-2 text-sm text-muted hover:text-ink sm:block">{m.common.signIn}</Link>
          )}
          <ButtonLink href="/consultation" size="sm" className="hidden md:inline-flex">{m.common.requestConsultation}</ButtonLink>
          <button type="button" className="grid h-10 w-10 place-items-center rounded text-ink hover:bg-ink/5 lg:hidden"
            aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? m.common.closeMenu : m.common.openMenu} onClick={() => setOpen((v) => !v)}>
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
              {open ? <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.6" /> : <path d="M3 7h16M3 15h16" stroke="currentColor" strokeWidth="1.6" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-canvas lg:hidden">
          <nav aria-label="Mobile" className="container flex flex-col py-6">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="border-b hairline py-4 font-display text-2xl text-ink">{label(item.href)}</Link>
            ))}
            <Link href={user ? "/account" : "/login"} className="border-b hairline py-4 font-display text-2xl text-ink">{user ? m.common.myAccount : m.common.signIn}</Link>
            <Suspense><LanguageSwitcher className="mt-6" /></Suspense>
            <ButtonLink href="/consultation" size="lg" className="mt-6">{m.common.requestConsultation}</ButtonLink>
          </nav>
        </div>
      )}
    </header>
  );
}
