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
