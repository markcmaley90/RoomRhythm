# 07 — Multi-Device Sync (teacher controls, students view-only)

> **STATUS: DEFERRED INDEFINITELY — spec only, not scheduled.**
> Decided July 2026. This is 35 untrusted client devices, a compliance surface
> involving minors, and a failure mode where a whole class watches a frozen
> clock. The **phone remote** (`11_phone_remote.md`) delivers most of the real
> value — the teacher not being chained to the laptop — for a fraction of the
> risk, and is scheduled instead. Revisit only if teachers ask for this after
> launch, and then Part A (read-only view) only. See `12_build_plan.md` §7.

## Goal
Teacher's device controls the room clock; student devices join and mirror it. Room code + QR to join. Teacher dashboard shows who's connected / on-tab.

## Key realization about sync cost
A timer does NOT need per-second network sync. Broadcast **state changes only**: `{startTimestamp, durationSeconds, phase, serverOffset}`. Each client computes the current display locally from that. Network traffic is tiny and infrequent (start/pause/advance events), which massively de-risks the backend.

## Stack decision: PartyKit vs Supabase Realtime
- Original plan named **PartyKit**. It's excellent for high-frequency ephemeral rooms.
- But given the "state-changes-only" model above, **Supabase Realtime** (already in the stack from `06`) likely covers the view-only case — letting you **avoid a second vendor entirely**. One backend for auth + billing + data + sync.
- Recommendation: prototype view-only sync on Supabase Realtime first. Only reach for PartyKit if you later need presence/latency characteristics Supabase can't meet.

## Tab monitoring — known boundary
Forcing tab focus is a hard browser security boundary; it cannot be enforced without a browser extension. Page Visibility API can *detect and flag* a student leaving the tab, and fullscreen can be *requested* (not forced). Ship detection-and-flag; do not promise enforcement. Full lockdown is a different product (see `05` scope note).

## Build order
1. Room creation (teacher) -> room code + QR.
2. Student join (view-only) via Supabase Realtime channel.
3. Broadcast state-change model above.
4. Teacher dashboard: connected devices + Page-Visibility on/off-tab flags.
5. LATER: assignment mode / doc work in-app (revisit compliance in `06`).

## Status: LATER (v2/v3). Do git + backend + billing first.
