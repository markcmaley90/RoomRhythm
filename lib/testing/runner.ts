/**
 * Pure runner helpers for the Testing section runner. No React, no timers here.
 *
 * CLOCK RULE (critical): the runner never accumulates seconds via interval ticks
 * (that drifts over a long exam). It stores a DEADLINE (epoch ms) per lane and
 * derives remaining time as `deadline - now`. These helpers do that derivation.
 *
 * WARNING RULE (critical): warning offsets are WALL-CLOCK and never scaled by a
 * lane's timeMultiplier. A "5 minutes remaining" warning fires when THAT lane's
 * own remaining time crosses 300s — so a 1.5x lane fires it later in real time
 * than the standard lane, but at the same true 5-minutes-left moment for itself.
 */

import type { Segment, TimeWarning, AdvanceMode } from "@/lib/testing/schema";
import { warningsFor } from "@/lib/testing/schema";

/**
 * Resolve a segment's advance mode, defaulting anything missing/odd to 'gated'.
 *
 * POLICY NOTE (deliberate decision — not an oversight): the runner treats EVERY
 * segment as hold-at-zero. No segment self-advances past zero; every transition
 * requires an explicit proctor action (guarded early, or unguarded at the gated
 * hold). As a result, `advance: 'auto'` has NO distinct runtime behavior today —
 * it resolves and holds exactly like 'gated'/'manual'. The field is intentionally
 * kept in the schema (and this resolver retained) for template authoring and
 * possible future use; do not remove it on the assumption it's dead.
 */
export function resolveAdvance(seg: Segment): AdvanceMode {
  return seg.advance === "auto" || seg.advance === "manual" ? seg.advance : "gated";
}

/** Whole seconds remaining from a deadline; never negative. */
export function remainingSeconds(deadlineMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
}

/** Stable key so each warning fires exactly once per (segment, lane, offset). */
export function warningKey(segmentId: string, laneId: string, offsetSeconds: number): string {
  return `${segmentId}::${laneId}::${offsetSeconds}`;
}

/**
 * Warnings that should fire NOW for one lane: the lane's remaining time has
 * reached the warning's unscaled offset, the segment isn't over, and this
 * (segment, lane, offset) hasn't fired yet. The caller records fired keys.
 */
export function warningsToFire(
  seg: Segment,
  laneId: string,
  remaining: number,
  fired: ReadonlySet<string>,
): TimeWarning[] {
  if (remaining <= 0) return [];
  return warningsFor(seg).filter(
    (w) => remaining <= w.offsetSeconds && !fired.has(warningKey(seg.id, laneId, w.offsetSeconds)),
  );
}
