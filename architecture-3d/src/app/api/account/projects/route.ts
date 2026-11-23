import { z } from "zod";
import { route, readJson } from "@/lib/api";
import { db } from "@/lib/db";
import { requireCapability } from "@/lib/auth/session";
import { hasEntitlement } from "@/lib/entitlements";
import { optionalText, text } from "@/lib/validation";
import { LIMITS } from "@/lib/security/rate-limit";
import { notifyAdmins } from "@/lib/notify";
import { generateBuilding } from "@/three/generate";
import { getPlan } from "@/three/plans";
import { coerceConfig } from "@/three/config";
import { HttpError, notFound } from "@/lib/errors";
import { randomBytes } from "node:crypto";

const schema = z.object({
  designId: z.string().max(40),
  title: text(100, 3),
  summary: text(200, 10),
  description: text(4000, 30),
  styles: z.array(z.enum(["modern", "minimalist", "brutalist", "classical", "luxury"])).min(1).max(3),
  categories: z.array(z.enum(["residential", "commercial", "interior", "landscape"])).min(1).max(3),
  location: optionalText(120),
  showLocation: z.boolean().default(false),
  isConcept: z.boolean().default(true),
});

/** Architects/partners with an active plan submit portfolio projects; an admin reviews before publishing. */
export const POST = route({ rate: ["write", LIMITS.write] }, async (req) => {
  const user = await requireCapability("projects:submit");
  if (user.role !== "ADMIN" && !(await hasEntitlement(user, "architect_pro"))) {
    throw new HttpError(402, "Publishing projects requires an active Architect Professional plan.");
  }
  const input = await readJson(req, schema);
  const design = await db.design.findFirst({ where: { id: input.designId, userId: user.id } });
  if (!design) throw notFound("Design not found.");
  const config = coerceConfig(design.config);
  const m = generateBuilding(getPlan(design.presetId), config);
  const base = input.title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "project";
  const project = await db.project.create({
    data: {
      slug: `${base}-${randomBytes(3).toString("hex")}`, title: input.title, summary: input.summary, description: input.description,
      styles: input.styles, categories: input.categories, location: input.location, showLocation: input.showLocation,
      config, presetId: design.presetId, isConcept: input.isConcept, status: "PENDING_REVIEW", ownerId: user.id,
      areaM2: m.stats.grossFloorArea, floors: m.stats.floors,
      specs: [{ label: "Gross floor area", value: `${m.stats.grossFloorArea} m²` }, { label: "Storeys", value: String(m.stats.floors) }, { label: "Height", value: `${m.stats.height} m` }],
    },
  });
  await notifyAdmins("Project submitted for review", `${input.title} by ${user.name}`, "/admin/projects");
  return { id: project.id };
});
