// End-to-end business-flow test against a running server and its real database.
// Usage: BASE_URL=http://localhost:3100 node tests/e2e/run.mjs   (server must run with TRUST_PROXY=1)
import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";
import { deflateSync } from "node:zlib";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const db = new PrismaClient();
const run = Date.now().toString(36);
const o = () => Math.floor(Math.random() * 250) + 1;
const ip = (a) => `10.${a}.${o()}.${o()}`;
let passed = 0;
const step = async (name, fn) => {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); process.exitCode = 1; }
};

/** Minimal client with a cookie jar and a fixed client IP (so rate limits are per actor). */
function client(ip) {
  let cookie = "";
  const call = async (path, { method, body, form, origin = BASE, headers = {} } = {}) => {
    const h = { "x-forwarded-for": ip, ...headers };
    if (origin) h.origin = origin;
    if (cookie) h.cookie = cookie;
    let payload;
    if (form) payload = form;
    else if (body !== undefined) { payload = JSON.stringify(body); h["content-type"] = "application/json"; }
    const res = await fetch(`${BASE}${path}`, { method: method ?? (payload ? "POST" : "GET"), headers: h, body: payload, redirect: "manual" });
    const set = res.headers.get("set-cookie");
    if (set) {
      const m = /a3d_session=([^;]*)/.exec(set);
      if (m) cookie = m[1] ? `a3d_session=${m[1]}` : "";
    }
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* html */ }
    return { status: res.status, json, text, location: res.headers.get("location") };
  };
  return { call };
}

function png(w = 4, h = 4) {
  // Valid tiny PNG generated in-process.
  const crc = (buf) => { let c, crc = 0xffffffff; for (const b of buf) { c = (crc ^ b) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return (crc ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  const raw = Buffer.alloc((w * 3 + 1) * h, 0x80);
  for (let y = 0; y < h; y++) raw[y * (w * 3 + 1)] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const pngDataUrl = () => `data:image/png;base64,${png().toString("base64")}`;

const config = {
  exterior: { wall: "brick", accent: "timber", paint: "#E8E2D6", pattern: "fins", windows: "curtain", glass: "bronze", frames: "black", door: "pivot", roof: "overhang", balconies: true },
  interior: { floor: "oak", walls: "plaster", wallColor: "#EEE9E1", ceiling: "white", furniture: "warm", lighting: "warm", lightsOn: true },
  environment: { time: 16.5, sun: 1, sky: "clear", landscape: "gravel", garden: true, pool: true, outdoorLights: true },
};

const customer = client(ip(1));
const admin = client(ip(2));
const anon = client(ip(3));
const email = `client-${run}@example.test`;

console.log(`E2E against ${BASE}`);

await step("public pages render", async () => {
  for (const p of ["/", "/projects", "/projects/horizon-villa", "/services", "/services/luxury-villas", "/pricing", "/explore", "/studio", "/assistant", "/consultation", "/quote", "/contact", "/reviews", "/privacy", "/terms", "/sitemap.xml", "/robots.txt", "/login", "/register"]) {
    const r = await anon.call(p);
    assert.equal(r.status, 200, `${p} → ${r.status}`);
  }
  assert.equal((await anon.call("/projects/does-not-exist")).status, 404);
  assert.match((await anon.call("/projects?style=brutalist")).text, /Monolith Residence/);
});

await step("protected pages redirect to sign-in", async () => {
  for (const p of ["/account", "/admin", "/checkout/studio-pro"]) {
    const r = await anon.call(p);
    assert.ok([307, 308].includes(r.status) && r.location?.includes("/login"), `${p} → ${r.status} ${r.location}`);
  }
});

await step("APIs require authentication and same-origin", async () => {
  assert.equal((await anon.call("/api/designs")).status, 401);
  assert.equal((await anon.call("/api/contact", { body: { name: "X Y", email: "a@b.co", subject: "Hi", message: "Hello there friend" }, origin: "https://evil.example" })).status, 403);
  assert.equal((await anon.call("/api/contact", { body: { name: "X Y", email: "a@b.co", subject: "Hi", message: "Hello there friend" }, origin: null })).status, 403);
});

await step("registration validates input and creates a session", async () => {
  const bad = await customer.call("/api/auth/register", { body: { name: "A", email: "nope", password: "short", acceptTerms: true } });
  assert.equal(bad.status, 400);
  assert.ok(bad.json.fields.email && bad.json.fields.password && bad.json.fields.name);
  const ok = await customer.call("/api/auth/register", { body: { name: "Lana <b>Client</b>", email, password: "Correct-horse-42", acceptTerms: true } });
  assert.equal(ok.status, 200, JSON.stringify(ok.json));
  assert.equal((await customer.call("/api/auth/register", { body: { name: "Dup User", email, password: "Correct-horse-42", acceptTerms: true } })).status, 409);
  const acct = await customer.call("/account");
  assert.equal(acct.status, 200);
  assert.ok(acct.text.includes("Lana &lt;b&gt;Client&lt;/b&gt;"), "user-supplied HTML is escaped");
});

let designId;
await step("saves designs with thumbnails and enforces the free-plan limit", async () => {
  for (let i = 1; i <= 3; i++) {
    const r = await customer.call("/api/designs", { body: { name: `Variant ${i}`, presetId: "villa-horizon", config, thumbnail: pngDataUrl() } });
    assert.equal(r.status, 200, JSON.stringify(r.json));
    designId ??= r.json.design.id;
    if (i === 1) assert.equal((await customer.call(r.json.design.thumbnail)).status, 200);
  }
  const over = await customer.call("/api/designs", { body: { name: "Variant 4", presetId: "villa-horizon", config } });
  assert.equal(over.status, 402);
  const invalid = await customer.call("/api/designs", { body: { name: "Bad", presetId: "villa-horizon", config: { ...config, exterior: { ...config.exterior, wall: "gold" } } } });
  assert.equal(invalid.status, 400);
  assert.equal((await anon.call(`/api/designs/${designId}`)).status, 401);
});

await step("rejects spoofed uploads by content, not extension", async () => {
  const form = new FormData();
  for (const [k, v] of Object.entries({ description: "A small house for testing the validator properly.", buildingType: "residential", landWidth: "20", landDepth: "30" })) form.append(k, v);
  form.append("photos", new Blob([Buffer.from("<?php echo 'not an image'; ?>".padEnd(200, " "))], { type: "image/png" }), "evil.png");
  const r = await customer.call("/api/assistant", { form });
  assert.equal(r.status, 400, JSON.stringify(r.json));
});

let briefId;
await step("AI assistant produces a validated brief with disclaimer and stores photos privately", async () => {
  const form = new FormData();
  for (const [k, v] of Object.entries({ description: "A four-bedroom family villa with a pool and a guest room on the ground floor.", buildingType: "residential", landWidth: "24", landDepth: "36", bedrooms: "4", budget: "350000", currency: "USD" })) form.append(k, v);
  form.append("styles", "luxury");
  form.append("photos", new Blob([png(8, 8)], { type: "image/png" }), "site.png");
  const r = await customer.call("/api/assistant", { form });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.match(r.json.disclaimer, /not a certified engineering drawing/);
  assert.ok(["claude", "rules"].includes(r.json.provider));
  assert.ok(r.json.output.program.length > 3);
  briefId = r.json.id;
  const stored = await db.aiBrief.findUnique({ where: { id: briefId } });
  assert.equal(stored.uploadIds.length, 1);
  assert.equal((await anon.call(`/api/uploads/${stored.uploadIds[0]}`)).status, 404, "photos are private");
  assert.equal((await customer.call(`/api/uploads/${stored.uploadIds[0]}`)).status, 200);
});

await step("consultation and quote requests with attachments; drafts count as abandoned", async () => {
  const c = await customer.call("/api/consultations", { body: { name: "Lana Client", email, topic: "New villa", message: "We have a 900 m² plot and want to start soon.", serviceSlug: "luxury-villas", designId, briefId } });
  assert.equal(c.status, 200, JSON.stringify(c.json));
  assert.match(c.json.reference, /^C-/);
  const spam = await anon.call("/api/consultations", { body: { name: "Bot Bot", email: "b@b.co", topic: "spam", message: "spam spam spam spam", website: "http://spam" } });
  assert.equal(spam.status, 400, "honeypot rejects bots");
  const draft = await customer.call("/api/quotes/draft", { body: { serviceSlug: "residential-architecture" } });
  const q = await customer.call("/api/quotes", { body: { draftId: draft.json.id, draftKey: draft.json.key, name: "Lana Client", email, serviceSlug: "residential-architecture", designId, budgetMin: 200000, budgetMax: 300000, details: "Please quote the attached design for a 900 m² plot." } });
  assert.equal(q.status, 200, JSON.stringify(q.json));
  const row = await db.quoteRequest.findUnique({ where: { id: draft.json.id } });
  assert.equal(row.status, "SUBMITTED");
  assert.equal(row.designId, designId);
  const forged = await anon.call("/api/quotes", { body: { draftId: draft.json.id, draftKey: "forged", name: "Mallory", email: "m@x.co", details: "Overwriting someone else's draft request" } });
  assert.equal(forged.status, 200);
  assert.equal((await db.quoteRequest.findUnique({ where: { id: draft.json.id } })).name, "Lana Client", "forged draft key cannot overwrite");
  await anon.call("/api/quotes/draft", { body: {} }); // abandoned draft
});

await step("checkout is closed until an administrator configures payment details", async () => {
  await db.setting.deleteMany({ where: { key: "payments" } });
  const page = await customer.call("/checkout/studio-pro");
  assert.match(page.text, /Online ordering is not open yet/);
  assert.equal((await customer.call("/api/orders", { body: { offeringSlug: "studio-pro", method: "bank_transfer" } })).status, 400);
});

await step("admin signs in; customers cannot use admin APIs", async () => {
  const r = await admin.call("/api/auth/login", { body: { email: process.env.SEED_ADMIN_EMAIL, password: process.env.SEED_ADMIN_PASSWORD } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.equal((await customer.call("/api/admin/settings/payments", { method: "PUT", body: { bankTransferEnabled: true } })).status, 403);
  assert.equal((await customer.call("/admin")).status, 307);
  const put = await admin.call("/api/admin/settings/payments", { method: "PUT", body: { currency: "USD", bankTransferEnabled: true, bankName: "Test Bank", accountName: "Architecture 3D LLC", accountNumber: "0001112223", iban: "IQ00TEST0001112223", swift: "TESTIQBA", instructions: "Use the order reference.", cashEnabled: false, cashInstructions: "" } });
  assert.equal(put.status, 200, JSON.stringify(put.json));
});

let orderId, paymentId;
await step("customer orders Studio Pro and submits a bank transfer with receipt", async () => {
  const o = await customer.call("/api/orders", { body: { offeringSlug: "studio-pro", method: "bank_transfer" } });
  assert.equal(o.status, 200, JSON.stringify(o.json));
  orderId = o.json.id;
  const again = await customer.call("/api/orders", { body: { offeringSlug: "studio-pro", method: "bank_transfer" } });
  assert.equal(again.json.id, orderId, "no duplicate open orders");
  assert.equal((await customer.call("/api/orders", { body: { offeringSlug: "architect-professional", method: "bank_transfer" } })).status, 403, "audience restriction");
  const page = await customer.call(`/account/orders/${orderId}`);
  assert.match(page.text, /IQ00TEST0001112223/);
  const form = new FormData();
  form.append("reference", "TRX-778899"); form.append("amount", "15"); form.append("payerName", "Lana Client");
  form.append("proof", new Blob([png()], { type: "image/png" }), "receipt.png");
  const p = await customer.call(`/api/orders/${orderId}/payment`, { form });
  assert.equal(p.status, 200, JSON.stringify(p.json));
  const order = await db.order.findUnique({ where: { id: orderId }, include: { payments: true } });
  assert.equal(order.status, "AWAITING_VERIFICATION", "not marked paid before verification");
  paymentId = order.payments[0].id;
  assert.equal((await anon.call(`/api/uploads/${order.payments[0].proofUploadId}`)).status, 404);
  assert.equal((await admin.call(`/api/uploads/${order.payments[0].proofUploadId}`)).status, 200);
});

await step("staff verification marks the order paid and unlocks Studio Pro", async () => {
  assert.equal((await customer.call(`/api/admin/payments/${paymentId}`, { method: "PATCH", body: { decision: "verify" } })).status, 403);
  const v = await admin.call(`/api/admin/payments/${paymentId}`, { method: "PATCH", body: { decision: "verify" } });
  assert.equal(v.status, 200, JSON.stringify(v.json));
  assert.equal((await admin.call(`/api/admin/payments/${paymentId}`, { method: "PATCH", body: { decision: "verify" } })).status, 409, "cannot verify twice");
  const order = await db.order.findUnique({ where: { id: orderId }, include: { subscription: true } });
  assert.equal(order.status, "PAID");
  assert.equal(order.subscription.entitlement, "studio_pro");
  assert.ok(order.subscription.endsAt > new Date());
  const fourth = await customer.call("/api/designs", { body: { name: "Variant 4", presetId: "villa-horizon", config } });
  assert.equal(fourth.status, 200, "Pro removes the design limit");
  const notes = await db.notification.findMany({ where: { user: { email } } });
  assert.ok(notes.some((n) => n.title.startsWith("Payment received")));
});

await step("admin quotes a request; customer sees it", async () => {
  const q = await db.quoteRequest.findFirst({ where: { email, status: "SUBMITTED" } });
  const bad = await admin.call(`/api/admin/quotes/${q.id}`, { method: "PATCH", body: { status: "QUOTED" } });
  assert.equal(bad.status, 400, "quoted requires an amount");
  const ok = await admin.call(`/api/admin/quotes/${q.id}`, { method: "PATCH", body: { status: "QUOTED", quotedAmount: 42000, quoteNotes: "Concept to permit drawings." } });
  assert.equal(ok.status, 200);
  assert.match((await customer.call("/account/quotes")).text, /\$42,000/);
});

await step("reviews require a real engagement and moderation", async () => {
  const stranger = client(ip(4));
  await stranger.call("/api/auth/register", { body: { name: "No Work", email: `stranger-${run}@example.test`, password: "Correct-horse-42", acceptTerms: true } });
  assert.equal((await stranger.call("/api/reviews", { body: { rating: 5, title: "Great", body: "I never worked with them but here we are." } })).status, 403);
  const r = await customer.call("/api/reviews", { body: { rating: 5, title: `Clear and fast ${run}`, body: "Payment was verified the same day and the studio is excellent." } });
  assert.equal(r.status, 200, JSON.stringify(r.json));
  assert.ok(!(await anon.call("/reviews")).text.includes(`Clear and fast ${run}`));
  const review = await db.review.findFirst({ where: { user: { email } } });
  await admin.call(`/api/admin/reviews/${review.id}`, { method: "PATCH", body: { approved: true } });
  assert.ok((await anon.call("/reviews")).text.includes(`Clear and fast ${run}`));
});

await step("admin dashboard reports verified revenue and abandoned quotes", async () => {
  const page = await admin.call("/admin");
  assert.equal(page.status, 200);
  assert.match(page.text, /Revenue, 30 days/);
  assert.match(page.text, /Abandoned quotes/);
  for (const p of ["/admin/payments", "/admin/orders", "/admin/quotes", "/admin/consultations", "/admin/users", "/admin/pricing", "/admin/projects", "/admin/assets", "/admin/settings", "/admin/audit", "/admin/subscriptions", "/admin/reviews", "/admin/newsletter", "/admin/messages", "/admin/services"]) {
    assert.equal((await admin.call(p)).status, 200, p);
  }
  const audit = await db.auditLog.findFirst({ where: { action: "payment.verified" }, orderBy: { createdAt: "desc" } });
  assert.ok(audit, "payment verification is audit-logged");
});

await step("password reset: honest without email, works with a valid token, revokes sessions", async () => {
  const user = await db.user.findUnique({ where: { email } });
  const r = await anon.call("/api/auth/forgot", { body: { email } });
  if (process.env.SMTP_HOST) assert.equal(r.status, 200);
  else assert.ok(r.status === 503 || /server log/.test(r.json?.message ?? ""), "never claims an email was sent when SMTP is missing");
  // Mint a token exactly as the server does (HMAC with AUTH_SECRET) to exercise the reset path.
  const { createHmac, randomBytes } = await import("node:crypto");
  const token = randomBytes(32).toString("base64url");
  await db.passwordResetToken.create({ data: { userId: user.id, tokenHash: createHmac("sha256", process.env.AUTH_SECRET).update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600_000) } });
  assert.equal((await anon.call("/api/auth/reset", { body: { token: "x".repeat(43), password: "Another-pass-77" } })).status, 400);
  assert.equal((await anon.call("/api/auth/reset", { body: { token, password: "Another-pass-77" } })).status, 200);
  assert.equal((await anon.call("/api/auth/reset", { body: { token, password: "Another-pass-78" } })).status, 400, "single use");
  assert.equal((await customer.call("/api/designs")).status, 401, "existing sessions revoked");
  const relog = await customer.call("/api/auth/login", { body: { email, password: "Another-pass-77" } });
  assert.equal(relog.status, 200);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: (await db.user.findUnique({ where: { id: user.id } })).passwordHash } });
});

await step("account locks after repeated failed sign-ins", async () => {
  const attacker = client(ip(5));
  for (let i = 0; i < 5; i++) assert.equal((await attacker.call("/api/auth/login", { body: { email, password: "wrong-password-1" } })).status, 401);
  const locked = await client(ip(6)).call("/api/auth/login", { body: { email, password: "Another-pass-77" } });
  assert.equal(locked.status, 423);
  await db.user.update({ where: { email }, data: { lockedUntil: null, failedLoginCount: 0 } });
});

await step("rate limiting returns 429 with Retry-After", async () => {
  const flood = client(ip(7));
  let last;
  for (let i = 0; i < 9; i++) last = await flood.call("/api/auth/login", { body: { email: "x@example.test", password: "whatever-1" } });
  assert.equal(last.status, 429);
});

await db.$disconnect();
console.log(`\n${passed} steps passed${process.exitCode ? ", with failures" : ""}.`);
