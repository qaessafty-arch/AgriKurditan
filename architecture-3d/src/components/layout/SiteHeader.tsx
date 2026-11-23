"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV, SITE } from "@/lib/site";
import { cn } from "@/lib/cn";
import { ButtonLink } from "@/components/ui/Button";
import { ThemeToggle } from "./ThemeToggle";

export interface HeaderUser {
  name: string;
  role: string;
  unread: number;
}

export function SiteHeader({ user }: { user: HeaderUser | null }) {
  const pathname = usePathname();
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

  return (
    <header
      className={cn(
        "z-40 w-full transition-colors duration-300",
        overlay ? "fixed inset-x-0 top-0" : "sticky top-0",
        solid ? "glass border-b hairline" : "bg-transparent",
      )}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-accent focus:px-3 focus:py-2 focus:text-[#101114]">
        Skip to content
      </a>
      <div className={cn("flex h-16 items-center gap-6", immersive ? "px-4 lg:px-6" : "container")}>
        <Link href="/" className="flex items-center gap-2.5 text-ink" aria-label={`${SITE.name} home`}>
          <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden className="text-accent">
            <path d="M3 22V9l10-6 10 6v13" fill="none" stroke="currentColor" strokeWidth="1.6" />
            <path d="M8 22v-8h10v8M3 22h20" fill="none" stroke="currentColor" strokeWidth="1.6" />
          </svg>
          <span className="font-display text-xl tracking-wide">Architecture&nbsp;3D</span>
        </Link>

        <nav aria-label="Main" className="ml-4 hidden flex-1 items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded px-3 py-2 text-sm transition-colors",
                  active ? "text-ink" : "text-muted hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <Link href="/account" className="relative hidden items-center gap-2 rounded px-2 py-1.5 text-sm text-ink hover:bg-ink/5 sm:flex">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-accent/20 text-xs font-semibold text-accent-ink">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="max-w-[9rem] truncate">{user.name.split(" ")[0]}</span>
              {user.unread > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-[#101114]" aria-label={`${user.unread} unread notifications`}>
                  {user.unread}
                </span>
              )}
            </Link>
          ) : (
            <Link href="/login" className="hidden rounded px-3 py-2 text-sm text-muted hover:text-ink sm:block">
              Sign in
            </Link>
          )}
          <ButtonLink href="/consultation" size="sm" className="hidden md:inline-flex">
            Request consultation
          </ButtonLink>
          <button
            type="button"
            className="grid h-10 w-10 place-items-center rounded text-ink hover:bg-ink/5 lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
              {open ? (
                <path d="M5 5l12 12M17 5L5 17" stroke="currentColor" strokeWidth="1.6" />
              ) : (
                <path d="M3 7h16M3 15h16" stroke="currentColor" strokeWidth="1.6" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-nav" className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-canvas lg:hidden">
          <nav aria-label="Mobile" className="container flex flex-col py-6">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} className="border-b hairline py-4 font-display text-2xl text-ink">
                {item.label}
              </Link>
            ))}
            <Link href={user ? "/account" : "/login"} className="border-b hairline py-4 font-display text-2xl text-ink">
              {user ? "My account" : "Sign in"}
            </Link>
            <ButtonLink href="/consultation" size="lg" className="mt-8">
              Request consultation
            </ButtonLink>
          </nav>
        </div>
      )}
    </header>
  );
}
