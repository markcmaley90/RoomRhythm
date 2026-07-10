# 01 — Architecture (REVISED: modular)

## Decision
The single-file `app/page.tsx` was correct for V1 and is now the wrong shape. The test template engine (schema, editor, runner, library, import/export) plus auth and billing are distinct concerns totaling several thousand lines. Git makes multi-file changes safe to review and revert — which was the real reason single-file felt safer.

**Migrate incrementally.** Lift one feature out of `page.tsx` at a time, verify parity, commit per move. Never a big-bang rewrite.

## Target structure
```
app/
  page.tsx                      # profile-select landing (thin)
  classroom/page.tsx
  corporate/page.tsx
  testing/
    page.tsx                    # template picker
    run/[templateId]/page.tsx   # the section runner
    templates/page.tsx          # library + editor
  api/
    stripe/checkout/route.ts
    stripe/webhook/route.ts     # MUST be a route handler
    auth/callback/route.ts
components/
  timer/       TimerCore, CalmCountdown, ScreenFlash, SoundPicker
  room/        ProjectorView, EmergencyButton, FullscreenToggle
  testing/     SectionRunner, WarningBanner, AccommodationLanes,
               AdminLog, TemplateEditor, TemplateCard
lib/
  audio.ts
  supabase.ts
  stripe.ts
  entitlements.ts               # "is this user paid?"
  testing/
    schema.ts                   # TestTemplate types + pure helpers
    runner.ts                   # clock state machine
    export.ts                   # admin log -> CSV/PDF
data/templates/seed.ts          # hand-seeded templates
docs/                           # this spec set
CLAUDE.md
```

## Migration order (one commit each)
1. `lib/audio.ts` — extract the sound engine (self-contained, zero risk).
2. `components/timer/*` — TimerCore + CalmCountdown + ScreenFlash.
3. `components/room/*` — projector, fullscreen, emergency.
4. Split the three profiles into routes.
5. `lib/testing/*` + `components/testing/*` — the engine.
6. Backend: supabase, stripe, entitlements.

## Non-negotiables
- No `localStorage` / `sessionStorage`.
- Secrets in `.env.local`, gitignored, read only in server files. Never in a client component.
- Project stays OUTSIDE OneDrive (Turbopack cache corruption). Active folder: `RoomRhythm`.
- All durations stored in **seconds**, never minutes.
