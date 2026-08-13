# 14 — Social Runbook (from Aug 6, 2026)

**What to do, in order, with your hands.** `13_launch_week.md` owns *what* ships;
this owns *how the accounts get built and fed*. Copy lives in
`gtm-social-profiles.md` — bios, five board descriptions, pin titles,
descriptions, alt text, Instagram captions. Don't rewrite any of it; paste it.

**The clock:** most large US districts start **Monday Aug 10**. Northeast and
upper-Midwest start after **Labor Day, Sept 7** — that second wave is a real
launch, not mop-up. Pinterest takes 4–8 weeks to move, which means pins seeded
this week are aimed at the *September* wave. The Aug 10 wave is won by warm
emails and the staff-room flyer, not by pins.

---

## 0. What actually exists right now

| Asset | State |
|---|---|
| `marketing/pinterest/pin-1..4-*.png` | **4 pins rendered**, 1000×1500 |
| Pins 5–11 | **Copy only, never rendered.** Pins 8–11 also blocked on B1 |
| `marketing/instagram/` | 3 squares + 2 stories rendered |
| `marketing/link-cards/og-*.png` | 3 rendered |
| `marketing/print/flyer-staff-room.pdf` | rendered, QR verified |
| Screenshots of the live app | **None. This is the gap.** |

Four pins is not a Pinterest presence. But **screenshot pins outperform brand
graphics on Pinterest by a wide margin** — teachers are looking for proof a
thing works, not a designed poster. So the capture session is worth more than
rendering seven more graphics, and it feeds Instagram, Reels and the OG card too.

---

## 1. Today, in this order

The ordering matters — done right this is **one deploy**, not three.

### Step 1 · Pinterest business account (10 min)

pinterest.com → sign up, or convert your personal account. **Business, not
personal** — personal accounts have no analytics, no claimed website, no
scheduler.

Paste from `gtm-social-profiles.md` §1:

- **Display name:** `RoomRhythm | Free Classroom Timer for Your Projector`
  (this field is searchable — it is SEO, not decoration)
- **About:** the 500-char block in §1
- **Avatar:** `brand/social-avatars/avatar-400.png`

### Step 2 · Start the website claim, copy the token (5 min)

Settings → **Claimed accounts** → Websites → **Claim** → `roomrhythm.org` →
choose the **HTML tag** method.

Pinterest shows `<meta name="p:domain_verify" content="abc123…">`.
**Copy only the `content` value.** `app/layout.tsx` already wires it.

**Do not click Verify yet.** The tag isn't deployed.

### Step 3 · Set the env var (2 min)

Vercel → room-rhythm → Settings → Environment Variables:

| Key | `NEXT_PUBLIC_PINTEREST_VERIFY` |
|---|---|
| Value | the content value from step 2 |
| Environments | Production, Preview, Development |
| Sensitive | off |

### Step 4 · One deploy (3 min)

```
git push --force-with-lease
npx vercel --prod
```

Carries four commits of UI work *and* the Pinterest tag. Then go back to
Pinterest and click **Verify**.

✅ *Claimed site = attribution on every pin, and pin analytics. Highest-value
setting on the platform, and it takes five minutes.*

### Step 5 · Capture session (20 min) — the real unlock

Screen-record at 1920×1080, then pull stills:

1. A focus block ticking at ~18:42, projector mode
2. The break transition — the amber→indigo wash is the most watchable thing the app does
3. **Two timing groups side by side** on the Testing runner — this is the wedge, nothing else has it
4. The name picker landing on a name
5. The noise meter mid-room, bar in the amber zone
6. The Manual / My Periods tabs

Any recorder works. This gates screenshot pins, the demo GIF, Reels, and a
better OG card — **one recording unblocks four channels.**

### Step 6 · Five boards (10 min)

Create all five from `gtm-social-profiles.md` §2, pasting each description.
Boards rank in search on their own; a bare board is a wasted surface.

1. Classroom Timers & Focus Blocks
2. Exam & Testing Day Setup
3. Classroom Management Tools
4. Back to School Classroom Setup *(mostly repins)*
5. Teacher Tech That's Actually Free *(mostly repins)*

### Step 7 · Repin 15–20 before posting anything of your own

Non-negotiable, and the step everyone skips. A brand-new profile whose entire
history is self-promotion gets suppressed, and there is no appeal. Fill boards 4
and 5 with other people's genuinely good back-to-school content.

**Ratio from here on: 3 repins for every 1 pin of your own.**

---

## 2. Tomorrow (Aug 7) — the pin batch

### Fix the URLs first

Every pin URL in the docs is wrong, and four point at a paywall:

| Doc says | Actual route | Tier |
|---|---|---|
| `/templates/final-exam` | `/templates/seed-final-90` | **free** |
| `/templates/sat` | `/templates/seed-mock-sat` | pro |
| `/templates/act` | `/templates/seed-mock-act` | pro |
| `/templates/ap` | `/templates/seed-mock-ap` | pro |
| `/templates/certification` | `/templates/seed-safety-cert` | pro |

**Route every exam pin to `/templates/seed-final-90`.** It ships Standard, 1.5×
*and* 2×, so it demonstrates the whole extended-time capability for free. Cold
Pinterest traffic landing on a paywall is the worst first impression available
to us, and there's no checkout to convert them with anyway.

### Then post, at 3–5 pins/day maximum

Higher volume on a fresh account risks a spam flag. Order:

| Day | Pins |
|---|---|
| Aug 7 | Pin 1 (classroom timer) → Board 1 · Pin 4 (name picker) → Board 3 |
| Aug 8 | Pin 2 (extended time) → Board 2 · Pin 3 (noise meter) → Board 1 |
| Aug 9–10 | First 2–3 **screenshot** pins from the capture session |
| Weekly | 3–5 new pins, 3 repins each, indefinitely |

Schedule them in **Pinterest's own scheduler** — free, native, no API quirks.

---

## 3. Metricool — what it's actually for

**Correction to `13_launch_week.md`:** the free tier is **20 posts/month on 1
brand**, not 50.

**That is not disqualifying, and an earlier draft of this doc overstated it.**
20/month is ~5/week, which is a fine cadence for a fresh account — Pinterest
rewards consistency far more than volume, and a new profile posting 5 well-made
pins a week for a month looks healthier than one dumping 20 in three days.

The real question is narrower: **should scarce quota go to pins when Pinterest
schedules them free?** Budget it deliberately —

| Use | Posts/month |
|---|---|
| Instagram, 2–3/week | ~10 |
| Pins scheduled *through Metricool* | ~10 |
| Pins scheduled natively in Pinterest | unlimited, free |

If you want one calendar showing everything, spend the quota — the convenience
is real. If you want maximum pin volume, schedule pins natively and let
Metricool own Instagram plus the cross-network analytics view. Either works;
just don't discover the ceiling mid-batch.

Setup (~15 min): metricool.com → free account → connect Instagram (needs a
Business or Creator account linked to a Facebook Page) → optionally connect
Pinterest for read-only analytics. Free gives 30 days of history, so anything
you want long-term, screenshot monthly.

**Don't pay yet.** Revisit in September when PostHog and Pinterest analytics
have told you which channel is actually moving. Paying $25/mo to schedule posts
for an audience you haven't proven is backwards.

---

## 4. Instagram

Bio and three captions are written (`gtm-social-profiles.md` §1, §4).

- **Name field:** `RoomRhythm · Classroom Timer` — this is searchable, don't waste it on the brand name alone
- Post `ig-square-1-hero` first, then 2 and 3 across the following week
- Both stories get a link sticker: story 1 → homepage, story 2 → `/testing`

**Send both story files to every creator you approach.** Creators post far more
often when the asset already exists — cheapest lever available.

---

## 5. Reserve, don't work

`@roomrhythm` on **TikTok** and **X**. Bio in §1. Then leave them. Two accounts
fed properly beats four fed badly, and a dead account with three posts from
August looks worse than no account.

**No Facebook Page.** Teacher groups reject brand pages; the entire Facebook
strategy is you posting as a person, in September, after a week of participating
first.

---

## 6. Where AI actually helps — and where it gets you banned

### Worth it

- **Rendering pin variants.** `marketing/render/rr_pins.py` already produces
  1000×1500 pins from a data structure. Twenty variants — light background,
  different hook, different keyword — is a script run, not a Canva afternoon.
  This is the highest-leverage automation you have and it's already built.
- **Keyword variants of descriptions.** Pinterest ranks title heavily and
  description moderately. Generating ten honest phrasings of the same pin around
  different search terms is a real edge; just check each against
  `docs/09_trademark_and_disclaimers.md` before it ships.
- **Alt text in bulk.** Accessibility *and* indexing, and it's tedious by hand.
- **Reply drafting.** When a teacher comments a question, drafting the reply is
  fine. Sending it unread is not.
- **A `copy-compliance` reviewer.** Run every asset against the hard rules
  before publishing — no "lane" in public copy, no mark in a title, mock/practice
  framing, no "proctoring software."

### Not worth it — actively harmful

- **Fabricated testimonials or invented classroom stories.** You have no users
  yet. A teacher who spots one invented quote will say so publicly, and that's
  the whole brand.
- **Automated DMs or follows.** Fastest route to a Pinterest or Instagram ban,
  and no appeal.
- **Spun copy across many accounts.** Both platforms detect it, and it reads as
  spam to humans first.
- **AI-generated "classroom photos."** Teachers spot these instantly and it
  undercuts the one thing you're selling: someone who understands real rooms.

The honest version of the AI advantage here is **volume of legitimate assets**,
not simulated social proof.

---

## 7. What to measure, and when to judge it

| Signal | Where | Read it |
|---|---|---|
| Traffic by source | PostHog (break the funnel down by `utm_source`) | Weekly |
| Which pin converts | Pinterest analytics (needs claimed site) | Weekly |
| Which ask converts | Formspree `source` field — `run_complete` vs `schedule_waitlist` | Weekly |
| Whether Schedule mode is wanted | count of `schedule_waitlist` | Before starting Phase 3 |

**Do not judge Pinterest in week one.** Pins routinely take 4–8 weeks to gain
traction and then compound for years — the opposite shape from a Facebook post,
which spikes and dies in 48 hours. The failure mode is stopping in week two
because week one was quiet.

**The honest expectation for August:** traffic, a small email list with school
domains, and a first read on which pin format works. Not revenue — there's no
checkout. Launch week's job is building the list Phase 6 sells to.
