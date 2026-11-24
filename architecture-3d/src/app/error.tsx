"use client";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/i18n/client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const { m } = useI18n();
  return (
    <div className="container grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <h1 className="text-display-md text-ink">{m.pages.error.title}</h1>
        <p className="mt-3 text-muted">{m.pages.error.body}</p>
        <Button className="mt-8" onClick={reset}>{m.pages.error.retry}</Button>
      </div>
    </div>
  );
}
