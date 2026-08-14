"use client";

import { useState } from "react";
import EmailCapture from "@/components/EmailCapture";

/**
 * The intentional small-screen state for the Classroom and Corporate running
 * screens.
 *
 * WHY THIS EXISTS: those screens are a projector surface. The clock is sized for
 * the back row, the controls assume a mouse and a wide viewport, and neither was
 * ever built to reflow to 390px — that is a deliberate scope choice, not a bug.
 *
 * But launch traffic arrives from Facebook groups and Pinterest, which are
 * overwhelmingly mobile. Without this, the sequence is: teacher taps a pin →
 * landing page looks good → taps Classroom → gets a broken screen → leaves. That
 * failure is invisible in the numbers, showing up only as healthy pageviews with
 * no follow-through.
 *
 * So the job here is NOT to apologise for a missing feature. It is to make the
 * first impression a considered one, explain that this is a room screen, and
 * give the visitor somewhere to go.
 *
 * Escape hatch: "Open it here anyway" is always available. Some people are on a
 * tablet, some just want a look, and a hard block would be worse than a cramped
 * layout. The choice lives in React state — it resets on reload and touches no
 * storage, per the localStorage rule in CLAUDE.md.
 */

export default function SmallScreenNotice({
  profile,
  onContinue,
  onBack,
}: {
  profile: "classroom" | "corporate";
  onContinue: () => void;
  onBack: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText("https://roomrhythm.org");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is unavailable over plain http and in some in-app browsers.
      // The URL is on screen directly below, so there is nothing to recover.
    }
  };

  const room = profile === "classroom" ? "your classroom" : "your training room";

  return (
    <div
      className="relative min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-8 px-6 py-12"
      style={{
        backgroundImage:
          "radial-gradient(ellipse 90% 50% at 50% 25%, rgba(99,102,241,0.13), transparent 70%)",
      }}
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-3 pb-1 bg-gradient-to-r from-indigo-400 to-teal-400 bg-clip-text text-transparent">
          RoomRhythm
        </h1>
        <p className="text-xl font-semibold text-white">
          This one runs on the big screen.
        </p>
      </div>

      <div className="w-full max-w-sm rounded-3xl bg-slate-900/80 border border-white/10 border-t-2 border-t-indigo-500/70 p-6 shadow-xl">
        <p className="text-white/80 text-base leading-relaxed">
          RoomRhythm is the display at the front of {room} — the projector, the
          board, the TV on the wall. The clock is sized so the back row can read
          it, which takes more width than a phone has.
        </p>
        <p className="mt-4 text-white/60 text-sm leading-relaxed">
          Open it on the computer that drives your display. No login, nothing to
          install — it starts the moment the page loads.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={copyLink}
            className="w-full rounded-xl bg-indigo-500/90 hover:bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition-colors"
          >
            {copied ? "Link copied" : "Copy the link"}
          </button>
          <p className="text-center text-white/40 text-xs tracking-wide">
            roomrhythm.org
          </p>
        </div>
      </div>

      <div className="w-full max-w-sm">
        <EmailCapture
          source="small_screen"
          prompt="Away from your computer? Leave your email and we’ll send word when the phone remote lands — your phone driving the projector, instead of being it."
          cta="Keep me posted"
          done="You’re on the list."
        />
      </div>

      <div className="flex flex-col items-center gap-3">
        <button
          onClick={onContinue}
          className="text-sm font-medium text-white/50 hover:text-white/80 underline underline-offset-4 transition-colors"
        >
          Open it here anyway
        </button>
        <button
          onClick={onBack}
          className="text-sm font-medium text-white/40 hover:text-white/70 transition-colors"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}
