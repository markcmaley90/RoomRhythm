"use client";

import { useEffect, useRef, useState } from "react";
import {
  createRoster,
  deleteRoster,
  loadRosters,
  parseNames,
  updateRoster,
  type Roster,
  type RosterStore,
} from "@/lib/rosters";
import { track } from "@/lib/analytics";

/**
 * Classroom-only random name picker. Never rendered in the Testing profile.
 * Rosters are device-local (see lib/rosters.ts); nothing here is transmitted.
 */

/**
 * Already-picked names for "no repeats", keyed by roster id. Module-level so it
 * survives closing/reopening the modal within a session, and resets on reload.
 */
const sessionPicked = new Map<string, Set<string>>();
function pickedFor(rosterId: string): Set<string> {
  let set = sessionPicked.get(rosterId);
  if (!set) {
    set = new Set<string>();
    sessionPicked.set(rosterId, set);
  }
  return set;
}

const PRIVACY_LINE = "Names are stored only on this device and never leave it.";

export default function NamePicker({ onClose }: { onClose: () => void }) {
  const [store, setStore] = useState<RosterStore>({ rosters: [] });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [noRepeats, setNoRepeats] = useState(true);
  const [cycled, setCycled] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Editor state
  const [editingId, setEditingId] = useState<string | null>(null); // null = not editing
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftNames, setDraftNames] = useState("");

  const shuffleRef = useRef<NodeJS.Timeout | null>(null);

  // localStorage is only touched after mount (SSR-safe).
  useEffect(() => {
    const loaded = loadRosters();
    setStore(loaded);
    setSelectedId(loaded.rosters[0]?.id ?? null);
    if (typeof window !== "undefined" && window.matchMedia) {
      setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  useEffect(() => () => { if (shuffleRef.current) clearInterval(shuffleRef.current); }, []);

  const selected: Roster | undefined = store.rosters.find((r) => r.id === selectedId);
  const remaining = selected
    ? selected.students.filter((s) => !pickedFor(selected.id).has(s)).length
    : 0;

  function land(rosterId: string, name: string) {
    setShuffling(false);
    setPicked(name);
    if (noRepeats) pickedFor(rosterId).add(name);
    // Usage only — the picked name is never sent.
    track("name_picker_used");
  }

  function pick() {
    if (!selected || selected.students.length === 0 || shuffling) return;
    const already = pickedFor(selected.id);
    let pool = noRepeats ? selected.students.filter((s) => !already.has(s)) : selected.students;
    let didCycle = false;
    if (pool.length === 0) {
      already.clear();
      pool = selected.students;
      didCycle = true;
    }
    setCycled(didCycle);
    const result = pool[Math.floor(Math.random() * pool.length)];

    if (reducedMotion) {
      land(selected.id, result);
      return;
    }
    setShuffling(true);
    const started = Date.now();
    shuffleRef.current = setInterval(() => {
      setPicked(selected.students[Math.floor(Math.random() * selected.students.length)]);
      if (Date.now() - started >= 1500) {
        if (shuffleRef.current) clearInterval(shuffleRef.current);
        shuffleRef.current = null;
        land(selected.id, result);
      }
    }, 70);
  }

  function openCreate() {
    setCreating(true);
    setEditingId(null);
    setDraftName("");
    setDraftNames("");
  }

  function openEdit(r: Roster) {
    setCreating(false);
    setEditingId(r.id);
    setDraftName(r.name);
    setDraftNames(r.students.join("\n"));
  }

  function saveDraft() {
    const names = parseNames(draftNames);
    if (creating) {
      const next = createRoster(store, draftName, names);
      setStore(next);
      setSelectedId(next.rosters[next.rosters.length - 1]?.id ?? null);
    } else if (editingId) {
      setStore(updateRoster(store, editingId, { name: draftName, students: names }));
    }
    closeEditor();
  }

  function removeRoster(id: string) {
    const next = deleteRoster(store, id);
    sessionPicked.delete(id);
    setStore(next);
    if (selectedId === id) setSelectedId(next.rosters[0]?.id ?? null);
    setPicked(null);
    closeEditor();
  }

  function closeEditor() {
    setCreating(false);
    setEditingId(null);
    setDraftName("");
    setDraftNames("");
  }

  const inEditor = creating || editingId !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="flex w-full max-w-lg flex-col gap-4 rounded-3xl bg-gray-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🎲 Name picker</h2>
            <p className="mt-1 text-sm text-white/50">Pick a student at random.</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-white/40 hover:text-white/80">×</button>
        </div>

        {inEditor ? (
          /* ── Roster editor ───────────────────────────────────────── */
          <div className="flex flex-col gap-3">
            <input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              placeholder="Roster name (e.g. Period 3)"
              className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-indigo-500"
            />
            <textarea
              value={draftNames}
              onChange={(e) => setDraftNames(e.target.value)}
              rows={7}
              placeholder="Paste one name per line — first names are enough."
              className="w-full resize-none rounded-xl bg-white/10 p-3 text-sm text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-xs text-white/40">{PRIVACY_LINE}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={saveDraft}
                disabled={parseNames(draftNames).length === 0}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-500 disabled:opacity-40"
              >
                Save roster
              </button>
              <button onClick={closeEditor} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-white/20">
                Cancel
              </button>
              {editingId && (
                <button
                  onClick={() => removeRoster(editingId)}
                  className="ml-auto rounded-xl border border-red-400/30 px-4 py-2 text-sm font-medium text-red-300 transition-all hover:bg-red-500/10"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        ) : (
          /* ── Picker ──────────────────────────────────────────────── */
          <div className="flex flex-col gap-4">
            {store.rosters.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/5 py-8 text-center">
                <p className="text-sm text-white/60">No rosters yet.</p>
                <button onClick={openCreate} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                  ＋ Create a roster
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedId ?? ""}
                    onChange={(e) => { setSelectedId(e.target.value); setPicked(null); setCycled(false); }}
                    className="flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {store.rosters.map((r) => (
                      <option key={r.id} value={r.id} className="bg-gray-900">
                        {r.name} ({r.students.length})
                      </option>
                    ))}
                  </select>
                  {selected && (
                    <button onClick={() => openEdit(selected)} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20">
                      Edit
                    </button>
                  )}
                  <button onClick={openCreate} className="rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-white hover:bg-white/20">
                    ＋ New
                  </button>
                </div>

                {/* Projector-legible result */}
                <div className="flex min-h-[7rem] items-center justify-center rounded-2xl bg-white/5 px-4 py-6 text-center">
                  {picked ? (
                    <span className={`text-4xl font-bold sm:text-5xl ${shuffling ? "text-white/50" : "text-white"}`}>
                      {picked}
                    </span>
                  ) : (
                    <span className="text-sm text-white/40">Press Pick to choose a name.</span>
                  )}
                </div>

                {cycled && !shuffling && (
                  <p className="text-center text-xs text-indigo-300">Everyone has been picked — starting a new round.</p>
                )}

                <button
                  onClick={pick}
                  disabled={!selected || selected.students.length === 0 || shuffling}
                  className="w-full rounded-2xl bg-indigo-600 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 disabled:opacity-40"
                >
                  {shuffling ? "Picking…" : "🎲 Pick"}
                </button>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => setNoRepeats((v) => !v)}
                    className={`rounded-full px-3 py-1 font-semibold transition-all ${noRepeats ? "bg-indigo-500/40 text-indigo-100" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                  >
                    No repeats: {noRepeats ? "On" : "Off"}
                  </button>
                  {noRepeats && selected && (
                    <span className="text-white/40">{remaining} of {selected.students.length} left this round</span>
                  )}
                </div>
              </>
            )}
            <p className="text-center text-[11px] text-white/35">{PRIVACY_LINE}</p>
          </div>
        )}
      </div>
    </div>
  );
}
