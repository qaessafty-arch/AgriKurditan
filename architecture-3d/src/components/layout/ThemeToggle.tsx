"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/client";

type Theme = "dark" | "light";

export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('a3d-theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'}document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme='dark'}})();`;

export function ThemeToggle() {
  const { m } = useI18n();
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    setTheme((document.documentElement.dataset.theme as Theme) ?? "dark");
  }, []);

  const toggle = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("a3d-theme", next); } catch { /* storage unavailable */ }
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="grid h-10 w-10 place-items-center rounded text-muted transition-colors hover:bg-ink/5 hover:text-ink"
      aria-label={theme === "light" ? m.common.toDark : m.common.toLight}
      title={theme === "light" ? m.common.toDark : m.common.toLight}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
        {theme === "light" ? (
          <path d="M15 11.2A6.5 6.5 0 016.8 3 6.5 6.5 0 1015 11.2z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        ) : (
          <g fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="9" cy="9" r="3.2" />
            <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" />
          </g>
        )}
      </svg>
    </button>
  );
}
