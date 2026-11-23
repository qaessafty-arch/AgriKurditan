import Link from "next/link";
import { CinematicExperience } from "@/components/cinematic/CinematicExperience";
import { ProjectCard } from "@/components/marketing/ProjectCard";
import { SectionHeading } from "@/components/marketing/SectionHeading";
import { ReviewsStrip } from "@/components/marketing/Reviews";
import { ButtonLink } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { coverFor } from "@/lib/covers";

export const revalidate = 300;

const CAPABILITIES = [
  { href: "/explore", title: "Explore in 3D", body: "Orbit, section and explode real building models. Inspect every room and material, and measure anything." },
  { href: "/studio", title: "Customise the design", body: "Change facade, glazing, roof, interiors and landscape. Save versions, compare them and export images." },
  { href: "/assistant", title: "Get a preliminary brief", body: "Describe your land, budget and preferences. The assistant drafts a brief and a starting design for an architect to review." },
  { href: "/consultation", title: "Work with an architect", body: "Book a consultation or request a quote. Every design is developed and verified by qualified professionals." },
];

const PROCESS = [
  ["Consult", "A first conversation about your site, brief and budget."],
  ["Visualise", "Concept options you can explore and adjust in 3D."],
  ["Develop", "Drawings, specifications and engineering coordination."],
  ["Build", "Permit support, tendering and site supervision."],
];

export default async function HomePage() {
  const [projects, services] = await Promise.all([
    db.project.findMany({
      where: { status: "PUBLISHED" },
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      take: 3,
    }),
    db.service.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" }, take: 8 }),
  ]);

  return (
    <>
      <CinematicExperience />

      <section className="border-t hairline py-24" aria-labelledby="capabilities-heading">
        <div className="container">
          <SectionHeading eyebrow="The platform" title="From first idea to a building you have already walked through." />
          <h2 id="capabilities-heading" className="sr-only">What you can do</h2>
          <div className="mt-14 grid gap-px overflow-hidden rounded-lg border hairline bg-[var(--line)] sm:grid-cols-2 lg:grid-cols-4">
            {CAPABILITIES.map((c, i) => (
              <Link key={c.href} href={c.href} className="group bg-canvas p-7 transition-colors hover:bg-surface">
                <span className="font-mono text-xs text-muted">0{i + 1}</span>
                <h3 className="mt-6 font-display text-2xl text-ink">{c.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{c.body}</p>
                <span className="mt-6 inline-block text-sm text-accent-ink transition-transform group-hover:translate-x-1">Open →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {projects.length > 0 && (
        <section className="border-t hairline py-24" aria-labelledby="projects-heading">
          <div className="container">
            <SectionHeading eyebrow="Portfolio" title="Selected projects" action={<ButtonLink href="/projects" variant="secondary">View all projects</ButtonLink>}>
              <span id="projects-heading">Every project opens as an interactive 3D model.</span>
            </SectionHeading>
            <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((p, i) => (
                <ProjectCard key={p.id} priority={i === 0} p={{ ...p, cover: coverFor(p.slug) }} />
              ))}
            </div>
          </div>
        </section>
      )}

      {services.length > 0 && (
        <section className="border-t hairline bg-surface/40 py-24" aria-labelledby="services-heading">
          <div className="container">
            <SectionHeading eyebrow="Services" title="Architecture, interiors and landscape: one studio." action={<ButtonLink href="/services" variant="secondary">All services</ButtonLink>} />
            <h2 id="services-heading" className="sr-only">Services</h2>
            <ul className="mt-12 divide-y divide-[var(--line)] border-y hairline">
              {services.map((s) => (
                <li key={s.id}>
                  <Link href={`/services/${s.slug}`} className="group grid gap-2 py-6 md:grid-cols-[1fr_1.4fr_auto] md:items-center md:gap-8">
                    <span className="font-display text-2xl text-ink transition-colors group-hover:text-accent-ink">{s.name}</span>
                    <span className="text-sm text-muted">{s.tagline}</span>
                    <span className="text-sm text-accent-ink" aria-hidden>→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="border-t hairline py-24" aria-labelledby="process-heading">
        <div className="container">
          <SectionHeading eyebrow="How we work" title="A clear process, visible at every stage." />
          <h2 id="process-heading" className="sr-only">Process</h2>
          <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS.map(([title, body], i) => (
              <li key={title} className="border-t-2 border-accent/60 pt-5">
                <span className="font-mono text-xs text-muted">Step {i + 1}</span>
                <h3 className="mt-2 font-display text-2xl text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ol>
          <p className="mt-12 max-w-3xl rounded border hairline bg-surface/60 p-4 text-xs leading-relaxed text-muted">
            3D models and AI-generated suggestions on this site are design studies. Structural safety, building-code and permit compliance are
            established only through drawings prepared and verified by qualified, licensed professionals.
          </p>
        </div>
      </section>

      <ReviewsStrip />

      <section className="border-t hairline py-24">
        <div className="container flex flex-col items-start gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Start a project</p>
            <h2 className="mt-3 text-display-lg text-ink text-balance">Tell us about your site.</h2>
            <p className="mt-4 text-muted">A first consultation covers your brief, budget and feasibility, and you leave with clear next steps.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/consultation" size="lg">Book a consultation</ButtonLink>
            <ButtonLink href="/quote" size="lg" variant="secondary">Request a quote</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
