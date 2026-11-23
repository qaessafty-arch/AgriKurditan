"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function SideNav({ items, label }: { items: { href: string; label: string }[]; label: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label={label} className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
      {items.map((i) => {
        const active = pathname === i.href || (i.href !== items[0]!.href && pathname.startsWith(i.href));
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined}
            className={cn("shrink-0 rounded px-3 py-2 text-sm transition-colors", active ? "bg-ink/5 text-ink" : "text-muted hover:text-ink")}>
            {i.label}
          </Link>
        );
      })}
    </nav>
  );
}
