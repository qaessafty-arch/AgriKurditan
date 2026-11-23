import type { ReactNode } from "react";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="container grid min-h-[calc(100dvh-4rem)] place-items-center py-16">
      <div className="w-full max-w-md">
        <h1 className="text-display-md text-ink">{title}</h1>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
        <div className="card mt-8 p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
