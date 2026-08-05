# 11 — Phone Remote (teacher's phone controls the projector)

## This is not the same feature as `07_multidevice_sync.md`

Worth separating clearly, because conflating them has been making this look
harder and further away than it is.

| | Phone remote (this doc) | Shared view (`07`) |
|---|---|---|
| Direction | phone → projector (**control**) | teacher → students (**display**) |
| Devices | 2, both the teacher's | 1 teacher + up to ~35 students |
| Trust | one person, one room | many untrusted clients |
| Failure mode | teacher walks over and clicks | 30 kids see a frozen clock |
| Compliance surface | none — no student data exists in it | student devices, visibility signals |

The phone remote is **materially easier and lower-risk** than student sync. It
should not wait behind it.

## Why a teacher wants it

The projector is at the front. The teacher is not. They are next to a struggling
student in the back row when the block ends, and the options today are: let it
ring out, or walk to the laptop. This is the most common physical friction in
using any front-of-room tool, and it's why teachers end up using their phone
timer instead of the nice screen they set up.

The remote needs exactly five controls. Not a second UI — a remote:

- Start / Pause
- +1 minute / −1 minute (see backlog #4 — "two more minutes" is the whole job)
- Skip to next segment
- Attention signal (backlog #5)
- What's on screen right now, in one line

## What it actually requires

Per `07`, the sync model is **state changes only** — `{startTimestamp,
durationSeconds, phase}` — not per-second updates. Each device derives its own
display. That is already how the runner works internally after the deadline
rewrite, so the wire format is close to what's in memory today.

So the requirement is a small realtime channel plus a pairing code:

1. **Pairing.** Projector displays a short room code and a QR. Phone scans it.
   No account needed for this to work — the code *is* the credential, and the
   channel carries no student data, so a short-lived random room code is
   proportionate.
2. **Transport.** Supabase Realtime, already in the stack per `06`. Avoids a
   second vendor. PartyKit only if presence/latency demands it later.
3. **Authority.** The projector is the source of truth and owns the deadline.
   The phone sends intents ("+1 min"), never state. If the channel drops, the
   projector keeps running correctly and the phone shows "reconnecting" — the
   room must never depend on the phone being alive.

## Honest sequencing

**Not before launch.** It is the first thing that requires a backend, and
RoomRhythm's whole current advantage — no login, no accounts, works offline,
nothing to host — comes from not having one. Shipping a backend the same week as
launch means debugging infrastructure while the first teachers arrive.

Realistic order after the August launch:

1. Launch, gather feedback, watch which profiles get used.
2. Backend foundation (`06`): Supabase project, auth, Stripe. Needed for the paid
   tier regardless of the remote.
3. **Phone remote on Supabase Realtime.** Small surface: one channel, one room
   code, five intents. This is weeks of work, not months — the hard parts
   (deadline-based clock, segment model) already exist.
4. Shared student view (`07` Part A) — much larger blast radius, do it after the
   remote has proven the channel.
5. Exam visibility (`07` Part B) — last, and only with the guardrails in that doc.

## One strategic note

`gtm-strategy.md` §4 anchors the paid tier on exactly two things: the ambient
sound library and phone-remote sync. One free ambient bed now ships in the free
tier (deliberately, for discoverability), which means **the phone remote is
carrying most of the weight of the paid tier.**

That's an argument for building it early in the post-launch order — not for
rushing it in before launch. A paid tier with nothing compelling in it is a
worse problem than a paid tier that arrives in October.
