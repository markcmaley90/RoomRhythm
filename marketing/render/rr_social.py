"""Instagram (square + story), Facebook/X link cards, and the staff-room flyer."""
from rr_brand import *
from PIL import ImageDraw

ROOT = "/sessions/funny-sweet-dijkstra/mnt/RoomRhythm/marketing"
URL = "roomrhythm.org"

def hl(img, ls, y, size, w=800, fill=INK, lh=1.10, color2=None, W=None):
    d = ImageDraw.Draw(img)
    W = W or img.width
    f = sans(size, w)
    for i, ln in enumerate(ls):
        c = fill if (i == 0 or color2 is None) else color2
        d.text(((W - tw(d, ln, f)) / 2, y), ln, font=f, fill=c)
        y += int(size * lh)
    return y

def eyebrow(d, W, text, y, color=TEAL400, size=24):
    f = sans(size, 700)
    t = " ".join(text.upper())
    d.text(((W - tw(d, t, f)) / 2, y), t, font=f, fill=color)

def markline(img, y, size=44, url=True, usize=24):
    d = ImageDraw.Draw(img)
    fw = sans(size, 800)
    gradient_text(img, ((img.width - tw(d, "RoomRhythm", fw)) // 2, y), "RoomRhythm", fw)
    if url:
        fu = sans(usize, 600)
        d.text(((img.width - tw(d, URL, fu)) / 2, y + int(size * 1.24)), URL,
               font=fu, fill=(115, 115, 115))

# ══ Instagram square 1080x1080 ═════════════════════════════════════════════
def ig_hero():
    W = H = 1080
    img = canvas(W, H); glow(img, W // 2, 560, 480, INDIGO400, .16)
    d = ImageDraw.Draw(img)
    eyebrow(d, W, "free · no login · no ads", 92)
    hl(img, ["The Screen That", "Runs Your Room"], 146, 86, color2=(228, 228, 228))
    timer_ring(img, W // 2, 600, 158, .68, INDIGO400, width=10, label="18:42", lab_size=92)
    f = sans(27, 600)
    d.text(((W - tw(d, "FOCUS TIME", f)) / 2, 782), "FOCUS TIME", font=f, fill=(140, 140, 140))
    t = "Focus blocks · Breaks · Transitions · Sound"
    f2 = sans(29, 600)
    d.text(((W - tw(d, t, f2)) / 2, 856), t, font=f2, fill=(180, 180, 180))
    markline(img, 930)
    save(img, f"{ROOT}/instagram/ig-square-1-hero.png")

def ig_wedge():
    W = H = 1080
    img = canvas(W, H); glow(img, W // 2, 600, 500, TEAL400, .15)
    d = ImageDraw.Draw(img)
    eyebrow(d, W, "the part nothing else does", 92)
    hl(img, ["Extended Time,", "Side by Side"], 146, 88, color2=(228, 228, 228))
    for cx, pct, lab, name, col in [(320, .55, "22:10", "STANDARD", INDIGO400),
                                    (760, .70, "33:15", "1.5× TIME", TEAL400)]:
        timer_ring(img, cx, 600, 128, pct, col, width=9, label=lab, lab_size=62)
        f = sans(25, 700)
        d.text((cx - tw(d, name, f) / 2, 752), name, font=f, fill=col)
    t = "Announcements fire at true wall-clock offsets"
    f2 = sans(28, 600)
    d.text(((W - tw(d, t, f2)) / 2, 838), t, font=f2, fill=(175, 175, 175))
    t2 = "for teacher-made finals and mock/practice exams"
    f3 = sans(23, 400)
    d.text(((W - tw(d, t2, f3)) / 2, 880), t2, font=f3, fill=(120, 120, 120))
    markline(img, 940)
    save(img, f"{ROOT}/instagram/ig-square-2-extended-time.png")

def ig_privacy():
    W = H = 1080
    img = canvas(W, H); glow(img, W // 2, 540, 460, EMERALD, .13)
    d = ImageDraw.Draw(img)
    eyebrow(d, W, "privacy, in plain english", 92, EMERALD)
    hl(img, ["Nothing About Your", "Students Leaves", "Your Device."], 150, 74,
       color2=(228, 228, 228))
    # "No account, ever" would age badly — CLAUDE.md's roadmap has Supabase auth
    # for the paid tier. "No account needed" stays true either way.
    rows = ["No account needed", "No ads, no trackers", "Rosters stay on your computer",
            "Exam logs: initials + seat only", "Cookieless analytics"]
    y = 520
    f = sans(31, 600)
    for r in rows:
        cw = tw(d, r, f) + 92
        x = (W - cw) // 2
        d.rounded_rectangle([x, y, x + cw, y + 62], radius=31, fill=(21, 21, 21),
                            outline=(44, 44, 44), width=2)
        d.ellipse([x + 30, y + 24, x + 44, y + 38], fill=EMERALD)
        d.text((x + 62, y + 15), r, font=f, fill=(206, 206, 206))
        y += 74
    markline(img, 930)
    save(img, f"{ROOT}/instagram/ig-square-3-privacy.png")

# ══ Instagram story 1080x1920 ══════════════════════════════════════════════
def ig_story_hero():
    W, H = 1080, 1920
    img = canvas(W, H); glow(img, W // 2, 900, 620, INDIGO400, .17)
    d = ImageDraw.Draw(img)
    eyebrow(d, W, "back to school 2026", 300)
    hl(img, ["The Screen", "That Runs", "Your Room"], 372, 116, color2=(228, 228, 228))
    timer_ring(img, W // 2, 1080, 190, .68, INDIGO400, width=12, label="18:42", lab_size=112)
    f = sans(31, 600)
    for i, t in enumerate(["Focus blocks · Brain breaks",
                           "Name picker · Noise meter",
                           "Free. No login. No ads."]):
        d.text(((W - tw(d, t, f)) / 2, 1330 + i * 52), t, font=f, fill=(180, 180, 180))
    pill_centered(img, 1540, "Open it in your browser", sans(34, 700))
    markline(img, 1680, 56, usize=28)
    save(img, f"{ROOT}/instagram/ig-story-1-hero.png")

def ig_story_wedge():
    W, H = 1080, 1920
    img = canvas(W, H); glow(img, W // 2, 950, 620, TEAL400, .16)
    d = ImageDraw.Draw(img)
    eyebrow(d, W, "test day, handled", 300)
    hl(img, ["Standard and", "1.5× Time on", "One Screen"], 372, 110, color2=(228, 228, 228))
    for cy, pct, lab, name, col in [(920, .55, "22:10", "STANDARD", INDIGO400),
                                    (1240, .70, "33:15", "EXTENDED 1.5×", TEAL400)]:
        timer_ring(img, 330, cy, 130, pct, col, width=9, label=lab, lab_size=64)
        f = sans(34, 700)
        d.text((530, cy - 46), name, font=f, fill=col)
        f2 = sans(25, 400)
        d.text((530, cy + 6), "own countdown,", font=f2, fill=(150, 150, 150))
        d.text((530, cy + 40), "own announcements", font=f2, fill=(150, 150, 150))
    t = "Warnings never scale — 5 minutes means 5 real minutes"
    f3 = sans(27, 600)
    d.text(((W - tw(d, t, f3)) / 2, 1452), t, font=f3, fill=(170, 170, 170))
    pill_centered(img, 1540, "Free for every teacher", sans(34, 700))
    markline(img, 1680, 56, usize=28)
    save(img, f"{ROOT}/instagram/ig-story-2-extended-time.png")

# ══ Facebook / X link cards 1200x630 ═══════════════════════════════════════
def card_1200(name, eyeb, ls, subt, accent, ring=True, pct=.68, lab="18:42"):
    W, H = 1200, 630
    img = canvas(W, H); glow(img, 300, H // 2, 460, accent, .15)
    d = ImageDraw.Draw(img)
    if ring:
        timer_ring(img, 250, H // 2, 148, pct, accent, width=10, label=lab, lab_size=86)
    x = 470
    f0 = sans(22, 700)
    d.text((x, 128), " ".join(eyeb.upper()), font=f0, fill=accent)
    y = 172
    f1 = sans(56, 800)
    for i, ln in enumerate(ls):
        d.text((x, y), ln, font=f1, fill=INK if i == 0 else (228, 228, 228))
        y += 64
    y += 14
    f2 = sans(26, 400)
    for ln in wrap(d, subt, f2, W - x - 70):
        d.text((x, y), ln, font=f2, fill=(158, 158, 158)); y += 38
    fw = sans(38, 800)
    gradient_text(img, (x, 500), "RoomRhythm", fw)
    fu = sans(24, 600)
    d.text((x, 552), f"{URL}  ·  Free · No login", font=fu, fill=(118, 118, 118))
    save(img, f"{ROOT}/link-cards/{name}")

# ══ Staff-room flyer — 8.5x11 at 150dpi, PRINT-FRIENDLY (light bg) ═════════
def flyer():
    W, H = 1275, 1650          # 8.5x11 @150dpi
    img = canvas(W, H, (255, 255, 255))
    d = ImageDraw.Draw(img)

    # header band
    d.rectangle([0, 0, W, 186], fill=(10, 10, 10))
    fw = sans(58, 800)
    gradient_text(img, (72, 60), "RoomRhythm", fw)
    f = sans(25, 600)
    d.text((72, 128), "The screen that runs your room.", font=f, fill=(165, 165, 165))

    f2 = sans(60, 800)
    for i, ln in enumerate(["A free classroom timer", "for your projector."]):
        d.text((72, 250 + i * 70), ln, font=f2, fill=(15, 15, 15))

    f3 = sans(28, 400)
    y = 410
    for ln in wrap(d, "Focus blocks, brain breaks, transitions, and sound cues — plus a random name picker and a noise meter. Nothing to install, no account to make.", f3, W - 420):
        d.text((72, y), ln, font=f3, fill=(90, 90, 90)); y += 42

    # QR block
    q = qr(f"https://{URL}", box=9, border=1).resize((260, 260), Image.NEAREST)
    img.paste(q, (W - 332, 250))
    fq = sans(21, 600)
    d.text((W - 332, 522), "Scan to open it now", font=fq, fill=(110, 110, 110))

    # feature rows
    y = 610
    d.line([(72, y), (W - 72, y)], fill=(224, 224, 224), width=2); y += 42
    feats = [
        ("Focus blocks that fit your grade band", "K–2 through university, with break cycles built in."),
        ("A noise meter that chimes gently", "Set a threshold; the room manages its own volume."),
        ("A random name picker", "No-repeat mode. Rosters never leave your computer."),
        ("And it can run test day", "Standard and extended-time groups (1.5×/2×) side by side,\nwith announcements at true wall-clock offsets."),
    ]
    fa = sans(31, 700); fb = sans(25, 400)
    for t, s in feats:
        d.ellipse([72, y + 12, 90, y + 30], fill=AMBER500)
        d.text((116, y), t, font=fa, fill=(20, 20, 20))
        yy = y + 42
        for ln in s.split("\n"):
            d.text((116, yy), ln, font=fb, fill=(105, 105, 105)); yy += 34
        y = yy + 26

    # promise strip
    d.rounded_rectangle([72, y, W - 72, y + 118], radius=18, fill=(246, 246, 246))
    fp = sans(30, 700)
    d.text((104, y + 24), "Free for every teacher. No account, no ads.", font=fp, fill=(20, 20, 20))
    fp2 = sans(24, 400)
    # NOTE (compliance): the name picker stores roster names on the teacher's own
    # device, so "nothing is collected" would be false. Claim the transmission
    # boundary, not the storage boundary. See lib/rosters.ts and AdminLog.tsx.
    d.text((104, y + 66), "Rosters stay on your device. Exam logs record initials and seat numbers only.",
           font=fp2, fill=(105, 105, 105))

    # byline
    fu2 = sans(23, 400)
    t = "Built by a solo developer. Tell me what to build next."
    d.text(((W - tw(d, t, fu2)) / 2, H - 470), t, font=fu2, fill=(130, 130, 130))

    # ── tear-off tabs — the reason staff-room flyers actually work ──────────
    tab_top = H - 372
    d.line([(72, tab_top), (W - 72, tab_top)], fill=(180, 180, 180), width=2)
    fi = sans(22, 600)
    d.text((72, tab_top - 34), "TEAR OFF AND TAKE ONE", font=fi, fill=(140, 140, 140))

    n, x0, x1 = 8, 72, W - 72
    tabw = (x1 - x0) / n
    strip_len = H - tab_top - 34
    strip = Image.new("RGB", (strip_len, int(tabw) - 10), (255, 255, 255))
    sd = ImageDraw.Draw(strip)
    ft = sans(34, 800)
    ty = (strip.height - 40) / 2
    sd.text((22, ty), URL, font=ft, fill=(15, 15, 15))
    fq2 = sans(19, 400)
    sd.text((22, ty + 40), "free classroom timer", font=fq2, fill=(150, 150, 150))
    strip = strip.rotate(90, expand=True)
    for i in range(n):
        x = int(x0 + i * tabw)
        img.paste(strip, (x + 5, tab_top + 16))
        if i:  # dashed cut line between tabs
            for yy in range(tab_top + 6, H - 14, 16):
                d.line([(x, yy), (x, yy + 8)], fill=(203, 203, 203), width=2)

    save(img, f"{ROOT}/print/flyer-staff-room.png", dpi=(150, 150))
    img.save(f"{ROOT}/print/flyer-staff-room.pdf", "PDF", resolution=150)
    print("  flyer-staff-room.pdf                         8.5x11in @150dpi")

if __name__ == "__main__":
    print("Instagram:")
    ig_hero(); ig_wedge(); ig_privacy(); ig_story_hero(); ig_story_wedge()
    print("Link cards (1200x630):")
    card_1200("og-1-classroom.png", "free classroom screen",
              ["The screen that", "runs your room."],
              "Focus blocks, brain breaks, transitions, and sound — one calm projector screen the back row can read.",
              INDIGO400)
    card_1200("og-2-extended-time.png", "exam timer with extended time",
              ["Standard and 1.5×", "on one screen."],
              "Every timing group gets its own countdown and its own announcements, at true wall-clock offsets.",
              TEAL400, pct=.55, lab="22:10")
    card_1200("og-3-privacy.png", "privacy-first by design",
              ["No login. No ads.", "Nothing uploaded."],
              "Rosters stay on your device. Exam logs record initials and seat numbers only — never names or IDs.",
              EMERALD, pct=.82, lab="09:12")
    print("Print:")
    flyer()
