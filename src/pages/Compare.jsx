import { Link } from "react-router-dom";
import { ArrowRight, GitCompareArrows, Layers, MapPin, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import {
  COMPARE_HUB,
  comparisonHubSummary,
  getPlanComparisons,
  getProviderComparisons,
} from "@/seo/comparisons";
import { MARKET_GENERATED_AT } from "@/seo/market";

/**
 * /compare — the head-to-head hub.
 *
 * Reads the same registry as the prerenderer and the sitemap, so the page a
 * visitor sees and the page Googlebot crawls list the same matchups. A matchup
 * whose two suppliers stop overlapping disappears from all three at once.
 */
export default function Compare() {
  const providerComparisons = getProviderComparisons();
  const planComparisons = getPlanComparisons();
  const summary = comparisonHubSummary();

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Comparisons", url: "/compare" },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title={COMPARE_HUB.title}
        description={COMPARE_HUB.description}
        keywords="electricity comparison, provider vs provider, compare electricity suppliers, fixed vs variable electricity, electricity plan comparison"
        canonical="/compare"
        structuredData={breadcrumbData}
      />

      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <PageBreadcrumbs
              items={[{ name: "Home", url: "/" }, { name: "Comparisons" }]}
              variant="light"
              className="mb-3"
            />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              {COMPARE_HUB.heading}
            </h1>
            <p className="text-base sm:text-lg text-blue-100">
              Two suppliers rarely differ in the ways their advertising suggests. These pages put
              the figures we hold for each side by side — rates, plan counts, contract terms,
              renewable mix and exit fees — and mark which one wins on each, market by market.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 py-4 sm:py-5 lg:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4 sm:gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0A5C8C] mb-1">
                {summary.providerCount}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Supplier matchups</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0A5C8C] mb-1">
                {summary.supplierCount}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Suppliers covered</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0A5C8C] mb-1">
                {summary.planCount}
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Plan-type comparisons</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <section className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-2">
            <GitCompareArrows className="w-6 h-6 text-[#FF6B35]" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Supplier vs Supplier</h2>
          </div>
          <p className="text-gray-600 mb-6 max-w-3xl text-sm sm:text-base">
            A matchup is published only where both suppliers actually sell into at least one of the
            same states — comparing two suppliers you cannot both buy from is not a choice. The
            list is short on purpose.
          </p>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
            {providerComparisons.map((entry) => {
              const split = entry.cheaperCounts.a === entry.cheaperCounts.b;
              const leader = entry.cheaperCounts.a > entry.cheaperCounts.b ? entry.a : entry.b;
              return (
                <Card
                  key={entry.slug}
                  className="border-gray-200 hover:border-[#0A5C8C] hover:shadow-lg transition-all group"
                >
                  <CardContent className="p-5 sm:p-6">
                    <Link to={entry.path} className="block">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#0A5C8C] transition-colors mb-2">
                        {entry.a.name} <span className="text-[#FF6B35]">vs</span> {entry.b.name}
                      </h3>
                    </Link>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 mb-3">
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                        {entry.sharedStates.length === 1
                          ? entry.stateNames[0]
                          : `${entry.sharedStates.length} shared states`}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-gray-400" aria-hidden="true" />
                        {split ? "Evenly split" : `${leader.name} cheaper in more`}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{entry.angle}</p>
                    <Link
                      to={entry.path}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0A5C8C] hover:text-[#FF6B35] transition-colors"
                    >
                      See the comparison
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        <section className="mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-2">
            <Layers className="w-6 h-6 text-[#FF6B35]" aria-hidden="true" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Plan Type vs Plan Type</h2>
          </div>
          <p className="text-gray-600 mb-6 max-w-3xl text-sm sm:text-base">
            The choices that apply in every market: how long to commit, what happens to the rate,
            what it costs to leave, and whether renewable supply is worth the difference.
          </p>

          <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
            {planComparisons.map((entry) => (
              <Card
                key={entry.slug}
                className="border-gray-200 hover:border-[#0A5C8C] hover:shadow-lg transition-all group"
              >
                <CardContent className="p-5 sm:p-6">
                  <Link to={entry.path} className="block">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[#0A5C8C] transition-colors mb-2">
                      {entry.heading}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{entry.lede}</p>
                  <Link
                    to={entry.path}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0A5C8C] hover:text-[#FF6B35] transition-colors"
                  >
                    Compare the two
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            Compare for Your Own Address
          </h2>
          <p className="text-gray-600 mb-6 max-w-3xl text-sm sm:text-base">
            These pages compare suppliers and plan shapes in general. What you can actually buy
            depends on your utility territory, which is set by ZIP code. Figures on this page come
            from our plan catalog as of {MARKET_GENERATED_AT}.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white">
              <Link to="/compare-rates">Compare rates by ZIP code</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/all-providers">Every supplier we track</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/all-states">Electricity rates by state</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
