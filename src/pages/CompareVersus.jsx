import { Link, useParams } from "react-router-dom";
import { Check, Info, MapPin, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SEOHead, { getBreadcrumbSchema, getFAQSchema } from "../components/SEOHead";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import NotFound from "@/pages/NotFound";
import { getComparisonBySlug } from "@/seo/comparisons";
import { STATE_NAMES, STATE_PAGE_PATHS } from "@/seo/locations";
import { MARKET_GENERATED_AT, formatRate } from "@/seo/market";

/**
 * /compare/:slug — one head-to-head page, either supplier vs supplier or plan
 * shape vs plan shape.
 *
 * Every number, verdict and answer is read from the comparison object in
 * src/seo/comparisons.js, which is the same object the prerenderer serializes.
 * That is deliberate: the previous generation of pages on this site computed
 * their copy twice — once in React and once for the crawler — and the two
 * drifted apart, which is how the prerendered HTML ended up citing 35 suppliers
 * while the rendered footer still claimed "40+".
 *
 * An unknown slug renders the real 404 page rather than an empty shell, so a
 * retired matchup cannot linger as a soft 404.
 */
export default function CompareVersus() {
  const { slug } = useParams();
  const comparison = getComparisonBySlug(slug);

  if (!comparison) return <NotFound />;

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Comparisons", url: "/compare" },
    { name: comparison.heading },
  ];

  const structuredData = [
    getBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Comparisons", url: "/compare" },
      { name: comparison.heading, url: comparison.path },
    ]),
    ...(comparison.faqs?.length ? [getFAQSchema(comparison.faqs)] : []),
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title={comparison.title}
        description={comparison.description}
        canonical={comparison.path}
        structuredData={structuredData}
      />

      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <PageBreadcrumbs items={breadcrumbItems} variant="light" className="mb-3" />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              {comparison.heading}
            </h1>
            <p className="text-base sm:text-lg text-blue-100">
              {comparison.type === "provider-vs-provider" ? comparison.angle : comparison.lede}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        {comparison.type === "provider-vs-provider" ? (
          <ProviderVersus comparison={comparison} />
        ) : (
          <PlanVersus comparison={comparison} />
        )}

        <FaqSection faqs={comparison.faqs} heading={`${comparison.heading}: Common Questions`} />

        <Snapshot />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Supplier vs supplier
 * ------------------------------------------------------------------ */

function ProviderVersus({ comparison }) {
  const { a, b, sharedStates, cheaperCounts, dimensions, aOnly, bOnly } = comparison;
  const split = cheaperCounts.a === cheaperCounts.b;
  const leader = cheaperCounts.a > cheaperCounts.b ? a : b;
  const leaderWins = Math.max(cheaperCounts.a, cheaperCounts.b);

  return (
    <>
      <section className="mb-10 sm:mb-14">
        <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 mb-6">
          <div className="flex items-start gap-3">
            <Scale className="w-5 h-5 text-[#FF6B35] flex-shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
              {sharedStates.length === 1 ? (
                <>
                  Both suppliers sell into <strong>{sharedStates[0].name}</strong>, which is where
                  this comparison applies. Everything below is counted from the {a.plans} {a.name}{" "}
                  plans and the {b.plans} {b.name} plans in our catalog.
                </>
              ) : (
                <>
                  They compete in <strong>{sharedStates.length} of the states we cover</strong>.{" "}
                  {split ? (
                    <>Neither has the lower starting rate in more of them</>
                  ) : (
                    <>
                      <strong>{leader.name}</strong> has the lower starting rate in {leaderWins} of
                      them
                    </>
                  )}
                  , but the answer changes by market — the state table below is the one that
                  applies to you.
                </>
              )}
            </p>
          </div>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
          {a.name} vs {b.name} at a Glance
        </h2>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm min-w-[560px]">
            <caption className="sr-only">
              {a.name} compared with {b.name} across rates, plan mix and contract terms
            </caption>
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="text-left font-semibold text-gray-700 px-4 py-3 w-1/3">
                  Measure
                </th>
                <th scope="col" className="text-left font-semibold text-gray-900 px-4 py-3">
                  {a.name}
                </th>
                <th scope="col" className="text-left font-semibold text-gray-900 px-4 py-3">
                  {b.name}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dimensions.map((dimension) => (
                <tr key={dimension.label} className="align-top">
                  <th scope="row" className="text-left font-medium text-gray-700 px-4 py-3">
                    {dimension.label}
                    {dimension.note && (
                      <span className="block text-xs font-normal text-gray-500 mt-1 leading-relaxed">
                        {dimension.note}
                      </span>
                    )}
                  </th>
                  <WinnerCell value={dimension.a} won={dimension.winner === "a"} />
                  <WinnerCell value={dimension.b} won={dimension.winner === "b"} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-3 leading-relaxed">
          A tick marks the supplier ahead on that measure. Rate figures describe the plans a
          supplier offers somewhere in its footprint, not a quote for your address.
        </p>
      </section>

      <section className="mb-10 sm:mb-14">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Which Is Cheaper in Your State
        </h2>
        <p className="text-gray-600 mb-5 max-w-3xl text-sm sm:text-base">
          Suppliers price by utility territory, so the winner in one state routinely loses in the
          next. These are the lowest and median rates we hold for each supplier in every market
          where both are sold.
        </p>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="text-left font-semibold text-gray-700 px-4 py-3">
                  State
                </th>
                <th scope="col" className="text-left font-semibold text-gray-700 px-4 py-3">
                  {a.name} from
                </th>
                <th scope="col" className="text-left font-semibold text-gray-700 px-4 py-3">
                  {b.name} from
                </th>
                <th scope="col" className="text-left font-semibold text-gray-700 px-4 py-3">
                  Cheaper start
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sharedStates.map((row) => (
                <tr key={row.code}>
                  <th scope="row" className="text-left font-medium px-4 py-3">
                    <Link
                      to={row.path}
                      className="text-[#0A5C8C] hover:text-[#FF6B35] transition-colors"
                    >
                      {row.name}
                    </Link>
                  </th>
                  <td className="px-4 py-3 text-gray-700">
                    {formatRate(row.a.minRate)}
                    <span className="block text-xs text-gray-500">
                      {row.a.plans} {row.a.plans === 1 ? "plan" : "plans"}, median{" "}
                      {formatRate(row.a.medianRate)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {formatRate(row.b.minRate)}
                    <span className="block text-xs text-gray-500">
                      {row.b.plans} {row.b.plans === 1 ? "plan" : "plans"}, median{" "}
                      {formatRate(row.b.medianRate)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {row.cheaper === null ? (
                      <span className="text-gray-500">Tied</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 font-medium text-[#0A5C8C]">
                        <Check className="w-4 h-4 text-green-600" aria-hidden="true" />
                        {row.cheaper === "a" ? a.name : b.name}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {(aOnly.length > 0 || bOnly.length > 0) && (
        <section className="mb-10 sm:mb-14">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Where Only One of Them Sells
          </h2>
          <p className="text-gray-600 mb-5 max-w-3xl text-sm sm:text-base">
            Outside the shared markets there is no comparison to make — only one of the two is an
            option at all.
          </p>
          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            {aOnly.length > 0 && <ExclusiveStates supplier={a} codes={aOnly} rival={b} />}
            {bOnly.length > 0 && <ExclusiveStates supplier={b} codes={bOnly} rival={a} />}
          </div>
        </section>
      )}

      <section className="mb-10 sm:mb-14">
        <div className="rounded-xl bg-[#0A5C8C] text-white p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">Check Both at Your Address</h2>
          <p className="text-blue-100 mb-6 max-w-3xl text-sm sm:text-base">
            A tally of markets is not an offer. Enter your ZIP code to see which of these two
            actually serves your utility territory, and what each is charging there today.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white">
              <Link to="/compare-rates">Compare both at my ZIP code</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to={`/providers/${a.slug}`}>{a.name} plans</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to={`/providers/${b.slug}`}>{b.name} plans</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function WinnerCell({ value, won }) {
  return (
    <td className={`px-4 py-3 ${won ? "font-semibold text-gray-900" : "text-gray-700"}`}>
      <span className="inline-flex items-center gap-1.5">
        {won && <Check className="w-4 h-4 text-green-600 flex-shrink-0" aria-hidden="true" />}
        {value}
      </span>
    </td>
  );
}

function ExclusiveStates({ supplier, codes, rival }) {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-5 sm:p-6">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#FF6B35]" aria-hidden="true" />
          {supplier.name} only
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {supplier.name} has plans in these markets, where {rival.name} does not.
        </p>
        <ul className="flex flex-wrap gap-2">
          {codes.map((code) => (
            <li key={code}>
              <Link
                to={STATE_PAGE_PATHS[code]}
                className="inline-block text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-[#0A5C8C] hover:text-white transition-colors"
              >
                {STATE_NAMES[code]}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Plan shape vs plan shape
 * ------------------------------------------------------------------ */

function PlanVersus({ comparison }) {
  const { a, b, rows, columns, unit } = comparison;
  const numeric = unit === "plans";
  const totalA = numeric ? rows.reduce((sum, row) => sum + (Number(row.a) || 0), 0) : null;
  const totalB = numeric ? rows.reduce((sum, row) => sum + (Number(row.b) || 0), 0) : null;

  return (
    <>
      <section className="mb-10 sm:mb-14">
        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 mb-8">
          <SideCard side={a} total={totalA} accent="#0A5C8C" />
          <SideCard side={b} total={totalB} accent="#FF6B35" />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          How the Two Compare, State by State
        </h2>
        <p className="text-gray-600 mb-5 max-w-3xl text-sm sm:text-base">
          Markets differ enough that a rule of thumb from one state misleads in another. Each row
          links through to that state&rsquo;s full breakdown.
        </p>

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm min-w-[520px]">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="text-left font-semibold text-gray-700 px-4 py-3">
                  State
                </th>
                {columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="text-left font-semibold text-gray-700 px-4 py-3"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.code}>
                  <th scope="row" className="text-left font-medium px-4 py-3">
                    <Link
                      to={row.path}
                      className="text-[#0A5C8C] hover:text-[#FF6B35] transition-colors"
                    >
                      {row.name}
                    </Link>
                  </th>
                  <td className="px-4 py-3 text-gray-700">{String(row.a)}</td>
                  <td className="px-4 py-3 text-gray-700">{String(row.b)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10 sm:mb-14">
        <div className="rounded-xl bg-[#0A5C8C] text-white p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold mb-3">
            See What Is Available Where You Live
          </h2>
          <p className="text-blue-100 mb-6 max-w-3xl text-sm sm:text-base">
            The mix above describes a whole state. What you can actually buy is set by your utility
            territory, which comes down to your ZIP code.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white">
              <Link to="/compare-rates">Compare plans for my ZIP code</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/bill-analyzer">Check my current bill</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

function SideCard({ side, total, accent }) {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: accent }}
            aria-hidden="true"
          />
          <h2 className="font-bold text-gray-900">{side.name}</h2>
        </div>
        {total !== null && (
          <p className="text-2xl sm:text-3xl font-bold text-[#0A5C8C]">
            {total}
            <span className="text-sm font-normal text-gray-600 ml-2">
              in our catalog across 12 states
            </span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ *
 * Shared
 * ------------------------------------------------------------------ */

function FaqSection({ faqs, heading }) {
  if (!faqs?.length) return null;
  return (
    <section className="mb-10 sm:mb-14">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-5">{heading}</h2>
      <div className="space-y-4">
        {faqs.map((faq) => (
          <Card key={faq.question} className="border-gray-200">
            <CardContent className="p-5 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{faq.answer}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function Snapshot() {
  return (
    <p className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed max-w-3xl">
      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span>
        Figures on this page are counted from the plans Electric Scouts held on{" "}
        {MARKET_GENERATED_AT}. Rates change often and vary by utility territory, so treat these as
        a guide to how the two compare rather than as a quote. Always confirm the rate, contract
        length and early termination fee with the supplier before enrolling.
      </span>
    </p>
  );
}
