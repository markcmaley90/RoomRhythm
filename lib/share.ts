/**
 * Shareable session links — "send your sub this screen."
 *
 * Configuration travels entirely in the URL (`?s=<encoded>`); there is no backend.
 *
 * PRIVACY (hard rule): the payload types below are CLOSED — they carry only the
 * settings needed to reproduce a setup. There is deliberately no field for
 * administration-log events, student initials, seat numbers, or roster names, so
 * that data cannot structurally enter a share URL.
 *
 * DURATIONS: seconds only, per the schema-wide rule. Callers convert for their
 * own UI (e.g. the Classroom slider works in minutes).
 */

import { SEED_TEMPLATES } from "@/data/templates/seed";
import type { SoundType } from "@/lib/audio";

/** Query-string key carrying the encoded config. */
export const SHARE_PARAM = "s";

/** Classroom timer setup. Durations in SECONDS. */
export type ClassroomShareConfig = {
  p: "classroom";
  /** Grade-band index; consumer clamps to its own band list. */
  band: number;
  focusSeconds: number;
  calmSeconds: number;
  autoBreak: boolean;
  sound: SoundType;
};

/** Testing session setup: which seed template, which accommodation lanes. */
export type TestingShareConfig = {
  p: "testing";
  templateId: string;
  /** Active accommodation lane ids, validated against the template itself. */
  lanes: string[];
};

export type ShareConfig = ClassroomShareConfig | TestingShareConfig;

const SOUND_TYPES: readonly string[] = ["bell", "chime", "soft"];

// Generous but bounded ceilings — the consumer clamps to its own real ranges.
const MAX_BAND_INDEX = 19;
const MAX_FOCUS_SECONDS = 6 * 60 * 60; // 6h
const MAX_CALM_SECONDS = 60;

function isInt(v: unknown, min: number, max: number): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;
}

/** ---------------------------------------------------------------- encode */

/**
 * Config -> URL-safe string. JSON -> encodeURIComponent (unicode-safe) -> base64,
 * then base64url (`+/=` are not URL-safe).
 */
export function encodeShareConfig(config: ShareConfig): string {
  const json = JSON.stringify(config);
  const b64 = btoa(encodeURIComponent(json));
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** ---------------------------------------------------------------- decode */

/**
 * URL param -> config, or null. NEVER throws: any malformed, truncated, or
 * hostile value returns null so callers fall through to defaults silently.
 */
export function decodeShareConfig(param: string | null | undefined): ShareConfig | null {
  if (!param || typeof param !== "string") return null;
  try {
    const b64 = param.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const parsed: unknown = JSON.parse(decodeURIComponent(atob(padded)));
    return validateShareConfig(parsed);
  } catch {
    return null;
  }
}

/** Shape + range validation. Returns the narrowed config, or null. */
function validateShareConfig(value: unknown): ShareConfig | null {
  if (typeof value !== "object" || value === null) return null;
  const v = value as Record<string, unknown>;

  if (v.p === "classroom") {
    if (!isInt(v.band, 0, MAX_BAND_INDEX)) return null;
    if (!isInt(v.focusSeconds, 0, MAX_FOCUS_SECONDS)) return null;
    if (!isInt(v.calmSeconds, 0, MAX_CALM_SECONDS)) return null;
    if (typeof v.autoBreak !== "boolean") return null;
    if (typeof v.sound !== "string" || !SOUND_TYPES.includes(v.sound)) return null;
    return {
      p: "classroom",
      band: v.band,
      focusSeconds: v.focusSeconds,
      calmSeconds: v.calmSeconds,
      autoBreak: v.autoBreak,
      sound: v.sound as SoundType,
    };
  }

  if (v.p === "testing") {
    if (typeof v.templateId !== "string") return null;
    // Reuse the real template data rather than duplicating shape checks: the id
    // must resolve to a shipped template, and every lane id must exist on it.
    const template = SEED_TEMPLATES.find((t) => t.id === v.templateId);
    if (!template) return null;
    if (!Array.isArray(v.lanes) || v.lanes.length === 0) return null;
    const known = new Set(template.accommodationLanes.map((l) => l.id));
    const lanes = Array.from(new Set(v.lanes));
    if (!lanes.every((id) => typeof id === "string" && known.has(id))) return null;
    return { p: "testing", templateId: template.id, lanes: lanes as string[] };
  }

  return null;
}

/** ------------------------------------------------------------------ util */

/** Absolute URL with `?s=` set (replacing any existing value). */
export function withShareParam(url: string, config: ShareConfig): string {
  const u = new URL(url);
  u.searchParams.set(SHARE_PARAM, encodeShareConfig(config));
  return u.toString();
}
