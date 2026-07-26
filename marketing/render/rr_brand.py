"""
RoomRhythm marketing asset toolkit.

Palette and UI proportions are lifted from the app itself (app/page.tsx), so the
mockups read as the real product rather than generic stock design.
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os

F = "/tmp/fonts/ttf"
SANS = {w: f"{F}/geist-sans-latin-{w}-normal.ttf" for w in (400, 600, 700, 800)}
MONO = {w: f"{F}/geist-mono-latin-{w}-normal.ttf" for w in (400, 500, 700)}

# ── Palette (Tailwind values as used in app/page.tsx) ──────────────────────
BG        = (10, 10, 10)        # neutral-950
INK       = (255, 255, 255)
INDIGO400 = (129, 140, 248)     # timer ring, wordmark gradient start
TEAL400   = (45, 212, 191)      # wordmark gradient end
AMBER500  = (245, 158, 11)      # primary CTA
AMBER400  = (251, 191, 36)
EMERALD   = (52, 211, 153)      # break ring
RED300    = (252, 165, 165)     # near-end
INDIGO900 = (49, 46, 129)
EMERALD800= (6, 94, 96)
BLUE900   = (30, 58, 138)
SLATE900  = (15, 23, 42)

_fc = {}
def font(path, size):
    k = (path, size)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(path, size)
    return _fc[k]

def sans(size, w=700): return font(SANS[w], size)
def mono(size, w=700): return font(MONO[w], size)

def canvas(w, h, bg=BG):
    return Image.new("RGB", (w, h), bg)

# ── Measuring ──────────────────────────────────────────────────────────────
def tw(draw, text, f):
    b = draw.textbbox((0, 0), text, font=f)
    return b[2] - b[0]

def th(draw, text, f):
    b = draw.textbbox((0, 0), text, font=f)
    return b[3] - b[1]

def centered(draw, text, f, y, fill=INK, w=None, img=None):
    W = w or img.width
    draw.text(((W - tw(draw, text, f)) / 2, y), text, font=f, fill=fill)

# ── Gradient helpers ───────────────────────────────────────────────────────
def lerp(c1, c2, t):
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))

def h_gradient(w, h, c1, c2):
    g = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(g)
    for x in range(w):
        d.line([(x, 0), (x, h)], fill=lerp(c1, c2, x / max(1, w - 1)))
    return g

def gradient_text(img, xy, text, f, c1=INDIGO400, c2=TEAL400):
    """Wordmark treatment — indigo→teal, exactly as in the app."""
    d = ImageDraw.Draw(img)
    b = d.textbbox(xy, text, font=f)
    w, h = b[2] - b[0] + 8, b[3] - b[1] + 24
    if w <= 0 or h <= 0: return
    grad = h_gradient(w, h, c1, c2)
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).text((xy[0] - b[0], xy[1] - b[1]), text, font=f, fill=255)
    img.paste(grad, (b[0], b[1]), mask)

def radial_glow(img, cx, cy, r, color, strength=0.30):
    """Soft light bloom — keeps the dark canvas from feeling flat."""
    layer = Image.new("RGB", img.size, (0, 0, 0))
    ImageDraw.Draw(layer).ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    layer = layer.filter(ImageFilter.GaussianBlur(r * 0.55))
    img.paste(Image.blend(img, Image.blend(img, layer, 1.0).point(lambda v: v),
                          0), (0, 0))
    base = img.copy()
    img.paste(Image.blend(base, ImageChops_screen(base, layer), strength), (0, 0))

def ImageChops_screen(a, b):
    from PIL import ImageChops
    return ImageChops.screen(a, b)

def glow(img, cx, cy, r, color, strength=0.35):
    from PIL import ImageChops
    layer = Image.new("RGB", img.size, (0, 0, 0))
    ImageDraw.Draw(layer).ellipse([cx - r, cy - r, cx + r, cy + r], fill=color)
    layer = layer.filter(ImageFilter.GaussianBlur(r * 0.6))
    img.paste(Image.blend(img, ImageChops.screen(img, layer), strength), (0, 0))

# ── Components ─────────────────────────────────────────────────────────────
def timer_ring(img, cx, cy, r, pct, ring=INDIGO400, width=None, label=None,
               lab_size=None, lab_color=INK):
    """The app's hero: 240px ring, r=108, 6px stroke — scaled proportionally."""
    d = ImageDraw.Draw(img)
    width = width or max(4, int(r * 0.055))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=(38, 38, 38), width=width)
    if pct > 0:
        d.arc([cx - r, cy - r, cx + r, cy + r], -90, -90 + 360 * pct,
              fill=ring, width=width)
    if label:
        f = mono(lab_size or int(r * 0.62), 700)
        d.text((cx - tw(d, label, f) / 2, cy - th(d, label, f) / 2 - r * 0.08),
               label, font=f, fill=lab_color)

def pill(img, x, y, text, f, fg=BG, bg=AMBER500, padx=34, pady=18, radius=None):
    d = ImageDraw.Draw(img)
    w, h = tw(d, text, f) + padx * 2, th(d, text, f) + pady * 2
    radius = radius if radius is not None else h // 2
    d.rounded_rectangle([x, y, x + w, y + h], radius=radius, fill=bg)
    b = d.textbbox((0, 0), text, font=f)
    d.text((x + padx - b[0], y + pady - b[1]), text, font=f, fill=fg)
    return w, h

def pill_centered(img, y, text, f, fg=BG, bg=AMBER500, padx=34, pady=18):
    d = ImageDraw.Draw(img)
    w = tw(d, text, f) + padx * 2
    return pill(img, (img.width - w) // 2, y, text, f, fg, bg, padx, pady)

def card(img, x, y, w, h, radius=28, fill=(23, 23, 23), outline=(45, 45, 45)):
    ImageDraw.Draw(img).rounded_rectangle([x, y, x + w, y + h], radius=radius,
                                          fill=fill, outline=outline, width=2)

def wrap(draw, text, f, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if tw(draw, t, f) <= maxw:
            cur = t
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines

def para(img, text, f, y, maxw, fill=(170, 170, 170), lh=1.45, center=True, x=None):
    d = ImageDraw.Draw(img)
    step = int(f.size * lh)
    for ln in wrap(d, text, f, maxw):
        if center:
            d.text(((img.width - tw(d, ln, f)) / 2, y), ln, font=f, fill=fill)
        else:
            d.text((x, y), ln, font=f, fill=fill)
        y += step
    return y

def footer_url(img, y=None, url="roomrhythm.com", size=None, color=(120, 120, 120)):
    d = ImageDraw.Draw(img)
    f = sans(size or max(20, img.width // 42), 600)
    y = y if y is not None else img.height - int(img.height * 0.055)
    d.text(((img.width - tw(d, url, f)) / 2, y), url, font=f, fill=color)

def bullet_rows(img, rows, x, y, fw, fs, gap, dot=AMBER500, fill=(210, 210, 210)):
    d = ImageDraw.Draw(img)
    f = sans(fs, fw)
    for r in rows:
        d.ellipse([x, y + fs * 0.42, x + fs * 0.26, y + fs * 0.42 + fs * 0.26], fill=dot)
        d.text((x + fs * 0.72, y), r, font=f, fill=fill)
        y += gap
    return y

def qr(data, box=10, border=2, dark=(10, 10, 10), light=(255, 255, 255)):
    import qrcode
    q = qrcode.QRCode(box_size=box, border=border,
                      error_correction=qrcode.constants.ERROR_CORRECT_M)
    q.add_data(data); q.make(fit=True)
    return q.make_image(fill_color=dark, back_color=light).convert("RGB")

def save(img, path, dpi=None):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if dpi:
        img.save(path, dpi=dpi)
    else:
        img.save(path)
    print(f"  {os.path.basename(path):<44} {img.width}x{img.height}")
