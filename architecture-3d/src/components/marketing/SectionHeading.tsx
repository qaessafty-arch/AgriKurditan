import type { ReactNode } from "react";

export function SectionHeading({ eyebrow, title, children, action }: { eyebrow: string; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-3 text-display-md text-ink text-balance">{title}</h2>
        {children && <div className="mt-4 text-base leading-relaxed text-muted">{children}</div>}
      </div>
      {action}
    </div>
  );
}
