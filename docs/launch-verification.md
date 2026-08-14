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
- PostHog sends nothing unless both `NEXT_PUBLIC_POSTHOG_KEY` and
  `NEXT_PUBLIC_POSTHOG_HOST` are set. No `ph_` cookies appear on the domain —
  if any do, cookieless mode is off and the published privacy copy is false.
- **Analytics goes out first-party.** `curl -s -o /dev/null -w '%{http_code}'
  https://roomrhythm.org/ingest/array/<key>/config` returns `200`, and the
  served bundle contains `api_host:"/ingest"` — not a `*.i.posthog.com` ingest
  target, which ETP and uBlock block.
- **The six code-side privacy settings are in the served bundle**, not just the
  source: `cookieless_mode:"always"`, `person_profiles:"never"`,
  `autocapture:!1`, `disable_session_recording:!0`, `capture_heatmaps:!1`, plus
  the closed `EventMap`. The seventh — cookieless server hash mode — is a
  PostHog dashboard toggle with no client equivalent; confirm it by eye. See
  `13_launch_week.md` D1-R.
- Zero user-facing "lane" strings remain in rendered HTML.
- **The deployed commit matches `origin/main`.** Check the Source hash on the
  live deployment, not just that a deployment exists. Vercel's Git connection
  dropped silently once (Aug 9–13) and production served stale code for four
  days while the dashboard looked healthy.
- Classroom and Corporate on a 390px viewport show the small-screen notice, not
  a broken projector layout. Launch traffic from Pinterest and Facebook groups
  is overwhelmingly mobile, so this is a first-impression surface.
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

## Browser pass — the three critical fixes (commit `8c06c3d`)

These came out of a code review, not a browser session. **The timer change touches
the daily-use core and is the highest-risk edit in the repo — check it first.**

A. **Timer no longer drifts when backgrounded.** Start a 5-minute focus block.
   Note the wall-clock time. Switch to another tab or minimize for 3+ minutes,
   then come back. The countdown should reflect *real* elapsed time — if 3
   minutes passed, it shows ~2:00 left, not ~4:40. Before the fix it ran long.
B. **Pause and resume still work.** Pause mid-block, wait 30 seconds, resume.
   It must continue from where it paused — **not** jump to 0:00. This is the
   specific way the deadline rewrite could have broken; it's worth two tries.
C. **±5s arrow keys still work** on the running timer, and **no longer fire while
   typing**. Open "Suggest a Feature" mid-block, arrow around the textarea, and
   confirm the countdown does not move.
D. **Emergency alarm can't be orphaned.** Start the alarm, then hit "← Rooms"
   without stopping it. It must go silent. Before the fix it played forever with
   no way to stop it short of reloading.
E. **Microphone is released.** Open the noise meter, start it, close it. The
   browser's recording indicator (tab dot / menu-bar icon) must go out. Then:
   open it, click Start, and close the panel *while the permission prompt is
   still up* — the mic must never turn on. Check the indicator again.
F. **Mic error states.** If you can, test with the mic disabled in system
   settings — you should get "No microphone was found," not the "blocked, allow
   it in the address bar" message.

## Browser pass — interrupt guard and the rest (commit `552c535`)

G. **Break mid-Focus warns first.** Start a Focus block, let it run a minute,
   click 🌿 Break. You should get "End Focus Time early?" showing the remaining
   time. "Keep running" leaves the block untouched; "Start Brain Break" proceeds.
   Same for Calm and for re-clicking Focus. Same again in Corporate.
H. **No warning when there's nothing to protect.** From idle, Focus/Break/Calm
   should start immediately with no dialog. Also check that a block which has
   run down to 0:00 doesn't warn.
I. **Corporate block counter.** Run a full 3-block cycle to the end. Then click
   💼 Focus directly from idle — the chip must read "Block 1 of 3", not "3 of 3",
   and auto-break should cycle rather than stopping after one block.
J. **Emergency button during Calm.** Trigger Calm and, while the countdown wash
   is on screen, confirm the 🚨 button is still visible and clickable.
K. **Tab title flash.** With a timer running, switch tabs before the 1-minute
   mark. The tab title should alternate for ~16 seconds, not blink once.

## Round 2 — retest after your first pass

**C (retest).** ↑↓ on a running timer must move it by exactly 5 seconds per
press, and the number must *stay* moved. Before, one press shifted the real end
time by 10s while the display showed 5, then the next tick snapped it back.
Still confirm arrows do nothing while typing in "Suggest a Feature".

**E (retest).** The meter now shows an amber arming bar and "chiming in 3s"
while you're above the line. Watch the bar fill — that tells you it's counting.
Short dips no longer reset it. Note it's **3 seconds**, not 2, and there's a
15-second cooldown after each chime. If the bar never moves, your level isn't
crossing the threshold — drag the threshold slider down until it does.
**Also check: with the room muted, no chime.** That's intended.

**I (retest).** Corporate should have no "Block X of Y" chip anywhere. With
auto-break On, Work → Recharge → Work should now cycle indefinitely instead of
stopping after three.

**L. Ambient focus sound (new).** In the idle settings panel there's a "Focus
Sound" row. **Soft Rain** is free; Ocean, Warm Pad, and Deep Hum show a 🔒 and
are unclickable. Pick Soft Rain, start a Focus block:
  - It should fade in over ~2 seconds, not snap on.
  - It should stop when the block ends and **not** play during a break.
  - Muting the room should silence it.
  - Hit "← Rooms" mid-block — it must stop, not keep playing.
  - Let it run several minutes and listen for a click or seam at the loop point.
  Same control exists in Corporate, playing during work blocks.

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
- [x] Create the PostHog account, enable cookieless mode, set
      `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` (Production only),
      redeploy — done Aug 13, project 555510, US Cloud
- [x] Reverse proxy — done Aug 14 via `next.config.ts` rewrites, not PostHog's
      managed proxy. `/ingest/*` is same-origin, so ETP and uBlock have nothing
      to match. Baselines before and after Aug 14 are not comparable.
- [ ] UTM convention applied to every posted link. Untagged traffic cannot be
      re-attributed later, so this precedes the first post, not the first review:
      `?utm_source=facebook&utm_medium=group&utm_campaign=bts26&utm_content=<group>`
      `?utm_source=pinterest&utm_medium=pin&utm_campaign=bts26&utm_content=<board>`
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
