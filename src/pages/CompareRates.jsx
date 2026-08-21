import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Building2, Home, Leaf, MapPin } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SEOHead, {
  getOrganizationSchema,
  getServiceSchema,
  getFAQSchema,
  getBreadcrumbSchema,
} from "@/components/SEOHead";

import { getCityFromZip } from "../components/compare/providerAvailability";
import {
  validateFirstName,
  validateLastName,
  validateEmail,
  validatePhone,
  formatPhone,
} from "@/lib/contactValidation";

import {
  createInitialState,
  invalidateBranchState,
  resetServiceSelection,
  resolveUsageKwh,
  stageForQuestion,
  CUSTOMER_TYPES,
} from "../components/compare/engine/comparisonState";
import {
  ENTRY_PARAM_KEYS,
  parseEntryParams,
  resolveEntryContext,
  checkServiceZip,
} from "../components/compare/engine/entryContext";
import {
  determineNextQuestion,
  stepBack,
  pushHistory,
} from "../components/compare/engine/nextQuestion";
import { resolveCopy } from "../components/compare/engine/questionRegistry";
import { captureAttributionFromWindow } from "../components/compare/engine/attribution";
import { track, EVENTS } from "../components/compare/engine/analytics";
import {
  getOrCreateSessionId,
  saveLocalSession,
  loadLocalSession,
  persistComparison,
} from "../components/compare/engine/persistence";
import { resolveRoute, ROUTES } from "../components/compare/engine/monetizationRouter";

import ComparisonShell, {
  QuestionFrame,
  TrustNote,
} from "../components/compare/ui/ComparisonShell";
import {
  ChoiceGroup,
  TextQuestion,
  PrimaryAction,
  SecondaryAction,
} from "../components/compare/ui/QuestionInputs";
import {
  BillOffer,
  BillUpload,
  BillSummary,
} from "../components/compare/ui/BillPanel";
import {
  BestMatchCard,
  PlanRow,
  PlanDetails,
  ResultsToolbar,
  ViewMoreButton,
} from "../components/compare/ui/ResultsBoard";
import { resolveAnalysisPhase } from "../components/compare/engine/analysisTimeline";
import AnalysisLoader, { AnalysisFailed } from "../components/compare/ui/AnalysisLoader";
import {
  selectHeadline,
  withResultPlacement,
  RESULT_SECTIONS,
  MONETIZATION,
} from "../components/compare/engine/resultsContract";
import {
  NoMatchState,
  CommercialComplete,
  RenewableFallback,
} from "../components/compare/ui/ResultsView";
import { MARKET_TOTALS } from "@/seo/market";

/**
 * /compare-rates — the shared comparison engine.
 *
 * This page orchestrates; it does not decide. What to ask next comes from
 * `determineNextQuestion`, what a completed session is worth comes from
 * `resolveRoute`, and what a bill means comes from `billAnalysis`. Keeping the
 * decisions in testable modules is what stopped this file from becoming the
 * 1,500-line conditional tree it replaced.
 */

const RESULTS_PAGE_SIZE = 10;

export default function CompareRates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState(() => createInitialState());
  const [view, setView] = useState("question"); // question | bill_upload | bill_summary | matching | results
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [filters, setFilters] = useState({
    provider: "all", term: "all", planType: "all", renewableOnly: false,
  });
  const [sort, setSort] = useState("best");
  const [matchingFailed, setMatchingFailed] = useState(false);
  // Bumped by Retry. The matching effect keys on it so a retry genuinely
  // restarts the run: setting `view` back to the value it already holds is a
  // no-op React bails out of, which left Retry resetting the failure flag and
  // then waiting on a timer that was never scheduled.
  const [matchAttempt, setMatchAttempt] = useState(0);
  const [visibleCount, setVisibleCount] = useState(RESULTS_PAGE_SIZE);

  // ── Session bootstrap ──
  //
  // Three entry points converge here: a service landing page that already
  // established the ZIP and the audience, the standalone Bill Analyzer, and a
  // visitor who came straight to /compare-rates. All three end up as one
  // comparison session, and `determineNextQuestion` decides what is still
  // unanswered — so a prequalified session simply starts further in.
  useEffect(() => {
    const attribution = captureAttributionFromWindow();
    const sessionId = getOrCreateSessionId();
    const restored = loadLocalSession();
    // Nothing off the URL is trusted: the ZIP is re-validated and the intent
    // values are matched against allowlists before they reach state.
    const { seed, hasEntryParams } = parseEntryParams(searchParams);
    const entryContext = resolveEntryContext({
      entryContext: seed.entryContext || restored?.entryContext,
    });

    setState((prev) => {
      const merged = {
        ...prev,
        ...(restored || {}),
        sessionId,
        // Attribution from the original landing always wins over a restored
        // copy, so a resumed session keeps the campaign that produced it.
        attribution: { ...(restored?.attribution || {}), ...attribution },
        ...seed,
        entryContext,
      };

      // Arriving from a different service than the stored session was for must
      // not leave the abandoned branch's answers attached to the lead.
      const next =
        seed.customerType && restored?.customerType && restored.customerType !== seed.customerType
          ? invalidateBranchState(merged, seed.customerType)
          : merged;

      return { ...next, city: next.city || (next.zip ? getCityFromZip(next.zip) || "" : "") };
    });

    track(EVENTS.COMPARE_RATES_VIEWED, { entry_context: entryContext });
    track(EVENTS.COMPARISON_STARTED, { entry_context: entryContext });

    // The routing parameters have done their job, so they come out of the
    // address bar: /compare-rates is the canonical URL, and a shared or
    // bookmarked link should not carry someone else's ZIP code. Replacing
    // rather than pushing keeps Back pointing at the landing page they came
    // from, and only the keys this handoff owns are removed.
    if (hasEntryParams) {
      const remaining = new URLSearchParams(searchParams);
      for (const key of ENTRY_PARAM_KEYS) remaining.delete(key);
      setSearchParams(remaining, { replace: true });
    }
    // Bootstrap runs once; searchParams is read only for the initial seed.

  }, []);

  // Persist in-progress answers so a reload resumes rather than restarts.
  useEffect(() => {
    if (state.sessionId) saveLocalSession(state);
  }, [state]);

  const currentQuestion = useMemo(
    () => (view === "question" ? determineNextQuestion(state) : null),
    [state, view]
  );

  // The colour the flow wears. Renewable wins over the audience, because a
  // visitor who came for green supply should keep seeing that they are on that
  // path even after they say the property is a business.
  const accent = state.energyPreference === "renewable"
    ? "renewable"
    : state.customerType === CUSTOMER_TYPES.COMMERCIAL
      ? "commercial"
      : "residential";

  // What the engine already knows, stated on the band. A visitor handed over
  // from a landing page should see their ZIP and their service reflected back
  // rather than wonder whether it made it across — and spot a wrong ZIP early.
  const context = useMemo(() => {
    const chips = [];
    if (state.zip) {
      chips.push({
        label: state.city ? `${state.city} · ${state.zip}` : state.zip,
        icon: MapPin,
      });
    }
    if (state.energyPreference === "renewable") {
      chips.push({ label: "Renewable", icon: Leaf });
    }
    if (state.customerType === CUSTOMER_TYPES.COMMERCIAL) {
      chips.push({ label: "Business", icon: Building2 });
    } else if (state.customerType === CUSTOMER_TYPES.RESIDENTIAL) {
      chips.push({ label: "Home", icon: Home });
    }
    return chips;
  }, [state.zip, state.city, state.customerType, state.energyPreference]);

  // Record each question as it is shown, so Back walks real screens only.
  useEffect(() => {
    if (!currentQuestion) return;
    setState((prev) => {
      const history = pushHistory(prev.history, currentQuestion.id);
      return history === prev.history ? prev : { ...prev, history };
    });
  }, [currentQuestion]);

  // Once the questionnaire is exhausted, enter the matching state.
  useEffect(() => {
    if (view !== "question" || currentQuestion || !state.email) return;
    setView("matching");
    track(EVENTS.MATCHING_STARTED);
    track(EVENTS.COMPARISON_ANALYSIS_STARTED);
  }, [currentQuestion, view, state.email]);


  const update = useCallback((patch) => {
    setState((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleBack = useCallback(() => {
    const back = stepBack(state, currentQuestion?.id);
    if (!back) return;

    // Clear the answer being returned to so the question actually re-asks
    // instead of being immediately satisfied and skipped forward again, and
    // truncate history so repeated Backs keep walking outward.
    setState((prev) => ({
      ...prev,
      ...clearAnswerFor(back.question.id, prev),
      history: back.history,
    }));
    setView("question");
  }, [state, currentQuestion]);

  /**
   * Let a visitor out of the branch they arrived in.
   *
   * Somebody who came through the Commercial landing page and realises they
   * actually need residential supply must not be stuck there, and must not lose
   * their ZIP code, their bill figures or their place in the flow for changing
   * their mind. This puts "What are you shopping for?" back in front of them
   * and keeps everything that is still true.
   */
  const handleChangeService = useCallback(() => {
    track(EVENTS.SERVICE_TYPE_CHANGED, {
      from: state.energyPreference === "renewable" && !state.customerType
        ? "renewable"
        : state.customerType,
      entry_context: state.entryContext,
    });
    setState((prev) => resetServiceSelection(prev));
    setView("question");
  }, [state.customerType, state.energyPreference, state.entryContext]);

  // ── Results ──
  /**
   * The authoritative comparison.
   *
   * This page sends what the customer told us — where they live, what they are
   * shopping for, what they use, what they pay today — and receives finished
   * results: priced, ranked, scored, with the savings already decided and the
   * outbound route already authorized.
   *
   * It used to fetch plan rows and do all of that here. Two rounds of damage
   * came out of that arrangement: eligibility decided in React published 29
   * deactivated plans, and pricing computed in React disagreed with the pricing
   * the comparison email computed for the same plan. Both are server questions,
   * and neither is asked here any more.
   */
  const comparisonInput = useMemo(
    () => ({
      zip: state.zip,
      state: state.state,
      customerType: state.customerType === CUSTOMER_TYPES.COMMERCIAL ? "commercial" : "residential",
      energyPreference: state.energyPreference,
      shoppingIntent: state.shoppingIntent,
      usageRange: state.usageRange,
      monthlyUsageKwh: state.monthlyUsageKwh,
      monthlyCost: state.monthlyCost,
      billAnalysisStatus: state.billAnalysisStatus,
      billConfidence: state.billConfidence,
      unverifiedFields: state.unverifiedFields,
      sessionId: state.sessionId,
      entryContext: state.entryContext,
      attribution: {
        utm_source: state.attribution?.utm_source,
        utm_campaign: state.attribution?.utm_campaign,
      },
    }),
    [
      state.zip, state.state, state.customerType, state.energyPreference,
      state.shoppingIntent, state.usageRange, state.monthlyUsageKwh, state.monthlyCost,
      state.billAnalysisStatus, state.billConfidence, state.unverifiedFields,
      state.sessionId, state.entryContext, state.attribution,
    ]
  );

  const {
    data: comparison,
    isLoading: plansQueryLoading,
    isError: plansError,
    refetch: refetchComparison,
  } = useQuery({
    // Every input that can change a price, a rank or a score is in the key, so
    // a customer who corrects their usage gets a recomputed comparison rather
    // than a cached one that no longer describes them.
    queryKey: ["comparison", comparisonInput],
    enabled: Boolean(state.state || state.zip),
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
  const plansLoading = plansQueryLoading && !plansError;

  // Branding arrives on the result from the server-side provider join, so there
  // is no second name-based lookup on the client.
  const providerFor = useCallback(
    (result) =>
      result?.providerLogoUrl
        ? { name: result.providerName, logo_url: result.providerLogoUrl }
        : null,
    []
  );

  // Hold the analysis screen for its minimum presentation period.
  //
  // Kept in its own effect keyed on `view` alone: when the timer lived in the
  // effect above, setting the view re-ran that effect, and its cleanup cancelled
  // the very timeout it had just scheduled — leaving the page stuck on the
  // analysis screen forever.
  //
  // The plans query is what "ready" means here. If it has not settled by the
  // time the minimum elapses, the screen stays up rather than revealing a
  // half-populated board — real work is never cut off by the clock.
  //
  // A failed catalog query is reported as a failure rather than as an empty
  // result. Letting it fall through to the results board told the customer
  // "we don't have an instant match for 77002 yet" — a claim about their
  // market — when what actually happened was that our own request errored.
  useEffect(() => {
    if (view !== "matching") return undefined;

    const startedAt = Date.now();
    let timer;

    const check = () => {
      const elapsed = Date.now() - startedAt;
      const { phase } = resolveAnalysisPhase({
        elapsedMs: elapsed,
        ready: !plansLoading,
        failed: plansError,
      });

      if (phase === "complete") {
        setView("results");
        return;
      }
      if (phase === "failed") {
        setMatchingFailed(true);
        track(EVENTS.COMPARISON_MATCHING_FAILED, { elapsed_ms: elapsed });
        return;
      }
      timer = setTimeout(check, 250);
    };

    check();
    return () => clearTimeout(timer);
    // `plansError` is a dependency, not just a read: a retry that succeeds has
    // to be able to move the screen off the failure state.
  }, [view, plansLoading, plansError, matchAttempt]);

  // Usage is resolved server-side for pricing; this copy is for display only —
  // "estimated at 1,500 kWh a month" — and the server echoes back the figure it
  // actually priced against so the two can never disagree.
  const usageKwh = comparison?.usageKwh ?? resolveUsageKwh(state);

  const renewableResults = useMemo(
    () => results.filter((r) => r.isRenewable),
    [results]
  );

  /**
   * What this comparison is actually worth, as counts.
   *
   * The server sends these, because whether a link can pay is decided by the
   * affiliate configuration the browser never sees. This page used to hand the
   * router `results.length` instead, which said only that results exist — and
   * results existing is not revenue. Most configured links are plain provider
   * pages that earn nothing.
   *
   * The fallback recomputes the same counts from the result DTOs, which do carry
   * `monetizationStatus`. It exists for one case: a response cached before the
   * server started sending these fields, which would otherwise read every count
   * as `undefined`. It compares against the exact contract values rather than
   * "not unavailable", so an internal-tracking-only link is never counted as
   * commission-capable here either.
   */
  const monetizationCounts = useMemo(() => {
    const counts = comparison?.counts;
    const has = (value) => Number.isFinite(value);

    if (has(counts?.commissionCapable) && has(counts?.renewableCommissionCapable)) {
      return {
        resultCount: results.length,
        commissionCapableCount: counts.commissionCapable,
        internalTrackingOnlyCount: counts.internalTrackingOnly ?? 0,
        outboundUnavailableCount: counts.outboundUnavailable ?? 0,
        renewableResultCount: renewableResults.length,
        renewableCommissionCapableCount: counts.renewableCommissionCapable,
      };
    }

    const withStatus = (status) => results.filter((r) => r.monetizationStatus === status).length;
    return {
      resultCount: results.length,
      commissionCapableCount: withStatus(MONETIZATION.COMMISSION_CAPABLE),
      internalTrackingOnlyCount: withStatus(MONETIZATION.INTERNAL_TRACKING_ONLY),
      outboundUnavailableCount: withStatus(MONETIZATION.UNAVAILABLE),
      renewableResultCount: renewableResults.length,
      renewableCommissionCapableCount: renewableResults.filter(
        (r) => r.monetizationStatus === MONETIZATION.COMMISSION_CAPABLE
      ).length,
    };
  }, [comparison, results, renewableResults]);

  const routing = useMemo(
    () => resolveRoute(state, monetizationCounts),
    [state, monetizationCounts]
  );

  // ── Persistence: recoverable at email, complete at results ──
  useEffect(() => {
    if (!state.email) return;
    persistComparison(state, {
      status: view === "results" ? "completed" : "in_progress",
      routing: {
        route: routing.route,
        qualification: routing.qualification,
        lead_score: routing.score,
        // `score_signals` now carries the monetization counts the route was
        // chosen from (see resolveRoute). Note that api/leads.js maps this
        // payload onto lead columns through a strict allowlist and does not
        // write `search_preferences`, so this key is accepted and dropped
        // today — as it already was before this change. The counts are not
        // given columns of their own here on purpose: persisting them needs a
        // migration, which belongs in its own change rather than riding along
        // with a routing fix.
        score_signals: routing.signals,
      },
    });
    // Re-persisting on these transitions keeps the record current without
    // writing on every keystroke.
  }, [state.email, state.phone, view, routing.route]);  

  // ── The email the flow promised ──
  //
  // The contact step tells the visitor "We'll email your comparison", and for
  // as long as this page has existed nothing sent one: /api/send-comparison-
  // results was reachable only from the two legacy quote pages. A promise made
  // to get an email address and then not kept is the worst kind of gap, because
  // the visitor has no way to notice it is us that failed rather than their spam
  // filter.
  //
  // The request carries qualification inputs and the ids on screen — never
  // prices, ranks or links. The endpoint re-runs the same comparison service
  // this page called, so the inbox and the board quote the same figures for the
  // same plan.
  const emailedRef = useRef(null);
  useEffect(() => {
    if (view !== "results" || !state.email || results.length === 0) return;
    // Business supply is quoted rather than listed, so the commercial branch
    // ends in a handover, not a price list — and must not be emailed one.
    if (state.customerType === CUSTOMER_TYPES.COMMERCIAL) return;

    // One send per session per email. The effect re-runs on every results
    // render, and React's development double-invoke would otherwise post twice.
    const sendKey = `${state.sessionId || ""}:${state.email}`;
    if (emailedRef.current === sendKey) return;
    emailedRef.current = sendKey;

    fetch("/api/send-comparison-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: state.email,
        name: state.firstName,
        zipCode: state.zip,
        cityName: state.city,
        state: state.state,
        comparisonType: state.energyPreference === "renewable" ? "renewable" : "residential",
        energyPreference: state.energyPreference,
        shoppingIntent: state.shoppingIntent,
        usageRange: state.usageRange,
        monthlyUsageKwh: state.monthlyUsageKwh,
        monthlyCost: state.monthlyCost,
        billAnalysisStatus: state.billAnalysisStatus,
        billConfidence: state.billConfidence,
        unverifiedFields: state.unverifiedFields,
        sessionId: state.sessionId,
        entryContext: state.entryContext,
        attribution: state.attribution,
        // The plans actually on screen, so a filtered view is what arrives.
        // The server treats these as a narrowing filter over its own results;
        // an id it does not recognise selects nothing.
        planIds: results.map((r) => r.planId),
      }),
    })
      .then((response) => {
        track(
          response.ok ? EVENTS.COMPARISON_EMAIL_SENT : EVENTS.COMPARISON_EMAIL_FAILED,
          { session_id: state.sessionId }
        );
        // A failed send is allowed to be retried by a later results render
        // rather than being permanently marked as done.
        if (!response.ok) emailedRef.current = null;
      })
      .catch(() => {
        emailedRef.current = null;
        track(EVENTS.COMPARISON_EMAIL_FAILED, { session_id: state.sessionId });
      });
  }, [view, state.email, results]);

  useEffect(() => {
    if (view !== "results") return;
    // Counts and enumerated values only. No email, name, phone, ZIP, address
    // or account number goes to analytics, and no destination URL or commission
    // figure either — those live server-side and behind /api/go by design.
    //
    // `result_count` and `commission_capable_count` are reported separately
    // because they answer different questions: how much the customer was shown,
    // and how much of it could earn. Reporting only the first is what made every
    // completed comparison look like an affiliate opportunity.
    const monetizationProps = {
      result_count: monetizationCounts.resultCount,
      commission_capable_count: monetizationCounts.commissionCapableCount,
      internal_tracking_only_count: monetizationCounts.internalTrackingOnlyCount,
      outbound_unavailable_count: monetizationCounts.outboundUnavailableCount,
      renewable_result_count: monetizationCounts.renewableResultCount,
      renewable_commission_capable_count: monetizationCounts.renewableCommissionCapableCount,
      route: routing.route,
    };

    track(EVENTS.RESULTS_VIEWED, {
      customer_type: state.customerType,
      state: state.state,
      // Kept alongside `result_count` so existing dashboards built on it do not
      // break; both carry the same number.
      match_count: results.length,
      ...monetizationProps,
    });
    track(EVENTS.COMPARISON_COMPLETED, { route: routing.route });
    track(EVENTS.COMPARISON_RESULTS_LOADED, {
      match_count: results.length,
      ...monetizationProps,
    });
  }, [view]);  

  const seoBlock = (
    <SEOHead
      title="Compare Electricity Rates Side by Side | Electric Scouts"
      description="Enter your ZIP code and see the electricity plans sold in your area side by side — rate, contract term and early termination fee on the same row."
      canonical="/compare-rates"
      keywords="compare electricity rates, electricity plans, cheapest electricity, energy comparison, deregulated electricity"
      structuredData={[
        getOrganizationSchema(),
        getServiceSchema(),
        getFAQSchema([
          { question: "Will my power go out when I switch electricity providers?", answer: "No. Your local utility still delivers power through the same infrastructure. Only your billing company changes. The switch is seamless with no interruption to your service." },
          { question: "How long does it take to switch electricity providers?", answer: "Enrollment takes 5-10 minutes online. Your new service activates within 1-2 billing cycles (14-45 days depending on your utility)." },
          { question: "Can I switch electricity providers anytime?", answer: "Yes, but you may face early termination fees if you're under contract. Wait until your contract expiration for penalty-free switching. Month-to-month plans can be switched anytime." },
          { question: "How much can I save by switching electricity providers?", answer: "The average household saves $200-$800 per year by switching to a more competitive electricity plan. Savings depend on your current rate, usage, and the plans available in your area." },
          { question: "Is it free to compare electricity rates on Electric Scouts?", answer: `Yes, Electric Scouts is 100% free to use. We compare rates from ${MARKET_TOTALS.providersWithPlans} suppliers across ${MARKET_TOTALS.states} deregulated states. There are no hidden fees or obligations.` },
          { question: "What is a deregulated electricity market?", answer: "In deregulated states, you can choose your electricity provider instead of being locked into your local utility. This competition drives prices down and gives you more plan options including fixed-rate, variable-rate, and renewable energy plans." }
        ]),
        getBreadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "Compare Electricity Rates", url: "/compare-rates" }
        ])
      ]}
    />
  );

  // ── Views that replace the questionnaire ──
  if (view === "matching") {
    return (
      <>
        {seoBlock}
        {/* No activeStage from here on. The questionnaire is finished, so the
            stage indicator must not follow the customer into the analysis and
            results — those are a destination, not another form step. */}
        <ComparisonShell accent={accent} context={context}>
          {matchingFailed ? (
            <AnalysisFailed
              onRetry={() => {
                setMatchingFailed(false);
                // Re-run the request as well as the screen. Without this the
                // retry button restarted a five-second animation over the same
                // cached error and landed back on the same failure.
                refetchComparison();
                setMatchAttempt((n) => n + 1);
                track(EVENTS.COMPARISON_ANALYSIS_STARTED, { retry: true });
              }}
              onConcierge={() => {
                track(EVENTS.CONCIERGE_REQUESTED, { route: ROUTES.CONCIERGE });
                window.location.href = "/home-concierge";
              }}
            />
          ) : (
            <AnalysisLoader name={state.firstName || null} />
          )}
        </ComparisonShell>
      </>
    );
  }

  if (view === "results") {
    return (
      <>
        {seoBlock}
        <ResultsScreen
          state={state}
          accent={accent}
          context={context}
          routing={routing}
          results={results}
          renewableResults={renewableResults}
          usageKwh={usageKwh}
          providerFor={providerFor}
          filters={filters}
          setFilters={setFilters}
          sort={sort}
          setSort={setSort}
          visibleCount={visibleCount}
          setVisibleCount={setVisibleCount}
          showAllPlans={showAllPlans}
          setShowAllPlans={setShowAllPlans}
        />
      </>
    );
  }

  if (view === "bill_upload") {
    return (
      <>
        {seoBlock}
        <ComparisonShell activeStage="usage" accent={accent} context={context}>
          <QuestionFrame
            questionKey="bill_upload"
            title={
              state.customerType === CUSTOMER_TYPES.COMMERCIAL
                ? "Upload your business electricity bill"
                : "Upload your electricity bill"
            }
            subtitle="We'll read your usage from it so you answer fewer questions."
            onBack={() => setView("question")}
          >
            <BillUpload
              customerType={state.customerType}
              onAnalysisStart={() => track(EVENTS.BILL_UPLOAD_STARTED)}
              onComplete={({ fields, confidence, unverified }) => {
                const { billZip, ...energyFields } = fields;
                update({
                  ...energyFields,
                  billUploaded: true,
                  billOffered: true,
                  billAnalysisStatus: "complete",
                  billConfidence: confidence,
                  billAnalyzedAt: new Date().toISOString(),
                  unverifiedFields: unverified,
                  // The typed ZIP is the service location the visitor cares
                  // about, so a bill ZIP only fills a gap.
                  zip: state.zip || billZip || "",
                });
                track(EVENTS.BILL_ANALYSIS_COMPLETED, { confidence });
                setView("bill_summary");
              }}
              onFailure={() => {
                update({ billAnalysisStatus: "failed", billUploaded: true });
                track(EVENTS.BILL_ANALYSIS_FAILED);
              }}
              onSkip={() => {
                update({ billOffered: true, billAnalysisStatus: "none" });
                track(EVENTS.BILL_SKIPPED);
                setView("question");
              }}
            />
          </QuestionFrame>
        </ComparisonShell>
      </>
    );
  }

  if (view === "bill_summary") {
    return (
      <>
        {seoBlock}
        <ComparisonShell activeStage="usage" accent={accent} context={context}>
          <QuestionFrame
            questionKey="bill_summary"
            title="Here's what we found"
            onBack={() => setView("bill_upload")}
          >
            <BillSummary
              state={state}
              onConfirm={() => setView("question")}
              onEdit={() => {
                // Editing means re-asking: drop the figures so the ordinary
                // questions come back rather than showing a second form.
                update({
                  monthlyUsageKwh: null,
                  monthlyCost: null,
                  usageRange: "",
                  monthlySpendRange: "",
                  billConfidence: null,
                  unverifiedFields: [],
                });
                setView("question");
              }}
            />
          </QuestionFrame>
        </ComparisonShell>
      </>
    );
  }

  // ── The questionnaire ──
  if (!currentQuestion) {
    return (
      <>
        {seoBlock}
        <ComparisonShell accent={accent} context={context}>
          <AnalysisLoader name={state.firstName || null} />
        </ComparisonShell>
      </>
    );
  }

  return (
    <>
      {seoBlock}
      <ComparisonShell activeStage={stageForQuestion(currentQuestion.id)} accent={accent} context={context}>
        <QuestionScreen
          question={currentQuestion}
          state={state}
          update={update}
          setState={setState}
          setView={setView}
          onBack={state.history.length > 1 ? handleBack : null}
          // Offered from the moment a service is known — including when it came
          // from a landing page rather than from an answer on this screen.
          onChangeService={
            currentQuestion.id !== "customer_type" &&
            (state.customerType || state.energyPreference)
              ? handleChangeService
              : null
          }
        />
      </ComparisonShell>
    </>
  );
}

/* ─────────────────────────────────────────────────────────── */

/** Reset the field a Back navigation is returning to. */
function clearAnswerFor(questionId, prev) {
  switch (questionId) {
    case "zip": return { zip: "", state: "", city: "" };
    case "customer_type": return { customerType: "", energyPreference: "" };
    case "renewable_context": return { customerType: "" };
    case "property_type": return { propertyType: "" };
    case "business_type": return { businessType: "" };
    case "bill_offer": return { billOffered: false };
    case "usage_range": return { usageRange: "" };
    case "shopping_intent": return { shoppingIntent: "" };
    case "commercial_spend": return { monthlySpendRange: "" };
    case "commercial_timing": return { timing: "" };
    case "business_name": return { businessName: "" };
    case "name": return { firstName: "" };
    case "last_name": return { lastName: "" };
    case "email": return { email: "" };
    case "phone": return { phone: "" };
    default: return prev;
  }
}

function QuestionScreen({ question, state, update, setState, setView, onBack, onChangeService }) {
  const title = resolveCopy(question.title, state);
  const subtitle = resolveCopy(question.subtitle, state);

  const frameProps = {
    questionKey: question.id,
    title,
    subtitle,
    onBack,
    footer: onChangeService ? <ChangeServiceButton onClick={onChangeService} /> : null,
  };

  // Every question that holds a draft is keyed on the question id.
  //
  // These components seed their input from `state` with useState, which only
  // runs its initialiser on mount. One ContactQuestion serves the name, email
  // and phone questions, so without a key React saw the same component type in
  // the same position, kept the mounted instance across the transition, and
  // carried the draft with it — the name the visitor had just typed reappeared
  // as the prefilled email, then as the phone number.
  //
  // QuestionFrame's own `key` cannot do this job: it sits on the div that frame
  // returns, so it restarts the entrance animation but has no bearing on the
  // reconciliation of the stateful component rendered above it.
  switch (question.type) {
    case "zip":
      return <ZipQuestion key={question.id} {...frameProps} state={state} update={update} />;

    case "choice":
      return (
        <QuestionFrame {...frameProps}>
          <ChoiceGroup
            name={title}
            options={question.options}
            value={valueForChoice(question.id, state)}
            onSelect={(value) => applyChoice(question.id, value, state, setState, update)}
          />
        </QuestionFrame>
      );

    case "bill_offer":
      return (
        <QuestionFrame {...frameProps}>
          <BillOffer
            onUpload={() => {
              track(EVENTS.BILL_UPLOAD_OFFERED);
              setView("bill_upload");
            }}
            onSkip={() => {
              update({ billOffered: true });
              track(EVENTS.BILL_SKIPPED);
            }}
          />
        </QuestionFrame>
      );

    case "verify":
      return <VerifyQuestion key={question.id} {...frameProps} state={state} update={update} />;

    case "text":
    case "email":
    case "phone":
      return (
        <ContactQuestion
          key={question.id}
          {...frameProps}
          question={question}
          state={state}
          update={update}
        />
      );

    default:
      return null;
  }
}

/**
 * The escape hatch out of a branch.
 *
 * Deliberately quiet — it sits opposite Back as a text link rather than a
 * button, because it is a correction, not a step in the flow.
 */
function ChangeServiceButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm text-gray-500 hover:text-gray-900 transition-colors rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5C8C] focus-visible:ring-offset-2 px-1 py-1 -mr-1"
    >
      Change electricity type
    </button>
  );
}

function valueForChoice(questionId, state) {
  switch (questionId) {
    case "customer_type":
      if (state.energyPreference === "renewable") return "renewable";
      return state.customerType === CUSTOMER_TYPES.COMMERCIAL ? "business"
        : state.customerType === CUSTOMER_TYPES.RESIDENTIAL ? "home" : "";
    case "renewable_context":
      return state.customerType === CUSTOMER_TYPES.COMMERCIAL ? "business"
        : state.customerType === CUSTOMER_TYPES.RESIDENTIAL ? "home" : "";
    case "property_type": return state.propertyType;
    case "business_type": return state.businessType;
    case "usage_range": return state.usageRange;
    case "shopping_intent": return state.shoppingIntent;
    case "commercial_spend": return state.monthlySpendRange;
    case "commercial_timing": return state.timing;
    default: return "";
  }
}

function applyChoice(questionId, value, state, setState, update) {
  switch (questionId) {
    case "customer_type": {
      if (value === "renewable") {
        update({ energyPreference: "renewable", customerType: "" });
        track(EVENTS.CUSTOMER_TYPE_SELECTED, { customer_type: "renewable" });
        return;
      }
      const next = value === "business" ? CUSTOMER_TYPES.COMMERCIAL : CUSTOMER_TYPES.RESIDENTIAL;
      // Branch switches must drop the other branch's answers, or a lead ends up
      // carrying a property type and a business type at the same time.
      setState((prev) => ({ ...invalidateBranchState(prev, next), energyPreference: "" }));
      track(EVENTS.CUSTOMER_TYPE_SELECTED, { customer_type: next });
      return;
    }
    case "renewable_context": {
      const next = value === "business" ? CUSTOMER_TYPES.COMMERCIAL : CUSTOMER_TYPES.RESIDENTIAL;
      setState((prev) => invalidateBranchState(prev, next));
      track(EVENTS.RENEWABLE_CONTEXT_SELECTED, { customer_type: next });
      return;
    }
    case "property_type":
      update({ propertyType: value });
      track(EVENTS.PROPERTY_TYPE_SELECTED, { property_type: value });
      return;
    case "business_type":
      update({ businessType: value });
      track(EVENTS.BUSINESS_TYPE_SELECTED, { business_type: value });
      return;
    case "usage_range":
      update({ usageRange: value });
      track(EVENTS.USAGE_SELECTED, { usage_range: value });
      return;
    case "shopping_intent":
      update({ shoppingIntent: value });
      track(EVENTS.SHOPPING_INTENT_SELECTED, { intent: value });
      return;
    case "commercial_spend":
      update({ monthlySpendRange: value });
      track(EVENTS.COMMERCIAL_SPEND_SELECTED, { spend_range: value });
      return;
    case "commercial_timing":
      update({ timing: value });
      track(EVENTS.COMMERCIAL_TIMING_SELECTED, { timing: value });
      return;
    default:
  }
}

function ZipQuestion({ questionKey, title, subtitle, onBack, footer, state, update }) {
  const [draft, setDraft] = useState(state.zip || "");
  const [error, setError] = useState("");

  const submit = () => {
    // The same serviceability check the landing pages run, so a ZIP is accepted
    // or refused identically whichever door the visitor came through.
    const result = checkServiceZip(draft);

    if (!result.valid) {
      setError(result.message);
      return;
    }

    setError("");
    update({ zip: result.zip, state: result.state, city: getCityFromZip(result.zip) || "" });
    track(EVENTS.ZIP_COMPLETED, { state: result.state });
  };

  return (
    <QuestionFrame questionKey={questionKey} title={title} subtitle={subtitle} onBack={onBack} footer={footer}>
      <TextQuestion
        id="zip"
        label="ZIP code"
        inputMode="numeric"
        autoComplete="postal-code"
        placeholder="77001"
        maxLength={5}
        value={draft}
        onChange={(v) => {
          setDraft(v.replace(/\D/g, "").slice(0, 5));
          if (error) setError("");
        }}
        onSubmit={submit}
        error={error}
        disabled={draft.length !== 5}
      />
      <TrustNote>
        No obligation, and comparing is free. Your information is protected.
      </TrustNote>
    </QuestionFrame>
  );
}

/**
 * Low-confidence verification.
 *
 * Asks about the single value we're unsure of, rather than re-running the whole
 * questionnaire because one number looked odd.
 */
function VerifyQuestion({ questionKey, onBack, footer, state, update }) {
  const field = state.unverifiedFields[0];
  const [draft, setDraft] = useState(
    field === "monthlyUsageKwh" && state.monthlyUsageKwh
      ? String(Math.round(state.monthlyUsageKwh))
      : ""
  );

  const label = field === "monthlyUsageKwh" ? "Monthly usage (kWh)" : "Rate (¢/kWh)";
  const shown = field === "monthlyUsageKwh"
    ? `${Math.round(state.monthlyUsageKwh || 0).toLocaleString()} kWh`
    : `${state.effectiveRate}¢/kWh`;

  const accept = () => update({ unverifiedFields: state.unverifiedFields.slice(1) });

  const save = () => {
    const parsed = parseFloat(draft);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    update({
      [field]: parsed,
      unverifiedFields: state.unverifiedFields.slice(1),
      billConfidence: "high",
    });
  };

  return (
    <QuestionFrame
      questionKey={questionKey}
      title={`We found about ${shown}. Does that look right?`}
      subtitle="We want to get your estimate right before we match plans."
      onBack={onBack}
      footer={footer}
    >
      <div className="space-y-3">
        <PrimaryAction onClick={accept}>Yes, that&rsquo;s right</PrimaryAction>
      </div>

      <div className="mt-6 pt-5 border-t border-gray-100">
        <TextQuestion
          id="verify-field"
          label={label}
          inputMode="decimal"
          value={draft}
          onChange={setDraft}
          onSubmit={save}
          submitLabel="Use this instead"
          disabled={!draft}
        />
      </div>
    </QuestionFrame>
  );
}

function ContactQuestion({ questionKey, title, subtitle, onBack, footer, question, state, update }) {
  // Explicit per-question wiring. The previous chained ternary fell through to
  // state.phone for anything it did not name, so adding a question silently
  // pre-filled it with the phone number — the carryover class of bug.
  const FIELDS = {
    business_name: {
      stateKey: "businessName",
      validate: (v) => {
        const value = String(v ?? "").trim().slice(0, 160);
        return value
          ? { valid: true, value, error: null }
          : { valid: false, value: null, error: "Enter a business name." };
      },
      event: null,
    },
    name: { stateKey: "firstName", validate: validateFirstName, event: EVENTS.NAME_COMPLETED },
    last_name: { stateKey: "lastName", validate: validateLastName, event: EVENTS.LAST_NAME_COMPLETED },
    email: { stateKey: "email", validate: validateEmail, event: EVENTS.EMAIL_COMPLETED },
    phone: { stateKey: "phone", validate: validatePhone, event: EVENTS.PHONE_COMPLETED },
  };

  const field = FIELDS[question.id] || FIELDS.name;
  const stored = state[field.stateKey];

  // Phone is stored E.164 but shown in the readable form the customer typed.
  const [draft, setDraft] = useState(
    question.id === "phone" && stored ? formatPhone(stored) : stored || ""
  );
  const [error, setError] = useState("");
  const [focusSignal, setFocusSignal] = useState(0);

  const submit = () => {
    const result = field.validate(draft);

    if (!result.valid) {
      // The entered value is deliberately left in the field: clearing it makes
      // the customer retype a near-correct value to fix a typo.
      setError(result.error);
      setFocusSignal((n) => n + 1);
      return;
    }

    setError("");
    const patch = { [field.stateKey]: result.value };
    // Consent is recorded with the email that it attaches to.
    if (question.id === "email") patch.consentContact = true;
    update(patch);
    if (field.event) track(field.event);
  };

  const inputProps = {
    email: { type: "email", inputMode: "email" },
    phone: { type: "tel", inputMode: "tel" },
  }[question.id] || { type: "text" };

  return (
    <QuestionFrame questionKey={questionKey} title={title} subtitle={subtitle} onBack={onBack} footer={footer}>
      <TextQuestion
        focusSignal={focusSignal}
        id={question.id}
        label={question.inputLabel}
        autoComplete={question.autoComplete}
        value={draft}
        onChange={(v) => {
          setDraft(v);
          if (error) setError("");
        }}
        onSubmit={submit}
        error={error}
        disabled={!draft.trim()}
        {...inputProps}
      />

      {question.id === "email" && (
        <TrustNote>
          We&rsquo;ll email your comparison. We don&rsquo;t sell your details, and
          we&rsquo;ll tell you before sharing anything with an energy provider.
        </TrustNote>
      )}
      {question.id === "phone" && (
        <TrustNote>
          Used for updates about your comparison. No obligation.
        </TrustNote>
      )}
    </QuestionFrame>
  );
}

/* ─────────────────────────────────────────────────────────── */

/**
 * The results board.
 *
 * Presentation only. Every result arrives priced, ranked, scored and routed by
 * the server; this component decides how those look, never what they are. It
 * may filter, sort and paginate the authoritative set — none of which invents a
 * number — and it formats currency and percentages. It does not compute a cost,
 * a saving, a score or a winner.
 */
function ResultsScreen({
  state, accent, context, routing, results, renewableResults, usageKwh,
  filters, setFilters, sort, setSort, visibleCount, setVisibleCount,
  showAllPlans, setShowAllPlans, providerFor,
}) {
  const [openDetails, setOpenDetails] = useState(null);

  // Business supply is quoted, not listed — so the commercial branch ends in a
  // confirmation rather than a price list it cannot honestly produce.
  if (state.customerType === CUSTOMER_TYPES.COMMERCIAL) {
    return (
      <ComparisonShell accent={accent} context={context}>
        <CommercialComplete state={state} qualification={routing.qualification} />
      </ComparisonShell>
    );
  }

  if (results.length === 0) {
    return (
      <ComparisonShell accent={accent} context={context}>
        <NoMatchState
          zip={state.zip}
          onConcierge={() => {
            track(EVENTS.CONCIERGE_REQUESTED, { route: ROUTES.CONCIERGE });
            window.location.href = "/home-concierge";
          }}
          onBroaden={() => { window.location.href = "/all-providers"; }}
        />
      </ComparisonShell>
    );
  }

  const wantsRenewable = state.energyPreference === "renewable";
  const noRenewableInventory = wantsRenewable && renewableResults.length === 0;

  // A renewable request narrows the pool to renewable plans while any exist;
  // "show all" is the customer's own escape hatch from that.
  const pool = wantsRenewable && !showAllPlans && renewableResults.length > 0
    ? renewableResults
    : results;

  // Filters act on the authoritative set. They remove results; they never
  // change what a surviving result costs or scores, and the server's rank order
  // is preserved through the filter.
  const filteredPool = pool.filter((result) => {
    if (filters.provider !== "all" && result.providerName !== filters.provider) return false;
    if (filters.term !== "all" && Number(result.termMonths) !== Number(filters.term)) return false;
    if (filters.planType !== "all" && result.rateType !== filters.planType) return false;
    if (filters.renewableOnly && Number(result.renewablePercentage) < 50) return false;
    return true;
  });

  // The headline set is re-selected — not re-scored — from the filtered
  // results, so the three best matches are the best of what the customer is
  // actually looking at. `selectHeadline` is the same function the server ran
  // for the unfiltered set: it reads rank and pricing completeness and picks;
  // it cannot produce a score, a price or an order of its own.
  const { headline, rest } = selectHeadline(filteredPool);
  const sortedRest = sortResults(rest, sort);
  const visible = sortedRest.slice(0, visibleCount);
  const remaining = sortedRest.length - visible.length;

  // Per-card sponsorship disclosure only means something when monetization is
  // not universal. Every listed plan currently resolves to a referral link, so
  // badging all of them would be noise; the page-level disclosure below covers
  // the standing commercial relationship instead.
  const monetizedCount = filteredPool.filter(
    (r) => r.monetizationStatus !== MONETIZATION.UNAVAILABLE
  ).length;
  const discloseSponsored =
    monetizedCount > 0 && monetizedCount < filteredPool.length;

  /**
   * The outbound URL for a result.
   *
   * The route itself is built and authorized by the server and arrives on the
   * result; all that happens here is stamping on where the customer clicked it,
   * which is only knowable at render time. The browser never assembles a
   * provider destination — /api/go resolves that from the slug at click time,
   * so nothing sent from here can redirect the revenue.
   */
  const referralUrlFor = (result, section, position) =>
    withResultPlacement(result.trackedOutboundRoute, section, position);

  /** Fire-and-forget analytics; navigation is the anchor's job, not ours. */
  const onReferralClick = (result, section, position) => {
    track(EVENTS.VIEW_PLAN_CLICKED, {
      provider: result.providerName,
      plan_id: result.planId,
      route: routing.route,
      session_id: state.sessionId,
      result_section: section,
      result_position: position,
      match_score: result.matchScore ?? null,
      monetization: result.monetizationStatus,
      sort,
    });
    if (result.monetizationStatus !== MONETIZATION.UNAVAILABLE) {
      track(EVENTS.REFERRAL_LINK_OPENED, {
        plan_id: result.planId,
        provider: result.providerName,
      });
    }
  };

  const showDetails = (result) => {
    setOpenDetails((current) => (current === result.planId ? null : result.planId));
    track(EVENTS.PLAN_DETAILS_OPENED, { plan_id: result.planId, provider: result.providerName });
  };

  return (
    <ComparisonShell accent={accent} context={context} wide>
      <div className="mb-6">
        <h1 className="text-[22px] sm:text-[26px] font-semibold text-gray-900 tracking-[-0.01em]">
          Electricity options for {state.city || state.zip}
        </h1>
        <p className="mt-1.5 text-[15px] text-gray-600">
          Estimated at {Math.round(usageKwh).toLocaleString()} kWh a month
          {state.billAnalysisStatus === "complete" ? " from your bill" : ""}.
        </p>
      </div>

      {noRenewableInventory && (
        <RenewableFallback
          onConcierge={() => {
            track(EVENTS.CONCIERGE_REQUESTED, { route: ROUTES.RENEWABLE_PARTNER });
            window.location.href = "/home-concierge";
          }}
          onShowAll={() => setShowAllPlans(true)}
        />
      )}

      <ResultsToolbar
        results={pool}
        filters={filters}
        onFilterChange={(next) => {
          setFilters(next);
          setVisibleCount(RESULTS_PAGE_SIZE);
          track(EVENTS.RESULTS_FILTER_APPLIED, { session_id: state.sessionId });
        }}
        sort={sort}
        onSortChange={(next) => {
          setSort(next);
          track(EVENTS.RESULTS_SORT_CHANGED, { sort: next, session_id: state.sessionId });
        }}
        resultCount={filteredPool.length}
      />

      {filteredPool.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-6 text-center">
          <p className="text-[15px] text-gray-700">No plans match those filters.</p>
          <div className="mt-4 max-w-xs mx-auto">
            <SecondaryAction
              onClick={() =>
                setFilters({ provider: "all", term: "all", planType: "all", renewableOnly: false })
              }
            >
              Clear filters
            </SecondaryAction>
          </div>
        </div>
      ) : (
        <>
          {headline.length > 0 && (
            <section aria-labelledby="best-matches-heading" className="mb-10">
              <h2
                id="best-matches-heading"
                className="text-[15px] font-semibold text-gray-900 mb-3"
              >
                Top {headline.length === 1 ? "match" : `${headline.length} matches`} for you
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {headline.map((result, index) => (
                  <div key={result.planId} className="flex flex-col">
                    <BestMatchCard
                      result={result}
                      // Where this card sits in the headline row. The match
                      // score and label beside it are the server's; this is a
                      // display ordinal for the badge, not a judgement.
                      position={index + 1}
                      provider={providerFor(result)}
                      usageKwh={usageKwh}
                      href={referralUrlFor(result, RESULT_SECTIONS.TOP_MATCH, index + 1)}
                      onReferralClick={() =>
                        onReferralClick(result, RESULT_SECTIONS.TOP_MATCH, index + 1)}
                      onDetails={showDetails}
                      isSponsored={
                        discloseSponsored && result.monetizationStatus !== MONETIZATION.UNAVAILABLE
                      }
                    />
                    {openDetails === result.planId && (
                      <PlanDetails
                        result={result}
                        usageKwh={usageKwh}
                        onClose={() => setOpenDetails(null)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {sortedRest.length > 0 && (
            <section aria-labelledby="more-options-heading">
              <h2
                id="more-options-heading"
                className="text-[15px] font-semibold text-gray-900 mb-3"
              >
                More electricity options
              </h2>
              <div className="space-y-3">
                {visible.map((result, index) => (
                  <div key={result.planId}>
                    <PlanRow
                      result={result}
                      provider={providerFor(result)}
                      usageKwh={usageKwh}
                      href={referralUrlFor(result, RESULT_SECTIONS.MORE_OPTIONS, index + 1)}
                      onReferralClick={() =>
                        onReferralClick(result, RESULT_SECTIONS.MORE_OPTIONS, index + 1)}
                      onDetails={showDetails}
                      isSponsored={
                        discloseSponsored && result.monetizationStatus !== MONETIZATION.UNAVAILABLE
                      }
                    />
                    {openDetails === result.planId && (
                      <PlanDetails
                        result={result}
                        usageKwh={usageKwh}
                        onClose={() => setOpenDetails(null)}
                      />
                    )}
                  </div>
                ))}
              </div>

              {remaining > 0 && (
                <ViewMoreButton
                  remaining={remaining}
                  onClick={() => {
                    setVisibleCount((n) => n + RESULTS_PAGE_SIZE);
                    track(EVENTS.RESULTS_SHOW_MORE, {
                      shown: visible.length + RESULTS_PAGE_SIZE,
                      session_id: state.sessionId,
                    });
                  }}
                />
              )}
            </section>
          )}
        </>
      )}

      <p className="mt-8 text-[12px] text-gray-500 leading-relaxed">
        Estimates use your stated usage and the plan components we hold — energy
        charge, base charge, delivery and bill credits where available. Your
        actual bill depends on your utility, taxes and real usage. Verify all
        details with the provider before enrolling. Electric Scouts is a
        comparison service and may earn a commission when you enroll through a
        listed plan; that relationship never changes how plans are ranked.
      </p>
    </ComparisonShell>
  );
}

/**
 * Reorder authoritative results.
 *
 * Every key here is a field the server already decided; sorting reads them and
 * never recomputes one. "Best match" is the server's own rank order, which is
 * why it is the default and why it needs no comparator of its own.
 */
function sortResults(results, sort) {
  const list = [...results];

  // A result we could not price must never sort as though it cost nothing —
  // that would put the plans we know least about at the top of a cheapest-first
  // list. They sort last, whichever direction the customer asked for.
  const byCost = (result) => {
    const amount = result.estimatedMonthlyCost ?? result.supplyEstimate;
    return amount === null || amount === undefined ? Number.POSITIVE_INFINITY : amount;
  };
  const numeric = (value, fallback) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback;

  switch (sort) {
    case "cost":
      return list.sort((a, b) => byCost(a) - byCost(b));
    case "rate":
      return list.sort(
        (a, b) => numeric(a.ratePerKwh, Infinity) - numeric(b.ratePerKwh, Infinity)
      );
    case "term_short":
      return list.sort(
        (a, b) => numeric(a.termMonths, Infinity) - numeric(b.termMonths, Infinity)
      );
    case "term_long":
      return list.sort((a, b) => numeric(b.termMonths, -1) - numeric(a.termMonths, -1));
    case "renewable":
      return list.sort(
        (a, b) => numeric(b.renewablePercentage, -1) - numeric(a.renewablePercentage, -1)
      );
    default:
      return list;
  }
}
