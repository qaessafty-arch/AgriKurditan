"use client";
import { Button } from "@/components/ui/Button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <h1 className="text-display-md text-ink">Something went wrong.</h1>
        <p className="mt-3 text-muted">The error has been logged. Please try again.</p>
        <Button className="mt-8" onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
