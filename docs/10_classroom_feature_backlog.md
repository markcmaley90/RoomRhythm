# 10 — Classroom Feature Backlog (teacher's-eye view)

Written from the perspective of a teacher who would run this on the projector
every period, every day. Ordered by *how often the need occurs in a real class*,
not by how interesting it is to build.

Guardrail on all of it (from CLAUDE.md): a teacher who never gives a test should
find RoomRhythm complete and delightful. Nothing below requires the Testing
profile to be visible.

---

## 1. Agenda mode — the single biggest unlock, and it's ~70% built

**The need.** No period is one block. A real 50 minutes is:

> Do Now 5m → Mini-lesson 12m → Work time 20m → Share out 8m → Pack up 3m

Right now Classroom times *one* block at a time, so the teacher is the scheduler:
they have to remember what's next, reset the timer, and re-enter a duration —
four or five times a period, while also teaching. That's the actual daily
friction, and it's why most teachers eventually give up on classroom timers.

**Why it's cheap.** `lib/testing/schema.ts` already models exactly this:
`segments[]` with `kind`, `label`, `durationSeconds`, `warnings[]`, and an
advance mode. `SectionRunner` already runs that sequence with warnings, gated
advance, and a pause. **The Testing engine is a lesson sequencer that currently
only knows how to be an exam.**

**What to build.** A Classroom-flavoured runner over the same schema: friendlier
labels, no administration log, no accommodation groups, and segment kinds that
read like a lesson (`do-now`, `teach`, `work`, `share`, `pack-up`). Ship 3–4
preset agendas (50-min period, 90-min block, elementary literacy block) so it's
useful before anyone builds their own.

**Why it matters commercially:** this is also the honest bridge to the Testing
profile. A teacher who runs an agenda every day already understands segments,
warnings, and gated advance — so test day is the same tool with different labels,
not a new product to learn.

---

## 2. Period end time — nobody does this, and every teacher thinks this way

**The need.** Teachers do not think in durations. They think *"this period ends
at 10:42."* The mental math of "it's 10:19, I have a 20-minute block planned, do
I have time?" happens constantly and is the source of most overruns.

**What to build.** An optional "Period ends at ⏰ __:__" field. Once set:

- A quiet secondary readout: **"23 min left in the period."**
- When a block is started that would run past the bell, say so *before* it
  starts: "This ends 4 minutes after the bell." Don't block it — teachers
  overrun deliberately all the time — just don't let it be a surprise.
- On the projector, students see the period countdown too, which quietly ends
  the "how much longer?" question.

**Cost:** small. Pure client-side, no backend, no new dependency. Highest
value-to-effort ratio on this list.

---

## 3. Transition instructions on screen

**The need.** The hardest 90 seconds of any period is not the focus block — it's
the transition. "Chromebooks closed and away, notebooks out, page 114." Said
once, out loud, to a room that is already moving. Half of them didn't hear it.

RoomRhythm already puts a *break* prompt on screen (`randomBreak`). The same
mechanism aimed at transitions is more valuable, because a transition instruction
is something students need to *read repeatedly* while they do it.

**What to build.** A short editable text line that displays large during a
transition segment, with a countdown. In agenda mode (#1) this is just a segment
kind. Standalone, it's a "Transition" button next to Calm/Focus/Break with a text
field and a 60/90/120s timer.

---

## 4. Visible time-adjust buttons in Classroom

**The need.** "Two more minutes" is said in every classroom in the world. It's
the single most frequent interaction with a classroom timer.

Right now Classroom only supports ↑↓ arrow keys at ±5 seconds. That is
undiscoverable — no teacher will find it — and 5 seconds is the wrong unit. The
Testing runner already has the right idea with visible **−1m / +1m / +5m**
buttons.

**What to build.** Port those buttons to Classroom and Corporate. Ten minutes of
work, removes a daily friction. (Keep the arrow keys for anyone with a clicker.)

---

## 5. Attention signal that doesn't destroy the block

**The need.** Mid-work-time, the teacher needs the room's eyes for 20 seconds —
one correction, one clarification — then work resumes. Today the only attention
tool is **Calm**, which resets the block. So teachers just shout instead.

**What to build.** A chime plus a brief full-screen visual that overlays the
running timer **without touching it**. The clock keeps running behind it and
returns automatically after a few seconds. Distinct from Calm, which is a
deliberate reset.

---

## 6. Station rotation

**The need.** Centers and stations are standard practice in elementary and
increasingly common in secondary. Four groups, rotate every 12 minutes, and
somebody always ends up in the wrong place.

**What to build.** On top of the agenda engine (#1): N groups, a rotation
interval, and a full-screen "Group 3 → Station 1" display at each turn. The
rotation map is the whole feature; the timing is already solved.

**Cost:** moderate, and it depends on #1. But it is a genuinely differentiated
feature — no free classroom timer does station rotation well, and it's an
obvious Pinterest/Instagram demo.

---

## 7. Smaller things a daily user would notice

- **Colour-blind safety.** Focus (indigo) vs Break (emerald) vs near-end (red)
  should also differ in shape or label, not just hue. ~8% of boys have a colour
  vision deficiency; a projector plus fluorescent lighting makes it worse.
- **A "sub mode" landing.** Share links already carry the setup. A one-line
  "Your teacher left these instructions" banner on a shared link would make it a
  genuine sub-plans tool.
- **Elapsed instead of remaining.** Some teachers deliberately hide remaining
  time during writing tasks to reduce anxiety. A toggle costs nothing.
- **Don't sleep the display.** A projector screen that dims mid-block is a real
  annoyance. The Screen Wake Lock API handles this in Chrome and is a few lines.

---

## Sequencing recommendation

Post-launch, in this order:

1. **#4 (adjust buttons)** and **#2 (period end time)** — days, not weeks, and
   both remove daily friction. Do them in the first post-launch week.
2. **#1 (agenda mode)** — the real project. Reuses the template engine, and it
   is what turns RoomRhythm from a timer into the thing that runs the period.
3. **#3 (transitions)** and **#5 (attention signal)** — fall out of #1 cheaply.
4. **#6 (station rotation)** — the differentiated demo feature, once #1 is solid.

Deliberately **not** on this list: anything resembling monitoring, participation
tracking, or behaviour scoring in the Classroom profile. That is the boundary
that keeps this a tool teachers trust.
