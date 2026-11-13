"""Banda sonora del video: música sintetizada + efectos sincronizados con los fotogramas del video.

    python scripts/gen_audio.py          -> public/audio/soundtrack.wav (20 s, 48 kHz, estéreo)

- Música, whooshes, impactos, campanas y el zumbido de arrastre se sintetizan aquí (sin licencias de terceros).
- Clics, puertas y sonidos de interfaz son grabaciones de Shapeforms Audio (packs gratuitos "Future UI" y
  "Cassette"), leídas de SFX_DIR. Su licencia permite usarlas dentro del video terminado, pero NO redistribuir
  los archivos: por eso public/audio/ está en .gitignore y el repo solo publica el MP4 ya mezclado.
- Los fotogramas de cada efecto salen de src/timeline.ts y public/capture/manifest.json: si cambias tiempos
  allí, actualiza los fotogramas de effects().
"""
import json
import os
from math import gcd

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, fftconvolve, resample_poly, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SFX_DIR = os.environ.get("SFX_DIR", r"D:\mycowork\resources\sounds\Itch_shapeforms\Shapeforms Audio Free Sound Effects")
OUT = os.path.join(ROOT, "public", "audio", "soundtrack.wav")
SR, FPS, DUR = 48000, 30, 20.0
N = int(SR * DUR)
BEAT = 0.5  # 120 BPM: 1 tiempo = 15 fotogramas
MUSIC_DB = -10  # nivel de la música respecto a los efectos (sube/baja aquí si quieres más o menos música)
rng = np.random.default_rng(7)


# ---------------------------------------------------------------- utilidades
def sec(frame):
    return frame / FPS


def midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def db(g):
    return 10 ** (g / 20)


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def pan(x, p=0.0):
    a = (p + 1) * np.pi / 4  # potencia constante, p en -1..1
    return np.stack([x * np.cos(a), x * np.sin(a)], 1)


def bus():
    return np.zeros((N, 2))


def put(b, x, t0, gain=1.0, p=0.0):
    if x.ndim == 1:
        x = pan(x, p)
    i = int(round(t0 * SR))
    if i < 0:
        x, i = x[-i:], 0
    n = min(len(x), N - i)
    if n > 0:
        b[i : i + n] += x[:n] * gain


def filt(kind, x, fc, order=2):
    return sosfilt(butter(order, fc, kind, fs=SR, output="sos"), x, axis=0)


def fade_edges(x, a=0.004, r=0.02):
    n = len(x)
    e = np.ones(n)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    e[n - nr :] *= np.linspace(1, 0, nr)
    return x * (e if x.ndim == 1 else e[:, None])


def make_ir(seconds, seed):
    t = tt(seconds)
    ir = np.random.default_rng(seed).standard_normal(len(t)) * np.exp(-t * 6.9 / seconds)
    ir = filt("low", ir, 7000)
    k = int(0.01 * SR)
    ir[:k] *= np.linspace(0, 1, k)
    return ir / np.sqrt((ir ** 2).sum())


IR = (make_ir(2.6, 1), make_ir(2.6, 2))


def reverb(b):
    m = b.mean(1)
    return np.stack([fftconvolve(m, IR[0])[:N], fftconvolve(m, IR[1])[:N]], 1)


# ---------------------------------------------------------------- instrumentos
def saw(f, t):
    """Diente de sierra sin aliasing (aditivo)."""
    y = np.zeros_like(t)
    for k in range(1, max(2, min(28, int(9000 / f)))):
        y += np.sin(2 * np.pi * k * f * t + k * 0.7) / k
    return y


def pad_note(m, dur, attack, release):
    t = tt(dur + release)
    y = sum(saw(midi(m) * 2 ** (c / 1200), t) for c in (-8, 0, 8)) / 3
    env = np.minimum(1, t / attack) * np.clip((dur + release - t) / release, 0, 1)
    return y * env


def ep_note(m, vel, dur=1.6):
    """Piano eléctrico FM (timbre de 'tine')."""
    t, f = tt(dur), midi(m)
    y = np.sin(2 * np.pi * f * t + 1.3 * np.exp(-t * 5) * np.sin(2 * np.pi * f * t))
    y += 0.12 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 14)
    return fade_edges(y * np.exp(-t * 2.4) * vel)


def bass_note(m, dur, vel, decay=2.2):
    t, f = tt(dur), midi(m)
    y = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(4 * np.pi * f * t) + 0.08 * np.sin(6 * np.pi * f * t)
    return fade_edges(y * np.exp(-t * decay) * vel, 0.006, 0.06)


def kick():
    t = tt(0.5)
    f = 46 + 80 * np.exp(-t * 32)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    y += 0.12 * filt("low", rng.standard_normal(len(t)), 2500) * np.exp(-t * 90)
    return fade_edges(y, 0.001)


def snap():
    t = tt(0.35)
    y = filt("band", rng.standard_normal(len(t)), [1100, 5200]) * np.exp(-t * 28)
    y += 0.35 * np.sin(2 * np.pi * 210 * t) * np.exp(-t * 45)
    return fade_edges(y, 0.001)


def hat(vel):
    t = tt(0.09)
    return fade_edges(filt("high", rng.standard_normal(len(t)), 7500) * np.exp(-t * 65) * vel, 0.001)


def pluck(m, vel):
    t, f = tt(0.4), midi(m)
    y = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 20)
    return fade_edges(y * np.exp(-t * 13) * vel, 0.002)


def bell(m, vel=1.0, dur=2.0):
    """Campana FM limpia (no 8 bits: senos con decaimiento natural)."""
    t, f = tt(dur), midi(m)
    y = np.sin(2 * np.pi * f * t + 2.2 * np.exp(-t * 3.5) * np.sin(2 * np.pi * 1.41 * f * t))
    y += 0.25 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 5)
    return fade_edges(y * np.exp(-t * 2.0) * vel, 0.002, 0.2)


BANDS = [180, 360, 720, 1440, 2880, 5760, 11000]


def swept_noise(n, pos, seed):
    """Ruido cuyo centro de frecuencia sigue `pos` (0 = grave, 1 = agudo): base de whooshes y subidas."""
    noise = np.random.default_rng(seed).standard_normal(n)
    out = np.zeros(n)
    for i, c in enumerate(BANDS):
        w = np.exp(-((pos * (len(BANDS) - 1) - i) ** 2) / 0.9)
        out += filt("band", noise, [c / 1.6, min(c * 1.6, SR / 2 - 200)]) * w
    return out


def whoosh(dur=1.05, peak=0.42, lo=0.12, hi=0.78, end=0.4):
    t = tt(dur)
    pos = np.where(t < peak, lo + (hi - lo) * (t / peak) ** 1.5, hi + (end - hi) * ((t - peak) / (dur - peak)))
    env = np.where(t < peak, (t / peak) ** 2.2, np.exp(-(t - peak) * 7))
    l = swept_noise(len(t), pos, 11) * env
    r = swept_noise(len(t), pos, 12) * env
    sweep = np.clip(t / dur, 0, 1)  # paneo leve de izquierda a derecha
    return fade_edges(np.stack([l * (1.1 - 0.4 * sweep), r * (0.7 + 0.4 * sweep)], 1), 0.002, 0.05)


def riser(dur):
    t = tt(dur)
    pos = 0.08 + 0.85 * (t / dur) ** 1.4
    env = (t / dur) ** 2.5
    return fade_edges(np.stack([swept_noise(len(t), pos, 21), swept_noise(len(t), pos, 22)], 1) * env[:, None], 0.01, 0.03)


def boom(dur=2.4):
    t = tt(dur)
    f = 36 + 34 * np.exp(-t * 9)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.0)
    y += 0.5 * filt("low", rng.standard_normal(len(t)), 140) * np.exp(-t * 9)
    return fade_edges(y, 0.003, 0.3)


def thunk():
    t = tt(0.3)
    f = 70 + 50 * np.exp(-t * 40)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 22)
    y += 0.3 * filt("band", rng.standard_normal(len(t)), [300, 1800]) * np.exp(-t * 60)
    return fade_edges(y, 0.001)


_cache = {}


def sample(rel, rate=1.0):
    """Grabación de Shapeforms, normalizada a pico 1 y remuestreada a 48 kHz (rate > 1 = más agudo)."""
    key = (rel, rate)
    if key not in _cache:
        sr, x = wavfile.read(os.path.join(SFX_DIR, rel))
        x = x.astype(np.float64)
        x = np.stack([x, x], 1) if x.ndim == 1 else x[:, :2]
        x /= np.abs(x).max() or 1
        target = int(round(SR / rate))
        g = gcd(target, sr)
        _cache[key] = fade_edges(resample_poly(x, target // g, sr // g, axis=0), 0.001, 0.01)
    return _cache[key]


CLICK = "Cassette Preview/AUDIO/BUTTON_12.wav"
DOOR = "Cassette Preview/AUDIO/OPEN_CASE_02.wav"
TAP = "Future UI Preview/Audio/Holographic Tap Interaction.wav"
GADGET = "Future UI Preview/Audio/High-Tech Gadget Activate.wav"
RADIATE = "Future UI Preview/Audio/FUI Holographic Interaction Radiate.wav"
MENU = "Future UI Preview/Audio/Hologram Menu Open-2.wav"

# ---------------------------------------------------------------- música
# (inicio s, fin s, bajo, voces del pad). Re mayor: Dmaj9 · Bm9 · Gmaj9 · A6/9; cadencia A -> D en el cierre (17 s).
CHORDS = [
    (0, 4, 38, [57, 61, 64, 66]),
    (4, 6, 35, [54, 57, 61, 62]),
    (6, 8, 31, [54, 57, 59, 62]),
    (8, 10, 33, [52, 57, 59, 61]),
    (10, 12, 38, [57, 61, 64, 66]),
    (12, 14, 35, [54, 57, 61, 62]),
    (14, 16, 31, [54, 57, 59, 62]),
    (16, 17, 33, [52, 57, 59, 61]),
    (17, 20, 38, [57, 61, 64, 66, 69]),
]
GROOVE = (2.0, 17.0)  # batería y bajo
ARP = (7.0, 17.0)  # arpegio: más energía en color y despiece


def music():
    pad_dark, pad_bright, dry, send = bus(), bus(), bus(), bus()
    for i, (s, e, root, voices) in enumerate(CHORDS):
        last = i == len(CHORDS) - 1
        for j, m in enumerate(voices):
            x = pad_note(m, e - s, 1.6 if i == 0 else 0.35, 2.2 if last else 0.6) * 0.16
            p = (-0.35, 0.35)[j % 2]
            put(pad_dark, x, s, p=p)
            put(pad_bright, x, s, p=p)
        # piano eléctrico: acordes sincopados dentro del groove; acorde final largo en el cierre
        if GROOVE[0] <= s < GROOVE[1]:
            for off, vel in ((0, 0.5), (0.75, 0.32), (1.25, 0.4)):
                if s + off < e:
                    for j, m in enumerate(voices[1:]):
                        put(dry, ep_note(m + 12, vel * 0.22), s + off, p=(j - 1) * 0.3)
                        put(send, ep_note(m + 12, vel * 0.22), s + off)
            for off, length, vel in ((0, 1.2, 1.0), (0.75, 0.35, 0.55), (1.0, 0.9, 0.8), (1.75, 0.3, 0.55)):
                if s + off < e:
                    put(dry, bass_note(root, length * 0.95, vel * 0.42), s + off)
        if last:
            for j, m in enumerate(voices[1:]):
                put(dry, ep_note(m + 12, 0.26, 3.0), s + 0.012 * j, p=(j - 1.5) * 0.3)
                put(send, ep_note(m + 12, 0.3, 3.0), s)
            put(dry, bass_note(root, 2.9, 0.5, decay=1.1), s)
        # arpegio en semicorcheas
        if ARP[0] <= s < ARP[1]:
            notes = sorted(voices) + [voices[0] + 12, voices[1] + 12]
            k = 0
            for t0 in np.arange(s, e, BEAT / 4):
                m = notes[k % len(notes)] + 12
                x = pluck(m, 0.075 * (1.0 if k % 4 == 0 else 0.7))
                put(dry, x, t0, p=0.45 if k % 2 else -0.45)
                put(send, x * 1.5, t0)
                k += 1
    # pad: se abre el filtro durante la intro (oscuro -> brillante)
    pad_dark, pad_bright = filt("low", pad_dark, 450), filt("low", pad_bright, 1900)
    t = np.arange(N) / SR
    w = np.clip(t / 2.2, 0, 1)[:, None]
    pad = pad_dark * (1 - w) + pad_bright * w
    dry += pad
    send += pad * 0.35
    # batería
    for b in np.arange(GROOVE[0], GROOVE[1] - 1e-6, 2 * BEAT):  # 2 tiempos = 1 s
        put(dry, kick() * 0.55, b)
        put(dry, snap() * 0.16, b + BEAT, p=0.1)
        put(send, snap() * 0.12, b + BEAT)
        for k, h in enumerate(np.arange(b, b + 2 * BEAT, BEAT / 2)):
            put(dry, hat(0.11 if k % 2 else 0.05), h + 0.003 * k, p=0.25)
    # subida hacia el despiece (12 s) y golpe de bombo en la resolución (17 s)
    put(dry, riser(1.4) * 0.05, 12.0 - 1.4)
    put(dry, kick() * 0.5, 17.0)
    m = dry + reverb(send) * 0.32
    # fundido final
    t0 = int(19.0 * SR)
    m[t0:] *= np.cos(np.linspace(0, np.pi / 2, N - t0))[:, None] ** 2
    return m


# ---------------------------------------------------------------- efectos (fotogramas globales a 30 fps)
def drag_whir(sfx, cursor, offset):
    """Zumbido de aire que sigue la velocidad real del arrastre del cursor (manifest)."""
    speed = np.zeros(int(DUR * FPS) + 2)
    prev = None
    for c in cursor:
        if prev and c["down"] and prev["down"]:
            speed[offset + c["f"]] = np.hypot(c["x"] - prev["x"], c["y"] - prev["y"])
        prev = c
    if speed.max() == 0:
        return
    speed = np.convolve(speed, np.ones(5) / 5, "same") / speed.max()
    amp = np.interp(np.arange(N) / SR, np.arange(len(speed)) / FPS, speed)
    pos = 0.25 + 0.35 * amp
    noise = np.stack([swept_noise(N, pos, 31), swept_noise(N, pos, 32)], 1)
    sfx += noise * (amp ** 1.3)[:, None] * 0.07


def effects():
    sfx, send = bus(), bus()
    man = json.load(open(os.path.join(ROOT, "public", "capture", "manifest.json"), encoding="utf-8"))

    def fx(x, frame, gain_db, rev=0.0, p=0.0):
        put(sfx, x, sec(frame), db(gain_db), p)
        if rev:
            put(send, x, sec(frame), db(gain_db) * rev, p)

    # 0 s: logo
    fx(boom(), 0, -6)
    fx(sample(RADIATE, 0.9), 1, -14, rev=0.6)
    for k, m in enumerate((74, 81, 85, 90)):  # D5 A5 C#6 F#6
        fx(bell(m + 12, 1.0), 2 + 2 * k, -27, rev=1.2)
    # cambios de escena: whoosh con cada desplazamiento vertical (BG_SHIFTS de timeline.ts)
    for f in (54, 198, 348, 498):
        fx(whoosh(), f - 4, -9, rev=0.25)
    # arrastres reales (escena 2: girar, escena 3: mirar en la cabina, escena 4: girar el despiece)
    drag_whir(sfx, man["sequences"]["a"]["cursor"], 60)
    drag_whir(sfx, man["sequences"]["b"]["cursor"], 210)
    drag_whir(sfx, man["sequences"]["c"]["cursor"], 360)
    # escena 2: clic en "Abrir todo" y las puertas se abren
    fx(sample(CLICK), 134, -8)
    fx(sample(DOOR, 0.85), 136, -13, p=-0.3)
    fx(sample(DOOR, 0.75), 140, -15, p=0.3)
    fx(whoosh(0.7, 0.3, 0.1, 0.45, 0.2), 136, -19)
    fx(thunk(), 151, -16)
    # escena 3: clic en la vista "Interior" (secuencia b f12) y la cámara entra en la cabina
    fx(sample(CLICK), 222, -8)
    fx(sample(TAP), 222, -15)
    fx(whoosh(1.2, 0.36, 0.1, 0.6, 0.3), 224, -12, rev=0.3)
    fx(bell(86, 0.9), 240, -22, rev=1.0)  # ya dentro: Re
    # escena 4: "Desarmar" y despiece
    fx(sample(CLICK), 372, -8)
    fx(sample(GADGET), 373, -11)
    fx(riser(1.5), 375, -17, rev=0.3)
    fx(sample(RADIATE), 380, -11, rev=0.5)
    fx(boom(1.6), 420, -15)
    fx(sample(MENU), 436, -15, rev=0.3)  # tarjeta de la pestaña Piezas
    # escena 5: logo y botón
    fx(boom(), 510, -9)
    for k, m in enumerate((74, 78, 81, 85)):
        fx(bell(m + 12, 1.0), 512 + 2 * k, -27, rev=1.2)
    fx(sample(CLICK), 567, -10)
    fx(sample(TAP, 1.1), 567, -18)
    return sfx + reverb(send) * 0.4


def main():
    m, s = music(), effects()
    # la música se aparta un poco cuando suenan los efectos
    env = np.convolve(np.abs(s).mean(1), np.ones(int(0.08 * SR)) / int(0.08 * SR), "same")
    duck = 1 / (1 + 4.0 * env / (env.max() or 1))
    mix = m * db(MUSIC_DB) * duck[:, None] + s
    mix = filt("high", mix, 28)
    mix /= np.percentile(np.abs(mix), 99.95) / 0.7
    mix = np.tanh(mix * 1.15) / np.tanh(1.15) * 0.89  # limitador suave, pico ≈ -1 dBFS
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    wavfile.write(OUT, SR, (mix * 32767).astype(np.int16))
    rms = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
    print(f"{OUT}  pico {20*np.log10(np.abs(mix).max()):.1f} dBFS  RMS {rms(mix):.1f} dBFS")
    for a, b, name in ((0, 2, "intro"), (2, 7, "explora"), (7, 12, "interior"), (12, 17, "despiece"), (17, 20, "cierre")):
        print(f"  {name:9s} {a:>2}-{b:<2}s  RMS {rms(mix[int(a*SR):int(b*SR)]):.1f} dBFS")


if __name__ == "__main__":
    main()
