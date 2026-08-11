import { useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Loader2, MapPin } from "lucide-react";

import {
  buildCompareUrl,
  checkServiceZip,
  landingSeed,
  SERVICE_INTENTS,
} from "@/components/compare/engine/entryContext";
import { seedLocalSession } from "@/components/compare/engine/persistence";
import { captureAttributionFromWindow, campaignContext } from "@/components/compare/engine/attribution";
import { track, EVENTS, LANDING_EVENTS } from "@/components/compare/engine/analytics";

/**
 * The ZIP conversion control on every service landing page.
 *
 * One component, because a landing page's job is to qualify intent and hand
 * over — not to run its own comparison. On submit it validates the ZIP with the
 * same serviceability check the engine uses, opens (or continues) the
 * comparison session with what this page already knows, and navigates to
 * /compare-rates. The engine then skips the questions that session answers.
 *
 * Tone is per page, behaviour is not: the accent colour changes, the
 * validation, the events and the handoff do not.
 */

const ACCENTS = {
  /** Residential — the site's primary blue, with the standard orange CTA. */
  residential: {
    icon: "text-[#0A5C8C]",
    ring: "focus-within:border-[#0A5C8C] focus-within:ring-[#0A5C8C]/20",
    button: "bg-[#FF6B35] hover:bg-[#e55a2b] focus-visible:ring-[#FF6B35]",
  },
  /** Commercial — deep blue throughout, closer to a business tool than a promo. */
  commercial: {
    icon: "text-[#0A5C8C]",
    ring: "focus-within:border-[#0A5C8C] focus-within:ring-[#0A5C8C]/20",
    button: "bg-[#0A5C8C] hover:bg-[#084a6f] focus-visible:ring-[#0A5C8C]",
  },
  /** Renewable — green, matching the rest of that page. */
  renewable: {
    icon: "text-green-700",
    ring: "focus-within:border-green-600 focus-within:ring-green-600/20",
    button: "bg-green-700 hover:bg-green-800 focus-visible:ring-green-700",
  },
};

export default function ZipHandoffForm({
  service,
  ctaLabel,
  label = "ZIP code",
  hint,
  placeholder = "77001",
  className = "",
}) {
  const navigate = useNavigate();
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const [zip, setZip] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // A second submit while the first is still navigating would open a second
  // session and fire a second handoff event for one visitor.
  const submittedRef = useRef(false);

  const accent = ACCENTS[service] || ACCENTS.residential;
  const intent = SERVICE_INTENTS[service];
  const events = LANDING_EVENTS[service];

  const handleSubmit = (event) => {
    event.preventDefault();
    if (submittedRef.current) return;

    const result = checkServiceZip(zip);

    if (!result.valid) {
      setError(result.message);
      track(EVENTS.LANDING_ZIP_REJECTED, {
        service,
        entry_context: intent?.entryContext,
        reason: result.reason,
      });
      return;
    }

    submittedRef.current = true;
    setSubmitting(true);
    setError("");

    // Read once here as well as on page view: a visitor who lands with UTM
    // parameters and converts immediately must carry that campaign into the
    // engine, and from there onto the lead.
    const attribution = captureAttributionFromWindow();
    const seed = landingSeed(service, result);
    seedLocalSession({ ...seed, attribution });

    const context = {
      service,
      entry_context: intent?.entryContext,
      state: result.state,
      zip: result.zip,
      ...campaignContext(attribution),
    };
    track(events?.zipSubmitted, context);
    track(EVENTS.LANDING_COMPARISON_HANDOFF, context);

    navigate(buildCompareUrl(service, result.zip));
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={className}>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>

      {/* Wraps rather than switching at a breakpoint: this form sits in a
          full-width hero on one page and in a 400px card on another, so what
          matters is the space it actually has, not the width of the viewport.
          When the field and the CTA cannot sit side by side they stack, each
          full width — which is also the right answer on a 320px screen. */}
      <div className="flex flex-wrap gap-2.5">
        <div
          className={`flex items-center gap-2.5 flex-1 basis-[9rem] min-w-0 h-12 px-4 rounded-xl border bg-white transition-colors focus-within:ring-2 ${
            error ? "border-red-400 focus-within:border-red-500 focus-within:ring-red-200" : `border-gray-300 ${accent.ring}`
          }`}
        >
          <MapPin className={`w-[18px] h-[18px] flex-shrink-0 ${accent.icon}`} aria-hidden="true" />
          <input
            id={inputId}
            name="zip"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            pattern="[0-9]*"
            maxLength={5}
            placeholder={placeholder}
            value={zip}
            onChange={(event) => {
              setZip(event.target.value.replace(/\D/g, "").slice(0, 5));
              if (error) setError("");
            }}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? errorId : hint ? hintId : undefined}
            // 16px keeps iOS from zooming the viewport on focus.
            className="w-full min-w-0 h-12 bg-transparent text-[16px] text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          // From sm upwards the label stays on one line, which makes the button
          // wide enough that the row wraps instead — field above, button below.
          // On a phone a long label ("Compare Renewable Electricity") cannot fit
          // on one line at all, so there it wraps inside a button that grows
          // rather than overflowing the page or clipping the words.
          className={`min-h-12 px-5 sm:px-6 py-3 flex-1 basis-[13rem] rounded-xl text-white text-[15px] font-semibold leading-tight whitespace-normal sm:whitespace-nowrap transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-70 ${accent.button}`}
        >
          <span className="flex items-center justify-center gap-2 text-center">
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            )}
            {submitting ? "Loading your options…" : ctaLabel}
          </span>
        </button>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-[13px] text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-2 text-[13px] text-gray-500">
          {hint}
        </p>
      ) : null}
    </form>
  );
}
