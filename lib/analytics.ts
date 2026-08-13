/**
 * PostHog analytics — cookieless, no consent banner, no individual tracking.
 *
 * PII GUARANTEE (structural, not policy): the event names and their prop shapes
 * are a closed map below. There is no free-form props channel, so roster names,
 * initials, seat numbers, emails, and administration-log contents cannot be
 * passed to `track()` — the compiler rejects them.
 *
 * The no-individual-tracking guarantee has THREE parts and all are required:
 *   1. "Cookieless server hash mode" enabled in PostHog project settings.
 *   2. `cookieless_mode: "always"` in instrumentation-client.ts.
 *   3. `person_profiles: "never"` in the same file.
 * Turning any one off silently reintroduces a persistent identifier and
 * invalidates the privacy claim on the marketing site. Do not change them
 * without updating that copy.
 *
 * Read the numbers accordingly: unique-user counts are unreliable in this mode
 * (see docs/13_launch_week.md D1-R). Event counts are not. Judge launch by
 * session_started and template_launched, never by "unique users".
 *
 * No-ops safely when posthog has not initialized (env vars unset, script
 * blocked, or SSR), so local dev and ad-blocked visitors never error.
 */

import posthog from "posthog-js";

/** The only seven events RoomRhythm reports, with their exact allowed props. */
type EventMap = {
  session_started: { profile: "classroom" | "corporate" | "testing" };
  template_launched: { templateId: string };
  share_link_copied: { surface: "classroom" | "testing_runner" };
  name_picker_used: undefined;
  // A count is deliberately NOT a prop here. Class size is not something we
  // need, and the closed map is the whole PII guarantee — it only holds if
  // nothing roster-derived is ever added to it.
  roster_csv_imported: undefined;
  noise_meter_started: undefined;
  section_completed: { templateId: string };
};

type EventProps = Record<string, string | number | boolean>;

/**
 * Mirrors the init guard in instrumentation-client.ts exactly. Both are inlined
 * at build time, so an unconfigured build compiles the capture call out rather
 * than firing at an uninitialized SDK. If you change the condition here, change
 * it there too — they must not drift.
 */
const enabled = Boolean(
  process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST,
);

export function track<E extends keyof EventMap>(
  event: E,
  ...args: EventMap[E] extends undefined ? [] : [props: EventMap[E]]
): void {
  if (!enabled) return;
  if (typeof window === "undefined") return;
  try {
    const props = args[0] as EventProps | undefined;
    posthog.capture(event, props);
  } catch {
    // Analytics must never break the room.
  }
}
