import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SEED_TEMPLATES } from "@/data/templates/seed";
import {
  isFree,
  segmentDurationFor,
  totalDurationFor,
  type TestTemplate,
  type AccommodationLane,
  type SegmentKind,
} from "@/lib/testing/schema";
import { formatDuration, formatClock } from "@/lib/testing/format";
import TrademarkDisclaimer from "@/components/TrademarkDisclaimer";
import EmailCapture from "@/components/EmailCapture";

const FREE_TEMPLATE_ID = "seed-final-90";

// ── Data accessors (real seed data / schema only) ──────────────────────────
function byId(id: string): TestTemplate | undefined {
  return SEED_TEMPLATES.find((t) => t.id === id);
}
function standardLane(t: TestTemplate): AccommodationLane {
  return t.accommodationLanes.find((l) => l.timeMultiplier === 1) ?? t.accommodationLanes[0];
}
function extendedLanes(t: TestTemplate): AccommodationLane[] {
  return t.accommodationLanes.filter((l) => l.timeMultiplier > 1);
}
function extLabel(t: TestTemplate): string {
  return extendedLanes(t)
    .map((l) => `${l.timeMultiplier}×`)
    .join(" / ");
}
function hasBreaks(t: TestTemplate): boolean {
  return t.segments.some((s) => s.kind === "break");
}
function sectionCount(t: TestTemplate): number {
  return t.segments.filter((s) => s.kind === "section").length;
}
function shortName(t: TestTemplate): string {
  return t.name.replace(/^RoomRhythm's\s+/, "");
}

const KIND_LABEL: Record<SegmentKind, string> = {
  section: "Section",
  break: "Break",
  instructions: "Instructions",
  transition: "Transition",
};

// ── SEO copy derived from template data (no five hardcoded strings) ─────────
function seoTitle(t: TestTemplate): string {
  if (t.domain === "practice_admissions" && t.trademark) {
    const base = `Mock ${t.trademark.mark} Practice Test Timer`;
    return hasBreaks(t) ? `${base} with Section Breaks` : base;
  }
  if (t.domain === "corporate_training") {
    return extendedLanes(t).length
      ? "Certification & Training Session Timer with Extended Time"
      : "Certification & Training Session Timer";
  }
  // school_exam
  const free = isFree(t) ? "Free " : "";
  return extendedLanes(t).length
    ? `${free}Final Exam Timer with Extended Time Accommodations`
    : `${free}Final Exam Timer`;
}

function seoDescription(t: TestTemplate): string {
  const total = formatDuration(totalDurationFor(t, standardLane(t)));
  const n = sectionCount(t);
  const bits = [
    `${n} section${n !== 1 ? "s" : ""}`,
    total,
    extendedLanes(t).length ? `extended-time lanes (${extLabel(t)})` : null,
    hasBreaks(t) ? "section breaks" : null,
  ]
    .filter(Boolean)
    .join(", ");
  const lead = isFree(t) ? "Free, projector-ready" : "Projector-ready";
  return `${lead} timer for ${shortName(t)}: ${bits}. Per-lane warnings on screen and out loud, gated advance, PII-free administration log. Mock/practice timing only.`;
}

function leadPhrase(t: TestTemplate): string {
  const article = isFree(t) ? "A free, " : "A ";
  if (t.domain === "practice_admissions" && t.trademark) {
    return `${article}projector-ready mock ${t.trademark.mark} practice-test timer${hasBreaks(t) ? " with section breaks" : ""}.`;
  }
  if (t.domain === "corporate_training") {
    return `${article}projector-ready certification & training session timer.`;
  }
  return `${article}projector-ready final exam timer${extendedLanes(t).length ? " with extended-time accommodations" : ""}.`;
}

// ── FAQ derived from template data (3 per template; includes honesty answer) ─
function faqs(t: TestTemplate): { q: string; a: string }[] {
  const total = formatDuration(totalDurationFor(t, standardLane(t)));
  const n = sectionCount(t);
  const ext = extendedLanes(t);

  const q1 = {
    q: `How long is the ${shortName(t)}?`,
    a: `The standard schedule runs ${total} across ${n} timed section${n !== 1 ? "s" : ""}${hasBreaks(t) ? ", plus scheduled breaks" : ""}. Every duration is set in the template and shown in the schedule above, and a proctor can adjust time live during a session.`,
  };

  let q2q: string;
  let q2a: string;
  if (t.domain === "practice_admissions" && t.trademark) {
    const bare = t.trademark.mark.replace("®", "");
    const isSat = bare.startsWith("SAT");
    q2q = `Can I run the official ${t.trademark.mark} exam with this?`;
    q2a =
      `No — this is a mock/practice timer only, not for a live official administration. ` +
      (isSat
        ? `The official digital SAT® is timed individually inside College Board's Bluebook app, not by a shared room clock. `
        : ``) +
      `RoomRhythm is not affiliated with or endorsed by the owner of the ${t.trademark.mark} mark. Use it for practice runs and mock administrations, and verify all timings against your official materials.`;
  } else if (t.domain === "corporate_training") {
    q2q = "Is this for official certification exams?";
    q2a =
      "It times the training and certification sessions you run yourself — warehouse, compliance, and equipment certification. Verify all timings against your certifying body's requirements before a live certification.";
  } else {
    q2q = "Is this an official standardized test?";
    q2a =
      "No — it's built for exams you create and administer yourself (finals, midterms, benchmarks). There's no third-party test involved; the only schedule to verify is your own.";
  }
  const q2 = { q: q2q, a: q2a };

  const q3 = {
    q: "Does it support extended-time accommodations?",
    a: ext.length
      ? `Yes. Standard and extended-time lanes (${extLabel(t)}) run side by side on one screen, each with its own countdown. Warnings are wall-clock, not scaled — a "5 minutes remaining" cue fires at 5 real minutes on every lane — and they show on screen and play out loud. Advance is gated (nothing moves on until the proctor confirms), and the administration log records initials and seat numbers only.`
      : `Standard timing runs on one screen with on-screen and audible warnings, gated advance, and a PII-free administration log (initials and seat numbers only).`,
  };

  return [q1, q2, q3];
}

// ── Next metadata / static generation ──────────────────────────────────────
export function generateStaticParams() {
  return SEED_TEMPLATES.map((t) => ({ templateId: t.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}): Promise<Metadata> {
  const { templateId } = await params;
  const t = byId(templateId);
  if (!t) return { title: "Template not found" };
  const title = seoTitle(t);
  const description = seoDescription(t);
  return {
    title,
    description,
    alternates: { canonical: `/templates/${t.id}` },
    openGraph: { title, description, type: "article" },
  };
}

export default async function TemplateLandingPage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const t = byId(templateId);
  if (!t) notFound();

  const std = standardLane(t);
  const total = totalDurationFor(t, std);
  const faqItems = faqs(t);
  const free = isFree(t);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <main
      className="min-h-screen bg-neutral-950 text-neutral-100 p-6 sm:p-10"
      style={{ backgroundImage: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,158,11,0.07), transparent 70%)" }}
    >
      {/* FAQPage structured data, from the same FAQ content */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <article className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link href="/testing" className="text-sm text-white/50 transition-colors hover:text-white">
            ← All templates
          </Link>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-lg leading-none">📝</span>
            <span className="text-sm font-semibold text-white/80">Testing</span>
          </div>
        </div>

        {/* (a) H1 + free-timer phrasing (name keeps ®) */}
        <header className="flex flex-col gap-3 border-b border-white/10 pb-8">
          <p className="text-xs uppercase tracking-widest text-amber-300/80">RoomRhythm · Test-day timer</p>
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{t.name}</h1>
          <p className="text-lg text-white/75">{leadPhrase(t)}</p>
          {t.description && <p className="max-w-2xl text-sm leading-relaxed text-white/50">{t.description}</p>}
        </header>

        {/* (b) Sections table from real data */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">Schedule</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/50">
                <tr>
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Segment</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Duration</th>
                </tr>
              </thead>
              <tbody>
                {t.segments.map((s, i) => (
                  <tr key={s.id} className="border-t border-white/5">
                    <td className="px-4 py-3 tabular-nums text-white/40">{i + 1}</td>
                    <td className="px-4 py-3 font-medium">{s.label}</td>
                    <td className="px-4 py-3 text-white/60">{KIND_LABEL[s.kind]}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {s.durationSeconds > 0 ? formatClock(segmentDurationFor(s, std)) : "Untimed"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10 bg-white/5">
                  <td className="px-4 py-3" colSpan={3}>
                    <span className="text-xs uppercase tracking-wide text-white/50">Total · standard lane</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-amber-300">
                    {formatDuration(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          {extendedLanes(t).length > 0 && (
            <p className="text-xs text-white/40">
              Extended-time lanes ({extLabel(t)}) scale each timed section proportionally; breaks stay the same length.
            </p>
          )}
        </section>

        {/* (c) Differentiators */}
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">What makes this different</h2>
          <ul className="flex flex-col gap-3 text-sm text-white/70">
            <li className="flex gap-3">
              <span className="text-amber-400">◆</span>
              <span>
                <strong className="font-semibold text-white/90">Extended-time accommodation lanes.</strong>{" "}
                {t.accommodationLanes.map((l) => (l.timeMultiplier === 1 ? "Standard" : `${l.timeMultiplier}×`)).join(" · ")} run
                side by side on one screen, each with its own countdown.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400">◆</span>
              <span>
                <strong className="font-semibold text-white/90">Warnings on screen and out loud.</strong> Each lane fires its
                cues at true wall-clock offsets — never scaled by the accommodation multiplier.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400">◆</span>
              <span>
                <strong className="font-semibold text-white/90">Gated section advance.</strong> Nothing moves on until the
                proctor confirms — no section ever auto-advances silently.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-400">◆</span>
              <span>
                <strong className="font-semibold text-white/90">PII-free administration log.</strong> Initials and seat numbers
                only — never names, dates of birth, or IDs.
              </span>
            </li>
          </ul>
        </section>

        {/* (d) Tier-aware CTA */}
        <section className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          {free ? (
            <>
              <p className="text-sm text-white/60">This template is free to run today — no signup.</p>
              <Link
                href={`/testing/run/${t.id}`}
                className="rounded-2xl bg-amber-500 px-6 py-3 font-bold text-neutral-950 shadow-lg shadow-amber-500/25 transition-all hover:-translate-y-0.5 hover:bg-amber-400"
              >
                Run this template free →
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/testing"
                className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-6 py-3 font-semibold text-amber-200 transition-all hover:bg-amber-500/20"
              >
                🔒 Part of RoomRhythm Pro — coming soon
              </Link>
              <Link
                href={`/templates/${FREE_TEMPLATE_ID}`}
                className="text-sm font-medium text-amber-400 transition-colors hover:text-amber-300"
              >
                Try the free Classroom Final Exam →
              </Link>
            </>
          )}
        </section>

        {/* (e) FAQ */}
        <section className="flex flex-col gap-5">
          <h2 className="text-xl font-semibold">Frequently asked questions</h2>
          {faqItems.map((f, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <h3 className="font-semibold text-white/90">{f.q}</h3>
              <p className="text-sm leading-relaxed text-white/60">{f.a}</p>
            </div>
          ))}
        </section>

        {/* Optional email capture — domain-signal fuel. Renders nothing if unconfigured. */}
        <div className="flex justify-center">
          <EmailCapture source="template_page" />
        </div>

        {/* (f) Trademark disclaimer */}
        <div className="border-t border-white/10 pt-6">
          <TrademarkDisclaimer />
        </div>
      </article>
    </main>
  );
}
