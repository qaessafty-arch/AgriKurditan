// Dev helper: screenshot a page and print console errors. Usage: node scripts/shot.mjs <path> <out.png> [width] [height] [waitMs] [script]
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = require("/opt/node-tools/node_modules/playwright"); }
const [, , path = "/", out = "shot.png", w = "1440", h = "900", wait = "6000", action = ""] = process.argv;
const browser = await playwright.chromium.launch({ args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") errors.push(`[${m.type()}] ${m.text()}`); });
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
await page.addInitScript((t) => { try { localStorage.setItem("a3d-consent", "denied"); if (t) localStorage.setItem("a3d-theme", t); } catch {} }, process.env.THEME || "");
await page.goto(`http://localhost:3000${path}`, { waitUntil: "networkidle", timeout: 120000 });
if (action) await new Function("page", `return (async () => { ${action} })()`)(page);
await page.waitForTimeout(Number(wait));
await page.screenshot({ path: out });
console.log(errors.slice(0, 30).join("\n") || "no console errors");
await browser.close();
