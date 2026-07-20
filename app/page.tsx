"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAudioEngine, type SoundType } from "@/lib/audio";
import {
  SHARE_PARAM,
  decodeShareConfig,
  withShareParam,
  type ClassroomShareConfig,
} from "@/lib/share";
import NamePicker from "@/components/NamePicker";
import NoiseMeter from "@/components/NoiseMeter";

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
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
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
        if (flashTitleRef.current) {
          clearInterval(flashTitleRef.current);
          flashTitleRef.current = null;
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [running, onReturnFlash]);

  useEffect(() => {
    if (running && secondsLeft === 60) {
      playWarning();
      if (document.hidden) {
        // Desktop notification — clicking it brings the user back
        if ("Notification" in window && Notification.permission === "granted") {
          const n = new Notification("⚠️ 1 minute left — RoomRhythm", {
            body: "Time is almost up. Click to return.",
            tag: "roomrhythm-warning",
          });
          n.onclick = () => { window.focus(); n.close(); };
        }
        // Aggressive title flash
        let tick = 0;
        originalTitle.current = document.title;
        if (flashTitleRef.current) clearInterval(flashTitleRef.current);
        flashTitleRef.current = setInterval(() => {
          document.title = tick % 2 === 0 ? "⚠️ 1 MIN LEFT — RoomRhythm" : "🔴 TIMER ENDING SOON";
          tick++;
          if (tick > 40) {
            if (flashTitleRef.current) clearInterval(flashTitleRef.current);
            flashTitleRef.current = null;
          }
        }, 400);
      }
    }
    return () => {
      if (flashTitleRef.current) { clearInterval(flashTitleRef.current); flashTitleRef.current = null; }
    };
  }, [secondsLeft, running]);
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

function ProjectorView({ secondsLeft, label, emoji, nearEnd, totalDuration, onExit, accent = "#818cf8", showWordmark = true }: {
  secondsLeft: number; label: string; emoji: string;
  nearEnd: boolean; totalDuration: number; onExit: () => void; accent?: string;
  /** Reserved for a future Pro tier to hide the wordmark. No settings UI today. */
  showWordmark?: boolean;
}) {
  const r = 150, circ = 2 * Math.PI * r;
  const progress = totalDuration > 0 ? (totalDuration - secondsLeft) / totalDuration : 0;
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-gray-950">
      <button onClick={onExit} className="absolute top-6 right-6 text-white/30 hover:text-white/70 text-sm">✕ Exit Projector</button>
      {showWordmark && (
        <span className="absolute bottom-6 right-6 text-sm opacity-40 pointer-events-none select-none">
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
// KEYBOARD HINT
// ══════════════════════════════════════════════════════════════
function KeyboardHint() {
  return (
    <div className="fixed left-1/2 bottom-6 -translate-x-1/2 flex items-center gap-2 pointer-events-none select-none z-10 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/40">
      <span className="text-xs font-medium tracking-wide">↑ +5s</span>
      <span className="w-px h-3 bg-white/15" />
      <span className="text-xs font-medium tracking-wide">↓ −5s</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// SHARED ROOM CHROME — one design language across all three rooms
// ══════════════════════════════════════════════════════════════
// Ghost control-button style used in every room's top bar.
const CTRL_BTN =
  "px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/10 transition-all";

// Slim top bar: "← Rooms" + accent-tinted profile identity on the left,
// room-specific controls (passed as children) on the right.
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
          <button key={p.id} onClick={() => (p.id === "testing" ? router.push("/testing") : onSelect(p.id))}
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
          or a full mock section with multiple accommodation lanes. As an exam timer with extended time,
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
  const [copied, setCopied]                 = useState(false);
  const [showNames, setShowNames]           = useState(false);
  const [showNoise, setShowNoise]           = useState(false);

  const intervalRef      = useRef<NodeJS.Timeout | null>(null);
  const totalDurationRef = useRef<number>(0);
  const warningFiredRef  = useRef(false);
  const modeRef          = useRef(mode);
  const bandIndexRef     = useRef(bandIndex);
  const customMinutesRef = useRef(customMinutes);
  const stopEmergencyRef = useRef<(() => void) | null>(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { bandIndexRef.current = bandIndex; }, [bandIndex]);
  useEffect(() => { customMinutesRef.current = customMinutes; }, [customMinutes]);

  const band    = GRADE_BANDS[bandIndex];
  const config  = CLASSROOM_MODES[mode];
  const nearEnd = secondsLeft > 0 && secondsLeft <= 60 && running;

  const { playEnd, playOneMinuteWarning, playAttention, playTick, playBegin, playFinalBeep, preview, startEmergencyAlarm } = useAudioEngine(muted, soundType);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const triggerFlash = useCallback(() => setFlashTrigger((n) => n + 1), []);

  useTabSnapBack(running, secondsLeft, triggerFlash, playOneMinuteWarning);

  // Final 3-2-1 beeps
  useEffect(() => {
    if (running && secondsLeft >= 1 && secondsLeft <= 3) {
      playFinalBeep(secondsLeft);
    }
  }, [secondsLeft, running, playFinalBeep]);

  // Timer tick
  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    } else if (secondsLeft === 0 && running) {
      setRunning(false);
      playEnd();
      triggerFlash();
      warningFiredRef.current = false;
      const m = modeRef.current;
      if (m === "focus") {
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
    if (!showCalmCD && !showFocusCD)
      document.title = running ? `${formatTime(secondsLeft)} — RoomRhythm` : "RoomRhythm";
  }, [secondsLeft, running, showCalmCD, showFocusCD]);

  // Keyboard ↑↓
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!running) return;
      if (e.key === "ArrowUp")   setSecondsLeft((s) => Math.min(s + 5, 5999));
      if (e.key === "ArrowDown") setSecondsLeft((s) => Math.max(s - 5, 0));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [running]);

  function activateMode(m: ClassroomMode) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    const secs = m === "calm" ? 0 : m === "focus" ? customMinutesRef.current * 60 : band.breakMin * 60;
    totalDurationRef.current = secs;
    setMode(m); setSecondsLeft(secs);
    setRunning(m === "focus" || m === "break");
  }

  function handleCalmClick() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
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
    setMode("focus");
    setSecondsLeft(secs);
    setRunning(true);
  }

  function handleReset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    setRunning(false); setMode("idle"); setSecondsLeft(0);
    setShowCalmCD(false); setShowFocusCD(false);
    document.title = "RoomRhythm";
  }

  function selectBand(i: number) { setBandIndex(i); setCustomMinutes(GRADE_BANDS[i].defaultMin); }

  async function copyShareLink() {
    const cfg: ClassroomShareConfig = {
      p: "classroom",
      band: bandIndex,
      focusSeconds: customMinutes * 60,
      calmSeconds: calmDuration,
      autoBreak,
      sound: soundType,
    };
    try {
      await navigator.clipboard.writeText(withShareParam(window.location.href, cfg));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / permission) — fail quietly.
    }
  }

  function handleEmergencyActivate() {
    setEmergencyActive(true);
    stopEmergencyRef.current = startEmergencyAlarm();
  }
  function handleEmergencyDeactivate() {
    setEmergencyActive(false);
    stopEmergencyRef.current?.(); stopEmergencyRef.current = null;
  }

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
        <button onClick={() => setShowNames(true)} className={CTRL_BTN}>🎲 Names</button>
        <button onClick={() => setShowNoise(true)} className={CTRL_BTN}>🔊 Noise</button>
        <button onClick={() => setShowFeedback(true)} className={CTRL_BTN}>💡 Suggest</button>
        <button onClick={toggleFullscreen} className={CTRL_BTN}>{isFullscreen ? "⊠ Exit Full" : "⛶ Fullscreen"}</button>
        <button onClick={() => setProjector(true)} className={CTRL_BTN}>📽 Projector</button>
        <button onClick={() => setMuted((m) => !m)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border border-white/10 transition-all ${!muted ? "bg-white text-gray-900" : "bg-white/10 hover:bg-white/20"}`}>
          {muted ? "🔇 Muted" : "🔔 Sound On"}
        </button>
      </RoomTopBar>

      {showFeedback && <FeedbackModal profile="classroom" onClose={() => setShowFeedback(false)} />}
      {showNames && <NamePicker onClose={() => setShowNames(false)} />}
      {showNoise && <NoiseMeter muted={muted} onClose={() => setShowNoise(false)} />}
      <EmergencyButton onActivate={handleEmergencyActivate} onDeactivate={handleEmergencyDeactivate} />

      {running && <KeyboardHint />}

      {/* Mode Label */}
      <h1 className={`text-4xl font-bold tracking-tight mb-1 pb-1 ${mode === "idle" ? "bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent" : ""}`}>
        {config.emoji} {config.label}
      </h1>
      <p className="text-base opacity-60 mb-8">{config.sub}</p>

      {/* Timer Ring — hero */}
      {secondsLeft > 0 && (
        <div className="relative flex items-center justify-center mb-8">
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
              <div className="flex items-center gap-2">
                <span className="opacity-50">Sound</span>
                <SoundPicker soundType={soundType} onSoundChange={setSoundType} onPreview={preview} />
              </div>
            </div>
            <div className="h-px bg-white/10" />
            <div className="flex flex-col items-center gap-1.5">
              <button onClick={copyShareLink}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-medium transition-all">
                {copied ? "✓ Copied!" : "🔗 Copy share link"}
              </button>
              <p className="text-[11px] text-center opacity-50">
                Anyone with this link opens your exact setup — great for subs and co-teachers.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Buttons — Focus is the primary action */}
      <div className="flex gap-3 mb-5 flex-wrap justify-center">
        <button onClick={handleCalmClick} className="px-6 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-base font-semibold transition-all shadow-lg shadow-sky-500/25 hover:-translate-y-0.5">🔔 Calm</button>
        <button onClick={() => activateMode("focus")} className="px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-base font-semibold transition-all shadow-lg shadow-teal-500/25 hover:-translate-y-0.5">⏱ Focus</button>
        <button onClick={() => activateMode("break")} className="px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-base font-semibold transition-all shadow-lg shadow-amber-500/25 hover:-translate-y-0.5">🌿 Break</button>
      </div>

      {/* Pause / Reset — secondary */}
      {mode !== "idle" && !showCalmCD && (
        <div className="flex gap-3">
          <button onClick={() => setRunning((r) => !r)} className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-all">
            {running ? "⏸ Pause" : "▶ Resume"}
          </button>
          <button onClick={handleReset} className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-all">↺ Reset</button>
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
  const [totalBlocks]                     = useState(3);
  const [currentBlock, setCurrentBlock]   = useState(1);
  const [blockMinutes, setBlockMinutes]   = useState(25);
  const [breakMinutes, setBreakMinutes]   = useState(5);
  const [secondsLeft, setSecondsLeft]     = useState(0);
  const [running, setRunning]             = useState(false);
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
  const totalDurationRef = useRef<number>(0);
  const warningFiredRef  = useRef(false);
  const modeRef          = useRef(mode);
  const blockMinutesRef  = useRef(blockMinutes);
  const breakMinutesRef  = useRef(breakMinutes);
  const currentBlockRef  = useRef(currentBlock);
  const stopEmergencyRef = useRef<(() => void) | null>(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { blockMinutesRef.current = blockMinutes; }, [blockMinutes]);
  useEffect(() => { breakMinutesRef.current = breakMinutes; }, [breakMinutes]);
  useEffect(() => { currentBlockRef.current = currentBlock; }, [currentBlock]);

  const config  = CORPORATE_MODES[mode];
  const nearEnd = secondsLeft > 0 && secondsLeft <= 60 && running;

  const { playEnd, playOneMinuteWarning, playAttention, playTick, playBegin, playFinalBeep, preview, startEmergencyAlarm } = useAudioEngine(muted, soundType);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const triggerFlash = useCallback(() => setFlashTrigger((n) => n + 1), []);

  useTabSnapBack(running, secondsLeft, triggerFlash, playOneMinuteWarning);

  // Final 3-2-1 beeps
  useEffect(() => {
    if (running && secondsLeft >= 1 && secondsLeft <= 3) {
      playFinalBeep(secondsLeft);
    }
  }, [secondsLeft, running, playFinalBeep]);

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    } else if (secondsLeft === 0 && running) {
      setRunning(false); playEnd(); triggerFlash(); warningFiredRef.current = false;
      const m = modeRef.current;
      if (m === "work") {
        if (autoBreak) {
          if (currentBlockRef.current < totalBlocks) activateCorporateMode("recharge");
          else { setCorporateMode("idle"); document.title = "✅ Session Complete — RoomRhythm"; }
        } else {
          setCorporateMode("idle"); document.title = "✅ Focus Complete — RoomRhythm";
        }
      } else if (m === "recharge") {
        setCurrentBlock((b) => { const next = b + 1; currentBlockRef.current = next; return next; });
        activateCorporateMode("work");
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, secondsLeft, autoBreak]);

  useEffect(() => {
    if (!showCalmCD && !showFocusCD)
      document.title = running ? `${formatTime(secondsLeft)} — RoomRhythm` : "RoomRhythm";
  }, [secondsLeft, running, showCalmCD, showFocusCD]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!running) return;
      if (e.key === "ArrowUp")   setSecondsLeft((s) => Math.min(s + 5, 5999));
      if (e.key === "ArrowDown") setSecondsLeft((s) => Math.max(s - 5, 0));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [running]);

  function activateCorporateMode(m: CorporateMode) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    const secs = m === "attention" ? 0 : m === "work" ? blockMinutesRef.current * 60 : breakMinutesRef.current * 60;
    totalDurationRef.current = secs;
    if (m === "recharge") setCurrentRecharge(randomRecharge());
    setCorporateMode(m); setSecondsLeft(secs);
    setRunning(m === "work" || m === "recharge");
  }

  function handleCalmClick() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
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
    setCurrentBlock(1); currentBlockRef.current = 1;
    setCorporateMode("work");
    setSecondsLeft(secs);
    setRunning(true);
  }

  function handleReset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    setRunning(false); setCorporateMode("idle"); setSecondsLeft(0); setCurrentBlock(1);
    setShowCalmCD(false); setShowFocusCD(false);
    document.title = "RoomRhythm";
  }

  function handleEmergencyActivate() { setEmergencyActive(true); stopEmergencyRef.current = startEmergencyAlarm(); }
  function handleEmergencyDeactivate() { setEmergencyActive(false); stopEmergencyRef.current?.(); stopEmergencyRef.current = null; }

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
        <button onClick={() => setShowFeedback(true)} className={CTRL_BTN}>💡 Suggest</button>
        <button onClick={toggleFullscreen} className={CTRL_BTN}>{isFullscreen ? "⊠ Exit Full" : "⛶ Fullscreen"}</button>
        <button onClick={() => setProjector(true)} className={CTRL_BTN}>📽 Projector</button>
        <button onClick={() => setMuted((m) => !m)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border border-white/10 transition-all ${!muted ? "bg-white text-gray-900" : "bg-white/10 hover:bg-white/20"}`}>
          {muted ? "🔇 Muted" : "🔔 Sound On"}
        </button>
      </RoomTopBar>

      {showFeedback && <FeedbackModal profile="corporate" onClose={() => setShowFeedback(false)} />}
      <EmergencyButton onActivate={handleEmergencyActivate} onDeactivate={handleEmergencyDeactivate} />

      {running && <KeyboardHint />}

      <h1 className={`text-4xl font-bold tracking-tight mb-1 pb-1 ${mode === "idle" ? "bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent" : ""}`}>
        {config.emoji} {config.label}
      </h1>
      <p className="text-base opacity-60 mb-6">{config.sub}</p>

      {/* Session phase chip */}
      {(mode === "work" || mode === "recharge") && (
        <div className="mb-4 px-3 py-1 rounded-full bg-teal-500/15 text-teal-200 text-xs font-semibold uppercase tracking-widest">
          Block {currentBlock} of {totalBlocks}
        </div>
      )}

      {secondsLeft > 0 && (
        <div className="relative flex items-center justify-center mb-8">
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
              <div className="flex items-center gap-2">
                <span className="opacity-50">Sound</span>
                <SoundPicker soundType={soundType} onSoundChange={setSoundType} onPreview={preview} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Buttons — Focus is the primary action */}
      <div className="flex gap-3 mb-5 flex-wrap justify-center">
        <button onClick={handleCalmClick} className="px-6 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-500 text-white text-base font-semibold transition-all shadow-lg shadow-sky-500/25 hover:-translate-y-0.5">🔔 Calm</button>
        <button onClick={() => activateCorporateMode("work")} className="px-8 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-500 text-white text-base font-semibold transition-all shadow-lg shadow-teal-500/25 hover:-translate-y-0.5">💼 Focus</button>
        <button onClick={() => activateCorporateMode("recharge")} className="px-6 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-base font-semibold transition-all shadow-lg shadow-amber-500/25 hover:-translate-y-0.5">⚡ Recharge</button>
      </div>

      {mode !== "idle" && !showCalmCD && (
        <div className="flex gap-3">
          <button onClick={() => setRunning((r) => !r)} className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-sm font-medium transition-all">{running ? "⏸ Pause" : "▶ Resume"}</button>
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
    }
  }, []);

  return profile === "selector" ? <ProfileSelector onSelect={setProfile} />
    : profile === "classroom" ? <ClassroomApp onBack={() => setProfile("selector")} shared={shared} />
    : <CorporateApp onBack={() => setProfile("selector")} />;
}
