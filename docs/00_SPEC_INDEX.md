# RoomRhythm /docs — Spec Index (read first)

1. `01_architecture.md` — modular structure + migration order.
2. `02_language_and_ux_rules.md` — HARD rules.
3. `03_profile_classroom.md`
4. `04_profile_corporate.md`
5. `05_profile_testing.md`
6. `06_backend_auth_billing.md`
7. `07_multidevice_sync.md`
8. `08_test_template_engine.md` — the moat. Schema, scope boundary, build order.
9. `09_trademark_and_disclaimers.md` — HARD rules on SAT®/ACT®/AP®.
10. `10_classroom_feature_backlog.md` — teacher's-eye feature backlog, ordered by
    how often the need occurs in a real period. Agenda mode is the big one.
11. `11_phone_remote.md` — the teacher's-phone remote, separated from `07`
    student sync (different feature, much smaller, should not wait behind it).
12. `12_build_plan.md` — **the current roadmap.** Manual vs Schedule mode,
    phased order, sizes, and what Schedule mode must never become.
13. `13_launch_week.md` — **the single answer to "what am I doing this week."**
    Owns sequencing where the GTM docs disagree. Carries the pin blockers.

`07_multidevice_sync.md` is **DEFERRED indefinitely** — spec only, not scheduled.
See `12` §7.

## Status legend
**BUILT** = shipped. **NEXT** = current cycle. **LATER** = v2/v3.

## Working agreements
- Migrate incrementally: lift one feature, verify parity, commit. No big-bang rewrites.
- Durations in seconds. Always.
- Check `09` before any copy referencing a named test.
