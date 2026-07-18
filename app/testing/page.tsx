import type { Metadata } from "next";
import Link from "next/link";
import { SEED_TEMPLATES } from "@/data/templates/seed";
import { totalDurationFor, type TestTemplate, type AccommodationLane } from "@/lib/testing/schema";
import { formatDuration } from "@/lib/testing/format";
import TrademarkDisclaimer from "@/components/TrademarkDisclaimer";

export const metadata: Metadata = {
  title: "Testing Templates",
  description:
    "Pick a timing template — mock exams, finals, and certification sessions — and run it with standard and extended-time accommodation lanes side by side.",
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
            Each template runs standard and extended-time lanes side by side, fires mandated
            warnings for every timing group, and keeps a PII-free administration log.
          </p>
        </div>

        {/* Template cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          {SEED_TEMPLATES.map((t) => {
            const sectionCount = t.segments.filter((s) => s.kind === "section").length;
            const total = totalDurationFor(t, standardLane(t));
            return (
              <Link
                key={t.id}
                href={`/testing/run/${t.id}`}
                className="group flex flex-col gap-3 rounded-2xl bg-slate-900/80 border border-white/10 border-t-2 border-t-amber-500 p-5 shadow-xl transition-all hover:-translate-y-1 hover:border-amber-500/60 hover:shadow-2xl hover:shadow-amber-500/20"
              >
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold leading-snug">{t.name}</h2>
                  {t.description && (
                    <p className="text-sm text-white/50 leading-relaxed">{t.description}</p>
                  )}
                </div>
                <div className="mt-auto flex items-center gap-2 text-xs text-white/60 pt-1">
                  <span className="px-2 py-1 rounded-full bg-white/10 tabular-nums">
                    {sectionCount} section{sectionCount !== 1 ? "s" : ""}
                  </span>
                  <span className="px-2 py-1 rounded-full bg-white/10 tabular-nums">{formatDuration(total)}</span>
                  <span className="ml-auto font-semibold text-amber-400 transition-colors group-hover:text-amber-300">
                    Open →
                  </span>
                </div>
              </Link>
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
