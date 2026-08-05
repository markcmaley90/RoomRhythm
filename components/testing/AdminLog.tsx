"use client";

import { useState } from "react";

/** One timestamped administration event. Wall-clock label is set by the runner. */
export type AdminEvent = {
  id: number;
  atLabel: string; // e.g. "14:22:07"
  kind: "segment" | "warning" | "advance" | "pause" | "resume" | "adjust" | "note";
  message: string;
};

/**
 * Collapsible administration log. The proctor may attach INITIALS and SEAT
 * NUMBER only — there is deliberately no field for names or IDs (FERPA/COPPA
 * posture, per CLAUDE.md). Timestamps are dim monospace.
 */
export default function AdminLog({
  events,
  onAddNote,
  templateName = "administration",
}: {
  events: AdminEvent[];
  onAddNote: (initials: string, seat: string, note: string) => void;
  /** Used only to name the exported file. */
  templateName?: string;
}) {
  // Open by default: a proctor arrives at this screen to WATCH the log, not to
  // discover it. Collapsed-by-default hid the whole feature behind a click on
  // the one screen where it matters.
  const [open, setOpen] = useState(true);
  const [initials, setInitials] = useState("");
  const [seat, setSeat] = useState("");
  const [note, setNote] = useState("");

  function submit() {
    const i = initials.trim();
    if (!i) return; // initials required; there is no name field by design
    onAddNote(i, seat.trim(), note.trim());
    setInitials("");
    setSeat("");
    setNote("");
  }

  /**
   * Export the log as CSV, entirely in the browser.
   *
   * Nothing is uploaded — the file is built from in-memory events and handed to
   * the browser's download. This matters for the compliance story: the log
   * still never touches a server, and the proctor keeps the only copy.
   *
   * The session is lost on reload (no persistence by design), so without this a
   * proctor who needs an administration record has to photograph the screen.
   */
  function downloadCsv() {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["Time", "Type", "Entry"],
      ...events.map((e) => [e.atLabel, e.kind, e.message]),
    ];
    const csv = rows.map((r) => r.map(esc).join(",")).join("\r\n");

    const stamp = new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "");
    const slug = templateName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    // BOM so Excel opens UTF-8 correctly — proctors live in Excel.
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roomrhythm-log_${slug}_${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-neutral-900/70">
      <div className="flex w-full items-center gap-2 px-4 py-3">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center justify-between text-left text-sm font-medium text-white/80 hover:text-white"
        >
          <span>
            Administration log <span className="text-white/40">· {events.length}</span>
          </span>
          <span className="text-white/40">{open ? "▲" : "▼"}</span>
        </button>
        <button
          onClick={downloadCsv}
          disabled={events.length === 0}
          title="Download this log as a CSV file"
          className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:bg-white/15 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          ↓ CSV
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-4 px-4 pb-4">
          {/* Entry — initials + seat only. Never names, never IDs. */}
          <div className="flex flex-col gap-2 rounded-xl bg-white/5 p-3">
            <p className="text-xs text-white/50">
              Log an entry — <span className="text-white/70">initials and seat only</span>. Never
              record student names or IDs.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                value={initials}
                onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 4))}
                placeholder="Initials"
                aria-label="Student initials"
                className="w-24 rounded-lg bg-white/10 px-2 py-1 text-sm uppercase outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <input
                value={seat}
                onChange={(e) => setSeat(e.target.value.slice(0, 6))}
                placeholder="Seat"
                aria-label="Seat number"
                className="w-24 rounded-lg bg-white/10 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 80))}
                placeholder="Note (optional)"
                aria-label="Note"
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="min-w-[8rem] flex-1 rounded-lg bg-white/10 px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-amber-500/50"
              />
              <button
                onClick={submit}
                disabled={!initials.trim()}
                className="rounded-lg bg-amber-500 px-3 py-1 text-sm font-semibold text-neutral-950 transition-colors hover:bg-amber-400 disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>

          {/* Events, newest first */}
          <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
            {events.length === 0 ? (
              <p className="px-1 py-2 text-xs text-white/40">No events yet.</p>
            ) : (
              [...events].reverse().map((ev) => (
                <div key={ev.id} className="flex gap-3 border-b border-white/5 px-1 py-1 text-xs">
                  <span className="shrink-0 font-mono tabular-nums text-white/40">{ev.atLabel}</span>
                  <span className="text-white/70">{ev.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
