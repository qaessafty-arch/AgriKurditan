import "server-only";
import { env } from "@/lib/env";
import { rulesBrief } from "./rules";
import { AiUnavailableError, claudeBrief, type Photo } from "./claude";
import type { BriefInput, BriefOutput } from "./schema";

export interface BriefResult {
  output: BriefOutput;
  provider: "claude" | "rules";
  model: string | null;
  notice: string | null;
}

/** Pluggable provider: Claude when configured, otherwise (or on failure) the built-in rules engine. */
export async function generateBrief(input: BriefInput, photos: Photo[]): Promise<BriefResult> {
  if (env.aiProvider === "claude") {
    try {
      const r = await claudeBrief(input, photos);
      return { output: r.output, provider: "claude", model: r.model, notice: null };
    } catch (err) {
      const reason = err instanceof AiUnavailableError ? err.message : "The AI service failed.";
      return { output: rulesBrief(input, photos.length), provider: "rules", model: null, notice: `${reason} This brief was produced by our built-in rules engine instead.` };
    }
  }
  return { output: rulesBrief(input, photos.length), provider: "rules", model: null, notice: null };
}
