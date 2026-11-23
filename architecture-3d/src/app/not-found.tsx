import { ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-display-md text-ink">This page is not on the plans.</h1>
        <p className="mt-3 text-muted">It may have moved, or the link may be incomplete.</p>
        <div className="mt-8 flex justify-center gap-3"><ButtonLink href="/">Home</ButtonLink><ButtonLink href="/projects" variant="secondary">Projects</ButtonLink></div>
      </div>
    </div>
  );
}
