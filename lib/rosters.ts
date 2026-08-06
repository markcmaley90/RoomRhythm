/**
 * Roster storage for the Classroom name picker.
 *
 * PRIVACY — this is the single localStorage carve-out in CLAUDE.md (see also
 * docs/gtm-strategy.md §9.3): rosters are DEVICE-LOCAL ONLY. Names are never
 * synced, transmitted, or included in share links, analytics, or any network
 * request. Nothing here may be imported by the Testing profile.
 *
 * Every read/write is guarded: SSR-safe (`typeof window`) and wrapped in
 * try/catch so corrupt data, private mode, or a full quota can never throw.
 */

const STORAGE_KEY = "roomrhythm.rosters.v1";

export type Roster = {
  id: string;
  name: string;
  students: string[];
};

export type RosterStore = { rosters: Roster[] };

const EMPTY: RosterStore = { rosters: [] };

function hasStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/** Stable id without a dependency. */
export function newId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID();
    }
  } catch {
    // fall through to the manual id
  }
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Trim, drop blanks, de-duplicate case-insensitively, preserve order. */
export function normalizeNames(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    if (typeof raw !== "string") continue;
    const name = raw.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

/** Split a pasted block ("one name per line") into clean names. */
export function parseNames(block: string): string[] {
  return normalizeNames(block.split(/\r?\n/));
}

// ══════════════════════════════════════════════════════════════
// CSV IMPORT
//
// A teacher's SIS export is the roster they already have; retyping thirty names
// per period is why the picker goes unused. But an SIS export also carries
// student IDs, birthdates, guardian emails, and full legal names — none of
// which this product has any business holding.
//
// So the reduction to "First L." happens HERE, during parse, before anything
// reaches state or storage. The full surname is discarded in the same tick it
// was read; every other column is never looked at. What lands in localStorage
// is what a teacher would say out loud to call on someone.
// ══════════════════════════════════════════════════════════════

/** One CSV line → fields. Handles quoted fields and doubled quotes inside them. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } // escaped quote
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === "," || ch === "\t" || ch === ";") {
      out.push(cur); cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((f) => f.trim());
}

const SUFFIXES = new Set(["jr", "jr.", "sr", "sr.", "ii", "iii", "iv", "v"]);

// Surname particles. Without these, "Peter van Dyke" reduces to "Peter D." —
// which is not what anyone in the room calls him. The particle carries the
// initial, so it becomes "Peter V.".
const PARTICLES = new Set([
  "van", "von", "de", "del", "della", "der", "den", "di", "da", "dos", "das",
  "la", "le", "el", "al", "bin", "ibn", "mac", "mc", "st", "st.",
]);

/** Last token, walking back over particles: ["Peter","van","Dyke"] → "van Dyke". */
function surnameFrom(parts: string[]): string {
  if (parts.length < 2) return "";
  let i = parts.length - 1;
  while (i > 1 && PARTICLES.has(parts[i - 1].toLowerCase())) i--;
  return parts.slice(i).join(" ");
}

/**
 * "Jonathan Rodriguez" → "Jonathan R."   ·   "Rodriguez, Jonathan" → "Jonathan R."
 * A single token stays as-is ("Amelia"). Returns "" for anything unusable.
 */
export function toDisplayName(raw: string): string {
  const value = raw.replace(/\s+/g, " ").trim();
  if (!value) return "";

  let first = "";
  let last = "";

  if (value.includes(",")) {
    // "Last, First Middle" — the dominant SIS export shape.
    const [lastPart, firstPart] = value.split(",", 2);
    last = lastPart.trim();
    first = (firstPart ?? "").trim().split(" ")[0] ?? "";
    if (!first) { first = last; last = ""; } // "Amelia," → just a first name
  } else {
    const parts = value.split(" ").filter((p) => !SUFFIXES.has(p.toLowerCase()));
    first = parts[0] ?? "";
    last = surnameFrom(parts);
  }

  if (!first) return "";
  const initial = last.replace(/[^\p{L}]/gu, "").charAt(0);
  return initial ? `${first} ${initial.toUpperCase()}.` : first;
}

/** Header cells that identify a column, checked in priority order. */
const FIRST_HEADERS = ["first name", "firstname", "first", "given name", "given"];
const LAST_HEADERS = ["last name", "lastname", "last", "surname", "family name"];
const FULL_HEADERS = ["student name", "student", "name", "full name", "display name"];

function headerIndex(cells: string[], candidates: string[]): number {
  const lower = cells.map((c) => c.toLowerCase().trim());
  for (const want of candidates) {
    const i = lower.indexOf(want);
    if (i !== -1) return i;
  }
  return -1;
}

/**
 * CSV/TSV text → roster names, already reduced to "First L." and de-duplicated.
 *
 * Reads a header row when one is present (separate first/last columns, or a
 * single full-name column) and otherwise falls back to the first column. Every
 * other column — IDs, birthdates, emails, grades — is ignored, never parsed.
 *
 * Pure string work: no network, no FileReader, no side effects.
 */
export function namesFromCsv(text: string): string[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) return [];

  const rows = lines.map(splitCsvLine);
  const head = rows[0];

  const iFirst = headerIndex(head, FIRST_HEADERS);
  const iLast = headerIndex(head, LAST_HEADERS);
  const iFull = headerIndex(head, FULL_HEADERS);
  const hasHeader = iFirst !== -1 || iLast !== -1 || iFull !== -1;
  const body = hasHeader ? rows.slice(1) : rows;

  const names = body.map((cells) => {
    if (iFirst !== -1) {
      const first = (cells[iFirst] ?? "").trim();
      const last = iLast !== -1 ? (cells[iLast] ?? "").trim() : "";
      // Join and re-reduce so "Mary Anne" / "van Dyke" go through one code path.
      return toDisplayName(last ? `${first} ${last}` : first);
    }
    if (iFull !== -1) return toDisplayName(cells[iFull] ?? "");
    return toDisplayName(cells[0] ?? "");
  });

  return normalizeNames(names);
}

function isRoster(v: unknown): v is Roster {
  if (typeof v !== "object" || v === null) return false;
  const r = v as Record<string, unknown>;
  return typeof r.id === "string" && typeof r.name === "string" && Array.isArray(r.students);
}

/** Never throws. Missing or corrupt data yields an empty store. */
export function loadRosters(): RosterStore {
  if (!hasStorage()) return EMPTY;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return EMPTY;
    const rosters = (parsed as { rosters?: unknown }).rosters;
    if (!Array.isArray(rosters)) return EMPTY;
    return {
      rosters: rosters.filter(isRoster).map((r) => ({
        id: r.id,
        name: r.name,
        students: normalizeNames(r.students),
      })),
    };
  } catch {
    return EMPTY;
  }
}

/** Never throws — quota/private-mode failures leave the picker working in memory. */
export function saveRosters(store: RosterStore): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage unavailable or full; in-memory state still works this session.
  }
}

export function createRoster(store: RosterStore, name: string, students: string[]): RosterStore {
  const roster: Roster = {
    id: newId(),
    name: name.trim() || "Untitled roster",
    students: normalizeNames(students),
  };
  const next: RosterStore = { rosters: [...store.rosters, roster] };
  saveRosters(next);
  return next;
}

export function updateRoster(
  store: RosterStore,
  id: string,
  patch: { name?: string; students?: string[] },
): RosterStore {
  const next: RosterStore = {
    rosters: store.rosters.map((r) =>
      r.id === id
        ? {
            ...r,
            ...(patch.name !== undefined ? { name: patch.name.trim() || r.name } : {}),
            ...(patch.students !== undefined ? { students: normalizeNames(patch.students) } : {}),
          }
        : r,
    ),
  };
  saveRosters(next);
  return next;
}

export function deleteRoster(store: RosterStore, id: string): RosterStore {
  const next: RosterStore = { rosters: store.rosters.filter((r) => r.id !== id) };
  saveRosters(next);
  return next;
}
