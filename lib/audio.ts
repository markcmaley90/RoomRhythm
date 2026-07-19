"use client";

// Shared Web Audio sound engine for RoomRhythm — the single source of truth used
// by Classroom, Corporate, and the Testing section runner.

import { useRef, useCallback } from "react";

export type SoundType = "bell" | "chime" | "soft";

export function useAudioEngine(muted: boolean, soundType: SoundType) {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current)
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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

  // Final countdown beep — rises in pitch as time runs out
  const playFinalBeep = useCallback((secondsRemaining: number) => {
    if (muted) return;
    const c = getCtx();
    const freq = secondsRemaining === 1 ? 990 : secondsRemaining === 2 ? 880 : 784;
    playTone(freq, 0.15, 0, 0.5, "sine", c);
  }, [muted, getCtx, playTone]);

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

  return { playEnd, playOneMinuteWarning, playAttention, playTick, playBegin, playFinalBeep, preview, startEmergencyAlarm };
}
