# RoomRhythm — Channel Strategy

*Written August 2026, ahead of back-to-school. Priorities are time-sensitive and should be re-evaluated after September.*

---

## The constraint that sets priority

Back-to-school is the highest-leverage window in this product's calendar. School start dates land two to four weeks out depending on district. That window does not come again until January.

This means channels are ranked not by long-term value but by **how fast they pay out.** Pinterest is arguably the better long-term channel and it is still ranked second, because its payout curve starts around month three.

---

## Priority 1 — Facebook teacher groups

**Why:** This is where the first hundred users come from. Teachers organize in large groups by subject, grade, state, and role. They ask each other for tool recommendations constantly. "Free, no login, runs on your projector" is close to the ideal answer to that question.

**The discipline required:** Most of these groups ban self-promotion and admins enforce it. Getting removed from a group is permanent and there is no appeal.

**Sequence:**

1. Join five to eight groups this week. Target a mix: general teacher groups, subject-specific, first-year teacher groups, and at least one focused on special education or accommodations.
2. Read the posted rules of each group. Note which ones allow promotion and on what terms — some have designated days.
3. Week one: participate only. Answer questions. Post no links at all.
4. Week two: post the build story where rules allow.

**The build story is the asset.** A solo developer built a free classroom screen because existing timers could not handle extended-time accommodations. That is a post teachers share. The accommodations angle is the sharpest edge — the people who administer extended time are frustrated and badly served by current tools.

---

## Priority 2 — Pinterest

**Why:** Search infrastructure, not a feed. Pins drive traffic for years. Teacher Pinterest is enormous.

**Why it is not priority 1:** The payout starts around month three. It cannot help with back-to-school this year.

**Approach: batch and forget.**

- Build 15 pins in one 2–3 hour session
- Load into Pinterest's free native scheduler at 3/day across 5 days
- New accounts should not exceed 3–5 pins/day; higher volume on a fresh account risks spam flags
- Then stop thinking about it until mid-September, and check analytics then

**Pin copy and board structure:** see `roomrhythm-pinterest-pins.md`

**Design direction:** Lead with screenshots of the actual projector view, not designed text cards. The product is a screen — show the screen. Three screenshots (focus block running, break cycle, exam session with two timing groups) support all 15 pins.

**Naming caution:** roomrhythm.com is an unrelated home-and-garden blog with existing Pinterest presence. Do not compete on brand name. Pin titles carry search keywords; brand name goes in the profile only.

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

## Explicitly skipping

**Twitter/X** — Teacher community there has largely dispersed. Low ROI for this audience.

**LinkedIn** — Wrong surface for K-12 teachers. Becomes relevant for district site-license outreach, which is a v2 concern.

**Reddit** — r/Teachers is relevant but hostile to promotion. A new account posting a link gets removed and possibly banned. Only viable for an already-established participant. Revisit later, if ever.

---

## Blockers to clear first

**Plausible analytics.** Currently unset. Running any of the above without it means no attribution — next month's decisions get made on vibes. ~30 minutes.

**OG image (1200×630).** Every Facebook group post and every link a teacher forwards to a colleague renders as a blank gray box without it. Verify by pasting the URL into a Facebook composer or Slack and checking the preview actually appears — this tests the metadata wiring, not just the image.

---

## The highest-leverage item on this page

**Put `roomrhythm.org` on the projector screen itself** — small, in a corner, always visible.

Thirty students plus every adult who walks into that room see it for an hour a day. No channel above beats that ratio, and it is one line of code.

---

## Review point

Re-evaluate in mid-September:
- Which channel produced actual signups (requires Plausible)
- Whether Pinterest impressions have started moving
- Whether any school domain has hit 5+ users, triggering founder outreach
