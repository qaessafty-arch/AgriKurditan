import type { Config } from "tailwindcss";

/** Colours come from CSS variables in globals.css so light and dark themes share one vocabulary. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    container: { center: true, padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2.5rem" }, screens: { "2xl": "1360px" } },
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: token("surface"),
        raised: token("raised"),
        ink: token("ink"),
        muted: token("muted"),
        stone: token("stone"),
        accent: token("accent"),
        "accent-ink": token("accent-ink"),
        sage: token("sage"),
        danger: token("danger"),
        success: token("success"),
        line: "var(--line)",
        "line-strong": "var(--line-strong)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        // Fluid editorial scale.
        "display-xl": ["clamp(2.75rem, 6.5vw, 6rem)", { lineHeight: "0.98", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2.25rem, 4.6vw, 4.25rem)", { lineHeight: "1.02", letterSpacing: "-0.015em" }],
        "display-md": ["clamp(1.75rem, 3vw, 2.75rem)", { lineHeight: "1.08", letterSpacing: "-0.01em" }],
        eyebrow: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.18em" }],
      },
      borderRadius: { sm: "6px", DEFAULT: "10px", lg: "14px", xl: "20px" },
      maxWidth: { prose: "62ch" },
      transitionTimingFunction: { architectural: "cubic-bezier(0.22, 1, 0.36, 1)" },
      boxShadow: { panel: "0 24px 60px -24px rgb(0 0 0 / 0.45)" },
    },
  },
  plugins: [],
};

export default config;
