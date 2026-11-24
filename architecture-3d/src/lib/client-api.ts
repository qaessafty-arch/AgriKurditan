"use client";
/** Small fetch wrapper for same-origin JSON APIs. Returns typed data or a structured error. */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; fields?: Record<string, string>; status: number };

export async function api<T = unknown>(url: string, init: { method?: string; body?: unknown } = {}): Promise<ApiResult<T>> {
  try {
    const locale = typeof document !== "undefined" ? document.documentElement.lang || "en" : "en";
    const res = await fetch(url, {
      method: init.method ?? (init.body === undefined ? "GET" : "POST"),
      headers: { "x-a3d-locale": locale, ...(init.body === undefined ? {} : { "Content-Type": "application/json" }) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      credentials: "same-origin",
    });
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      return { ok: false, status: res.status, error: (json.error as string) ?? `Request failed (${res.status})`, fields: json.fields as Record<string, string> | undefined };
    }
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, status: 0, error: typeof document !== "undefined" && document.documentElement.dir === "rtl" ? (document.documentElement.lang === "ckb" ? "هەڵەی پەیوەندی. ئینتەرنێتەکەت بپشکنە و دووبارە هەوڵ بدەرەوە." : "خطأ في الاتصال. تحقّق من الإنترنت وحاول مرة أخرى.") : "Network error. Check your connection and try again." };
  }
}
