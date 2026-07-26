# Launch verification — browser pass

Everything below was verified by build/render/logic testing on 2026-07-25. Your
rule is that your own eyes close items, so this is the list to walk before you
flip the switch. Run `npm run dev`, open `http://localhost:3001`.

## What's already verified (no browser needed)

- `npm run build` passes clean — 17 routes, TypeScript clean.
- 68 logic assertions pass: all 5 templates validate, tier gating fails closed,
  warning offsets never scale with the multiplier, share links reject hostile
  input, share payloads structurally cannot carry PII.
- `/sitemap.xml` and `/robots.txt` resolve; sitemap carries real template IDs.
- FAQPage JSON-LD parses on all 5 template pages, 3 questions each.
- OG/Twitter metadata present; `public/og-image.png` is exactly 1200×630.
- Plausible script tag renders only when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set.
- Zero user-facing "lane" strings remain in rendered HTML.
- Locked Pro templates: landing pages stay public (the SEO surface), the runner
  route shows the lock panel. Direct navigation to a locked runner is clean.

## Browser pass — Testing runner (the fixes live here)

1. Open `/testing/run/seed-final-90`. Turn on the 1.5× group. Start.
2. **Clock during a dialog.** Press "Next section →" (or "End early") to open the
   confirm dialog and let it sit ~30 seconds. The clocks behind the dialog should
   keep counting down, and the per-group times inside the dialog should tick too.
   Before the fix both froze while the exam kept running.
3. Cancel. Confirm the admin log entry for a confirmed early advance shows the
   remaining time at the moment you confirmed, not when you opened the dialog.
4. **Warnings after added time.** Run a section down past a warning (the 1-minute
   call is quickest). Press **+1m**. Watch it cross that threshold again — the
   warning must fire a second time, on screen and out loud. Before the fix it was
   silently skipped.
5. **−1m guard.** Press −1m when it would zero a group; confirm the dialog lists
   live projected times and that "at limit" shows in red.
6. Both groups reach zero → gated hold, end sound, nothing auto-advances.
7. Warnings fire at true wall-clock offsets: the 1.5× group hits "5 minutes
   remaining" at 5 real minutes of *its own* time, later than standard.

## Browser pass — Classroom

8. Focus slider bottoms out at **0m** in every grade band.
9. Timer labels read "Focus Duration" — never "Pomodoro" anywhere in-app.
10. Copy share link → the "✓ Copied!" flash lasts 2 seconds, but the email card
    (only if `NEXT_PUBLIC_FEEDBACK_ENDPOINT` is set) **stays put**. Dismissing it
    hides it for the session; reloading brings it back.
11. Open the share link in a fresh tab — band, focus, calm, auto-break, and sound
    all restore.
12. Name picker and noise meter still work; roster persists across reload.

## Founder checklist — only you can close these

- [ ] Buy the production domain
- [ ] Set `NEXT_PUBLIC_SITE_URL` to it (until then every absolute URL in the
      sitemap, robots.txt, and OG tags points at `localhost:3001`) — **this is a
      hard launch blocker**
- [ ] Create the Plausible account, set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`
- [ ] Set `NEXT_PUBLIC_FEEDBACK_ENDPOINT` (Formspree) — without it the feedback
      form falls back to `mailto:` and the email capture renders nothing at all
- [ ] Back-to-school community posts
- [ ] Micro-influencer outreach

## Known, non-blocking

- `npm run lint` fails: `eslint-config-next` is installed but there's no
  `eslint.config.js`. Worth ten minutes post-launch.
- `app/globals.css` forces `font-family: Arial, Helvetica, sans-serif` on `body`,
  which overrides the Geist fonts loaded in `layout.tsx`. Leftover Next.js
  boilerplate — cosmetic.
- `advance: 'auto'` has no distinct runtime behavior (everything holds at zero by
  policy). Documented in `lib/testing/runner.ts`; not a bug.
