import "server-only";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { Capability } from "@/lib/auth/permissions";
import type { SessionUser } from "@/lib/auth/session";
import { decidePayment } from "@/lib/payments/verify";
import { notifyUser } from "@/lib/notify";
import { badRequest, notFound } from "@/lib/errors";
import { money } from "@/lib/format";

const optDate = z.union([z.string().datetime({ offset: true }), z.string().regex(/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/), z.literal(""), z.null()]).optional()
  .transform((v) => (v === undefined ? undefined : v ? new Date(v) : null));
const decimal = z.union([z.number(), z.string(), z.null()]).optional().transform((v, ctx) => {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 1e11) { ctx.addIssue({ code: "custom", message: "Enter a valid amount" }); return z.NEVER; }
  return n;
});
const lines = z.union([z.array(z.string().max(300)).max(20), z.string().max(6000)]).optional()
  .transform((v) => (typeof v === "string" ? v.split("\n").map((s) => s.trim()).filter(Boolean) : v));

interface Resource {
  capability: Capability;
  patch?: { schema: z.ZodType; apply: (id: string, data: never, actor: SessionUser, ip: string) => Promise<unknown> };
  create?: { schema: z.ZodType; apply: (data: never, actor: SessionUser) => Promise<unknown> };
  remove?: (id: string, actor: SessionUser) => Promise<unknown>;
}

const offeringFields = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  summary: z.string().trim().max(500).optional(),
  features: lines,
  price: decimal,
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  interval: z.enum(["ONE_TIME", "MONTHLY", "YEARLY"]).optional(),
  published: z.boolean().optional(),
  highlighted: z.boolean().optional(),
  sortOrder: z.coerce.number().int().min(0).max(1000).optional(),
});

export const RESOURCES: Record<string, Resource> = {
  users: {
    capability: "admin:users",
    patch: {
      schema: z.object({ role: z.enum(["ADMIN", "ARCHITECT", "CUSTOMER", "PARTNER"]).optional(), disabled: z.boolean().optional() }),
      apply: async (id, data: { role?: "ADMIN" | "ARCHITECT" | "CUSTOMER" | "PARTNER"; disabled?: boolean }, actor) => {
        if (id === actor.id) throw badRequest("You cannot change your own role or disable yourself.");
        const u = await db.user.update({ where: { id }, data });
        if (data.disabled) await db.session.deleteMany({ where: { userId: id } });
        return u;
      },
    },
  },
  projects: {
    capability: "admin:content",
    patch: {
      schema: z.object({
        status: z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "ARCHIVED"]).optional(),
        featured: z.boolean().optional(), featuredUntil: optDate,
        title: z.string().trim().min(2).max(100).optional(), summary: z.string().trim().max(200).optional(),
      }),
      apply: async (id, data: Prisma.ProjectUpdateInput & { status?: string }) => {
        const before = await db.project.findUnique({ where: { id }, select: { status: true, ownerId: true, title: true, slug: true } });
        if (!before) throw notFound();
        const p = await db.project.update({ where: { id }, data });
        if (before.ownerId && data.status && data.status !== before.status) {
          await notifyUser(before.ownerId, `Project ${data.status === "PUBLISHED" ? "published" : "updated"}: ${before.title}`, `Status is now ${String(data.status).toLowerCase().replace("_", " ")}.`, data.status === "PUBLISHED" ? `/projects/${before.slug}` : "/account/projects");
        }
        return p;
      },
    },
    remove: (id) => db.project.delete({ where: { id } }),
  },
  services: {
    capability: "admin:catalog",
    patch: {
      schema: z.object({
        name: z.string().trim().min(2).max(120).optional(), tagline: z.string().trim().max(200).optional(),
        description: z.string().trim().max(4000).optional(), benefits: lines, published: z.boolean().optional(),
        sortOrder: z.coerce.number().int().min(0).max(1000).optional(),
      }),
      apply: (id, data: Prisma.ServiceUpdateInput) => db.service.update({ where: { id }, data }),
    },
  },
  offerings: {
    capability: "admin:catalog",
    patch: { schema: offeringFields, apply: (id, data: Prisma.OfferingUpdateInput) => db.offering.update({ where: { id }, data }) },
    create: {
      schema: offeringFields.extend({
        slug: z.string().regex(/^[a-z0-9-]{3,60}$/, "Lowercase letters, numbers and dashes"),
        kind: z.enum(["SERVICE_PACKAGE", "VISUALIZATION_PACKAGE", "PREMIUM_FEATURE", "CONSULTATION", "ARCHITECT_SUBSCRIPTION", "PARTNERSHIP", "FEATURED_PLACEMENT", "CUSTOM_COMMISSION"]),
        name: z.string().trim().min(2).max(120),
      }),
      apply: (data: Prisma.OfferingCreateInput) => db.offering.create({ data: { ...data, summary: data.summary ?? "", features: data.features ?? [] } }),
    },
  },
  payments: {
    capability: "admin:commerce",
    patch: {
      schema: z.object({ decision: z.enum(["verify", "reject"]), reason: z.string().trim().max(500).optional() }),
      apply: (id, data: { decision: "verify" | "reject"; reason?: string }, actor, ip) => decidePayment(id, actor.id, data.decision, data.reason, ip),
    },
  },
  orders: {
    capability: "admin:commerce",
    patch: {
      schema: z.object({ status: z.enum(["CANCELLED", "REFUNDED"]), notes: z.string().trim().max(1000).optional() }),
      apply: async (id, data: { status: "CANCELLED" | "REFUNDED"; notes?: string }) => {
        const o = await db.order.findUnique({ where: { id } });
        if (!o) throw notFound();
        if (data.status === "REFUNDED" && o.status !== "PAID") throw badRequest("Only paid orders can be marked refunded.");
        if (data.status === "CANCELLED" && o.status === "PAID") throw badRequest("Paid orders must be refunded, not cancelled.");
        const updated = await db.order.update({ where: { id }, data: { status: data.status, notes: data.notes ?? o.notes } });
        if (data.status === "REFUNDED") await db.subscription.updateMany({ where: { orderId: id }, data: { status: "CANCELLED" } });
        await notifyUser(o.userId, `Order ${o.reference} ${data.status.toLowerCase()}`, data.notes ?? "", `/account/orders/${o.id}`);
        return updated;
      },
    },
  },
  consultations: {
    capability: "admin:leads",
    patch: {
      schema: z.object({ status: z.enum(["REQUESTED", "CONFIRMED", "COMPLETED", "CANCELLED"]).optional(), scheduledAt: optDate, adminNotes: z.string().trim().max(2000).optional() }),
      apply: async (id, data: { status?: string; scheduledAt?: Date | null; adminNotes?: string }) => {
        const c = await db.consultation.update({ where: { id }, data: data as Prisma.ConsultationUpdateInput });
        if (c.userId && (data.status === "CONFIRMED" || data.scheduledAt)) {
          await notifyUser(c.userId, `Consultation ${c.reference} ${c.status.toLowerCase()}`, c.scheduledAt ? `Scheduled for ${c.scheduledAt.toUTCString()}.` : "We will contact you to arrange the time.", "/account/consultations", c.email);
        }
        return c;
      },
    },
  },
  quotes: {
    capability: "admin:leads",
    patch: {
      schema: z.object({ status: z.enum(["SUBMITTED", "IN_REVIEW", "QUOTED", "ACCEPTED", "DECLINED"]).optional(), quotedAmount: decimal, quoteNotes: z.string().trim().max(4000).optional() }),
      apply: async (id, data: { status?: string; quotedAmount?: number | null; quoteNotes?: string }) => {
        if (data.status === "QUOTED" && (data.quotedAmount === undefined || data.quotedAmount === null)) {
          const existing = await db.quoteRequest.findUnique({ where: { id }, select: { quotedAmount: true } });
          if (!existing?.quotedAmount) throw badRequest("Enter the quoted amount before marking as quoted.", { quotedAmount: "Required" });
        }
        const q = await db.quoteRequest.update({ where: { id }, data: data as Prisma.QuoteRequestUpdateInput });
        if (data.status === "QUOTED" && q.userId) await notifyUser(q.userId, `Your quote ${q.reference} is ready`, `Quoted ${money(q.quotedAmount, q.currency)}.`, "/account/quotes", q.email ?? undefined);
        return q;
      },
    },
  },
  subscriptions: {
    capability: "admin:commerce",
    patch: {
      schema: z.object({ status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED"]).optional(), endsAt: optDate }),
      apply: (id, data: Prisma.SubscriptionUpdateInput) => db.subscription.update({ where: { id }, data }),
    },
  },
  reviews: {
    capability: "admin:content",
    patch: { schema: z.object({ approved: z.boolean() }), apply: (id, data: { approved: boolean }) => db.review.update({ where: { id }, data }) },
    remove: (id) => db.review.delete({ where: { id } }),
  },
  messages: {
    capability: "admin:leads",
    patch: { schema: z.object({ handled: z.boolean() }), apply: (id, data: { handled: boolean }) => db.contactMessage.update({ where: { id }, data }) },
  },
};
