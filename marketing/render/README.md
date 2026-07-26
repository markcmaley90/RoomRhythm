# Marketing asset renderers

Regenerates everything in `marketing/` from code, so the assets stay in sync with
the app's real palette instead of drifting into a separate design file.

## When you must re-run this

**If the production domain changes from `roomrhythm.com`**, edit the `URL`
constant at the top of `rr_pins.py` and `rr_social.py`, then re-run. Otherwise
every pin, story, link card, and the flyer QR code all ship the wrong address.

## Setup

    pip install pillow qrcode fonttools brotli

Fonts: the scripts expect Geist Sans and Geist Mono TTFs in `/tmp/fonts/ttf/`.
Get them from the `@fontsource/geist-sans` and `@fontsource/geist-mono` npm
packages (which ship woff2) and convert with fontTools:

    npm i @fontsource/geist-sans @fontsource/geist-mono
    python -c "from fontTools.ttLib import TTFont; f=TTFont('X.woff2'); f.flavor=None; f.save('X.ttf')"

Adjust the `F` path at the top of `rr_brand.py` if you keep them elsewhere.

## Run

    python rr_pins.py      # Pinterest 1000x1500
    python rr_social.py    # Instagram, link cards, print flyer

## Files

- `rr_brand.py` — palette, fonts, and shared components (timer ring, gradient
  wordmark, chips, QR). Colors are lifted from `app/page.tsx`; if the app's
  palette changes, change it here too.
- `rr_pins.py` — the four Pinterest pins.
- `rr_social.py` — Instagram square + story, 1200x630 link cards, staff-room flyer.

Headlines use explicit line breaks, never auto-wrap — a headline that breaks
itself in the wrong place reads as amateur, and Pinterest crops hard.
