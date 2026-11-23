import "server-only";
import { z } from "zod";
import { cache } from "react";
import { db } from "@/lib/db";

/**
 * Administrator-managed business settings. Defaults are intentionally empty: features that depend
 * on them (WhatsApp button, bank transfer instructions) stay hidden until an admin fills them in.
 */
export const settingSchemas = {
  business: z.object({
    companyName: z.string().max(120).default("Architecture 3D"),
    email: z.union([z.email().max(200), z.literal("")]).default(""),
    phone: z.string().max(40).default(""),
    whatsapp: z.string().regex(/^\d{0,15}$/, "Digits only, international format without +").default(""),
    address: z.string().max(300).default(""),
    hours: z.string().max(200).default(""),
  }),
  payments: z.object({
    currency: z.string().regex(/^[A-Z]{3}$/).default("USD"),
    bankTransferEnabled: z.boolean().default(false),
    bankName: z.string().max(120).default(""),
    accountName: z.string().max(120).default(""),
    accountNumber: z.string().max(60).default(""),
    iban: z.string().max(60).default(""),
    swift: z.string().max(20).default(""),
    instructions: z.string().max(2000).default(""),
    cashEnabled: z.boolean().default(false),
    cashInstructions: z.string().max(1000).default(""),
  }),
  studio: z.object({
    freeDesignLimit: z.number().int().min(0).max(1000).default(3),
  }),
} as const;

export type SettingKey = keyof typeof settingSchemas;
export type Settings<K extends SettingKey> = z.infer<(typeof settingSchemas)[K]>;

export const getSetting = cache(async <K extends SettingKey>(key: K): Promise<Settings<K>> => {
  const row = await db.setting.findUnique({ where: { key } }).catch(() => null);
  const parsed = settingSchemas[key].safeParse(row?.value ?? {});
  return (parsed.success ? parsed.data : settingSchemas[key].parse({})) as Settings<K>;
});

export async function saveSetting<K extends SettingKey>(key: K, value: unknown): Promise<Settings<K>> {
  const data = settingSchemas[key].parse(value) as Settings<K>;
  await db.setting.upsert({ where: { key }, create: { key, value: data }, update: { value: data } });
  return data;
}

export function whatsappLink(number: string, text: string): string | null {
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}
