# 06 — Backend, Auth & Billing (the central build decision)

Every monetization goal requires a backend. Adopt the stack once and let it serve auth, billing, sync, and saved data together — don't bolt on three vendors.

## Recommended stack (solo-dev optimized)
- **Supabase** — Postgres + Auth + Row-Level Security + Realtime + storage, in one service. Covers auth, saved data, admin-log persistence, AND view-only sync (see `07`). Single vendor = less to run.
- **Stripe** — Checkout + Customer Portal + webhooks. Handles monthly/yearly, edu coupons, trials, proration. Never hand-roll billing.
- **Alternative auth** if not Supabase: Clerk (auth) + a Postgres host. Only choose this if you specifically want Clerk's UI. Default to Supabase for consolidation.

## Why not "just capture emails to track subscriptions"
Email capture alone gates nothing and prevents no sharing. It's a *lead signal*, not access control. Real subscriptions need: identity (auth) + a billing system of record (Stripe) + a server that checks entitlement. Build that once; email capture becomes a field on the user record, not the mechanism.

## Email capture — what it's actually for
1. **Edu-pricing eligibility** — verify `.edu` (or a school-domain allowlist) to unlock education pricing.
2. **B2B lead signal** — a `.edu`/corporate domain with several users on it flags a site-license sales opportunity.
3. **Identity for sync** — multi-device room control needs a stable user identity anyway.

## Entitlement model (minimum viable)
- `users` (id, email, domain, plan, edu_verified)
- `subscriptions` (user_id, stripe_customer_id, status, interval, current_period_end)
- `orgs` (id, domain, seats, plan) — for site licenses
- Server checks `subscriptions.status = active` before serving paid features (saved configs, persistent admin log, sync, Testing-profile Pro features).

## Compliance (do NOT skip — K-12 + storing data triggers this)
- **FERPA** — education records. Applies once you store student data for a school.
- **COPPA** — under-13 users; parental-consent obligations. Schools can consent on parents' behalf under specific conditions — get this right contractually.
- **State laws** — California **SOPIPA** applies (founder is in CA); many states have equivalents.
- **Practical guardrails:** minimize student PII (prefer initials/seat numbers), sign a DPA template for schools, publish a clear privacy policy, offer data export/delete, and keep student data regionally appropriate.
- Corporate profile data is lower-risk (adult employees) but still needs a privacy policy and GDPR-awareness if you take EU customers.

## Build order
1. Git + repo (prereq — `04_Engineering/Git_and_Repo_Setup.md`).
2. Supabase auth + `users` table + `.edu` verification.
3. Stripe Checkout + Customer Portal + webhook -> `subscriptions` table.
4. Gate one paid feature end-to-end (persistent admin log or saved setup) to prove the loop.
5. Then expand to sync (`07`) and org/site licenses.
