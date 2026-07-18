/**
 * Pure duration formatters for the testing engine. All inputs are SECONDS
 * (per the schema's seconds-only rule). No React, no side effects — easy to test.
 */

/** Summary form: 8040 -> "2h 14m", 5400 -> "1h 30m", 300 -> "5m", 45 -> "45s". */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (parts.length === 0) return `${s}s`;
  return parts.join(" ");
}

/** Clock form for the runner: "mm:ss" under an hour, "h:mm:ss" at/over an hour. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
}
