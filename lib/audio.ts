"use client";

// Shared Web Audio sound engine for RoomRhythm — the single source of truth used
// by Classroom, Corporate, and the Testing section runner.

import { useRef, useCallback, useEffect } from "react";

export type SoundType = "bell" | "chime" | "soft";

/**
 * Ambient focus beds — continuous background sound for a working room.
 *
 * Fully synthesized, like every other sound in RoomRhythm. No MP3s, which means
 * nothing to host, no licensing, no load time on school wifi, no gap or seam
 * when a bed loops, and it works with the tab offline. A 45-minute focus block
 * costs zero bytes of network.
 *
 * TIER: `free: true` beds play for everyone. The rest are the Pro anchor per
 * docs/gtm-strategy.md §4 — surfaced but locked, same as the Testing templates.
 */
export type AmbientId = "none" | "rain" | "ocean" | "pad" | "hum";

export const AMBIENT_BEDS: {
  id: AmbientId; label: string; emoji: string; free: boolean; hint: string;
}[] = [
  { id: "none",  label: "Off",        emoji: "🔇", free: true,  hint: "No background sound." },
  { id: "rain",  label: "Soft Rain",  emoji: "🌧", free: true,  hint: "Steady filtered rainfall. The safe default for most rooms." },
  { id: "ocean", label: "Ocean",      emoji: "🌊", free: false, hint: "Slow swells that rise and fall." },
  { id: "pad",   label: "Warm Pad",   emoji: "🎹", free: false, hint: "A quiet sustained chord." },
  { id: "hum",   label: "Deep Hum",   emoji: "🌌", free: false, hint: "Low room tone that masks corridor noise." },
];

export function isAmbientFree(id: AmbientId): boolean {
  return AMBIENT_BEDS.find((b) => b.id === id)?.free === true;
}

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

  // Create/resume the AudioContext. Call from a user gesture (Start/Begin) so
  // later timer-driven sounds are audible under the browser autoplay policy.
  const unlock = useCallback(() => { getCtx(); }, [getCtx]);

  // ── Ambient bed ─────────────────────────────────────────────────────────
  // Runs on the SAME AudioContext as everything else. A second context would
  // drift independently and survive teardown — the bug that made the emergency
  // alarm unstoppable. One context, one set of nodes, always torn down.
  const ambientRef = useRef<{ id: AmbientId; stop: () => void } | null>(null);

  /** 2s of looping brown-ish noise. Brown, not white: gentler at high
   *  frequencies, which is what makes it sit under a room instead of hissing
   *  over it. */
  const noiseBuffer = useCallback((c: AudioContext) => {
    const len = c.sampleRate * 2;
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      d[i] = last * 3.5;
    }
    // Cross-fade the seam so the loop point is inaudible.
    const fade = Math.floor(c.sampleRate * 0.05);
    for (let i = 0; i < fade; i++) {
      const t = i / fade;
      d[i] = d[i] * t + d[len - fade + i] * (1 - t);
    }
    return buf;
  }, []);

  const stopAmbient = useCallback((fade = 1.2) => {
    const cur = ambientRef.current;
    if (!cur) return;
    ambientRef.current = null;
    try { cur.stop(); } catch { /* context already gone */ }
    void fade;
  }, []);

  /** Start (or switch to) an ambient bed. Idempotent for the same id. */
  const startAmbient = useCallback((id: AmbientId) => {
    if (ambientRef.current?.id === id) return;
    stopAmbient();
    if (id === "none" || muted) return;

    const c = getCtx();
    const master = c.createGain();
    master.gain.setValueAtTime(0, c.currentTime);
    master.connect(c.destination);

    const nodes: { stop: () => void }[] = [];
    const target = { rain: 0.075, ocean: 0.085, hum: 0.06, pad: 0.045 }[id] ?? 0.06;

    if (id === "rain" || id === "ocean" || id === "hum") {
      const src = c.createBufferSource();
      src.buffer = noiseBuffer(c);
      src.loop = true;
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = id === "hum" ? 220 : id === "ocean" ? 700 : 1400;
      lp.Q.value = 0.6;
      src.connect(lp); lp.connect(master);
      src.start();
      nodes.push({ stop: () => { try { src.stop(); } catch {} src.disconnect(); lp.disconnect(); } });

      if (id === "ocean") {
        // Slow swell: an LFO opening and closing the filter, ~11s per breath.
        const lfo = c.createOscillator();
        const depth = c.createGain();
        lfo.frequency.value = 0.09;
        depth.gain.value = 380;
        lfo.connect(depth); depth.connect(lp.frequency);
        lfo.start();
        nodes.push({ stop: () => { try { lfo.stop(); } catch {} lfo.disconnect(); depth.disconnect(); } });
      }
    } else if (id === "pad") {
      // Quiet sustained chord, slightly detuned so it breathes rather than beats.
      const lp = c.createBiquadFilter();
      lp.type = "lowpass"; lp.frequency.value = 900;
      lp.connect(master);
      for (const f of [110, 164.81, 220, 329.63]) {
        for (const cents of [-4, 4]) {
          const o = c.createOscillator();
          const g = c.createGain();
          o.type = "sine";
          o.frequency.value = f * Math.pow(2, cents / 1200);
          g.gain.value = 0.25;
          o.connect(g); g.connect(lp);
          o.start();
          nodes.push({ stop: () => { try { o.stop(); } catch {} o.disconnect(); g.disconnect(); } });
        }
      }
      nodes.push({ stop: () => lp.disconnect() });
    }

    // Fade in — an ambient bed that snaps on is startling in a quiet room.
    master.gain.linearRampToValueAtTime(target, c.currentTime + 2.5);

    ambientRef.current = {
      id,
      stop: () => {
        const t = c.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(0.0001, t + 1.2);
        setTimeout(() => {
          nodes.forEach((n) => n.stop());
          master.disconnect();
        }, 1400);
      },
    };
  }, [getCtx, muted, noiseBuffer, stopAmbient]);

  // Muting the room must silence the bed too, and unmuting should not resurrect
  // it behind the teacher's back — the caller re-starts it deliberately.
  useEffect(() => { if (muted) stopAmbient(); }, [muted, stopAmbient]);

  // Never leave a bed playing after the screen is gone.
  useEffect(() => () => stopAmbient(0), [stopAmbient]);

  return { unlock, playEnd, playOneMinuteWarning, playAttention, playTick, playBegin, playFinalBeep, preview, startEmergencyAlarm, startAmbient, stopAmbient };
}
