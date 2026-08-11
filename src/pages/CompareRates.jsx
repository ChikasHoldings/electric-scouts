import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { ElectricityPlan } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import SEOHead, {
  getOrganizationSchema,
  getServiceSchema,
  getFAQSchema,
  getBreadcrumbSchema,
} from "@/components/SEOHead";

import { getCityFromZip } from "../components/compare/providerAvailability";
import { calculateMonthlyBill } from "../components/compare/dataValidation";
import { useAffiliateLinks } from "@/hooks/useAffiliateLink";

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
  MatchingState,
  PlanCard,
  ResultsFilters,
  NoMatchState,
  CommercialComplete,
  RenewableFallback,
} from "../components/compare/ui/ResultsView";

/**
 * /compare-rates — the shared comparison engine.
 *
 * This page orchestrates; it does not decide. What to ask next comes from
 * `determineNextQuestion`, what a completed session is worth comes from
 * `resolveRoute`, and what a bill means comes from `billAnalysis`. Keeping the
 * decisions in testable modules is what stopped this file from becoming the
 * 1,500-line conditional tree it replaced.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CompareRates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState(() => createInitialState());
  const [view, setView] = useState("question"); // question | bill_upload | bill_summary | matching | results
  const [showAllPlans, setShowAllPlans] = useState(false);
  const [termFilter, setTermFilter] = useState("all");
  const [renewableOnly, setRenewableOnly] = useState(false);
  const { getAffiliateUrl } = useAffiliateLinks();

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
  }, [currentQuestion, view, state.email]);

  // Hold matching briefly, then show results.
  //
  // Kept in its own effect keyed on `view` alone: when the timer lived in the
  // effect above, setting the view re-ran that effect, and its cleanup cancelled
  // the very timeout it had just scheduled — leaving the page stuck on
  // "Finding your electricity options…" forever.
  useEffect(() => {
    if (view !== "matching") return;
    const timer = setTimeout(() => setView("results"), 900);
    return () => clearTimeout(timer);
  }, [view]);

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

  // ── Plans ──
  const { data: allPlans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: () => ElectricityPlan.list(),
    placeholderData: [],
  });

  const usageKwh = resolveUsageKwh(state);

  const eligiblePlans = useMemo(() => {
    if (!state.state) return [];
    const isCommercial = state.customerType === CUSTOMER_TYPES.COMMERCIAL;

    // `customer_type` carries three values, and 'renewable' is a residential
    // product rather than a third audience — matching it strictly against
    // 'residential' would hide every green plan from the people asking for one.
    const accepted = isCommercial
      ? ["business"]
      : ["residential", "renewable"];

    return allPlans.filter(
      (plan) =>
        plan.state === state.state &&
        (!plan.customer_type || accepted.includes(plan.customer_type))
    );
  }, [allPlans, state.state, state.customerType]);

  const renewablePlans = useMemo(
    () =>
      eligiblePlans.filter(
        (p) => Number(p.renewable_percentage) >= 50 || p.customer_type === "renewable"
      ),
    [eligiblePlans]
  );

  const routing = useMemo(
    () =>
      resolveRoute(state, {
        matchCount: eligiblePlans.length,
        renewableMatchCount: renewablePlans.length,
      }),
    [state, eligiblePlans.length, renewablePlans.length]
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
        score_signals: routing.signals,
      },
    });
    // Re-persisting on these transitions keeps the record current without
    // writing on every keystroke.
  }, [state.email, state.phone, view, routing.route]);  

  useEffect(() => {
    if (view !== "results") return;
    track(EVENTS.RESULTS_VIEWED, {
      customer_type: state.customerType,
      state: state.state,
      match_count: eligiblePlans.length,
      route: routing.route,
    });
    track(EVENTS.COMPARISON_COMPLETED, { route: routing.route });
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
          { question: "Is it free to compare electricity rates on Electric Scouts?", answer: "Yes, Electric Scouts is 100% free to use. We compare rates from 40+ providers across 12 deregulated states. There are no hidden fees or obligations." },
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
        <ComparisonShell activeStage="matches">
          <MatchingState />
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
          routing={routing}
          plans={eligiblePlans}
          renewablePlans={renewablePlans}
          usageKwh={usageKwh}
          getAffiliateUrl={getAffiliateUrl}
          termFilter={termFilter}
          setTermFilter={setTermFilter}
          renewableOnly={renewableOnly}
          setRenewableOnly={setRenewableOnly}
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
        <ComparisonShell activeStage="usage">
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
        <ComparisonShell activeStage="usage">
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
        <ComparisonShell activeStage="matches">
          <MatchingState />
        </ComparisonShell>
      </>
    );
  }

  return (
    <>
      {seoBlock}
      <ComparisonShell activeStage={stageForQuestion(currentQuestion.id)}>
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

  switch (question.type) {
    case "zip":
      return <ZipQuestion {...frameProps} state={state} update={update} />;

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
      return <VerifyQuestion {...frameProps} state={state} update={update} />;

    case "text":
    case "email":
    case "phone":
      return (
        <ContactQuestion
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
  const initial =
    question.id === "business_name" ? state.businessName
      : question.id === "name" ? state.firstName
        : question.id === "email" ? state.email
          : state.phone;

  const [draft, setDraft] = useState(initial || "");
  const [error, setError] = useState("");

  const submit = () => {
    const value = draft.trim();

    if (question.id === "email") {
      if (!EMAIL_RE.test(value)) {
        setError("Enter a valid email address so we can send your matches.");
        return;
      }
      update({ email: value, consentContact: true });
      track(EVENTS.EMAIL_COMPLETED);
      return;
    }

    if (question.id === "phone") {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 10) {
        setError("Enter a 10-digit phone number.");
        return;
      }
      update({ phone: digits.slice(0, 15) });
      track(EVENTS.PHONE_COMPLETED);
      return;
    }

    if (!value) {
      setError("This one's required.");
      return;
    }

    if (question.id === "business_name") {
      update({ businessName: value.slice(0, 160) });
    } else {
      update({ firstName: value.slice(0, 80) });
      track(EVENTS.NAME_COMPLETED);
    }
  };

  const inputProps = {
    email: { type: "email", inputMode: "email" },
    phone: { type: "tel", inputMode: "tel" },
  }[question.id] || { type: "text" };

  return (
    <QuestionFrame questionKey={questionKey} title={title} subtitle={subtitle} onBack={onBack} footer={footer}>
      <TextQuestion
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

function ResultsScreen({
  state, routing, plans, renewablePlans, usageKwh, getAffiliateUrl,
  termFilter, setTermFilter, renewableOnly, setRenewableOnly,
  showAllPlans, setShowAllPlans,
}) {
  // Business supply is quoted, not listed — so the commercial branch ends in a
  // confirmation rather than a price list it cannot honestly produce.
  if (state.customerType === CUSTOMER_TYPES.COMMERCIAL) {
    return (
      <ComparisonShell activeStage="matches">
        <CommercialComplete state={state} qualification={routing.qualification} />
      </ComparisonShell>
    );
  }

  const wantsRenewable = state.energyPreference === "renewable";
  const noRenewableInventory = wantsRenewable && renewablePlans.length === 0;

  const source = wantsRenewable && !showAllPlans && renewablePlans.length > 0
    ? renewablePlans
    : plans;

  const filtered = source
    .filter((plan) => {
      if (renewableOnly && Number(plan.renewable_percentage) < 50) return false;
      if (termFilter === "12" && Number(plan.contract_length) !== 12) return false;
      if (termFilter === "24" && Number(plan.contract_length) !== 24) return false;
      if (termFilter === "month" && Number(plan.contract_length) > 1) return false;
      return true;
    })
    .sort((a, b) => Number(a.rate_per_kwh) - Number(b.rate_per_kwh));

  if (plans.length === 0) {
    return (
      <ComparisonShell activeStage="matches">
        <NoMatchState
          zip={state.zip}
          onConcierge={() => {
            track(EVENTS.CONCIERGE_CREATED, { route: ROUTES.CONCIERGE });
            window.location.href = "/home-concierge";
          }}
          onBroaden={() => { window.location.href = "/all-providers"; }}
        />
      </ComparisonShell>
    );
  }

  return (
    <ComparisonShell activeStage="matches" wide>
      <div className="mb-6">
        <h1 className="text-[22px] sm:text-[26px] font-semibold text-gray-900 tracking-[-0.01em]">
          {filtered.length} {filtered.length === 1 ? "plan" : "plans"} for{" "}
          {state.city || state.zip}
        </h1>
        <p className="mt-1.5 text-[15px] text-gray-600">
          Estimated on {Math.round(usageKwh).toLocaleString()} kWh a month
          {state.billAnalysisStatus === "complete" ? " from your bill" : ""}.
        </p>
      </div>

      {noRenewableInventory && (
        <RenewableFallback
          onConcierge={() => {
            track(EVENTS.CONCIERGE_CREATED, { route: ROUTES.RENEWABLE_PARTNER });
            window.location.href = "/home-concierge";
          }}
          onShowAll={() => setShowAllPlans(true)}
        />
      )}

      <ResultsFilters
        termFilter={termFilter}
        onTermChange={setTermFilter}
        renewableOnly={renewableOnly}
        onRenewableChange={setRenewableOnly}
      />

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-6 text-center">
          <p className="text-[15px] text-gray-700">
            No plans match those filters.
          </p>
          <div className="mt-4 max-w-xs mx-auto">
            <SecondaryAction
              onClick={() => {
                setTermFilter("all");
                setRenewableOnly(false);
              }}
            >
              Clear filters
            </SecondaryAction>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              estimatedMonthly={calculateMonthlyBill(plan, usageKwh)}
              onSelect={(selected) => {
                track(EVENTS.AFFILIATE_CLICKED, {
                  provider: selected.provider_name,
                  plan_id: selected.id,
                  route: routing.route,
                });
                // Routes through /api/go when an affiliate link exists for the
                // plan, and falls back to the provider's own plan page when it
                // doesn't — so a plan without a commercial relationship is
                // still usable rather than a dead button.
                const url = getAffiliateUrl({
                  offerId: selected.id,
                  fallbackUrl: selected.plan_details_url || "",
                });
                if (url && url !== "#") window.open(url, "_blank", "noopener,noreferrer");
              }}
            />
          ))}
        </div>
      )}

      <p className="mt-8 text-[12px] text-gray-500 leading-relaxed">
        Rates, plan details and availability vary by ZIP code, usage and credit,
        and change over time. Verify all details with the provider before
        enrolling. Electric Scouts is a comparison service and may earn a
        commission when you enroll through a listed plan.
      </p>
    </ComparisonShell>
  );
}
