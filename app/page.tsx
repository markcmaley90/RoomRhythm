"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAudioEngine, AMBIENT_BEDS, isAmbientFree, type SoundType, type AmbientId } from "@/lib/audio";
// Decode only. `withShareParam` is still exported from lib/share.ts and still
// tested — Schedule mode needs it — but nothing writes a share link today.
import {
  SHARE_PARAM,
  decodeShareConfig,
  type ClassroomShareConfig,
} from "@/lib/share";
import NamePicker from "@/components/NamePicker";
import NoiseMeter from "@/components/NoiseMeter";
import { track } from "@/lib/analytics";
import EmailCapture from "@/components/EmailCapture";

// ── Types ──────────────────────────────────────────────────────
type Profile = "selector" | "classroom" | "corporate";
type ClassroomMode = "idle" | "calm" | "focus" | "break";
type CorporateMode = "idle" | "attention" | "work" | "recharge";
type CalmPhase = "countdown" | "begin";

// ── Grade Bands ────────────────────────────────────────────────
const GRADE_BANDS = [
  { label: "K–2",               sub: "Early",      defaultMin: 12, sliderMin: 0, sliderMax: 15, breakMin: 5 },
  { label: "3–5",               sub: "Elementary", defaultMin: 15, sliderMin: 0, sliderMax: 20, breakMin: 5 },
  { label: "6–8",               sub: "Middle",     defaultMin: 20, sliderMin: 0, sliderMax: 30, breakMin: 5 },
  { label: "9–12 / University", sub: "Secondary+", defaultMin: 25, sliderMin: 0, sliderMax: 50, breakMin: 5 },
];

const CLASSROOM_MODES = {
  idle:  { bg: "bg-gray-900",    text: "text-white",       label: "RoomRhythm",  sub: "Ready when you are.",            emoji: ""   },
  calm:  { bg: "bg-blue-900",    text: "text-blue-100",    label: "Calm Down",   sub: "Settle in. Eyes forward.",       emoji: "🔔" },
  focus: { bg: "bg-indigo-900",  text: "text-indigo-100",  label: "Focus Time",  sub: "Work quietly. You've got this.", emoji: "⏱" },
  break: { bg: "bg-emerald-800", text: "text-emerald-100", label: "Brain Break", sub: "Stand up. Stretch. Reset.",      emoji: "🌿" },
};

const CORPORATE_MODES = {
  idle:      { bg: "bg-slate-900", text: "text-white",    label: "RoomRhythm", sub: "Ready when you are.",         emoji: ""   },
  attention: { bg: "bg-blue-950",  text: "text-blue-100", label: "Calm",       sub: "Take a breath. Settle in.",   emoji: "🌿" },
  work:      { bg: "bg-blue-950",  text: "text-blue-100", label: "Work Block", sub: "Deep work. No distractions.", emoji: "💼" },
  recharge:  { bg: "bg-teal-800",  text: "text-teal-100", label: "Recharge",   sub: "Step away. Reset your mind.", emoji: "⚡" },
};

// Recharge prompts for the Corporate profile — light social + physical resets
// suitable for an adult team setting.
const CORPORATE_RECHARGES: string[] = [
  "Ask a colleague about the best meal they've had recently",
  "Share your favorite vacation spot with someone nearby",
  "Tell a neighbor one thing you're looking forward to this week",
  "Ask someone what they're currently watching or reading",
  "Swap a favorite podcast or song recommendation with someone nearby",
  "Ask a colleague about a hobby they enjoy outside of work",
  "Share one small win from this work block with a neighbor",
  "Stand up, stretch, and grab a glass of water",
  "Step away from your desk and take a short walk",
  "Look away from your screen at something 20 feet away for 20 seconds",
  "Take 5 slow deep breaths and roll your shoulders back",
  "Do a few gentle neck and wrist stretches",
];

function randomRecharge() {
  return CORPORATE_RECHARGES[Math.floor(Math.random() * CORPORATE_RECHARGES.length)];
}

type BreakPrompt = { type: string; text: string; maxBand?: number; minBand?: number };

const BRAIN_BREAKS: BreakPrompt[] = [
  { type: "movement",  text: "Stand up and do 10 jumping jacks" },
  { type: "movement",  text: "Walk to the back of the room and back" },
  { type: "movement",  text: "Do 5 big arm circles forward, then backward" },
  { type: "movement",  text: "March in place for 20 seconds" },
  { type: "movement",  text: "Stand up and touch your toes 5 times" },
  { type: "movement",  text: "Do 10 slow neck rolls side to side" },
  { type: "movement",  text: "Shake out your hands and arms for 15 seconds" },
  { type: "movement",  text: "Stand and do 5 slow squats" },
  { type: "movement",  text: "Walk to a window, look outside, walk back" },
  { type: "movement",  text: "Do 10 shoulder shrugs up and down" },
  { type: "movement",  text: "Do the wave with your arms 5 times", maxBand: 2 },
  { type: "movement",  text: "Hop on one foot 10 times, switch feet", maxBand: 2 },
  { type: "movement",  text: "Clap a rhythm and see if your neighbor can copy it", maxBand: 2 },
  { type: "movement",  text: "Pretend you're swimming in slow motion for 20 seconds", maxBand: 1 },
  { type: "movement",  text: "Stand up and do the robot dance for 15 seconds", maxBand: 1 },
  { type: "breathing", text: "Close your eyes and take 5 slow deep breaths" },
  { type: "breathing", text: "Breathe in for 4 counts, hold for 4, out for 4" },
  { type: "breathing", text: "Take 3 deep breaths — make the exhale twice as long as the inhale" },
  { type: "breathing", text: "Put both feet flat on the floor and breathe in for 5 counts" },
  { type: "sensory",   text: "Look out the window for 30 seconds. Notice one thing you hadn't seen before." },
  { type: "sensory",   text: "Close your eyes. List 3 things you can hear right now." },
  { type: "sensory",   text: "Roll your shoulders back 5 times. Notice the tension release." },
  { type: "sensory",   text: "Rest your eyes — cover them with your palms for 20 seconds" },
  { type: "sensory",   text: "Press your feet firmly into the floor and hold for 10 seconds" },
  { type: "social",    text: "Tell your neighbor one thing you just learned" },
  { type: "social",    text: "Give someone near you a thumbs up or a nod" },
  { type: "social",    text: "Turn to a neighbor and share one word that describes how you're feeling" },
  { type: "social",    text: "High five someone near you" },
  { type: "social",    text: "Tell someone near you one thing you're looking forward to today" },
  { type: "social",    text: "Turn to a neighbor: what's one insight from the last block?", minBand: 2 },
  { type: "social",    text: "Share with a neighbor: what's still unclear from what we just covered?", minBand: 2 },
  { type: "social",    text: "Quick pair share: what's one thing you'd apply from this session?", minBand: 3 },
  { type: "reset",     text: "Doodle anything you want for 60 seconds" },
  { type: "reset",     text: "Write down one question you still have" },
  { type: "reset",     text: "Close your notebook and stare at something far away for 30 seconds" },
  { type: "reset",     text: "Stretch your arms above your head and hold for 10 seconds" },
  { type: "reset",     text: "Think of one word that describes the last focus block" },
  { type: "reset",     text: "Jot down the one most important thing from the last block", minBand: 2 },
  { type: "reset",     text: "Write a one-sentence summary of what you just worked on", minBand: 3 },
  { type: "reset",     text: "Rate your focus this block 1–10. What would move it up by 2?", minBand: 3 },
];

function formatTime(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function randomBreak(bandIndex: number = 2) {
  const filtered = BRAIN_BREAKS.filter((b) => {
    if (b.maxBand !== undefined && bandIndex > b.maxBand) return false;
    if (b.minBand !== undefined && bandIndex < b.minBand) return false;
    return true;
  });
  return filtered[Math.floor(Math.random() * filtered.length)];
}

// ══════════════════════════════════════════════════════════════
// GENERIC COUNTDOWN OVERLAY (used for both Calm and Focus)
// ══════════════════════════════════════════════════════════════
function CountdownOverlay({
  startFrom, onComplete, playTick, playBegin, muted,
  fromColor, toColor, label, beginLabel,
}: {
  startFrom: number; onComplete: () => void;
  playTick: (n: number) => void; playBegin: () => void; muted: boolean;
  fromColor: string; toColor: string; label: string; beginLabel: string;
}) {
  const [count, setCount] = useState(startFrom);
  const [phase, setPhase] = useState<CalmPhase>("countdown");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 30); return () => clearTimeout(t); }, []);

  useEffect(() => {
    if (phase === "countdown" && count > 0) {
      if (!muted) playTick(count);
      const t = setTimeout(() => setCount((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (phase === "countdown" && count === 0) {
      setPhase("begin");
      if (!muted) playBegin();
      // Use a plain timeout without cleanup so it always fires
      setTimeout(() => onComplete(), 1200);
    }
  }, [count, phase]);

  const progress = startFrom > 0 ? 1 - count / startFrom : 1;

  const parseHSL = (h: string) => {
    const m = h.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    return m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
  };
  const [h1, s1, l1] = parseHSL(fromColor);
  const [h2, s2, l2] = parseHSL(toColor);
  const hue = Math.round(h1 + progress * (h2 - h1));
  const sat = Math.round(s1 + progress * (s2 - s1));
  const lit = Math.round(l1 + progress * (l2 - l1));
  const bg = `hsl(${hue}, ${sat}%, ${lit}%)`;

  return (
    // z-30 keeps this above the room UI but BELOW the emergency button (z-40).
    // At z-50 the overlay hid and blocked the alarm control for the whole 4–6s
    // calm transition — the one moment you'd least want it unreachable.
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center"
      style={{ backgroundColor: bg, opacity: mounted ? 1 : 0, transition: "background-color 1s ease, opacity 0.3s ease" }}
    >
      {phase === "countdown" && count > 0 && (
        <>
          <p className="text-white/60 text-xl font-medium mb-8 tracking-widest uppercase">{label}</p>
          <div
            key={count}
            className="text-[14rem] font-black text-white leading-none select-none"
            style={{ animation: "countPop 0.95s ease-out forwards" }}
          >
            {count}
          </div>
        </>
      )}
      {phase === "begin" && (
        <div className="text-6xl font-bold text-white tracking-wide" style={{ animation: "fadeInUp 0.4s ease-out forwards" }}>
          {beginLabel}
        </div>
      )}
      <style>{`
        @keyframes countPop {
          0%   { transform: scale(1.5); opacity: 0; }
          15%  { transform: scale(1.0); opacity: 1; }
          75%  { transform: scale(1.0); opacity: 1; }
          100% { transform: scale(0.75); opacity: 0; }
        }
        @keyframes fadeInUp {
          0%   { transform: translateY(24px); opacity: 0; }
          100% { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// EMERGENCY BUTTON
// ══════════════════════════════════════════════════════════════
function EmergencyButton({ onActivate, onDeactivate }: {
  onActivate: () => void; onDeactivate: () => void;
}) {
  const [active, setActive] = useState(false);
  function toggle() {
    if (active) { setActive(false); onDeactivate(); }
    else { setActive(true); onActivate(); }
  }
  return (
    <button onClick={toggle}
      className={`fixed bottom-6 right-6 z-40 px-4 py-3 rounded-2xl text-sm font-semibold shadow-xl transition-all duration-300 ${
        active
          ? "bg-red-600 text-white animate-pulse scale-105 ring-4 ring-red-400/50"
          : "bg-white/10 hover:bg-red-900/60 text-white/40 hover:text-white border border-white/10"
      }`}
    >
      {active ? "🚨 Stop Alarm" : "🚨 Emergency Calm"}
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// TAB SNAP-BACK
// Browsers can't force a tab switch (security boundary). Closest
// equivalent: desktop notification at 1 min — clicking it focuses
// the RoomRhythm tab. Plus aggressive title flash + sound.
// ══════════════════════════════════════════════════════════════
function useTabSnapBack(running: boolean, secondsLeft: number, onReturnFlash: () => void, playWarning: () => void) {
  const wasHiddenRef  = useRef(false);
  const flashTitleRef = useRef<NodeJS.Timeout | null>(null);
  const originalTitle = useRef(document.title);
  // True while the tab title is alternating. The per-tick title effects in
  // ClassroomApp/CorporateApp read this and stand down, or they'd overwrite
  // every flash with the plain countdown a fraction of a second later.
  const flashingRef   = useRef(false);
  const firedAtRef    = useRef(false);

  const stopFlash = useCallback(() => {
    if (flashTitleRef.current) { clearInterval(flashTitleRef.current); flashTitleRef.current = null; }
    flashingRef.current = false;
  }, []);

  // Request notification permission once on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        wasHiddenRef.current = running;
      } else {
        if (wasHiddenRef.current && running) onReturnFlash();
        wasHiddenRef.current = false;
        stopFlash(); // they're looking at it again; stop shouting in the title
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [running, onReturnFlash]);

  // Re-arm once the clock leaves the warning window, so the next block warns too.
  useEffect(() => {
    if (!running || secondsLeft > 60) firedAtRef.current = false;
  }, [running, secondsLeft]);

  useEffect(() => {
    if (!running || secondsLeft > 60 || secondsLeft <= 0 || firedAtRef.current) return;
    firedAtRef.current = true;
    playWarning();
    if (!document.hidden) return;

    // Desktop notification — clicking it brings the user back
    if ("Notification" in window && Notification.permission === "granted") {
      const n = new Notification("⚠️ 1 minute left — RoomRhythm", {
        body: "Time is almost up. Click to return.",
        tag: "roomrhythm-warning",
      });
      n.onclick = () => { window.focus(); n.close(); };
    }

    // Aggressive title flash, ~16s. NOTE: deliberately NOT torn down in this
    // effect's cleanup. This effect re-runs every second while the clock ticks,
    // so a cleanup here would kill the interval one second after starting it —
    // the flash used to manage two flips instead of forty. It is stopped by
    // stopFlash(): on tick 40, on the tab becoming visible, or on unmount.
    let tick = 0;
    originalTitle.current = document.title;
    stopFlash();
    flashingRef.current = true;
    flashTitleRef.current = setInterval(() => {
      document.title = tick % 2 === 0 ? "⚠️ 1 MIN LEFT — RoomRhythm" : "🔴 TIMER ENDING SOON";
      tick++;
      if (tick > 40) stopFlash();
    }, 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, running]);

  useEffect(() => stopFlash, [stopFlash]);   // unmount only

  return flashingRef;
}

// ══════════════════════════════════════════════════════════════
// FULLSCREEN
// ══════════════════════════════════════════════════════════════
function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  }, []);
  return { isFullscreen, toggleFullscreen };
}

// ══════════════════════════════════════════════════════════════
// SIDE RAIL — Names and Noise, reachable at any time
//
// These were top-bar buttons that only existed on the idle screen, so the two
// tools a teacher most wants MID-BLOCK ("pick someone", "the room is getting
// loud") vanished the moment a timer started. A fixed vertical rail keeps them
// one click away in every mode without competing with the clock for attention.
// Sits at z-30: above the room UI, below the emergency button (z-40).
// ══════════════════════════════════════════════════════════════
function SideRail({ onNames, onNoise, namesOn, noiseOn }: {
  onNames: () => void; onNoise: () => void; namesOn: boolean; noiseOn: boolean;
}) {
  // Each toggle sits on the edge its panel opens from, so the button and the
  // thing it summons are never on opposite sides of the room's attention. The
  // chevron points the way the panel will travel — out toward the clock when
  // closed, back to the wall when open — so the tab reads as a drawer handle
  // rather than a mystery icon.
  // Slate, not black. Every room background is a saturated colour wash, so a
  // dark-transparent tab reads as a hole punched in the gradient rather than a
  // control. A neutral grey surface is the one value that stays legibly "a
  // different thing" against indigo, teal and amber alike.
  //
  // The chevron sits ABOVE the icon: it's the drawer handle, and a handle you
  // read after the label isn't doing its job.
  const btn =
    "flex w-14 flex-col items-center gap-1.5 rounded-2xl border border-white/20 " +
    "bg-slate-700/80 py-3.5 text-white/80 shadow-lg backdrop-blur transition-all " +
    "hover:bg-slate-600/90 hover:text-white";
  const chev = "text-base leading-none opacity-80";
  return (
    <>
      <div className="fixed left-4 top-1/2 z-30 -translate-y-1/2">
        <button onClick={onNames}
          aria-expanded={namesOn}
          title={namesOn ? "Collapse the name picker" : "Random name picker"}
          className={`${btn} ${namesOn ? "border-indigo-300/60 bg-indigo-900/70 text-indigo-100" : ""}`}>
          <span aria-hidden className={chev}>{namesOn ? "‹" : "›"}</span>
          <span className="text-2xl leading-none">🎲</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider [writing-mode:vertical-rl]">
            Names
          </span>
        </button>
      </div>
      <div className="fixed right-4 top-1/2 z-30 -translate-y-1/2">
        <button onClick={onNoise}
          aria-expanded={noiseOn}
          title={noiseOn ? "Collapse the noise meter" : "Classroom noise meter"}
          className={`${btn} ${noiseOn ? "border-emerald-300/60 bg-emerald-900/70 text-emerald-100" : ""}`}>
          <span aria-hidden className={chev}>{noiseOn ? "›" : "‹"}</span>
          <span className="text-2xl leading-none">🔊</span>
          <span className="text-[11px] font-semibold uppercase tracking-wider [writing-mode:vertical-rl]">
            Noise
          </span>
        </button>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════
// SOUND SETTINGS — one collapsible home for every sound control
//
// These were scattered: mute in the top bar, cue inline, sound cover in a
// third place. A teacher setting up a room shouldn't hunt. Collapsed by
// default because most never change them after the first session.
// ══════════════════════════════════════════════════════════════
function SoundSettings({
  muted, onMuteToggle, soundType, onSoundChange, onPreview, cover, onCoverChange, accent,
}: {
  muted: boolean; onMuteToggle: () => void;
  soundType: SoundType; onSoundChange: (s: SoundType) => void; onPreview: (s: SoundType) => void;
  cover: AmbientId; onCoverChange: (a: AmbientId) => void;
  accent: string;
}) {
  const [open, setOpen] = useState(false);
  const activeCover = AMBIENT_BEDS.find((b) => b.id === cover);
  return (
    <div className="w-full">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-xs uppercase tracking-widest opacity-60 hover:opacity-90 transition-opacity"
      >
        <span>Sound</span>
        <span className="flex items-center gap-2 normal-case tracking-normal opacity-70">
          <span>{muted ? "Muted" : "On"}</span>
          <span>{open ? "▲" : "▼"}</span>
        </span>
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="opacity-50">Room sound</span>
            <button onClick={onMuteToggle}
              className={`px-3 py-1 rounded-full font-semibold transition-all ${
                !muted ? `${accent} text-white` : "bg-white/10 hover:bg-white/20"}`}>
              {muted ? "🔇 Muted" : "🔔 On"}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="opacity-50">Cue</span>
            <SoundPicker soundType={soundType} onSoundChange={onSoundChange} onPreview={onPreview} />
          </div>

          <div className="h-px bg-white/10" />

          <div>
            <div className="flex items-baseline justify-between">
              <span className="opacity-50">Sound cover</span>
              <span className="text-[11px] opacity-40">masks hallway noise</span>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {AMBIENT_BEDS.map((b) => {
                const locked = !isAmbientFree(b.id);
                const on = cover === b.id;
                return (
                  <button key={b.id} onClick={() => !locked && onCoverChange(b.id)} disabled={locked}
                    title={locked ? `${b.label} — Pro, coming soon` : b.hint}
                    className={`px-2 py-1 rounded-lg border transition-all ${
                      on ? "bg-indigo-500/40 border-indigo-400/60 text-indigo-50"
                        : locked ? "bg-white/[0.03] border-white/5 text-white/25 cursor-not-allowed"
                        : "bg-white/10 border-white/10 hover:bg-white/20"}`}>
                    {locked ? "🔒" : b.emoji} {b.label}
                  </button>
                );
              })}
            </div>
            <p className="mt-1.5 text-[11px] leading-snug opacity-40">{activeCover?.hint}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SOUND COVER — steady sound that masks room distractions.
// Deliberately NOT 'focus music': background music measurably hurts reading
// and verbal work, and the Mozart effect turned out to be arousal-and-mood,
// not neurology. Masking is what holds up. Copy promises noise cover only —
// a claim that survives a skeptical teacher. Reasoning in lib/audio.ts.
// ══════════════════════════════════════════════════════════════
function SoundCover({ value, onChange }: {
  value: AmbientId; onChange: (a: AmbientId) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-xs opacity-60 uppercase tracking-widest">Sound Cover</p>
        <p className="text-[11px] opacity-40">masks hallway noise</p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {AMBIENT_BEDS.map((b) => {
          const locked = !isAmbientFree(b.id);
          const active = value === b.id;
          return (
            <button
              key={b.id}
              onClick={() => !locked && onChange(b.id)}
              disabled={locked}
              title={locked ? `${b.label} — Pro, coming soon` : b.hint}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                active
                  ? "bg-indigo-500/40 border-indigo-400/60 text-indigo-50"
                  : locked
                    ? "bg-white/[0.03] border-white/5 text-white/25 cursor-not-allowed"
                    : "bg-white/10 border-white/10 hover:bg-white/20"
              }`}
            >
              {locked ? "🔒" : b.emoji} {b.label}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] leading-snug opacity-40">
        Steady on purpose — anything interesting pulls attention. More options
        with RoomRhythm Pro, coming soon.
      </p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SOUND PICKER — inline, used in the idle settings row
// ══════════════════════════════════════════════════════════════
function SoundPicker({ soundType, onSoundChange, onPreview }: {
  soundType: SoundType;
  onSoundChange: (s: SoundType) => void; onPreview: (s: SoundType) => void;
}) {
  const sounds: { id: SoundType; label: string; emoji: string }[] = [
    { id: "bell", label: "Bell", emoji: "🔔" },
    { id: "chime", label: "Chime", emoji: "🎵" },
    { id: "soft", label: "Soft", emoji: "🌊" },
  ];
  return (
    <div className="flex items-center gap-1">
      {sounds.map((o) => (
        <button key={o.id} onClick={() => { onSoundChange(o.id); onPreview(o.id); }}
          className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
            soundType === o.id ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/50"
          }`}>
          {o.emoji} {o.label}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PROJECTOR VIEW
// ══════════════════════════════════════════════════════════════
/** Host shown in the projector wordmark — the deployed origin when configured. */
function wordmarkHost(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (!raw) return "roomrhythm.app";
  try {
    return new URL(raw).hostname;
  } catch {
    return "roomrhythm.app";
  }
}

/**
 * Guard shown before a running block is thrown away.
 *
 * The Calm / Focus / Break buttons stay live while a block runs, which is
 * deliberate — a teacher needs to cut a block short without hunting for a menu.
 * But an unguarded click discards the block instantly, and it is a click a
 * passing student can make. So: warn, show what is actually on the clock, and
 * let it proceed. Same posture as the Testing runner's early-advance dialog,
 * which never blocks the proctor but never lets them do it by accident either.
 */
function InterruptDialog({ remaining, currentLabel, nextLabel, onCancel, onConfirm }: {
  remaining: number; currentLabel: string; nextLabel: string;
  onCancel: () => void; onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-6">
      <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-white">End {currentLabel} early?</h2>
        <p className="text-sm text-white/60">
          There{"’"}s still time on the clock. Starting {nextLabel} now will discard it.
        </p>
        <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
          <span className="text-sm text-white/70">{currentLabel} remaining</span>
          <span className="font-mono tabular-nums text-amber-300">{formatTime(remaining)}</span>
        </div>
        <div className="mt-1 flex justify-end gap-3">
          <button onClick={onCancel}
            className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20">
            Keep running
          </button>
          <button onClick={onConfirm} autoFocus
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-colors hover:bg-amber-400">
            Start {nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectorView({ secondsLeft, label, emoji, nearEnd, totalDuration, onExit, accent = "#818cf8", showWordmark = true }: {
  secondsLeft: number; label: string; emoji: string;
  nearEnd: boolean; totalDuration: number; onExit: () => void; accent?: string;
  /** Reserved for a future Pro tier to hide the wordmark. No settings UI today. */
  showWordmark?: boolean;
}) {
  const r = 150, circ = 2 * Math.PI * r;
  const progress = totalDuration > 0 ? (totalDuration - secondsLeft) / totalDuration : 0;

  // Escape leaves projector mode. Browsers already train everyone that Esc exits
  // a full-screen surface, and the only other way out was a small ✕ in the
  // corner that a teacher at the back of the room can't reach.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onExit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onExit]);
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-gray-950">
      <button onClick={onExit} className="absolute top-6 right-6 text-white/30 hover:text-white/70 text-sm">✕ Exit Projector</button>
      {/*
        The wordmark is the single highest-leverage marketing surface we have —
        thirty students plus every adult who walks in, an hour a day. It was
        `text-sm opacity-40` on a near-black field, which renders as a ghost:
        legible on a laptop at arm's length, invisible on a projector from the
        back row. Sized and weighted to be readable across a classroom while
        still losing to the clock for attention.
      */}
      {showWordmark && (
        <span className="absolute bottom-6 right-8 text-lg font-medium tracking-wide text-white/55 pointer-events-none select-none">
          RoomRhythm · {wordmarkHost()}
        </span>
      )}
      <p className="text-white/40 text-2xl font-medium mb-8 tracking-widest uppercase">{emoji} {label}</p>
      <div className="relative flex items-center justify-center">
        <svg width="360" height="360" className="absolute">
          <circle cx="180" cy="180" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle cx="180" cy="180" r={r} fill="none"
            stroke={nearEnd ? "#f87171" : accent} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
            transform="rotate(-90 180 180)" className="transition-all duration-1000" />
        </svg>
        <div className={`text-[11rem] font-mono font-bold tabular-nums tracking-tight ${nearEnd ? "text-red-300 animate-pulse" : "text-white"}`}>
          {formatTime(secondsLeft)}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREEN FLASH
// ══════════════════════════════════════════════════════════════
function ScreenFlash({ trigger }: { trigger: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (trigger === 0) return;
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 700);
    return () => clearTimeout(t);
  }, [trigger]);
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 pointer-events-none bg-white/25" style={{ animation: "flashOut 0.7s ease-out forwards" }}>
      <style>{`@keyframes flashOut { 0% { opacity:1 } 100% { opacity:0 } }`}</style>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// KEYBOARD HINT — removed.
//
// The "↑ +5s / ↓ −5s" pill was pinned bottom-center, where it sat directly on
// top of the "Grade 6–8 · 20 min block" line. The arrow keys still adjust the
// clock; ±5s are now visible buttons flanking it, with the key shown in their
// tooltips, so the hint was teaching something the UI already says.
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
// SHARED ROOM CHROME — one design language across all three rooms
// ══════════════════════════════════════════════════════════════
// Ghost control-button style used in every room's top bar.
const CTRL_BTN =
  "px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/10 transition-all";

// Slim top bar: "← Rooms" + accent-tinted profile identity on the left,
// room-specific controls (passed as children) on the right.
// TIME ADJUSTMENT — two nudges, not five.
//
// The ring was flanked by −1m/−5m on the left and +1m/+2m/+5m on the right:
// five pills competing with the one number the whole room is reading. A
// teacher does not need five sizes of "wait, a bit longer". Now it's ±5s
// either side of the clock (matching the ↑/↓ keys, which still work) and a
// single ±1 minute pair below it.
/** Small nudge, flanking the clock. */
const ADJ_BTN =
  "px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 " +
  "text-sm font-semibold tabular-nums transition-all min-w-[3.25rem]";

/** Minute nudge, centered under the clock. */
const MIN_BTN =
  "px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 " +
  "text-sm font-semibold tabular-nums transition-all";

function RoomTopBar({ emoji, name, accentBg, onBack, children }: {
  emoji: string; name: string; accentBg: string; onBack: () => void; children: React.ReactNode;
}) {
  return (
    <div className="absolute top-4 left-4 right-4 flex justify-between items-center gap-3 z-20">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-white/50 hover:text-white transition-colors">← Rooms</button>
        <div className="flex items-center gap-2 pl-3 border-l border-white/10">
          <span className={`flex items-center justify-center w-8 h-8 rounded-full ${accentBg} text-lg leading-none`}>{emoji}</span>
          <span className="text-sm font-semibold text-white/80 hidden sm:inline">{name}</span>
        </div>
      </div>
      <div className="flex gap-2 items-center flex-wrap justify-end">{children}</div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PROFILE SELECTOR
// ══════════════════════════════════════════════════════════════
type ProfileCard = {
  id: "classroom" | "corporate" | "testing";
  emoji: string;
  title: string;
  audience: string;
  benefit: string;
  topBorder: string;
  iconBg: string;
  hoverBorder: string;
  hoverShadow: string;
  enter: string;
};

// Each card shares a neutral dark surface; the accent (indigo / teal / amber)
// lives only in the top edge, icon halo, hover glow, and "Enter" label so no
// card reads as pre-selected. Accent classes are written out in full so
// Tailwind's JIT keeps them.
const PROFILE_CARDS: ProfileCard[] = [
  {
    id: "classroom", emoji: "🏫", title: "Classroom",
    audience: "K-12 & university instructors",
    benefit: "Grade-banded focus blocks and brain breaks.",
    topBorder: "border-t-indigo-500",
    iconBg: "bg-indigo-500/15",
    hoverBorder: "hover:border-indigo-500/60",
    hoverShadow: "hover:shadow-indigo-500/20",
    enter: "text-indigo-400 group-hover:text-indigo-300",
  },
  {
    id: "corporate", emoji: "🏢", title: "Corporate",
    audience: "Trainers & facilitators",
    benefit: "Custom instruction blocks with full control.",
    topBorder: "border-t-teal-500",
    iconBg: "bg-teal-500/15",
    hoverBorder: "hover:border-teal-500/60",
    hoverShadow: "hover:shadow-teal-500/20",
    enter: "text-teal-400 group-hover:text-teal-300",
  },
  {
    id: "testing", emoji: "📝", title: "Testing",
    audience: "Proctors & administrators",
    benefit: "Mock exams, finals, and timed sections with extended-time accommodations.",
    topBorder: "border-t-amber-500",
    iconBg: "bg-amber-500/15",
    hoverBorder: "hover:border-amber-500/60",
    hoverShadow: "hover:shadow-amber-500/20",
    enter: "text-amber-400 group-hover:text-amber-300",
  },
];

function ProfileSelector({ onSelect }: { onSelect: (p: "classroom" | "corporate") => void }) {
  const [showFeedback, setShowFeedback] = useState(false);
  const router = useRouter();
  return (
    <div
      className="relative min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-10 p-8 pb-40"
      style={{ backgroundImage: "radial-gradient(ellipse 75% 55% at 50% 28%, rgba(99,102,241,0.13), transparent 70%)" }}
    >
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight mb-4 pb-2 bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
          RoomRhythm
        </h1>
        <p className="text-2xl sm:text-3xl font-semibold text-white mb-2">The screen that runs your room.</p>
        <p className="max-w-2xl mx-auto text-gray-400 text-base">
          Focus blocks, breaks, transitions, and sound for your classroom — plus the only classroom screen that can also run test day.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-4xl">
        {PROFILE_CARDS.map((p) => (
          <button key={p.id} onClick={() => {
              track("session_started", { profile: p.id });
              if (p.id === "testing") router.push("/testing"); else onSelect(p.id);
            }}
            className={`group relative flex-1 flex flex-col items-center gap-4 p-8 rounded-3xl bg-slate-900/80 border border-white/10 border-t-2 ${p.topBorder} text-white text-center shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl ${p.hoverShadow} ${p.hoverBorder}`}>
            <div className={`flex items-center justify-center w-16 h-16 rounded-full ${p.iconBg} transition-transform duration-300 group-hover:scale-110`}>
              <span className="text-4xl leading-none">{p.emoji}</span>
            </div>
            <span className="text-2xl font-bold">{p.title}</span>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-white/90">{p.audience}</span>
              <span className="text-sm text-white/50">{p.benefit}</span>
            </div>
            <span className={`mt-2 text-sm font-semibold transition-colors ${p.enter}`}>Enter →</span>
          </button>
        ))}
      </div>

      {/* Below-the-fold prose — supports the SEO target queries in docs/gtm-strategy.md §5.1 */}
      <div className="w-full max-w-3xl border-t border-white/10 pt-8 text-center">
        <p className="text-gray-500 text-sm leading-relaxed">
          RoomRhythm works as a classroom timer for projector displays — Pomodoro-style focus
          blocks, breaks, and transitions in numerals the back row can actually read. The same
          screen runs your assessments, whether you need a final exam timer for a Friday midterm
          or a full mock section with multiple accommodation groups. As an exam timer with extended time,
          it keeps standard and 1.5× students on one display. Every warning shows on screen and plays
          out loud — at the times you set, for every timing group.
        </p>
      </div>

      <button onClick={() => setShowFeedback(true)}
        className="fixed bottom-6 right-6 z-40 px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all shadow-lg backdrop-blur">
        💡 Suggest a Feature
      </button>
      {showFeedback && <FeedbackModal profile="selector" onClose={() => setShowFeedback(false)} />}
    </div>
  );
}

// Set NEXT_PUBLIC_FEEDBACK_ENDPOINT (e.g. a Formspree URL) to collect feedback
// server-side. When unset, the form falls back to the visitor's mail client.
const FEEDBACK_ENDPOINT = process.env.NEXT_PUBLIC_FEEDBACK_ENDPOINT;
const FEEDBACK_EMAIL = "contact.roomrhythm@gmail.com";

function FeedbackModal({ profile, onClose }: { profile: string; onClose: () => void }) {
  const [text, setText] = useState(""); const [submitted, setSubmitted] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState(false);
  async function handleSubmit() {
    if (!text.trim()) return;
    setLoading(true); setError(false);
    try {
      if (FEEDBACK_ENDPOINT) {
        const res = await fetch(FEEDBACK_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ message: text, profile }),
        });
        if (!res.ok) throw new Error(`Feedback request failed: ${res.status}`);
      } else {
        // No backend configured — hand off to the visitor's email client.
        const subject = encodeURIComponent(`RoomRhythm feedback (${profile})`);
        const body = encodeURIComponent(text);
        window.location.href = `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`;
      }
      setSubmitted(true);
      setTimeout(onClose, 2000);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
      <div className="bg-gray-900 rounded-3xl p-8 w-full max-w-md flex flex-col gap-4 shadow-2xl">
        {submitted ? <div className="text-center py-6"><p className="text-4xl mb-3">✅</p><p className="text-white text-xl font-semibold">Thanks! We'll look into it.</p></div> : (
          <>
            <div className="flex justify-between items-start">
              <div><h2 className="text-white text-xl font-bold">Suggest a Feature</h2><p className="text-white/50 text-sm mt-1">What would make RoomRhythm more useful?</p></div>
              <button onClick={onClose} className="text-white/40 hover:text-white/80 text-2xl leading-none">×</button>
            </div>
            <textarea className="w-full bg-white/10 text-white rounded-2xl p-4 text-sm resize-none outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-white/30"
              rows={4} placeholder="e.g. Add a sound alert when the timer ends..." value={text} onChange={(e) => setText(e.target.value)} />
            {error && <p className="text-red-400 text-sm -mt-1">Couldn't send just now — please try again.</p>}
            <button onClick={handleSubmit} disabled={loading || !text.trim()}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold transition-all">
              {loading ? "Sending..." : "Send Request"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CLASSROOM
// ══════════════════════════════════════════════════════════════
function ClassroomApp({ onBack, shared }: { onBack: () => void; shared?: ClassroomShareConfig | null }) {
  // A shared link seeds the setup; every value is clamped to this app's own
  // ranges so a hand-edited link can never produce an out-of-range setup.
  const initBand = shared ? Math.min(Math.max(0, shared.band), GRADE_BANDS.length - 1) : 2;
  const initMinutes = shared
    ? Math.min(
        Math.max(GRADE_BANDS[initBand].sliderMin, Math.round(shared.focusSeconds / 60)),
        GRADE_BANDS[initBand].sliderMax,
      )
    : GRADE_BANDS[initBand].defaultMin;

  const [showFeedback, setShowFeedback]     = useState(false);
  const [mode, setMode]                     = useState<ClassroomMode>("idle");
  const [bandIndex, setBandIndex]           = useState(initBand);
  const [customMinutes, setCustomMinutes]   = useState(initMinutes);
  const [secondsLeft, setSecondsLeft]       = useState(0);
  const [running, setRunning]               = useState(false);
  const [pendingMode, setPendingMode]       = useState<ClassroomMode | null>(null);
  const [ambient, setAmbient]               = useState<AmbientId>("none");
  const [muted, setMuted]                   = useState(false);
  const [soundType, setSoundType]           = useState<SoundType>(shared?.sound ?? "chime");
  const [currentBreak, setCurrentBreak]     = useState(BRAIN_BREAKS[0]);
  const [flashTrigger, setFlashTrigger]     = useState(0);
  const [projector, setProjector]           = useState(false);
  const [showCalmCD, setShowCalmCD]         = useState(false);
  const [showFocusCD, setShowFocusCD]       = useState(false);
  const [calmDuration, setCalmDuration]     = useState(
    shared && (shared.calmSeconds === 3 || shared.calmSeconds === 5) ? shared.calmSeconds : 5,
  );
  const [autoBreak, setAutoBreak]           = useState(shared ? shared.autoBreak : true);
  const [emergencyActive, setEmergencyActive] = useState(false);
  // Completed focus blocks this sitting. In-memory only — no storage, resets on
  // reload. Drives the email ask (>=1) and, later, the feature-suggest prompt
  // (>=2, docs/13_launch_week.md D3) without needing a localStorage carve-out.
  const [blocksDone, setBlocksDone]         = useState(0);
  // Both panels start OPEN. A collapsed tab against the wall is an icon nobody
  // clicks; a teacher who never sees the picker never learns it exists. So the
  // page introduces itself, then gets out of the way — see the retract effect.
  const [showNames, setShowNames]           = useState(true);
  const [showNoise, setShowNoise]           = useState(true);
  // Set the moment the teacher touches either panel or tab. Cancels the
  // auto-retract for the rest of the session: once someone is using a panel,
  // yanking it shut on a timer is the software fighting the person.
  const [railPinned, setRailPinned]         = useState(false);

  const intervalRef      = useRef<NodeJS.Timeout | null>(null);
  // Wall-clock moment the running block ends. null = needs re-anchoring (paused,
  // idle, or the duration just changed). See the timer tick effect.
  const deadlineRef      = useRef<number | null>(null);
  const secondsLeftRef   = useRef(0);
  const totalDurationRef = useRef<number>(0);
  const warningFiredRef  = useRef(false);
  const modeRef          = useRef(mode);
  const bandIndexRef     = useRef(bandIndex);
  const customMinutesRef = useRef(customMinutes);
  const stopEmergencyRef = useRef<(() => void) | null>(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { bandIndexRef.current = bandIndex; }, [bandIndex]);
  useEffect(() => { secondsLeftRef.current = secondsLeft; }, [secondsLeft]);
  useEffect(() => { customMinutesRef.current = customMinutes; }, [customMinutes]);

  const band    = GRADE_BANDS[bandIndex];
  const config  = CLASSROOM_MODES[mode];
  const nearEnd = secondsLeft > 0 && secondsLeft <= 60 && running;

  const { playEnd, playOneMinuteWarning, playAttention, playTick, playBegin, playFinalBeep, preview, startEmergencyAlarm, startAmbient, stopAmbient } = useAudioEngine(muted, soundType);

  // Ambient bed runs during focus blocks only — a break is when the room is
  // meant to be noisy, and the silence between blocks is itself the cue that
  // the block ended. Muting the room stops it (also enforced in lib/audio.ts).
  useEffect(() => {
    if (mode === "focus" && running && !muted) startAmbient(ambient);
    else stopAmbient();
  }, [mode, running, muted, ambient, startAmbient, stopAmbient]);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const triggerFlash = useCallback(() => setFlashTrigger((n) => n + 1), []);

  const titleFlashing = useTabSnapBack(running, secondsLeft, triggerFlash, playOneMinuteWarning);

  // Final 3-2-1 beeps
  useEffect(() => {
    if (running && secondsLeft >= 1 && secondsLeft <= 3) {
      playFinalBeep(secondsLeft);
    }
  }, [secondsLeft, running, playFinalBeep]);

  // Timer tick — DEADLINE-BASED, never accumulated.
  //
  // The clock stores the wall-clock moment the block ends and derives the
  // display from it. Decrementing by 1 per interval firing looks equivalent but
  // silently runs long: browsers throttle timers in backgrounded tabs (Chrome
  // drops to roughly once a minute after a few minutes hidden), so a teacher who
  // alt-tabs to a gradebook for 20 minutes comes back to a projector still
  // showing ~19 of those minutes as remaining. A 50-minute block can overrun the
  // period. Deriving from a deadline makes throttling cosmetic — the display
  // catches up on the next firing. components/testing/SectionRunner.tsx has
  // followed this rule from the start; this brings Classroom/Corporate in line.
  //
  // deadlineRef is nulled by every path that sets secondsLeft imperatively, and
  // re-anchored here, so pause/resume and ±5s adjustments all stay correct.
  useEffect(() => {
    if (running && secondsLeft > 0) {
      if (deadlineRef.current === null) {
        deadlineRef.current = Date.now() + secondsLeft * 1000;
      }
      intervalRef.current = setInterval(() => {
        const dl = deadlineRef.current;
        if (dl === null) return;
        setSecondsLeft(Math.max(0, Math.ceil((dl - Date.now()) / 1000)));
      }, 250);
    } else if (secondsLeft === 0 && running) {
      deadlineRef.current = null;
      setRunning(false);
      playEnd();
      triggerFlash();
      warningFiredRef.current = false;
      const m = modeRef.current;
      if (m === "focus") {
        setBlocksDone((n) => n + 1);
        if (autoBreak) {
          setCurrentBreak(randomBreak(bandIndexRef.current));
          activateMode("break");
        } else {
          setMode("idle");
          document.title = "✅ Focus Complete — RoomRhythm";
        }
      } else if (m === "break") {
        setMode("idle");
        document.title = "🔔 Session Complete — RoomRhythm";
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, secondsLeft, autoBreak]);

  // Tab title
  useEffect(() => {
    if (!showCalmCD && !showFocusCD && !titleFlashing.current)
      document.title = running ? `${formatTime(secondsLeft)} — RoomRhythm` : "RoomRhythm";
  }, [secondsLeft, running, showCalmCD, showFocusCD]);

  // Keyboard ↑↓ — ignored while the teacher is typing. Without the target check,
  // using arrow keys to move around the "Suggest a Feature" textarea also
  // silently shifts the projected countdown by ±5s per keypress.
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!running) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      const delta = e.key === "ArrowUp" ? 5 : -5;
      // Adjust the DEADLINE, outside any state updater. React re-invokes updater
      // functions (twice in dev under StrictMode), so mutating a ref inside one
      // applied the shift twice — one keypress moved the real end time by 10s
      // while the display moved 5. Updaters must be pure; the anchor is the
      // source of truth while running anyway.
      const now = Date.now();
      const dl = deadlineRef.current;
      const cur = dl !== null ? Math.max(0, Math.ceil((dl - now) / 1000)) : secondsLeftRef.current;
      const next = Math.min(Math.max(cur + delta, 0), 5999);
      if (dl !== null) deadlineRef.current = now + next * 1000;
      setSecondsLeft(next);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [running]);

  function activateMode(m: ClassroomMode) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    deadlineRef.current = null; // re-anchor from the new duration
    const secs = m === "calm" ? 0 : m === "focus" ? customMinutesRef.current * 60 : band.breakMin * 60;
    totalDurationRef.current = secs;
    setMode(m); setSecondsLeft(secs);
    setRunning(m === "focus" || m === "break");
  }

  function handleCalmClick() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    deadlineRef.current = null;
    setRunning(false); setMode("calm"); setSecondsLeft(0);
    if (!muted) playAttention();
    setShowCalmCD(true);
  }

  // Calm countdown finishes → start focus timer directly
  function handleCalmComplete() {
    setShowCalmCD(false);
    const secs = customMinutesRef.current * 60;
    totalDurationRef.current = secs;
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    deadlineRef.current = null;
    setMode("focus");
    setSecondsLeft(secs);
    setRunning(true);
  }

  // Ask before discarding a running block. Returns true if it handled the click
  // by opening the dialog; false means "nothing to protect, go ahead".
  function guardInterrupt(next: "calm" | "focus" | "break"): boolean {
    if (!running || secondsLeft <= 0) return false;
    setPendingMode(next);
    return true;
  }
  function requestMode(m: ClassroomMode) {
    if (m !== "calm" && guardInterrupt(m as "focus" | "break")) return;
    activateMode(m);
  }
  function requestCalm() {
    if (guardInterrupt("calm")) return;
    handleCalmClick();
  }
  function confirmPending() {
    const m = pendingMode;
    setPendingMode(null);
    if (!m) return;
    if (m === "calm") handleCalmClick();
    else activateMode(m);
  }


  /**
   * Add or remove time on a running block. Shifts the DEADLINE (the source of
   * truth) rather than the displayed number, and does it outside any state
   * updater — React re-invokes updaters, which would double the adjustment.
   */
  function adjustSeconds(delta: number) {
    const now = Date.now();
    const dl = deadlineRef.current;
    const cur = dl !== null ? Math.max(0, Math.ceil((dl - now) / 1000)) : secondsLeftRef.current;
    const next = Math.min(Math.max(cur + delta, 0), 6 * 60 * 60);
    if (dl !== null) deadlineRef.current = now + next * 1000;
    setSecondsLeft(next);
  }

  // Pausing must drop the anchor: secondsLeft is frozen and correct, but the old
  // deadline is now in the past, so resuming without re-anchoring would snap the
  // clock straight to 0:00.
  function togglePause() {
    deadlineRef.current = null;
    setRunning((r) => !r);
  }

  function handleReset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    deadlineRef.current = null;
    setRunning(false); setMode("idle"); setSecondsLeft(0);
    setShowCalmCD(false); setShowFocusCD(false);
    document.title = "RoomRhythm";
  }

  function selectBand(i: number) { setBandIndex(i); setCustomMinutes(GRADE_BANDS[i].defaultMin); }

  function handleEmergencyActivate() {
    setEmergencyActive(true);
    stopEmergencyRef.current = startEmergencyAlarm();
  }
  function handleEmergencyDeactivate() {
    setEmergencyActive(false);
    stopEmergencyRef.current?.(); stopEmergencyRef.current = null;
  }

  /**
   * Show both panels briefly on arrival, then retract them.
   *
   * The trade: discoverability vs. a clean clock. Opening on load means every
   * teacher sees that a name picker and a noise meter exist; retracting means
   * the room isn't looking at two panels flanking the timer all period. Four
   * seconds is long enough to read two headings, and any contact at all —
   * pointer over a panel, focus into it, or a click on either tab — cancels
   * the retract permanently.
   */
  useEffect(() => {
    if (railPinned) return;
    const t = setTimeout(() => {
      setShowNames(false);
      setShowNoise(false);
    }, 4000);
    return () => clearTimeout(t);
  }, [railPinned]);

  // The alarm is a self-rescheduling setTimeout loop inside lib/audio.ts, fully
  // independent of React. If this screen unmounts while it's sounding (teacher
  // hits "← Rooms" without stopping it first) nothing can ever silence it — the
  // only UI that holds the stop handle is gone, and starting a new alarm builds
  // a second AudioContext that layers on top instead of replacing it. Reloading
  // the page would be the only escape. Always release on unmount.
  useEffect(() => () => {
    stopEmergencyRef.current?.();
    stopEmergencyRef.current = null;
  }, []);

  if (projector) return <ProjectorView secondsLeft={secondsLeft} label={config.label} emoji={config.emoji} nearEnd={nearEnd} totalDuration={totalDurationRef.current} accent="#818cf8" onExit={() => setProjector(false)} />;

  return (
    <div className={`min-h-screen ${config.bg} ${config.text} flex flex-col items-center justify-center transition-colors duration-700 p-6 pb-28 relative ${emergencyActive ? "ring-8 ring-inset ring-red-500/60" : ""}`}
      style={{ backgroundImage: "radial-gradient(ellipse 70% 55% at 50% 34%, rgba(129,140,248,0.14), transparent 72%)" }}>

      {/* Calm countdown: amber → indigo */}
      {showCalmCD && (
        <CountdownOverlay startFrom={calmDuration} onComplete={handleCalmComplete}
          playTick={playTick} playBegin={playBegin} muted={muted}
          fromColor="hsl(38, 92%, 18%)" toColor="hsl(230, 68%, 20%)"
          label="Settle in. Eyes forward." beginLabel="Let's focus." />
      )}

      <ScreenFlash trigger={flashTrigger} />

      <RoomTopBar emoji="🏫" name="Classroom" accentBg="bg-indigo-500/15" onBack={onBack}>
        <button onClick={() => setShowFeedback(true)} className={CTRL_BTN}>💡 Suggest a Feature</button>
        <button onClick={toggleFullscreen} className={CTRL_BTN}>{isFullscreen ? "⊠ Exit Full" : "⛶ Fullscreen"}</button>
        <button onClick={() => setProjector(true)} className={CTRL_BTN}>📽 Projector</button>
      </RoomTopBar>

      <SideRail
        onNames={() => { setRailPinned(true); setShowNames((v) => !v); }}
        onNoise={() => { setRailPinned(true); setShowNoise((v) => !v); }}
        namesOn={showNames}
        noiseOn={showNoise}
      />

      {showFeedback && <FeedbackModal profile="classroom" onClose={() => setShowFeedback(false)} />}
      {pendingMode && (
        <InterruptDialog
          remaining={secondsLeft}
          currentLabel={CLASSROOM_MODES[mode].label}
          nextLabel={pendingMode === "calm" ? "Calm Down" : CLASSROOM_MODES[pendingMode].label}
          onCancel={() => setPendingMode(null)}
          onConfirm={confirmPending}
        />
      )}
      {/* Any contact with a panel pins it — pointer over it or keyboard focus
          into it both count, so the intro retract can't close something the
          teacher is mid-way through reading or typing into. */}
      {showNames && (
        <div onPointerEnter={() => setRailPinned(true)} onPointerDown={() => setRailPinned(true)} onFocusCapture={() => setRailPinned(true)}>
          <NamePicker onClose={() => { setRailPinned(true); setShowNames(false); }} />
        </div>
      )}
      {showNoise && (
        <div onPointerEnter={() => setRailPinned(true)} onPointerDown={() => setRailPinned(true)} onFocusCapture={() => setRailPinned(true)}>
          <NoiseMeter muted={muted} onClose={() => { setRailPinned(true); setShowNoise(false); }} />
        </div>
      )}
      <EmergencyButton onActivate={handleEmergencyActivate} onDeactivate={handleEmergencyDeactivate} />

      {/* Mode Label */}
      <h1 className={`text-4xl font-bold tracking-tight mb-1 pb-1 ${mode === "idle" ? "bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent" : ""}`}>
        {config.emoji} {config.label}
      </h1>
      <p className="text-base opacity-60 mb-8">{config.sub}</p>

      {/* Timer Ring — hero, flanked by time adjustment.
          "Two more minutes" is the most frequent thing said to a classroom
          timer, so the controls sit either side of the clock where a teacher
          looks, not buried at the bottom of the screen. Minus on the left,
          plus on the right, matching how the numbers move. */}
      {secondsLeft > 0 && (
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            {running && (
              <button onClick={() => adjustSeconds(-5)} title="Five seconds back (↓)"
                className={ADJ_BTN}>−5s</button>
            )}
            <div className="relative flex items-center justify-center">
              <svg width="240" height="240" className="absolute">
                <circle cx="120" cy="120" r="108" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle cx="120" cy="120" r="108" fill="none"
                  stroke={nearEnd ? "#f87171" : mode === "break" ? "#34d399" : "#818cf8"}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 108}`}
                  strokeDashoffset={`${2 * Math.PI * 108 * (1 - (totalDurationRef.current > 0 ? (totalDurationRef.current - secondsLeft) / totalDurationRef.current : 0))}`}
                  transform="rotate(-90 120 120)" className="transition-all duration-1000" />
              </svg>
              <div className={`text-7xl font-mono font-bold tabular-nums transition-all duration-300 ${nearEnd ? "text-red-300 animate-pulse" : ""}`}>
                {formatTime(secondsLeft)}
              </div>
            </div>
            {running && (
              <button onClick={() => adjustSeconds(5)} title="Five seconds more (↑)"
                className={ADJ_BTN}>+5s</button>
            )}
          </div>
          {running && (
            <div className="mt-5 flex gap-3">
              <button onClick={() => adjustSeconds(-60)} className={MIN_BTN}>−1 minute</button>
              <button onClick={() => adjustSeconds(60)} className={MIN_BTN}>+1 minute</button>
            </div>
          )}
        </div>
      )}

      {/* Sound Cover lives on the running screen, not in setup: a teacher reaches
          for it when the corridor gets loud mid-block, not before starting. */}
      {mode === "focus" && (
        <div className="mb-6 flex w-full max-w-md justify-center">
          <SoundCover value={ambient} onChange={setAmbient} />
        </div>
      )}

      {/* Brain Break */}
      {mode === "break" && (
        <div className="mb-8 px-6 py-4 bg-slate-900/70 border border-white/10 rounded-2xl text-center max-w-sm">
          <p className="text-xs uppercase tracking-widest text-indigo-300 mb-1">{currentBreak.type}</p>
          <p className="text-lg font-medium">{currentBreak.text}</p>
        </div>
      )}

      {/* Idle — unified settings panel */}
      {mode === "idle" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-md mb-6">
          <div className="grid grid-cols-4 gap-2 w-full">
            {GRADE_BANDS.map((b, i) => (
              <button key={b.label} onClick={() => selectBand(i)}
                className={`flex flex-col items-center justify-center gap-0.5 py-3 rounded-xl text-sm font-medium border transition-all ${
                  bandIndex === i ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/25" : "bg-white/10 border-white/15 hover:bg-white/20 hover:border-white/25"
                }`}>
                <span className="text-sm font-bold leading-tight">{b.label}</span>
                <span className={`text-xs leading-tight ${bandIndex === i ? "text-indigo-100" : "opacity-60"}`}>{b.sub}</span>
                <span className={`text-xs leading-tight ${bandIndex === i ? "text-indigo-200" : "opacity-40"}`}>{b.defaultMin}m</span>
              </button>
            ))}
          </div>
          <div className="w-full bg-slate-900/70 border border-white/10 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs opacity-60 uppercase tracking-widest">Focus Duration</p>
                <p className="font-bold">{customMinutes} min</p>
              </div>
              <input type="range" min={band.sliderMin} max={band.sliderMax} step={1} value={customMinutes}
                onChange={(e) => setCustomMinutes(Number(e.target.value))} className="w-full accent-indigo-400" />
              <div className="flex justify-between text-xs opacity-40 mt-1"><span>{band.sliderMin}m</span><span>{band.sliderMax}m</span></div>
              <p className="text-[11px] text-center mt-3 opacity-60">
                Presets follow classroom attention-span research
                <span className="text-indigo-300 font-semibold"> — fully adjustable</span>
              </p>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <span className="opacity-50">Calm</span>
                <button onClick={() => setCalmDuration(3)} className={`px-2 py-1 rounded-lg transition-all ${calmDuration === 3 ? "bg-indigo-500/40 text-indigo-100" : "bg-white/10 hover:bg-white/20"}`}>3s</button>
                <button onClick={() => setCalmDuration(5)} className={`px-2 py-1 rounded-lg transition-all ${calmDuration === 5 ? "bg-indigo-500/40 text-indigo-100" : "bg-white/10 hover:bg-white/20"}`}>5s</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="opacity-50">Auto-break</span>
                <button onClick={() => setAutoBreak((v) => !v)}
                  className={`px-3 py-1 rounded-full font-semibold transition-all ${autoBreak ? "bg-indigo-500/40 text-indigo-100" : "bg-white/10 hover:bg-white/20"}`}>
                  {autoBreak ? "On" : "Off"}
                </button>
              </div>
            </div>
            <div className="h-px bg-white/10" />
            <SoundSettings
              muted={muted} onMuteToggle={() => setMuted((m) => !m)}
              soundType={soundType} onSoundChange={setSoundType} onPreview={preview}
              cover={ambient} onCoverChange={setAmbient}
              accent="bg-indigo-500"
            />
            {/*
              "Copy share link" lived here. Removed deliberately: all it shared
              was one teacher's slider positions, which the recipient could set
              in ten seconds themselves. It promised subs and co-teachers a
              handoff it could not deliver.

              The ENCODING stays (lib/share.ts, SHARE_PARAM, decodeShareConfig,
              and the `shared` seeding above) — every link already copied still
              opens correctly, and Schedule mode reintroduces this button as
              "Copy schedule link", where the payload is a whole period cadence
              and the handoff is real. See docs/12_build_plan.md phase 4.
            */}
          </div>
        </div>
      )}

      {/* Main Buttons — Focus is the primary action */}
      <div className="flex gap-3 mb-5 flex-wrap justify-center">
        <button onClick={requestCalm} className="px-6 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-base font-semibold transition-all shadow-lg shadow-sky-500/25 hover:-translate-y-0.5">🔔 Calm</button>
        <button onClick={() => requestMode("focus")} className="px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-base font-semibold transition-all shadow-lg shadow-teal-500/25 hover:-translate-y-0.5">⏱ Focus</button>
        <button onClick={() => requestMode("break")} className="px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-base font-semibold transition-all shadow-lg shadow-amber-500/25 hover:-translate-y-0.5">🌿 Break</button>
      </div>

      {/* Pause / Reset — secondary */}
      {mode !== "idle" && !showCalmCD && (
        <div className="flex gap-3">
          <button onClick={togglePause} className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-all">
            {running ? "⏸ Pause" : "▶ Resume"}
          </button>
          <button onClick={handleReset} className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-all">↺ Reset</button>
        </div>
      )}

      {/*
        The email ask, at the only moment it's earned: a focus block just ran to
        completion and the room is between activities. Never on entry — "no
        login, nothing to install, just open it and teach" is the entire
        differentiator, and an entry gate would trade it for a slightly longer
        list. Waits for idle so it can't appear over a running clock, and
        EmailCapture retires itself for the session on submit or dismiss.
      */}
      {mode === "idle" && blocksDone > 0 && (
        <div className="mt-8 flex justify-center">
          <EmailCapture source="run_complete" />
        </div>
      )}

      {mode === "focus" && <p className="mt-6 text-xs opacity-30">Grade {band.label} · {customMinutes} min block</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CORPORATE
// ══════════════════════════════════════════════════════════════
function CorporateApp({ onBack }: { onBack: () => void }) {
  const [showFeedback, setShowFeedback]   = useState(false);
  const [mode, setCorporateMode]          = useState<CorporateMode>("idle");
  const [blockMinutes, setBlockMinutes]   = useState(25);
  const [breakMinutes, setBreakMinutes]   = useState(5);
  const [secondsLeft, setSecondsLeft]     = useState(0);
  const [running, setRunning]             = useState(false);
  const [pendingMode, setPendingMode]     = useState<CorporateMode | null>(null);
  const [ambient, setAmbient]             = useState<AmbientId>("none");
  const [muted, setMuted]                 = useState(false);
  const [soundType, setSoundType]         = useState<SoundType>("chime");
  const [flashTrigger, setFlashTrigger]   = useState(0);
  const [projector, setProjector]         = useState(false);
  const [showCalmCD, setShowCalmCD]       = useState(false);
  const [showFocusCD, setShowFocusCD]     = useState(false);
  const [calmDuration, setCalmDuration]   = useState(5);
  const [autoBreak, setAutoBreak]         = useState(true);
  const [emergencyActive, setEmergencyActive] = useState(false);
  const [currentRecharge, setCurrentRecharge] = useState(CORPORATE_RECHARGES[0]);

  const intervalRef      = useRef<NodeJS.Timeout | null>(null);
  // Wall-clock moment the running block ends. null = needs re-anchoring (paused,
  // idle, or the duration just changed). See the timer tick effect.
  const deadlineRef      = useRef<number | null>(null);
  const secondsLeftRef   = useRef(0);
  const totalDurationRef = useRef<number>(0);
  const warningFiredRef  = useRef(false);
  const modeRef          = useRef(mode);
  const blockMinutesRef  = useRef(blockMinutes);
  const breakMinutesRef  = useRef(breakMinutes);
  const stopEmergencyRef = useRef<(() => void) | null>(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { blockMinutesRef.current = blockMinutes; }, [blockMinutes]);
  useEffect(() => { breakMinutesRef.current = breakMinutes; }, [breakMinutes]);
  useEffect(() => { secondsLeftRef.current = secondsLeft; }, [secondsLeft]);

  const config  = CORPORATE_MODES[mode];
  const nearEnd = secondsLeft > 0 && secondsLeft <= 60 && running;

  const { playEnd, playOneMinuteWarning, playAttention, playTick, playBegin, playFinalBeep, preview, startEmergencyAlarm, startAmbient, stopAmbient } = useAudioEngine(muted, soundType);

  // Same rule as Classroom: the bed runs during work blocks only.
  useEffect(() => {
    if (mode === "work" && running && !muted) startAmbient(ambient);
    else stopAmbient();
  }, [mode, running, muted, ambient, startAmbient, stopAmbient]);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const triggerFlash = useCallback(() => setFlashTrigger((n) => n + 1), []);

  const titleFlashing = useTabSnapBack(running, secondsLeft, triggerFlash, playOneMinuteWarning);

  // Final 3-2-1 beeps
  useEffect(() => {
    if (running && secondsLeft >= 1 && secondsLeft <= 3) {
      playFinalBeep(secondsLeft);
    }
  }, [secondsLeft, running, playFinalBeep]);

  useEffect(() => {
    // Deadline-based, never accumulated — see the matching comment in
    // ClassroomApp. A decremented counter runs long whenever the tab is
    // backgrounded and the browser throttles timers.
    if (running && secondsLeft > 0) {
      if (deadlineRef.current === null) {
        deadlineRef.current = Date.now() + secondsLeft * 1000;
      }
      intervalRef.current = setInterval(() => {
        const dl = deadlineRef.current;
        if (dl === null) return;
        setSecondsLeft(Math.max(0, Math.ceil((dl - Date.now()) / 1000)));
      }, 250);
    } else if (secondsLeft === 0 && running) {
      deadlineRef.current = null;
      setRunning(false); playEnd(); triggerFlash(); warningFiredRef.current = false;
      const m = modeRef.current;
      if (m === "work") {
        // Auto-break alternates Work and Recharge until the facilitator stops
        // it — same model as Classroom. There is no fixed block count.
        if (autoBreak) activateCorporateMode("recharge");
        else { setCorporateMode("idle"); document.title = "✅ Focus Complete — RoomRhythm"; }
      } else if (m === "recharge") {
        activateCorporateMode("work");
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, secondsLeft, autoBreak]);

  useEffect(() => {
    if (!showCalmCD && !showFocusCD && !titleFlashing.current)
      document.title = running ? `${formatTime(secondsLeft)} — RoomRhythm` : "RoomRhythm";
  }, [secondsLeft, running, showCalmCD, showFocusCD]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!running) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      const delta = e.key === "ArrowUp" ? 5 : -5;
      // Adjust the DEADLINE, outside any state updater. React re-invokes updater
      // functions (twice in dev under StrictMode), so mutating a ref inside one
      // applied the shift twice — one keypress moved the real end time by 10s
      // while the display moved 5. Updaters must be pure; the anchor is the
      // source of truth while running anyway.
      const now = Date.now();
      const dl = deadlineRef.current;
      const cur = dl !== null ? Math.max(0, Math.ceil((dl - now) / 1000)) : secondsLeftRef.current;
      const next = Math.min(Math.max(cur + delta, 0), 5999);
      if (dl !== null) deadlineRef.current = now + next * 1000;
      setSecondsLeft(next);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [running]);

  function activateCorporateMode(m: CorporateMode) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    deadlineRef.current = null; // re-anchor from the new duration
    const secs = m === "attention" ? 0 : m === "work" ? blockMinutesRef.current * 60 : breakMinutesRef.current * 60;
    totalDurationRef.current = secs;
    if (m === "recharge") setCurrentRecharge(randomRecharge());
    setCorporateMode(m); setSecondsLeft(secs);
    setRunning(m === "work" || m === "recharge");
  }

  function handleCalmClick() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    deadlineRef.current = null;
    setRunning(false); setCorporateMode("attention"); setSecondsLeft(0);
    if (!muted) playAttention();
    setShowCalmCD(true);
  }

  // Calm countdown finishes → start work timer directly
  function handleCalmComplete() {
    setShowCalmCD(false);
    const secs = blockMinutesRef.current * 60;
    totalDurationRef.current = secs;
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    deadlineRef.current = null;
    setCorporateMode("work");
    setSecondsLeft(secs);
    setRunning(true);
  }

  // See ClassroomApp — warn before discarding a running block, then allow it.
  function guardInterrupt(next: CorporateMode): boolean {
    if (!running || secondsLeft <= 0) return false;
    setPendingMode(next);
    return true;
  }
  function requestCorporateMode(m: CorporateMode) {
    if (guardInterrupt(m)) return;
    activateCorporateMode(m);
  }
  function requestCalm() {
    if (guardInterrupt("attention")) return;
    handleCalmClick();
  }
  function confirmPending() {
    const m = pendingMode;
    setPendingMode(null);
    if (!m) return;
    if (m === "attention") handleCalmClick();
    else activateCorporateMode(m);
  }


  /**
   * Add or remove time on a running block. Shifts the DEADLINE (the source of
   * truth) rather than the displayed number, and does it outside any state
   * updater — React re-invokes updaters, which would double the adjustment.
   */
  function adjustSeconds(delta: number) {
    const now = Date.now();
    const dl = deadlineRef.current;
    const cur = dl !== null ? Math.max(0, Math.ceil((dl - now) / 1000)) : secondsLeftRef.current;
    const next = Math.min(Math.max(cur + delta, 0), 6 * 60 * 60);
    if (dl !== null) deadlineRef.current = now + next * 1000;
    setSecondsLeft(next);
  }

  // Pausing drops the anchor; resuming re-anchors from the frozen secondsLeft.
  function togglePause() {
    deadlineRef.current = null;
    setRunning((r) => !r);
  }

  function handleReset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    deadlineRef.current = null;
    setRunning(false); setCorporateMode("idle"); setSecondsLeft(0);
    setShowCalmCD(false); setShowFocusCD(false);
    document.title = "RoomRhythm";
  }

  function handleEmergencyActivate() { setEmergencyActive(true); stopEmergencyRef.current = startEmergencyAlarm(); }
  function handleEmergencyDeactivate() { setEmergencyActive(false); stopEmergencyRef.current?.(); stopEmergencyRef.current = null; }

  // See ClassroomApp: an alarm left running past unmount can never be silenced.
  useEffect(() => () => {
    stopEmergencyRef.current?.();
    stopEmergencyRef.current = null;
  }, []);

  if (projector) return <ProjectorView secondsLeft={secondsLeft} label={config.label} emoji={config.emoji} nearEnd={nearEnd} totalDuration={totalDurationRef.current} accent="#2dd4bf" onExit={() => setProjector(false)} />;

  return (
    <div className={`min-h-screen ${config.bg} ${config.text} flex flex-col items-center justify-center transition-colors duration-700 p-6 pb-28 relative ${emergencyActive ? "ring-8 ring-inset ring-red-500/60" : ""}`}
      style={{ backgroundImage: "radial-gradient(ellipse 68% 52% at 50% 34%, rgba(45,212,191,0.12), transparent 72%)" }}>

      {/* Calm countdown: amber → indigo */}
      {showCalmCD && (
        <CountdownOverlay startFrom={calmDuration} onComplete={handleCalmComplete}
          playTick={playTick} playBegin={playBegin} muted={muted}
          fromColor="hsl(38, 92%, 18%)" toColor="hsl(230, 68%, 20%)"
          label="Take a breath. Settle in." beginLabel="Let's focus." />
      )}

      <ScreenFlash trigger={flashTrigger} />

      <RoomTopBar emoji="🏢" name="Corporate" accentBg="bg-teal-500/15" onBack={onBack}>
        <button onClick={() => setShowFeedback(true)} className={CTRL_BTN}>💡 Suggest a Feature</button>
        <button onClick={toggleFullscreen} className={CTRL_BTN}>{isFullscreen ? "⊠ Exit Full" : "⛶ Fullscreen"}</button>
        <button onClick={() => setProjector(true)} className={CTRL_BTN}>📽 Projector</button>
      </RoomTopBar>

      {showFeedback && <FeedbackModal profile="corporate" onClose={() => setShowFeedback(false)} />}
      {pendingMode && (
        <InterruptDialog
          remaining={secondsLeft}
          currentLabel={CORPORATE_MODES[mode].label}
          nextLabel={CORPORATE_MODES[pendingMode].label}
          onCancel={() => setPendingMode(null)}
          onConfirm={confirmPending}
        />
      )}
      <EmergencyButton onActivate={handleEmergencyActivate} onDeactivate={handleEmergencyDeactivate} />

      <h1 className={`text-4xl font-bold tracking-tight mb-1 pb-1 ${mode === "idle" ? "bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent" : ""}`}>
        {config.emoji} {config.label}
      </h1>
      <p className="text-base opacity-60 mb-6">{config.sub}</p>


      {secondsLeft > 0 && (
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center gap-4 sm:gap-8">
            {running && (
              <button onClick={() => adjustSeconds(-5)} title="Five seconds back (↓)"
                className={ADJ_BTN}>−5s</button>
            )}
            <div className="relative flex items-center justify-center">
              <svg width="240" height="240" className="absolute">
                <circle cx="120" cy="120" r="108" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                <circle cx="120" cy="120" r="108" fill="none"
                  stroke={nearEnd ? "#f87171" : mode === "recharge" ? "#34d399" : "#2dd4bf"}
                  strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 108}`}
                  strokeDashoffset={`${2 * Math.PI * 108 * (1 - (totalDurationRef.current > 0 ? (totalDurationRef.current - secondsLeft) / totalDurationRef.current : 0))}`}
                  transform="rotate(-90 120 120)" className="transition-all duration-1000" />
              </svg>
              <div className={`text-7xl font-mono font-bold tabular-nums transition-all duration-300 ${nearEnd ? "text-red-300 animate-pulse" : ""}`}>
                {formatTime(secondsLeft)}
              </div>
            </div>
            {running && (
              <button onClick={() => adjustSeconds(5)} title="Five seconds more (↑)"
                className={ADJ_BTN}>+5s</button>
            )}
          </div>
          {running && (
            <div className="mt-5 flex gap-3">
              <button onClick={() => adjustSeconds(-60)} className={MIN_BTN}>−1 minute</button>
              <button onClick={() => adjustSeconds(60)} className={MIN_BTN}>+1 minute</button>
            </div>
          )}
        </div>
      )}

      {mode === "work" && (
        <div className="mb-6 flex w-full max-w-md justify-center">
          <SoundCover value={ambient} onChange={setAmbient} />
        </div>
      )}

      {/* Recharge prompt */}
      {mode === "recharge" && (
        <div className="mb-8 px-6 py-4 bg-slate-900/70 border border-white/10 rounded-2xl text-center max-w-sm">
          <p className="text-xs uppercase tracking-widest text-teal-300 mb-1">Recharge</p>
          <p className="text-lg font-medium">{currentRecharge}</p>
        </div>
      )}

      {mode === "idle" && (
        <div className="flex flex-col gap-4 mb-8 w-full max-w-sm">
          <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-5 flex flex-col gap-5 shadow-xl">
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs opacity-60 uppercase tracking-widest">Focus Duration</p>
                <p className="font-bold">{blockMinutes} min</p>
              </div>
              <input type="range" min={10} max={60} step={5} value={blockMinutes}
                onChange={(e) => setBlockMinutes(Number(e.target.value))} className="w-full accent-teal-400" />
              <div className="flex justify-between text-xs opacity-40 mt-1"><span>10m</span><span>60m</span></div>
            </div>
            <div className="h-px bg-white/10" />
            <div>
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs opacity-60 uppercase tracking-widest">Break Duration</p>
                <p className="font-bold">{breakMinutes} min</p>
              </div>
              <input type="range" min={5} max={30} step={5} value={breakMinutes}
                onChange={(e) => setBreakMinutes(Number(e.target.value))} className="w-full accent-teal-400" />
              <div className="flex justify-between text-xs opacity-40 mt-1"><span>5m</span><span>30m</span></div>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex items-center justify-between gap-3 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <span className="opacity-50">Calm</span>
                <button onClick={() => setCalmDuration(3)} className={`px-2 py-1 rounded-lg transition-all ${calmDuration === 3 ? "bg-teal-500/40 text-teal-100" : "bg-white/10 hover:bg-white/20"}`}>3s</button>
                <button onClick={() => setCalmDuration(5)} className={`px-2 py-1 rounded-lg transition-all ${calmDuration === 5 ? "bg-teal-500/40 text-teal-100" : "bg-white/10 hover:bg-white/20"}`}>5s</button>
              </div>
              <div className="flex items-center gap-2">
                <span className="opacity-50">Auto-break</span>
                <button onClick={() => setAutoBreak((v) => !v)}
                  className={`px-3 py-1 rounded-full font-semibold transition-all ${autoBreak ? "bg-teal-500/40 text-teal-100" : "bg-white/10 hover:bg-white/20"}`}>
                  {autoBreak ? "On" : "Off"}
                </button>
              </div>
            </div>
            <div className="h-px bg-white/10" />
            <SoundSettings
              muted={muted} onMuteToggle={() => setMuted((m) => !m)}
              soundType={soundType} onSoundChange={setSoundType} onPreview={preview}
              cover={ambient} onCoverChange={setAmbient}
              accent="bg-teal-500"
            />
          </div>
        </div>
      )}

      {/* Main Buttons — Focus is the primary action */}
      <div className="flex gap-3 mb-5 flex-wrap justify-center">
        <button onClick={requestCalm} className="px-6 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-base font-semibold transition-all shadow-lg shadow-sky-500/25 hover:-translate-y-0.5">🔔 Calm</button>
        <button onClick={() => requestCorporateMode("work")} className="px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-base font-semibold transition-all shadow-lg shadow-teal-500/25 hover:-translate-y-0.5">💼 Focus</button>
        <button onClick={() => requestCorporateMode("recharge")} className="px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-base font-semibold transition-all shadow-lg shadow-amber-500/25 hover:-translate-y-0.5">⚡ Recharge</button>
      </div>

      {mode !== "idle" && !showCalmCD && (
        <div className="flex gap-3">
          <button onClick={togglePause} className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-all">{running ? "⏸ Pause" : "▶ Resume"}</button>
          <button onClick={handleReset} className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-all">↺ Reset</button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// ROOT
// ══════════════════════════════════════════════════════════════
export default function Home() {
  const [profile, setProfile] = useState<Profile>("selector");
  const [shared, setShared] = useState<ClassroomShareConfig | null>(null);

  // A valid ?s= link opens straight into the shared setup. Anything invalid or
  // missing falls through silently to the normal profile picker — never an error.
  useEffect(() => {
    const cfg = decodeShareConfig(new URLSearchParams(window.location.search).get(SHARE_PARAM));
    if (cfg?.p === "classroom") {
      setShared(cfg);
      setProfile("classroom");
      track("session_started", { profile: "classroom" });
    }
  }, []);

  return profile === "selector" ? <ProfileSelector onSelect={setProfile} />
    : profile === "classroom" ? <ClassroomApp onBack={() => setProfile("selector")} shared={shared} />
    : <CorporateApp onBack={() => setProfile("selector")} />;
}
