import "server-only";
import { existsSync } from "node:fs";
import path from "node:path";

/** Pre-rendered cover images live in public/renders/<slug>.jpg (see scripts/render-covers.mjs). */
export function coverFor(slug: string): string | null {
  const rel = `/renders/${slug}.jpg`;
  return existsSync(path.join(process.cwd(), "public", rel)) ? rel : null;
}
