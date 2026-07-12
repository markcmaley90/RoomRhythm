# RoomRhythm — Go-to-Market Strategy

**Status:** Adopted
**Date:** July 11, 2026
**Owner:** Mark
**Location:** `/docs/gtm-strategy.md` (repo) · mirrored in Drive → GTM docs
**Companion doc:** `/docs/gtm-punch-list.md` (Claude Code build items)

---

## 1. Strategic decision: bootstrap, don't raise

RoomRhythm will not seek venture funding for the MVP launch.

**Rationale:**

- K-12 edtech venture funding has collapsed roughly 89% from its 2021 peak (HolonIQ), and the remaining capital is concentrating in AI tools and workforce platforms. A classroom utility tool is the exact profile investors have exited: low ACV, long district sales cycles, hard-to-prove outcomes.
- RoomRhythm's cost structure is near zero. Static Next.js app, no backend, no per-user infrastructure cost until multi-device sync ships (and PartyKit is cheap even then).
- The closest comp proves the bootstrap path: Classroomscreen serves 1M+ teachers on a free-forever tier with a $36/year Pro plan and school/org licenses — built without venture scale.
- Raising now would mean dilution for capital we can't deploy, plus pressure toward a premature district sales motion before the domain-signal flywheel has produced evidence.

**Revisit triggers (any one):**

1. Domain-signal flywheel is working and district pull exceeds what a solo founder can service.
2. A funded competitor moves directly on the test-day wedge.
3. 10+ school domains have 5+ active users each AND multiple inbound site-license requests.

If capital is ever needed: angels or revenue-based financing before VC.

---

## 2. Positioning

**Category:** Classroom screen / room control. Never "a timer" (commodity, free everywhere). Never "proctoring software" (mission violation; the proctoring category — Honorlock, Proctorio — carries serious reputational baggage with teachers and students).

**Core line:**

> **The screen that runs your room.**

**Wedge claim (unique, defensible):**

> **The only classroom screen that can also run test day.**

**Contrast frame:** Classroomscreen is a whiteboard with 26 widgets — a grab-bag. RoomRhythm is *opinionated about time*: focus blocks, breaks, transitions, sound, and test day in one coherent flow. We don't fight the widget-count war; we own the clock.

**Proof points for the wedge:**

- Extended-time accommodation lanes (1.5× / 2×) — no competitor handles this; proctors currently juggle multiple physical stopwatches.
- Correctly unscaled warnings (mandated announcements fire at true offsets per lane).
- Gated advance by default — nothing auto-advances silently during a live exam.
- PII-free administration log (initials + seat numbers only).

**Market reality constraint (critical for messaging):**

The official SAT and most AP exams are now digital in Bluebook, which times itself — College Board explicitly instructs proctors *not* to time the test. Therefore the Testing profile's real market is:

1. Teacher-made finals and midterms (largest volume)
2. Department and school-wide exams
3. Paper-administered state tests
4. **Mock SAT/ACT at tutoring and test-prep centers** ← highest-intent paid buyer
5. Corporate certification exams

### Messaging rules

| Say | Never say |
|---|---|
| "Run your final exam" | "Run the SAT" |
| "Proctor a practice SAT" / "Mock SAT" | "SAT administration" |
| "Focus Duration" (in-app) | "Pomodoro" (in-app — landing tagline only) |
| "Test day for *your* exams" | Anything implying College Board affiliation |
| "Names never leave this device" | Anything implying monitoring in Classroom mode |

**Trademark posture:** SAT®, AP®, ACT® with ® on first use plus a standing disclaimer: *"SAT® and AP® are registered trademarks of College Board. ACT® is a registered trademark of ACT, Inc. Neither is affiliated with, nor endorses, RoomRhythm."* This disclaimer appears on every template landing page and inside the Testing profile.

---

## 3. Segments

| Segment | Role | Motion |
|---|---|---|
| Teachers (MS/HS core, elementary secondary) | Daily users, viral surface | Free, self-serve, no login |
| Tutoring & test-prep centers | Highest-intent Testing buyer | Self-serve → Pro |
| School testing coordinators | Site-license buyer | Domain-signal founder email |
| Corporate trainers | Secondary | Self-serve |

---

## 4. Pricing

**Launch posture: 100% free. No payments at launch.** The goal of the launch window is maximum reach and email/domain capture, not revenue. Building Stripe now is a distraction.

**Planned structure (activate when traction warrants):**

- **Free forever:** full Classroom core — timer, sounds, breaks, projector mode. No login required to use; login only to save setups. Wordmark visible in projector mode.
- **Pro (individual): $36/year** — matches the Classroomscreen anchor. Unlimited saved setups, hide projector wordmark, full Testing template library + accommodation lanes + log export. (Exact free/paid line is an open decision — finalize before payments ship.)
- **Room/Admin tier: $10/month** — reserved for admin/room-level plan per prior decision.

---

## 5. Channels (in priority order)

### 5.1 SEO — primary channel

High-intent, low-competition queries. Target list:

- final exam timer
- exam timer with extended time / exam timer accommodations
- classroom timer for projector
- mock SAT timer / SAT practice test timer
- ACT practice timer
- AP exam practice timer
- test proctor timer
- focus timer for classroom

**Mechanism:** every seed template gets a public, indexable landing page (SEO surface + shareable link). Sitemap, metadata, FAQ structured data. Nobody else can rank for "exam timer extended time" with a real answer — the moat compounds quietly here.

### 5.2 Projector viral loop

The product is displayed to ~30 people at a time, including colleagues, subs, and admins. A small, tasteful wordmark in projector mode plus shareable session links ("send your sub this screen") is built-in distribution.

### 5.3 Teacher communities

Facebook teacher groups, X/edu hashtags, Pinterest classroom-management boards, Instagram teacher accounts. **Rules of engagement:** post as a builder sharing a free tool, never as a marketer. Give the tool away, answer questions, never spam. One genuine post per community, then respond to demand.

### 5.4 Micro-influencer gifting

Identify ~10 teacher creators (IG/TikTok, 5k–50k followers). Gift early Pro access, no strings. One authentic "here's my class timer setup" video outperforms any ad spend.

### 5.5 Seasonal calendar

| Window | Push |
|---|---|
| **Jul–Aug (NOW)** | Back-to-school — Classroom profile launch |
| Oct | PSAT / early mock-test season — Testing content |
| Dec | Finals week — Testing profile hero moment |
| Mar–Apr | State testing windows |
| May | AP season + spring finals |

### 5.6 Warm pilots

2–3 warm school contacts → pilot sites. Goal: one testing coordinator standardizes one hallway for December finals. That is the first real test of the distribution thesis.

---

## 6. Sales motion: the domain-signal flywheel

There is no sales team. There is one email.

1. Capture school-domain emails at save moments (optional field, Formspree initially).
2. **Trigger:** 5+ users on one school domain.
3. Founder email to the testing coordinator or principal (template below) offering a site license and free test-day setup help.
4. Pilot → site license → district conversation.

### Founder email template (appendix)

> **Subject:** 6 teachers at [School] are using RoomRhythm — want it set up for finals week?
>
> Hi [Name],
>
> I'm Mark, the builder of RoomRhythm — a free classroom screen for focus blocks, breaks, and timed exams. I noticed [N] teachers at [School] have started using it on their own, so I wanted to reach out directly.
>
> The part schools tend to care about: it runs timed exam sections with extended-time accommodations (1.5×/2×) side by side, fires the mandated 30/10/5-minute announcements automatically for each lane, and keeps an administration log with no student PII.
>
> If it'd be useful, I'll set up your finals-week templates for free — takes about 20 minutes on a call, or I can just send them ready to use.
>
> Either way, thanks for having teachers who found it on their own.
>
> Mark
> RoomRhythm

---

## 7. 90-day plan (Jul 11 – Oct 10, 2026)

**July:** Finish Testing MVP (section runner). Ship P0 punch list (SEO foundation, template landing pages, share links, wordmark, name picker, noise meter, language audit). Launch quietly.

**August:** Back-to-school push. Community seeding (5–8 posts across FB groups/Pinterest/X). Influencer gifting. Email capture live.

**September:** Iterate on feedback. Pilot outreach to warm contacts for December finals. First domain-signal review.

**October:** PSAT/mock-season content. Review usage data → finalize free-vs-Pro line.

---

## 8. Metrics (weekly)

- Sessions started (by profile)
- Template launches (by template)
- Share-link copies
- Email captures / distinct school domains
- **Domains with 5+ users** ← the flywheel metric
- Pilot schools committed

---

## 9. Mission guardrails (non-negotiable)

1. **The classroom-first test:** a teacher who never gives a test must find RoomRhythm complete and delightful. Any feature that makes the app feel like proctoring software to that teacher is wrong.
2. **The sync split:** multi-device sync ships in two halves. The shared-view half (students see the timer and prompts on their own devices — pure display) can live everywhere. The visibility-flagging half lives *only* inside the Testing profile, framed as exam integrity, and never surfaces in Classroom mode.
3. **No PII, ever,** in logs, analytics, or storage. Rosters (name picker) live in localStorage only — "names never leave this device."
4. **Privacy-friendly analytics only** — cookieless, no individual tracking. Schools notice.
5. **Projector mode never shows surveillance UI** of any kind.

---

*Sources informing this strategy: HolonIQ edtech investment reports (2024–2025), Classroomscreen public pricing and user counts, College Board Bluebook proctor documentation, competitive review of exam-timer tools (visualtimer.com, online-stopwatch.com), and teacher tool-discovery channel research.*
