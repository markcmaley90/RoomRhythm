import type { MetadataRoute } from "next";
import { SEED_TEMPLATES } from "@/data/templates/seed";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/testing`, changeFrequency: "weekly", priority: 0.7 },
  ];

  // Per-template landing pages (built in P0-4) are the primary SEO surface
  // (docs/gtm-strategy.md §5.1), so they outrank the app entry point here.
  // IDs come from the seed export — never hardcoded — so this stays correct
  // as templates are added or renamed.
  const templateRoutes: MetadataRoute.Sitemap = SEED_TEMPLATES.map((t) => ({
    url: `${BASE}/templates/${t.id}`,
    lastModified: t.meta.lastVerified,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...templateRoutes];
}
