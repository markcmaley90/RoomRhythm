# RoomRhythm — Project Memory (Claude Code loads this every session)

RoomRhythm is a browser-based focus-block timer and room clock for in-person rooms. Next.js (App Router) / React / TypeScript / Tailwind. Three profiles: Classroom, Corporate, Testing. Solo dev: Mark.

## IMPORTANT — hard rules (never violate)
- **YOU MUST** label timer controls **"Focus Duration"**. **NEVER** write "Pomodoro / Focus Duration". ("Pomodoro-style" is allowed ONLY on the landing page tagline / marketing copy.)
- Classroom focus slider minimum **stays at 0m**.
- **"Lane" is internal jargon.** It may appear in code identifiers (`accommodationLanes`, `laneId`) and comments, but **NEVER** in user-facing copy — UI labels, headings, dialogs, metadata, FAQ answers, or marketing prose. Public copy says **"timing group"** (or "accommodation group"). Read-aloud test applies to every public string.
- Administration logs store **initials and seat numbers ONLY** — **NEVER** student names, DOB, or IDs.
- All durations are stored in **seconds**, never minutes.
- Every test template **requires** a `verificationNotice`. Templates referencing a trademark **require** a `trademark` disclaimer rendered wherever the name appears. See `docs/09_trademark_and_disclaimers.md`.
- **NEVER** put a third-party mark (SAT, ACT, AP) in the product name, tagline, or domain. Never use their logos. Never reproduce official test content.
- Secrets live in `.env.local` (gitignored) and are read ONLY in server files (`app/api/**`, `lib/**`). Never in a client component.
- Roster names are stored **"First L." ONLY** (`toDisplayName` in `lib/rosters.ts`). CSV import reduces at parse time, before anything reaches state or storage — full surnames, student IDs, DOB, emails, and every other column are discarded on read, never persisted. **NEVER** widen this.
- No `localStorage` / `sessionStorage` — ONE carve-out: the Classroom name-picker roster (key `roomrhythm.rosters.v1`) may use `localStorage`. Device-local only; never synced, transmitted, or included in share links, analytics, or any network request. See `docs/gtm-strategy.md` §9.3. Nothing else persists client-side; Testing/administration data never touches it.
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
All P0 and pre-launch P1 items are shipped. **Full plan: `docs/12_build_plan.md`.**

0. **LAUNCH** — domain, deploy, screenshots, demo GIF. Nothing below may delay it.
1. Quick wins: visible ±1m buttons; period-end-time ("class ends at 10:42") awareness.
2. Extract `Segment`/`TimeWarning`/`AdvanceMode` from `lib/testing/schema.ts` into
   `lib/schedule/segment.ts`. Refactor only — zero user-visible change, Testing parity verified.
3. **Schedule mode** (Classroom): pre-built lesson cadence over that shared core, with presets.
   Manual mode (today's Calm/Focus/Break) stays the untouched default.
4. Schedule builder. **Schedules encode into the URL** like share links — bookmarkable
   and shareable, so NO new `localStorage` carve-out is needed.
5. Transition instructions + non-destructive attention signal.
6. Backend: Supabase auth + Stripe billing + persistent exportable admin log.
7. **Phone remote** (`docs/11_phone_remote.md`) — teacher's phone controls the projector.
   Projector owns the clock; the phone sends intents only and the room never depends on it.

**Student multi-device sync (`docs/07`) is DEFERRED indefinitely** — spec only, not scheduled.
35 untrusted devices and a compliance surface involving minors, for value the phone remote
mostly delivers already.

## Business model
Free = full Classroom + Corporate + ONE free Testing template (Classroom Final Exam / `seed-final-90`, other templates visible but locked). Paid = full Testing + ambient sound library + phone-remote (multi-device) sync. **Annual-only, no monthly SKUs:** **$19.99/yr Educator/Work Pro** (school/work email; launch verification = domain check rejecting major consumer providers), **$59.99/yr standard Pro** (no email requirement), **Business tier TBD** (~$149–199/yr; tutoring/test-prep centers + training companies), **$10/mo site license reserved** (school/org, **credit-forward**: individual subs on the domain fold in automatically on activation, unused time credited/refunded). Gate scale + premium daily-use features; never cripple the free core. Domain-signal flywheel: the paid educator tier captures verified school/work domains → site-license leads. Full detail: `docs/gtm-strategy.md` §4. Supersedes the old $36 save-to-Pro model.
