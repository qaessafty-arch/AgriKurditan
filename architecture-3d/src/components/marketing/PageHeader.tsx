import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children, actions }: { eyebrow: string; title: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="border-b hairline">
      <div className="container py-16 sm:py-20">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-4xl text-display-lg text-ink text-balance">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{children}</div>}
        {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  );
}
