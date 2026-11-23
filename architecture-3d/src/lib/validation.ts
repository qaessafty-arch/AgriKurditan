import { z } from "zod";
import { buildingConfigSchema } from "@/three/config";
import { PLAN_IDS } from "@/three/plans";

/** Shared validation primitives. Free text is trimmed and length-capped; React escapes output. */
export const text = (max: number, min = 0) => z.string().trim().min(min, min > 0 ? "Required" : undefined).max(max, `Maximum ${max} characters`);
export const optionalText = (max: number) => z.string().trim().max(max, `Maximum ${max} characters`).optional().transform((v) => (v ? v : undefined));
export const email = z.string().trim().toLowerCase().max(200).pipe(z.email("Enter a valid email address"));
export const phone = z.string().trim().max(32).regex(/^[+\d\s()-]*$/, "Use digits, spaces and + only").optional().transform((v) => (v ? v : undefined));
export const password = z.string().min(10, "Use at least 10 characters").max(200)
  .refine((v) => /[a-zA-Z]/.test(v) && /\d/.test(v), "Use letters and at least one number");
export const id = z.string().regex(/^[a-z0-9]{20,40}$/i, "Invalid id");

export const designInput = z.object({
  name: text(80, 1),
  presetId: z.enum(PLAN_IDS),
  config: buildingConfigSchema,
  thumbnail: z.string().max(1_400_000).optional(),
});
