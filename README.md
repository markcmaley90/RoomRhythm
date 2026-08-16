# RoomRhythm

**[roomrhythm.org](https://roomrhythm.org)** — a free, browser-based room clock for
classrooms, training rooms, and test day. No account, no install, nothing to
configure before it's useful.

Next.js (App Router) · React · TypeScript · Tailwind. Solo project.

---

## What it does

Three profiles, one screen, sized to be read from the back of a room.

**Classroom** — grade-banded focus blocks, brain breaks that cycle on their own,
a random name picker with no-repeat mode, and a microphone-based noise meter that
chimes when a room stays too loud.

**Corporate** — the same cadence for training sessions and workshops.

**Testing** — the part nothing else does. Standard and extended-time students run
side by side on one screen, each timing group with its own countdown and its own
announcements. Warnings are wall-clock and never scaled, so "5 minutes remaining"
means five real minutes for every group hearing it.

---

## Run it

```bash
npm install
npm run dev        # http://localhost:3001
```

No environment variables are needed. Analytics, feedback capture and the
site-URL wordmark all no-op cleanly when unset, so a fresh clone runs complete.

---

## The constraints, and why they exist

Most of what's interesting here is what the code refuses to do. These are
enforced in `CLAUDE.md` and, where possible, by the compiler rather than by
convention.

**Student names are reduced before they're stored, not after.** The roster
importer parses a CSV and converts `Rodriguez, Jonathan, 2011-04-02, 100234`
into `Jonathan R.` *during parsing* — the surname, birthdate and student ID are
discarded in the same tick they were read. There is no point in the program's
lifetime at which the full record exists in state. See `namesFromCsv` in
`lib/rosters.ts`.

**Analytics cannot receive student data, structurally.** `lib/analytics.ts`
exports a `track()` whose event names and prop shapes are a closed map. There is
no free-form props channel, so roster names, initials, seat numbers and
administration-log contents are rejected by the type checker rather than by a
code-review guideline.

**The administration log has no field for a student's name.** Initials and seat
number only. Not validated against — simply absent.

**One localStorage carve-out, documented and bounded.** The name-picker roster
may persist on the device. Nothing else does, and nothing persisted is ever
transmitted, synced, or included in a share link.

**Third-party trademarks stay out of product names and taglines.** Test
templates that reference a mark carry a source-identifying name plus a
disclaimer rendered everywhere the name appears. `docs/09_trademark_and_disclaimers.md`
has the rules; `data/templates/seed.ts` has the implementation.

---

## Things worth reading if you're poking around

**Deadline-based timers** (`app/page.tsx`). Browsers throttle `setInterval` in
backgrounded tabs — Chrome drops to roughly once a minute. A timer that
decrements per tick silently runs long, so a teacher who alt-tabs for twenty
minutes returns to a projector still showing most of that time as remaining. The
clock stores the wall-clock moment a block ends and derives the display from it,
which makes throttling cosmetic.

**The noise meter took three fixes to work** (`components/NoiseMeter.tsx`).
`getUserMedia({ audio: true })` returns a stream tuned for video calls, with
automatic gain control on by default — it normalises the signal, so a loud room
gets pulled back down within a second or two and the meter appears to give up.
Separately the scale was linear where hearing is logarithmic: ordinary
conversation registered 6 out of 100. And symmetric smoothing let a loud room dip
below the threshold and reset the sustain counter. All three had to go.

**Screenshot pins are composited by script** (`marketing/render/`). Pinterest
assets render from the app's own palette and vendored fonts via Pillow, including
a step that measures the bounding box of the interface and centres it — because
every crop set by eye was off by 30–70px and I kept judging it instead of
measuring it.

---

## Layout

```
app/            routes and the room UI
components/     name picker, noise meter, testing runner, email capture
lib/            rosters, audio synthesis, analytics, share encoding
data/templates/ test templates and their disclaimers
docs/           specs, build plan, launch and GTM notes
marketing/      brand assets and the scripts that render them
CLAUDE.md       hard rules, loaded by Claude Code every session
```

Start at `docs/00_SPEC_INDEX.md`.

---

## Scope boundary

RoomRhythm is a **room clock**. It is not the clock for a live official
administration — the digital SAT times students individually inside College
Board's Bluebook app, and state and licensing exams ship their own platforms. It
is not webcam proctoring and it does not detect cheating. It times
school-created exams, mock and practice administrations, and corporate training.

Sound is synthesised with the Web Audio API; there are no audio files.

---

© Mark Maley. All rights reserved. Public for reading — not licensed for reuse.
