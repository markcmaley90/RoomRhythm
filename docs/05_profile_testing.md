# 05 — Testing Profile (proctoring) — the differentiated asset

## Purpose
A **test-day timing and administration clock** for in-person exam rooms. Scope it precisely: RoomRhythm handles the *clock, pacing, accommodations, and audit trail* — NOT remote webcam monitoring, AI cheat detection, or kernel-level browser lockdown. Those belong to a separate, heavily regulated market (Honorlock, Respondus, Exam.net) that needs FERPA/SOC2 posture and is out of scope for a solo dev. Staying in the "test-day operations" lane is a feature, not a limitation.

## BUILT
- SAT / AP / custom section templates.
- Section runner with auto/manual advance.
- Mandated warning banners at 30 / 10 / 5 min.
- Extended-time 1.5x accommodation lane.
- Between-section review screens.
- Projector support for the test room.
- Administration log with timestamps.

## NEXT (deepen the moat — this is where paid value concentrates)
- **Persistent administration log** (survives refresh, exportable PDF/CSV) — turns a nice UI into an audit artifact schools need. Requires backend.
- More accommodation lanes (2x, individual custom multipliers) + per-student accommodation config.
- Template library for common test regimes (state assessments, IB, GRE-style).
- Room roster + who's on which accommodation (auth + backend).

## LATER
- Multi-room / district view for a testing coordinator.
- Import section timings from a config file.

## Why this profile matters
This is the wedge and the switching-cost. Once a school runs test day on RoomRhythm — with saved accommodation configs and an exportable admin log tied to their audit process — replacing it means retraining staff and rebuilding configs. That is the durable lock-in. Prioritize the persistent, exportable admin log above cosmetic work.

## Compliance gate
The moment section runs or admin logs store any student identifier, this profile is subject to FERPA / COPPA (under-13) / state student-privacy laws (California SOPIPA applies to the founder's location). See `06_backend_auth_billing.md` -> Compliance BEFORE storing student data. Prefer storing initials/seat numbers over full PII where possible.
