import { Link } from "@/i18n/client";
import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "overlay";
type Size = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded font-medium transition-[background-color,border-color,color,transform] duration-200 ease-architectural disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px whitespace-nowrap";
const variants: Record<Variant, string> = {
  primary: "bg-accent text-[#101114] hover:bg-[#c4ab86]",
  secondary: "border border-line-strong bg-transparent text-ink hover:border-ink/60 hover:bg-ink/5",
  ghost: "text-ink hover:bg-ink/5",
  danger: "bg-danger/15 text-danger border border-danger/40 hover:bg-danger/25",
  overlay: "border border-line-strong bg-canvas/75 text-ink backdrop-blur-md hover:bg-canvas/95",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[0.95rem]",
};

export function buttonClass(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, className, children, disabled, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClass(variant, size, className)} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({ href, variant = "primary", size = "md", className, children, ...rest }: {
  href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode;
} & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}
