import { createContext, useContext } from "react";
import { Check, Lock, ShieldCheck, Sparkles } from "lucide-react";

import { STAGES, STAGE_LABELS } from "../engine/comparisonState";

/**
 * Layout and chrome for the comparison engine.
 *
 * The flow is one question at a time on a card that floats over a coloured
 * band — the same treatment the service landing pages open with, so arriving
 * here from one of them feels like the next step of one product rather than a
 * jump into a form.
 *
 * The band takes its colour from the branch the visitor is in: brand blue for a
 * home, navy for a business, green for renewable supply. That is the whole
 * colour system — context is coloured, the action stays the brand's orange, and
 * nothing else competes for attention.
 */

export const ACCENTS = {
  residential: {
    key: "residential",
    band: "radial-gradient(120% 130% at 12% -20%, #14719F 0%, #0A5C8C 45%, #073F5D 100%)",
    text: "text-[#0A5C8C]",
    border: "border-[#0A5C8C]",
    ring: "ring-[#0A5C8C]",
    softBg: "bg-[#0A5C8C]/[0.045]",
    tintBg: "bg-[#0A5C8C]/[0.12]",
    solidBg: "bg-[#0A5C8C]",
    focus: "focus-visible:ring-[#0A5C8C]",
    focusBorder: "focus-within:border-[#0A5C8C]",
    glowShadow: "shadow-[0_8px_20px_-10px_rgba(10,92,140,0.75)]",
  },
  commercial: {
    key: "commercial",
    band: "radial-gradient(120% 130% at 88% -20%, #12557C 0%, #0B3F5F 45%, #052A3F 100%)",
    text: "text-[#0B3F5F]",
    border: "border-[#0B3F5F]",
    ring: "ring-[#0B3F5F]",
    softBg: "bg-[#0B3F5F]/[0.045]",
    tintBg: "bg-[#0B3F5F]/[0.12]",
    solidBg: "bg-[#0B3F5F]",
    focus: "focus-visible:ring-[#0B3F5F]",
    focusBorder: "focus-within:border-[#0B3F5F]",
    glowShadow: "shadow-[0_8px_20px_-10px_rgba(11,63,95,0.75)]",
  },
  renewable: {
    key: "renewable",
    band: "radial-gradient(120% 130% at 12% -20%, #167A55 0%, #0B4A34 45%, #06301F 100%)",
    text: "text-[#0B4A34]",
    border: "border-[#0B4A34]",
    ring: "ring-[#0B4A34]",
    softBg: "bg-[#0B4A34]/[0.045]",
    tintBg: "bg-[#0B4A34]/[0.12]",
    solidBg: "bg-[#0B4A34]",
    focus: "focus-visible:ring-[#0B4A34]",
    focusBorder: "focus-within:border-[#0B4A34]",
    glowShadow: "shadow-[0_8px_20px_-10px_rgba(11,74,52,0.75)]",
  },
};

const AccentContext = createContext(ACCENTS.residential);

/** The accent for the branch the visitor is currently in. */
export function useAccent() {
  return useContext(AccentContext);
}

/**
 * Stage indicator.
 *
 * Deliberately not "Step 4 of 10" — the number of questions varies with the
 * branch and with how much the bill supplied, so a count would be wrong as
 * often as it was right. Stages stay stable regardless of the path taken, and
 * a completed one carries a check so progress is legible at a glance.
 */
export function StageProgress({ activeStage }) {
  const activeIndex = STAGES.indexOf(activeStage);

  return (
    <nav aria-label="Progress" className="mb-8">
      {/* Each stage owns the half-rail on either side of its dot, so the line
          reads as one continuous track rather than five stitched segments. */}
      <ol className="flex items-start">
        {STAGES.map((stage, index) => {
          const isComplete = index < activeIndex;
          const isActive = index === activeIndex;
          const railBefore = index <= activeIndex ? "bg-white/60" : "bg-white/15";
          const railAfter = index < activeIndex ? "bg-white/60" : "bg-white/15";

          return (
            <li key={stage} className="flex-1 flex flex-col items-center min-w-0">
              <div className="w-full flex items-center h-8">
                <span
                  aria-hidden="true"
                  className={`h-[2px] flex-1 transition-colors ${index === 0 ? "bg-transparent" : railBefore}`}
                />
                <span
                  aria-hidden="true"
                  className={`flex-shrink-0 flex items-center justify-center rounded-full font-semibold transition-all duration-300 ${
                    isActive
                      ? "w-8 h-8 bg-white text-gray-900 text-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.22)] ring-[5px] ring-white/20"
                      : isComplete
                        ? "w-6 h-6 bg-white text-gray-900 text-[11px]"
                        : "w-6 h-6 bg-white/[0.14] text-white/60 text-[11px] ring-1 ring-inset ring-white/20"
                  }`}
                >
                  {/* Completed stages carry a check; the active and upcoming
                      ones carry a dot rather than a number. A numeral here read
                      as "step 5 of 5", which is exactly the fixed step counter
                      this flow must not imply — the number of questions varies
                      with the branch and with what the bill supplied. */}
                  {isComplete ? (
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  ) : (
                    <span
                      className={`rounded-full ${
                        isActive ? "w-2.5 h-2.5 bg-gray-900" : "w-1.5 h-1.5 bg-white/50"
                      }`}
                    />
                  )}
                </span>
                <span
                  aria-hidden="true"
                  className={`h-[2px] flex-1 transition-colors ${
                    index === STAGES.length - 1 ? "bg-transparent" : railAfter
                  }`}
                />
              </div>

              <span
                className={`mt-2 text-[10.5px] sm:text-[11.5px] font-medium tracking-wide truncate max-w-full transition-colors ${
                  isActive ? "text-white" : isComplete ? "text-white/70" : "text-white/40"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {STAGE_LABELS[stage]}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * What the engine already knows, shown back to the visitor.
 *
 * The whole point of the landing handoff is that nothing is asked twice — so
 * the ZIP code and the service they picked are stated on the band rather than
 * being invisible state. It is also the fastest way for someone to notice they
 * typed the wrong ZIP.
 */
function ContextChips({ items }) {
  if (!items.length) return null;

  return (
    <ul className="flex flex-wrap items-center justify-center gap-2 mb-7">
      {items.map(({ label, icon: Icon }) => (
        <li
          key={label}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.14] ring-1 ring-inset ring-white/20 px-3 py-1.5 text-[12.5px] font-medium text-white/90 backdrop-blur-sm"
        >
          {Icon && <Icon className="w-3.5 h-3.5 text-white/70" aria-hidden="true" />}
          {label}
        </li>
      ))}
    </ul>
  );
}

/**
 * The frame every question renders inside.
 *
 * Keeping the title, body and controls in one component is what makes the
 * journey feel continuous — the contact questions land in exactly the same
 * frame as the first ZIP question instead of switching to a form layout.
 */
export function QuestionFrame({
  title,
  subtitle,
  children,
  onBack,
  footer,
  questionKey,
}) {
  return (
    <div
      // Re-keying on the question id restarts the entrance transition, which is
      // what makes one question replace another rather than mutate in place.
      key={questionKey}
      className="animate-[comparisonStep_260ms_cubic-bezier(0.16,1,0.3,1)]"
    >
      <div className="mb-7">
        {/* An H2: this is the current step inside the page whose H1 the shell
            above renders. Unchanged visually. */}
        <h2 className="text-[23px] sm:text-[27px] leading-[1.25] font-semibold text-gray-900 tracking-[-0.015em] text-balance">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2.5 text-[15px] leading-relaxed text-gray-600">
            {subtitle}
          </p>
        )}
      </div>

      {children}

      {(onBack || footer) && (
        <div className="mt-7 pt-5 border-t border-gray-100 flex items-center justify-between gap-4">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2 px-1.5 py-1 -ml-1.5"
            >
              <span aria-hidden="true">←</span> Back
            </button>
          ) : (
            <span />
          )}
          {footer}
        </div>
      )}
    </div>
  );
}

/** Reassurance line. Only ever states things that are actually true. */
export function TrustNote({ children }) {
  return (
    <p className="mt-5 text-xs text-gray-500 leading-relaxed">{children}</p>
  );
}

/**
 * The three promises under the card.
 *
 * Every one of them is something the product actually does, which is the only
 * reason they are worth the space: comparing costs nothing, no plan is bought
 * here, and contact details are not sold on.
 */
function TrustStrip() {
  const items = [
    [Sparkles, "Free to compare"],
    [ShieldCheck, "No obligation to switch"],
    [Lock, "Your details stay private"],
  ];

  return (
    <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
      {items.map(([Icon, label]) => (
        <li key={label} className="flex items-center gap-1.5 text-[12.5px] text-gray-500">
          <Icon className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}

export default function ComparisonShell({
  activeStage,
  children,
  wide = false,
  accent = "residential",
  context = [],
}) {
  const palette = ACCENTS[accent] || ACCENTS.residential;

  // Results need real room for three side-by-side match cards plus a list;
  // the questionnaire stays narrow so a single question keeps the focus.
  const column = wide ? "max-w-6xl" : "max-w-xl";

  return (
    <AccentContext.Provider value={palette}>
      <div className="min-h-screen bg-[#F4F7FA]">
        {/* The band is real layout rather than a fixed-height decoration, so it
            always ends exactly under the progress row however the header wraps.
            The card then overlaps it by a deliberate 40px — the edge stays crisp
            instead of being smudged into the page by a fade. */}
        <div
          className="pt-9 sm:pt-11 pb-14"
          style={{ backgroundImage: palette.band, backgroundColor: "#083A56" }}
        >
          <div className={`mx-auto px-5 sm:px-6 ${column}`}>
            {/* The page's heading, and an H1 rather than an H2.
                The hierarchy used to be inverted: this said "Compare
                electricity options" as an H2 while QuestionFrame below made the
                current question ("Where do you need electricity?") the H1. Since
                Google indexes the DOM after the app mounts, the question was
                what /compare-rates was indexed under — a heading with no target
                keyword in it, contradicting the page's own title tag. The
                wording is the route registry's, so title and H1 now agree, and
                the question is an H2 where a step within a page belongs. */}
            <header className="text-center mb-6">
              <h1 className="text-[20px] sm:text-[22px] font-semibold text-white tracking-[-0.015em]">
                Compare Electricity Rates Side by Side
              </h1>
              <p className="mt-1.5 text-[14px] text-white/65">
                A few quick questions and we&rsquo;ll personalize your options.
              </p>
            </header>

            <ContextChips items={context} />

            {activeStage && <StageProgress activeStage={activeStage} />}
          </div>
        </div>

        <div className={`mx-auto px-5 sm:px-6 -mt-10 pb-20 ${column}`}>
          {/* overflow-hidden so the accent strip follows the rounded corners. */}
          <div className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white ring-1 ring-black/5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_30px_70px_-30px_rgba(2,20,32,0.55)]">
            <div aria-hidden="true" className="h-1" style={{ backgroundImage: palette.band }} />
            <div className="p-6 sm:p-8">{children}</div>
          </div>

          <TrustStrip />
        </div>

        <style>{`
          @keyframes comparisonStep {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .animate-\\[comparisonStep_260ms_cubic-bezier\\(0\\.16\\,1\\,0\\.3\\,1\\)\\] { animation: none; }
          }
        `}</style>
      </div>
    </AccentContext.Provider>
  );
}
