import { useState, useMemo } from "react";
import { Leaf, Check, ChevronDown, SlidersHorizontal, X, TrendingDown, TrendingUp } from "lucide-react";
import { useAccent } from "./ComparisonShell";
import { describeResultPrice, pricingCaveatText } from "../engine/resultsContract";
import ProviderLogo from "./ProviderLogo";

/**
 * The results board: three best matches, then a paginated list.
 *
 * Every number rendered here was decided by the server and arrives on the
 * result. This file chooses type sizes and colours; it does not compute a cost,
 * a saving, a score or an order. If a figure is missing from the result, the
 * right behaviour is to say so — never to fill the gap with a calculation.
 */

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * The headline price, formatted.
 *
 * Which figure to show and what to call it is decided by the shared contract,
 * not here — the comparison email asks the same function the same question, so
 * a plan cannot read "$105/mo" in an inbox and "$105/mo supply" on screen.
 */
function priceDisplay(result) {
  const described = describeResultPrice(result);
  if (!described) return null;
  return { ...described, amount: CURRENCY.format(described.amount) };
}

/** Partial pricing, stated the same way wherever a result is rendered. */
function PricingCaveatNote({ result, className = "" }) {
  const text = pricingCaveatText(result);
  if (!text) return null;
  return <p className={`text-[11.5px] text-amber-700 ${className}`}>{text}</p>;
}

/**
 * Rank badge.
 *
 * Carries its position in text as well as colour, so the ordering survives for
 * anyone who can't distinguish the tints.
 */
function RankBadge({ position, accent, label }) {
  const isTop = position === 1;
  // The label comes from the server's score band, not from the position. Those
  // two can contradict each other: when one unusually cheap plan is available
  // every other plan scores near the floor, and a badge reading "#1 Best match"
  // beside "38% match" tells the customer two different things. The position
  // says where it placed; the label says how well it actually fits.
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide ${
        isTop ? `${accent.solidBg} text-white` : `${accent.tintBg} ${accent.text}`
      }`}
    >
      #{position} {label}
    </span>
  );
}

/**
 * The outbound CTA.
 *
 * A real anchor, not a button calling window.open. That is what makes
 * middle-click, cmd-click and "open in new tab" behave, keeps it reachable by
 * keyboard, and stops a popup blocker eating the click. rel="noopener" denies
 * the opened page access to this one; "sponsored" is the correct signal for a
 * monetized outbound link.
 *
 * The results page stays open because target="_blank" opens a new tab.
 *
 * A plan with no configured destination renders a disabled control rather than
 * a dead link, so the customer is never sent nowhere.
 */
function ViewPlanCta({ href, onReferralClick, result, className }) {
  const label = (
    <>
      View plan
      <span className="sr-only">
        {" "}— {result.planName} from {result.providerName} (opens in a new tab)
      </span>
    </>
  );

  if (!href) {
    return (
      <span className={`${className} inline-flex items-center justify-center bg-gray-200 text-gray-500 cursor-not-allowed`}>
        Unavailable
        <span className="sr-only"> — no link configured for {result.planName}</span>
      </span>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      onClick={onReferralClick}
      className={`${className} inline-flex items-center justify-center bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6B35] focus-visible:ring-offset-2`}
    >
      {label}
    </a>
  );
}

/**
 * Match score.
 *
 * The number is carried in text, and the band label beside it repeats the
 * meaning in words — the score is never conveyed by colour alone.
 */
function MatchScore({ result, accent }) {
  if (!result.matchScore) return null;
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={`text-[15px] font-semibold tabular-nums ${accent.text}`}>
        {result.matchScore}%
      </span>
      <span className="text-[11.5px] text-gray-500">match</span>
    </span>
  );
}

/**
 * Current bill vs this plan.
 *
 * The server decides whether a comparison may be shown at all — it withholds
 * one unless both sides are trustworthy, which is why `monthlyDifference` is
 * null far more often than it is populated. Nothing is computed here; when the
 * server says nothing, this renders nothing.
 *
 * An unfavourable difference is stated as plainly as a saving. Hiding the
 * plans that cost more is what makes a comparison site untrustworthy.
 */
function SavingsBlock({ result, compact = false }) {
  const delta = result.monthlyDifference;
  if (delta === null || delta === undefined) return null;

  const direction = result.differenceDirection;
  const positive = direction === "saving";
  const negative = direction === "costlier";
  const monthly = Math.abs(delta);
  const annual = Math.abs(result.annualDifference ?? delta * 12);

  const headline = positive
    ? `Potential savings: $${monthly.toFixed(0)}/mo`
    : negative
      ? `Estimated difference: +$${monthly.toFixed(0)}/mo`
      : "About the same as your current bill";

  const annualLine = positive
    ? `≈ $${annual.toFixed(0)}/year`
    : negative
      ? `About $${annual.toFixed(0)}/year more`
      : null;

  // Direction is carried in words as well as colour, so the meaning never
  // rests on green-vs-amber alone.
  const srText = positive
    ? `Estimated saving of ${monthly.toFixed(0)} dollars per month`
    : negative
      ? `Estimated ${monthly.toFixed(0)} dollars per month more than your current bill`
      : "Estimated cost is about the same as your current bill";

  const Icon = positive ? TrendingDown : negative ? TrendingUp : null;

  return (
    <div
      className={`mt-3 rounded-xl px-3 py-2.5 ${
        positive
          ? "bg-[#0A7C52]/[0.06] ring-1 ring-inset ring-[#0A7C52]/15"
          : negative
            ? "bg-amber-50/70 ring-1 ring-inset ring-amber-200/60"
            : "bg-gray-50 ring-1 ring-inset ring-gray-200/70"
      }`}
    >
      <p
        className={`flex items-center gap-1.5 text-[13.5px] font-semibold ${
          positive ? "text-[#0A7C52]" : negative ? "text-amber-800" : "text-gray-700"
        }`}
      >
        {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />}
        {headline}
        <span className="sr-only">. {srText}</span>
      </p>
      {annualLine && <p className="mt-0.5 text-[12px] text-gray-600">{annualLine}</p>}
      {!compact && result.currentMonthlyCost !== null && (
        <dl className="mt-2 pt-2 border-t border-black/[0.06] grid grid-cols-2 gap-x-3 text-[11.5px]">
          <dt className="text-gray-500">Current bill</dt>
          <dd className="text-right text-gray-700 tabular-nums">
            {CURRENCY.format(result.currentMonthlyCost)}/mo
          </dd>
          <dt className="text-gray-500 mt-0.5">With this plan</dt>
          <dd className="text-right text-gray-700 tabular-nums mt-0.5">
            {CURRENCY.format(result.estimatedMonthlyCost)}/mo
          </dd>
        </dl>
      )}
    </div>
  );
}

/**
 * One of the three best matches.
 *
 * Squarer and taller than a list row so the three sit as a set on desktop, with
 * the reasons — which are the whole point of a "best match" — given real space.
 */
export function BestMatchCard({ result, position, usageKwh, href, onReferralClick, onDetails, isSponsored, provider }) {
  const accent = useAccent();
  const price = priceDisplay(result);
  const renewable = Number(result.renewablePercentage) || 0;
  const reasons = result.matchReasons || [];

  return (
    <article
      // h-full, not just flex-col: the grid item is the wrapper that also holds
      // the details panel, so without this the card sizes to its own content
      // and the three cards in a row end up different heights whenever one has
      // more match reasons than another.
      className={`flex flex-col h-full rounded-2xl border bg-white p-5 transition-shadow ${
        position === 1
          ? `${accent.border} shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_28px_-14px_rgba(16,24,40,0.22)]`
          : "border-gray-200 hover:shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_24px_-14px_rgba(16,24,40,0.18)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <RankBadge position={position} accent={accent} label={result.matchLabel} />
        {isSponsored && (
          <span className="text-[10px] font-medium text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">
            Sponsored
          </span>
        )}
      </div>

      <div className="mt-4 flex items-start gap-3">
        <ProviderLogo provider={provider} name={result.providerName} eager />
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] text-gray-500 truncate">{result.providerName}</p>
          <h3 className="mt-0.5 text-[15.5px] font-semibold text-gray-900 leading-snug">
            {result.planName}
          </h3>
        </div>
      </div>

      <div className="mt-3">
        <MatchScore result={result} accent={accent} />
      </div>

      <div className="mt-4">
        {price ? (
          <>
            <p className="text-[28px] font-semibold text-gray-900 leading-none tracking-[-0.02em]">
              {price.amount}
              <span className="text-[14px] font-medium text-gray-500 ml-1">{price.unit}</span>
            </p>
            <p className="mt-1.5 text-[12px] text-gray-500">
              at {Math.round(usageKwh).toLocaleString()} kWh
            </p>
            <PricingCaveatNote result={result} className="mt-1" />
          </>
        ) : (
          <>
            <p className="text-[24px] font-semibold text-gray-900 leading-none tracking-[-0.02em]">
              {Number(result.ratePerKwh).toFixed(1)}
              <span className="text-[14px] font-medium text-gray-500 ml-0.5">¢/kWh</span>
            </p>
            <PricingCaveatNote result={result} className="mt-1.5" />
          </>
        )}
      </div>

      <SavingsBlock result={result} />

      {reasons.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {reasons.map((reason) => (
            <li key={reason} className="flex items-start gap-2 text-[12.5px] text-gray-700">
              <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${accent.text}`} strokeWidth={3} aria-hidden="true" />
              {reason}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-600">
        {result.termMonths > 0 && <span>{result.termMonths} mo term</span>}
        {result.rateType && <span className="capitalize">{result.rateType}</span>}
        {renewable > 0 && (
          <span className="inline-flex items-center gap-1 text-[#0A7C52]">
            <Leaf className="w-3 h-3" aria-hidden="true" />
            {renewable}%
          </span>
        )}
      </div>

      {/* flex-shrink-0 matters: in a stretched grid row the card with the most
          content would otherwise squeeze its own buttons, leaving the three
          CTAs at different heights across the set. */}
      <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-2 flex-shrink-0">
        <ViewPlanCta
          href={href}
          onReferralClick={onReferralClick}
          result={result}
          className="h-11 rounded-lg text-[14px]"
        />
        <button
          type="button"
          onClick={() => onDetails(result)}
          className={`h-9 rounded-lg border border-gray-300 bg-white text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 ${accent.focus}`}
        >
          Plan details
          <span className="sr-only"> for {result.planName}</span>
        </button>
      </div>
    </article>
  );
}

/** A row in the "more options" list. */
export function PlanRow({ result, href, onReferralClick, onDetails, isSponsored, provider }) {
  const accent = useAccent();
  const price = priceDisplay(result);
  const renewable = Number(result.renewablePercentage) || 0;

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 transition-shadow hover:shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_20px_-12px_rgba(16,24,40,0.16)]">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <ProviderLogo provider={provider} name={result.providerName} size="sm" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[12.5px] text-gray-500">{result.providerName}</p>
            <MatchScore result={result} accent={accent} />
            {isSponsored && (
              <span className="text-[10px] font-medium text-gray-500 border border-gray-200 rounded-full px-1.5 py-0.5">
                Sponsored
              </span>
            )}
          </div>
          <h3 className="mt-0.5 text-[15px] font-semibold text-gray-900 leading-snug">
            {result.planName}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-gray-600">
            {result.termMonths > 0 && <span>{result.termMonths} mo term</span>}
            {result.rateType && <span className="capitalize">{result.rateType}</span>}
            {renewable > 0 && (
              <span className="inline-flex items-center gap-1 text-[#0A7C52]">
                <Leaf className="w-3 h-3" aria-hidden="true" />
                {renewable}% renewable
              </span>
            )}
          </div>
          {/* The partial-pricing caveat belongs on every result, not only the
              headline three. A customer scrolling the list is comparing these
              figures with each other and with the cards above. */}
          <PricingCaveatNote result={result} className="mt-1.5 sm:hidden" />
        </div>

        <div className="sm:text-right sm:w-36 flex-shrink-0">
          {price ? (
            <>
              <p className="text-[20px] font-semibold text-gray-900 leading-none">
                {price.amount}
                <span className="text-[12px] font-medium text-gray-500 ml-0.5">
                  {price.basis === "supply" ? "/mo supply" : "/mo"}
                </span>
              </p>
              <p className="mt-1 text-[11.5px] text-gray-500">
                {Number(result.ratePerKwh).toFixed(1)}¢/kWh
              </p>
            </>
          ) : (
            <p className="text-[20px] font-semibold text-gray-900 leading-none">
              {Number(result.ratePerKwh).toFixed(1)}
              <span className="text-[12px] font-medium text-gray-500 ml-0.5">¢</span>
            </p>
          )}
          <PricingCaveatNote result={result} className="mt-1 hidden sm:block" />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <ViewPlanCta
            href={href}
            onReferralClick={onReferralClick}
            result={result}
            className="h-10 px-4 rounded-lg text-[13.5px] whitespace-nowrap"
          />
          <button
            type="button"
            onClick={() => onDetails(result)}
            className={`h-10 px-3 rounded-lg border border-gray-300 bg-white text-[13px] text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 ${accent.focus}`}
          >
            Details
            <span className="sr-only"> for {result.planName}</span>
          </button>
        </div>
      </div>

      <SavingsBlock result={result} compact />
    </article>
  );
}

/**
 * Plan detail panel.
 *
 * Shows the cost breakdown and the caveats the pricing engine produced, so the
 * customer understands the estimate before they click through to a provider.
 */
export function PlanDetails({ result, usageKwh, onClose }) {
  const accent = useAccent();
  const components = result.costComponents || {};

  const rows = [
    components.energy && {
      label: `Energy at ${Math.round(usageKwh).toLocaleString()} kWh`,
      value: CURRENCY.format(components.energy),
    },
    components.baseCharge && {
      label: "Monthly base charge",
      value: CURRENCY.format(components.baseCharge),
    },
    components.delivery && {
      label: "Utility delivery",
      value: CURRENCY.format(components.delivery),
    },
    components.usageCredit && {
      label: "Bill credit",
      value: `−${CURRENCY.format(Math.abs(components.usageCredit))}`,
    },
  ].filter(Boolean);

  // Named for what it is. A supply-only subtotal presented as "Estimated
  // monthly" is the exact misreading this panel exists to prevent.
  const total =
    result.estimatedMonthlyCost !== null && result.estimatedMonthlyCost !== undefined
      ? { label: "Estimated monthly", value: result.estimatedMonthlyCost }
      : result.supplyEstimate !== null && result.supplyEstimate !== undefined
        ? { label: "Estimated supply subtotal", value: result.supplyEstimate }
        : null;

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5 mt-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[12.5px] text-gray-500">{result.providerName}</p>
          <h4 className="text-[15px] font-semibold text-gray-900">{result.planName}</h4>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close plan details"
          className={`p-1.5 rounded-lg hover:bg-gray-200/70 transition-colors focus:outline-none focus-visible:ring-2 ${accent.focus}`}
        >
          <X className="w-4 h-4 text-gray-600" aria-hidden="true" />
        </button>
      </div>

      {rows.length > 0 && (
        <dl className="mt-4 space-y-2">
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-4 text-[13px]">
              <dt className="text-gray-600">{row.label}</dt>
              <dd className="text-gray-900 font-medium">{row.value}</dd>
            </div>
          ))}
          {total && (
            <div className="flex justify-between gap-4 text-[13.5px] pt-2 border-t border-gray-200">
              <dt className="text-gray-900 font-semibold">{total.label}</dt>
              <dd className="text-gray-900 font-semibold">{CURRENCY.format(total.value)}</dd>
            </div>
          )}
        </dl>
      )}

      <PricingCaveatNote result={result} className="mt-3" />

      <dl className="mt-4 pt-4 border-t border-gray-200 space-y-2 text-[13px]">
        {result.termMonths > 0 && (
          <Detail label="Contract term" value={`${result.termMonths} months`} />
        )}
        {result.rateType && <Detail label="Rate type" value={result.rateType} capitalize />}
        {Number(result.renewablePercentage) > 0 && (
          <Detail label="Renewable content" value={`${result.renewablePercentage}%`} />
        )}
        {Number(result.earlyTerminationFee) > 0 && (
          <Detail
            label="Early termination fee"
            value={CURRENCY.format(result.earlyTerminationFee)}
          />
        )}
        {Number(result.usageCredit) > 0 && (
          <Detail
            label="Bill credit"
            value={`${CURRENCY.format(result.usageCredit)} at ${Number(result.usageCreditThreshold || 0).toLocaleString()} kWh+`}
          />
        )}
      </dl>

      {result.pricingCaveats?.length > 0 && (
        <ul className="mt-4 pt-4 border-t border-gray-200 space-y-1.5">
          {result.pricingCaveats.map((caveat) => (
            <li key={caveat} className="text-[12px] text-gray-600 leading-relaxed">
              {caveat}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Detail({ label, value, capitalize }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-gray-600">{label}</dt>
      <dd className={`text-gray-900 font-medium ${capitalize ? "capitalize" : ""}`}>{value}</dd>
    </div>
  );
}

export const SORT_OPTIONS = [
  { value: "best", label: "Best match" },
  { value: "cost", label: "Lowest monthly cost" },
  { value: "rate", label: "Lowest rate" },
  { value: "term_short", label: "Shortest term" },
  { value: "term_long", label: "Longest term" },
  { value: "renewable", label: "Most renewable" },
];

/**
 * Filters and sort.
 *
 * Filter options are built from the plans actually in the result set, so the
 * control can never offer a provider or a term that returns nothing.
 */
export function ResultsToolbar({ results, filters, onFilterChange, sort, onSortChange, resultCount }) {
  const accent = useAccent();
  const [open, setOpen] = useState(false);

  const providers = useMemo(
    () => [...new Set(results.map((r) => r.providerName).filter(Boolean))].sort(),
    [results]
  );
  const terms = useMemo(
    () => [...new Set(results.map((r) => Number(r.termMonths)).filter((t) => t > 0))]
      .sort((a, b) => a - b),
    [results]
  );
  const planTypes = useMemo(
    () => [...new Set(results.map((r) => r.rateType).filter(Boolean))].sort(),
    [results]
  );

  const activeCount = [
    filters.provider !== "all",
    filters.term !== "all",
    filters.planType !== "all",
    filters.renewableOnly,
  ].filter(Boolean).length;

  const clear = () =>
    onFilterChange({ provider: "all", term: "all", planType: "all", renewableOnly: false });

  return (
    <div className="mb-5">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="results-filters"
          className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-[13px] font-medium transition-colors focus:outline-none focus-visible:ring-2 ${accent.focus} ${
            activeCount > 0
              ? `${accent.border} ${accent.softBg} ${accent.text}`
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
          Filters
          {activeCount > 0 && <span className="font-semibold">({activeCount})</span>}
        </button>

        <label className="sr-only" htmlFor="results-sort">Sort results</label>
        <select
          id="results-sort"
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className={`h-9 rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-[13px] text-gray-700 focus:outline-none focus:ring-2 ${accent.focus}`}
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              Sort: {option.label}
            </option>
          ))}
        </select>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={clear}
            className="h-9 px-3 rounded-lg text-[13px] text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
          >
            Clear filters
          </button>
        )}

        <p className="ml-auto text-[13px] text-gray-500" aria-live="polite">
          {resultCount} {resultCount === 1 ? "plan" : "plans"}
        </p>
      </div>

      {open && (
        <div
          id="results-filters"
          className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-gray-200 bg-white p-4"
        >
          <Select
            id="filter-provider"
            label="Provider"
            value={filters.provider}
            onChange={(v) => onFilterChange({ ...filters, provider: v })}
            options={[{ value: "all", label: "Any provider" },
              ...providers.map((p) => ({ value: p, label: p }))]}
            accent={accent}
          />
          <Select
            id="filter-term"
            label="Contract term"
            value={filters.term}
            onChange={(v) => onFilterChange({ ...filters, term: v })}
            options={[{ value: "all", label: "Any term" },
              ...terms.map((t) => ({ value: String(t), label: `${t} months` }))]}
            accent={accent}
          />
          <Select
            id="filter-plan-type"
            label="Rate type"
            value={filters.planType}
            onChange={(v) => onFilterChange({ ...filters, planType: v })}
            options={[{ value: "all", label: "Any rate type" },
              ...planTypes.map((t) => ({ value: t, label: t[0].toUpperCase() + t.slice(1) }))]}
            accent={accent}
          />

          <label className="flex items-center gap-2.5 sm:col-span-3 text-[13.5px] text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.renewableOnly}
              onChange={(e) => onFilterChange({ ...filters, renewableOnly: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-[#0A7C52] focus:ring-2 focus:ring-[#0A7C52]"
            />
            Renewable plans only (50% or more)
          </label>
        </div>
      )}
    </div>
  );
}

function Select({ id, label, value, onChange, options, accent }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-medium text-gray-600 mb-1.5">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full h-9 rounded-lg border border-gray-300 bg-white pl-3 pr-8 text-[13px] text-gray-700 focus:outline-none focus:ring-2 ${accent.focus}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
}

/** Real button, not a scroll sentinel — keyboard users need to reach it. */
export function ViewMoreButton({ remaining, onClick }) {
  const accent = useAccent();
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full h-12 mt-4 rounded-xl border border-gray-300 bg-white text-[14.5px] font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 ${accent.focus} focus-visible:ring-offset-2`}
    >
      Show more plans
      <span className="text-gray-500 font-normal"> ({remaining} more)</span>
    </button>
  );
}

export { ChevronDown };
