// Renders project cover and gallery images from the live 3D models.
// Usage: (dev or prod server running on BASE_URL) [VIEWS=hero,interior,rear,night] [SKIP_EXISTING=1] node scripts/render-covers.mjs [slug ...]
// Output: public/renders/<slug>.jpg (cover), <slug>-interior.jpg, <slug>-aerial.jpg, <slug>-night.jpg
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = require("/opt/node-tools/node_modules/playwright"); }

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const db = new PrismaClient();
const only = process.argv.slice(2);
const projects = (await db.project.findMany({ where: { status: "PUBLISHED" }, select: { slug: true } })).filter((p) => !only.length || only.includes(p.slug));
await db.$disconnect();
await mkdir("public/renders", { recursive: true });

const browser = await playwright.chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const ALL_VIEWS = [["hero", ""], ["interior", "-interior"], ["rear", "-garden"], ["night", "-night"]];
// VIEWS=hero,night limits which views are rendered; SKIP_EXISTING=1 keeps files already rendered.
const wanted = process.env.VIEWS?.split(",");
const views = wanted ? ALL_VIEWS.filter(([v]) => wanted.includes(v)) : ALL_VIEWS;
for (const { slug } of projects) {
  for (const [view, suffix] of views) {
    if (process.env.SKIP_EXISTING && existsSync(`public/renders/${slug}${suffix}.jpg`)) continue;
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    await page.addInitScript(() => { localStorage.setItem("a3d-consent", "denied"); localStorage.setItem("a3d-theme", "dark"); });
    await page.goto(`${BASE}/render/${slug}?view=${view}`, { waitUntil: "networkidle", timeout: 180000 });
    await page.waitForFunction(() => window.__renderReady === true, null, { timeout: 300000 });
    const data = await page.evaluate(() => window.__renderData);
    await writeFile(`public/renders/${slug}${suffix}.jpg`, Buffer.from(data.split(",")[1], "base64"));
    console.log(`rendered ${slug}${suffix}`);
    await page.close();
  }
}
await browser.close();
