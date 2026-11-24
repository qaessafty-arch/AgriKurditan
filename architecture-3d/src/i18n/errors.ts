import { isLocale, type Locale } from "./config";
import { getMessages } from "./messages";

/** The language an API request was made in (sent by the client as x-a3d-locale). */
export function requestLocale(h: Headers): Locale {
  const v = h.get("x-a3d-locale");
  return isLocale(v) ? v : "en";
}

const patternCache = new Map<string, { re: RegExp; keys: string[]; target: string }[]>();

/**
 * Translate a server message by its English text. Entries containing {placeholders} match messages
 * with numbers in them. Unknown messages fall back to `fallback` (or stay as they are).
 */
export function translateMessage(locale: Locale, message: string, fallback?: string): string {
  if (locale === "en") return message;
  const map = getMessages(locale).apiErrors;
  if (map[message]) return map[message];
  let patterns = patternCache.get(locale);
  if (!patterns) {
    patterns = Object.entries(map).filter(([k]) => k.includes("{")).map(([k, target]) => {
      const keys: string[] = [];
      const src = k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\\{(\w+)\\\}/g, (_, name: string) => { keys.push(name); return "(.+?)"; });
      return { re: new RegExp(`^${src}$`), keys, target };
    });
    patternCache.set(locale, patterns);
  }
  for (const p of patterns) {
    const mm = p.re.exec(message);
    if (mm) return p.keys.reduce((t, k, i) => t.replace(`{${k}}`, mm[i + 1] ?? ""), p.target);
  }
  return fallback ?? message;
}
