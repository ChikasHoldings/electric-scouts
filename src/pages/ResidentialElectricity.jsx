import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Boxes, FileText, Home, Leaf, MapPin, Repeat, Truck } from "lucide-react";

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
  StepList,
} from "@/components/landing/LandingSections";
import { captureAttributionFromWindow, campaignContext } from "@/components/compare/engine/attribution";
import { track, EVENTS } from "@/components/compare/engine/analytics";
import { ENTRY_CONTEXTS } from "@/components/compare/engine/entryContext";
import { getStates } from "@/seo/locations";
import { formatRate, getStateMarket, MARKET_GENERATED_AT, MARKET_TOTALS } from "@/seo/market.js";

/**
 * /residential-electricity — the entry page for people shopping for a home.
 *
 * Its job is to answer "can I buy electricity here, and what will you ask me?",
 * then hand a qualified visitor to /compare-rates with the ZIP and the audience
 * already established. Every figure on the page comes from the checked-in
 * market snapshot, so the page never claims a plan, a rate or a saving that the
 * comparison itself cannot show.
 */

const STEPS = [
  {
    title: "Enter your ZIP code",
    description:
      "Electricity supply is sold by utility territory, so your ZIP code decides which suppliers are allowed to serve your address.",
  },
  {
    title: "Tell us about your home",
    description:
      "House, apartment or condo, and roughly how much electricity you use. An estimate is fine.",
  },
  {
    title: "Or upload a bill instead",
    description:
      "We read your actual usage off it, and skip the questions the bill has already answered.",
  },
  {
    title: "Compare and enroll",
    description:
      "Plans sold at your address, with rate, contract length and early termination fee on the same row. You enroll with the supplier.",
  },
];

const FAQS = [
  {
    question: "Will my power go out when I switch suppliers?",
    answer:
      "No. Your local utility still owns the wires, the meter and the outage line, and nothing at your property changes. Switching changes which company sells you the supply and bills you for it.",
  },
  {
    question: "Can I compare plans for an apartment or a condo?",
    answer:
      "Yes, as long as you pay an electricity bill in your own name at a deregulated address. If supply is bundled into your rent or handled by the building, you cannot choose a supplier for that meter.",
  },
  {
    question: "I am moving. When should I set up electricity?",
    answer:
      "Start about two weeks before you move in. Enrollment itself takes a few minutes, but a new connection is scheduled by your utility and can take a couple of business days.",
  },
  {
    question: "Do I need my bill to compare plans?",
    answer:
      "No. A ZIP code and a rough idea of your usage is enough to see what is available. Uploading a bill makes the estimate more accurate, because we use your measured usage instead of a band.",
  },
  {
    question: "Why does the cheapest rate per kWh not always mean the cheapest bill?",
    answer:
      "Monthly base charges and usage credits with thresholds change what you actually pay. A plan priced low per kWh can cost more at your usage level than a plan priced slightly higher, which is why the comparison estimates the bill rather than ranking headline rates alone.",
  },
  {
    question: "What does it cost to use Electric Scouts?",
    answer:
      "Nothing. Comparing is free and there is no obligation to enroll. We may earn a commission when you sign up through a plan listed here, which is how the service is funded.",
  },
];

export default function ResidentialElectricity() {
  const states = getStates();

  const rows = states
    .map((state) => ({ state, market: getStateMarket(state.code) }))
    .filter((entry) => entry.market && entry.market.residentialPlans);

  const totalResidentialPlans = rows.reduce((sum, entry) => sum + entry.market.residentialPlans, 0);
  const totalRenewablePlans = rows.reduce((sum, entry) => sum + entry.market.renewablePlans, 0);

  useEffect(() => {
    // Capturing here — not only inside the comparison engine — is what keeps a
    // campaign that landed on this page attached to the lead it eventually
    // produces, several screens later.
    const attribution = captureAttributionFromWindow();
    track(EVENTS.RESIDENTIAL_LANDING_VIEWED, {
      entry_context: ENTRY_CONTEXTS.RESIDENTIAL_LANDING,
      service: "residential",
      ...campaignContext(attribution),
    });
  }, []);

  return (
    <div className="bg-white">
      <SEOHead
        title="Compare Residential Electricity Rates | Electric Scouts"
        description="Compare the electricity plans sold to homes at your address — house, apartment or condo — with rate, contract length and early termination fee side by side."
        canonical="/residential-electricity"
        keywords="residential electricity, home electricity rates, compare electricity plans, switch electricity supplier, apartment electricity, moving electricity setup"
        structuredData={[
          getBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "Residential Electricity", url: "/residential-electricity" },
          ]),
          getFAQSchema(FAQS),
        ]}
      />

      {/* ── Hero ── */}
      <LandingHero
        tone="residential"
        breadcrumbs={[{ name: "Home", url: "/" }, { name: "Residential Electricity" }]}
        eyebrow="Residential electricity"
        eyebrowIcon={Home}
        title="Compare Residential Electricity Options"
        intro="Compare electricity plans available for your home based on your location and energy needs. Enter your ZIP code once and the comparison picks up from there — you will not be asked for it again."
        facts={[
          ["Plans for homes", totalResidentialPlans.toLocaleString()],
          ["Suppliers with plans", String(MARKET_TOTALS.providersWithPlans)],
          ["Deregulated states", String(MARKET_TOTALS.states)],
        ]}
        formTitle="Compare plans for your home"
        formSubtitle="Next question is about the home itself — the ZIP code carries over."
        formNote="Free to use, no obligation, and no credit check to compare. We are an independent comparison service, not a supplier."
      >
        <ZipHandoffForm
          service="residential"
          ctaLabel="Compare Home Electricity"
          label="Your home ZIP code"
          hint="Supply is licensed by utility territory, so this decides which plans you can buy."
        />
      </LandingHero>

      {/* ── How it works ── */}
      <Section>
        <SectionHeading
          title="How residential electricity shopping works"
          description="Four steps, and each answer removes a question later. Nothing you tell us once gets asked again."
        />
        <StepList steps={STEPS} />
      </Section>

      {/* ── Moving vs switching ── */}
      <Section tone="muted">
        <SectionHeading
          title="Moving in, switching supplier, or just checking?"
          description="The comparison asks which of these you are doing, because it changes what matters — a start date, a contract end date, or simply the rate."
        />
        <div className="grid gap-5 md:grid-cols-3">
          <InfoCard icon={Truck} title="Moving or starting new service">
            <p>
              You need supply live on the day you arrive. Enrollment takes minutes, but the utility
              schedules the connection, so allow a couple of business days.
            </p>
            <p>
              Setting up several utilities at once?{" "}
              <Link to="/home-concierge" className="text-[#0A5C8C] hover:underline">
                Home Concierge
              </Link>{" "}
              coordinates them.
            </p>
          </InfoCard>

          <InfoCard icon={Repeat} title="Switching supplier">
            <p>
              Check your current contract first. Leaving a fixed-term plan early can carry a
              termination fee, and most contracts can be quoted ahead of their end date.
            </p>
            <p>Your meter, wires and utility stay exactly as they are.</p>
          </InfoCard>

          <InfoCard icon={Boxes} title="Checking your current rate">
            <p>
              If you are out of contract you may have rolled onto a variable rate. Comparing tells
              you where that rate sits against what is being sold now.
            </p>
            <p>
              The{" "}
              <Link to="/bill-analyzer" className="text-[#0A5C8C] hover:underline">
                Bill Analyzer
              </Link>{" "}
              works out what you actually pay per kWh.
            </p>
          </InfoCard>
        </div>
      </Section>

      {/* ── Bill analyzer ── */}
      <Section>
        <div className="rounded-3xl border border-gray-200 bg-white p-7 sm:p-10">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_auto] gap-8 items-center">
            <div className="max-w-xl">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-orange-50 text-[#FF6B35]">
                <FileText className="w-5 h-5" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-[24px] sm:text-[26px] font-semibold text-gray-900 tracking-[-0.015em]">
                Have a recent electricity bill?
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-gray-600">
                Upload it and we will use your actual usage to personalize your comparison — and
                skip the questions it answers. The same upload step is offered inside the
                comparison, so you can start either way.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-56">
              <Link
                to="/bill-analyzer"
                className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-[#0A5C8C] hover:bg-[#084a6f] text-white text-[15px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5C8C] focus-visible:ring-offset-2"
              >
                Analyze my bill
              </Link>
              <Link
                to="/compare-rates"
                className="inline-flex items-center justify-center h-12 px-6 rounded-xl border border-gray-300 bg-white text-gray-700 text-[15px] font-medium hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0A5C8C] focus-visible:ring-offset-2"
              >
                Skip and compare
              </Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Usage ── */}
      <Section tone="muted">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          <div>
            <SectionHeading
              title="Understanding what your home uses"
              description="Electricity is sold per kilowatt-hour, and how many you use is what decides which plan is cheapest for you."
            />
            <ul className="space-y-3 text-[15px] leading-relaxed text-gray-600">
              {[
                "The comparison asks for a usage band, or reads the exact figure off a bill you upload.",
                "Estimated monthly cost is calculated at your usage level, not at an average household's.",
                "Monthly base charges and usage credits move the effective rate up or down as usage changes.",
                "Usage is seasonal — a summer bill in Texas is not a fair guide to a mild month.",
              ].map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#0A5C8C] flex-shrink-0" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h3 className="text-[17px] font-semibold text-gray-900">The usage bands we ask about</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-600">
              Pick the closest one — the comparison uses the middle of the band until a bill gives
              us something better.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                ["Under 500 kWh a month", "Small apartments and part-time occupancy"],
                ["500–999 kWh a month", "Smaller homes and mild climates"],
                ["1,000–1,999 kWh a month", "The band most family homes fall into"],
                ["2,000+ kWh a month", "Larger homes, electric heating or cooling"],
              ].map(([band, note]) => (
                <li key={band} className="rounded-xl border border-gray-200 px-4 py-3">
                  <span className="block text-[15px] font-medium text-gray-900">{band}</span>
                  <span className="block mt-0.5 text-[13px] text-gray-500">{note}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── Coverage ── */}
      <Section>
        <SectionHeading
          title="Residential plans by state"
          description="The 12 states where households choose their own supplier, and what we hold for each one."
        />
        <DataTable
          caption="Residential electricity plans tracked by state"
          columns={["State", "Plans for homes", "Suppliers", "From"]}
          rows={rows.map(({ state, market }) => [
            { text: state.name, path: state.path },
            String(market.residentialPlans),
            String(market.providers),
            formatRate(market.minResidentialRate) || "—",
          ])}
          footnote={`Plans tracked as of ${MARKET_GENERATED_AT}. Rates change often and availability is set by utility territory, so the plans at your ZIP code are a subset of the state total.`}
        />
      </Section>

      {/* ── Renewable + ZIP explainer ── */}
      <Section tone="muted">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-5">
            <InfoCard
              icon={Leaf}
              iconClass="text-green-700 bg-green-50"
              title="Renewable electricity for your home"
            >
              <p>
                {totalRenewablePlans.toLocaleString()} of the plans we track are backed by renewable
                generation. Choosing one changes how your supply is sourced and priced, not what
                arrives at your meter.
              </p>
              <p>
                <Link to="/renewable-energy" className="text-[#0A5C8C] hover:underline">
                  How renewable plans actually work
                </Link>
              </p>
            </InfoCard>

            <InfoCard icon={MapPin} title="Why your ZIP code matters">
              <p>
                Suppliers are licensed to sell inside specific utility territories. Two homes a few
                miles apart can have different plans available and different prices for the same
                plan.
              </p>
              <p>
                That is why the comparison starts with a ZIP code rather than a state — and why we
                carry it over rather than asking twice.
              </p>
            </InfoCard>

            <InfoCard icon={Home} title="Renting, or in a building with shared supply">
              <p>
                You can choose a supplier when the meter is billed in your name. Where electricity
                is included in rent or billed by the building, the choice sits with whoever holds
                the account.
              </p>
            </InfoCard>

            <InfoCard icon={FileText} title="What you will need">
              <p>
                Your service address ZIP code, a rough idea of monthly usage, and — if you are
                switching — your current contract end date. A recent bill covers all three.
              </p>
            </InfoCard>
          </div>

          <RelatedLinks
            title="Also on Electric Scouts"
            links={[
              ["/compare-rates", "Compare electricity rates by ZIP code"],
              ["/bill-analyzer", "Work out the rate you actually pay"],
              ["/renewable-energy", "Renewable electricity plans"],
              ["/business-electricity", "Electricity for a business or commercial property"],
              ["/all-providers", "Every supplier we track"],
              ["/all-states", "How each deregulated market works"],
              ["/learning-center", "Guides on switching, contracts and billing"],
            ]}
          />
        </div>
      </Section>

      {/* ── FAQ ── */}
      <Section>
        <SectionHeading
          title="Residential electricity questions"
          description="The questions people ask before they switch."
        />
        <div className="max-w-3xl">
          <FaqList items={FAQS} />
        </div>
      </Section>

      {/* ── Final CTA ── */}
      <FinalCta
        title="See what is available at your address"
        description="Enter your ZIP code and continue straight into the comparison — we already know this is for a home."
      >
        <ZipHandoffForm
          service="residential"
          ctaLabel="Compare Home Electricity"
          label="Your home ZIP code"
        />
      </FinalCta>
    </div>
  );
}
