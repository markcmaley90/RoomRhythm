# RoomRhythm — GTM Punch List (Claude Code Ready)

**Date:** July 11, 2026
**Location:** `/docs/gtm-punch-list.md` (repo) · mirrored in Drive → Claude Code specs
**Parent doc:** `/docs/gtm-strategy.md`

## How to use this document

1. Work from the repo root: `C:\Users\MM\Documents\RoomRhythm`.
2. Paste **one prompt at a time** into Claude Code. Each prompt is self-contained.
3. Verify against the acceptance checklist, test on `http://localhost:3001`, then `git commit` before starting the next item.
4. **Sequencing:** Finish the in-flight Testing MVP (section runner at `app/testing/run/[templateId]/page.tsx`) before starting items 4, 5, and 6. Items 1, 2, 3, 7, and 8 are safe to run in parallel with MVP work.

**Priorities:** P0 = ship before launch · P1 = launch week · P2 = post-launch spec work

## Status (verified against repo, July 19, 2026)

| Item | Status |
|---|---|
| Testing MVP (section runner + admin log) | ✅ Done |
| P0-1 Language & trademark audit | ✅ Done |
| P0-2 Positioning & homepage copy | ✅ Done |
| P0-3 SEO foundation | ✅ Done (og-image.png added in commit `007f979`) |
| P0-4 Template landing pages | ✅ Done (commit `7e58673`) |
| P0-5 Shareable session links | ✅ Done (commit `1d0bdd7`) |
| P0-6 Projector wordmark | ✅ Done (commit `c12808a`) |
| P0-7 Random name picker | ✅ Done (commit `db39e1c`) |
| P0-8 Noise meter | ✅ Done (commit `5e02320`; synthesized "soft" `SoundType` — no audio files) |
| P1-9 Plausible analytics | ✅ Done (renders nothing until `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set) |
| P1-10 Email capture | ⬜ Not started — **pulled forward: pre-launch** (flywheel needs fuel from post one; see gtm-launch-kit.md §8) |
| P1-11 Encode strategy into CLAUDE.md | ✅ Done (CLAUDE.md carries positioning + guardrails) |
| P1-13 Testing runner projector view | ⬜ Not started (surfaced during P0-6; target: before Oct mock-exam push) |
| P2-12 Sync spec | ⬜ Post-launch |

**Quiet-launch target: Aug 2, 2026** (per gtm-launch-kit.md). Remaining build order: P0-8 → P1-9 → P1-10.

---

## P0-1 · Language & trademark audit

**Goal:** Enforce the messaging rules everywhere before anything is public.
**Files:** repo-wide sweep + one new shared component.

**Paste into Claude Code:**

```
Do a repo-wide language and trademark audit for RoomRhythm. Read CLAUDE.md first for context on language rules.

1. Search every file under app/, components/, lib/, and data/ for the string "Pomodoro". It is ONLY allowed in the landing/profile-select page tagline and marketing copy. Inside the app (timer labels, settings, Testing profile, projector mode), replace any instance with "Focus Duration". List every occurrence you find and what you did with it.

2. Search for "SAT", "ACT", and "AP" across the Testing profile (app/testing/, lib/testing/, data/templates/). Verify every user-facing template name uses "Mock" or "Practice" framing (e.g. "Mock SAT", "Practice ACT") — never wording that implies running the official exam. Fix any that don't.

3. Create components/TrademarkDisclaimer.tsx — a small, muted footer component with this exact text: "SAT® and AP® are registered trademarks of College Board. ACT® is a registered trademark of ACT, Inc. Neither is affiliated with, nor endorses, RoomRhythm." Style it with Tailwind: small text, subdued color, centered.

4. Render TrademarkDisclaimer at the bottom of app/testing/page.tsx (template picker) and app/testing/run/[templateId]/page.tsx (section runner).

5. Verify the first user-facing use of SAT/ACT/AP on each page carries the ® symbol.

Do not change any timing values, schema logic, or lib/testing/schema.ts behavior. Show me a summary table of every change before finishing.
```

**Acceptance:**
- [ ] Zero in-app "Pomodoro" strings (landing tagline exempt)
- [ ] All templates say Mock/Practice
- [ ] Disclaimer renders on both Testing pages
- [ ] No logic changes

---

## P0-2 · Positioning & homepage copy update

**Goal:** Homepage reflects the adopted positioning and carries SEO keyword copy.
**Files:** `app/page.tsx` (or the current landing/profile-select page).

**Paste into Claude Code:**

```
Update the RoomRhythm landing / profile-select page copy to match our adopted positioning. Read CLAUDE.md and docs/gtm-strategy.md first.

1. Hero headline: "The screen that runs your room."
2. Subhead: "Focus blocks, breaks, transitions, and sound for your classroom — plus the only classroom screen that can also run test day." The word "Pomodoro-style" may appear in the tagline area here (this is the one permitted location).
3. Under the three profile cards (Classroom 🏫, Corporate 💼, Testing 📝), keep existing descriptions but tighten to one sentence each. Testing card must say "mock exams, finals, and timed sections with extended-time accommodations" — never imply official SAT/ACT administration.
4. Add a short SEO-supporting section below the fold (2–3 sentences of real prose, not keyword stuffing) that naturally includes: "classroom timer for projector", "final exam timer", and "exam timer with extended time".
5. Keep the existing visual design system — copy changes only, no layout rework, no new dependencies.

Show me the before/after copy diff before writing.
```

**Acceptance:**
- [ ] New hero + wedge line live
- [ ] Testing card uses mock/practice framing
- [ ] Below-fold prose includes the three target phrases naturally
- [ ] No layout regressions

---

## P0-3 · SEO foundation

**Goal:** Metadata, sitemap, robots, OpenGraph — the plumbing every landing page needs.
**Files:** `app/layout.tsx`, `app/sitemap.ts`, `app/robots.ts`, `public/og-image.png` (placeholder).

**Paste into Claude Code:**

```
Add SEO foundations to the RoomRhythm Next.js App Router project. No new dependencies.

1. In app/layout.tsx, export a metadata object with: title template "%s | RoomRhythm" and default title "RoomRhythm — The Screen That Runs Your Room"; description "Free classroom screen for focus blocks, breaks, and timed exams. The only classroom timer that can also run test day — with extended-time accommodations built in."; openGraph (title, description, type "website", images ["/og-image.png"]); twitter card "summary_large_image"; metadataBase set from an env var NEXT_PUBLIC_SITE_URL with a localhost:3001 fallback.

2. Create app/sitemap.ts using Next's MetadataRoute.Sitemap. Include: "/", "/testing", and one entry per template using the template IDs exported from data/templates/seed.ts at the path /templates/[templateId] (these pages are built in the next punch-list item — include them now so the sitemap is ready). Read seed.ts to get the real IDs; do not hardcode guesses.

3. Create app/robots.ts allowing all crawlers and pointing to the sitemap.

4. Create a simple placeholder public/og-image.png is out of scope for code — instead add a TODO comment in layout.tsx noting the file must be added (1200x630). Do not generate an image.

5. Confirm the app builds cleanly with npm run build.

Show me each file before writing it.
```

**Acceptance:**
- [ ] `npm run build` passes
- [ ] `/sitemap.xml` and `/robots.txt` resolve on localhost:3001
- [ ] Sitemap contains real template IDs from `seed.ts`
- [ ] OG/Twitter metadata present in page source

---

## P0-4 · Template landing pages (the SEO surface)

**Goal:** One public, statically generated page per seed template. This is the channel that lets us own "exam timer with extended time."
**Files:** `app/templates/[templateId]/page.tsx` + supporting component.
**Depends on:** Testing MVP section runner (links into it).

**Paste into Claude Code:**

```
Create public SEO landing pages for each exam template in RoomRhythm. Read lib/testing/schema.ts and data/templates/seed.ts first — use the real exported types and template data, do not invent fields.

1. Create app/templates/[templateId]/page.tsx as a statically generated route: implement generateStaticParams from the seed template IDs, and generateMetadata producing a keyword-targeted title/description per template. Examples of the pattern: the 90-minute final exam template → title "Free 90-Minute Final Exam Timer with Extended Time Accommodations"; the mock SAT template → "Free Mock SAT Practice Test Timer with Section Breaks". Derive titles from template data, don't hardcode all four.

2. Page content, in order: (a) H1 with the template name and "free timer" phrasing; (b) a table of the template's sections with durations rendered from the actual data (remember durations are stored in seconds — format as minutes); (c) a callout box listing the three differentiators: extended-time lanes (1.5×/2×), automatic 30/10/5-minute announcements, gated section advance; (d) a prominent "Run this template" CTA linking to /testing/run/[templateId]; (e) an FAQ section with 3 questions per template (e.g. "How do extended-time accommodations work?", "Can I customize the sections?", "Does this replace the official exam timing?" — the answer to that last one must state this is for practice/mock administration and teacher-created exams, not official College Board testing); (f) the TrademarkDisclaimer component.

3. Add FAQPage JSON-LD structured data via a <script type="application/ld+json"> generated from the same FAQ content.

4. Style with Tailwind consistent with the existing app. Quiet, neutral palette matching the Testing profile aesthetic. No new dependencies.

5. On app/testing/page.tsx, add a small "About this template" link from each template card to its landing page.

Show me the page structure as an outline before writing code, then write it.
```

**Acceptance:**
- [ ] All four templates render at `/templates/[id]` from real seed data
- [ ] Section durations display correctly (seconds → minutes)
- [ ] FAQ JSON-LD validates (paste page source into Google's Rich Results Test)
- [ ] CTA launches the real section runner
- [ ] Disclaimer present

---

## P0-5 · Shareable session links

**Goal:** "Send your sub this screen." Config travels in the URL — no backend.
**Files:** `lib/share.ts`, integration in the main timer setup and Testing runner.
**Depends on:** Testing MVP section runner.

**Paste into Claude Code:**

```
Add shareable session links to RoomRhythm. No backend — encode configuration in the URL. No new dependencies.

1. Create lib/share.ts with two pure functions: encodeShareConfig(config) → URL-safe string (JSON.stringify → encodeURIComponent → btoa, or an equivalent URL-safe base64 approach), and decodeShareConfig(param) → config object or null. decodeShareConfig must never throw: wrap parsing in try/catch, validate the decoded object against the expected shape before returning it, and return null on any failure. For Testing templates, reuse validation helpers from lib/testing/schema.ts rather than duplicating checks.

2. Add a "Copy share link" button to the main Classroom timer setup and to the Testing runner (lane-selection phase). Clicking copies the current URL with ?s=<encoded> to the clipboard using navigator.clipboard.writeText, with a brief "Copied!" confirmation state. Include a one-line hint under the button: "Anyone with this link opens your exact setup — great for subs and co-teachers."

3. On load, both pages check for the ?s= param, decode it, and hydrate the setup if valid. Invalid or missing params fall through silently to defaults — never show an error for a bad link, just load defaults.

4. Keep encoded payloads minimal: only settings needed to reproduce the setup. Never include anything from the administration log, and never include roster names.

Show me lib/share.ts first for review, then the integrations.
```

**Acceptance:**
- [ ] Copy → open in incognito → identical setup loads
- [ ] Corrupted `?s=` value loads defaults silently
- [ ] No roster/log data ever enters the URL
- [ ] Works in both Classroom setup and Testing runner (lane-selection phase)

---

## P0-6 · Projector wordmark

**Goal:** The viral loop. Small, tasteful, only in projector mode.
**Files:** projector mode component(s).
**Depends on:** none (but touches projector mode, so coordinate with MVP work).

**Paste into Claude Code:**

```
Add a wordmark to RoomRhythm's projector mode. Read CLAUDE.md first — the guardrail is that projector mode must never feel cluttered or surveillance-like.

1. In the projector/fullscreen display component(s), render a small wordmark in the bottom-right corner: the text "RoomRhythm" followed by a middot and "roomrhythm.app" (use NEXT_PUBLIC_SITE_URL's hostname if set, else that literal). 

2. Style: Tailwind, ~text-sm, opacity-40, non-interactive (pointer-events-none), no logo image, no animation. It must be legible from the back of a room on a projector but visually quiet. In the Testing profile's projector view, use the profile's neutral palette.

3. It must never overlap timer digits, warnings, or announcements at any viewport size — verify at 1024x768 (common projector resolution) and 1920x1080.

4. Add a single boolean showWordmark defaulting to true where the component is configured, so a future Pro tier can toggle it. Do not build any settings UI for it now.

Show me a screenshot-style description of placement before writing code.
```

**Acceptance:**
- [ ] Visible but quiet in both Classroom and Corporate projector views
- [ ] No overlap at 1024×768 and 1920×1080
- [ ] `showWordmark` flag exists, no UI for it
- [ ] Non-interactive

---

## P0-7 · Random name picker

**Goal:** The most-used classroom widget after the timer. Closes the "complete for a never-tests teacher" gap.
**Files:** `components/NamePicker.tsx`, `lib/rosters.ts`, Classroom profile integration.

**Paste into Claude Code:**

```
Build a random name picker for RoomRhythm's Classroom profile. This is a classroom-management widget, not a testing feature — it must never appear in the Testing profile. No new dependencies.

1. Create lib/rosters.ts: localStorage-backed roster storage under the key "roomrhythm.rosters.v1". Shape: { rosters: [{ id, name, students: string[] }] }. Functions: loadRosters, saveRosters, createRoster, updateRoster, deleteRoster. All reads wrapped in try/catch returning safe defaults (SSR-safe: guard typeof window).

2. Create components/NamePicker.tsx: (a) roster selector + inline management (create roster, paste a newline-separated list of names, edit, delete); (b) a large "Pick" button that animates briefly through names before landing on one (CSS/setInterval shuffle ~1.5s, respect prefers-reduced-motion by skipping straight to the result); (c) a "no repeats until everyone's been picked" toggle that tracks picked names per session (in-memory, resets on reload); (d) picked name displays large enough to read from a projector.

3. Privacy: display this line in the roster editor, verbatim: "Names are stored only on this device and never leave it." Never send roster contents to analytics, Formspree, share links, or any network request.

4. Integrate into the Classroom profile UI where widgets/tools live, consistent with existing patterns in the codebase. Do NOT add it to app/testing/ anywhere.

Show me the component plan before writing, then build it.
```

**Acceptance:**
- [ ] Rosters persist across reloads (localStorage)
- [ ] No-repeat mode works and resets on reload
- [ ] Privacy line present verbatim
- [ ] Absent from Testing profile
- [ ] Reduced-motion respected

---

## P0-8 · Noise meter

**Goal:** Second most-cited classroom-management widget. Pulled forward from the v2 backlog.
**Files:** `components/NoiseMeter.tsx`, Classroom profile integration.

**Paste into Claude Code:**

```
Build a noise meter widget for RoomRhythm's Classroom profile using the Web Audio API. No new dependencies. Classroom profile only — never in Testing.

1. Create components/NoiseMeter.tsx: (a) a "Start listening" button that requests mic access via navigator.mediaDevices.getUserMedia({ audio: true }); (b) on grant, pipe the stream into an AnalyserNode and compute a smoothed RMS level on requestAnimationFrame; (c) render a large horizontal level bar with three zones (quiet / working / too loud) using the app's existing palette; (d) a draggable threshold marker the teacher sets; (e) when the level holds above threshold for 3+ continuous seconds, play a single gentle chime through the existing synthesized sound engine in lib/audio.ts — reuse the "soft" SoundType (there are no audio files; sounds are synthesized via Web Audio; do not add any audio files) — and don't re-trigger for at least 15 seconds.

2. Permission states: before grant, show a one-line explainer; on deny or no mic, show a calm fallback message with retry — never an error screen. Stop all tracks and close the AudioContext on unmount and when the teacher clicks "Stop".

3. Privacy: display this line in the widget, verbatim: "Sound is analyzed on this device in real time — nothing is recorded or transmitted." That must be true: no MediaRecorder, no network calls, no buffering of audio data.

4. Projector consideration: the meter should look good full-width in projector mode (big bar, minimal chrome).

5. Integrate alongside the name picker in the Classroom profile widget area.

Show me the component plan and which sound file you chose before writing.
```

**Acceptance:**
- [ ] Level bar responds in real time; threshold + chime + 15s cooldown work
- [ ] Deny/no-mic path is graceful; tracks/context cleaned up on stop/unmount
- [ ] Privacy line present verbatim and accurate (zero recording/transmit paths)
- [ ] Absent from Testing profile

---

## P1-9 · Privacy-friendly analytics

**Goal:** Know what's used without tracking people. Cookieless keeps schools comfortable.
**Founder dependency:** create a Plausible account first and note your site domain.
**Files:** `app/layout.tsx`, `lib/analytics.ts`.

**Paste into Claude Code:**

```
Add Plausible analytics to RoomRhythm. Cookieless, privacy-first, no consent banner needed.

1. In app/layout.tsx, add the Plausible script tag using next/script (strategy "afterInteractive"), with data-domain read from NEXT_PUBLIC_PLAUSIBLE_DOMAIN. If that env var is unset, render nothing (so local dev sends nothing).

2. Create lib/analytics.ts with a track(eventName, props?) function that safely no-ops when window.plausible is absent. TypeScript-declare window.plausible.

3. Instrument exactly these events and nothing else: "session_started" (props: profile), "template_launched" (props: templateId), "share_link_copied" (props: surface), "name_picker_used" (no props), "noise_meter_started" (no props), "section_completed" (props: templateId). NEVER include roster names, initials, seat numbers, emails, or any log contents in event props.

4. Add NEXT_PUBLIC_PLAUSIBLE_DOMAIN and NEXT_PUBLIC_SITE_URL to a .env.example file with comments.

Show me lib/analytics.ts and the exact call sites before writing.
```

**Acceptance:**
- [ ] No script/network calls when env var unset
- [ ] Six events only; zero PII in props
- [ ] `.env.example` documents both vars

---

## P1-10 · Email capture + school-domain tagging

**Goal:** The flywheel's fuel. Optional email at save moments; domain is the signal.
**Files:** `components/EmailCapture.tsx`, Formspree integration.

**Paste into Claude Code:**

```
Add lightweight email capture to RoomRhythm using the existing Formspree setup (find the current Formspree endpoint used for feedback and create a parallel usage — do not break feedback).

1. Create components/EmailCapture.tsx: a single email input + button with the copy "Get updates for your school — we'll email when site licenses and new templates land." On submit, POST to Formspree with fields: email, domain (the part after @, lowercased), source (a string prop identifying placement), and timestamp. Client-side validate email format. Success state: "You're on the list." Errors fail quietly to a "Try again" state.

2. Placement (source prop values in parens): after a successful "Copy share link" action ("share"), at the bottom of each /templates/[templateId] landing page ("template_page"), and after a Testing section runner completes a full template ("run_complete"). Dismissible; once dismissed or submitted, hide for the session (in-memory only, no cookies).

3. It must be genuinely optional and quiet — no modals, no blocking, no repeat nagging. One inline card per surface.

4. Never prefill, store, or send anything besides those four fields.

Show me the component and each placement before writing.
```

**Acceptance:**
- [ ] Submits to Formspree with email/domain/source/timestamp
- [ ] Three placements live; dismiss persists for the session
- [ ] No modal, no cookie, no nag
- [ ] Feedback form still works

---

## P1-11 · Encode the strategy into CLAUDE.md and /docs

**Goal:** Future Claude Code sessions inherit the positioning, messaging rules, and guardrails automatically.
**Files:** `CLAUDE.md`, `docs/`.

**Paste into Claude Code:**

```
Update CLAUDE.md and /docs to encode our adopted GTM strategy. Read docs/gtm-strategy.md first (it's in the repo).

1. In CLAUDE.md, add a "Positioning & messaging" section containing: the core line ("The screen that runs your room"), the wedge line ("The only classroom screen that can also run test day"), and the Say/Never-say table from docs/gtm-strategy.md verbatim (including the Focus Duration rule and mock/practice rule).

2. In CLAUDE.md, add a "Mission guardrails" section with the five guardrails from docs/gtm-strategy.md section 9 verbatim — especially the sync split rule (shared-view everywhere; visibility flags Testing-profile only) and the no-PII rule.

3. Verify docs/gtm-strategy.md and docs/gtm-punch-list.md exist in /docs; if I haven't added them yet, remind me instead of creating placeholders.

4. Do not modify any existing architecture or product-framing sections of CLAUDE.md — append only.

Show me the CLAUDE.md diff before writing.
```

**Acceptance:**
- [ ] Messaging rules + guardrails now in CLAUDE.md
- [ ] Append-only; existing framing untouched

---

## P1-13 · Testing runner projector view

**Goal:** Build a fullscreen projector mode for `SectionRunner` on the `ProjectorView` pattern — multi-lane clocks, warning banner, section label, and the wordmark via the existing `showWordmark` flag.

**Files:** `components/testing/SectionRunner.tsx` + a Testing-specific projector component.
**Depends on:** Testing MVP section runner (done).

**Notes:** Needs its own design pass — the existing `ProjectorView` renders a single clock, whereas the Testing runner must show standard and extended-time lanes side by side at projector scale. Surfaced during P0-6: the Testing runner has no projector view today (the old inline `TestingApp` had one; it was removed in `93fb47c` and the new runner never got one), which is why P0-6's wordmark covers Classroom and Corporate only.

**Target:** before the October mock-exam season push (see `gtm-launch-kit.md`).

*No prompt block yet — placeholder.*

---

## P2-12 · Multi-device sync split — spec only

**Goal:** Write the spec that keeps sync mission-aligned before any PartyKit code exists.
**Files:** `docs/specs/multi-device-sync.md` (new).

**Paste into Claude Code:**

```
Write a spec (no code) at docs/specs/multi-device-sync.md for RoomRhythm's future multi-device sync, structured as two strictly separated capabilities. Read CLAUDE.md and docs/gtm-strategy.md first.

Part A — Shared View (all profiles): teacher's timer/prompts/announcements mirrored read-only to student devices via room code + QR join. PartyKit backend. Explicitly no data flows from student devices to the teacher beyond join/leave presence counts. This is a display feature.

Part B — Exam Visibility (Testing profile ONLY): opt-in per administration; Page Visibility API + fullscreen signals surface on the teacher dashboard as neutral status indicators. Constraints to encode: never in Classroom or Corporate profiles; never keystrokes, screenshots, recordings, or content capture; students see a persistent indicator that visibility signals are on; log stores flags against seat numbers only (no PII, consistent with the administration log).

Include for each part: user stories, data flow diagram in text, what is explicitly out of scope, and open questions. End with a "Guardrail tests" section: three scenarios a reviewer can use to check any future implementation against the classroom-first principle.

Spec only — do not scaffold any code or add dependencies.
```

**Acceptance:**
- [ ] Spec exists with A/B split, out-of-scope lists, and guardrail tests
- [ ] Zero code changes

---

## Founder checklist (not Claude Code)

- [ ] Drop both docs into `/docs`, commit, and upload copies to Drive → GTM docs
- [ ] Create Plausible account; set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` (unblocks P1-9)
- [ ] Confirm production domain + set `NEXT_PUBLIC_SITE_URL`
- [ ] Create the 1200×630 `public/og-image.png` (P0-3 leaves a TODO)
- [ ] Draft 5–8 community posts (FB teacher groups, Pinterest, X) in builder voice — August push
- [ ] Build the 10-name teacher micro-influencer list; send gift/early-access notes
- [ ] Email 2–3 warm school contacts proposing a December-finals pilot
- [ ] Calendar the seasonal pushes: Aug (back-to-school), Oct (PSAT/mocks), Dec (finals), Mar–Apr (state testing), May (AP/finals)
- [ ] Set a weekly 15-minute metrics review (see gtm-strategy.md §8) — watch "domains with 5+ users"
