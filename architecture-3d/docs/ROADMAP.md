# Roadmap and status

Status as of this build. "Done" means implemented, wired to the database or scene, and covered by unit tests, the end-to-end flow, or a rendered visual check.

| Phase | Status | Notes |
|---|---|---|
| 1 Research and architecture | Done | Stack and data model chosen. Separate app folder so the existing AgriKurdistan code is untouched. |
| 2 Design system | Done | Tokens for dark and light themes; all 38 text/background pairs pass WCAG AA (`scripts/contrast.mjs`). Chart marks validated separately. |
| 3 Cinematic landing | Done | 8 scenes, reduced-motion and portrait variants, chapter navigation. |
| 4 3D engine | Done | Procedural parametric buildings, 5 types, PBR procedural textures, LOD by distance and tier. |
| 5 Scroll animation | Done | Single GSAP ScrollTrigger; pure, tested timeline. |
| 6 Customization studio | Done | 24 options, undo/redo, snapshots, compare, export, summary, saved designs. |
| 7 Backend and database | Done | PostgreSQL + Prisma, sessions, validation, uploads, audit. |
| 8 AI assistant | Done | Claude provider (structured output, vision, refusal fallback) and rules engine. Claude path typechecks against the SDK but was not exercised live here (no API key in the build environment). |
| 9 Commerce | Done | 8 offering types, manual bank and cash verification workflow, entitlements, renewals, refunds. |
| 10 Dashboards | Done | Account area; admin with analytics and all modules. |
| 11 Testing and optimisation | Done | Unit tests, end-to-end business flow (18 steps), lint, typecheck, production build, rendered checks of scenes and pages. |
| 12b Languages | Done | English, Arabic and Kurdish (Sorani) with RTL layout across public pages, account, checkout, studio, explorer, assistant, emails and notifications. Native-speaker review still needed. Admin is English only. |
| 12 Deployment and docs | Partly | README, architecture notes. Hosting not yet chosen (see below). |

## Known limitations and risks

- **Rate limiting is per instance** (in memory). For horizontal scaling, back it with Redis.
- **Local storage driver** suits a single server. Use the S3 driver for multi-instance or serverless hosting.
- **No online payment gateway.** By design, until one is verified for Iraq (for example FIB, ZainCash or a card acquirer). Add it as a `PaymentMethod` with signed-webhook verification.
- **Procedural architecture**: buildings are parametric box-based models, not hand-modelled GLB assets. This is what lets every option update the real scene. Bespoke projects with curved or irregular geometry would need a GLB import path (Draco/KTX2-compressed), which the scene structure can accept.
- **Email** needs SMTP configured; until then the platform reports honestly that emails were not sent.
- **Translations are unreviewed.** Arabic and Sorani text needs native-speaker review before launch, legal pages first. Kurmanji is not included. The admin dashboard and admin-entered free text (payment instructions, staff notes) stay in whatever language staff type. Translations of database content are edited in the seed (`prisma/translations.ts`), not yet in the admin.
- **Prisma 6 CLI advisory** (dev dependency only); plan the Prisma 7 upgrade.
- **Real-GPU performance** has not been profiled here. The build environment renders WebGL in software. Profile on target devices, especially mid-range Android phones.

## Next steps (suggested order)

1. Choose hosting (Node server plus managed PostgreSQL plus S3/R2), set production environment variables, run `prisma migrate deploy` and the seed.
2. Configure SMTP, business details, bank details and prices in the admin.
3. Replace concept studies with real commissions as they are delivered, and re-render covers.
4. Native-speaker review of Arabic and Sorani; translation fields in the admin for services, offerings and projects.
5. Integrate a verified local payment gateway.
6. GLB import for bespoke projects; Draco/KTX2 asset pipeline.
7. Redis-backed rate limiting and job queue for emails.
8. Real-device performance profiling and Lighthouse budget in CI.
