import { describe, expect, it } from "vitest";
import { fmt, localePath, negotiate, splitLocale } from "@/i18n/config";

describe("locale routing helpers", () => {
  it("prefixes internal pages only", () => {
    expect(localePath("/projects", "ar")).toBe("/ar/projects");
    expect(localePath("/", "ckb")).toBe("/ckb");
    expect(localePath("/projects", "en")).toBe("/projects");
    expect(localePath("/api/designs", "ar")).toBe("/api/designs");
    expect(localePath("/renders/x.jpg", "ar")).toBe("/renders/x.jpg");
    expect(localePath("https://wa.me/1", "ar")).toBe("https://wa.me/1");
    expect(localePath("/ar/projects", "ar")).toBe("/ar/projects");
  });
  it("splits prefixes", () => {
    expect(splitLocale("/ckb/studio")).toEqual({ locale: "ckb", path: "/studio" });
    expect(splitLocale("/ar")).toEqual({ locale: "ar", path: "/" });
    expect(splitLocale("/archive")).toEqual({ locale: null, path: "/archive" });
  });
  it("negotiates Accept-Language, treating ku as Sorani", () => {
    expect(negotiate("ar-IQ,ar;q=0.9,en;q=0.8")).toBe("ar");
    expect(negotiate("ku-IQ,en;q=0.5")).toBe("ckb");
    expect(negotiate("ckb")).toBe("ckb");
    expect(negotiate("fr-FR")).toBe("en");
    expect(negotiate(null)).toBe("en");
  });
  it("interpolates placeholders", () => {
    expect(fmt("{n} rooms in {city}", { n: 3, city: "Erbil" })).toBe("3 rooms in Erbil");
  });
});

import { translateMessage } from "@/i18n/errors";
describe("server message translation", () => {
  it("translates exact messages and messages with numbers", () => {
    expect(translateMessage("ar", "Email or password is incorrect.")).toBe("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
    expect(translateMessage("ckb", "Your plan includes 3 saved designs. Delete one, or upgrade to Studio Pro for unlimited designs.")).toContain("3");
    expect(translateMessage("ar", "Maximum 80 characters")).toBe("80 حرفًا كحد أقصى");
  });
  it("leaves English alone and falls back for unknown messages", () => {
    expect(translateMessage("en", "Anything")).toBe("Anything");
    expect(translateMessage("ar", "Too small: expected string", "يرجى مراجعة هذا الحقل.")).toBe("يرجى مراجعة هذا الحقل.");
  });
});
