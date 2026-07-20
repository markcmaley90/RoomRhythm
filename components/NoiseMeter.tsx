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

type MeterState = "idle" | "listening" | "denied" | "unsupported";

const PRIVACY_LINE =
  "Sound is analyzed on this device in real time — nothing is recorded or transmitted.";

const SUSTAIN_MS = 3000; // must stay above threshold this long
const COOLDOWN_MS = 15000; // and no re-trigger within this window

export default function NoiseMeter({ onClose, muted }: { onClose: () => void; muted: boolean }) {
  const [state, setState] = useState<MeterState>("idle");
  const [level, setLevel] = useState(0); // 0..100, smoothed
  const [threshold, setThreshold] = useState(65); // in-memory only, by decision
  const [chimedAt, setChimedAt] = useState<number | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);
  const smoothedRef = useRef(0);
  const aboveSinceRef = useRef<number | null>(null);
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

  // Always release the mic on unmount.
  useEffect(() => teardown, [teardown]);

  const loop = useCallback(() => {
    const analyser = analyserRef.current;
    const buf = bufRef.current;
    if (!analyser || !buf) return;

    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    const raw = Math.min(100, rms * 300); // room speech lands mid-scale
    smoothedRef.current = smoothedRef.current * 0.8 + raw * 0.2;
    const lvl = smoothedRef.current;
    setLevel(lvl);

    const now = Date.now();
    if (lvl > thresholdRef.current) {
      if (aboveSinceRef.current === null) {
        aboveSinceRef.current = now;
      } else if (now - aboveSinceRef.current >= SUSTAIN_MS && now - lastChimeRef.current >= COOLDOWN_MS) {
        lastChimeRef.current = now;
        aboveSinceRef.current = null;
        playChimeRef.current();
        setChimedAt(now);
      }
    } else {
      aboveSinceRef.current = null;
    }

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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      ctxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      source.connect(analyser); // intentionally not connected to destination
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(analyser.fftSize);
      smoothedRef.current = 0;
      aboveSinceRef.current = null;
      setState("listening");
      track("noise_meter_started");
      rafRef.current = requestAnimationFrame(loop);
    } catch {
      setState("denied");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="flex w-full max-w-2xl flex-col gap-5 rounded-3xl bg-gray-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🔊 Noise meter</h2>
            <p className="mt-1 text-sm text-white/50">How loud is the room right now?</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-white/40 hover:text-white/80">×</button>
        </div>

        {state === "listening" ? (
          <>
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-bold ${zoneText}`}>{zoneLabel}</span>
              {recentlyChimed && (
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200">
                  🔔 Chime sent
                </span>
              )}
            </div>

            {/* Big bar, minimal chrome — reads at projector distance */}
            <div className="relative h-16 w-full overflow-hidden rounded-2xl bg-white/5">
              <div className="absolute inset-y-0 left-0 bg-emerald-500/10" style={{ width: `${quietEnd}%` }} />
              <div
                className="absolute inset-y-0 bg-sky-500/10"
                style={{ left: `${quietEnd}%`, width: `${Math.max(0, threshold - quietEnd)}%` }}
              />
              <div className="absolute inset-y-0 right-0 bg-red-500/10" style={{ left: `${threshold}%` }} />
              <div
                className={`absolute inset-y-0 left-0 ${fillClass} transition-[width] duration-75`}
                style={{ width: `${Math.min(100, level)}%` }}
              />
              <div className="absolute inset-y-0 w-0.5 bg-white/80" style={{ left: `${threshold}%` }} />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs text-white/50">
                <span>Chime when the room stays above</span>
                <span className="tabular-nums text-white/70">{Math.round(threshold)}</span>
              </div>
              <input
                type="range"
                min={10}
                max={95}
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                aria-label="Too-loud threshold"
                className="w-full accent-white"
              />
              <p className="text-[11px] text-white/35">
                Sounds once after {SUSTAIN_MS / 1000}s above the line, then waits {COOLDOWN_MS / 1000}s.
              </p>
            </div>

            <button
              onClick={stop}
              className="self-start rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20"
            >
              Stop listening
            </button>
          </>
        ) : state === "denied" ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-white/5 p-5">
            <p className="text-sm text-white/70">
              Microphone access is blocked, so the meter can&apos;t read the room. You can allow it from
              your browser&apos;s address bar, then try again — everything else in RoomRhythm works normally.
            </p>
            <button
              onClick={start}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-500"
            >
              Try again
            </button>
          </div>
        ) : state === "unsupported" ? (
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-white/5 p-5">
            <p className="text-sm text-white/70">
              This browser doesn&apos;t offer microphone access, so the noise meter isn&apos;t available here.
              Everything else in RoomRhythm works normally.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-2xl bg-white/5 p-5">
            <p className="text-sm text-white/70">
              Uses your device&apos;s microphone to show how loud the room is, and chimes gently when it
              stays too loud.
            </p>
            <button
              onClick={start}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-500"
            >
              Start listening
            </button>
          </div>
        )}

        <p className="text-center text-[11px] text-white/35">{PRIVACY_LINE}</p>
      </div>
    </div>
  );
}
