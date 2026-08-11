import { STAGES, STAGE_LABELS } from "../engine/comparisonState";

/**
 * Layout and chrome for the comparison engine.
 *
 * The shell deliberately constrains content width: a single question centred in
 * a narrow column reads as a considered step, whereas the same question
 * stretched across a desktop viewport reads as an unfinished form.
 */

/**
 * Stage indicator.
 *
 * Deliberately not "Step 4 of 10" — the number of questions varies with the
 * branch and with how much the bill supplied, so a count would be wrong as
 * often as it was right. Stages stay stable regardless of the path taken.
 */
export function StageProgress({ activeStage }) {
  const activeIndex = STAGES.indexOf(activeStage);

  return (
    <nav aria-label="Progress" className="mb-8">
      <ol className="flex items-center justify-center gap-1.5 sm:gap-2">
        {STAGES.map((stage, index) => {
          const isComplete = index < activeIndex;
          const isActive = index === activeIndex;

          return (
            <li key={stage} className="flex items-center gap-1.5 sm:gap-2">
              <span
                className={`text-[11px] sm:text-xs font-medium tracking-wide transition-colors ${
                  isActive
                    ? "text-[#0A5C8C]"
                    : isComplete
                      ? "text-gray-500"
                      : "text-gray-300"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {STAGE_LABELS[stage]}
              </span>
              {index < STAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`h-px w-3 sm:w-6 transition-colors ${
                    isComplete ? "bg-gray-300" : "bg-gray-200"
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
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
      className="animate-[comparisonStep_220ms_ease-out]"
    >
      <div className="mb-6">
        <h1 className="text-[22px] sm:text-[26px] leading-snug font-semibold text-gray-900 tracking-[-0.01em]">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
            {subtitle}
          </p>
        )}
      </div>

      {children}

      {(onBack || footer) && (
        <div className="mt-6 flex items-center justify-between gap-4">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5C8C] focus-visible:ring-offset-2 px-1 py-1 -ml-1"
            >
              ← Back
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

export default function ComparisonShell({ activeStage, children, wide = false }) {
  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      <div
        className={`mx-auto px-5 sm:px-6 pt-10 pb-20 ${
          wide ? "max-w-5xl" : "max-w-xl"
        }`}
      >
        <header className="text-center mb-8">
          <h2 className="text-sm font-semibold text-[#0A5C8C] tracking-wide uppercase">
            Compare electricity options
          </h2>
          <p className="mt-1.5 text-sm text-gray-500">
            Answer a few quick questions and we&rsquo;ll personalize your options.
          </p>
        </header>

        {activeStage && <StageProgress activeStage={activeStage} />}

        <div className="rounded-2xl bg-white border border-gray-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,24,40,0.12)] p-6 sm:p-8">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes comparisonStep {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[comparisonStep_220ms_ease-out\\] { animation: none; }
        }
      `}</style>
    </div>
  );
}
