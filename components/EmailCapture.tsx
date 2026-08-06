"use client";

import { useState } from "react";

/**
 * Optional, quiet email capture — the flywheel's fuel. Reuses the existing
 * Formspree endpoint (NEXT_PUBLIC_FEEDBACK_ENDPOINT); renders NOTHING when that
 * is unset, so an unconfigured deploy shows no dead form and makes no request.
 *
 * PRIVACY: sends exactly four fields — email, domain, source, timestamp. Never
 * prefilled, never stored, never anything else.
 */

const ENDPOINT = process.env.NEXT_PUBLIC_FEEDBACK_ENDPOINT;

export type EmailCaptureSource =
  | "share"
  | "template_page"
  | "run_complete"
  /** Clicked into the "My Periods" tab — the highest-intent signal we get. */
  | "schedule_waitlist";

// One quiet card per surface per session — dismiss OR submit hides it. In-memory
// only (no cookie, no localStorage); resets on reload.
const retired = new Set<EmailCaptureSource>();

// Deliberately simple, permissive check — a single @, non-empty sides, no spaces.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Domain after the @, lowercased; "" if anything is off rather than crashing. */
function domainOf(email: string): string {
  const parts = email.split("@");
  return (parts.length === 2 && parts[1] ? parts[1] : "").toLowerCase();
}

export default function EmailCapture({
  source,
  prompt = "Get updates — we’ll email when site licenses and new templates land.",
  cta = "Notify me",
  done = "You’re on the list.",
}: {
  source: EmailCaptureSource;
  /** Why this ask, here. A waitlist and a post-block nudge are not the same offer. */
  prompt?: string;
  cta?: string;
  done?: string;
}) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [hidden, setHidden] = useState(() => retired.has(source));

  // Endpoint not configured, or already dealt with this session → render nothing.
  if (!ENDPOINT || hidden) return null;

  function dismiss() {
    retired.add(source);
    setHidden(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setStatus("error");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch(ENDPOINT as string, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          email: value,
          domain: domainOf(value),
          source,
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(`Email capture failed: ${res.status}`);
      retired.add(source); // don't ask again this session
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center text-sm text-white/70">
        ✓ {done}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-white/70">{prompt}</p>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="-mt-1 shrink-0 text-lg leading-none text-white/30 hover:text-white/70"
        >
          ×
        </button>
      </div>
      <form onSubmit={submit} className="mt-3 flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
          placeholder="you@school.org"
          aria-label="Email address"
          className="min-w-[10rem] flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:ring-2 focus:ring-amber-500/50"
        />
        <button
          type="submit"
          disabled={status === "sending"}
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition-all hover:bg-amber-400 disabled:opacity-50"
        >
          {status === "sending" ? "Sending…" : cta}
        </button>
      </form>
      {status === "error" && (
        <p className="mt-2 text-xs text-amber-300/80">That didn&apos;t go through — check the address and try again.</p>
      )}
    </div>
  );
}
