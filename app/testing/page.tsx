import type { Metadata } from "next";
import Link from "next/link";
import { SEED_TEMPLATES } from "@/data/templates/seed";
import { totalDurationFor, isFree, type TestTemplate, type AccommodationLane } from "@/lib/testing/schema";
import { formatDuration } from "@/lib/testing/format";
import TrademarkDisclaimer from "@/components/TrademarkDisclaimer";

export const metadata: Metadata = {
  title: "Testing Templates",
  description:
    "Pick a timing template — mock exams, finals, and certification sessions — and run it with standard and extended-time accommodation groups side by side.",
};

/** The standard (1×) lane; validateTemplate guarantees one exists. */
function standardLane(t: TestTemplate): AccommodationLane {
  return t.accommodationLanes.find((l) => l.timeMultiplier === 1) ?? t.accommodationLanes[0];
}

export default function TestingPickerPage() {
  return (
    <main
      className="min-h-screen bg-neutral-950 text-neutral-100 p-6 sm:p-10"
      style={{ backgroundImage: "radial-gradient(ellipse 60% 45% at 50% 0%, rgba(245,158,11,0.08), transparent 70%)" }}
    >
      <div className="mx-auto w-full max-w-4xl flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-white/50 hover:text-white transition-colors">← Rooms</Link>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/15 text-lg leading-none">📝</span>
            <span className="text-sm font-semibold text-white/80">Testing</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Choose a template</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/50 leading-relaxed">
            Each template runs standard and extended-time timing groups side by side, fires mandated
            warnings for every timing group, and keeps a PII-free administration log.
          </p>
        </div>

        {/* Template cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {SEED_TEMPLATES.map((t) => {
            const sectionCount = t.segments.filter((s) => s.kind === "section").length;
            const total = totalDurationFor(t, standardLane(t));
            const free = isFree(t);

            const body = (
              <>
                <div className="flex flex-col gap-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-lg font-semibold leading-snug">{t.name}</h2>
                    {!free && (
                      <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                        🔒 Pro
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <p className="text-sm text-white/50 leading-relaxed">{t.description}</p>
                  )}
                </div>
                <div className="mt-auto flex items-center gap-2 text-xs text-white/60 pt-1">
                  <span className="px-2 py-1 rounded-full bg-white/10 tabular-nums">
                    {sectionCount} section{sectionCount !== 1 ? "s" : ""}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-white/10 tabular-nums">{formatDuration(total)}</span>
                  {free ? (
                    <span className="ml-auto font-semibold text-amber-400 transition-colors group-hover:text-amber-300">
                      Open →
                    </span>
                  ) : (
                    <span className="ml-auto font-semibold text-white/40">Pro — coming soon</span>
                  )}
                </div>
              </>
            );

            const base = "flex flex-col gap-3 rounded-2xl border border-white/10 border-t-2 p-5 shadow-xl transition-all";

            return (
              <div key={t.id} className="flex flex-col gap-2">
                {free ? (
                  <Link
                    href={`/testing/run/${t.id}`}
                    className={`group ${base} bg-slate-900/80 border-t-amber-500 hover:-translate-y-1 hover:border-amber-500/60 hover:shadow-2xl hover:shadow-amber-500/20`}
                  >
                    {body}
                  </Link>
                ) : (
                  <div
                    aria-disabled="true"
                    className={`${base} bg-slate-900/50 border-t-white/15 opacity-80`}
                  >
                    {body}
                  </div>
                )}
                {/* Landing page — the only place a locked card can lead. */}
                <Link
                  href={`/templates/${t.id}`}
                  className="self-start px-1 text-xs font-medium text-white/45 transition-colors hover:text-amber-300"
                >
                  About this template →
                </Link>
              </div>
            );
          })}
        </div>

        <div className="border-t border-white/10 pt-6">
          <TrademarkDisclaimer />
        </div>
      </div>
    </main>
  );
}
