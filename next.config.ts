import type { NextConfig } from "next";

/**
 * PostHog is proxied through our own domain so its requests are first-party.
 *
 * Firefox's Enhanced Tracking Protection and uBlock Origin both ship
 * `*.i.posthog.com` on their blocklists — we watched ETP block it on our own
 * site. The visitors that vanish are not a random slice: they skew toward the
 * privacy-minded teachers and school-managed browsers we court, so the direct
 * endpoint under-counts precisely the audience we most want to measure.
 *
 * `/ingest/*` is same-origin, so there is nothing for a blocklist to match.
 *
 * TWO rewrites are required and both are load-bearing. The SDK loads its own
 * bundle from a separate assets host; proxying only the API leaves the script
 * itself blocked, which fails in exactly the same way as before.
 *
 * `skipTrailingSlashRedirect` is REQUIRED, not cosmetic — several PostHog API
 * paths end in a slash and Next's default redirect would break them.
 */
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

// us.i.posthog.com -> us-assets.i.posthog.com (likewise eu). Derived rather
// than hardcoded so the region stays governed by the one env var, instead of
// becoming a second thing that can silently drift out of sync with it.
const POSTHOG_ASSETS_HOST = POSTHOG_HOST.replace(
  /^https:\/\/(us|eu)\.i\.posthog\.com$/,
  "https://$1-assets.i.posthog.com",
);

const nextConfig: NextConfig = {
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      // Order matters: the assets rule must precede the catch-all below, or
      // static asset requests get proxied to the API host and 404.
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSETS_HOST}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${POSTHOG_HOST}/:path*`,
      },
    ];
  },
};

export default nextConfig;
