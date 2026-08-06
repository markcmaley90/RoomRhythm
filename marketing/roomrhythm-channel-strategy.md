# RoomRhythm — Channel Strategy

*Written August 2026, ahead of back-to-school. Priorities are time-sensitive and should be re-evaluated after September.*

> **Sequencing lives in `docs/13_launch_week.md`.** That doc owns the order of
> operations and the launch blockers, and supersedes this file wherever the two
> disagree. This file owns the *per-channel* reasoning: why each channel is worth
> the time, what the discipline is, and what the format has to be.

---

## The constraint that sets priority

Back-to-school is the highest-leverage window in this product's calendar. Most large districts start **Monday, August 10**; the Northeast and upper Midwest start after **Labor Day, September 7**. Those are two separate launches, not a launch and a mop-up.

Channels are ranked here by **how fast they pay out relative to which wave they can reach.** A channel that needs three weeks of goodwill before the first post cannot serve August 10, however good it is.

---

## Priority 1 — Warm contacts and Pinterest (the Aug 10 wave)

**Warm-contact email is the only channel that can reach the August 10 start.** It needs no account aging, no community standing, and no algorithm. Copy is in `gtm-launch-kit.md` §5.1. Print flyers for staff lounges during in-service week are the physical version of the same move — `marketing/print/flyer-staff-room.pdf` is built and its QR is verified.

**Pinterest is search infrastructure, not a feed.** Pins drive traffic for years, and teacher Pinterest is enormous. The payout curve starts around month three, so it will not move August 10 — but seasonal pins need to be indexed and aging *before* the season they serve, which makes now exactly right to post and exactly wrong to expect results from.

**Approach: batch and forget.**

- Build 15 pins in one 2–3 hour session
- Load into Pinterest's free native scheduler at 3/day across 5 days
- New accounts should not exceed 3–5 pins/day; higher volume on a fresh account risks spam flags, and there is no appeal
- Then stop thinking about it until mid-September, and check analytics then

**Pin copy and board structure:** see `pinterest/roomrhythm-pinterest-pins.md`

**Design direction:** Lead with screenshots of the actual projector view, not designed text cards. The product is a screen — show the screen. Three screenshots (focus block running, break cycle, exam session with two timing groups) support all 15 pins. Each pin needs a visually distinct graphic; the same design reposted 15 times reads as duplicate content and will not be distributed.

**Naming caution:** roomrhythm.com is an unrelated home-and-garden blog with existing Pinterest presence. Do not compete on brand name. Pin titles carry search keywords; brand name goes in the profile only.

---

## Priority 2 — Facebook teacher groups (the Labor Day wave)

**Why:** This is where the first hundred users come from. Teachers organize in large groups by subject, grade, state, and role. They ask each other for tool recommendations constantly. "Free, no login, runs on your projector" is close to the ideal answer to that question.

**Why it is not the August 10 play — this is the correction.** The discipline below is join → participate one week → post week two. Starting the week of August 6, that lands the first post around **August 20**, after most districts have already started. Facebook is still right; it is the **Labor Day / Northeast** channel, and pretending otherwise means either missing the window or skipping the participation step and getting removed.

**The discipline required:** Most of these groups ban self-promotion and admins enforce it. Getting removed from a group is permanent and there is no appeal.

**Sequence:**

1. Join five to eight groups. Target a mix: general teacher groups, subject-specific, first-year teacher groups, and at least one focused on special education or accommodations. Named groups with verified member counts are in `docs/gtm-distribution-pack.md` §2.
2. Read the posted rules of each group. Note which ones allow promotion and on what terms. Do not assume a designated promo day exists — "Tech Tool Tuesday" was not confirmed as an actual rule in any specific group.
3. Week one: participate only. Answer questions. Post no links at all.
4. Week two: post the build story where rules allow.

**The build story is the asset.** A solo developer built a free classroom screen because existing timers could not handle extended-time accommodations. That is a post teachers share. The accommodations angle is the sharpest edge — the people who administer extended time are frustrated and badly served by current tools.

---

## Priority 3 — Instagram Reels + TikTok

**Why:** Teachers are heavy users of both. The product demos in fifteen seconds.

**Format that works:** Screen recording of the projector view. Text overlay states the problem. Cut to the solution.

Example hooks:
- "Running extended time for two students without a second stopwatch"
- "Setting up your whole class period in 20 seconds"
- "The timer problem nobody solves on test day"

**Rules:**
- Post identical video to both platforms. Do not produce separate content.
- Two per week, not daily. Daily video will eat a solo founder shipping code.

---

## Priority 4 — Reddit, in a specific order

Not skipped. **r/Teachers** (~2.4M) is hostile to promotion and screens new/low-karma accounts — but that is one subreddit, and it is not a reason to discard the three where research found actual tolerance. Post from an aged account with real history, and lead with the problem, not the link.

1. **r/matheducation** (~42K) — the most self-promo-tolerant of the set. Has an explicit "Self-Promotion" topic tag and recent product posts that survived. Best first Reddit post.
2. **r/ELATeachers** (~37K) — has hosted soft product-feedback posts in some form.
3. **r/specialed** (~51K) — natural fit for the accommodations angle, which is our sharpest edge anyway.

Treat r/Teachers as a place to participate for a month before ever posting, if at all. Subscriber counts and sourcing: `docs/gtm-distribution-pack.md` §3.

---

## Explicitly skipping

**Twitter/X** — Teacher work-usage collapsed from 70% in 2019 to 10% in 2026. Low ROI for this audience.

**LinkedIn** — Wrong surface for K-12 teachers. Becomes relevant for district site-license outreach, which is a v2 concern.

**Common Sense Education** — paused publishing edtech reviews as of January 2026. Would otherwise be the obvious target.

---

## Blockers

**Tracked in `docs/13_launch_week.md` B1–B4.** The two that gate every channel on this page:

- **`NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is unset** — the script never renders, so every channel here is unattributed and next month's decisions get made on vibes.
- **`NEXT_PUBLIC_FEEDBACK_ENDPOINT` is unset** — there is no checkout, so the email list is the only thing launch week can actually bank.

**Already shipped — do not rebuild:**

- **Projector-corner URL.** `app/page.tsx:599–602` already renders `RoomRhythm · roomrhythm.org` bottom-right in projector mode, driven by `NEXT_PUBLIC_SITE_URL`. Thirty students plus every adult entering the room, an hour a day — the best reach-per-effort ratio available to us. It needs the **env var set**, not new work.
- **OG image.** `public/og-image.png` is 1200×630 with metadata wired. Only the paste-into-Facebook render test remains — that checks the wiring, not the image.

---

## Review point

Re-evaluate in mid-September — after the Labor Day wave has run, not before:
- Which channel produced actual signups (requires Plausible)
- Whether Pinterest impressions have started moving
- Whether any school domain has hit 5+ users, triggering founder outreach
- Whether the Facebook groups joined in August are ready to post into

---

## Copy rules bind marketing too

Every asset described on this page is subject to the hard rules in `CLAUDE.md`,
`docs/02_language_and_ux_rules.md`, `docs/09_trademark_and_disclaimers.md`, and
`brand/BRAND.md` §Voice. The ones that have already been violated twice:

- Never "lane" in public copy — say **timing group**
- Never "Pomodoro" on in-app controls; **Focus Duration** only ("Pomodoro-style"
  is permitted in marketing prose alone)
- Never a third-party mark in a title, tagline, product name, or domain; ® on
  first use, with the verbatim disclaimer from `data/templates/seed.ts`
- Never "proctor" / "proctoring" — RoomRhythm is a room clock
- Never claim to time a **live official administration**
- Privacy claims are about **transmission, not storage**: "nothing is ever
  uploaded" ✅, "no student data collected" ❌

Run `.claude/agents/copy-compliance.md` against any new asset before it ships.
