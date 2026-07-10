# 08 — Test Template Engine (the moat)

## Principle
Do NOT hand-curate a database of official test specs. Build the **engine**, seed a handful of templates we can defend, and let users build and share the rest.

Three reasons: (1) specs change — the digital SAT overhaul and the enhanced ACT rewrote timings within two years; (2) a wrong duration on a real test is a serious harm and a liability; (3) 50 states × a dozen tests is unmaintainable solo. A user-built, shareable library also compounds — that's the durable moat.

## Scope boundary (critical)
RoomRhythm is a **room clock** for:
- School-created exams (finals, midterms, benchmarks) — no IP entanglement, entirely unserved.
- **Mock/practice** admissions tests.
- Corporate / warehouse training + certification.

It is NOT the clock for a live official administration. College Board owns Bluebook and the Test Day Toolkit, and on the real digital SAT each student is timed individually inside Bluebook — there is no shared room clock. State assessments and licensing exams (Prometric, Pearson VUE) likewise ship their own platforms. Do not market against these.

## Schema
Canonical source: `lib/testing/schema.ts`. Key decisions encoded there:
- **Durations always in seconds.** Unit ambiguity is how timing bugs ship.
- **`AdvanceMode`**: `auto` | `manual` | `gated`. Default to `gated` for exams — the clock reaches zero but the proctor confirms before moving on. Silent auto-advance during a live exam is dangerous.
- **`AccommodationLane`** carries `timeMultiplier`. Multiple lanes render side by side so one proctor runs standard + 1.5× + 2× simultaneously.
- **Warnings are wall-clock, not scaled.** A "5 minutes remaining" warning fires at 5 real minutes on every lane. Scaling it to 7.5 minutes on a 1.5× lane would be wrong. `warningsFor()` exists to make this explicit and testable.
- **Breaks ignore the multiplier** by default (`segmentDurationFor` handles this). Extended-time students get extra *testing* time, not longer breaks, unless `extraBreakSeconds` is set.
- **`verificationNotice` is required**, not optional. Every template shows "verify against your official manual."
- **`meta.lastVerified` + `meta.sourceUrl`** — surface a "last verified" badge. Stale templates must be visibly stale.

## Validation
`validateTemplate()` runs before save or share. It enforces: at least one segment, a standard 1× lane always present, no negative durations, no auto-advance on untimed segments, and no warning that can never fire.

## Seeded templates (`data/templates/seed.ts`)
1. **90-Minute Final Exam** — school_exam. The demo centerpiece. Zero IP risk.
2. **Mock Practice Timing for the SAT® Exam** — practice_admissions. Verified: R&W 2×32 min, 10-min break, Math 2×35 min = 2h14m.
3. **Mock Practice Timing for the ACT® Test** — practice_admissions. Enhanced format, verified: English 35, Math 50, Reading 40; optional Science 40, Writing 40.
4. **Safety Certification Session** — corporate_training. Warehouse/compliance modules + timed assessment.

## Build order
1. `schema.ts` + `validateTemplate` + unit tests on `segmentDurationFor` / `totalDurationFor`.
2. Section runner reading a template (`gated` advance, multi-lane clocks).
3. Warning banners driven by `TimeWarning[]`.
4. Admin log writes a timestamped event per segment start/end/warning/advance.
5. Template editor (create/duplicate/edit) + JSON import/export.
6. LATER: community sharing, ratings, "last verified" decay prompts.
