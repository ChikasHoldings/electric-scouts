import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Building2, Home, Info, Leaf, Plug, ScrollText } from "lucide-react";

import { ElectricityPlan } from "@/api/supabaseEntities";
import SEOHead, { getBreadcrumbSchema, getFAQSchema } from "@/components/SEOHead";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import ZipHandoffForm from "@/components/landing/ZipHandoffForm";
import {
  DataTable,
  FaqList,
  FinalCta,
  InfoCard,
  RelatedLinks,
  Section,
  SectionHeading,
} from "@/components/landing/LandingSections";
import { captureAttributionFromWindow, campaignContext } from "@/components/compare/engine/attribution";
import { track, EVENTS } from "@/components/compare/engine/analytics";
import { ENTRY_CONTEXTS } from "@/components/compare/engine/entryContext";
import { getStates } from "@/seo/locations";
import { formatRate, getStateMarket, MARKET_GENERATED_AT } from "@/seo/market.js";

/**
 * /renewable-energy — the entry page for renewable supply.
 *
 * The page explains what a renewable plan on a competitive market actually is,
 * and says only what our own plan data supports: how many renewable plans we
 * track, which suppliers sell them and where. It claims no carbon saving, no
 * tree equivalence and no price premium or discount, because none of those are
 * things this site measures.
 *
 * Renewable is a product, not an audience — so the handoff carries the
 * preference and the ZIP code, and /compare-rates opens on "Is this for your
 * home or business?".
 */

const FAQS = [
  {
    question: "What does a 100% renewable plan actually mean?",
    answer:
      "The supplier matches the electricity you use with renewable energy certificates, so an equivalent amount of renewable generation is put onto the grid on your behalf. There is no separate wire from a wind farm to your meter — the electricity itself is the same.",
  },
  {
    question: "Does switching to a renewable plan change anything at my property?",
    answer:
      "No. Your meter, your wiring and your utility stay exactly as they are, and reliability is unchanged. Only the supply contract and how that supply is sourced change.",
  },
  {
    question: "Do renewable plans cost more?",
    answer:
      "It depends on the market and the plan. In several of the states we track, a renewable plan is among the cheapest on the board; elsewhere there is a premium that reflects the certificates the supplier buys. Compare at your own ZIP code and usage — that is the only figure that answers this for you.",
  },
  {
    question: "What counts as a renewable plan here?",
    answer:
      "A plan whose renewable content is recorded in our plan data. The comparison can filter to plans matched entirely with renewable generation, and each plan card shows the renewable percentage we hold for it.",
  },
  {
    question: "Can a business buy renewable supply?",
    answer:
      "Yes. Commercial renewable supply works the same way, but it is quoted against your load profile rather than listed, so the flow routes a business to a quote instead of an instant plan list.",
  },
  {
    question: "Is renewable electricity available in every state you cover?",
    answer:
      "Not everywhere, and not in the same depth. The table on this page shows the states where we currently hold renewable plans and the lowest renewable rate tracked in each. Where a ZIP code has no renewable inventory, the comparison says so instead of showing a standard plan as if it were green.",
  },
];

export default function RenewableEnergy() {
  const states = getStates();

  const rows = states
    .map((state) => ({ state, market: getStateMarket(state.code) }))
    .filter((entry) => entry.market && entry.market.renewablePlans);

  const totalRenewablePlans = rows.reduce((sum, entry) => sum + entry.market.renewablePlans, 0);

  const { data: plans = [] } = useQuery({
    queryKey: ["plans"],
    queryFn: () => ElectricityPlan.list(),
    placeholderData: [],
  });

  // The cheapest renewable plan in each state, so the list reads as coverage
  // rather than as six variations of the same Texas plan.
  const featuredPlans = (() => {
    const green = plans
      .filter(
        (plan) =>
          Number(plan.renewable_percentage) >= 50 &&
          plan.customer_type !== "business" &&
          Number.isFinite(Number(plan.rate_per_kwh))
      )
      .sort((a, b) => Number(a.rate_per_kwh) - Number(b.rate_per_kwh));

    const seen = new Set();
    return green
      .filter((plan) => {
        if (seen.has(plan.state)) return false;
        seen.add(plan.state);
        return true;
      })
      .slice(0, 6);
  })();

  useEffect(() => {
    const attribution = captureAttributionFromWindow();
    track(EVENTS.RENEWABLE_LANDING_VIEWED, {
      entry_context: ENTRY_CONTEXTS.RENEWABLE_LANDING,
      service: "renewable",
      ...campaignContext(attribution),
    });
  }, []);

  return (
    <div className="bg-white">
      <SEOHead
        title="Renewable Electricity Plans | Electric Scouts"
        description="How 100% renewable electricity plans actually work, what they cost, and which suppliers offer them in each deregulated state we cover."
        keywords="renewable electricity plans, 100% renewable energy, green electricity, renewable energy certificates, wind energy plans, solar energy plans, clean energy supplier"
        canonical="/renewable-energy"
        structuredData={[
          getBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Renewable Energy", url: "/renewable-energy" },
          ]),
          getFAQSchema(FAQS),
        ]}
      />

      {/* ── Hero ── */}
      <div className="border-b border-green-100 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-6xl mx-auto px-5 sm:px-6 lg:px-8 pt-8 pb-14 sm:pb-16">
          <PageBreadcrumbs
            items={[{ name: "Home", url: "/" }, { name: "Renewable Energy" }]}
            variant="dark"
            className="mb-6"
          />

          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-green-800">
              <Leaf className="w-4 h-4" aria-hidden="true" />
              Renewable electricity
            </p>
            <h1 className="mt-3 text-[32px] sm:text-[42px] leading-[1.1] font-semibold text-gray-900 tracking-[-0.02em]">
              Renewable Electricity Plans
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-gray-600">
              We track {totalRenewablePlans} electricity plans backed by renewable generation across{" "}
              {rows.length} deregulated states. Enter your ZIP code and the comparison keeps the
              renewable preference — it will only ask whether this is for a home or a business.
            </p>

            <div className="mt-8 max-w-xl">
              <ZipHandoffForm
                service="renewable"
                ctaLabel="Compare Renewable Electricity"
                label="Your ZIP code"
                hint="Renewable availability varies by utility territory, so this decides what you can buy."
              />
            </div>

            <p className="mt-6 text-[13px] leading-relaxed text-gray-500">
              Plan counts and rates are from our snapshot of {MARKET_GENERATED_AT}. Where a ZIP code
              has no renewable plan available, we say so rather than showing a standard plan as a
              green one.
            </p>
          </div>
        </div>
      </div>

      {/* ── What a renewable plan is ── */}
      <Section>
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div>
            <SectionHeading
              title="What a 100% renewable plan actually is"
              description="Worth understanding before you compare, because it explains why the price difference is small and why nothing changes at your property."
            />
            <div className="space-y-4 text-[16px] leading-relaxed text-gray-600">
              <p>
                On a competitive market, a renewable plan does not mean a dedicated wire from a wind
                farm to your building. The supplier buys renewable energy certificates matching the
                electricity you use, so an equivalent amount of renewable generation is added to the
                grid on your behalf.
              </p>
              <p>
                That matters when comparing: a renewable plan and a standard plan deliver identical
                electricity to the same meter over the same wires. What differs is how the supply is
                sourced and priced — which is why the two can be compared on rate, contract length
                and termination fee exactly like any other pair of plans.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <InfoCard icon={ScrollText} iconClass="text-green-700 bg-green-50" title="Certificates, not wires">
              <p>
                One certificate represents one megawatt-hour of renewable generation. Buying and
                retiring them on your behalf is what backs the claim.
              </p>
            </InfoCard>
            <InfoCard icon={Plug} iconClass="text-green-700 bg-green-50" title="Same grid, same reliability">
              <p>
                Your utility still delivers the power and still handles outages. Supply contracts do
                not change the physical connection.
              </p>
            </InfoCard>
            <InfoCard icon={Info} iconClass="text-green-700 bg-green-50" title="What we do not claim">
              <p>
                We do not publish carbon savings, tree equivalents or emissions figures for a plan.
                We hold plan rates and renewable percentages, and that is what we show.
              </p>
            </InfoCard>
            <InfoCard icon={Leaf} iconClass="text-green-700 bg-green-50" title="Percentages come from plan data">
              <p>
                Each plan carries the renewable content recorded for it. The comparison can filter
                to fully matched plans rather than treating partial content as green.
              </p>
            </InfoCard>
          </div>
        </div>
      </Section>

      {/* ── Home or business ── */}
      <Section tone="muted">
        <SectionHeading
          title="Renewable supply for a home or a business"
          description="Renewable is a product rather than an audience, so this is the one thing the comparison still has to ask after your ZIP code."
        />
        <div className="grid gap-5 md:grid-cols-2 max-w-4xl">
          <InfoCard icon={Home} iconClass="text-green-700 bg-green-50" title="For a home">
            <p>
              Renewable plans sit alongside standard ones and are bought the same way: pick the
              plan, enroll with the supplier, keep your utility. The comparison shows the renewable
              options at your address first.
            </p>
            <p>
              <Link to="/residential-electricity" className="text-[#0A5C8C] hover:underline">
                How comparing works for a home
              </Link>
            </p>
          </InfoCard>

          <InfoCard icon={Building2} iconClass="text-green-700 bg-green-50" title="For a business">
            <p>
              Commercial renewable supply is quoted against your load profile rather than listed, so
              the flow collects what a supplier needs to price it instead of showing an instant
              list.
            </p>
            <p>
              <Link to="/business-electricity" className="text-[#0A5C8C] hover:underline">
                How commercial electricity is priced
              </Link>
            </p>
          </InfoCard>
        </div>
      </Section>

      {/* ── Coverage ── */}
      <Section>
        <SectionHeading
          title="Renewable plans by state"
          description="Where we currently hold renewable plans, how many suppliers sell them and the lowest renewable rate tracked in each market."
        />
        <DataTable
          caption="Renewable electricity plans tracked by state"
          columns={["State", "Renewable plans", "Suppliers", "From"]}
          rows={rows.map(({ state, market }) => [
            { text: state.name, path: state.path },
            String(market.renewablePlans),
            String(market.renewableProviders),
            formatRate(market.minRenewableRate) || "—",
          ])}
          footnote={`Tracked as of ${MARKET_GENERATED_AT}. Rates change often, and what is sold at a given ZIP code is a subset of the state total.`}
        />
      </Section>

      {/* ── Featured plans ── */}
      {featuredPlans.length > 0 && (
        <Section tone="muted">
          <SectionHeading
            title="Renewable plans we currently track"
            description="The lowest-rate renewable plan in each state we hold one for. Availability depends on your utility territory, so check your own ZIP code before choosing."
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featuredPlans.map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-gray-200 bg-white p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-semibold text-gray-900 truncate">
                      {plan.provider_name}
                    </h3>
                    <p className="mt-0.5 text-[14px] text-gray-600 truncate">{plan.plan_name}</p>
                  </div>
                  <span className="flex-shrink-0 inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-[12px] font-medium text-green-800">
                    <Leaf className="w-3.5 h-3.5" aria-hidden="true" />
                    {Number(plan.renewable_percentage)}%
                  </span>
                </div>

                <p className="mt-5 text-[28px] font-semibold text-gray-900 leading-none">
                  {Number(plan.rate_per_kwh).toFixed(1)}
                  <span className="text-[16px] font-medium text-gray-500">¢/kWh</span>
                </p>

                <dl className="mt-4 space-y-1.5 text-[14px] text-gray-600">
                  <div className="flex justify-between gap-4">
                    <dt>State</dt>
                    <dd className="text-gray-900">{plan.state || "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Contract</dt>
                    <dd className="text-gray-900">
                      {plan.contract_length ? `${plan.contract_length} months` : "Month to month"}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[13px] text-gray-500">
            Rates shown are the plan rates we hold and exclude utility delivery charges. Verify
            details with the supplier before enrolling.
          </p>
        </Section>
      )}

      {/* ── FAQ + related ── */}
      <Section>
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">
            <SectionHeading
              title="Renewable electricity questions"
              description="What people ask before switching to a green plan."
            />
            <FaqList items={FAQS} accent="text-green-700" />
          </div>

          <div className="lg:pt-4">
            <RelatedLinks
              title="Also on Electric Scouts"
              links={[
                ["/renewable-compare-rates", "Compare renewable plans only"],
                ["/compare-rates", "Compare every plan at your ZIP code"],
                ["/residential-electricity", "Electricity for your home"],
                ["/business-electricity", "Electricity for a business"],
                ["/all-providers", "Suppliers we track"],
                ["/learning-center", "Guides on green energy plans"],
              ]}
            />
          </div>
        </div>
      </Section>

      {/* ── Final CTA ── */}
      <FinalCta
        tone="renewable"
        title="See the renewable plans sold at your address"
        description="Enter your ZIP code and the comparison keeps the renewable preference — one question and you are into the plans."
      >
        <ZipHandoffForm
          service="renewable"
          ctaLabel="Compare Renewable Electricity"
          label="Your ZIP code"
        />
      </FinalCta>
    </div>
  );
}
