"""Pinterest pins — 1000x1500 (2:3, the ratio Pinterest actually rewards).

Headlines use EXPLICIT line breaks, never auto-wrap: a marketing headline that
breaks itself in the wrong place reads as amateur, and Pinterest crops hard.
Every pin reserves a fixed footer zone so nothing can collide with the wordmark.
"""
from rr_brand import *
from PIL import ImageDraw

OUT = "/sessions/funny-sweet-dijkstra/mnt/RoomRhythm/marketing/pinterest"
W, H = 1000, 1500
URL = "roomrhythm.com"
FOOTER_TOP = 1330          # nothing may be drawn below this

def shell(accent=INDIGO400, gy=430):
    img = canvas(W, H)
    glow(img, W // 2, gy, 520, accent, 0.15)
    return img

def eyebrow(d, text, y, color=TEAL400, size=25):
    f = sans(size, 700)
    t = " ".join(text.upper())
    d.text(((W - tw(d, t, f)) / 2, y), t, font=f, fill=color)

def lines(img, ls, y, size, w=800, fill=INK, lh=1.10, color2=None):
    """Explicit headline lines, centered. color2 tints every line after the first."""
    d = ImageDraw.Draw(img)
    f = sans(size, w)
    step = int(size * lh)
    for i, ln in enumerate(ls):
        c = fill if (i == 0 or color2 is None) else color2
        d.text(((W - tw(d, ln, f)) / 2, y), ln, font=f, fill=c)
        y += step
    return y

def sub(img, text, y, size=31, maxw=800):
    return para(img, text, sans(size, 400), y, maxw, fill=(158, 158, 158), lh=1.40)

def footer(img, cta="Free · No login · In your browser"):
    d = ImageDraw.Draw(img)
    d.line([(150, FOOTER_TOP - 34), (W - 150, FOOTER_TOP - 34)], fill=(38, 38, 38), width=2)
    f = sans(27, 600)
    d.text(((W - tw(d, cta, f)) / 2, FOOTER_TOP), cta, font=f, fill=(128, 128, 128))
    fw = sans(52, 800)
    gradient_text(img, ((W - tw(d, "RoomRhythm", fw)) // 2, FOOTER_TOP + 48), "RoomRhythm", fw)
    fu = sans(28, 600)
    d.text(((W - tw(d, URL, fu)) / 2, FOOTER_TOP + 118), URL, font=fu, fill=(112, 112, 112))

def chips(img, items, y, gap=60, size=28):
    d = ImageDraw.Draw(img)
    f = sans(size, 600)
    for b in items:
        wp = tw(d, b, f) + 46
        d.rounded_rectangle([(W - wp) // 2, y, (W + wp) // 2, y + 48],
                            radius=24, fill=(24, 24, 24), outline=(46, 46, 46), width=2)
        d.text(((W - tw(d, b, f)) / 2, y + 9), b, font=f, fill=(203, 203, 203))
        y += gap
    return y

# ── Pin 1 — the core classroom timer ───────────────────────────────────────
def pin1():
    img = shell(INDIGO400, 700)
    d = ImageDraw.Draw(img)
    eyebrow(d, "for your projector", 96)
    y = lines(img, ["Free Classroom Timer", "That Runs Your Room"], 146, 74,
              color2=(228, 228, 228))
    sub(img, "Focus blocks, brain breaks, transitions, and sound cues — one calm screen the back row can read.", y + 22)

    timer_ring(img, W // 2, 780, 196, 0.68, INDIGO400, width=12, label="18:42", lab_size=116)
    f = sans(28, 600)
    d.text(((W - tw(d, "FOCUS TIME", f)) / 2, 1002), "FOCUS TIME", font=f, fill=(140, 140, 140))

    chips(img, ["Grade-banded focus blocks", "Gentle break cycles + sound",
                "Name picker + noise meter"], 1078)
    footer(img)
    save(img, f"{OUT}/pin-1-classroom-timer.png")

# ── Pin 2 — the wedge: extended time, side by side ─────────────────────────
def pin2():
    img = shell(TEAL400, 760)
    d = ImageDraw.Draw(img)
    eyebrow(d, "exam timer with extended time", 96)
    y = lines(img, ["Standard and 1.5× Time,", "Side by Side, One Screen"], 146, 66,
              color2=(228, 228, 228))
    sub(img, "Stop juggling stopwatches. Every timing group gets its own countdown — and its own announcements.", y + 22)

    for cx, pct, lab, name, col in [
        (288, 0.55, "22:10", "STANDARD", INDIGO400),
        (712, 0.70, "33:15", "EXTENDED 1.5×", TEAL400),
    ]:
        timer_ring(img, cx, 800, 142, pct, col, width=10, label=lab, lab_size=70)
        f = sans(25, 700)
        d.text((cx - tw(d, name, f) / 2, 968), name, font=f, fill=col)

    card(img, 92, 1040, W - 184, 156, radius=26)
    f1 = sans(29, 700); f2 = sans(24, 400)
    d.text((128, 1072), "Warnings are wall-clock — never scaled.", font=f1, fill=INK)
    para(img, "“5 minutes remaining” means 5 real minutes, for every timing group.",
         f2, 1118, W - 260, fill=(158, 158, 158), center=False, x=128)

    f3 = sans(26, 600)
    t = "For teacher-made finals and mock/practice exams"
    d.text(((W - tw(d, t, f3)) / 2, 1240), t, font=f3, fill=(120, 120, 120))
    footer(img, "Free · No login · No student data")
    save(img, f"{OUT}/pin-2-extended-time.png")

# ── Pin 3 — noise meter ────────────────────────────────────────────────────
def pin3():
    img = shell(EMERALD, 800)
    d = ImageDraw.Draw(img)
    eyebrow(d, "classroom management", 96, EMERALD)
    y = lines(img, ["A Noise Meter", "That Chimes Gently"], 146, 76, color2=(228, 228, 228))
    sub(img, "Set your threshold and let the screen manage the volume, so you don't have to be the volume.", y + 22)

    bx, by, bw, bh = 148, 700, W - 296, 300
    levels = [.22, .35, .30, .52, .68, .61, .84, .72, .46, .33, .28, .20]
    slot = bw / len(levels)
    thr = by + bh - bh * .8
    for i, lv in enumerate(levels):
        h = int(bh * lv)
        x = bx + i * slot + slot * .18
        w = slot * .64
        col = EMERALD if lv < .6 else (AMBER500 if lv < .8 else RED300)
        d.rounded_rectangle([x, by + bh - h, x + w, by + bh], radius=int(w / 2.6), fill=col)
    d.line([(bx, thr), (bx + bw, thr)], fill=(96, 96, 96), width=3)
    f = sans(23, 600)
    d.text((bx, thr - 34), "YOUR THRESHOLD", font=f, fill=(118, 118, 118))

    chips(img, ["Nothing is recorded", "Nothing leaves the room", "Nothing to install"], 1070)
    footer(img)
    save(img, f"{OUT}/pin-3-noise-meter.png")

# ── Pin 4 — name picker / privacy ──────────────────────────────────────────
def pin4():
    img = shell(AMBER500, 780)
    d = ImageDraw.Draw(img)
    eyebrow(d, "random name picker", 96, AMBER400)
    y = lines(img, ["Pick a Name.", "Names Never Leave", "This Device."], 146, 72,
              color2=(228, 228, 228))
    sub(img, "No-repeat mode, projector-sized, and your roster stays on your own computer — never uploaded.", y + 20)

    card(img, 128, 760, W - 256, 250, radius=34, fill=(19, 19, 19))
    f = sans(104, 800)
    d.text(((W - tw(d, "Amelia R.", f)) / 2, 812), "Amelia R.", font=f, fill=INK)
    fs = sans(25, 600)
    d.text(((W - tw(d, "TAP TO PICK AGAIN", fs)) / 2, 946), "TAP TO PICK AGAIN",
           font=fs, fill=(115, 115, 115))

    chips(img, ["No account. No ads.", "No student data collected.",
                "Just open it and teach."], 1070)
    footer(img)
    save(img, f"{OUT}/pin-4-name-picker.png")

if __name__ == "__main__":
    print("Pinterest pins (1000x1500):")
    pin1(); pin2(); pin3(); pin4()
