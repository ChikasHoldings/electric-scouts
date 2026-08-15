/**
 * The one loading state the admin panel shows while it starts up.
 *
 * Opening an admin page used to cross four separate full-screen states in a
 * row — the lazy-chunk Suspense fallback, then "Checking access...", then
 * "Loading profile...", then the page's own spinner — each with different
 * markup and different text. Nothing was broken; it just flashed and blinked
 * its way to the content, because every step tore down the previous DOM and
 * painted a new one.
 *
 * Every one of those steps now renders exactly this component. Identical
 * markup across the whole boot means React reuses the same nodes and the
 * visitor sees one spinner hold steady until the panel is ready, rather than
 * three spinners replacing each other.
 *
 * The message is deliberately constant. A caption that changes mid-spin is the
 * flash, even when the spinner itself does not move.
 */
export default function AdminBoot() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0A5C8C] rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading admin panel…</p>
      </div>
    </div>
  );
}

/**
 * The wait for one screen's chunk, once the panel is already up.
 *
 * Deliberately not AdminBoot. That one covers the whole viewport, which is
 * right while there is no panel yet and wrong the moment there is: used for a
 * navigation it blanks the sidebar and header the visitor just clicked in, and
 * the panel appears to reload. This sits in the content column, under a header
 * that never moves, and carries no caption — the top bar has already named the
 * screen being opened.
 */
export function AdminPageLoading() {
  return (
    <div className="flex items-center justify-center py-24" role="status" aria-label="Loading page">
      <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0A5C8C] rounded-full animate-spin" />
    </div>
  );
}
