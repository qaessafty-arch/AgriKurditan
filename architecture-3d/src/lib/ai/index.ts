import "server-only";
import { env } from "@/lib/env";
import { rulesBrief } from "./rules";
import { AiUnavailableError, claudeBrief, type Photo } from "./claude";
import type { BriefInput, BriefOutput } from "./schema";
import { RULES_TEXT } from "./rules-text";
import type { Locale } from "@/i18n/config";

export interface BriefResult {
  output: BriefOutput;
  provider: "claude" | "rules";
  model: string | null;
  notice: string | null;
}

/** Pluggable provider: Claude when configured, otherwise (or on failure) the built-in rules engine. */
export async function generateBrief(input: BriefInput, photos: Photo[], locale: Locale = "en"): Promise<BriefResult> {
  if (env.aiProvider === "claude") {
    try {
      const r = await claudeBrief(input, photos, locale);
      return { output: r.output, provider: "claude", model: r.model, notice: null };
    } catch (err) {
      console.warn("[ai] falling back to rules engine:", err instanceof AiUnavailableError ? err.message : err);
      return { output: rulesBrief(input, photos.length, locale), provider: "rules", model: null, notice: RULES_TEXT[locale].fallbackNotice };
    }
  }
  return { output: rulesBrief(input, photos.length, locale), provider: "rules", model: null, notice: null };
}
