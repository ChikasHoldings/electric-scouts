import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Upload, FileText, Zap, TrendingDown, Clock, Leaf,
  CheckCircle, AlertCircle, DollarSign, ArrowRight, Edit3,
  BarChart3, Percent, Mail, Loader2,
} from "lucide-react";

import { UploadFile, ExtractDataFromUploadedFile } from "@/api/supabaseIntegrations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead, { getBreadcrumbSchema, getFAQSchema } from "../components/SEOHead";
import ProviderLogo from "../components/compare/ui/ProviderLogo";
import { getCityFromZip } from "../components/compare/providerAvailability";
import { promptFor, mapExtractionToState } from "../components/compare/engine/billAnalysis";
import { CUSTOMER_TYPES } from "../components/compare/engine/comparisonState";
import {
  COMPARE_PATH,
  ENTRY_CONTEXTS,
  checkServiceZip,
} from "../components/compare/engine/entryContext";
import { getOrCreateSessionId } from "../components/compare/engine/persistence";
import { track, EVENTS } from "../components/compare/engine/analytics";
import {
  describeResultPrice,
  pricingCaveatText,
  selectHeadline,
  withResultPlacement,
  RESULT_SECTIONS,
  MONETIZATION,
} from "../components/compare/engine/resultsContract";
import { validateEmail, validateFirstName } from "@/lib/contactValidation";
import { scrollToTopInstantly, writeStored, readStored, removeStored } from "@/lib/browser";

/**
 * /bill-analyzer — read a bill, then price the market against it.
 *
 * This page used to be its own comparison engine, and it disagreed with the
 * real one on every number it produced:
 *
 *   - it priced plans as `rate × usage + base charge`, ignoring utility
 *     delivery, bill credits and credit thresholds — the third of the three
 *     pricing algorithms this codebase has since collapsed into one;
 *   - it subtracted that supply-only figure from the customer's FULL bill and
 *     printed the difference as annual savings, so every saving it reported was
 *     overstated by roughly the delivery charge;
 *   - it scored the customer's rate against every plan row in the database —
 *     all twelve states, business plans, deactivated plans — so "you are
 *     overpaying by 34%" was measured against a plan they could not buy;
 *   - it listed plans straight from `ElectricityPlan.list()`, which applies
 *     neither the plan's own `is_active` nor its provider's; and
 *   - it built provider links in the browser from raw affiliate URLs.
 *
 * None of that happens here now. The page reads a bill, confirms the figures
 * with the visitor, and posts them to /api/comparison — the same endpoint
 * /compare-rates calls. Prices, ranking, match scores, savings, the market
 * benchmark and the outbound routes all arrive decided. What is left in this
 * file is presentation, which is all a comparison page should ever have been.
 */

const SESSION_KEY = "electricscouts_bill_analyzer";

/** Steps this page walks. Results are a destination, not a fourth form step. */
const STEPS = {
  UPLOAD: "upload",
  REVIEW: "review",
  RESULTS: "results",
};

const CURRENCY = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const NUMBER = new Intl.NumberFormat("en-US");

/**
 * What the analyzer keeps about a bill.
 *
 * Deliberately the same shape `mapExtractionToState` produces, which is the
 * module that already decides what a bill is allowed to contribute — and which
 * drops the account number, the customer name and the service address. The
 * analyzer holding its own richer copy is exactly how those fields ended up in
 * session storage, on screen and in an outbound email.
 */
function emptyBill() {
  return {
    zip: "",
    monthlyUsageKwh: null,
    monthlyCost: null,
    effectiveRate: null,
    currentProvider: "",
    currentPlan: "",
    confidence: "low",
    unverified: [],
  };
}

// ─── Session storage ────────────────────────────────────────────
//
// Only the confirmed bill figures are cached, so a reload resumes without
// re-uploading. The file itself is never stored, and neither is anything that
// identifies the account it came from.

function saveToSession(bill) {
  try {
    writeStored(SESSION_KEY, JSON.stringify(bill), { session: true });
  } catch {
    /* private mode or quota — resuming is a convenience, not a requirement */
  }
}

/**
 * Restore a cached bill, or nothing.
 *
 * Deliberately strict about what counts as restorable. This key previously held
 * a different shape — a raw extraction plus precomputed recommendations and
 * scores — and a returning visitor still carrying one would otherwise be
 * restored straight to a results screen with no ZIP and no usage to compare on.
 * Anything that is not a bill we could actually run a comparison for is
 * discarded, and the visitor starts at the upload step as if new.
 */
function loadFromSession() {
  try {
    const raw = readStored(SESSION_KEY, { session: true });
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return null;

    const restored = { ...emptyBill(), ...parsed };
    return isComparable(restored) ? restored : null;
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    removeStored(SESSION_KEY, { session: true });
  } catch {
    /* ignore */
  }
}

/**
 * Carry the analysis into the comparison engine.
 *
 * Usage and the current bill are exactly what /compare-rates would otherwise
 * ask for, so they travel with the visitor and those questions disappear. The
 * cost matters as much as the usage: without it every result arrives with its
 * savings line withheld for "no current bill", which is the one thing somebody
 * who just analysed a bill has most obviously already told us.
 */
function compareUrlFromBill(bill) {
  const params = new URLSearchParams();

  const zip = String(bill?.zip || "").replace(/\D/g, "").slice(0, 5);
  if (zip.length === 5) params.set("zip", zip);

  const usage = Number(bill?.monthlyUsageKwh);
  if (Number.isFinite(usage) && usage > 0) params.set("usage", String(Math.round(usage)));

  const cost = Number(bill?.monthlyCost);
  if (Number.isFinite(cost) && cost > 0) params.set("cost", cost.toFixed(2));

  const provider = String(bill?.currentProvider || "").trim();
  if (provider) params.set("provider", provider.slice(0, 120));

  params.set("entry", ENTRY_CONTEXTS.BILL_ANALYZER);
  return `${COMPARE_PATH}?${params.toString()}`;
}

/** A bill is comparable once we know where it is and how much it used. */
function isComparable(bill) {
  return Boolean(
    bill &&
    String(bill.zip || "").length === 5 &&
    Number(bill.monthlyUsageKwh) > 0
  );
}

// ─── Market position gauge ──────────────────────────────────────

/**
 * Where the visitor's bill sits in their own market.
 *
 * The number is the server's percentile — the share of the plans available at
 * their address that their current bill already beats — and nothing here
 * recomputes or reweights it. The previous gauge blended a percentile, a range
 * position and an average bonus into a composite nobody could explain, over a
 * plan set that included states the visitor cannot buy in.
 */
function MarketPositionGauge({ benchmark }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const score = benchmark.score;
  const offset = circumference - (score / 100) * circumference;

  const tone =
    score >= 75 ? { stroke: "#16a34a", bg: "from-green-50 to-white", text: "text-green-600" }
      : score >= 50 ? { stroke: "#2563eb", bg: "from-blue-50 to-white", text: "text-blue-600" }
        : score >= 25 ? { stroke: "#f59e0b", bg: "from-amber-50 to-white", text: "text-amber-600" }
          : { stroke: "#ef4444", bg: "from-red-50 to-white", text: "text-red-600" };

  return (
    <Card className={`border-2 border-gray-200 bg-gradient-to-br ${tone.bg}`}>
      <CardContent className="p-6 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-[#0A5C8C]" aria-hidden="true" />
          <h2 className="text-lg font-bold text-gray-900">Your Rate vs the Market</h2>
        </div>
        <div className="relative w-36 h-36 mb-3">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120" role="img"
            aria-label={`Your bill beats ${score} percent of the plans available in your area`}>
            <circle cx="60" cy="60" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              stroke={tone.stroke}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s ease-out" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${tone.text}`}>{score}</span>
            <span className="text-xs text-gray-500">/100</span>
          </div>
        </div>
        <p className={`text-sm font-semibold ${tone.text}`}>{benchmark.label}</p>
        <p className="text-xs text-gray-500 mt-1 text-center leading-relaxed">
          {benchmark.cheaperCount === 0
            ? `Nothing among the ${benchmark.comparedCount} plans we can fully price at your address costs less.`
            : `${benchmark.cheaperCount} of the ${benchmark.comparedCount} plans we can fully price at your address cost less than your bill.`}
        </p>
      </CardContent>
    </Card>
  );
}

/** Shown when the market cannot honestly be benchmarked. */
function BenchmarkUnavailable({ reason }) {
  const explanation = {
    no_current_bill: "Add what you pay each month and we can show where your rate sits in your market.",
    no_usage: "We need your monthly kWh usage to place your rate against the market.",
    bill_confidence_low: "Confirm the figures we read off your bill and we'll place your rate against the market.",
    unverified_inputs: "Confirm the figures we read off your bill and we'll place your rate against the market.",
    insufficient_priced_inventory:
      "We don't yet hold complete pricing for enough plans at your address to place your rate against the market fairly.",
  }[reason] || "We can't place your rate against the market with the details we have.";

  return (
    <Card className="border-2 border-gray-200">
      <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-gray-400" aria-hidden="true" />
          <h2 className="text-lg font-bold text-gray-900">Your Rate vs the Market</h2>
        </div>
        <p className="text-sm text-gray-600 leading-relaxed">{explanation}</p>
      </CardContent>
    </Card>
  );
}

// ─── Result card ────────────────────────────────────────────────

/**
 * One plan, priced by the server.
 *
 * Every figure on this card is read from the result DTO. The card decides how
 * a number looks; it never decides what it is. In particular the savings line
 * appears only where the server produced one — a plan it could not fully price
 * has no savings figure, and the card must not invent one from the subtotal it
 * does have.
 */
function ResultCard({ result, index, isTop, href, onOutbound, isSponsored }) {
  const price = describeResultPrice(result);
  const caveat = pricingCaveatText(result);
  const unavailable = result.monetizationStatus === MONETIZATION.UNAVAILABLE;

  return (
    <Card
      className={`border-2 transition-all hover:shadow-lg ${
        isTop ? "border-[#FF6B35] bg-gradient-to-br from-orange-50 to-white" : "border-gray-200"
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3 min-h-[22px]">
          {isTop && (
            <span className="bg-[#FF6B35] text-white text-xs font-bold px-2 py-1 rounded">
              BEST MATCH
            </span>
          )}
          {isSponsored && (
            <span className="text-[11px] font-medium text-gray-500 border border-gray-200 rounded-full px-2 py-0.5">
              Sponsored
            </span>
          )}
        </div>

        <div className="flex items-start gap-3 mb-4">
          <ProviderLogo
            provider={result.providerLogoUrl ? { name: result.providerName, logo_url: result.providerLogoUrl } : null}
            name={result.providerName}
            eager={index < 2}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm mb-0.5 truncate">{result.providerName}</h3>
            <p className="text-xs text-gray-600 truncate">{result.planName}</p>
            {result.matchScore !== null && (
              <p className="text-[11px] text-gray-500 mt-1">
                {result.matchScore}% match · {result.matchLabel}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">Rate</p>
            <p className="text-base font-bold text-[#0A5C8C]">{result.ratePerKwh}¢/kWh</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">
              {price?.basis === "supply" ? "Est. supply" : "Est. monthly"}
            </p>
            <p className="text-base font-bold text-gray-900">
              {price ? CURRENCY.format(price.amount) : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Term</p>
            <p className="text-sm font-semibold text-gray-700">
              {result.termMonths > 0 ? `${result.termMonths} mo` : "Variable"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">vs your bill</p>
            {/* Signed and honest in both directions: a plan that costs more is
                reported as costing more rather than being quietly omitted. */}
            {result.monthlyDifference === null ? (
              <p className="text-sm font-semibold text-gray-400">—</p>
            ) : result.differenceDirection === "saving" ? (
              <p className="text-base font-bold text-green-600">
                −{CURRENCY.format(Math.abs(result.monthlyDifference))}/mo
              </p>
            ) : result.differenceDirection === "costlier" ? (
              <p className="text-base font-bold text-amber-700">
                +{CURRENCY.format(Math.abs(result.monthlyDifference))}/mo
              </p>
            ) : (
              <p className="text-sm font-semibold text-gray-600">About the same</p>
            )}
          </div>
        </div>

        {result.matchReasons.length > 0 && (
          <ul className="mb-3 space-y-1">
            {result.matchReasons.map((reason) => (
              <li key={reason} className="flex items-start gap-1.5 text-xs text-gray-600">
                <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                {reason}
              </li>
            ))}
          </ul>
        )}

        {result.isRenewable && (
          <div className="flex items-center gap-1 text-xs text-green-600 font-medium mb-3">
            <Leaf className="w-3 h-3" aria-hidden="true" />
            {result.renewablePercentage > 0
              ? `${result.renewablePercentage}% Renewable`
              : "Renewable supply"}
          </div>
        )}

        {caveat && <p className="text-[11px] text-amber-700 mb-3">{caveat}</p>}

        {/* The destination is the server's tracked route. Where the visitor
            clicked is appended here because that is only knowable at render
            time; the browser never assembles a provider URL. */}
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="block" onClick={onOutbound}>
            <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm">
              View this plan
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </a>
        ) : (
          // No referral route configured for this provider: hand over to a
          // human rather than rendering a button that goes nowhere.
          <Link
            to={`/home-concierge?from=bill_analyzer${result.planId ? `&plan=${encodeURIComponent(result.planId)}` : ""}`}
            className="block"
            onClick={onOutbound}
          >
            <Button variant="outline" className="w-full border-[#FF6B35] text-[#FF6B35] text-sm">
              Request this plan
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
          </Link>
        )}
        {unavailable && (
          <p className="mt-2 text-[11px] text-gray-500 text-center">
            We&rsquo;ll put you in touch with this supplier directly.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Page ───────────────────────────────────────────────────────

export default function BillAnalyzer() {
  const [step, setStep] = useState(() => (loadFromSession() ? STEPS.RESULTS : STEPS.UPLOAD));
  const [bill, setBill] = useState(() => loadFromSession() || emptyBill());

  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | uploading | analyzing
  const [error, setError] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const sessionId = useMemo(() => getOrCreateSessionId(), []);

  useEffect(() => {
    if (step === STEPS.RESULTS) scrollToTopInstantly();
  }, [step]);

  // ── The authoritative comparison ──
  //
  // Same endpoint, same contract and same numbers as /compare-rates. The body
  // carries qualification inputs only — where they are, how much they use, what
  // they pay. Every figure with commercial weight comes back decided.
  const comparisonInput = useMemo(
    () => ({
      zip: bill.zip,
      customerType: CUSTOMER_TYPES.RESIDENTIAL,
      monthlyUsageKwh: bill.monthlyUsageKwh,
      monthlyCost: bill.monthlyCost,
      billAnalysisStatus: "complete",
      billConfidence: bill.confidence,
      unverifiedFields: bill.unverified,
      sessionId,
      entryContext: ENTRY_CONTEXTS.BILL_ANALYZER,
    }),
    [bill, sessionId]
  );

  const {
    data: comparison,
    isLoading: comparisonLoading,
    isError: comparisonFailed,
    refetch: refetchComparison,
  } = useQuery({
    queryKey: ["comparison", comparisonInput],
    enabled: step === STEPS.RESULTS && isComparable(bill),
    queryFn: async () => {
      const response = await fetch("/api/comparison", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(comparisonInput),
      });
      if (!response.ok) throw new Error("catalog_unavailable");
      return response.json();
    },
  });

  const results = useMemo(() => comparison?.results || [], [comparison]);
  const benchmark = comparison?.benchmark || { available: false, reason: "no_current_bill" };

  // ── File handling ──
  const validateAndSetFile = (selected) => {
    if (!selected) return;

    const validTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(selected.type)) {
      setError("Please upload a PDF or image file (PNG, JPG, JPEG).");
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB.");
      return;
    }

    setFile(selected);
    setError(null);
    setShowManualInput(false);
  };

  const withTimeout = (promise, ms, label) =>
    Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out. Please try again or enter details manually.`)), ms)
      ),
    ]);

  const handleUploadAndAnalyze = async () => {
    if (!file) return;

    setError(null);
    setPhase("uploading");
    track(EVENTS.BILL_UPLOAD_STARTED, { source: "bill_analyzer" });

    try {
      const uploaded = await withTimeout(UploadFile({ file }), 30000, "File upload");
      const fileUrl = uploaded?.file_url;
      if (!fileUrl) throw new Error("Upload returned no file URL");

      setPhase("analyzing");

      // The same prompt the in-flow analyzer uses. There is one bill analyzer,
      // and its extraction contract asks for energy figures — never the account
      // number, the customer name or the service address.
      const extraction = await withTimeout(
        ExtractDataFromUploadedFile({
          file_url: fileUrl,
          extraction_prompt: promptFor(CUSTOMER_TYPES.RESIDENTIAL),
        }),
        45000,
        "Bill analysis"
      );

      if (extraction?.status !== "success" || !extraction?.output) {
        throw new Error("Extraction was unsuccessful");
      }

      // `mapExtractionToState` is the single place that decides what a bill is
      // allowed to contribute and how much it is trusted.
      const mapped = mapExtractionToState(extraction.output, CUSTOMER_TYPES.RESIDENTIAL);
      if (Object.keys(mapped.fields).length === 0) {
        throw new Error("Nothing usable could be read from that document");
      }

      const { billZip, ...figures } = mapped.fields;
      setBill({
        ...emptyBill(),
        ...figures,
        zip: billZip || "",
        confidence: mapped.confidence,
        unverified: mapped.unverified,
      });
      setPhase("idle");
      // Always confirm before comparing: the figures drive every number on the
      // results page, and a misread kWh is a wrong answer everywhere at once.
      setStep(STEPS.REVIEW);
      track(EVENTS.BILL_ANALYSIS_COMPLETED, { confidence: mapped.confidence, source: "bill_analyzer" });
    } catch (err) {
      setPhase("idle");
      setShowManualInput(true);
      setError(`We couldn't read that bill (${err.message}). Enter the details below instead.`);
      track(EVENTS.BILL_ANALYSIS_FAILED, { source: "bill_analyzer" });
    }
  };

  const handleReset = () => {
    setStep(STEPS.UPLOAD);
    setBill(emptyBill());
    setFile(null);
    setShowManualInput(false);
    setError(null);
    clearSession();
  };

  /** Confirmed figures are trusted figures — that is what unlocks savings. */
  const handleConfirm = (confirmed) => {
    const next = { ...confirmed, confidence: "high", unverified: [] };
    setBill(next);
    saveToSession(next);
    setStep(STEPS.RESULTS);
    track(EVENTS.BILL_ANALYSIS_CONFIRMED, { source: "bill_analyzer" });
  };

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Bill Analyzer", url: "/bill-analyzer" },
  ]);

  const seoBlock = (
    <SEOHead
      title="Electricity Bill Analyzer | Electric Scouts"
      description="Upload an electricity bill and see the rate you really pay once base charges, delivery and credits are counted, then compare it against plans sold at your ZIP."
      keywords="electricity bill analyzer, analyze electricity bill, electricity savings calculator, bill comparison tool, find cheaper electricity, electricity rate analyzer, power bill analysis, energy bill savings"
      canonical="/bill-analyzer"
      structuredData={[
        breadcrumbData,
        getFAQSchema([
          { question: "How does the electricity bill analyzer work?", answer: "Upload a photo or PDF of your electricity bill and the analyzer reads your monthly usage, what you paid, and your current supplier. You confirm those figures, and we compare them against the plans actually sold at your address." },
          { question: "Is the bill analyzer free to use?", answer: "Yes, the Electric Scouts bill analyzer is completely free. Upload your bill, confirm the figures, and see how your rate compares with no cost or obligation." },
          { question: "What information does the bill analyzer need?", answer: "Your monthly kWh usage, your total monthly charges and your ZIP code. You can upload a recent bill and we will read those figures, or type them in yourself." },
          { question: "Do you keep my bill?", answer: "We read the energy figures from your bill and keep those. We do not ask the analyzer for your account number, your name or your service address, and none of those are stored or emailed." },
          { question: "How accurate are the estimates?", answer: "Estimates use the usage you confirm and the plan components we hold — energy charge, base charge, utility delivery and bill credits. Where we do not hold a complete set of components for a plan we label the figure as supply only rather than presenting it as a full bill, and we withhold any savings comparison for that plan." },
        ]),
      ]}
    />
  );

  // ── Loading states ──
  if (phase !== "idle") {
    return (
      <>
        {seoBlock}
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
          <div className="text-center" role="status" aria-live="polite">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
              <div className={`absolute inset-0 border-4 rounded-full border-t-transparent animate-spin ${
                phase === "uploading" ? "border-[#0A5C8C]" : "border-[#FF6B35]"
              }`} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {phase === "uploading" ? "Uploading your bill" : "Reading your bill"}
            </h2>
            <p className="text-sm text-gray-600">
              {phase === "uploading" ? "Please wait…" : "Finding your usage, your rate and what you paid…"}
            </p>
          </div>
        </div>
      </>
    );
  }

  if (step === STEPS.REVIEW) {
    return (
      <>
        {seoBlock}
        <ReviewStep
          bill={bill}
          onConfirm={handleConfirm}
          onBack={handleReset}
        />
      </>
    );
  }

  if (step === STEPS.RESULTS) {
    return (
      <>
        {seoBlock}
        <ResultsScreen
          bill={bill}
          comparison={comparison}
          results={results}
          benchmark={benchmark}
          loading={comparisonLoading}
          failed={comparisonFailed}
          onRetry={refetchComparison}
          onEdit={() => setStep(STEPS.REVIEW)}
          onReset={handleReset}
          sessionId={sessionId}
        />
      </>
    );
  }

  // ── Upload ──
  return (
    <>
      {seoBlock}
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold mb-3">Electricity Bill Analyzer</h1>
            <p className="text-base text-blue-100 max-w-2xl mx-auto">
              Upload a recent bill and we&rsquo;ll read your usage and what you actually pay,
              then compare it against the plans sold at your address.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="text-center">
                <div className="mb-6">
                  <input
                    type="file"
                    id="bill-upload"
                    ref={fileInputRef}
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => validateAndSetFile(e.target.files?.[0])}
                    className="hidden"
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragOver(false);
                      validateAndSetFile(e.dataTransfer?.files?.[0]);
                    }}
                    className={`cursor-pointer border-2 border-dashed rounded-xl p-12 transition-all ${
                      isDragOver
                        ? "border-[#FF6B35] bg-orange-50 scale-[1.02]"
                        : file
                          ? "border-green-400 bg-green-50"
                          : "border-gray-300 hover:border-[#0A5C8C] hover:bg-blue-50"
                    }`}
                  >
                    {file ? (
                      <>
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" aria-hidden="true" />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{file.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                        <p className="text-xs text-green-600 font-medium">
                          Click or drop another file to replace
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload
                          className={`w-12 h-12 mx-auto mb-4 ${isDragOver ? "text-[#FF6B35] animate-bounce" : "text-gray-400"}`}
                          aria-hidden="true"
                        />
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {isDragOver ? "Drop your bill here" : "Upload your electricity bill"}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">Drag and drop or click to browse</p>
                        <p className="text-xs text-gray-500">Supports PDF, PNG, JPG &bull; Max 10MB</p>
                      </>
                    )}
                  </div>
                </div>

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                      <p className="text-sm font-medium text-left">{error}</p>
                    </div>
                  </div>
                )}

                {file && !showManualInput && (
                  <Button
                    onClick={handleUploadAndAnalyze}
                    className="w-full md:w-auto bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 py-6 text-base font-semibold"
                  >
                    Analyze bill &amp; compare
                    <ArrowRight className="w-5 h-5 ml-2" aria-hidden="true" />
                  </Button>
                )}

                <p className="mt-6 text-xs text-gray-500 leading-relaxed max-w-lg mx-auto">
                  We read the energy figures from your bill — usage, charges, your supplier and
                  plan. We don&rsquo;t ask for your account number, your name or your service
                  address, and we don&rsquo;t store them.
                </p>
              </div>
            </CardContent>
          </Card>

          {showManualInput ? (
            <ManualEntry
              onCancel={() => { setShowManualInput(false); setError(null); }}
              onSubmit={(entered) => {
                setError(null);
                setBill(entered);
                setStep(STEPS.REVIEW);
              }}
            />
          ) : (
            <div className="text-center mb-8">
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="text-sm text-[#0A5C8C] hover:text-[#084a6f] underline font-medium"
              >
                Don&rsquo;t have a bill to hand? Enter the details instead
              </button>
            </div>
          )}

          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Upload, tint: "bg-blue-100 text-blue-600", title: "1. Upload your bill", body: "A PDF or a photo of a recent electricity bill." },
                { icon: Zap, tint: "bg-purple-100 text-purple-600", title: "2. Confirm the figures", body: "We read your usage, rate and charges — you check them." },
                { icon: DollarSign, tint: "bg-green-100 text-green-600", title: "3. See where you stand", body: "Your bill priced against the plans sold at your address." },
              ].map(({ icon: Icon, tint, title, body }) => (
                <Card key={title}>
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${tint}`}>
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-sm text-gray-600">{body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-0">
            <CardContent className="p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 text-center">
                Why Analyze Your Bill?
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: CheckCircle, text: "See the rate you actually pay, not the advertised one" },
                  { icon: DollarSign, text: "Compare against plans priced at your own usage" },
                  { icon: Clock, text: "Skip the questions your bill already answers" },
                  { icon: Zap, text: "Only plans genuinely sold at your address" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#0A5C8C]" aria-hidden="true" />
                    </div>
                    <span className="text-sm text-gray-700 font-medium">{text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────── */

/**
 * Manual entry.
 *
 * The same three figures the extraction has to find, asked for directly. ZIP is
 * required and validated against the serviceable-market list with the same
 * checker the questionnaire uses, so a ZIP is accepted or refused identically
 * whichever door the visitor came through.
 */
function ManualEntry({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    currentProvider: "", currentPlan: "", monthlyUsageKwh: "", monthlyCost: "", zip: "",
  });
  const [error, setError] = useState(null);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = (e) => {
    e.preventDefault();

    const usage = parseFloat(form.monthlyUsageKwh);
    const cost = parseFloat(form.monthlyCost);

    if (!Number.isFinite(usage) || usage <= 0) {
      setError("Enter your monthly usage in kWh.");
      return;
    }
    if (!Number.isFinite(cost) || cost <= 0) {
      setError("Enter your total monthly cost.");
      return;
    }

    const zipCheck = checkServiceZip(form.zip);
    if (!zipCheck.valid) {
      setError(zipCheck.message);
      return;
    }

    setError(null);
    onSubmit({
      ...emptyBill(),
      zip: zipCheck.zip,
      monthlyUsageKwh: usage,
      monthlyCost: cost,
      effectiveRate: parseFloat(((cost / usage) * 100).toFixed(2)),
      currentProvider: form.currentProvider.trim().slice(0, 120),
      currentPlan: form.currentPlan.trim().slice(0, 120),
      // Typed by the customer about their own bill: nothing to second-guess.
      confidence: "high",
      unverified: [],
    });
  };

  return (
    <Card className="mb-8 border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white">
      <CardContent className="p-8">
        <div className="flex items-center gap-2 mb-6">
          <Edit3 className="w-5 h-5 text-amber-600" aria-hidden="true" />
          <h2 className="text-lg font-bold text-gray-900">Enter your bill details</h2>
        </div>
        <p className="text-sm text-gray-600 mb-6">
          Three figures off your bill are enough: how much you used, what you paid, and where
          you are.
        </p>

        <form onSubmit={submit}>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Field label="Current supplier" optional>
              <input
                type="text" value={form.currentProvider}
                onChange={(e) => set("currentProvider", e.target.value)}
                placeholder="e.g. TXU Energy" className={INPUT_CLASS}
              />
            </Field>
            <Field label="Current plan name" optional>
              <input
                type="text" value={form.currentPlan}
                onChange={(e) => set("currentPlan", e.target.value)}
                placeholder="e.g. Fixed Rate 12" className={INPUT_CLASS}
              />
            </Field>
            <Field label="Monthly usage (kWh)" required>
              <input
                type="number" value={form.monthlyUsageKwh} min="1" required
                onChange={(e) => set("monthlyUsageKwh", e.target.value)}
                placeholder="e.g. 1200" className={INPUT_CLASS}
              />
            </Field>
            <Field label="Total monthly cost ($)" required>
              <input
                type="number" step="0.01" min="0.01" required value={form.monthlyCost}
                onChange={(e) => set("monthlyCost", e.target.value)}
                placeholder="e.g. 150.00" className={INPUT_CLASS}
              />
            </Field>
            <Field label="ZIP code" required>
              <input
                type="text" value={form.zip} maxLength={5} required inputMode="numeric"
                onChange={(e) => set("zip", e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="e.g. 75001" className={INPUT_CLASS}
              />
            </Field>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button type="submit" className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 py-3 text-sm font-semibold">
              Compare my bill
              <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="px-6 py-3 text-sm">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const INPUT_CLASS =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0A5C8C] focus:border-transparent outline-none";

function Field({ label, required, optional, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{" "}
        {required && <span className="text-red-500">*</span>}
        {optional && <span className="text-gray-400">(optional)</span>}
      </label>
      {children}
    </div>
  );
}

/**
 * Confirm what we read before anything is computed from it.
 *
 * Every number on the results page descends from these three figures, so a
 * misread kWh is not one wrong field — it is a wrong answer everywhere at once,
 * including the savings figures. Confirming here is also what upgrades the
 * bill's confidence: until the visitor has checked them, the engine deliberately
 * withholds every savings claim, and it is right to.
 */
function ReviewStep({ bill, onConfirm, onBack }) {
  const [draft, setDraft] = useState({
    zip: bill.zip || "",
    monthlyUsageKwh: bill.monthlyUsageKwh ? String(Math.round(bill.monthlyUsageKwh)) : "",
    monthlyCost: bill.monthlyCost ? String(bill.monthlyCost.toFixed(2)) : "",
    currentProvider: bill.currentProvider || "",
  });
  const [error, setError] = useState(null);

  const missing = !bill.zip;
  const uncertain = bill.confidence !== "high" || bill.unverified.length > 0;

  const set = (field, value) => setDraft((prev) => ({ ...prev, [field]: value }));

  const confirm = () => {
    const usage = parseFloat(draft.monthlyUsageKwh);
    if (!Number.isFinite(usage) || usage <= 0) {
      setError("Enter your monthly usage in kWh.");
      return;
    }

    const cost = parseFloat(draft.monthlyCost);
    // Cost is optional: a bill we could read usage from but not charges still
    // produces a real comparison, just without a savings line.
    if (draft.monthlyCost && (!Number.isFinite(cost) || cost <= 0)) {
      setError("Enter a valid monthly cost, or leave it blank.");
      return;
    }

    const zipCheck = checkServiceZip(draft.zip);
    if (!zipCheck.valid) {
      setError(zipCheck.message);
      return;
    }

    setError(null);
    onConfirm({
      ...bill,
      zip: zipCheck.zip,
      monthlyUsageKwh: usage,
      monthlyCost: Number.isFinite(cost) && cost > 0 ? cost : null,
      effectiveRate:
        Number.isFinite(cost) && cost > 0 ? parseFloat(((cost / usage) * 100).toFixed(2)) : null,
      currentProvider: draft.currentProvider.trim().slice(0, 120),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-8">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold mb-1">Check what we read</h1>
          <p className="text-sm text-blue-100">
            Every figure on your results is worked out from these, so it&rsquo;s worth ten seconds.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {(uncertain || missing) && (
          <div className="mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-amber-900 leading-relaxed">
              {missing
                ? "We couldn't find a service ZIP code on that bill. Add it and we can look up the plans sold at your address."
                : "Some of these were hard to read. Please correct anything that looks wrong."}
            </p>
          </div>
        )}

        <Card>
          <CardContent className="p-6 space-y-4">
            <Field label="ZIP code" required>
              <input
                type="text" value={draft.zip} maxLength={5} inputMode="numeric"
                onChange={(e) => set("zip", e.target.value.replace(/\D/g, "").slice(0, 5))}
                placeholder="e.g. 75001" className={INPUT_CLASS}
              />
            </Field>
            <Field label="Monthly usage (kWh)" required>
              <input
                type="number" value={draft.monthlyUsageKwh} min="1"
                onChange={(e) => set("monthlyUsageKwh", e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>
            <Field label="Total monthly cost ($)" optional>
              <input
                type="number" step="0.01" min="0.01" value={draft.monthlyCost}
                onChange={(e) => set("monthlyCost", e.target.value)}
                className={INPUT_CLASS}
              />
              <p className="mt-1 text-xs text-gray-500">
                Needed to work out what you pay per kWh and whether a plan would save you money.
              </p>
            </Field>
            <Field label="Current supplier" optional>
              <input
                type="text" value={draft.currentProvider}
                onChange={(e) => set("currentProvider", e.target.value)}
                className={INPUT_CLASS}
              />
            </Field>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                onClick={confirm}
                className="flex-1 bg-[#FF6B35] hover:bg-[#e55a2b] text-white py-3 font-semibold"
              >
                That&rsquo;s right — compare my bill
                <ArrowRight className="w-4 h-4 ml-2" aria-hidden="true" />
              </Button>
              <Button variant="outline" onClick={onBack} className="py-3">
                Start over
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/**
 * The results.
 *
 * Presentation only. Prices, ranks, match scores, savings, the market benchmark
 * and the outbound routes are all decided by /api/comparison; this component
 * chooses how they look and never what they are.
 */
function ResultsScreen({
  bill, comparison, results, benchmark, loading, failed, onRetry, onEdit, onReset, sessionId,
}) {
  const city = useMemo(() => (bill.zip ? getCityFromZip(bill.zip) : "") || "", [bill.zip]);
  const { headline, rest } = useMemo(() => selectHeadline(results), [results]);
  const usageKwh = comparison?.usageKwh ?? bill.monthlyUsageKwh ?? 0;

  useEffect(() => {
    if (loading || failed || !comparison) return;
    track(EVENTS.COMPARISON_RESULTS_LOADED, {
      match_count: results.length,
      source: "bill_analyzer",
      session_id: sessionId,
    });
  }, [loading, failed, comparison, results.length, sessionId]);

  // Per-card sponsorship disclosure only says something when monetization is
  // not universal; otherwise every card carries the same badge and it is noise.
  const monetizedCount = results.filter((r) => r.monetizationStatus !== MONETIZATION.UNAVAILABLE).length;
  const discloseSponsored = monetizedCount > 0 && monetizedCount < results.length;

  const hrefFor = (result, section, position) =>
    withResultPlacement(result.trackedOutboundRoute, section, position);

  const onOutbound = (result, section, position) => () => {
    track(EVENTS.VIEW_PLAN_CLICKED, {
      provider: result.providerName,
      plan_id: result.planId,
      session_id: sessionId,
      result_section: section,
      result_position: position,
      match_score: result.matchScore ?? null,
      monetization: result.monetizationStatus,
      source: "bill_analyzer",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center">
        <div className="text-center" role="status" aria-live="polite">
          <Loader2 className="w-10 h-10 text-[#0A5C8C] animate-spin mx-auto mb-4" aria-hidden="true" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Comparing your bill</h2>
          <p className="text-sm text-gray-600">
            Pricing the plans sold at {city || bill.zip} against {NUMBER.format(Math.round(usageKwh))} kWh…
          </p>
        </div>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" aria-hidden="true" />
            <h2 className="text-lg font-bold text-gray-900 mb-2">We couldn&rsquo;t load plans just now</h2>
            {/* Deliberately not "no plans in your area" — that would be a claim
                about their market, and what actually failed was our request. */}
            <p className="text-sm text-gray-600 mb-6">
              Your bill details are safe. This is on our side, not yours.
            </p>
            <div className="space-y-3">
              <Button onClick={() => onRetry()} className="w-full bg-[#0A5C8C] hover:bg-[#084a6f] text-white">
                Try again
              </Button>
              <Button variant="outline" onClick={onEdit} className="w-full">
                Check my bill details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold mb-2">Your bill, against the market</h1>
          <p className="text-sm text-blue-100">
            {city ? `${city} · ${bill.zip}` : bill.zip} ·{" "}
            {NUMBER.format(Math.round(usageKwh))} kWh a month
            {comparison?.counts
              ? ` · ${comparison.counts.eligible} plan${comparison.counts.eligible === 1 ? "" : "s"} sold at your address`
              : ""}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {benchmark.available
            ? <MarketPositionGauge benchmark={benchmark} />
            : <BenchmarkUnavailable reason={benchmark.reason} />}

          <Card className="border-2 border-gray-200 bg-gradient-to-br from-orange-50 to-white">
            <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center">
              <div className="flex items-center gap-2 mb-4">
                <Percent className="w-5 h-5 text-[#FF6B35]" aria-hidden="true" />
                <h2 className="text-lg font-bold text-gray-900">Above the best plan</h2>
              </div>
              {benchmark.available ? (
                <>
                  <div className={`text-4xl font-bold mb-2 ${
                    benchmark.overpaymentPercent > 20 ? "text-red-600"
                      : benchmark.overpaymentPercent > 10 ? "text-amber-600"
                        : benchmark.overpaymentPercent > 0 ? "text-blue-600" : "text-green-600"
                  }`}>
                    {benchmark.overpaymentPercent.toFixed(0)}%
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {benchmark.overpaymentPercent > 0
                      ? `About ${CURRENCY.format(benchmark.monthlyOverpayment)} a month more than the cheapest plan available to you.`
                      : "Nothing available to you is cheaper than what you pay today."}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-4xl font-bold mb-2 text-gray-300">—</div>
                  <p className="text-xs text-gray-500">
                    Needs your monthly cost and complete pricing for your market.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#0A5C8C]" aria-hidden="true" />
                  <h2 className="text-lg font-bold text-gray-900">Your current bill</h2>
                </div>
                <button
                  type="button"
                  onClick={onEdit}
                  className="text-xs font-medium text-[#0A5C8C] hover:underline"
                >
                  Edit
                </button>
              </div>
              <dl className="space-y-3">
                {bill.currentProvider && (
                  <Summary label="Supplier" value={bill.currentProvider} />
                )}
                {bill.currentPlan && <Summary label="Plan" value={bill.currentPlan} />}
                <div className="grid grid-cols-2 gap-3">
                  <Summary label="Monthly usage" value={`${NUMBER.format(Math.round(usageKwh))} kWh`} />
                  <Summary
                    label="You pay"
                    value={bill.monthlyCost ? CURRENCY.format(bill.monthlyCost) : "—"}
                  />
                </div>
                {benchmark.available && (
                  <div className="grid grid-cols-2 gap-3">
                    <Summary
                      label="Your rate, all in"
                      value={`${benchmark.currentEffectiveRate.toFixed(1)}¢/kWh`}
                    />
                    <Summary
                      label="Best available"
                      value={`${benchmark.bestEffectiveRate.toFixed(1)}¢/kWh`}
                    />
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* The single savings headline, and only when the server produced one.
            It is the difference against the best fully-priced plan available at
            this address — not against the cheapest advertised rate anywhere. */}
        {benchmark.available && benchmark.annualOverpayment > 0 && (
          <Card className="mb-8 border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-green-600" aria-hidden="true" />
                    <h2 className="text-lg font-bold text-gray-900">Potential annual saving</h2>
                  </div>
                  <p className="text-sm text-gray-600 max-w-xl">
                    Estimated from your confirmed usage against the cheapest plan we can price
                    completely at your address. Your actual bill depends on your utility, taxes
                    and real usage.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-green-600">
                    {CURRENCY.format(benchmark.annualOverpayment)}
                  </div>
                  <p className="text-xs text-gray-600">per year</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {results.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                No plans are listed for {bill.zip} yet
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your details are saved. We can have someone look for options in your area.
              </p>
              <Link to="/home-concierge?from=bill_analyzer">
                <Button variant="outline">Help me find an option</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {headline.length > 0 && (
              <section aria-labelledby="best-matches" className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-[#FF6B35]" aria-hidden="true" />
                  <h2 id="best-matches" className="text-lg font-bold text-gray-900">
                    Best {headline.length === 1 ? "match" : `${headline.length} matches`} for your usage
                  </h2>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  {headline.map((result, index) => (
                    <ResultCard
                      key={result.planId}
                      result={result}
                      index={index}
                      isTop={index === 0}
                      href={hrefFor(result, RESULT_SECTIONS.TOP_MATCH, index + 1)}
                      onOutbound={onOutbound(result, RESULT_SECTIONS.TOP_MATCH, index + 1)}
                      isSponsored={
                        discloseSponsored && result.monetizationStatus !== MONETIZATION.UNAVAILABLE
                      }
                    />
                  ))}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section aria-labelledby="more-options">
                <h2 id="more-options" className="text-lg font-bold text-gray-900 mb-4">
                  More plans at your address
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {rest.map((result, index) => (
                    <ResultCard
                      key={result.planId}
                      result={result}
                      index={index + headline.length}
                      isTop={false}
                      href={hrefFor(result, RESULT_SECTIONS.MORE_OPTIONS, index + 1)}
                      onOutbound={onOutbound(result, RESULT_SECTIONS.MORE_OPTIONS, index + 1)}
                      isSponsored={
                        discloseSponsored && result.monetizationStatus !== MONETIZATION.UNAVAILABLE
                      }
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <EmailReport bill={bill} results={results} city={city} sessionId={sessionId} />

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button onClick={onReset} variant="outline" className="flex-1">
            Analyze another bill
          </Button>
          <Link to={compareUrlFromBill(bill)} className="flex-1">
            <Button className="w-full bg-[#0A5C8C] hover:bg-[#084a6f] text-white">
              Compare with more options
            </Button>
          </Link>
        </div>

        <p className="mt-8 text-[12px] text-gray-500 leading-relaxed">
          Estimates use the usage you confirmed and the plan components we hold — energy charge,
          base charge, utility delivery and bill credits where available. Where we cannot price a
          plan completely we label it as supply only and withhold any comparison against your
          bill. Your actual bill depends on your utility, taxes and real usage. Verify all details
          with the provider before enrolling. Electric Scouts is a comparison service and may earn
          a commission when you enroll through a listed plan; that relationship never changes how
          plans are ranked.
        </p>
      </div>
    </div>
  );
}

function Summary({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-gray-600 mb-0.5">{label}</dt>
      <dd className="text-sm font-bold text-gray-900">{value}</dd>
    </div>
  );
}

/**
 * Email the report.
 *
 * The request carries who to send it to and which plans were on screen — never
 * a price, a saving or a link. /api/send-report re-runs the same comparison
 * service this page called, so the inbox cannot disagree with the screen, and
 * nothing a browser posts can put a URL behind a button in an email we sign.
 */
function EmailReport({ bill, results, city, sessionId }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const submit = useCallback(async () => {
    const nameCheck = validateFirstName(name);
    if (!nameCheck.valid) {
      setError(nameCheck.error);
      return;
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setError(emailCheck.error);
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailCheck.value,
          name: nameCheck.value,
          zipCode: bill.zip,
          cityName: city,
          monthlyUsageKwh: bill.monthlyUsageKwh,
          monthlyCost: bill.monthlyCost,
          currentProvider: bill.currentProvider,
          billConfidence: bill.confidence,
          unverifiedFields: bill.unverified,
          sessionId,
          planIds: results.map((r) => r.planId),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        setSent(true);
        track(EVENTS.COMPARISON_EMAIL_SENT, { source: "bill_analyzer", session_id: sessionId });
      } else {
        setError(data.error || "Something went wrong sending your report.");
        track(EVENTS.COMPARISON_EMAIL_FAILED, { source: "bill_analyzer", session_id: sessionId });
      }
    } catch {
      setError("Network error. Please try again.");
      track(EVENTS.COMPARISON_EMAIL_FAILED, { source: "bill_analyzer", session_id: sessionId });
    } finally {
      setSending(false);
    }
  }, [name, email, bill, city, results, sessionId]);

  return (
    <Card className="mt-8 border-2 border-[#0A5C8C] bg-gradient-to-r from-blue-50 to-white">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-5 h-5 text-[#0A5C8C]" aria-hidden="true" />
          <h3 className="text-lg font-bold text-gray-900">Email me this comparison</h3>
        </div>

        {sent ? (
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <p className="font-medium">
              Sent. Check your inbox for your bill comparison and the plans above.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-4">
              We&rsquo;ll send this comparison so you can come back to it. We don&rsquo;t sell your
              details.
            </p>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  placeholder="Your first name"
                  autoComplete="given-name"
                  className={`sm:w-2/5 ${INPUT_CLASS}`}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  className={`flex-1 ${INPUT_CLASS}`}
                />
              </div>
              <Button
                onClick={submit}
                disabled={sending || !email || !name.trim()}
                className="w-full sm:w-auto bg-[#0A5C8C] hover:bg-[#084a6f] text-white px-6"
              >
                {sending ? "Sending…" : "Send my comparison"}
              </Button>
            </div>
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );
}
