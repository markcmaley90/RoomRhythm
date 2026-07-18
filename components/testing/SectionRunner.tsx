"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { TestTemplate, Segment } from "@/lib/testing/schema";
import { segmentDurationFor } from "@/lib/testing/schema";
import { remainingSeconds, warningKey, warningsToFire } from "@/lib/testing/runner";
import { formatClock } from "@/lib/testing/format";
import { useAudioEngine } from "@/lib/audio";
import AdminLog, { type AdminEvent } from "@/components/testing/AdminLog";
import TrademarkDisclaimer from "@/components/TrademarkDisclaimer";

type Phase = "setup" | "pre" | "active" | "held" | "done";

function stamp(): string {
  return new Date().toLocaleTimeString([], { hour12: false });
}

export default function SectionRunner({ template }: { template: TestTemplate }) {
  const segments = template.segments;
  const standard =
    template.accommodationLanes.find((l) => l.timeMultiplier === 1) ?? template.accommodationLanes[0];

  const [phase, setPhase] = useState<Phase>("setup");
  const [segIndex, setSegIndex] = useState(0);
  const [activeLaneIds, setActiveLaneIds] = useState<string[]>([standard.id]);
  const [deadlines, setDeadlines] = useState<Record<string, number>>({});
  const [pausedRemaining, setPausedRemaining] = useState<Record<string, number> | null>(null);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(0);
  const [banner, setBanner] = useState<{ label: string; at: number } | null>(null);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [muted, setMuted] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<
    | { kind: "advance" | "end"; segLabel: string; isBreak: boolean; lanes: { label: string; remaining: number }[] }
    | { kind: "adjust"; deltaSecs: number; lanes: { label: string; remaining: number }[] }
    | null
  >(null);

  const firedRef = useRef<Set<string>>(new Set());
  const eventIdRef = useRef(1);

  const audio = useAudioEngine(muted, "chime");

  const seg = segments[segIndex] as Segment | undefined;
  const laneById = (id: string) => template.accommodationLanes.find((l) => l.id === id);

  function log(kind: AdminEvent["kind"], message: string) {
    setEvents((evs) => [...evs, { id: eventIdRef.current++, atLabel: stamp(), kind, message }]);
  }

  // ── Tick: one interval drives re-render; the clock is derived, never accumulated ──
  useEffect(() => {
    if (phase !== "active" || paused || confirmDialog) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [phase, paused, confirmDialog]);

  // ── Detection: warnings (unscaled, per lane) + all-lanes-zero → advance ──
  useEffect(() => {
    if (phase !== "active" || paused || confirmDialog || !seg) return;
    let allZero = true;
    const fired: { label: string; sound: boolean }[] = [];
    for (const laneId of activeLaneIds) {
      const dl = deadlines[laneId];
      if (dl == null) continue;
      const remaining = remainingSeconds(dl, now);
      if (remaining > 0) allZero = false;
      for (const w of warningsToFire(seg, laneId, remaining, firedRef.current)) {
        firedRef.current.add(warningKey(seg.id, laneId, w.offsetSeconds));
        log("warning", `${w.label} — ${laneById(laneId)?.label ?? laneId}`);
        fired.push({ label: w.label, sound: !!w.sound });
      }
    }
    if (fired.length) {
      setBanner({ label: fired[fired.length - 1].label, at: now });
      if (fired.some((f) => f.sound)) audio.playOneMinuteWarning();
    }
    if (allZero) {
      // POLICY: no segment self-advances past zero — every transition requires an
      // explicit proctor action. All segments hold here; the proctor advances
      // (unguarded) from this gated hold. 'advance: auto' has no distinct runtime
      // behavior under this policy — see resolveAdvance() in lib/testing/runner.ts.
      audio.playEnd();
      setPhase("held");
      log("segment", `${seg.label} reached zero — awaiting proctor`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [now]);

  function goNext() {
    setBanner(null);
    if (segIndex < segments.length - 1) {
      const nextIdx = segIndex + 1;
      setSegIndex(nextIdx);
      setPhase("pre");
      log("advance", `Advanced to ${segments[nextIdx].label}`);
    } else {
      setPhase("done");
      log("segment", "Session complete");
    }
  }

  function startSession() {
    setSegIndex(0);
    firedRef.current = new Set();
    setEvents([]);
    eventIdRef.current = 1;
    setPhase("pre");
    log("segment", `Administration started — ${activeLaneIds.map((id) => laneById(id)?.label).join(", ")}`);
  }

  function beginSegment(idx: number) {
    const s = segments[idx];
    const t0 = Date.now();
    const dls: Record<string, number> = {};
    for (const laneId of activeLaneIds) {
      const lane = laneById(laneId);
      if (lane) dls[laneId] = t0 + segmentDurationFor(s, lane) * 1000;
    }
    setDeadlines(dls);
    setPausedRemaining(null);
    setPaused(false);
    setBanner(null);
    setNow(t0);
    setPhase("active");
    log("segment", `Started ${s.label}`);
  }

  function continueUntimed(idx: number) {
    log("segment", `Administered ${segments[idx].label}`);
    goNext();
  }

  function pause() {
    if (phase !== "active" || paused) return;
    const pr: Record<string, number> = {};
    for (const laneId of activeLaneIds) pr[laneId] = Math.max(0, deadlines[laneId] - Date.now());
    setPausedRemaining(pr);
    setPaused(true);
    log("pause", "Paused");
  }

  function resume() {
    if (!paused || !pausedRemaining) return;
    const t0 = Date.now();
    const dls: Record<string, number> = {};
    for (const laneId of activeLaneIds) dls[laneId] = t0 + (pausedRemaining[laneId] ?? 0);
    setDeadlines(dls);
    setPausedRemaining(null);
    setPaused(false);
    setNow(t0);
    log("resume", "Resumed");
  }

  // What each active lane's remaining WOULD be after a delta (clamped at 0).
  function wouldBeAfter(deltaSecs: number): { id: string; label: string; remaining: number }[] {
    const nowMs = Date.now();
    return activeLaneIds.map((id) => {
      let remaining: number;
      if (paused && pausedRemaining) {
        remaining = Math.max(0, Math.round(((pausedRemaining[id] ?? 0) + deltaSecs * 1000) / 1000));
      } else {
        const cur = deadlines[id] ?? nowMs;
        remaining = remainingSeconds(Math.max(nowMs, cur + deltaSecs * 1000), nowMs);
      }
      return { id, label: laneById(id)?.label ?? id, remaining };
    });
  }

  // Removing time is guarded when it would zero any active lane; adding is not.
  function requestAdjust(deltaSecs: number) {
    if (deltaSecs >= 0) {
      applyAdjust(deltaSecs);
      return;
    }
    const lanes = wouldBeAfter(deltaSecs);
    if (lanes.some((l) => l.remaining <= 0)) {
      setConfirmDialog({ kind: "adjust", deltaSecs, lanes: lanes.map(({ label, remaining }) => ({ label, remaining })) });
    } else {
      applyAdjust(deltaSecs);
    }
  }

  function applyAdjust(deltaSecs: number) {
    const nowMs = Date.now();
    const after = wouldBeAfter(deltaSecs); // clamped remaining per active lane
    if (paused && pausedRemaining) {
      const pr = { ...pausedRemaining };
      for (const a of after) pr[a.id] = a.remaining * 1000;
      setPausedRemaining(pr);
    } else {
      const dls = { ...deadlines };
      for (const a of after) dls[a.id] = nowMs + a.remaining * 1000;
      setDeadlines(dls);
    }
    setNow(nowMs);
    const sign = deltaSecs >= 0 ? "+" : "−";
    const detail = after.map((a) => `${a.label} ${formatClock(a.remaining)}`).join(", ");
    log("adjust", `${sign}${Math.abs(Math.round(deltaSecs / 60))}m — ${detail} remaining`);
    // A lane zeroed by the adjustment is handled by the tick effect exactly like a
    // natural zero: all-lanes-zero → gated hold; a single zeroed lane just shows 0:00.
  }

  function endTest() {
    setPhase("done");
    setBanner(null);
    log("segment", "Ended by proctor");
  }

  const laneRemainings = () =>
    activeLaneIds.map((id) => ({ label: laneById(id)?.label ?? id, remaining: remainingFor(id) }));

  // Every early advance is guarded when any lane still has time; if all lanes are
  // already at zero there is nothing to protect, so advance with no dialog.
  function requestAdvance() {
    if (!seg) return;
    const lanes = laneRemainings();
    if (!lanes.some((l) => l.remaining > 0)) {
      goNext();
      return;
    }
    setConfirmDialog({ kind: "advance", segLabel: seg.label, isBreak: seg.kind === "break", lanes });
  }

  function requestEnd() {
    // Ending the whole administration always confirms, regardless of clocks.
    setConfirmDialog({ kind: "end", segLabel: seg?.label ?? "", isBreak: false, lanes: laneRemainings() });
  }

  function confirmProceed() {
    if (!confirmDialog) return;
    if (confirmDialog.kind === "end") {
      setConfirmDialog(null);
      endTest();
      return;
    }
    if (confirmDialog.kind === "adjust") {
      const d = confirmDialog.deltaSecs;
      setConfirmDialog(null);
      applyAdjust(d);
      return;
    }
    // Log remaining at the actual moment of the confirmed early advance.
    const detail = laneRemainings()
      .map((l) => `${l.label} ${formatClock(l.remaining)}`)
      .join(", ");
    log("advance", `Ended ${confirmDialog.segLabel} early — ${detail} remaining`);
    setConfirmDialog(null);
    goNext();
  }

  function toggleLane(id: string) {
    if (id === standard.id) return; // standard 1× lane is always active
    setActiveLaneIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  const remainingFor = (laneId: string): number => {
    if (paused && pausedRemaining) return Math.ceil((pausedRemaining[laneId] ?? 0) / 1000);
    const dl = deadlines[laneId];
    return dl != null ? remainingSeconds(dl, now) : 0;
  };

  const single = activeLaneIds.length === 1;
  // "Skip break" only while it's running — once a break has held at zero there is
  // nothing left to skip, so fall through to the normal next/finish label.
  const advanceLabel =
    seg?.kind === "break" && phase !== "held"
      ? "Skip break"
      : segIndex < segments.length - 1
        ? "Next section →"
        : "Finish";

  return (
    <main
      className="relative flex min-h-screen flex-col items-center bg-neutral-950 p-6 pb-16 text-neutral-100 sm:p-10"
      style={{ backgroundImage: "radial-gradient(ellipse 66% 50% at 50% 0%, rgba(245,158,11,0.07), transparent 74%)" }}
    >
      {/* Header */}
      <div className="flex w-full max-w-4xl items-center justify-between">
        <Link href="/testing" className="text-sm text-white/50 transition-colors hover:text-white">
          ← Templates
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted((m) => !m)}
            className="rounded-full border border-white/10 px-3 py-1.5 text-sm font-medium transition-all hover:bg-white/10"
          >
            {muted ? "🔇 Muted" : "🔔 Sound On"}
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-lg leading-none">📝</span>
        </div>
      </div>

      <div className="mt-6 flex w-full max-w-4xl flex-1 flex-col items-center gap-6">
        {/* ── SETUP ── */}
        {phase === "setup" && (
          <div className="flex w-full max-w-lg flex-col items-center gap-6 text-center">
            <h1 className="text-2xl font-bold leading-snug sm:text-3xl">{template.name}</h1>
            {template.description && <p className="text-sm text-white/50">{template.description}</p>}
            <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-2 text-xs text-amber-100/80">
              {template.verificationNotice}
            </p>

            <div className="w-full rounded-2xl border border-white/10 bg-neutral-900/70 p-5 text-left">
              <p className="mb-3 text-xs uppercase tracking-widest text-white/50">Accommodation lanes</p>
              <div className="flex flex-col gap-2">
                {template.accommodationLanes.map((lane) => {
                  const active = activeLaneIds.includes(lane.id);
                  const locked = lane.id === standard.id;
                  return (
                    <button
                      key={lane.id}
                      onClick={() => toggleLane(lane.id)}
                      disabled={locked}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition-all ${
                        active
                          ? "border-amber-500/50 bg-amber-500/15 text-amber-100"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      } ${locked ? "cursor-default opacity-90" : ""}`}
                    >
                      <span className="font-medium">{lane.label}</span>
                      <span className="text-xs text-white/50">
                        {active ? (locked ? "always on" : "active") : "off"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={startSession}
              className="rounded-2xl bg-amber-500 px-10 py-4 text-lg font-bold text-neutral-950 shadow-lg shadow-amber-500/25 transition-all hover:-translate-y-0.5 hover:bg-amber-400"
            >
              Start administration →
            </button>
          </div>
        )}

        {/* ── PRE (announcement + Begin) ── */}
        {phase === "pre" && seg && (
          <div className="flex flex-col items-center gap-6 text-center">
            <p className="text-sm uppercase tracking-widest text-amber-300/80">
              Segment {segIndex + 1} of {segments.length}
            </p>
            <h1 className="text-4xl font-bold sm:text-5xl">{seg.label}</h1>
            {seg.durationSeconds > 0 && (
              <p className="text-2xl tabular-nums text-white/70">
                {formatClock(segmentDurationFor(seg, standard))}
                <span className="ml-2 text-sm text-white/40">standard</span>
              </p>
            )}
            {seg.announcement && (
              <p className="max-w-xl rounded-2xl border border-white/10 bg-neutral-900/70 px-5 py-4 text-lg text-white/80">
                {seg.announcement}
              </p>
            )}
            {seg.durationSeconds > 0 ? (
              <button
                onClick={() => beginSegment(segIndex)}
                className="rounded-2xl bg-amber-500 px-10 py-4 text-lg font-bold text-neutral-950 shadow-lg shadow-amber-500/25 transition-all hover:-translate-y-0.5 hover:bg-amber-400"
              >
                ▶ Begin section
              </button>
            ) : (
              <button
                onClick={() => continueUntimed(segIndex)}
                className="rounded-2xl bg-amber-500 px-10 py-4 text-lg font-bold text-neutral-950 shadow-lg shadow-amber-500/25 transition-all hover:-translate-y-0.5 hover:bg-amber-400"
              >
                Continue →
              </button>
            )}
            <button onClick={requestEnd} className="text-sm text-white/40 hover:text-white/80">
              ↺ End administration
            </button>
          </div>
        )}

        {/* ── ACTIVE / HELD ── */}
        {(phase === "active" || phase === "held") && seg && (
          <div className="flex w-full flex-col items-center gap-5">
            <p className="text-sm uppercase tracking-widest text-amber-300/80">
              Segment {segIndex + 1} of {segments.length}
            </p>
            <h1 className="text-center text-3xl font-bold sm:text-4xl">{seg.label}</h1>

            {banner && (
              <div className="rounded-r-lg border-l-4 border-amber-400 bg-amber-500/15 px-6 py-3 text-lg font-bold tracking-wide text-amber-100">
                ⚠️ {banner.label}
              </div>
            )}

            {phase === "held" && (
              <div className="rounded-full bg-white/10 px-4 py-1 text-sm font-semibold text-white/80">
                Time — confirm to advance
              </div>
            )}

            {/* Lane clocks */}
            <div className="flex flex-wrap items-stretch justify-center gap-8 sm:gap-12">
              {activeLaneIds.map((laneId, i) => {
                const lane = laneById(laneId);
                const remaining = remainingFor(laneId);
                const zero = remaining <= 0;
                return (
                  <div key={laneId} className="flex items-center">
                    {i > 0 && <div className="mr-8 hidden w-px self-stretch bg-white/15 sm:mr-12 sm:block" />}
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-xs uppercase tracking-widest text-white/50">{lane?.label}</span>
                      <span
                        className={`font-mono font-bold tabular-nums ${single ? "text-8xl sm:text-9xl" : "text-6xl sm:text-7xl"} ${
                          zero ? "text-red-400" : ""
                        }`}
                      >
                        {formatClock(remaining)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              {phase === "active" && (
                <button
                  onClick={paused ? resume : pause}
                  className="rounded-xl border border-white/10 bg-white/10 px-5 py-2 text-sm font-medium transition-all hover:bg-white/20"
                >
                  {paused ? "▶ Resume" : "⏸ Pause"}
                </button>
              )}
              <button
                onClick={() => requestAdjust(-60)}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium transition-all hover:bg-white/20"
              >
                −1m
              </button>
              <button
                onClick={() => requestAdjust(60)}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium transition-all hover:bg-white/20"
              >
                +1m
              </button>
              <button
                onClick={() => requestAdjust(300)}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium transition-all hover:bg-white/20"
              >
                +5m
              </button>
              <button
                onClick={requestAdvance}
                className={`rounded-xl px-5 py-2 text-sm font-semibold transition-all ${
                  phase === "held"
                    ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/25 hover:-translate-y-0.5 hover:bg-amber-400"
                    : "border border-white/10 bg-white/10 hover:bg-white/20"
                }`}
              >
                {advanceLabel}
              </button>
              <button onClick={requestEnd} className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium transition-all hover:bg-white/20">
                ↺ End
              </button>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {phase === "done" && (
          <div className="flex flex-col items-center gap-5 text-center">
            <p className="text-5xl">✅</p>
            <h1 className="text-3xl font-bold">Administration complete</h1>
            <p className="text-white/60">{template.name}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setPhase("setup")}
                className="rounded-2xl bg-amber-500 px-6 py-3 font-bold text-neutral-950 shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-400"
              >
                Run again
              </button>
              <Link
                href="/testing"
                className="rounded-2xl border border-white/10 bg-white/10 px-6 py-3 font-medium transition-all hover:bg-white/20"
              >
                All templates
              </Link>
            </div>
          </div>
        )}

        {/* Admin log — available during and after a run */}
        {phase !== "setup" && (
          <AdminLog
            events={events}
            onAddNote={(initials, seat, note) =>
              log("note", `${initials}${seat ? ` · seat ${seat}` : ""}${note ? ` — ${note}` : ""}`)
            }
          />
        )}
      </div>

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
          <div className="flex w-full max-w-md flex-col gap-4 rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            {confirmDialog.kind === "end" ? (
              <>
                <h2 className="text-lg font-bold">End the administration?</h2>
                <p className="text-sm text-white/60">This ends the session for all lanes and stops the clocks.</p>
              </>
            ) : confirmDialog.kind === "adjust" ? (
              <>
                <h2 className="text-lg font-bold">
                  Remove {Math.abs(Math.round(confirmDialog.deltaSecs / 60))} minute
                  {Math.abs(Math.round(confirmDialog.deltaSecs / 60)) !== 1 ? "s" : ""}?
                </h2>
                <p className="text-sm text-white/60">This would take a lane to zero — times after removal:</p>
                <ul className="flex flex-col gap-1 text-sm">
                  {confirmDialog.lanes.map((l) => (
                    <li key={l.label} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span className="text-white/70">{l.label}</span>
                      <span className={`font-mono tabular-nums ${l.remaining <= 0 ? "text-red-400" : "text-amber-300"}`}>
                        {formatClock(l.remaining)}
                        {l.remaining <= 0 ? " (at limit)" : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold">
                  {confirmDialog.isBreak ? "End break early for everyone?" : `End “${confirmDialog.segLabel}” early?`}
                </h2>
                <p className="text-sm text-white/60">
                  {confirmDialog.isBreak ? "Time still on the clock:" : "Some lanes still have time remaining:"}
                </p>
                <ul className="flex flex-col gap-1 text-sm">
                  {confirmDialog.lanes.map((l) => (
                    <li key={l.label} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                      <span className="text-white/70">{l.label}</span>
                      <span className={`font-mono tabular-nums ${l.remaining > 0 ? "text-amber-300" : "text-white/40"}`}>
                        {formatClock(l.remaining)} remaining
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <div className="mt-1 flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium transition-all hover:bg-white/20"
              >
                {confirmDialog.kind === "adjust" ? "Cancel" : "Keep running"}
              </button>
              <button
                onClick={confirmProceed}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-all hover:bg-amber-400"
              >
                {confirmDialog.kind === "end"
                  ? "End administration"
                  : confirmDialog.kind === "adjust"
                    ? "Remove time"
                    : confirmDialog.isBreak
                      ? "End break early"
                      : "End early for all lanes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-10 w-full max-w-2xl border-t border-white/10 pt-6">
        <TrademarkDisclaimer />
      </div>
    </main>
  );
}
