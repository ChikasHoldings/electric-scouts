import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Loader2, Leaf, ChevronDown, ArrowRight, Headset } from "lucide-react";
import { PrimaryAction, SecondaryAction } from "./QuestionInputs";

/**
 * Results, and the states that stand in for results when there aren't any.
 *
 * Commercial deliberately never renders consumer-style pricing: business supply
 * is quoted against a load profile, so showing an instant per-kWh figure would
 * be a number we cannot stand behind.
 */

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const NUMBER = new Intl.NumberFormat("en-US");

/** Brief transition so results don't appear without warning. */
export function MatchingState() {
  return (
    <div className="py-10 text-center" role="status" aria-live="polite">
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0A5C8C]/10 mb-4">
        <Loader2 className="w-5 h-5 text-[#0A5C8C] animate-spin" aria-hidden="true" />
      </span>
      <p className="text-[17px] font-semibold text-gray-900">
        Finding your electricity options…
      </p>
      <p className="mt-1.5 text-[14px] text-gray-600">
        Matching your usage against plans available in your area.
      </p>
    </div>
  );
}

/**
 * One plan.
 *
 * Secondary detail sits behind a disclosure so the card stays scannable — the
 * rate, the estimated monthly cost and the term are what a visitor compares on.
 */
export function PlanCard({ plan, estimatedMonthly, onSelect, isSponsored }) {
  const [expanded, setExpanded] = useState(false);
  const renewable = Number(plan.renewable_percentage) || 0;

  return (
    <article className="rounded-xl border border-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_20px_-12px_rgba(16,24,40,0.16)]">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] text-gray-500">{plan.provider_name}</p>
            <h3 className="mt-0.5 text-[16px] font-semibold text-gray-900 leading-snug">
              {plan.plan_name}
            </h3>
          </div>
          {isSponsored && (
            // Disclosed rather than dressed up as a ranking signal.
            <span className="flex-shrink-0 text-[11px] font-medium text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">
              Sponsored
            </span>
          )}
        </div>

        <div className="mt-4 flex items-end gap-5">
          <div>
            <p className="text-[26px] font-semibold text-gray-900 leading-none tracking-[-0.02em]">
              {Number(plan.rate_per_kwh).toFixed(1)}
              <span className="text-[15px] font-medium text-gray-500 ml-0.5">¢/kWh</span>
            </p>
          </div>
          {estimatedMonthly > 0 && (
            <div className="pb-0.5">
              <p className="text-[13px] text-gray-500">
                ~{CURRENCY.format(estimatedMonthly)}/mo estimated
              </p>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-gray-600">
          {plan.contract_length > 0 && <span>{plan.contract_length} month term</span>}
          {plan.plan_type && <span className="capitalize">{plan.plan_type} rate</span>}
          {renewable > 0 && (
            <span className="inline-flex items-center gap-1 text-[#0A7C52]">
              <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
              {renewable}% renewable
            </span>
          )}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelect(plan)}
            className="flex-1 h-11 rounded-lg bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-[14px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2"
          >
            View plan
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1 text-[13px] text-gray-600 hover:text-gray-900 transition-colors px-2 py-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5C8C]"
          >
            Details
            <ChevronDown
              className={`w-4 h-4 transition-transform ${expanded ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>

      {expanded && (
        <dl className="border-t border-gray-100 bg-gray-50/60 px-5 py-4 space-y-2 text-[13px]">
          {plan.monthly_base_charge > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Monthly base charge</dt>
              <dd className="text-gray-900">{CURRENCY.format(plan.monthly_base_charge)}</dd>
            </div>
          )}
          {plan.early_termination_fee > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-gray-500">Early termination fee</dt>
              <dd className="text-gray-900">{CURRENCY.format(plan.early_termination_fee)}</dd>
            </div>
          )}
          <p className="pt-1 text-[12px] text-gray-500 leading-relaxed">
            Rates and plan details vary by ZIP code, usage and credit. Confirm
            all details with the provider before enrolling.
          </p>
        </dl>
      )}
    </article>
  );
}

/** A short, useful filter row — not a spreadsheet of controls. */
export function ResultsFilters({ termFilter, onTermChange, renewableOnly, onRenewableChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <label className="sr-only" htmlFor="term-filter">Contract term</label>
      <select
        id="term-filter"
        value={termFilter}
        onChange={(e) => onTermChange(e.target.value)}
        className="h-9 rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-[13px] text-gray-700 focus:outline-none focus:border-[#0A5C8C] focus:ring-2 focus:ring-[#0A5C8C]/20"
      >
        <option value="all">Any term</option>
        <option value="12">12 months</option>
        <option value="24">24 months</option>
        <option value="month">Month to month</option>
      </select>

      <button
        type="button"
        onClick={() => onRenewableChange(!renewableOnly)}
        aria-pressed={renewableOnly}
        className={`h-9 rounded-lg border px-3 text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5C8C] ${
          renewableOnly
            ? "border-[#0A7C52] bg-[#0A7C52]/[0.06] text-[#0A7C52]"
            : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        Renewable only
      </button>
    </div>
  );
}

/**
 * No instant match.
 *
 * Never a dead end: every path out of here is a real thing Electric Scouts can
 * do next for this visitor.
 */
export function NoMatchState({ zip, onConcierge, onBroaden }) {
  return (
    <div className="text-center py-4">
      <h2 className="text-[20px] font-semibold text-gray-900">
        We don&rsquo;t have an instant match for {zip || "this location"} yet
      </h2>
      <p className="mt-2 text-[15px] text-gray-600 leading-relaxed max-w-md mx-auto">
        Your details are saved. We can have someone look for options in your area
        and follow up, or you can browse the plans we do list nearby.
      </p>

      <div className="mt-6 space-y-3 max-w-sm mx-auto">
        <PrimaryAction onClick={onConcierge}>Help me find an option</PrimaryAction>
        <SecondaryAction onClick={onBroaden}>Compare other plans</SecondaryAction>
      </div>
    </div>
  );
}

/**
 * Commercial completion.
 *
 * The honest end state for business supply: the request is captured and a
 * person picks it up. No invented commercial pricing.
 */
export function CommercialComplete({ state, qualification }) {
  return (
    <div className="text-center py-4">
      <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#0A5C8C]/10 mb-4">
        <Headset className="w-5 h-5 text-[#0A5C8C]" aria-hidden="true" />
      </span>

      <h2 className="text-[20px] font-semibold text-gray-900">
        Your business electricity request is ready
      </h2>
      <p className="mt-2 text-[15px] text-gray-600 leading-relaxed max-w-md mx-auto">
        We&rsquo;re matching your business with electricity options based on your
        location, usage and timing.
      </p>

      <dl className="mt-6 mx-auto max-w-sm rounded-xl border border-gray-200 divide-y divide-gray-100 text-left overflow-hidden">
        {state.businessName && (
          <Row label="Business" value={state.businessName} />
        )}
        <Row label="Location" value={[state.city, state.state].filter(Boolean).join(", ") || state.zip} />
        {state.monthlyUsageKwh > 0 && (
          <Row label="Monthly usage" value={`${NUMBER.format(Math.round(state.monthlyUsageKwh))} kWh`} />
        )}
        {state.monthlyCost > 0 && (
          <Row label="Monthly spend" value={CURRENCY.format(state.monthlyCost)} />
        )}
      </dl>

      <p className="mt-6 text-[13px] text-gray-500">
        {qualification === "hot"
          ? "A specialist will be in touch shortly."
          : "We'll follow up by email as options become available."}
      </p>

      <div className="mt-6 max-w-sm mx-auto">
        <Link to={createPageUrl("BusinessElectricity")}>
          <SecondaryAction onClick={() => {}}>
            Read about business electricity
          </SecondaryAction>
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-3">
      <dt className="text-[13px] text-gray-500">{label}</dt>
      <dd className="text-[15px] font-medium text-gray-900 text-right">{value}</dd>
    </div>
  );
}

/** Renewable requested, none available — offer the nearest real thing. */
export function RenewableFallback({ onConcierge, onShowAll }) {
  return (
    <div className="rounded-xl border border-[#0A7C52]/25 bg-[#0A7C52]/[0.04] p-5 mb-6">
      <p className="text-[15px] font-medium text-gray-900">
        No fully renewable plans are listed for your area right now
      </p>
      <p className="mt-1.5 text-[14px] text-gray-600 leading-relaxed">
        We can look for a green option on your behalf, or you can compare the
        plans that are available today.
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
        <button
          type="button"
          onClick={onConcierge}
          className="h-10 px-4 rounded-lg bg-[#0A7C52] hover:bg-[#086641] text-white text-[14px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A7C52] focus-visible:ring-offset-2 inline-flex items-center justify-center gap-1.5"
        >
          Find me a green option
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onShowAll}
          className="h-10 px-4 rounded-lg border border-gray-300 bg-white text-[14px] font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5C8C]"
        >
          Show all plans
        </button>
      </div>
    </div>
  );
}
