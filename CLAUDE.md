# RoomRhythm — Project Memory (Claude Code loads this every session)

RoomRhythm is a browser-based focus-block timer and room clock for in-person rooms. Next.js (App Router) / React / TypeScript / Tailwind. Three profiles: Classroom, Corporate, Testing. Solo dev: Mark.

## IMPORTANT — hard rules (never violate)
- **YOU MUST** label timer controls **"Focus Duration"**. **NEVER** write "Pomodoro / Focus Duration". ("Pomodoro-style" is allowed ONLY on the landing page tagline / marketing copy.)
- Classroom focus slider minimum **stays at 0m**.
- Administration logs store **initials and seat numbers ONLY** — **NEVER** student names, DOB, or IDs.
- All durations are stored in **seconds**, never minutes.
- Every test template **requires** a `verificationNotice`. Templates referencing a trademark **require** a `trademark` disclaimer rendered wherever the name appears. See `docs/09_trademark_and_disclaimers.md`.
- **NEVER** put a third-party mark (SAT, ACT, AP) in the product name, tagline, or domain. Never use their logos. Never reproduce official test content.
- Secrets live in `.env.local` (gitignored) and are read ONLY in server files (`app/api/**`, `lib/**`). Never in a client component.
- No `localStorage` / `sessionStorage`.
- Project stays outside OneDrive (Turbopack cache corruption). Active folder: `RoomRhythm`.

## Architecture
Modular (migrated from single-file). See `docs/01_architecture.md` for the target tree and the one-commit-at-a-time migration order. Never do a big-bang rewrite; lift one feature, verify parity, commit.

## Scope boundary (do not drift)
RoomRhythm is a **room clock** for school-created exams, **mock/practice** admissions tests, and corporate/warehouse training + certification. It is NOT the clock for a live official administration (College Board's Bluebook times students individually; state and licensing exams ship their own platforms). It is NOT webcam proctoring or cheat detection.

## Specs
@docs/00_SPEC_INDEX.md
@docs/01_architecture.md
@docs/02_language_and_ux_rules.md
@docs/05_profile_testing.md
@docs/08_test_template_engine.md
@docs/09_trademark_and_disclaimers.md

## Current build cycle
1. Migrate `page.tsx` -> modular (order in docs/01).
2. Test template engine: `lib/testing/schema.ts` -> runner -> warning banners -> admin log.
3. Template editor + JSON import/export.
4. Backend: Supabase auth + Stripe billing + persistent exportable admin log.

## Business model
Flywheel: cheap per-user acquisition captures work/school email -> domain signal drives per-seat school/enterprise sales. $10/mo tier is admin/room-only.
