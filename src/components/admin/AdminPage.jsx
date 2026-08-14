import { cn } from "@/lib/utils";

/**
 * The body of an admin screen.
 *
 * Every page used to decide its own width and its own vertical rhythm. Leads
 * capped itself at max-w-7xl, Settings at max-w-4xl, the other ten ran full
 * bleed, and two used space-y-8 where the rest used space-y-6 — so the content
 * column resized and the gaps changed as you moved between screens that are
 * meant to be one product.
 *
 * The column now belongs to AdminLayout and the rhythm belongs here, which
 * leaves a page with nothing to decide except what goes in it.
 *
 * `width="narrow"` is the one deliberate exception: a single-column form reads
 * badly at full width, so Settings keeps its narrower measure — declared, not
 * improvised.
 */
export default function AdminPage({ width = "full", className, children }) {
  return (
    <div
      className={cn(
        "space-y-6",
        width === "narrow" && "max-w-3xl",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * The row directly under the top bar: what this screen currently holds, and
 * what you can do to it.
 *
 * The screen's *name* is not here — the top bar states it once, for every page.
 * What belongs here is the part the top bar cannot know because it has not
 * loaded anything: live counts, filters, and the primary action.
 */
export function AdminPageBar({ summary, actions, className, children }) {
  if (!summary && !actions && !children) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 text-sm text-gray-500">{summary}</div>
      {(actions || children) && (
        <div className="flex flex-wrap items-center gap-2 sm:flex-shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * A heading inside a page.
 *
 * Pages carry real sections — "Analytics Overview", "Recent Activity" — and
 * those are h2s under the top bar's single h1. Three pages used to render a
 * second h1 of their own, which left a screen reader announcing two different
 * names for the same screen.
 */
export function AdminSectionHeading({ icon: Icon, children, action, className }) {
  return (
    <div className={cn("flex items-center justify-between gap-4 mb-4", className)}>
      <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 min-w-0">
        {Icon && <Icon className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" aria-hidden="true" />}
        <span className="truncate">{children}</span>
      </h2>
      {action}
    </div>
  );
}
