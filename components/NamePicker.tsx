"use client";

import { useEffect, useRef, useState } from "react";
import {
  createRoster,
  deleteRoster,
  loadRosters,
  namesFromCsv,
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
  const [importNote, setImportNote] = useState<string | null>(null);

  const shuffleRef = useRef<NodeJS.Timeout | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

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

  /**
   * Read a CSV/TSV the teacher picked and fill the draft with "First L." names.
   *
   * `file.text()` reads from the local disk into this tab — there is no upload
   * and no request. The reduction happens in namesFromCsv before the result
   * touches state, so full surnames and every other column in the export are
   * discarded rather than stored.
   */
  async function importCsv(file: File) {
    setImportNote(null);
    try {
      const names = namesFromCsv(await file.text());
      if (names.length === 0) {
        setImportNote("Couldn’t find any names in that file. You can paste them below instead.");
        return;
      }
      setDraftNames(names.join("\n"));
      if (!draftName.trim()) {
        setDraftName(file.name.replace(/\.[^.]+$/, "").slice(0, 40));
      }
      setImportNote(`Imported ${names.length} name${names.length === 1 ? "" : "s"} as “First L.”`);
      track("roster_csv_imported");
    } catch {
      setImportNote("That file couldn’t be read. You can paste the names below instead.");
    }
  }

  function openCreate() {
    setCreating(true);
    setEditingId(null);
    setDraftName("");
    setDraftNames("");
    setImportNote(null);
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
    setImportNote(null);
  }

  const inEditor = creating || editingId !== null;

  return (
    /*
      DOCKED LEFT, mirroring the noise meter on the right. Same reasoning: a
      full-screen modal hid the clock, so "pick someone" was unusable during the
      block it belongs in. z-20 keeps it under the side rail and the emergency
      button, and the centered timer stays clear between the two panels.
    */
    <div className="fixed left-20 top-1/2 z-20 flex max-h-[90vh] w-72 -translate-y-1/2 flex-col gap-3 overflow-y-auto rounded-3xl border border-indigo-400/25 bg-indigo-950/80 p-4 shadow-2xl ring-1 ring-inset ring-white/5 backdrop-blur">
      {/* Collapse, not close: the chevron points back at the wall the panel
          came out of, so it reads as "put this away" rather than "delete". */}
      <div className="flex items-start justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/70">🎲 Pick a name</h2>
        <button onClick={onClose} aria-label="Collapse the name picker" title="Collapse"
          className="-mt-0.5 rounded-lg px-1.5 text-lg leading-none text-white/40 transition-colors hover:bg-white/10 hover:text-white/80">
          ‹
        </button>
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

            {/* CSV import — the roster already exists in the SIS; retyping it is
                why this feature goes unused. Reduced to "First L." on read. */}
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importCsv(f);
                e.target.value = ""; // allow re-picking the same file
              }}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border border-dashed border-white/20 bg-white/5 px-3 py-2.5 text-xs font-medium text-white/80 transition-all hover:border-white/40 hover:bg-white/10"
            >
              ⬆ Import a class list (CSV)
            </button>
            {importNote && <p className="text-[11px] leading-snug text-indigo-300">{importNote}</p>}

            <textarea
              value={draftNames}
              onChange={(e) => setDraftNames(e.target.value)}
              rows={7}
              placeholder="Or paste one name per line — first names are enough."
              className="w-full resize-none rounded-xl bg-white/10 p-3 text-sm text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] leading-snug text-white/40">
              Imported names are shortened to “First L.” as the file is read — surnames, IDs, and every
              other column are discarded, not stored. {PRIVACY_LINE}
            </p>
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
                <div className="flex min-h-[6rem] items-center justify-center rounded-2xl bg-white/5 px-3 py-5 text-center">
                  {picked ? (
                    <span className={`text-3xl font-bold leading-tight ${shuffling ? "text-white/50" : "text-white"}`}>
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

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <button
                    onClick={() => setNoRepeats((v) => !v)}
                    className={`rounded-full px-3 py-1 font-semibold transition-all ${noRepeats ? "bg-indigo-500/40 text-indigo-100" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                  >
                    No repeats: {noRepeats ? "On" : "Off"}
                  </button>
                  {noRepeats && selected && (
                    <span className="text-white/40">{remaining} of {selected.students.length} left</span>
                  )}
                </div>
              </>
            )}
          <p className="text-[10px] leading-snug text-white/35">{PRIVACY_LINE}</p>
        </div>
      )}
    </div>
  );
}
