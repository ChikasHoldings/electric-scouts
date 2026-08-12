import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Building2, CalendarClock, FileText, Gauge, Layers, Leaf, LineChart } from "lucide-react";

import SEOHead, { getBreadcrumbSchema, getFAQSchema } from "@/components/SEOHead";
import LandingHero from "@/components/landing/LandingHero";
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
 * /business-electricity — the entry page for commercial supply.
 *
 * Commercial electricity is quoted against a load profile rather than sold off
 * a rate card, so this page does not pretend to be a price list. It explains how
 * that pricing works, tells a business what it will be asked for, and hands the
 * ZIP code and the commercial audience straight into /compare-rates — which
 * then opens on "What type of business is this?" rather than starting over.
 */

const FAQS = [
  {
    question: "Why can I not just see a business rate the way I see a residential rate?",
    answer:
      "Commercial supply is priced against your load profile — when you use power, not only how much. Two businesses on the same street with the same annual consumption can be quoted different rates, which is why business supply is quoted rather than listed.",
  },
  {
    question: "What is a demand charge?",
    answer:
      "A demand charge bills you on the highest rate of power you drew during the billing period, measured in kW, separately from the total energy you consumed. For a business with short heavy peaks it can be a large share of the bill.",
  },
  {
    question: "Can one contract cover several locations?",
    answer:
      "Usually yes, provided the sites sit in the same deregulated market. Aggregating sites gives a supplier a larger volume to price against, which is normally reflected in the quote.",
  },
  {
    question: "We are still under contract. Is it too early to look?",
    answer:
      "No — it is usually the right time. Suppliers commonly price a contract that begins when your current one ends, so quoting a few months before your end date gives you options rather than a deadline.",
  },
  {
    question: "What do you need from us to start?",
    answer:
      "The service ZIP code, the type of business and roughly what you spend each month. Recent bills — ideally twelve months of them — make the quote sharper, and peak demand in kW matters if your bill shows it.",
  },
  {
    question: "Does a small business get competitive pricing?",
    answer:
      "Small commercial accounts are often priced on structures close to residential ones, and a fixed-term contract is usually the simplest way to make the cost predictable. What we cannot tell you in advance is the number — that comes from the supplier against your usage.",
  },
];

const BUSINESS_PROFILES = [
  {
    icon: Building2,
    title: "Offices, shops and restaurants",
    body: "Steady, modest load. Pricing is often close to residential structures, and the lever that matters most is contract length rather than load shape.",
  },
  {
    icon: Layers,
    title: "Warehouses, clinics and hotels",
    body: "Larger and less uniform load. This is where demand charges start to move the bill and where a supplier's view of your usage pattern begins to change the rate.",
  },
  {
    icon: Gauge,
    title: "Industrial and multi-site",
    body: "High sustained load, or several meters under one operator. Supply is negotiated individually, and the shape of consumption drives the price more than the headline rate.",
  },
];

export default function BusinessElectricity() {
  const states = getStates();

  const rows = states
    .map((state) => ({ state, market: getStateMarket(state.code) }))
    .filter((entry) => entry.market && entry.market.businessPlans);

  const totalBusinessPlans = rows.reduce((sum, entry) => sum + entry.market.businessPlans, 0);

  // The cheapest commercial plan we hold anywhere, stated as a tracked figure
  // rather than as an offer — commercial supply is quoted, and the hero says so.
  const businessRates = rows
    .map(({ market }) => Number(market.minBusinessRate))
    .filter((rate) => Number.isFinite(rate));
  const lowestBusinessRate = businessRates.length ? formatRate(Math.min(...businessRates)) : null;

  useEffect(() => {
    const attribution = captureAttributionFromWindow();
    track(EVENTS.COMMERCIAL_LANDING_VIEWED, {
      entry_context: ENTRY_CONTEXTS.COMMERCIAL_LANDING,
      service: "commercial",
      ...campaignContext(attribution),
    });
  }, []);

  return (
    <div className="bg-white">
      <SEOHead
        title="Business Electricity Rates and Pricing | Electric Scouts"
        description="How commercial electricity is priced — demand charges, load profiles and contract terms — plus the business plans we track in each deregulated state."
        keywords="business electricity rates, commercial electricity providers, demand charges, load profile, commercial energy contracts, multi-site electricity, business energy comparison"
        canonical="/business-electricity"
        structuredData={[
          getBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Business Electricity", url: "/business-electricity" },
          ]),
          getFAQSchema(FAQS),
        ]}
      />

      {/* ── Hero ── */}
      <LandingHero
        tone="commercial"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Business Electricity" }]}
        eyebrow="Commercial electricity"
        eyebrowIcon={Building2}
        title="Business Electricity Rates"
        intro="Commercial supply is priced against your usage pattern and contract term, not sold from a rate card. Start with your service ZIP code and we take it from your business type — nothing gets re-entered."
        facts={[
          ["Commercial plans", String(totalBusinessPlans)],
          ["Markets covered", String(rows.length)],
          ["Lowest tracked", lowestBusinessRate || "—"],
        ]}
        factsNote={`From our plan snapshot of ${MARKET_GENERATED_AT}. A quote priced against your own load profile can land above or below a listed plan, and demand charges are billed separately.`}
        formTitle="Start a commercial comparison"
        formSubtitle="Next question is about the business — the ZIP code carries over."
        formNote="No obligation. Multi-site accounts can be aggregated under one contract where the sites share a deregulated market."
      >
        <ZipHandoffForm
          service="commercial"
          ctaLabel="Compare Business Electricity"
          label="Service ZIP code"
          hint="Use the ZIP code of the site that takes the supply."
        />
      </LandingHero>

      {/* ── How commercial pricing differs ── */}
      <Section>
        <SectionHeading
          title="How business electricity pricing differs"
          description="Four things behave differently from a household contract, and each one changes what a supplier quotes you."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard icon={LineChart} title="Load profile, not just kWh">
            <p>
              Suppliers price on when you draw power as well as how much. A predictable daytime load
              is cheaper to serve than the same annual total in short spikes.
            </p>
          </InfoCard>
          <InfoCard icon={Gauge} title="Demand charges">
            <p>
              Billed on the highest rate of power drawn in the period, measured in kW, separately
              from consumption. Staggering start-up and shifting non-critical load is what moves it.
            </p>
          </InfoCard>
          <InfoCard icon={CalendarClock} title="Contract timing">
            <p>
              Terms are negotiated and often longer than residential ones, and a contract can be
              priced now to start when your current one ends.
            </p>
          </InfoCard>
          <InfoCard icon={Layers} title="Multi-site aggregation">
            <p>
              Several meters in the same market can usually sit under one contract, which gives a
              supplier more volume to price against.
            </p>
          </InfoCard>
        </div>
      </Section>

      {/* ── What we ask ── */}
      <Section tone="muted">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div>
            <SectionHeading
              title="What the comparison asks a business"
              description="Short, and in this order. Anything a bill answers is not asked at all."
            />
            <ol className="space-y-4">
              {[
                ["Type of business", "Office, retail, restaurant, multifamily, industrial or healthcare — it sets the load pattern a supplier expects."],
                ["A recent bill, if you have one", "Optional. Uploading one fills in usage, spend and contract end date in a single step."],
                ["Monthly electricity spend", "A band is enough. A measured figure from a bill takes priority over the band."],
                ["When you need the plan", "Starting now, within 30 days, or timed to a contract end date."],
                ["Business and contact details", "So a supplier can price against your account and get back to you."],
              ].map(([title, body], index) => (
                <li key={title} className="flex gap-4">
                  <span className="flex-shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#0A5C8C] text-white text-[13px] font-semibold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[16px] font-medium text-gray-900">{title}</p>
                    <p className="mt-0.5 text-[15px] leading-relaxed text-gray-600">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-7">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-[#FF6B35]">
              <FileText className="w-5 h-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 text-[20px] font-semibold text-gray-900">
              Have a recent business electricity bill?
            </h2>
            <p className="mt-2.5 text-[15px] leading-relaxed text-gray-600">
              Upload it and we read the usage, the spend and — where the bill shows it — the
              contract end date, so we can match your business against appropriate options without
              asking you to look any of it up. The upload step sits inside the comparison, right
              after your business type.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Link
                to="/bill-analyzer"
                className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-gray-300 bg-white text-gray-700 text-[15px] font-medium hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5C8C] focus-visible:ring-offset-2"
              >
                Analyze a bill first
              </Link>
              <Link
                to="/business-compare-rates"
                className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-gray-300 bg-white text-gray-700 text-[15px] font-medium hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5C8C] focus-visible:ring-offset-2"
              >
                Request a full quote
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Business profiles ── */}
      <Section>
        <SectionHeading
          title="What changes with the size of the account"
          description="The same market, priced three quite different ways."
        />
        <div className="grid gap-5 md:grid-cols-3">
          {BUSINESS_PROFILES.map((profile) => (
            <InfoCard key={profile.title} icon={profile.icon} title={profile.title}>
              <p>{profile.body}</p>
            </InfoCard>
          ))}
        </div>
        <p className="mt-6 text-[15px] text-gray-600">
          <Link to="/business-hub" className="text-[#0A5C8C] hover:underline">
            Compare the options by company size
          </Link>{" "}
          if you are not sure which of these fits.
        </p>
      </Section>

      {/* ── Coverage ── */}
      <Section tone="muted">
        <SectionHeading
          title="Commercial plans by state"
          description="Where we currently track commercial supply, and the lowest business rate in each market."
        />
        <DataTable
          caption="Commercial electricity plans tracked by state"
          columns={["State", "Business plans", "Suppliers", "From"]}
          rows={rows.map(({ state, market }) => [
            { text: state.name, path: state.path },
            String(market.businessPlans),
            String(market.providers),
            formatRate(market.minBusinessRate) || "—",
          ])}
          footnote="These are listed commercial plans; a quote priced against your own load profile can land above or below them, and demand charges are billed separately."
        />
      </Section>

      {/* ── Renewable + related ── */}
      <Section>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-5">
            <InfoCard
              icon={Leaf}
              iconClass="text-green-700 bg-green-50"
              title="Renewable supply for a business"
            >
              <p>
                Renewable commercial supply works the same way as residential: the supplier matches
                your consumption with renewable generation rather than running a separate wire.
              </p>
              <p>
                <Link to="/renewable-energy" className="text-[#0A5C8C] hover:underline">
                  How renewable electricity plans work
                </Link>
              </p>
            </InfoCard>
            <InfoCard icon={CalendarClock} title="If your contract is ending">
              <p>
                Bring the end date. Suppliers price forward contracts routinely, and quoting ahead
                of the date is what keeps you out of a hold-over rate.
              </p>
            </InfoCard>
          </div>

          <RelatedLinks
            title="Also on Electric Scouts"
            links={[
              ["/compare-rates", "Start a comparison with your ZIP code"],
              ["/business-compare-rates", "Request commercial quotes"],
              ["/business-hub", "Business electricity by company size"],
              ["/bill-analyzer", "Analyze a business electricity bill"],
              ["/residential-electricity", "Electricity for a home instead"],
              ["/all-providers", "Suppliers we track"],
            ]}
          />
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section tone="muted">
        <SectionHeading
          title="Business electricity questions"
          description="What businesses ask before they put an account out to quote."
        />
        <div className="max-w-3xl">
          <FaqList items={FAQS} />
        </div>
      </Section>

      {/* ── Final CTA ── */}
      <FinalCta
        title="Put your business account in front of suppliers"
        description="Enter the service ZIP code and continue at your business type — we already know this is a commercial account."
      >
        <ZipHandoffForm
          service="commercial"
          ctaLabel="Compare Business Electricity"
          label="Service ZIP code"
        />
      </FinalCta>
    </div>
  );
}
