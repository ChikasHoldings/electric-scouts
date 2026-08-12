import { useState, useEffect } from "react";
import { AlertCircle, Headset, RefreshCw } from "lucide-react";
import { useAccent } from "./ComparisonShell";
import { PrimaryAction, SecondaryAction } from "./QuestionInputs";
import { ANALYSIS_STAGES, stageIndexAt } from "../engine/analysisTimeline";

/**
 * The analysis screen.
 *
 * Results used to appear the instant the last question was answered, which
 * read as a lookup rather than as analysis and made the matching feel
 * unearned. This holds the moment: a single ring drawing itself around the
 * brand mark while the copy names what the engine is actually doing.
 *
 * The ring carries no percentage. A percentage here would be invented, and an
 * invented one is exactly what makes a loader feel fake — so the animation
 * conveys motion and the text conveys progress.
 *
 * All timing comes from `analysisTimeline`; this file only draws.
 */

const RING_SIZE = 132;
const RING_STROKE = 3;
const RADIUS = (RING_SIZE - RING_STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Elapsed-time ticker.
 *
 * Drives the stage copy. Ticks four times a second — often enough that a stage
 * change lands on time, rare enough to be invisible on a battery.
 */
function useElapsed(active) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    const startedAt = Date.now();
    setElapsed(0);
    const id = setInterval(() => setElapsed(Date.now() - startedAt), 250);
    return () => clearInterval(id);
  }, [active]);

  return elapsed;
}

/**
 * The animated ring.
 *
 * Two arcs: a static track and a rotating segment. Under reduced motion the
 * rotation stops and the segment becomes a full, still ring — the screen keeps
 * its shape and meaning without any movement at all.
 */
function AnalysisRing({ accent }) {
  return (
    <span
      className="relative inline-flex items-center justify-center"
      style={{ width: RING_SIZE, height: RING_SIZE }}
    >
      <svg
        width={RING_SIZE}
        height={RING_SIZE}
        viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
        className="es-analysis-ring"
        aria-hidden="true"
      >
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          className="text-gray-200"
        />
        <circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE * 0.28} ${CIRCUMFERENCE}`}
          className={`es-analysis-arc ${accent.text}`}
        />
      </svg>

      {/* The mark at the centre gives the ring something to be about, and
          keeps the screen recognisably Electric Scouts rather than a generic
          spinner on a white card. */}
      <span
        className={`absolute inline-flex items-center justify-center w-[68px] h-[68px] rounded-full ${accent.softBg}`}
      >
        <span className={`es-analysis-bolt text-[26px] leading-none ${accent.text}`} aria-hidden="true">
          ⚡
        </span>
      </span>
    </span>
  );
}

/**
 * Recovery state.
 *
 * Never a dead spinner and never a stack trace: the two ways out are retrying
 * and talking to a person, and both are real.
 */
export function AnalysisFailed({ onRetry, onConcierge }) {
  return (
    <div className="py-8 text-center" role="alert">
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 mb-4">
        <AlertCircle className="w-5 h-5 text-amber-600" aria-hidden="true" />
      </span>

      <h2 className="text-[20px] font-semibold text-gray-900">
        We couldn&rsquo;t finish your comparison
      </h2>
      <p className="mt-2 text-[15px] text-gray-600 leading-relaxed max-w-md mx-auto">
        Your details are saved, so nothing is lost. Try again, or we can have
        someone look for options in your area and follow up.
      </p>

      <div className="mt-6 space-y-3 max-w-sm mx-auto">
        <PrimaryAction onClick={onRetry}>
          <span className="inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            Try again
          </span>
        </PrimaryAction>
        <SecondaryAction onClick={onConcierge}>
          <span className="inline-flex items-center gap-2">
            <Headset className="w-4 h-4" aria-hidden="true" />
            Get help finding a plan
          </span>
        </SecondaryAction>
      </div>
    </div>
  );
}

/**
 * @param {object} props
 * @param {boolean} [props.active]  whether the analysis is running
 * @param {string}  [props.name]    customer's display name, used once
 */
export default function AnalysisLoader({ active = true, name }) {
  const accent = useAccent();
  const elapsed = useElapsed(active);
  const index = stageIndexAt(elapsed);
  const stage = ANALYSIS_STAGES[index];

  return (
    <div className="py-10 sm:py-14 text-center">
      <AnalysisRing accent={accent} />

      <h2 className="mt-8 text-[21px] sm:text-[23px] font-semibold text-gray-900 tracking-[-0.015em]">
        {name ? `${name}, we're finding your matches` : "We're finding your matches"}
      </h2>

      {/*
        One polite live region for the whole sequence. Announcing each stage
        assertively would interrupt a screen reader user six times in five
        seconds; polite lets each message land in a gap.

        min-height reserves the two lines the longest message needs, so the
        heading above does not jump as the copy changes.
      */}
      <p
        className="mt-3 text-[15px] text-gray-600 min-h-[48px] flex items-center justify-center px-4"
        role="status"
        aria-live="polite"
      >
        <span key={stage.id} className="es-analysis-message">
          {stage.message}
        </span>
      </p>

      {/* Stage position, shown as marks rather than a percentage. Each mark is
          a stage that genuinely happened, so this is honest in a way a number
          would not be. */}
      <ul className="mt-5 flex items-center justify-center gap-1.5" aria-hidden="true">
        {ANALYSIS_STAGES.map((s, i) => (
          <li
            key={s.id}
            className={`h-1 rounded-full transition-all duration-500 ${
              i <= index ? `w-6 ${accent.solidBg}` : "w-3 bg-gray-200"
            }`}
          />
        ))}
      </ul>

      <style>{`
        @keyframes esAnalysisSpin { to { transform: rotate(360deg); } }
        @keyframes esAnalysisPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.85; }
        }
        @keyframes esAnalysisMessage {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .es-analysis-ring { transform-origin: center; }
        .es-analysis-arc {
          transform-origin: center;
          animation: esAnalysisSpin 1.4s linear infinite;
        }
        .es-analysis-bolt { animation: esAnalysisPulse 2s ease-in-out infinite; }
        .es-analysis-message { animation: esAnalysisMessage 400ms cubic-bezier(0.16,1,0.3,1); }

        @media (prefers-reduced-motion: reduce) {
          /* No movement at all: the arc becomes a complete, still ring so the
             screen keeps its shape and the copy still carries the progress. */
          .es-analysis-arc {
            animation: none;
            stroke-dasharray: none;
          }
          .es-analysis-bolt { animation: none; }
          .es-analysis-message { animation: none; }
        }
      `}</style>
    </div>
  );
}
