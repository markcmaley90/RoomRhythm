/**
 * RoomRhythm — Test Template Engine
 * Core schema. Serves three domains with ONE engine:
 *   - School-created exams (finals, midterms, benchmarks)
 *   - Mock/practice admissions tests (SAT®, ACT®, etc.)
 *   - Corporate / warehouse training & certification sessions
 *
 * DESIGN RULE: durations are ALWAYS stored in seconds (integers).
 * Never store "minutes" — unit ambiguity is how timing bugs ship.
 */

/** Who the template is for. Drives copy, icon, and default announcements. */
export type TemplateDomain = 'school_exam' | 'practice_admissions' | 'corporate_training';

/** How the runner moves from one segment to the next. */
export type AdvanceMode =
  | 'auto'      // advance the instant the clock hits zero
  | 'manual'    // wait for proctor to press Next (required for most paper exams)
  | 'gated';    // clock hits zero, but proctor must confirm before the next segment starts

/** What kind of segment this is. Affects styling and whether accommodations apply. */
export type SegmentKind =
  | 'section'      // a timed, scored portion — accommodations APPLY
  | 'break'        // a rest period — accommodations do NOT apply by default
  | 'instructions' // proctor reads a script; usually untimed or loosely timed
  | 'transition';  // collect/distribute materials, seat change, etc.

/**
 * A warning shown to the room at a fixed offset before a segment ends.
 * offsetSeconds = seconds REMAINING when the warning fires.
 * e.g. { offsetSeconds: 300 } fires with 5 minutes left.
 */
export interface TimeWarning {
  offsetSeconds: number;
  /** Banner text. Keep short — must read from the back of a room. */
  label: string;
  /** If true, the proctor is expected to read this aloud (mandated scripts). */
  spoken?: boolean;
  /** Play the audio warning tone in addition to showing the banner. */
  sound?: boolean;
}

/**
 * An accommodation lane. The runner can display multiple lanes side by side,
 * each with its own clock, so one proctor can run standard + extended time.
 */
export interface AccommodationLane {
  id: string;
  label: string;              // "Standard", "Extended time (1.5x)", "Double time (2x)"
  /** Multiplier applied to every `section` segment's duration. 1 = standard. */
  timeMultiplier: number;
  /** Extra seconds added to each break. 0 = same breaks as standard. */
  extraBreakSeconds?: number;
  /** If true, this lane gets its own break schedule rather than the shared one. */
  separateBreaks?: boolean;
}

/** One step in the test. */
export interface Segment {
  id: string;
  kind: SegmentKind;
  label: string;                    // "Reading & Writing — Module 1"
  durationSeconds: number;          // 0 = untimed (proctor advances manually)
  advance: AdvanceMode;
  warnings?: TimeWarning[];
  /** Script the proctor reads aloud before this segment starts. */
  announcement?: string;
  /** Accommodation multipliers do not apply when false. Defaults: true for 'section'. */
  accommodationsApply?: boolean;
  /** Proctor-facing notes; never shown on the projector. */
  proctorNotes?: string;
}

/** Attribution required when a template references a third-party trademark. */
export interface TrademarkNotice {
  /** The mark as it must appear, including ®. e.g. "SAT®" */
  mark: string;
  /** Full disclaimer text rendered wherever the template name appears. */
  disclaimer: string;
}

export interface TestTemplate {
  id: string;
  /** Display name. If it references a trademark, `trademark` MUST be populated. */
  name: string;
  domain: TemplateDomain;
  description?: string;

  /** Access tier for gating. Absent = treated as locked/Pro (fail closed). */
  tier?: 'free' | 'pro';

  segments: Segment[];
  accommodationLanes: AccommodationLane[];

  /** Required whenever `name` or any segment references a third-party mark. */
  trademark?: TrademarkNotice;

  /** Every template ships with this. Non-optional by design. */
  verificationNotice: string;

  /** Provenance + staleness tracking. Specs change; this is how we know. */
  meta: {
    /** 'seed' = shipped by RoomRhythm. 'user' = built in-app. 'shared' = community. */
    source: 'seed' | 'user' | 'shared';
    version: number;
    /** ISO date. Surface a "last verified" badge in the UI. */
    lastVerified: string;
    /** Where the timings came from, so anyone can re-check them. */
    sourceUrl?: string;
    authorId?: string;
  };
}

/** ---------- Derived helpers (pure; easy to unit test) ---------- */

/** Duration of a segment for a given lane. Breaks ignore the multiplier. */
export function segmentDurationFor(seg: Segment, lane: AccommodationLane): number {
  const applies = seg.accommodationsApply ?? seg.kind === 'section';
  if (seg.kind === 'break') {
    return seg.durationSeconds + (lane.extraBreakSeconds ?? 0);
  }
  if (!applies) return seg.durationSeconds;
  return Math.round(seg.durationSeconds * lane.timeMultiplier);
}

/** Total seated time for a lane, including breaks and untimed segments. */
export function totalDurationFor(t: TestTemplate, lane: AccommodationLane): number {
  return t.segments.reduce((sum, s) => sum + segmentDurationFor(s, lane), 0);
}

/**
 * Scale warnings with the lane. A 5-minute warning on a 1.5x lane should still
 * fire at 5 real minutes remaining — NOT 7.5. Warnings are wall-clock, not scaled.
 * This function exists to make that decision explicit and testable.
 */
export function warningsFor(seg: Segment): TimeWarning[] {
  return seg.warnings ?? [];
}

/** Playable in the free tier ONLY when explicitly marked 'free' (fail closed). */
export function isFree(t: TestTemplate): boolean {
  return t.tier === 'free';
}

/** Validation — run before any template is saved or shared. */
export function validateTemplate(t: TestTemplate): string[] {
  const errors: string[] = [];
  if (!t.segments.length) errors.push('Template must have at least one segment.');
  if (!t.accommodationLanes.some((l) => l.timeMultiplier === 1)) {
    errors.push('Template must include a standard (1x) lane.');
  }
  if (!t.verificationNotice?.trim()) {
    errors.push('verificationNotice is required on every template.');
  }
  t.segments.forEach((s) => {
    if (s.durationSeconds < 0) errors.push(`Segment "${s.label}": duration cannot be negative.`);
    if (s.durationSeconds === 0 && s.advance === 'auto') {
      errors.push(`Segment "${s.label}": untimed segments cannot auto-advance.`);
    }
    (s.warnings ?? []).forEach((w) => {
      if (w.offsetSeconds >= s.durationSeconds && s.durationSeconds > 0) {
        errors.push(`Segment "${s.label}": warning at ${w.offsetSeconds}s never fires.`);
      }
    });
  });
  return errors;
}
