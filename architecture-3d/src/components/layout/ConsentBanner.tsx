"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

const KEY = "a3d-consent";
export type Consent = "granted" | "denied";

export function readConsent(): Consent | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

function visitorId(): string {
  try {
    let id = localStorage.getItem("a3d-vid");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("a3d-vid", id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

/** Record an analytics event — only when the visitor has opted in. */
export function track(type: string, subject?: string) {
  if (readConsent() !== "granted") return;
  const body = JSON.stringify({ type, subject, path: location.pathname, visitorId: visitorId() });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/analytics", new Blob([body], { type: "application/json" }));
  else void fetch("/api/analytics", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
}

export function ConsentBanner() {
  const [consent, setConsent] = useState<Consent | null | "unknown">("unknown");
  const pathname = usePathname();
  const last = useRef<string | null>(null);

  useEffect(() => setConsent(readConsent()), []);
  useEffect(() => {
    if (consent !== "granted" || last.current === pathname) return;
    last.current = pathname;
    track("page_view");
  }, [consent, pathname]);

  if (consent !== null) return null;
  const decide = (c: Consent) => {
    try { localStorage.setItem(KEY, c); } catch { /* ignore */ }
    if (c === "denied") { try { localStorage.removeItem("a3d-vid"); } catch { /* ignore */ } }
    setConsent(c);
  };

  return (
    <div role="dialog" aria-live="polite" aria-label="Analytics consent" className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-xl rounded-lg border hairline bg-raised p-4 shadow-panel sm:inset-x-6 sm:bottom-6">
      <p className="text-sm text-ink">May we record anonymous usage statistics?</p>
      <p className="mt-1 text-xs leading-relaxed text-muted">
        We count page views and which projects are viewed so we can improve the site. No advertising trackers, no third parties.
        Essential cookies for signing in are always used.
      </p>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => decide("granted")}>Allow statistics</Button>
        <Button size="sm" variant="secondary" onClick={() => decide("denied")}>Decline</Button>
      </div>
    </div>
  );
}
