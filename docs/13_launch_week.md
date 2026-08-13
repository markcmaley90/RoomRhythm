# 13 — Launch Week (Aug 6–14, 2026)

**This is the single answer to "what am I doing this week."** It supersedes the
sequencing in `gtm-launch-kit.md` §1, `gtm-distribution-pack.md` §7, and
`marketing/roomrhythm-channel-strategy.md` where they disagree. Those stay as
reference for copy, named channels, and research; this doc owns the order.

**The constraint:** most large US districts start **Monday, August 10** — four
days out. Northeast and upper-Midwest start after **Labor Day, September 7**.
That second wave is not mop-up; it's their actual launch.

---

## Blockers — nothing ships until these are done

### B1. Pins 8–11 cannot be published as written

Verified against `data/templates/seed.ts` and `docs/09_trademark_and_disclaimers.md`.
Four separate rule breaks, and one factual error that is worse than the rule breaks.

| Problem | Evidence |
|---|---|
| Mark in the title, no ®, no disclaimer | Doc 09 §6 forbids a mark in a product name/tagline and names "SAT Preparation App" as the incorrect pattern. §9: the disclaimer renders "wherever the template name appears — picker card, runner header, exported admin log, **and marketing page**." A pin is a marketing page. |
| Missing mock/practice framing | Real name is `RoomRhythm's Mock Practice Timing for the SAT® Exam`. "SAT Test Day Timer" implies the live official exam. |
| "Proctors" / "proctoring timer" | `brand/BRAND.md`: never describe RoomRhythm as proctoring software. That boundary is the positioning. |
| **Sells the live official administration** | Pin 9's "the person actually standing in the room reading the script" contradicts our own `seed.ts:68`: *"The official digital SAT is timed individually inside College Board's Bluebook app, not by a shared room clock."* |

**The last one is not a compliance problem, it's a wrong claim.** It would produce
refund requests from testing coordinators — the exact audience the site-license
flywheel depends on. Worst possible group to mislead.

**Resolution.** Marks come out of titles entirely; the full source-identified name
plus disclaimer goes in the description, where there's room. We lose "SAT timer"
as a keyword. That keyword is also where all the legal exposure sits.

> **Title:** Mock Practice Test Timer for Exam Day
> **Description:** Run a full-length practice administration from one screen —
> section timing, wall-clock warnings, and manual advance so you move when the
> room is ready. RoomRhythm's Mock Practice Timing for the SAT® Exam. SAT® is a
> registered trademark of the College Board, which was not involved in the
> production of, and does not endorse, this product.

### B2. Every template URL is wrong, and four point at a paywall

| Pin doc says | Actual route | Tier |
|---|---|---|
| `/templates/final-exam` | `/templates/seed-final-90` | **free** |
| `/templates/sat` | `/templates/seed-mock-sat` | pro |
| `/templates/act` | `/templates/seed-mock-act` | pro |
| `/templates/ap` | `/templates/seed-mock-ap` | pro |
| `/templates/certification` | `/templates/seed-safety-cert` | pro |

**Decision: route all exam pins to `/templates/seed-final-90`.**

Not "label them Pro." `seed-final-90` ships Standard, 1.5× **and** 2×, so it
demonstrates the entire extended-time capability for free. Cold Pinterest traffic
landing on a paywall is the worst first impression available to us, and there is
no checkout to convert them with anyway. The Pro landing pages stay public as SEO
surface — they just aren't where paid ads of attention should point.

### B3. Analytics are blind — REOPENED Aug 12, closed again pending Vercel env vars

Was closed Aug 6 with Plausible. **Reversed Aug 12 — we moved to PostHog** (see
D1 below for the reasoning and the conditions that made it acceptable).

Remaining to actually close:

- [ ] `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` set in Vercel
      across all three environments, then **redeploy** — env vars bake in at
      build time, so an existing deploy will not pick them up
- [ ] "Cookieless server hash mode" enabled in PostHog project settings
- [ ] Verified on a phone over cell data, not just desktop localhost
- [ ] **Cancel the Plausible trial before ~Sep 5** or it converts to $9/mo for a
      tool we no longer load

### ~~B4. Email capture renders nothing~~ — CLOSED Aug 6

`NEXT_PUBLIC_FEEDBACK_ENDPOINT` is set to a Formspree endpoint (free tier, 50
submissions/month — watch the ceiling). There is still no way to take money (no
Stripe, no accounts — see `12_build_plan.md` Phase 6), so **the list remains the
only thing launch week can actually bank.**

---

## Already shipped — don't rebuild

- **Projector-corner URL.** Renders `RoomRhythm · roomrhythm.org` bottom-right in
  projector mode, driven by `NEXT_PUBLIC_SITE_URL`. Thirty students plus every
  adult entering the room, an hour a day.
  **Fixed Aug 6:** it was `text-sm opacity-40` on near-black — legible on a
  laptop, a ghost on a projector. "Already shipped" was the wrong call: it was
  rendering and invisible, which is worse than missing, because nobody rechecks
  a box that's already ticked. Now `text-lg` at `text-white/55`.
- **OG image.** `public/og-image.png` is 1200×630 with metadata wired. Only the
  paste-into-Facebook render test remains.
- **Print flyer.** `marketing/print/flyer-staff-room.pdf`, QR verified. Free
  channel, aimed at staff lounges during in-service week. Neither channel doc
  mentions it.

---

## Four decisions made Aug 6

### ~~D1. Analytics — ship Plausible now, revisit at portfolio scale~~ — REVERSED Aug 12

**Superseded by D1-R below.** Kept for the record because the objection it raised
was correct and still governs the implementation.

Original decision: ship Plausible, because `lib/analytics.ts` and `layout.tsx`
were already wired for it with a closed event map and it is cookieless by
default. The stated reason to refuse PostHog:

> Our own Instagram card says "No ads, no trackers" and the privacy promise is
> the positioning. PostHog's **default** configuration would make that claim
> shaky.

### D1-R. Analytics — PostHog, configured to hold the privacy claim (Aug 12)

The old objection was about PostHog's *defaults*. It is answered by configuration,
not by hand-waving, and the configuration is now in the repo:

1. **"Cookieless server hash mode"** enabled in PostHog project settings — the
   SDK writes nothing to cookies or localStorage.
2. **`person_profiles: "never"`** in `instrumentation-client.ts` — `identify()`
   becomes a no-op, so no persistent person profile is ever created.
3. The **closed `EventMap`** in `lib/analytics.ts` survived the swap untouched.
   It remains the structural PII guarantee: there is no free-form props channel,
   so roster data cannot reach the wire even by accident.

**These two settings are load-bearing for published marketing copy.** We claim
"cookieless analytics" in `gtm-launch-kit.md` and "no ads, no trackers" in
`gtm-social-profiles.md`. If either setting regresses, those public claims become
false. Treat them as product surface, not configuration.

Why the reversal was worth the churn:

| Tool | Cost | Note |
|---|---|---|
| **PostHog** | **Free to 1M events/mo** | Chosen. Free funnels, and headroom for feature flags at paywall rollout. |
| Plausible | $9/mo, **pageview-based** | Cost scales with the traffic we are trying to grow, and funnels are a Business-plan feature. |
| Umami Cloud | $20/mo flat, unlimited sites | Still the answer if the portfolio ever wants one shared tool. |

The honest costs we accepted: PostHog ships a materially heavier client script
than Plausible's ~1–2KB, which matters more here than for a typical web app
because this runs on classroom projectors over school wifi. And its UI is a
product suite rather than a dashboard — a time sink if we let it be. **If the
PostHog UI starts eating afternoons, that is the signal to go back to Plausible.**
The swap is contained to `lib/analytics.ts` plus one init file; every call site is
transport-agnostic.

### D2. Email capture — NOT on entry

Requested: capture email when someone enters the platform. **Declining, and this
matters.**

"No login, nothing to install, just open it and teach" is the differentiator, and
it's printed on every marketing asset we've made. An entry-gate form makes us
identical to every tool a teacher has already abandoned. We'd trade the single
best thing about the product for a slightly larger list.

**Where it belongs instead: after a completed focus block.** Goodwill peaks when
the thing just worked, and the ask is earned rather than tolled.

`EmailCapture` already supports `run_complete` — but that source is only wired
into the Testing runner. **Gap to close: fire it in Classroom when a focus block
ends.** That's the highest-intent moment in the product and it currently captures
nothing.

**Shipped Aug 6.** Classroom counts completed focus blocks in memory
(`blocksDone`, no storage) and renders the card once the room returns to idle —
so it can never appear over a running clock. This is now the *only* Classroom
capture surface: the share button that previously carried `source="share"` was
removed the same day (see D5).

### D3. Feature-suggest prompt — trigger on sessions, not days

Requested: a prompt after a day of use. **Cannot be built as described.**

Measuring "a day of use" requires persistence, and `CLAUDE.md` permits exactly one
`localStorage` carve-out — the name-picker roster. A second carve-out would need
an explicit amendment.

**Better trigger anyway: after 2–3 completed blocks in one sitting.** Purely
in-memory, no rule change, and it targets *engaged* users rather than merely
returning ones. Someone who ran three blocks today has an opinion worth asking for.

### D4. Beta framing — yes, everywhere except Testing

Lean in. It is honest (no checkout, features shipping weekly), it converts the
gap into an invitation, and it matches the voice already in the launch kit —
solo builder, tell me what to build next. Concretely it buys:

- An accurate reason there's no paid tier yet
- Latitude on bugs teachers would otherwise hold against a "finished" product
- A real reason to give an email — *shape what gets built*, not "join our newsletter"
- A clean runway to founding-member pricing later without bait-and-switch

### D5. Share link — button removed, encoding kept

The Classroom share link copied one teacher's slider positions. The recipient
could reproduce that in ten seconds, and the copy underneath promised subs and
co-teachers a handoff it could not deliver. Shipping a marketing push around it
would have been selling the weakest thing in the product.

**`lib/share.ts` stays untouched** — `SHARE_PARAM`, `decodeShareConfig`, and the
seeding path in `ClassroomApp` all remain, so every link already copied still
opens correctly. The button returns in Phase 4 as **"Copy schedule link"**, where
the payload is a whole period cadence and the sub/headmaster handoff is real.
That is the feature the current copy was describing; it just wasn't built yet.

### D6. Names and Noise are docked panels, not modals

Both were `fixed inset-0` overlays. The two tools a teacher reaches for
*mid-block* — "pick someone", "the room is getting loud" — blanked out the clock
the whole room was watching, which made them unusable exactly when they were
needed. Both are now panels docked to the edges (Names left, Noise right, z-20
under the rail), with the toggle on the side its panel opens from. The timer is
never covered.

The noise bar runs vertically now: it's the shape of the space beside a centered
ring, and a column filling upward reads as a level from across the room.

### D7. Roster CSV import — reduces to "First L." on read

Retyping thirty names per period is why the name picker goes unused; the roster
already exists in the SIS. `namesFromCsv` reads a header row when present
(separate first/last columns, or one full-name column), falls back to the first
column, and handles quoted fields, tabs/semicolons, `Last, First` order, suffixes
and surname particles (`Peter van Dyke` → `Peter V.`).

**The reduction happens during parse, before anything reaches state or storage.**
Student IDs, birthdates, guardian emails, and full surnames are discarded in the
same tick they were read. `file.text()` reads from local disk into the tab —
there is no upload, no FileReader retention, no request. Now a hard rule in
`CLAUDE.md`.

### The carve-out on beta framing

**Never label the Testing profile beta.** A teacher forgives a beta
timer. A proctor does not want a beta clock on exam day, and that audience is the
site-license flywheel. Beta belongs on the landing page, the Classroom profile,
and marketing copy — not on the section runner.

---

## The order

### Today

1. ~~Set the three env vars~~ — done Aug 6, all three environments
2. `git push && npx vercel --prod` — the UI fixes above are still local
3. Browser pass — `launch-verification.md` A–L. **B (pause/resume) and E (mic released)** are unverified by anyone.
   Add: **CSV import** with a real SIS export, and confirm both docked panels
   leave the clock visible at projector size
4. **Capture session** — screen-record: focus block ticking, break transition (the amber→indigo wash is the most watchable thing the app does), two-group extended time, name picker, noise meter

Step 4 gates Pinterest proof pins, the demo GIF, Reels, and a better OG card. One
recording unblocks four channels.

### Tomorrow

5. Rewrite pins 8–11; fix all five URLs
6. Re-render pins: light-background variants + 2–3 screenshot pins
7. Pinterest: business account, claim site via `NEXT_PUBLIC_PINTEREST_VERIFY`, five boards, **repin 15–20 others' pins before posting any of our own**

### This week

8. Schedule the pin batch (see below)
9. Warm-contact emails — `gtm-launch-kit.md` §5.1. **This is the fastest channel
   we have for the Aug 10 start.**
10. Print a dozen flyers for staff lounges

### Sept, not August

11. Facebook groups. The sequence is join → participate one week → post week two,
    which lands the first post around Aug 20 — after most districts start. FB is
    still right, it's just the **Labor Day / Northeast** play, not the Aug 10 one.
12. Reddit, in this order: **r/matheducation** (explicit self-promotion topic tag,
    recent product posts survived) → **r/ELATeachers** → **r/specialed** with the
    accommodations angle. r/Teachers is hostile; that is not a reason to discard
    the three subreddits where research found tolerance.

---

## Scheduling

**Pinterest's own scheduler is free and native — use it for pins.** No third-party
tool needed, and native scheduling avoids any API quirks.

If one tool across Pinterest + Instagram is wanted:

| Tool | Free tier | Verdict |
|---|---|---|
| **Metricool** | **20 posts/month, 1 brand**, 30 days analytics history | Instagram + analytics only — see below |
| Buffer | 3 channels × 10 scheduled posts, **no analytics** | Usable, but blind |
| Tailwind | **5 posts/month** | Too restrictive for a 15-pin batch |

**Correction (Aug 6):** this table previously said Metricool free was 50
posts/month. It is **20**, on 1 brand — enough for ~5 posts/week, which is a
reasonable cadence, not a blocker. Pinterest's own scheduler is free and
unlimited, so the quota is best spent on Instagram unless you want one combined
calendar. Full sequencing in `14_social_runbook.md` §3.

**Pace: 3–5 pins/day maximum on a fresh account.** Higher volume on a new profile
risks a spam flag, and there is no appeal.

---

## What this week can and cannot produce

**Can:** traffic, a verified email list with school domains, and the first read on
which pin format works.

**Cannot:** revenue. There is no checkout. Per `12_build_plan.md`, that's Phase 6.
Launch week's job is to build the list that Phase 6 sells to — which is why B4 is
a blocker and not a nice-to-have.
