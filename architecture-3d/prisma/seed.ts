/**
 * Seed: catalogue (services, offerings), portfolio concept studies, and the first administrator.
 * Idempotent: safe to run repeatedly (upserts by slug/email).
 *
 * Prices below are STARTING VALUES for a new installation. Review and change them in
 * Admin → Pricing before launch. Payment instructions (bank details) are intentionally not seeded.
 */
import { BillingInterval, OfferingKind, PrismaClient, ProjectStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateBuilding } from "../src/three/generate";
import { getPlan } from "../src/three/plans";
import { mergeConfig, type BuildingConfig } from "../src/three/config";

const db = new PrismaClient();

const SERVICES = [
  {
    slug: "residential-architecture", name: "Residential architecture", heroPreset: "townhouse-stone",
    tagline: "Family homes designed around how you actually live.",
    description: "Complete architectural design for new homes and multi-unit residential buildings, from site analysis and concept through to permit drawings and construction-stage support.",
    benefits: ["Room layouts tested in 3D before drawings are finalised", "Climate-responsive orientation and shading for hot summers", "Clear area schedules and phasing for budget control", "Coordination with structural and MEP engineers"],
    process: [["Brief and site", "We visit the site, review title and zoning constraints, and agree the brief and budget range."], ["Concept", "Two to three massing options explored in interactive 3D."], ["Developed design", "Plans, sections, elevations and material specification."], ["Permits and construction", "Permit drawing set, tender support and site visits during construction."]],
  },
  {
    slug: "luxury-villas", name: "Luxury villas", heroPreset: "villa-horizon",
    tagline: "Private residences with landscape, pool and interiors as one design.",
    description: "Bespoke villas where architecture, interiors and landscape are designed together. Includes cinematic 3D walkthroughs at every design stage.",
    benefits: ["Integrated architecture, interior and landscape design", "Cinematic walkthroughs at each stage", "Premium material sourcing guidance", "Pool, terrace and outdoor lighting design"],
    process: [["Discovery", "Lifestyle brief, site visit and reference review."], ["Concept and walkthrough", "Concept massing with a full 3D walkthrough."], ["Detailed design", "Interior elevations, joinery, lighting and landscape plans."], ["Delivery", "Specifications, contractor selection support and site supervision."]],
  },
  {
    slug: "commercial-buildings", name: "Commercial buildings", heroPreset: "office-block",
    tagline: "Workplaces, retail and mixed-use buildings that perform.",
    description: "Offices, retail, hospitality and mixed-use developments designed for flexible leasing, efficient structure and strong street presence.",
    benefits: ["Efficient floor plates and core planning", "Facade shading to reduce cooling loads", "Leasing-ready 3D marketing visuals", "Phased delivery planning"],
    process: [["Feasibility", "Site capacity, massing and yield study."], ["Concept", "Facade and planning options with 3D visuals for investors."], ["Design development", "Coordinated design with engineers."], ["Permit and tender", "Permit set and tender documentation."]],
  },
  {
    slug: "interior-design", name: "Interior design", heroPreset: "pavilion-minimal",
    tagline: "Interiors specified to the last finish, previewed in 3D.",
    description: "Residential and commercial interiors: space planning, finishes, joinery, lighting and furniture, all previewed in real time before procurement.",
    benefits: ["Finish and lighting options compared side by side", "Furniture layouts at true scale", "Joinery and lighting drawings", "Procurement schedules"],
    process: [["Survey", "Measured survey and brief."], ["Concept", "Mood, palette and layout options in 3D."], ["Specification", "Finishes, joinery, lighting and FF&E schedules."], ["Installation", "Coordination with contractors and suppliers."]],
  },
  {
    slug: "landscape-architecture", name: "Landscape architecture", heroPreset: "brutalist-residence",
    tagline: "Gardens, terraces and pools designed for the local climate.",
    description: "Landscape design for homes and commercial sites with water-wise planting, shade, outdoor rooms, pools and lighting.",
    benefits: ["Low-water planting strategies", "Shade and outdoor-room planning", "Pool and water feature design", "Outdoor lighting design"],
    process: [["Site analysis", "Sun, wind, soil and drainage review."], ["Concept", "Zoning and planting concept in 3D."], ["Detail", "Planting plans, hardscape details, irrigation."], ["Implementation", "Contractor coordination."]],
  },
  {
    slug: "renovation", name: "Renovation and extension", heroPreset: "townhouse-stone",
    tagline: "Rethink an existing building without losing its character.",
    description: "Renovations, extensions and adaptive reuse. We survey what exists, model it in 3D, and test changes before demolition begins.",
    benefits: ["Existing building modelled in 3D", "Options compared before any demolition", "Phasing to keep buildings in use", "Energy and comfort upgrades"],
    process: [["Survey", "Measured survey and condition assessment."], ["Options", "Renovation options modelled in 3D."], ["Design", "Construction drawings and specifications."], ["Works", "Site supervision and snagging."]],
  },
  {
    slug: "3d-visualization", name: "3D architectural visualization", heroPreset: "villa-horizon",
    tagline: "Interactive models and cinematic visuals for your project.",
    description: "Real-time 3D models, still renders and walkthroughs for architects, developers and homeowners, delivered as an interactive web experience you can share.",
    benefits: ["Shareable interactive 3D link", "Day-to-night lighting studies", "Material option boards", "Marketing-ready stills"],
    process: [["Inputs", "You send drawings, references and material choices."], ["Model", "We build the 3D model and materials."], ["Review", "Two review rounds in the interactive viewer."], ["Delivery", "Interactive link, stills and walkthrough."]],
  },
  {
    slug: "construction-consultation", name: "Construction consultation", heroPreset: "office-block",
    tagline: "Independent advice before and during construction.",
    description: "Budget reviews, contractor tender comparison, value engineering and site visits by qualified architects.",
    benefits: ["Independent budget and tender review", "Value engineering options", "Site visit reports", "Defect and snagging lists"],
    process: [["Review", "We review your drawings, budget and contracts."], ["Report", "Written findings and recommendations."], ["Site", "Scheduled site visits."], ["Close-out", "Final inspection and snagging list."]],
  },
];

type Off = {
  slug: string; kind: OfferingKind; name: string; summary: string; features: string[]; price: number | null;
  interval?: BillingInterval; entitlement?: string; audience?: Role[]; highlighted?: boolean; service?: string; sortOrder: number;
};

const OFFERINGS: Off[] = [
  { slug: "consultation-60", kind: "CONSULTATION", name: "Architect consultation, 60 minutes", summary: "A one-hour video or in-person session with an architect to review your site, brief and budget.", features: ["Site and brief review", "Feasibility and budget guidance", "Written summary of next steps"], price: 60, sortOrder: 1 },
  { slug: "visualization-essential", kind: "VISUALIZATION_PACKAGE", name: "Visualization Essential", summary: "Interactive 3D model of one building from your drawings.", features: ["Interactive 3D web model", "4 still images", "1 review round"], price: 450, service: "3d-visualization", sortOrder: 2 },
  { slug: "visualization-signature", kind: "VISUALIZATION_PACKAGE", name: "Visualization Signature", summary: "Interior and exterior model with lighting studies and walkthrough.", features: ["Interior and exterior model", "Day and night lighting studies", "10 still images", "Cinematic walkthrough", "2 review rounds"], price: 1200, highlighted: true, service: "3d-visualization", sortOrder: 3 },
  { slug: "concept-design", kind: "SERVICE_PACKAGE", name: "Concept design package", summary: "Site analysis and two concept options for a home up to 400 m², presented in 3D.", features: ["Site and zoning review", "Two concept options", "Interactive 3D model of the chosen option", "Area schedule"], price: 2500, service: "residential-architecture", sortOrder: 4 },
  { slug: "studio-pro", kind: "PREMIUM_FEATURE", name: "Studio Pro", summary: "Unlimited saved designs and high-resolution 4K exports in the design studio.", features: ["Unlimited saved designs", "4K screenshot export", "Priority review of studio designs"], price: 15, interval: "MONTHLY", entitlement: "studio_pro", sortOrder: 5 },
  { slug: "architect-professional", kind: "ARCHITECT_SUBSCRIPTION", name: "Architect Professional", summary: "Publish your projects in the gallery with interactive 3D previews and receive enquiries.", features: ["Publish projects to the gallery (after review)", "Interactive 3D project previews", "Studio Pro included"], price: 49, interval: "MONTHLY", entitlement: "architect_pro", audience: ["ARCHITECT"], sortOrder: 6 },
  { slug: "architect-professional-yearly", kind: "ARCHITECT_SUBSCRIPTION", name: "Architect Professional, yearly", summary: "Architect Professional billed annually.", features: ["Everything in Architect Professional", "Two months free compared to monthly"], price: 490, interval: "YEARLY", entitlement: "architect_pro", audience: ["ARCHITECT"], sortOrder: 7 },
  { slug: "featured-placement-30", kind: "FEATURED_PLACEMENT", name: "Featured project placement, 30 days", summary: "Feature one approved project at the top of the gallery and on the home page.", features: ["Top-of-gallery placement", "Home page feature", "30 days"], price: 120, entitlement: "featured_placement", audience: ["ARCHITECT", "PARTNER"], sortOrder: 8 },
  { slug: "developer-partnership", kind: "PARTNERSHIP", name: "Developer and contractor partnership", summary: "Visualization and design capacity for developers and construction companies, priced per agreement.", features: ["Dedicated design team", "Volume visualization pricing", "Co-branded project pages"], price: null, audience: ["PARTNER"], sortOrder: 9 },
  { slug: "custom-commission", kind: "CUSTOM_COMMISSION", name: "Custom architectural commission", summary: "Full architectural services for your project, quoted after a consultation.", features: ["Complete design to construction", "Fee based on scope and area", "Fixed-fee or percentage options"], price: null, sortOrder: 10 },
];

const PROJECTS: { slug: string; title: string; preset: string; patch?: Partial<{ exterior: Partial<BuildingConfig["exterior"]>; interior: Partial<BuildingConfig["interior"]>; environment: Partial<BuildingConfig["environment"]> }>; styles: string[]; categories: string[]; service: string; summary: string; description: string; challenge: string; solution: string; outcome: string; featured?: boolean }[] = [
  {
    slug: "horizon-villa", title: "Horizon Villa", preset: "villa-horizon", styles: ["modern", "luxury"], categories: ["residential"], service: "luxury-villas", featured: true,
    summary: "A cantilevered upper storey shades a full-width garden terrace and pool.",
    description: "A two-storey family villa organised around a long garden terrace. The bedroom volume cantilevers 1.5 m over the ground floor to shade the glazing, while travertine walls and vertical fins temper the western sun.",
    challenge: "Open the living spaces to the garden without overheating in summer.",
    solution: "A deep cantilever and vertical fins shade full-height glazing; travertine adds thermal mass.",
    outcome: "Living spaces open completely to the terrace while direct summer sun is kept off the glass after midday.",
  },
  {
    slug: "glass-pavilion", title: "Glass Pavilion", preset: "pavilion-minimal", styles: ["minimalist", "modern"], categories: ["residential", "interior"], service: "interior-design", featured: true,
    summary: "A single-storey pavilion under a floating canopy roof.",
    description: "One continuous living space under a 1.4 m canopy, with a bedroom wing and a reflecting pool along the main facade. Terrazzo floors run from inside to out.",
    challenge: "Keep a fully glazed house comfortable and private.",
    solution: "A deep canopy shades every facade; the pool and planting set the house back from view.",
    outcome: "A calm, single-level home with daylight in every room.",
  },
  {
    slug: "stone-townhouse", title: "Stone Townhouse", preset: "townhouse-stone", styles: ["classical"], categories: ["residential"], service: "residential-architecture",
    summary: "A narrow urban house in cut limestone with tall punched windows.",
    description: "A three-storey townhouse on a 9 m plot. Limestone ashlar, oak frames and an expressed horizontal frame give it a classical rhythm on a contemporary plan.",
    challenge: "Fit a family home on a narrow, deep plot.",
    solution: "A single stair along the party wall frees full-width rooms on every floor.",
    outcome: "Three full-width rooms per floor with daylight from both ends.",
  },
  {
    slug: "meridian-workplace", title: "Meridian Workplace", preset: "office-block", styles: ["modern"], categories: ["commercial"], service: "commercial-buildings", featured: true,
    summary: "Four storeys of flexible offices above a café and retail ground floor.",
    description: "A compact commercial building with a central core, ribbon windows behind concrete fins, and a green roof. Floors can be leased whole or split into suites.",
    challenge: "Deliver flexible floors on a tight budget with strong street presence.",
    solution: "A single efficient core and a repetitive fin facade keep construction simple.",
    outcome: "Column-free floors that divide into up to three tenancies.",
  },
  {
    slug: "monolith-residence", title: "Monolith Residence", preset: "brutalist-residence", styles: ["brutalist"], categories: ["residential", "landscape"], service: "landscape-architecture",
    summary: "Stacked concrete volumes that create shaded terraces on every level.",
    description: "Board-formed concrete volumes shift on each floor so every level gets a shaded terrace. Timber louvres and a native meadow soften the mass.",
    challenge: "Give every floor outdoor space on a compact footprint.",
    solution: "Each floor shifts relative to the one below, turning roofs into terraces.",
    outcome: "Outdoor rooms on three levels, each shaded by the floor above.",
  },
  {
    slug: "brick-garden-villa", title: "Brick Garden Villa", preset: "villa-horizon", styles: ["modern"], categories: ["residential", "landscape"], service: "landscape-architecture",
    patch: { exterior: { wall: "brick", accent: "timber", pattern: "louvers", glass: "clear", frames: "bronze", roof: "green" }, environment: { landscape: "meadow", time: 10 } },
    summary: "The Horizon plan re-imagined in fired brick with a planted roof.",
    description: "A material study of the Horizon plan: fired brick, timber louvres and a green roof, set in a native meadow.",
    challenge: "Lower the embodied energy and running costs of the villa type.",
    solution: "Brick, a planted roof and horizontal louvres reduce heat gain and use regional materials.",
    outcome: "The same plan with a warmer, more regional character.",
  },
  {
    slug: "desert-pavilion", title: "Desert Pavilion", preset: "pavilion-minimal", styles: ["minimalist", "luxury"], categories: ["residential", "landscape"], service: "luxury-villas",
    patch: { exterior: { wall: "travertine", glass: "bronze", frames: "bronze" }, interior: { floor: "marble", furniture: "luxe" }, environment: { landscape: "gravel", time: 18.4 } },
    summary: "Travertine and bronze glass in a low-water gravel garden.",
    description: "The pavilion type in travertine with bronze solar-control glazing and a gravel landscape designed for minimal irrigation.",
    challenge: "Create a luxurious retreat in a dry climate.",
    solution: "Solar-control glass, stone mass and drought-tolerant planting.",
    outcome: "A warm, low-maintenance retreat that glows at dusk.",
  },
];

async function main() {
  // Services
  for (const [i, s] of SERVICES.entries()) {
    const data = { name: s.name, tagline: s.tagline, description: s.description, benefits: s.benefits, process: s.process.map(([title, detail]) => ({ title, detail })), heroPreset: s.heroPreset, sortOrder: i };
    await db.service.upsert({ where: { slug: s.slug }, create: { slug: s.slug, ...data }, update: data });
  }
  const services = Object.fromEntries((await db.service.findMany()).map((s) => [s.slug, s.id]));

  // Offerings — only created if missing, so admin price edits are never overwritten by re-seeding.
  for (const o of OFFERINGS) {
    const exists = await db.offering.findUnique({ where: { slug: o.slug } });
    if (exists) continue;
    await db.offering.create({
      data: {
        slug: o.slug, kind: o.kind, name: o.name, summary: o.summary, features: o.features,
        price: o.price, currency: "USD", interval: o.interval ?? "ONE_TIME", entitlement: o.entitlement,
        audience: o.audience ?? [], highlighted: o.highlighted ?? false, sortOrder: o.sortOrder,
        serviceId: o.service ? services[o.service] : undefined,
      },
    });
  }

  // Portfolio concept studies with specs computed from the real 3D model.
  for (const p of PROJECTS) {
    const plan = getPlan(p.preset);
    const config = mergeConfig(plan.defaultConfig, p.patch ?? {});
    const m = generateBuilding(plan, config);
    const specs = [
      { label: "Gross floor area", value: `${m.stats.grossFloorArea} m²` },
      { label: "Storeys", value: String(m.stats.floors) },
      { label: "Height", value: `${m.stats.height} m` },
      { label: "Rooms", value: String(m.stats.rooms) },
      { label: "Glazing ratio", value: `${Math.round(m.stats.glazingRatio * 100)}%` },
    ];
    const data = {
      title: p.title, summary: p.summary, description: p.description, styles: p.styles, categories: p.categories,
      config, presetId: plan.id, specs, challenge: p.challenge, solution: p.solution, outcome: p.outcome,
      areaM2: m.stats.grossFloorArea, floors: m.stats.floors, isConcept: true, status: ProjectStatus.PUBLISHED,
      featured: p.featured ?? false, serviceId: services[p.service],
    };
    await db.project.upsert({ where: { slug: p.slug }, create: { slug: p.slug, ...data }, update: data });
  }

  // First administrator
  const email = process.env.SEED_ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "";
  if (email && password.length >= 12) {
    const existing = await db.user.findUnique({ where: { email } });
    if (!existing) {
      await db.user.create({ data: { email, name: "Administrator", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12), emailVerifiedAt: new Date() } });
      console.log(`Created administrator ${email}`);
    }
  } else {
    console.log("SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD (12+ chars) not set — no administrator created.");
  }
  console.log(`Seeded ${SERVICES.length} services, ${OFFERINGS.length} offerings, ${PROJECTS.length} projects.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
