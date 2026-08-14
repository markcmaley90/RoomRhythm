/**
 * PostHog init. Next.js runs this on the client before hydration.
 *
 * Guarded on the env vars so an unconfigured environment — local dev, a preview
 * deploy, anyone's fork — makes no network request at all. This preserves the
 * behaviour the old Plausible script tag had.
 *
 * SEVEN settings carry the privacy claim. Six are in this repo; ONE is not:
 *
 *   1. "Cookieless server hash mode" ON in PostHog project settings (Web
 *      analytics section). The server will not accept cookieless events without
 *      it, so this must be enabled BEFORE the two below have any effect.
 *      THIS ONE CANNOT BE PINNED HERE — it is a dashboard toggle with no client
 *      equivalent, and it is the single setting git cannot protect for you.
 *   2. `cookieless_mode: "always"` — the SDK writes nothing to cookies,
 *      localStorage, or sessionStorage, ever.
 *   3. `person_profiles: "never"` — identify() becomes a no-op, so no persistent
 *      distinct ID is created. Without this, an identify() call would reinstate
 *      exactly the personal identifier the other two settings removed.
 *   4. The closed `EventMap` in lib/analytics.ts — no free-form props channel.
 *   5. `autocapture: false` (see below).
 *   6. `disable_session_recording: true` (see below).
 *   7. `capture_heatmaps: false` (see below).
 *
 * Removing any one of them silently makes the published privacy copy false. See
 * docs/13_launch_week.md D1-R.
 *
 * 6 and 7 are set here even though both are ALSO off in the PostHog project
 * settings, and the redundancy is the entire point. A dashboard toggle can be
 * flipped by a click in a web UI — no commit, no diff, no review. Session replay
 * in particular would record full DOM of screens that render roster names, and
 * nothing in this repo would have changed. Client config wins over the remote
 * default, so pinning them here puts two load-bearing privacy settings back
 * under version control where a reviewer can actually see them move.
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
 * Session replay and heatmaps are the other two channels that move data nobody
 * wrote code for. Replay ships DOM; heatmaps ship click coordinates and drive a
 * second `$rageclick` emitter independent of autocapture. Both are off.
 *
 * Pageview capture is separate and stays on; the funnel needs it.
 */

import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (key && host) {
  posthog.init(key, {
    // First-party path, NOT `host`. next.config.ts rewrites /ingest/* to the
    // host in the env var; going direct gets blocked by Firefox ETP and uBlock.
    // The env var still governs the region and still gates analytics entirely.
    api_host: "/ingest",
    // Where the PostHog app itself lives (toolbar links only, never ingest).
    // Derived from the same var so the region cannot drift.
    ui_host: host.replace(
      /^https:\/\/(us|eu)\.i\.posthog\.com$/,
      "https://$1.posthog.com",
    ),
    defaults: "2026-05-30",
    cookieless_mode: "always",
    person_profiles: "never",
    autocapture: false,
    // Off in project settings too. Pinned here so flipping either one requires
    // a commit rather than a click. Do not remove as "redundant".
    disable_session_recording: true,
    capture_heatmaps: false,
  });
}
