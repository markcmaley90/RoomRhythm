"""
RoomRhythm brand assets — wordmark, logo mark, social avatars, palette sheet.

The mark is the app's own timer ring (app/page.tsx draws a 240px ring, r=108,
6px stroke). Using the product's actual hero shape as the logo means the icon a
teacher sees on Pinterest is the thing they'll see on the projector.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "marketing", "render"))
from rr_brand import (sans, tw, h_gradient, lerp, INDIGO400, TEAL400, AMBER500,
                      EMERALD, BG, INK, save, canvas)
from PIL import Image, ImageDraw, ImageFont

OUT = "/sessions/funny-sweet-dijkstra/mnt/RoomRhythm/brand"

# ── Wordmark ───────────────────────────────────────────────────────────────
def wordmark(size, bg=None, pad=0.35):
    """Transparent-background wordmark unless bg given. Gradient indigo→teal."""
    f = sans(size, 800)
    probe = Image.new("RGBA", (10, 10))
    d0 = ImageDraw.Draw(probe)
    b = d0.textbbox((0, 0), "RoomRhythm", font=f)
    tw_, th_ = b[2] - b[0], b[3] - b[1]
    padx, pady = int(size * pad), int(size * pad * 0.7)
    W, H = tw_ + padx * 2, th_ + pady * 2

    img = Image.new("RGBA", (W, H), (0, 0, 0, 0) if bg is None else bg + (255,))
    mask = Image.new("L", (W, H), 0)
    ImageDraw.Draw(mask).text((padx - b[0], pady - b[1]), "RoomRhythm", font=f, fill=255)
    grad = h_gradient(W, H, INDIGO400, TEAL400).convert("RGBA")
    img.paste(grad, (0, 0), mask)
    return img

def wordmark_mono(size, color, bg=None, pad=0.35):
    """Single-colour wordmark — for print, faxes, and anywhere gradient dies."""
    f = sans(size, 800)
    probe = Image.new("RGBA", (10, 10)); d0 = ImageDraw.Draw(probe)
    b = d0.textbbox((0, 0), "RoomRhythm", font=f)
    padx, pady = int(size * pad), int(size * pad * 0.7)
    W, H = b[2] - b[0] + padx * 2, b[3] - b[1] + pady * 2
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0) if bg is None else bg + (255,))
    ImageDraw.Draw(img).text((padx - b[0], pady - b[1]), "RoomRhythm", font=f,
                             fill=color + (255,))
    return img

# ── Logo mark — the timer ring ─────────────────────────────────────────────
def mark(size, bg=None, sweep=0.72, ring_frac=0.072, inset=0.16, ss=4):
    """
    Square mark: an open timer ring with the brand gradient, drawn supersampled
    so the arc ends stay clean at favicon sizes.
    """
    S = size * ss
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0) if bg is None else bg + (255,))
    pad = int(S * inset)
    w = max(2, int(S * ring_frac))
    box = [pad, pad, S - pad, S - pad]

    # track
    ImageDraw.Draw(img).arc(box, 0, 360, fill=(255, 255, 255, 28), width=w)

    # gradient sweep: draw arc into a mask, paste gradient through it
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).arc(box, -90, -90 + 360 * sweep, fill=255, width=w)
    grad = h_gradient(S, S, INDIGO400, TEAL400).convert("RGBA")
    img.paste(grad, (0, 0), mask)
    return img.resize((size, size), Image.LANCZOS)

def avatar(size, sweep=0.72):
    """Social profile picture — mark centred on the app's near-black."""
    img = Image.new("RGBA", (size, size), BG + (255,))
    m = mark(int(size * 0.78), sweep=sweep)
    img.paste(m, ((size - m.width) // 2, (size - m.height) // 2), m)
    return img

def avatar_wordmark(size):
    """Square lockup — mark over wordmark. For Pinterest/Facebook page headers."""
    img = Image.new("RGBA", (size, size), BG + (255,))
    m = mark(int(size * 0.46))
    img.paste(m, ((size - m.width) // 2, int(size * 0.16)), m)
    wm = wordmark(int(size * 0.115), pad=0.18)
    ratio = min(1.0, (size * 0.74) / wm.width)
    wm = wm.resize((int(wm.width * ratio), int(wm.height * ratio)), Image.LANCZOS)
    img.paste(wm, ((size - wm.width) // 2, int(size * 0.70)), wm)
    return img

# ── Palette sheet ──────────────────────────────────────────────────────────
SWATCHES = [
    ("Ink / background", "neutral-950", BG,        "Every dark surface. The app's canvas."),
    ("Indigo",           "indigo-400",  INDIGO400, "Wordmark start · focus ring · primary accent."),
    ("Teal",             "teal-400",    TEAL400,   "Wordmark end · extended-time group · secondary accent."),
    ("Amber",            "amber-500",   AMBER500,  "Calls to action only. Never decorative."),
    ("Emerald",          "emerald-400", EMERALD,   "Breaks, and anything 'safe' or privacy-related."),
]

def palette_sheet():
    W, H = 1400, 900
    img = canvas(W, H)
    d = ImageDraw.Draw(img)
    wm = wordmark(44, pad=0.2)
    img.paste(wm, (64, 54), wm)
    f = sans(24, 600)
    d.text((66, 122), "Brand palette — values taken from app/page.tsx", font=f, fill=(130, 130, 130))

    y = 210
    for name, token, rgb, use in SWATCHES:
        # near-black needs an outline or it vanishes against the sheet itself
        d.rounded_rectangle([64, y, 244, y + 110], radius=20, fill=rgb,
                            outline=(70, 70, 70) if sum(rgb) < 120 else None,
                            width=2)
        f1 = sans(32, 700); f2 = sans(22, 400); f3 = sans(21, 400)
        d.text((288, y + 6), name, font=f1, fill=INK)
        hexv = "#%02X%02X%02X" % rgb
        d.text((288, y + 48), f"{hexv}   ·   rgb{rgb}   ·   Tailwind {token}",
               font=f2, fill=(150, 150, 150))
        d.text((288, y + 78), use, font=f3, fill=(110, 110, 110))
        y += 132
    save(img, f"{OUT}/color/palette.png")

# ── Build ──────────────────────────────────────────────────────────────────
def build():
    print("Wordmark:")
    for px, tag in [(160, "lg"), (96, "md"), (56, "sm")]:
        save(wordmark(px), f"{OUT}/logo/wordmark-gradient-{tag}.png")
    save(wordmark(160, bg=BG), f"{OUT}/logo/wordmark-on-dark.png")
    save(wordmark(160, bg=(255, 255, 255)), f"{OUT}/logo/wordmark-on-white.png")
    save(wordmark_mono(160, INK), f"{OUT}/logo/wordmark-mono-white.png")
    save(wordmark_mono(160, (15, 15, 15)), f"{OUT}/logo/wordmark-mono-black.png")

    print("Mark:")
    for px in (512, 256, 128, 64, 32):
        save(mark(px), f"{OUT}/logo/mark-{px}.png")
    save(mark(512, bg=BG), f"{OUT}/logo/mark-on-dark-512.png")

    print("Social avatars:")
    for px in (1080, 400, 180):
        save(avatar(px), f"{OUT}/social-avatars/avatar-{px}.png")
    save(avatar_wordmark(1080), f"{OUT}/social-avatars/avatar-lockup-1080.png")

    print("Palette:")
    palette_sheet()

if __name__ == "__main__":
    build()
