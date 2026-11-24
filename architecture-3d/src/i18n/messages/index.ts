import type { Locale } from "../config";
import en, { type Messages } from "./en";
import ar from "./ar";
import ckb from "./ckb";

export const MESSAGES: Record<Locale, Messages> = { en, ar, ckb };
export type { Messages };

export function getMessages(locale: Locale): Messages {
  return MESSAGES[locale] ?? en;
}
