"""Screenshot pins — 1000x1500, real UI as the hero.

WHY THIS IS A SEPARATE FILE FROM rr_pins.py
-------------------------------------------
The graphic pins in rr_pins.py argue with typography. These show the product
and let it argue for itself. Different job, different layout rules.

THE ONE RULE: text never sits on top of the screenshot.

Overlaying a headline across a UI shot is the default move and it ruins both —
the words fight the interface behind them, and the interface stops being
legible proof. So the pin is stacked in three bands: headline above,
screenshot inset in the middle with a real border and shadow so it reads as a
window rather than a pasted rectangle, footer below. The screenshot is never
cropped by text and never dimmed.

CROPPING. Browser screenshots carry chrome, empty margins, and controls that
mean nothing at thumbnail size. Each pin declares its own crop box in
fractions of the source so a re-shoot at a different window size still works.
"""
from rr_brand import *
from PIL import Image, ImageDraw, ImageFilter
import os

OUT = "/sessions/funny-sweet-dijkstra/mnt/RoomRhythm/marketing/pinterest"
SHOTS = "/sessions/funny-sweet-dijkstra/mnt/uploads"
W, H = 1000, 1500
URL = "roomrhythm.org"

FOOTER_TOP = 1330
SHOT_MAX_W = 872          # 64px margins either side
SHOT_TOP_DEFAULT = 470    # headline gets everything above this


# ── Layout pieces ──────────────────────────────────────────────────────────
def shell(accent=INDIGO400, gy=360):
    img = canvas(W, H)
    glow(img, W // 2, gy, 560, accent, 0.13)
    return img


def eyebrow(img, text, y, color=TEAL400, size=25):
    d = ImageDraw.Draw(img)
    f = sans(size, 700)
    t = " ".join(text.upper())
    d.text(((W - tw(d, t, f)) / 2, y), t, font=f, fill=color)


def headline(img, lines_, y, size=62, lh=1.12, color2=None):
    """Explicit line breaks only — auto-wrap breaks marketing copy badly."""
    d = ImageDraw.Draw(img)
    f = sans(size, 800)
    step = int(size * lh)
    for i, ln in enumerate(lines_):
        c = INK if (i == 0 or color2 is None) else color2
        d.text(((W - tw(d, ln, f)) / 2, y), ln, font=f, fill=c)
        y += step
    return y


def subline(img, text, y, size=29):
    return para(img, text, sans(size, 400), y, 780, fill=(150, 150, 150), lh=1.38)


def footer(img, cta="Free · No login · In your browser"):
    d = ImageDraw.Draw(img)
    d.line([(150, FOOTER_TOP - 34), (W - 150, FOOTER_TOP - 34)], fill=(38, 38, 38), width=2)
    f = sans(27, 600)
    d.text(((W - tw(d, cta, f)) / 2, FOOTER_TOP), cta, font=f, fill=(128, 128, 128))
    fw = sans(52, 800)
    gradient_text(img, ((W - tw(d, "RoomRhythm", fw)) // 2, FOOTER_TOP + 48), "RoomRhythm", fw)
    fu = sans(28, 600)
    d.text(((W - tw(d, URL, fu)) / 2, FOOTER_TOP + 118), URL, font=fu, fill=(112, 112, 112))


# ── The screenshot placer ──────────────────────────────────────────────────
def place_shot(img, filename, region, crop=None, radius=26, max_w=SHOT_MAX_W,
               caption_room=64, patches=()):
    """
    Drop a screenshot in as a framed window: rounded corners, hairline border,
    soft shadow underneath. `crop` is (l, t, r, b) as 0..1 fractions of the
    source, so re-shooting at another window size doesn't break the framing.

    `region` is (top, bottom) — the band between the headline and the footer.
    The shot is CENTRED in that band rather than pinned to the top. A wide
    crop (the two-clock exam shot is nearly 3:1) is short once scaled to pin
    width, and top-pinning it dumped ~500px of dead space above the footer.
    Centring spreads that slack evenly and the pin stops looking unfinished.

    Returns the bottom y of the placed image.
    """
    src = Image.open(os.path.join(SHOTS, filename)).convert("RGB")
    for box in patches:                      # before cropping — boxes are source pixels
        patch_out(src, box, from_below=200)
    if crop:
        l, t, r, b = crop
        src = src.crop((int(src.width * l), int(src.height * t),
                        int(src.width * r), int(src.height * b)))

    r_top, r_bot = region
    max_h = (r_bot - r_top) - caption_room
    scale = min(max_w / src.width, max_h / src.height)
    w, h = int(src.width * scale), int(src.height * scale)
    src = src.resize((w, h), Image.LANCZOS)
    x = (W - w) // 2
    top = r_top + ((r_bot - r_top) - h - caption_room) // 2

    # Rounded mask
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=radius, fill=255)

    # Shadow first — a flat paste looks like a sticker, not a screen.
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle(
        [x + 6, top + 14, x + w - 6, top + h + 14], radius=radius, fill=(0, 0, 0, 190))
    sh = sh.filter(ImageFilter.GaussianBlur(22))
    img.paste(Image.new("RGB", (W, H), (0, 0, 0)), (0, 0), sh.split()[3])

    img.paste(src, (x, top), mask)

    # Hairline border, so a dark screenshot doesn't melt into a dark canvas.
    ImageDraw.Draw(img).rounded_rectangle(
        [x, top, x + w - 1, top + h - 1], radius=radius, outline=(64, 64, 70), width=2)
    return top + h


def patch_out(src, box, from_below=None):
    """
    Clone clean background over a UI element that shouldn't be in a pin.

    The "Suggest a Feature" pill lives in the top-right of every room. Cropping
    it away pulls the frame off-centre, and leaving a sliver of it looks like a
    mistake. So we copy a clean patch of the same gradient over it — the room
    backgrounds are smooth vertical gradients, so a strip taken from directly
    below the pill matches almost exactly.

    `box` is (l, t, r, b) in SOURCE pixels. `from_below` is how far down to
    take the donor strip; defaults to just under the box.
    """
    l, t, r, b = box
    h = b - t
    dy = from_below if from_below is not None else h + 8
    donor = src.crop((l, t + dy, r, b + dy)).resize((r - l, h), Image.LANCZOS)
    src.paste(donor, (l, t))
    return src


def caption(img, text, y, size=27):
    """One line under the shot. Optional — silence beats filler."""
    d = ImageDraw.Draw(img)
    f = sans(size, 600)
    d.text(((W - tw(d, text, f)) / 2, y), text, font=f, fill=(120, 120, 128))


# ══════════════════════════════════════════════════════════════════════════
# The pins
# ══════════════════════════════════════════════════════════════════════════

# Source screenshots, named so a re-shoot is obvious to re-map.
FOCUS   = "Screenshot 2026-08-13 232306.png"   # projector, 18:30
BREAK   = "82b58445-8168-4f3b-91aa-4c30900292aa-1786776612856_image.png"  # brain break, re-shot Aug 14
EXAM    = "Screenshot 2026-08-13 232626.png"   # two timing groups
NAMES   = "Screenshot 2026-08-13 233227.png"   # random name panel
NOISE   = "Screenshot 2026-08-15 192641.png"   # noise panel, re-shot Aug 15 (taller bar, "Too loud")


def pin_focus():
    img = shell(INDIGO400, 340)
    eyebrow(img, "for your projector", 96)
    y = headline(img, ["The timer the back", "row can actually read"], 152)
    subline(img, "Full-screen countdown, grade-banded focus blocks, and breaks that "
                 "cycle on their own.", y + 22)
    b = place_shot(img, FOCUS, (470, 1248), crop=(0.02, 0.06, 0.98, 0.97))
    caption(img, "Projector mode — nothing but the clock", b + 34)
    footer(img)
    save(img, f"{OUT}/pin-5-projector-clock.png")


def pin_exam():
    img = shell(AMBER400, 340)
    eyebrow(img, "test day", 96, AMBER400)
    y = headline(img, ["Two timing groups.", "One screen."], 152)
    subline(img, "Standard and extended time run side by side, each with its own "
                 "countdown and its own announcements.", y + 22)
    # Crop away the administration log — the two clocks are the entire story.
    b = place_shot(img, EXAM, (470, 1248), crop=(0.03, 0.12, 0.97, 0.663), max_w=952)
    caption(img, "Warnings are wall-clock and never scaled", b + 34)
    footer(img)
    save(img, f"{OUT}/pin-6-two-timing-groups.png")


def pin_break():
    img = shell(EMERALD, 340)
    eyebrow(img, "brain breaks", 96, EMERALD)
    y = headline(img, ["Brain breaks that", "pick themselves"], 152)
    subline(img, "When focus time ends the screen suggests the break — movement, "
                 "social, or quiet — and starts the clock.", y + 22)
    # Paint out the "Suggest a Feature" pill rather than cropping it away —
    # cropping past it pulled the frame off-centre from the clock.
    b = place_shot(img, BREAK, (470, 1248), crop=(0.01, 0.01, 0.99, 0.99), caption_room=10)
    footer(img)
    save(img, f"{OUT}/pin-7-brain-breaks.png")


def pin_names():
    img = shell(INDIGO400, 340)
    eyebrow(img, "cold call, fairly", 96)
    y = headline(img, ["Every student gets", "a turn first"], 152)
    subline(img, "No-repeat mode runs the whole roster before anyone comes up twice. "
                 "Import your class list and it shortens names for you.", y + 22)
    b = place_shot(img, NAMES, (470, 1248), crop=(0.235, 0.02, 1.0, 0.99), max_w=560)
    caption(img, "Names stay on your computer — nothing is uploaded", b + 34)
    footer(img)
    save(img, f"{OUT}/pin-8-random-name.png")


def pin_noise():
    img = shell(EMERALD, 340)
    eyebrow(img, "volume, without nagging", 96, EMERALD)
    y = headline(img, ["Let the screen ask", "for quiet"], 152)
    subline(img, "Set how loud the room may get. It chimes gently when the room "
                 "stays over the line — not the second it spikes.", y + 22)
    b = place_shot(img, NOISE, (470, 1248), crop=(0.03, 0.02, 0.80, 0.99), max_w=470)
    caption(img, "Analyzed live on your device — never recorded", b + 34)
    footer(img)
    save(img, f"{OUT}/pin-9-noise-level.png")


if __name__ == "__main__":
    print("Screenshot pins →")
    pin_focus()
    pin_exam()
    pin_break()
    pin_names()
    pin_noise()
