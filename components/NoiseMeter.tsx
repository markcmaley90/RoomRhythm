"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudioEngine } from "@/lib/audio";
import { track } from "@/lib/analytics";

/**
 * Classroom-only room-volume meter. Never rendered in the Testing profile.
 *
 * PRIVACY — this is true by construction, not by policy: the mic stream is fed
 * to an AnalyserNode and reduced to a single RMS number per frame. There is no
 * MediaRecorder, no buffer retained, and no network call anywhere in this file.
 * The analyser is deliberately NOT connected to ctx.destination (that would echo
 * the room back through the speakers).
 */

type MeterState = "idle" | "listening" | "denied" | "nomic" | "busy" | "unsupported";

const PRIVACY_LINE =
  "Sound is analyzed on this device in real time — nothing is recorded or transmitted.";

const SUSTAIN_MS = 3000; // must stay above threshold this long
// Chime AGAIN while the room stays loud. 15s felt like a single chime that
// then gave up: a class that ignores the first one hears nothing for a
// quarter of a minute, which teaches them the screen doesn't follow through.
// 8s reads as "it's still watching" without becoming an alarm — and the
// sustain window means it can only repeat while the room is genuinely still
// over the line, never on a single spike.
const COOLDOWN_MS = 8000;
// A classroom is not a steady tone — it dips between syllables and between
// speakers. Requiring an unbroken 3s above the line meant the accumulator kept
// resetting on those gaps and the chime almost never fired in a real room.
// Brief dips are forgiven; a genuine drop in volume still cancels.
const DIP_GRACE_MS = 700;

const RETRY_BTN =
  "rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-indigo-500";

export default function NoiseMeter({ onClose, muted }: { onClose: () => void; muted: boolean }) {
  const [state, setState] = useState<MeterState>("idle");
  const [level, setLevel] = useState(0); // 0..100, smoothed
  // 55 on the new decibel-based scale sits just above ordinary conversation,
  // which is where a teacher actually wants the line. On the old linear scale
  // the default of 65 was unreachable by any real room.
  const [threshold, setThreshold] = useState(55); // in-memory only, by decision
  const [chimedAt, setChimedAt] = useState<number | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothedRef = useRef(0);
  const aboveSinceRef = useRef<number | null>(null);
  const dipSinceRef = useRef<number | null>(null);
  // 0..1 — how far along the sustain window we are. Drives the arming ring, so
  // a teacher can see the chime charging instead of guessing why it stayed quiet.
  const [arming, setArming] = useState(0);
  const lastChimeRef = useRef(0);
  const thresholdRef = useRef(threshold);

  // The gentle chime is the synthesized "soft" timbre — there are no audio files.
  // `muted` is the room's own toggle, so silencing the room silences this too.
  const audio = useAudioEngine(muted, "soft");

  // Keep loop-visible values current without re-creating the rAF closure.
  const playChimeRef = useRef<() => void>(() => {});
  useEffect(() => {
    playChimeRef.current = () => audio.playEnd();
  });
  useEffect(() => {
    thresholdRef.current = threshold;
  }, [threshold]);

  const teardown = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    analyserRef.current = null;
    bufRef.current = null;
    const ctx = ctxRef.current;
    ctxRef.current = null;
    // Close ONLY this analysis context — never the shared sound engine's.
    if (ctx && ctx.state !== "closed") ctx.close().catch(() => {});
  }, []);

  // Always release the mic on unmount. `closedRef` additionally tells an
  // in-flight getUserMedia() that it came back to a dead component — see start().
  const closedRef = useRef(false);
  const startingRef = useRef(false);
  useEffect(() => {
    closedRef.current = false;
    return () => {
      closedRef.current = true;
      teardown();
    };
  }, [teardown]);

  const loop = useCallback(() => {
    const analyser = analyserRef.current;
    const buf = bufRef.current;
    if (!analyser || !buf) return;

    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);

    // LOGARITHMIC, not linear. Hearing is logarithmic; raw RMS is not. The old
    // `rms * 300` put a quiet room near 3, ordinary talking near 12 and a
    // genuinely loud class near 35 — so the bar barely moved, the top two
    // thirds of the scale were unreachable, and the default threshold of 65
    // could never be crossed by a real room. Mapping decibels-below-full-scale
    // onto 0–100 spreads a classroom across the whole bar.
    //
    // −60 dBFS ≈ an empty quiet room · −45 ≈ heads-down work · −30 ≈ ordinary
    // conversation · −15 ≈ genuinely loud. Anything under −60 reads as 0.
    const dbfs = rms > 0 ? 20 * Math.log10(rms) : -100;
    const raw = Math.max(0, Math.min(100, ((dbfs + 60) / 45) * 100));

    // Asymmetric smoothing: rise fast, fall slow. A symmetric filter made the
    // bar twitch up and immediately sag, which reads as broken — and it also
    // meant a loud room kept dipping below the line and resetting the count.
    // Fast attack tracks the room honestly; slow release holds the level while
    // it stays loud, which is the thing being measured.
    const prev = smoothedRef.current;
    smoothedRef.current = raw > prev ? prev * 0.6 + raw * 0.4 : prev * 0.92 + raw * 0.08;
    const lvl = smoothedRef.current;
    setLevel(lvl);

    const now = Date.now();
    if (lvl > thresholdRef.current) {
      dipSinceRef.current = null;
      if (aboveSinceRef.current === null) {
        aboveSinceRef.current = now;
      } else if (now - aboveSinceRef.current >= SUSTAIN_MS && now - lastChimeRef.current >= COOLDOWN_MS) {
        lastChimeRef.current = now;
        aboveSinceRef.current = null;
        playChimeRef.current();
        setChimedAt(now);
      }
    } else if (aboveSinceRef.current !== null) {
      // Below the line, but we were counting — forgive a short dip.
      if (dipSinceRef.current === null) dipSinceRef.current = now;
      else if (now - dipSinceRef.current > DIP_GRACE_MS) {
        aboveSinceRef.current = null;
        dipSinceRef.current = null;
      }
    }
    setArming(
      aboveSinceRef.current === null
        ? 0
        : Math.min(1, (now - aboveSinceRef.current) / SUSTAIN_MS),
    );

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  async function start() {
    // Unlock the shared AudioContext on THIS gesture — the chime later fires from
    // a rAF callback, which the browser autoplay policy would otherwise silence.
    audio.unlock();

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setState("unsupported");
      return;
    }
    // Reentrancy guard: the button stays visible until state flips to
    // "listening", which only happens after the await below. Two fast clicks
    // would otherwise open two mic streams and leak the first one — teardown()
    // can only ever stop whatever the refs currently point at.
    if (startingRef.current) return;
    startingRef.current = true;

    try {
      // THE BIG ONE: turn off the browser's voice-call processing.
      //
      // getUserMedia({ audio: true }) hands you a stream tuned for video calls:
      // automatic gain control, noise suppression and echo cancellation are all
      // on by default. Automatic gain control is the killer — it actively
      // normalises the signal, boosting a quiet room and pulling a loud one
      // back down within a second or two. That is exactly the "it spikes then
      // drops back by itself" behaviour, and no amount of scaling fixes it,
      // because the browser is undoing the measurement in real time.
      //
      // Noise suppression is nearly as bad here: it treats a room full of
      // overlapping voices as background noise and subtracts it, which is the
      // signal. We want the raw microphone.
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          autoGainControl: false,
          noiseSuppression: false,
          echoCancellation: false,
        },
      });
      // The teacher may have closed the meter while the permission prompt was
      // up. Nothing else will release this stream if we don't do it here: the
      // unmount cleanup already ran, and it found streamRef still null.
      if (closedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      streamRef.current = stream;
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      // We do our own asymmetric smoothing in the loop; a second smoothing
      // stage here only adds lag between the room getting loud and the bar
      // showing it, which reads as the meter being broken.
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser); // intentionally not connected to destination
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(analyser.fftSize);
      smoothedRef.current = 0;
      aboveSinceRef.current = null;
      setState("listening");
      track("noise_meter_started");
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      // Distinguish the three real causes — telling a teacher with no
      // microphone to "allow access in the address bar" sends them chasing a
      // permission that was never requested.
      const name = (err as { name?: string } | null)?.name;
      if (closedRef.current) return;
      setState(name === "NotFoundError" || name === "OverconstrainedError"
        ? "nomic"
        : name === "NotReadableError"
          ? "busy"
          : "denied");
    } finally {
      startingRef.current = false;
    }
  }

  function stop() {
    teardown();
    smoothedRef.current = 0;
    aboveSinceRef.current = null;
    setLevel(0);
    setState("idle");
  }

  const quietEnd = threshold * 0.6;
  const zone = level > threshold ? "loud" : level > quietEnd ? "working" : "quiet";
  const fillClass =
    zone === "loud" ? "bg-red-400" : zone === "working" ? "bg-sky-400" : "bg-emerald-400";
  const zoneLabel = zone === "loud" ? "Too loud" : zone === "working" ? "Working" : "Quiet";
  const zoneText =
    zone === "loud" ? "text-red-300" : zone === "working" ? "text-sky-300" : "text-emerald-300";
  const recentlyChimed = chimedAt !== null && Date.now() - chimedAt < 2500;

  return (
    /*
      DOCKED, NOT MODAL. This used to be `fixed inset-0` over a black scrim,
      which meant the one tool a teacher reaches for mid-block ("the room is
      getting loud") blanked out the clock the whole room was watching. So it
      was only usable when it wasn't needed.

      Now it's a narrow column pinned right of the timer, at z-20: above the
      room UI, below the side rail (z-30) and the emergency button (z-40). The
      clock never moves and is never covered. The bar runs vertically because
      that's the shape of the space beside a centered ring — and because a
      column filling upward reads as "level" at a glance from across the room.
    */
    <div className="fixed right-20 top-1/2 z-20 flex w-60 -translate-y-1/2 flex-col gap-3 rounded-3xl border border-emerald-400/25 bg-emerald-950/80 p-4 shadow-2xl ring-1 ring-inset ring-white/5 backdrop-blur">
      {/*
        Collapse, not close — mirrors the name picker on the other side.

        Collapsing unmounts this component, which releases the microphone. That
        is the honest behaviour (a mic held open behind a hidden panel is not
        something to do quietly), so the tooltip says so rather than implying
        the meter keeps listening out of sight.
      */}
      <div className="flex items-start justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">🔊 Noise level</h2>
        <button onClick={onClose} aria-label="Collapse the noise meter" title="Collapse — releases the microphone"
          className="-mt-0.5 rounded-lg px-1.5 text-lg leading-none text-white/40 transition-colors hover:bg-white/10 hover:text-white/80">
          ›
        </button>
      </div>

      {state === "listening" ? (
        <>
          {/* The arming countdown used to sit in its own row under the slider.
              It belongs here, next to the zone it qualifies — "Too loud,
              chiming in 2s" is one thought, not two — and folding it up frees
              a row for the meter, which is the thing worth looking at. */}
          <div className="flex items-baseline justify-between gap-2">
            <span className={`text-xl font-bold ${zoneText}`}>{zoneLabel}</span>
            {recentlyChimed ? (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                🔔 Chimed
              </span>
            ) : arming > 0 ? (
              <span className="text-[11px] tabular-nums text-amber-300/80">
                chiming in {Math.ceil(SUSTAIN_MS / 1000 - (arming * SUSTAIN_MS) / 1000)}s
              </span>
            ) : null}
          </div>

          {/* Vertical column — fills from the floor up, threshold marked across
              it. The meter gets the height back that the folded-up arming row
              and the disclosure gave up: it's the one element here that has to
              be readable from across a room, so it should be the tallest
              thing in the panel, not a stub above a stack of controls. */}
          <div className="flex justify-center">
            <div className="relative h-52 w-20 overflow-hidden rounded-2xl bg-white/5">
              <div className="absolute inset-x-0 bottom-0 bg-emerald-500/10" style={{ height: `${quietEnd}%` }} />
              <div
                className="absolute inset-x-0 bg-sky-500/10"
                style={{ bottom: `${quietEnd}%`, height: `${Math.max(0, threshold - quietEnd)}%` }}
              />
              <div className="absolute inset-x-0 top-0 bg-red-500/10" style={{ bottom: `${threshold}%` }} />
              <div
                className={`absolute inset-x-0 bottom-0 ${fillClass} transition-[height] duration-75`}
                style={{ height: `${Math.min(100, level)}%` }}
              />
              <div className="absolute inset-x-0 h-0.5 bg-white/80" style={{ bottom: `${threshold}%` }} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
              {/*
                "Chime above 60" told a teacher nothing — 60 of what?

                It is NOT decibels and must never be labelled as such: this is
                RMS from an uncalibrated laptop microphone on an arbitrary
                0–100 scale. A real dB SPL reading needs a calibrated meter,
                and every laptop mic and room differs. Printing "dB" would be
                a made-up number with a scientific-looking unit on it.

                So the scale is named for what it actually is — how loud the
                room is allowed to get — with the ends labelled and the live
                bar right above it to set against.
              */}
              <div className="flex items-center justify-between text-[11px] text-white/50">
                <span>Chime when the room gets louder than</span>
              </div>
              <input
                type="range"
                min={10}
                max={95}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                aria-label="Room volume level that triggers the chime"
                className="w-full accent-white"
              />
              <div className="-mt-1 flex justify-between text-[10px] text-white/35">
                <span>Silent</span>
                <span>Quiet work</span>
                <span>Loud</span>
              </div>
              {/*
                This was a four-line paragraph sitting open at all times. The
                "not decibels" point is important enough to keep — a teacher
                could otherwise repeat a made-up dB figure to an administrator
                — but it is read once and never again, so it belongs behind a
                disclosure rather than eating panel height every session.
              */}
              <details className="group">
                <summary className="cursor-pointer list-none text-[11px] text-white/35 transition-colors hover:text-white/60">
                  How this works <span className="group-open:hidden">▾</span><span className="hidden group-open:inline">▴</span>
                </summary>
                <p className="mt-1.5 text-[11px] leading-snug text-white/35">
                  A relative level, not decibels — every room and microphone reads differently, so
                  set it against the bar above. Chimes once after {SUSTAIN_MS / 1000}s over the
                  line, then waits {COOLDOWN_MS / 1000}s. Brief dips won{"’"}t reset it.
                </p>
              </details>
          </div>

          <button
            onClick={stop}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white transition-all hover:bg-white/20"
          >
            Stop listening
          </button>
        </>
      ) : state === "denied" ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-white/5 p-4">
          <p className="text-xs leading-snug text-white/70">
            Microphone access is blocked. Allow it from your browser&apos;s address bar, then try
            again — everything else works normally.
          </p>
          <button onClick={start} className={RETRY_BTN}>Try again</button>
        </div>
      ) : state === "nomic" ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-white/5 p-4">
          <p className="text-xs leading-snug text-white/70">
            No microphone was found on this computer. If one is plugged in, check it&apos;s selected in
            your system sound settings.
          </p>
          <button onClick={start} className={RETRY_BTN}>Try again</button>
        </div>
      ) : state === "busy" ? (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-white/5 p-4">
          <p className="text-xs leading-snug text-white/70">
            Another app is using the microphone — a video call is the usual culprit. Close it and try
            again.
          </p>
          <button onClick={start} className={RETRY_BTN}>Try again</button>
        </div>
      ) : state === "unsupported" ? (
        <div className="rounded-2xl bg-white/5 p-4">
          <p className="text-xs leading-snug text-white/70">
            The microphone isn&apos;t available here. This usually means the page is served over an
            insecure connection — browsers only allow microphone access over https.
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-2xl bg-white/5 p-4">
          <p className="text-xs leading-snug text-white/70">
            Shows how loud the room is, and chimes gently when it stays too loud.
          </p>
          <button onClick={start} className={RETRY_BTN}>Start listening</button>
        </div>
      )}

      {/* Full sentence, deliberately. This renders in EVERY state including the
          intro card, so trimming it to save height in the listening view also
          shrank the first thing a teacher reads about the microphone — the
          wrong trade. Height comes out of the meter itself instead. */}
      <p className="text-[10px] leading-snug text-white/35">{PRIVACY_LINE}</p>
    </div>
  );
}
