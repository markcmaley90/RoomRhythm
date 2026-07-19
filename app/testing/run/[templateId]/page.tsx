import type { Metadata } from "next";
import Link from "next/link";
import { SEED_TEMPLATES } from "@/data/templates/seed";
import { isFree } from "@/lib/testing/schema";
import SectionRunner from "@/components/testing/SectionRunner";

// Mark-free title by decision: the runner is an app screen, not the SEO/mark
// surface (that's the P0-4 template landing pages). Kept out of the index too.
export const metadata: Metadata = {
  title: "Section Runner",
  robots: { index: false, follow: true },
};

export function generateStaticParams() {
  return SEED_TEMPLATES.map((t) => ({ templateId: t.id }));
}

function TemplateNotFound({ id }: { id: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 p-8 text-center text-neutral-100">
      <p className="text-5xl">🔍</p>
      <h1 className="text-2xl font-bold">Template not found</h1>
      <p className="max-w-md text-sm text-white/50">
        We couldn&apos;t find a testing template with the id{" "}
        <span className="font-mono text-white/70">{id}</span>.
      </p>
      <Link
        href="/testing"
        className="rounded-2xl bg-amber-500 px-6 py-3 font-bold text-neutral-950 transition-all hover:bg-amber-400"
      >
        ← Back to templates
      </Link>
    </main>
  );
}

function TemplateLocked({ name }: { name: string }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 p-8 text-center text-neutral-100">
      <p className="text-5xl">🔒</p>
      <h1 className="text-2xl font-bold">This template is part of RoomRhythm Pro</h1>
      <p className="max-w-md text-sm text-white/50">
        <span className="text-white/70">{name}</span> will be available with RoomRhythm Pro — coming soon.
        The Classroom Final Exam template is free to run today.
      </p>
      <Link
        href="/testing"
        className="rounded-2xl bg-amber-500 px-6 py-3 font-bold text-neutral-950 transition-all hover:bg-amber-400"
      >
        ← Back to templates
      </Link>
    </main>
  );
}

export default async function RunPage({ params }: { params: Promise<{ templateId: string }> }) {
  const { templateId } = await params;
  const template = SEED_TEMPLATES.find((t) => t.id === templateId);
  if (!template) return <TemplateNotFound id={templateId} />;
  if (!isFree(template)) return <TemplateLocked name={template.name} />;
  return <SectionRunner template={template} />;
}
