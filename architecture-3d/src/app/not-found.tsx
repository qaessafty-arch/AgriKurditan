import { ButtonLink } from "@/components/ui/Button";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { m } = await getI18n();
  return (
    <div className="container grid min-h-[60vh] place-items-center py-24 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-display-md text-ink">{m.pages.notFound.title}</h1>
        <p className="mt-3 text-muted">{m.pages.notFound.body}</p>
        <div className="mt-8 flex justify-center gap-3"><ButtonLink href="/">{m.common.home}</ButtonLink><ButtonLink href="/projects" variant="secondary">{m.nav.projects}</ButtonLink></div>
      </div>
    </div>
  );
}
