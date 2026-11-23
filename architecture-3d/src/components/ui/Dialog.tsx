"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Accessible modal built on the native <dialog> element (focus trap, Escape to close). */
export function Dialog({ open, onClose, title, children, wide, footer }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="dialog-title"
      className={cn(
        "m-auto max-h-[90dvh] w-[calc(100vw-2rem)] overflow-hidden rounded-xl border hairline bg-raised p-0 text-ink shadow-panel backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        wide ? "max-w-4xl" : "max-w-lg",
      )}
    >
      {open && (
        <div className="flex max-h-[90dvh] flex-col">
          <div className="flex items-center justify-between border-b hairline px-5 py-4">
            <h2 id="dialog-title" className="font-display text-2xl">{title}</h2>
            <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded text-muted hover:bg-ink/5 hover:text-ink" aria-label="Close dialog">
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" /></svg>
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-5">{children}</div>
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t hairline px-5 py-4">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
