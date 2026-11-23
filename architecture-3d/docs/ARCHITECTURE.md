# Architecture notes

## 1. One design description, everywhere

`BuildingConfig` (`src/three/config.ts`) is the single description of a design: 24 exterior, interior and environment fields, validated by one Zod schema. It is used by:

- the 3D scene (geometry, materials, lighting),
- the studio store (undo/redo history is a stack of configs),
- saved designs and portfolio projects (stored as JSON, re-validated on read with `coerceConfig`),
- AI briefs (the model must return valid enum values; the server validates again),
- share links (`?config=` is base64url JSON, rejected if invalid).

## 2. The 3D pipeline

```
BuildingPlan (plans.ts) ─┐
                         ├─ generateBuilding() ──► BuildingModel { parts[], rooms[], floors[], stats }
BuildingConfig ──────────┘        (pure TS, unit tested, also used on the server for specs)
                                         │
                       batchBySlot() / buildBoxesGeometry()  → one merged BufferGeometry per (floor, material slot)
                                         │
                       createMaterials(config) → one PBR material per slot (procedural canvas textures, cached)
                                         │
             <Building/> groups per floor → explode / isolate / clip, room picking, material inspection
             <Site/> ground, instanced planting, bollards   <Atmosphere/> sun, sky, env map, fog   <Effects/>
```

- **Openings** are real: walls are split into piers, sills and heads around each window and door. Glazing, frames, mullions and louvres are emitted per opening.
- **World-space UVs** (metres, including floor elevation) keep stone joints and boards continuous across wall pieces, and give materials their true physical scale.
- **Clipping**: two shared `THREE.Plane`s, a horizontal section and a vertical facade cutaway, are attached to building materials only, so the site never clips.
- **Level of detail**: furniture is hidden at distance unless the interior is revealed; tree geometry detail and point-light counts drop with the quality tier.
- **Quality tiers** (`low` / `medium` / `high`): detected from device signals, lowered automatically by `PerformanceMonitor`, and overridable by the user. Resolution adapts continuously within the tier's DPR band.
- **Rebuild keys**: geometry rebuilds only when geometry-relevant fields change; materials rebuild only when finishes change or the night level moves by a step. Time-of-day sweeps therefore cost almost nothing.
- **No WebGL**: every canvas has a fallback, an SVG front elevation generated from the same model.

## 3. Cinematic timeline

`src/components/cinematic/timeline.ts` is pure: `evaluate(progress, model, aspect, reduced)` returns camera pose, explode, cutaway, time and material variant. There is one GSAP tween with ScrollTrigger `scrub`, no other scroll handlers. Camera poses are multiples of the building's size, so the timeline works for any plan. Portrait screens push the camera back. Reduced motion snaps each chapter to its final pose without idle drift.

## 4. Server

- **Route wrapper** (`src/lib/api.ts`): same-origin check, rate limit, typed params, uniform error responses (Zod field errors map to form fields; unexpected errors are logged and never leaked).
- **Sessions** are database rows keyed by token HMAC, so they can be revoked.
- **Capabilities** (`permissions.ts`) map roles to actions; pages use `requirePageCapability`, APIs use `requireCapability`.
- **Admin resources** (`src/lib/admin-resources.ts`): a registry of `{ capability, schema, apply }` per resource. One dynamic route serves them all, and every change is audit-logged.
- **Settings**: key/value rows validated by Zod schemas with empty defaults. Features that depend on them (WhatsApp, checkout) stay hidden until configured.

## 5. Commerce

```
Offering (admin-priced) → Order (amount snapshot, PENDING_PAYMENT)
   → customer submits Payment (reference, amount, optional receipt)   → AWAITING_VERIFICATION
   → staff verify  → Order PAID → Subscription (entitlement, period)  → notifications + audit
   → staff reject  → back to PENDING_PAYMENT with the reason shown to the customer
```

Entitlements (`studio_pro`, `architect_pro`, `featured_placement`) come from active subscriptions. Renewals extend from the end of the current period. Payment methods implement one interface (`src/lib/payments/methods.ts`), so a gateway can be added once one is verified for the market. It must confirm payments server-side via signed webhooks before calling the same fulfilment code.

## 6. AI

`generateBrief()` chooses a provider. The Claude provider uses structured output (Zod schema), base64 vision input for land photos, effort `medium`, and server-side refusal fallback. Any failure falls back to the rules engine with a visible notice. The rules engine (`src/lib/ai/rules.ts`) is deterministic and auditable. It never invents cost rates: budget fit is reported as an arithmetic ratio for the architect to judge. The disclaimer is added server-side, not by the model.

## 7. Analytics and privacy

First-party events are recorded only after the visitor opts in, keyed by a random browser ID. Project view counts are aggregate counters with no personal data. Revenue counts only staff-verified payments, in the reporting currency.
