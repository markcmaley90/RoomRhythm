"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────
type Profile = "selector" | "classroom" | "corporate";
type ClassroomMode = "idle" | "calm" | "focus" | "break";
type CorporateMode = "idle" | "attention" | "work" | "recharge";
type SoundType = "bell" | "chime" | "soft";
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
// AUDIO ENGINE
// ══════════════════════════════════════════════════════════════
function useAudioEngine(muted: boolean, soundType: SoundType) {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current)
      ctxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
    return ctxRef.current;
  }, []);

  const playTone = useCallback((
    freq: number, dur: number, start: number,
    peak: number, type: OscillatorType = "sine", ctx?: AudioContext
  ) => {
    const c = ctx ?? getCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.connect(gain); gain.connect(c.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime + start);
    gain.gain.setValueAtTime(0, c.currentTime + start);
    gain.gain.linearRampToValueAtTime(peak, c.currentTime + start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
    osc.start(c.currentTime + start);
    osc.stop(c.currentTime + start + dur + 0.05);
  }, [getCtx]);

  const playBell = useCallback((ctx?: AudioContext) => {
    const c = ctx ?? getCtx();
    playTone(523, 2.5, 0, 0.6, "sine", c); playTone(659, 1.8, 0, 0.3, "sine", c);
    playTone(784, 1.2, 0, 0.15, "sine", c); playTone(523, 2.5, 0, 0.2, "triangle", c);
    playTone(523, 2.0, 0.6, 0.4, "sine", c); playTone(659, 1.5, 0.6, 0.2, "sine", c);
  }, [getCtx, playTone]);

  const playChime = useCallback((ctx?: AudioContext) => {
    const c = ctx ?? getCtx();
    playTone(880, 1.5, 0, 0.5, "sine", c);
    playTone(1047, 1.5, 0.2, 0.5, "sine", c);
    playTone(1319, 2.0, 0.4, 0.5, "sine", c);
  }, [getCtx, playTone]);

  const playSoft = useCallback((ctx?: AudioContext) => {
    const c = ctx ?? getCtx();
    playTone(440, 1.8, 0, 0.45, "sine", c);
    playTone(440, 1.8, 0, 0.15, "triangle", c);
    playTone(880, 1.0, 0, 0.1, "sine", c);
  }, [getCtx, playTone]);

  const playAttention = useCallback(() => {
    const c = getCtx();
    playTone(349, 0.08, 0, 0.9, "square", c);
    playTone(523, 1.5, 0.05, 0.7, "sine", c);
    playTone(659, 1.2, 0.05, 0.35, "sine", c);
    playTone(784, 0.8, 0.05, 0.2, "sine", c);
  }, [getCtx, playTone]);

  const playTick = useCallback((n: number) => {
    const c = getCtx();
    const freq = n === 1 ? 880 : 660;
    playTone(freq, 0.08, 0, 0.4, "sine", c);
  }, [getCtx, playTone]);

  const playBegin = useCallback(() => {
    const c = getCtx();
    playTone(659, 0.3, 0, 0.5, "sine", c);
    playTone(880, 0.6, 0.25, 0.6, "sine", c);
    playTone(1047, 0.8, 0.5, 0.5, "sine", c);
  }, [getCtx, playTone]);

  const playWarning = useCallback(() => {
    const c = getCtx();
    playTone(660, 0.3, 0, 0.3, "sine", c);
    playTone(660, 0.3, 0.4, 0.3, "sine", c);
  }, [getCtx, playTone]);

  const playEnd = useCallback(() => {
    if (muted) return;
    const c = getCtx();
    if (soundType === "bell") playBell(c);
    if (soundType === "chime") playChime(c);
    if (soundType === "soft") playSoft(c);
  }, [muted, soundType, getCtx, playBell, playChime, playSoft]);

  const playOneMinuteWarning = useCallback(() => {
    if (muted) return;
    playWarning();
  }, [muted, playWarning]);

  const preview = useCallback((type: SoundType) => {
    const c = getCtx();
    if (type === "bell") playBell(c);
    if (type === "chime") playChime(c);
    if (type === "soft") playSoft(c);
  }, [getCtx, playBell, playChime, playSoft]);

  const startEmergencyAlarm = useCallback(() => {
    const c = getCtx();
    let level = 0;
    let stopped = false;
    let timeoutId: NodeJS.Timeout;
    function pulse() {
      if (stopped) return;
      level = Math.min(level + 1, 5);
      const vol = 0.15 + level * 0.15;
      const freq = 220 + level * 40;
      playTone(freq, 0.25, 0, vol, "sawtooth", c);
      playTone(freq * 1.5, 0.2, 0.1, vol * 0.6, "sine", c);
      playTone(freq, 0.25, 0.4, vol, "sawtooth", c);
      playTone(freq * 1.5, 0.2, 0.5, vol * 0.6, "sine", c);
      timeoutId = setTimeout(pulse, Math.max(800 - level * 80, 500));
    }
    pulse();
    return () => { stopped = true; clearTimeout(timeoutId); };
  }, [getCtx, playTone]);

  return { playEnd, playOneMinuteWarning, playAttention, playTick, playBegin, preview, startEmergencyAlarm };
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

  useEffect(() => { setTimeout(() => setMounted(true), 30); }, []);

  useEffect(() => {
    if (phase === "countdown" && count > 0) {
      if (!muted) playTick(count);
      const t = setTimeout(() => setCount((c) => c - 1), 1000);
      return () => clearTimeout(t);
    }
    if (phase === "countdown" && count === 0) {
      setPhase("begin");
      if (!muted) playBegin();
      const t = setTimeout(() => onComplete(), 1200);
      return () => clearTimeout(t);
    }
  }, [count, phase]);

  const progress = startFrom > 0 ? 1 - count / startFrom : 1;

  // Interpolate between two hsl colors
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
// Browsers block window.focus() — best we can do is aggressive
// title flashing + sound to pull attention back at 1-min mark.
// ══════════════════════════════════════════════════════════════
function useTabSnapBack(running: boolean, secondsLeft: number, onReturnFlash: () => void, playWarning: () => void) {
  const wasHiddenRef  = useRef(false);
  const flashTitleRef = useRef<NodeJS.Timeout | null>(null);
  const originalTitle = useRef(document.title);

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        wasHiddenRef.current = running;
      } else {
        if (wasHiddenRef.current && running) onReturnFlash();
        wasHiddenRef.current = false;
        // Restore title immediately on return
        if (flashTitleRef.current) {
          clearInterval(flashTitleRef.current);
          flashTitleRef.current = null;
        }
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [running, onReturnFlash]);

  // Aggressive title flash + sound at 1 min if tab is hidden
  useEffect(() => {
    if (running && secondsLeft === 60) {
      playWarning();
      if (document.hidden) {
        let tick = 0;
        originalTitle.current = document.title;
        if (flashTitleRef.current) clearInterval(flashTitleRef.current);
        flashTitleRef.current = setInterval(() => {
          document.title = tick % 2 === 0 ? "⚠️ 1 MIN LEFT — RoomRhythm" : "🔴 TIMER ENDING SOON";
          tick++;
          if (tick > 20) {
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
function ProjectorView({ secondsLeft, label, emoji, nearEnd, totalDuration, onExit }: {
  secondsLeft: number; label: string; emoji: string;
  nearEnd: boolean; totalDuration: number; onExit: () => void;
}) {
  const r = 140, circ = 2 * Math.PI * r;
  const progress = totalDuration > 0 ? (totalDuration - secondsLeft) / totalDuration : 0;
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center z-50 bg-gray-950">
      <button onClick={onExit} className="absolute top-6 right-6 text-white/30 hover:text-white/70 text-sm">✕ Exit Projector</button>
      <p className="text-white/40 text-2xl font-medium mb-6 tracking-widest uppercase">{emoji} {label}</p>
      <div className="relative flex items-center justify-center">
        <svg width="340" height="340" className="absolute">
          <circle cx="170" cy="170" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle cx="170" cy="170" r={r} fill="none"
            stroke={nearEnd ? "#f87171" : "#818cf8"} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
            transform="rotate(-90 170 170)" className="transition-all duration-1000" />
        </svg>
        <div className={`text-[9rem] font-mono font-bold tracking-tight ${nearEnd ? "text-red-300 animate-pulse" : "text-white"}`}>
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
// KEYBOARD HINT — shows ↑+5s / ↓-5s beside timer
// ══════════════════════════════════════════════════════════════
function KeyboardHint() {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-32 pointer-events-none select-none"
      style={{ top: "50%", transform: "translate(-50%, -50%)" }}>
      <div className="flex flex-col items-center gap-1 opacity-25">
        <span className="text-2xl">↑</span>
        <span className="text-xs font-medium tracking-wide">+5s</span>
      </div>
      <div className="flex flex-col items-center gap-1 opacity-25">
        <span className="text-2xl">↓</span>
        <span className="text-xs font-medium tracking-wide">−5s</span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PROFILE SELECTOR
// ══════════════════════════════════════════════════════════════
function ProfileSelector({ onSelect }: { onSelect: (p: "classroom" | "corporate") => void }) {
  const [showFeedback, setShowFeedback] = useState(false);
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold tracking-tight mb-3 pb-2 bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
          RoomRhythm
        </h1>
        <p className="text-xl text-white/70 font-medium mb-2">Less noise. More learning.</p>
        <p className="text-gray-400 text-sm mb-1">Pomodoro-style focus blocks for classrooms and teams.</p>
        <p className="text-gray-500 text-sm">Choose your room type to get started</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-xl">
        <button onClick={() => onSelect("classroom")}
          className="flex-1 flex flex-col items-center gap-4 p-8 rounded-3xl bg-indigo-900 hover:bg-indigo-800 text-white transition-all shadow-xl hover:scale-105">
          <span className="text-6xl">🏫</span>
          <span className="text-2xl font-bold">Classroom</span>
          <span className="text-indigo-300 text-sm text-center">K-12 Teachers & University instructors. Grade-banded focus blocks and brain breaks.</span>
        </button>
        <button onClick={() => onSelect("corporate")}
          className="flex-1 flex flex-col items-center gap-4 p-8 rounded-3xl bg-slate-800 hover:bg-slate-700 text-white transition-all shadow-xl hover:scale-105">
          <span className="text-6xl">🏢</span>
          <span className="text-2xl font-bold">Corporate</span>
          <span className="text-slate-300 text-sm text-center">Trainers & facilitators. Custom instruction blocks, flexible timing, full control.</span>
        </button>
      </div>
      <button onClick={() => setShowFeedback(true)}
        className="mt-4 px-5 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all">
        💡 Suggest a Feature
      </button>
      {showFeedback && <FeedbackModal profile="selector" onClose={() => setShowFeedback(false)} />}
    </div>
  );
}

function FeedbackModal({ profile, onClose }: { profile: string; onClose: () => void }) {
  const [text, setText] = useState(""); const [submitted, setSubmitted] = useState(false); const [loading, setLoading] = useState(false);
  async function handleSubmit() {
    if (!text.trim()) return; setLoading(true);
    await fetch("https://formspree.io/f/YOUR_FORM_ID", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: text, profile }) });
    setLoading(false); setSubmitted(true); setTimeout(onClose, 2000);
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
function ClassroomApp({ onBack }: { onBack: () => void }) {
  const [showFeedback, setShowFeedback]     = useState(false);
  const [mode, setMode]                     = useState<ClassroomMode>("idle");
  const [bandIndex, setBandIndex]           = useState(2);
  const [customMinutes, setCustomMinutes]   = useState(GRADE_BANDS[2].defaultMin);
  const [secondsLeft, setSecondsLeft]       = useState(0);
  const [running, setRunning]               = useState(false);
  const [muted, setMuted]                   = useState(false);
  const [soundType, setSoundType]           = useState<SoundType>("chime");
  const [currentBreak, setCurrentBreak]     = useState(BRAIN_BREAKS[0]);
  const [flashTrigger, setFlashTrigger]     = useState(0);
  const [projector, setProjector]           = useState(false);
  const [showCalmCD, setShowCalmCD]         = useState(false);
  const [showFocusCD, setShowFocusCD]       = useState(false);
  const [calmDuration, setCalmDuration]     = useState(3);
  const [autoBreak, setAutoBreak]           = useState(true);
  const [emergencyActive, setEmergencyActive] = useState(false);

  const intervalRef      = useRef<NodeJS.Timeout | null>(null);
  const totalDurationRef = useRef<number>(0);
  const warningFiredRef  = useRef(false);
  const modeRef          = useRef(mode);
  const bandIndexRef     = useRef(bandIndex);
  const stopEmergencyRef = useRef<(() => void) | null>(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { bandIndexRef.current = bandIndex; }, [bandIndex]);

  const band    = GRADE_BANDS[bandIndex];
  const config  = CLASSROOM_MODES[mode];
  const nearEnd = secondsLeft > 0 && secondsLeft <= 60 && running;

  const { playEnd, playOneMinuteWarning, playAttention, playTick, playBegin, preview, startEmergencyAlarm } = useAudioEngine(muted, soundType);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const triggerFlash = useCallback(() => setFlashTrigger((n) => n + 1), []);

  useTabSnapBack(running, secondsLeft, triggerFlash, playOneMinuteWarning);

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
    document.title = running ? `${formatTime(secondsLeft)} — RoomRhythm` : "RoomRhythm";
  }, [secondsLeft, running]);

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

  function handleCalmClick() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    setRunning(false); setMode("calm"); setSecondsLeft(0);
    if (!muted) playAttention();
    setShowCalmCD(true);
  }

  function handleCalmComplete() {
    setShowCalmCD(false);
    setShowFocusCD(true);
  }

  function handleFocusCountdownComplete() {
    setShowFocusCD(false);
    activateMode("focus");
  }

  function activateMode(m: ClassroomMode) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    const secs = m === "calm" ? 0 : m === "focus" ? customMinutes * 60 : band.breakMin * 60;
    totalDurationRef.current = secs;
    setMode(m); setSecondsLeft(secs);
    setRunning(m === "focus" || m === "break");
  }

  function handleReset() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
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

  if (projector) return <ProjectorView secondsLeft={secondsLeft} label={config.label} emoji={config.emoji} nearEnd={nearEnd} totalDuration={totalDurationRef.current} onExit={() => setProjector(false)} />;

  return (
    <div className={`min-h-screen ${config.bg} ${config.text} flex flex-col items-center justify-center transition-colors duration-700 p-6 relative ${emergencyActive ? "ring-8 ring-inset ring-red-500/60" : ""}`}>

      {showCalmCD && (
        <CountdownOverlay startFrom={calmDuration} onComplete={handleCalmComplete}
          playTick={playTick} playBegin={playBegin} muted={muted}
          fromColor="hsl(38, 92%, 18%)" toColor="hsl(230, 68%, 20%)"
          label="Settle in. Eyes forward." beginLabel="Let's focus." />
      )}
      {showFocusCD && (
        <CountdownOverlay startFrom={3} onComplete={handleFocusCountdownComplete}
          playTick={playTick} playBegin={playBegin} muted={muted}
          fromColor="hsl(230, 68%, 18%)" toColor="hsl(238, 68%, 22%)"
          label="Focus time starting." beginLabel="Go!" />
      )}

      <ScreenFlash trigger={flashTrigger} />

      {/* Top Bar */}
      <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-10">
        <button onClick={onBack} className="text-sm opacity-50 hover:opacity-100 transition-opacity">← Change Room</button>
        <div className="flex gap-2 items-center flex-wrap justify-end">
          <button onClick={() => setShowFeedback(true)} className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 transition-all">💡 Suggest a Feature</button>
          <button onClick={toggleFullscreen} className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 transition-all">{isFullscreen ? "⊠ Exit Full" : "⛶ Fullscreen"}</button>
          <button onClick={() => setProjector(true)} className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 transition-all">📽 Projector</button>
          <button onClick={() => setMuted((m) => !m)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!muted ? "bg-white text-gray-900" : "bg-white/20 hover:bg-white/30"}`}>
            {muted ? "🔇 Muted" : "🔔 Sound On"}
          </button>
        </div>
      </div>

      {showFeedback && <FeedbackModal profile="classroom" onClose={() => setShowFeedback(false)} />}
      <EmergencyButton onActivate={handleEmergencyActivate} onDeactivate={handleEmergencyDeactivate} />

      {/* Settings row — idle only */}
      {mode === "idle" && (
        <div className="absolute top-20 right-5 flex items-center gap-3 text-xs opacity-40 hover:opacity-80 transition-opacity z-10 flex-wrap justify-end max-w-sm">
          <span>Calm:</span>
          <button onClick={() => setCalmDuration(3)} className={`px-2 py-1 rounded-lg transition-all ${calmDuration === 3 ? "bg-white/20" : "hover:bg-white/10"}`}>3s</button>
          <button onClick={() => setCalmDuration(5)} className={`px-2 py-1 rounded-lg transition-all ${calmDuration === 5 ? "bg-white/20" : "hover:bg-white/10"}`}>5s</button>
          <span className="ml-1">Auto-break:</span>
          <button onClick={() => setAutoBreak((v) => !v)}
            className={`px-3 py-1 rounded-full font-semibold transition-all ${autoBreak ? "bg-emerald-500/40 text-emerald-200 opacity-100" : "bg-white/10"}`}>
            {autoBreak ? "On" : "Off"}
          </button>
          <span className="ml-1">Sound:</span>
          <SoundPicker soundType={soundType} onSoundChange={setSoundType} onPreview={preview} />
        </div>
      )}

      {/* Keyboard hint overlay when running */}
      {running && <KeyboardHint />}

      {/* Mode Label */}
      <h1 className={`text-5xl font-bold tracking-tight mb-2 pb-1 ${mode === "idle" ? "bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent" : ""}`}>
        {config.emoji} {config.label}
      </h1>
      <p className="text-xl opacity-70 mb-8">{config.sub}</p>

      {/* Timer Ring */}
      {secondsLeft > 0 && (
        <div className="relative flex items-center justify-center mb-8">
          <svg width="220" height="220" className="absolute">
            <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <circle cx="110" cy="110" r="100" fill="none"
              stroke={nearEnd ? "#f87171" : mode === "break" ? "#34d399" : "#818cf8"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 100}`}
              strokeDashoffset={`${2 * Math.PI * 100 * (1 - (totalDurationRef.current > 0 ? (totalDurationRef.current - secondsLeft) / totalDurationRef.current : 0))}`}
              transform="rotate(-90 110 110)" className="transition-all duration-1000" />
          </svg>
          <div className={`text-7xl font-mono font-bold transition-all duration-300 ${nearEnd ? "text-red-300 animate-pulse" : ""}`}>
            {formatTime(secondsLeft)}
          </div>
        </div>
      )}

      {/* Brain Break */}
      {mode === "break" && (
        <div className="mb-8 px-6 py-4 bg-white/10 rounded-2xl text-center max-w-sm">
          <p className="text-xs uppercase tracking-widest opacity-60 mb-1">{currentBreak.type}</p>
          <p className="text-lg font-medium">{currentBreak.text}</p>
        </div>
      )}

      {/* Idle Controls */}
      {mode === "idle" && (
        <div className="flex flex-col items-center gap-6 w-full max-w-md mb-6">
          <div className="grid grid-cols-4 gap-3 w-full">
            {GRADE_BANDS.map((b, i) => (
              <button key={b.label} onClick={() => selectBand(i)}
                className={`flex flex-col items-center justify-center gap-1 py-4 rounded-2xl text-sm font-medium transition-all ${
                  bandIndex === i ? "bg-white text-gray-900 shadow-lg scale-105" : "bg-white/15 hover:bg-white/25"
                }`}>
                <span className="text-sm font-bold leading-tight">{b.label}</span>
                <span className={`text-xs leading-tight ${bandIndex === i ? "text-gray-500" : "opacity-60"}`}>{b.sub}</span>
                <span className={`text-xs leading-tight ${bandIndex === i ? "text-gray-400" : "opacity-40"}`}>{b.defaultMin}m</span>
              </button>
            ))}
          </div>
          <div className="w-full bg-white/10 rounded-2xl p-4">
            <p className="text-xs text-center mb-3">
              <span className="text-white/70 italic">Focus duration pre-sets are grounded in classroom attention span research</span>
              <span className="text-indigo-400 font-semibold"> — FULLY ADJUSTABLE</span>
            </p>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm opacity-60 uppercase tracking-widest">Focus Duration</p>
              <p className="font-bold">{customMinutes} min</p>
            </div>
            <input type="range" min={band.sliderMin} max={band.sliderMax} step={1} value={customMinutes}
              onChange={(e) => setCustomMinutes(Number(e.target.value))} className="w-full accent-white" />
            <div className="flex justify-between text-xs opacity-40 mt-1"><span>{band.sliderMin}m</span><span>{band.sliderMax}m</span></div>
          </div>
        </div>
      )}

      {/* Main Buttons */}
      <div className="flex gap-4 mb-5 flex-wrap justify-center">
        <button onClick={handleCalmClick} className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white text-lg font-semibold transition-all shadow-lg">🔔 Calm</button>
        <button onClick={() => { setShowFocusCD(true); setMode("focus"); }} className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-semibold transition-all shadow-lg">⏱ Focus</button>
        <button onClick={() => activateMode("break")} className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-semibold transition-all shadow-lg">🌿 Break</button>
      </div>

      {/* Pause / Reset */}
      {mode !== "idle" && !showCalmCD && !showFocusCD && (
        <div className="flex gap-3">
          <button onClick={() => setRunning((r) => !r)} className="px-5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium transition-all">
            {running ? "⏸ Pause" : "▶ Resume"}
          </button>
          <button onClick={handleReset} className="px-5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium transition-all">↺ Reset</button>
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
  const [totalBlocks, setTotalBlocks]     = useState(3);
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
  const [calmDuration, setCalmDuration]   = useState(3);
  const [autoBreak, setAutoBreak]         = useState(true);
  const [emergencyActive, setEmergencyActive] = useState(false);

  const intervalRef      = useRef<NodeJS.Timeout | null>(null);
  const totalDurationRef = useRef<number>(0);
  const warningFiredRef  = useRef(false);
  const modeRef          = useRef(mode);
  const stopEmergencyRef = useRef<(() => void) | null>(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);

  const config  = CORPORATE_MODES[mode];
  const nearEnd = secondsLeft > 0 && secondsLeft <= 60 && running;

  const { playEnd, playOneMinuteWarning, playAttention, playTick, playBegin, preview, startEmergencyAlarm } = useAudioEngine(muted, soundType);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const triggerFlash = useCallback(() => setFlashTrigger((n) => n + 1), []);

  useTabSnapBack(running, secondsLeft, triggerFlash, playOneMinuteWarning);

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    } else if (secondsLeft === 0 && running) {
      setRunning(false); playEnd(); triggerFlash(); warningFiredRef.current = false;
      const m = modeRef.current;
      if (m === "work") {
        if (autoBreak) {
          if (currentBlock < totalBlocks) activateCorporateMode("recharge");
          else { setCorporateMode("idle"); document.title = "✅ Session Complete — RoomRhythm"; }
        } else {
          setCorporateMode("idle"); document.title = "✅ Focus Complete — RoomRhythm";
        }
      } else if (m === "recharge") {
        setCurrentBlock((b) => b + 1); activateCorporateMode("work");
      }
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, secondsLeft, autoBreak, currentBlock, totalBlocks]);

  useEffect(() => {
    document.title = running ? `${formatTime(secondsLeft)} — RoomRhythm` : "RoomRhythm";
  }, [secondsLeft, running]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!running) return;
      if (e.key === "ArrowUp")   setSecondsLeft((s) => Math.min(s + 5, 5999));
      if (e.key === "ArrowDown") setSecondsLeft((s) => Math.max(s - 5, 0));
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [running]);

  function handleCalmClick() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    setRunning(false); setCorporateMode("attention"); setSecondsLeft(0);
    if (!muted) playAttention();
    setShowCalmCD(true);
  }

  function handleCalmComplete() { setShowCalmCD(false); setShowFocusCD(true); }

  function handleFocusCountdownComplete() {
    setShowFocusCD(false); setCurrentBlock(1); activateCorporateMode("work");
  }

  function activateCorporateMode(m: CorporateMode) {
    if (intervalRef.current) clearInterval(intervalRef.current);
    warningFiredRef.current = false;
    const secs = m === "attention" ? 0 : m === "work" ? blockMinutes * 60 : breakMinutes * 60;
    totalDurationRef.current = secs;
    setCorporateMode(m); setSecondsLeft(secs);
    setRunning(m === "work" || m === "recharge");
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

  if (projector) return <ProjectorView secondsLeft={secondsLeft} label={config.label} emoji={config.emoji} nearEnd={nearEnd} totalDuration={totalDurationRef.current} onExit={() => setProjector(false)} />;

  return (
    <div className={`min-h-screen ${config.bg} ${config.text} flex flex-col items-center justify-center transition-colors duration-700 p-6 relative ${emergencyActive ? "ring-8 ring-inset ring-red-500/60" : ""}`}>

      {showCalmCD && (
        <CountdownOverlay startFrom={calmDuration} onComplete={handleCalmComplete}
          playTick={playTick} playBegin={playBegin} muted={muted}
          fromColor="hsl(38, 92%, 18%)" toColor="hsl(230, 68%, 20%)"
          label="Take a breath. Settle in." beginLabel="Let's focus." />
      )}
      {showFocusCD && (
        <CountdownOverlay startFrom={3} onComplete={handleFocusCountdownComplete}
          playTick={playTick} playBegin={playBegin} muted={muted}
          fromColor="hsl(230, 68%, 18%)" toColor="hsl(238, 68%, 22%)"
          label="Work block starting." beginLabel="Go!" />
      )}

      <ScreenFlash trigger={flashTrigger} />

      <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-10">
        <button onClick={onBack} className="text-sm opacity-50 hover:opacity-100 transition-opacity">← Change Room</button>
        <div className="flex gap-2 items-center flex-wrap justify-end">
          <button onClick={() => setShowFeedback(true)} className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 transition-all">💡 Suggest a Feature</button>
          <button onClick={toggleFullscreen} className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 transition-all">{isFullscreen ? "⊠ Exit Full" : "⛶ Fullscreen"}</button>
          <button onClick={() => setProjector(true)} className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 transition-all">📽 Projector</button>
          <button onClick={() => setMuted((m) => !m)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${!muted ? "bg-white text-gray-900" : "bg-white/20 hover:bg-white/30"}`}>
            {muted ? "🔇 Muted" : "🔔 Sound On"}
          </button>
        </div>
      </div>

      {showFeedback && <FeedbackModal profile="corporate" onClose={() => setShowFeedback(false)} />}
      <EmergencyButton onActivate={handleEmergencyActivate} onDeactivate={handleEmergencyDeactivate} />

      {mode === "idle" && (
        <div className="absolute top-20 right-5 flex items-center gap-3 text-xs opacity-40 hover:opacity-80 transition-opacity z-10 flex-wrap justify-end max-w-sm">
          <span>Calm:</span>
          <button onClick={() => setCalmDuration(3)} className={`px-2 py-1 rounded-lg transition-all ${calmDuration === 3 ? "bg-white/20" : "hover:bg-white/10"}`}>3s</button>
          <button onClick={() => setCalmDuration(5)} className={`px-2 py-1 rounded-lg transition-all ${calmDuration === 5 ? "bg-white/20" : "hover:bg-white/10"}`}>5s</button>
          <span className="ml-1">Auto-break:</span>
          <button onClick={() => setAutoBreak((v) => !v)}
            className={`px-3 py-1 rounded-full font-semibold transition-all ${autoBreak ? "bg-emerald-500/40 text-emerald-200 opacity-100" : "bg-white/10"}`}>
            {autoBreak ? "On" : "Off"}
          </button>
          <span className="ml-1">Sound:</span>
          <SoundPicker soundType={soundType} onSoundChange={setSoundType} onPreview={preview} />
        </div>
      )}

      {running && <KeyboardHint />}

      <h1 className={`text-5xl font-bold tracking-tight mb-2 pb-1 ${mode === "idle" ? "bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent" : ""}`}>
        {config.emoji} {config.label}
      </h1>
      <p className="text-xl opacity-70 mb-8">{config.sub}</p>

      {secondsLeft > 0 && (
        <div className="relative flex items-center justify-center mb-8">
          <svg width="220" height="220" className="absolute">
            <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <circle cx="110" cy="110" r="100" fill="none"
              stroke={nearEnd ? "#f87171" : mode === "recharge" ? "#34d399" : "#818cf8"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 100}`}
              strokeDashoffset={`${2 * Math.PI * 100 * (1 - (totalDurationRef.current > 0 ? (totalDurationRef.current - secondsLeft) / totalDurationRef.current : 0))}`}
              transform="rotate(-90 110 110)" className="transition-all duration-1000" />
          </svg>
          <div className={`text-7xl font-mono font-bold transition-all duration-300 ${nearEnd ? "text-red-300 animate-pulse" : ""}`}>
            {formatTime(secondsLeft)}
          </div>
        </div>
      )}

      {mode === "idle" && (
        <div className="flex flex-col gap-4 mb-8 w-full max-w-sm">
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs opacity-60 uppercase tracking-widest">Focus Duration</p>
              <p className="font-bold">{blockMinutes} min</p>
            </div>
            <input type="range" min={10} max={60} step={5} value={blockMinutes}
              onChange={(e) => setBlockMinutes(Number(e.target.value))} className="w-full accent-white" />
            <div className="flex justify-between text-xs opacity-40 mt-1"><span>10m</span><span>60m</span></div>
          </div>
          <div className="bg-white/10 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <p className="text-xs opacity-60 uppercase tracking-widest">Break Duration</p>
              <p className="font-bold">{breakMinutes} min</p>
            </div>
            <input type="range" min={5} max={30} step={5} value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))} className="w-full accent-white" />
            <div className="flex justify-between text-xs opacity-40 mt-1"><span>5m</span><span>30m</span></div>
          </div>
        </div>
      )}

      <div className="flex gap-4 mb-5 flex-wrap justify-center">
        <button onClick={handleCalmClick} className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-white text-lg font-semibold transition-all shadow-lg">🌿 Calm</button>
        <button onClick={() => { setCorporateMode("work"); setShowFocusCD(true); }} className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-semibold transition-all shadow-lg">💼 Focus</button>
        <button onClick={() => activateCorporateMode("recharge")} className="px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-lg font-semibold transition-all shadow-lg">⚡ Recharge</button>
      </div>

      {mode !== "idle" && !showCalmCD && !showFocusCD && (
        <div className="flex gap-3">
          <button onClick={() => setRunning((r) => !r)} className="px-5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium">{running ? "⏸ Pause" : "▶ Resume"}</button>
          <button onClick={handleReset} className="px-5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-sm font-medium">↺ Reset</button>
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
  return profile === "selector" ? <ProfileSelector onSelect={setProfile} />
    : profile === "classroom" ? <ClassroomApp onBack={() => setProfile("selector")} />
    : <CorporateApp onBack={() => setProfile("selector")} />;
}
