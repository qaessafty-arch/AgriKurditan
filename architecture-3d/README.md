# Architecture 3D

An immersive architectural visualization and commercial platform. Visitors scroll through a cinematic 3D presentation, explore buildings in real time, customise materials and light in a design studio, get an AI-assisted preliminary brief, and turn that into consultations, quotes and paid orders. Administrators run the business from a role-based dashboard.

> 3D models, studio summaries and AI briefs are design studies. They are never presented as certified engineering drawings, and nothing in the product claims structural or regulatory compliance.

## What is in the box

| Area | What it does |
|---|---|
| **Cinematic landing** (`/`) | Eight-scene GSAP ScrollTrigger timeline: reveal, exterior, facade cutaway, exploded floors, walk-in interior, live material swaps, full day/night cycle, call to action. Reduced-motion and portrait variants. |
| **3D engine** (`src/three`) | Procedural, parametric buildings: real wall openings, stairs with slab voids, partitions with doorways, furniture, facade fins/louvres/frames, roofs, balconies, pool and landscape. Five building types. Procedural PBR textures with world-space UVs; per-floor merged geometry (one draw call per material per floor). |
| **Explorer** (`/explore`) | Orbit/zoom/pan, seven camera presets, floor isolation, section cut, exploded view, facade cutaway, room selection with areas, material inspection, measuring, time-of-day lighting, full screen, quality tiers. |
| **Design studio** (`/studio`) | 24 exterior, interior and environment options that rebuild the real scene. Undo/redo (Ctrl+Z / Ctrl+Shift+Z), snapshots, side-by-side compare with differences, saved designs, PNG export (4K for Studio Pro), printable summary, quote with attached design. Local draft recovery. |
| **AI assistant** (`/assistant`) | Description, land dimensions, budget, style preferences and up to four land photos produce a preliminary brief: programme, massing, materials, site observations, budget ratio, and a starting design that opens in the studio. Claude (with vision) when configured; otherwise a transparent built-in rules engine. Always labelled preliminary. |
| **Commerce** | Admin-managed offerings for all eight revenue streams. Orders snapshot prices. Manual bank transfer and cash workflow for markets without a verified gateway (Iraq): customer submits reference and receipt, staff verify, and only then is the order paid and the plan activated. |
| **Accounts** | Registration (client, architect or partner), sign-in with lockout, password reset, profile, saved designs, consultations, quotes, orders, notifications, subscriptions, architect project submissions. |
| **Admin** (`/admin`) | Analytics (verified revenue, conversion, new customers, inquiries, abandoned quotes, popular services, most-viewed projects), consultations, quotes, messages, orders, payment verification, subscriptions, users and roles, projects and featuring, 3D assets, services, pricing, reviews, newsletter export, settings, audit log. |
| **Languages** | English, Arabic (`/ar`) and Kurdish Sorani (`/ckb`), with full right-to-left layout. See [Languages](#languages). |
| **Marketing** | Services, filterable portfolio with case studies and lazy-loaded 3D, pricing, consultation/quote/contact forms, WhatsApp button, newsletter double opt-in, moderated reviews, consent-gated first-party analytics, metadata, JSON-LD, sitemap, robots, generated Open Graph image. |

## Stack

Next.js 15 (App Router) · React 19 · TypeScript (strict) · three.js 0.180 · React Three Fiber 9 · Drei 10 · @react-three/postprocessing · GSAP ScrollTrigger · Framer Motion · Tailwind CSS 3 · Zustand · PostgreSQL · Prisma 6 · Zod 4 · Anthropic SDK · Vitest · Playwright.

## Getting started

Requirements: Node.js 22, PostgreSQL 14 or later.

```bash
cd architecture-3d
npm install
cp .env.example .env           # then fill in DATABASE_URL, AUTH_SECRET, SEED_ADMIN_*
npx prisma migrate deploy      # create the schema
npm run db:seed                # services, offerings, portfolio, first admin
npm run dev                    # http://localhost:3000
```

Sign in with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` and go to **Admin → Settings** to enter business details, payment details and the WhatsApp number.

### Before launch

1. **Prices.** Seeded prices are starting values. Set your own in **Admin → Pricing**.
2. **Payments.** Bank transfer or cash stays unavailable until real details are entered in **Admin → Settings → Payments**. Checkout then shows them with the order reference.
3. **Email.** Set `SMTP_*`, `EMAIL_FROM` and `ADMIN_NOTIFY_EMAIL`. Without SMTP the platform says so instead of pretending: password reset returns "not available" in production, and forms show the reference to note down.
4. **AI.** Set `AI_PROVIDER=claude` and `ANTHROPIC_API_KEY` to use Claude (model `ANTHROPIC_MODEL`, default `claude-opus-5-5`). The key is server-side only.
5. **Storage.** For multi-instance or serverless hosting, set `STORAGE_DRIVER=s3` with an S3-compatible bucket (AWS S3, Cloudflare R2, MinIO).
6. **Legal.** Have the privacy policy and terms reviewed for your jurisdiction.
7. **Cover images.** With the server running: `node scripts/render-covers.mjs` renders portfolio covers and gallery views from the real 3D models into `public/renders/`.

## Languages

| Locale | URL prefix | Direction | Font |
|---|---|---|---|
| English | none | LTR | Manrope / Cormorant Garamond |
| Arabic (`ar`) | `/ar` | RTL | Noto Kufi Arabic / Noto Naskh Arabic |
| Kurdish, Sorani (`ckb`) | `/ckb` | RTL | Noto Kufi Arabic / Noto Naskh Arabic |

- **Routing.** Middleware reads the prefix, sets `<html lang dir>` and remembers the choice in the `a3d-locale` cookie. A first visit with no cookie follows `Accept-Language` (`ku` maps to Sorani). Every page carries canonical and `hreflang` alternates. `/admin` is staff-only and stays English.
- **Text.** `src/i18n/messages/en.ts` is the source catalogue and defines the type. A key missing from `ar.ts` or `ckb.ts` fails the typecheck. Server components use `getI18n()`; client components use `useI18n()` and the locale-aware `Link`.
- **Database content.** Services, offerings and projects have a `translations` JSON column (`{ "ar": { "name": … }, "ckb": { … } }`), filled by the seed. The English field is the fallback. Prices are never translated or overwritten.
- **Numbers, prices and dates** use Eastern Arabic digits in both RTL languages. Browsers ship no Sorani locale data, so Sorani formats numbers through `ar-IQ` and builds dates from Sorani month names. This keeps server and browser output identical.
- **Server text.** API errors, notifications and transactional emails follow the request language, or the user's saved language (`User.locale`, set at registration and in the profile). AI briefs are written in the visitor's language: the rules engine has its own text per language, and Claude is instructed to answer in it.
- **Layout** uses logical properties (`ms-`, `pe-`, `start-`) and `rtl:` variants. Codes, emails and references stay left-to-right.

> **Before launch:** the Arabic and Sorani text was written for this build and has not been reviewed by native speakers. Have both reviewed, especially the legal pages (privacy, terms), payment instructions and the AI disclaimer. Kurmanji (Latin script) is not included.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Develop, build, serve |
| `npm run typecheck` · `npx eslint .` | Static checks |
| `npm test` | Unit tests (generator, timeline, undo/redo, commerce, permissions, rate limiting, AI rules) |
| `BASE_URL=… node tests/e2e/run.mjs` | End-to-end business flow against a running server (start it with `TRUST_PROXY=1`) |
| `node scripts/contrast.mjs` | WCAG contrast audit of the design tokens (both themes) |
| `node scripts/render-covers.mjs [slug…]` | Render project covers from the 3D models |
| `node scripts/shot.mjs <path> <out.png>` | Screenshot a page in headless Chromium (development aid) |

## Security

- Sessions: random 256-bit tokens in an `httpOnly`, `SameSite=Lax`, `Secure` (production) cookie. Only an HMAC of the token is stored; sessions are revocable and revoked on password change or reset.
- Passwords: bcrypt (cost 12). Account lockout after 5 failures; constant-time behaviour for unknown emails.
- Authorization: capability map (`src/lib/auth/permissions.ts`) checked by every page and route.
- CSRF: same-origin check on every state-changing request, plus SameSite cookies.
- Validation: Zod on every input, body-size caps, honeypots on public forms.
- Uploads: type detected from file bytes (magic numbers), size limits, random keys, private by default, served through an authorization check with a sandboxing CSP.
- Headers: CSP, HSTS (production), `X-Frame-Options: DENY`, `nosniff`, Referrer-Policy, Permissions-Policy.
- Rate limiting: per-IP sliding window per endpoint group. It is in-memory, so use a shared store such as Redis when running more than one instance, and set `TRUST_PROXY=1` behind a trusted proxy.
- Payments are only marked paid by an authorised staff decision, never by a client-side event. Every verification is audit-logged.
- Known advisory: the Prisma 6 CLI (`prisma` dev dependency) pulls `effect`/`deepmerge-ts` versions with advisories in its config loader. The runtime client is unaffected; upgrade to Prisma 7 when convenient.

## Project layout

```
prisma/            schema, migrations, seed
src/three/         building config, plans, geometry generator, textures, materials, lighting (pure, testable)
src/components/    three/ (scene), cinematic/, explorer/, studio/, assistant/, admin/, account/, forms/, ui/
src/lib/           auth, api wrapper, security, storage, payments, ai, analytics, settings, email
src/app/           pages and API routes (App Router)
scripts/           contrast audit, cover renderer, screenshot helper
tests/unit         Vitest   ·   tests/e2e   end-to-end flow
docs/              architecture notes and roadmap
```

See `docs/ARCHITECTURE.md` and `docs/ROADMAP.md`.
