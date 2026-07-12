/**
 * Trademark attribution footer. Render wherever a third-party mark (SAT®, ACT®,
 * AP®) appears in the UI — the Testing picker and section runner. See
 * docs/09_trademark_and_disclaimers.md.
 */
export default function TrademarkDisclaimer() {
  return (
    <p className="mx-auto max-w-2xl px-6 text-center text-xs leading-relaxed text-white/40">
      SAT® and AP® are registered trademarks of College Board. ACT® is a
      registered trademark of ACT, Inc. Neither is affiliated with, nor
      endorses, RoomRhythm.
    </p>
  );
}
