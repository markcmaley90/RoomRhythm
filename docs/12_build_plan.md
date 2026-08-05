# 12 — Build Plan: Manual mode, Schedule mode, and the phone remote

**Decided:** Classroom gets two modes. **Manual** is what exists today. **Schedule**
is a pre-built lesson cadence that runs itself. The phone remote is the next real
feature after the backend. **Student sync is deferred indefinitely** — see §7.

---

## 1. The organizing idea

> **Manual mode** — "I'll drive." Calm / Focus / Break, one block at a time.
> **Schedule mode** — "Here's my period." Segments run in order; the teacher
> confirms each advance.

This split is the whole design. It matters because the two modes serve genuinely
different days: Manual is for the improvised lesson, the sub, the assembly
schedule, the day everything changes at 8:05. Schedule is for the 80% of periods
that follow a cadence the teacher already has in their head.

**Manual stays the default and stays untouched.** A teacher who never opens
Schedule mode must see no change at all. That is the acceptance bar for Phase 2.

---

## 2. Why this is cheaper than it looks

`lib/testing/schema.ts` already defines exactly the right primitive:

```ts
Segment = { id, kind, label, durationSeconds, warnings[], advance }
```

`SectionRunner` already runs an ordered list of those with wall-clock warnings,
gated advance, pause, and live time adjustment. All of it survived today's bug
review and is the best-tested code in the repo.

A lesson agenda is that same structure with friendlier nouns. What it does *not*
need: accommodation groups, verification notices, trademark disclaimers, the
administration log, or tiers.

So the work is **extraction, not invention.**

---

## 3. Phases

### Phase 0 — Launch what exists (now)

No new features. Domain, deploy, screenshots, demo GIF, community posts.
Everything below is post-launch. Nothing here is allowed to delay August.

### Phase 1 — Quick wins (first week post-launch, ~1–2 days)

No architecture change, no new concepts. Pure friction removal.

1. **Visible time-adjust buttons** in Classroom and Corporate: `−1m / +1m / +5m`.
   Port the pattern from `SectionRunner`. Keep arrow keys for clicker users.
2. **Period end time.** Optional "Period ends at __:__". Shows "23 min left in
   the period"; warns before starting a block that would run past the bell —
   warns, never blocks.

**Acceptance:** a teacher can add two minutes without touching the keyboard, and
can see the bell coming. No regression in Manual mode.

### Phase 2 — Extract the shared segment core (~1 day, refactor only)

Move `Segment`, `TimeWarning`, `AdvanceMode`, and the pure helpers out of
`lib/testing/schema.ts` into `lib/schedule/segment.ts`. `TestTemplate` composes
it; nothing else changes.

**This phase ships zero user-visible change.** Per CLAUDE.md's working agreement:
lift one thing, verify parity, commit. Re-run the logic test suite (68
assertions) plus a full Testing-runner browser pass before moving on. If the
Testing profile behaves differently in any way, the refactor is wrong.

### Phase 3 — Schedule mode MVP (~3–5 days)

A Classroom-flavoured runner over the extracted core.

- Segment kinds that read like a lesson: `do-now`, `teach`, `work`, `transition`,
  `share`, `pack-up`, `break`.
- **Ship 3–4 presets** so it's useful before anyone builds their own:
  50-minute period · 90-minute block · elementary literacy block · study hall.
- Gated advance by default, matching the Testing runner: nothing moves on
  without the teacher. A lesson that auto-advances while a student is
  mid-question is worse than no timer.
- Reuse `InterruptDialog` for ending a segment early.

**Storage question — answered:** schedules are **encoded in the URL**, exactly
like today's share links (`lib/share.ts`). A teacher bookmarks
`roomrhythm.com/?s=…` as "Period 3" and it opens ready to run.

This is deliberate and it is better than saving locally:
- No new `localStorage` carve-out, so CLAUDE.md's hard rule stands unamended.
- A schedule is shareable by construction — send your department the link, send
  your sub the link. That reinforces the existing viral loop rather than adding
  a second mechanism.
- Nothing to migrate when the backend lands; accounts later add *saved* schedules
  on top, they don't replace this.

Watch payload size. Four or five segments of base64 is a few hundred characters —
fine. If a schedule ever exceeds ~1,500 characters, shorten the encoding before
shipping it.

### Phase 4 — Schedule builder (~3–4 days)

Add / remove / reorder segments, set durations and labels, then "Copy this
schedule" → a bookmarkable URL. Presets become starting points rather than a
fixed menu.

**Acceptance:** a teacher builds their real Period 3 in under two minutes without
reading anything.

### Phase 5 — Transitions and the attention signal (~2 days)

Both fall out of Phase 3 cheaply:

- **Transition segments** display a large editable instruction line with the
  countdown ("Chromebooks away · notebooks out · page 114").
- **Attention signal** — chime plus a brief full-screen overlay that leaves the
  running clock untouched and returns automatically. Distinct from Calm, which
  is a deliberate reset. This is what stops teachers from just shouting.

### Phase 6 — Backend foundation (see `06_backend_auth_billing.md`)

Supabase project, auth, Stripe. Needed for the paid tier regardless of the
remote. First point at which RoomRhythm stops being purely client-side, so treat
it as its own project with its own verification pass.

### Phase 7 — Phone remote (see `11_phone_remote.md`)

Five controls: start/pause, ±1 minute, next segment, attention signal, and a
one-line readout of what's on screen.

- Pairing: projector shows a short room code + QR; phone scans.
- Transport: Supabase Realtime, state-changes-only.
- **Authority: the projector owns the clock.** The phone sends intents, never
  state. Channel drops → the projector keeps running correctly and the phone
  shows "reconnecting." The room must never depend on the phone being alive.

**Acceptance:** unplug the wifi mid-block. The projector clock stays correct.

### Phase 8 — Station rotation (later)

N groups, a rotation interval, full-screen "Group 3 → Station 1". Sits on the
Phase 3 engine; the rotation map is the only new logic. Differentiated, and an
obvious Pinterest/Instagram demo.

---

## 4. Order and rough size

| Phase | What | Size | Gate |
|---|---|---|---|
| 0 | Launch | — | domain + deploy |
| 1 | Adjust buttons, period end time | 1–2 d | — |
| 2 | Extract segment core | 1 d | Testing parity verified |
| 3 | Schedule mode MVP + presets | 3–5 d | Phase 2 |
| 4 | Schedule builder | 3–4 d | Phase 3 |
| 5 | Transitions + attention signal | 2 d | Phase 3 |
| 6 | Backend foundation | project | launch feedback in hand |
| 7 | Phone remote | 1–2 wk | Phase 6 |
| 8 | Station rotation | 1 wk | Phase 3 |

Sizes assume solo evenings-and-weekends pace, and are deliberately not dates.

---

## 5. What Schedule mode must not become

- **Not a lesson planner.** It times a cadence. It does not hold objectives,
  standards, materials, or content. The moment it stores lesson content it
  becomes something a district has to approve.
- **Not a gradebook, tracker, or participation monitor.** Nothing in Classroom
  observes students. That boundary is why teachers will trust it.
- **Not mandatory.** Manual mode is the default forever. Schedule is opt-in.

---

## 6. Effect on the paid tier

Free stays genuinely useful: Manual mode, Schedule mode, presets, one ambient
bed, name picker, noise meter, share links.

Paid anchors on scale and daily convenience: the full ambient library, the phone
remote, saved schedules synced across devices (once accounts exist), and the
Testing templates beyond the free one.

Note the shape of that: **every paid feature is a convenience for a heavy daily
user, not a lock on the core.** That is the model from `gtm-strategy.md` §4 and
this plan keeps it.

---

## 7. Student sync — deferred indefinitely

`07_multidevice_sync.md` stays as a written spec and is **not scheduled.**

The reasoning: it is 35 untrusted client devices, a compliance surface involving
minors, and a failure mode where an entire class watches a frozen clock. The
phone remote delivers most of the practical value — the teacher not being chained
to the laptop — for a fraction of the risk.

Revisit only if teachers actually ask for it after launch, and only Part A
(read-only shared view). Part B (exam visibility) stays parked behind the
guardrails already written in `07`.
