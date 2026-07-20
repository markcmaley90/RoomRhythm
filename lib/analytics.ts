/**
 * Plausible analytics — cookieless, no consent banner, no individual tracking.
 *
 * PII GUARANTEE (structural, not policy): the event names and their prop shapes
 * are a closed map below. There is no free-form props channel, so roster names,
 * initials, seat numbers, emails, and administration-log contents cannot be
 * passed to `track()` — the compiler rejects them.
 *
 * No-ops safely when window.plausible is absent (env var unset, script blocked,
 * or SSR), so local dev and ad-blocked visitors send nothing and never error.
 */

/** The only six events RoomRhythm reports, with their exact allowed props. */
type EventMap = {
  session_started: { profile: "classroom" | "corporate" | "testing" };
  template_launched: { templateId: string };
  share_link_copied: { surface: "classroom" | "testing_runner" };
  name_picker_used: undefined;
  noise_meter_started: undefined;
  section_completed: { templateId: string };
};

type PlausibleProps = Record<string, string | number | boolean>;

declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: PlausibleProps }) => void;
  }
}

export function track<E extends keyof EventMap>(
  event: E,
  ...args: EventMap[E] extends undefined ? [] : [props: EventMap[E]]
): void {
  if (typeof window === "undefined") return;
  try {
    const props = args[0] as PlausibleProps | undefined;
    window.plausible?.(event, props ? { props } : undefined);
  } catch {
    // Analytics must never break the room.
  }
}
