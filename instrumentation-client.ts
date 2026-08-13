/**
 * PostHog init. Next.js runs this on the client before hydration.
 *
 * Guarded on the env vars so an unconfigured environment — local dev, a preview
 * deploy, anyone's fork — makes no network request at all. This preserves the
 * behaviour the old Plausible script tag had.
 *
 * `person_profiles: "never"` turns identify() into a no-op so no persistent
 * person profile is ever created. It pairs with "Cookieless server hash mode"
 * in PostHog project settings; see the header of lib/analytics.ts. Both are
 * load-bearing for the no-consent-banner claim.
 */

import posthog from "posthog-js";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;

if (key && host) {
  posthog.init(key, {
    api_host: host,
    defaults: "2026-05-30",
    person_profiles: "never",
  });
}
