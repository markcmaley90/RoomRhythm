# RoomRhythm — Brand

Everything here is derived from the app itself (`app/page.tsx`), not invented
alongside it. If the app's palette changes, change it here and re-render, or the
two will drift.

---

## Where things live

```
brand/                       ← identity: logo, colors, voice
  logo/                        wordmark + mark, every background
  social-avatars/              profile pictures, sized per platform
  color/palette.png            the swatch sheet
  render/rr_logo.py            regenerates all of the above
  BRAND.md                     this file

marketing/                   ← campaign assets: things you post
  pinterest/                   4 pins, 1000×1500
  instagram/                   3 squares 1080×1080, 2 stories 1080×1920
  link-cards/                  3 OpenGraph cards, 1200×630
  print/                       staff-room flyer, PDF + PNG
  render/                      regenerates all of the above
```

The split: **brand** is who you are and rarely changes. **marketing** is what
you're saying this season and changes constantly. Keeping campaign assets out of
`brand/` is what stops a brand folder from turning into a junk drawer.

---

## Logo

**Wordmark** — "RoomRhythm", Geist Sans ExtraBold (800), with a horizontal
gradient from indigo to teal. This is the primary identity and matches the
`bg-gradient-to-r from-indigo-400 to-teal-400` treatment in the app.

| File | Use |
|---|---|
| `logo/wordmark-gradient-{lg,md,sm}.png` | Transparent background. Default choice. |
| `logo/wordmark-on-dark.png` | Pre-composited on `#0A0A0A` |
| `logo/wordmark-on-white.png` | Pre-composited on white |
| `logo/wordmark-mono-white.png` | Single colour, for anywhere the gradient dies |
| `logo/wordmark-mono-black.png` | Single colour, dark surfaces on light |

**Mark** — an open timer ring with the same gradient sweep. It's the app's own
hero shape (the 240px ring at r=108 in `app/page.tsx`), so the icon on Pinterest
is the thing teachers see on the projector.

`logo/mark-{512,256,128,64,32}.png` — transparent. Use 32 and 64 for favicons and
anywhere the wordmark would be illegible.

### Rules

- Never retype the wordmark in another font. Use the file.
- Never stretch it. Scale proportionally.
- Never put the gradient wordmark on a mid-tone background — it loses contrast
  fast. Use a mono version instead.
- Never add a drop shadow, outline, or glow to the wordmark.
- The mark may appear alone. The wordmark may appear alone. Prefer the wordmark
  when there's room for it; the mark is for small squares.
- Clear space: at least the height of the "R" on every side.

---

## Colour

Full reference with hex, rgb, and Tailwind tokens: `color/palette.png`.

| Colour | Hex | Tailwind | Use |
|---|---|---|---|
| Ink | `#0A0A0A` | `neutral-950` | Every dark surface. The canvas. |
| Indigo | `#818CF8` | `indigo-400` | Wordmark start, focus ring, primary accent |
| Teal | `#2DD4BF` | `teal-400` | Wordmark end, extended-time group, secondary accent |
| Amber | `#F59E0B` | `amber-500` | **Calls to action only.** Never decorative. |
| Emerald | `#34D399` | `emerald-400` | Breaks, and anything "safe" or privacy-related |

Amber is the one to be disciplined about. In the app it means *do this thing*.
The moment it becomes decoration, the buttons stop reading as buttons.

Mode colours in the app (`indigo-900` focus, `emerald-800` break, `blue-900`
calm, `slate-900` corporate) are UI states, not brand colours. Don't build
marketing around them.

---

## Type

**Geist Sans** — headings and body. Weights: 400 regular, 600 semibold, 700 bold,
800 extrabold for the wordmark and headlines.
**Geist Mono** — timer numerals only. Tabular figures matter; digits must not
jitter as the clock counts down.

Both are free and open-source. The renderers pull them from the
`@fontsource/geist-sans` and `@fontsource/geist-mono` npm packages — see
`marketing/render/README.md` for the woff2→ttf conversion.

If Geist is unavailable, **Inter** is the substitute. Never Arial.

---

## Voice

Plain, warm, specific. A solo builder talking to a teacher — not a company
talking to a customer. Short sentences. Concrete nouns. No exclamation marks, no
"revolutionize," no "empower."

### Copy rules that are not negotiable

These come from `CLAUDE.md` and `docs/02_language_and_ux_rules.md`. They apply to
every public string, including marketing:

- **Never write "lane" or "lanes" in public copy.** Say **"timing group"** (or
  "accommodation group"). "Lane" is internal jargon; it lives in code
  identifiers only.
- **In-app timer controls are always "Focus Duration."** Never "Pomodoro."
  "Pomodoro-style" is permitted *only* in landing-page and marketing prose.
- **SAT®, ACT®, AP®** carry the ® on first use, always with the disclaimer, and
  always framed as **mock/practice**. Never imply affiliation, endorsement, or
  that RoomRhythm runs an official administration. Never put a third-party mark
  in the product name, tagline, or domain. See `docs/09_trademark_and_disclaimers.md`.
- **Never describe RoomRhythm as proctoring software**, or claim webcam
  monitoring or cheat detection. It's a room clock. That boundary is the whole
  positioning.

### Privacy claims — the trap

The honest claim is about **transmission**, not **storage**. The name picker
stores roster names in `localStorage` on the teacher's own device by design (the
single documented carve-out, `lib/rosters.ts`). So:

- ✅ "Nothing is ever uploaded." "Names never leave this device." "Rosters stay
  on your computer." "Exam logs record initials and seat numbers only."
- ❌ "No student data collected." "No student names are ever collected."

The second set is false, and a district IT reviewer will catch it. Overclaiming
privacy to a school audience costs more than it wins.

---

## Regenerating

```
cd brand/render && python rr_logo.py
```

Requires Pillow and the Geist TTFs (see `marketing/render/README.md`). The script
imports the shared palette from `marketing/render/rr_brand.py`, so colour is
defined in exactly one place.
