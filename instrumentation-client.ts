/**
 * PostHog init. Next.js runs this on the client before hydration.
 *
 * Guarded on the env vars so an unconfigured environment — local dev, a preview
 * deploy, anyone's fork — makes no network request at all. This preserves the
 * behaviour the old Plausible script tag had.
 *
 * THREE settings carry the no-cookie-banner claim and all three are required:
 *
 *   1. "Cookieless server hash mode" ON in PostHog project settings (Web
 *      analytics section). The server will not accept cookieless events without
 *      it, so this must be enabled BEFORE the two below have any effect.
 *   2. `cookieless_mode: "always"` — the SDK writes nothing to cookies,
 *      localStorage, or sessionStorage, ever.
 *   3. `person_profiles: "never"` — identify() becomes a no-op, so no persistent
 *      distinct ID is created. Without this, an identify() call would reinstate
 *      exactly the personal identifier the other two settings removed.
 *
 * Removing any one of them silently makes the published privacy copy false. See
 * docs/13_launch_week.md D1-R.
 *
 * `alias()` is unusable in this mode — alias events are dropped at ingestion.
 * Nothing calls it today; do not add one.
 *
 * `autocapture: false` IS A PII CONTROL, NOT A PREFERENCE. PostHog's interaction
 * autocapture is ON by default and records the text of clicked elements and the
 * surrounding element tree. NamePicker renders a student's name in a span at
 * components/NamePicker.tsx:302 and lists roster names as <option>s in a <select>
 * just above it. With autocapture on, picking a name would ship that name to
 * PostHog as `clicked span with text "..."` — straight past the closed EventMap
 * in lib/analytics.ts, which is the only thing standing between roster data and
 * the wire. Turning this on would break the roster rule in CLAUDE.md.
 *
 * Pageview capture is separate and stays on; the funnel needs it.
 */

import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (key && host) {
  posthog.init(key, {
    api_host: host,
    defaults: "2026-05-30",
    cookieless_mode: "always",
    person_profiles: "never",
    autocapture: false,
  });
}
