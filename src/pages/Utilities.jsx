import { Link } from "react-router-dom";
import { ArrowRight, Cable, MapPin, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import { UTILITY_HUB, getUtilities } from "@/seo/utilities";
import { STATE_NAMES } from "@/seo/locations";
import { formatRate } from "@/seo/market";

/**
 * /utilities — the delivery-territory hub.
 *
 * Reads the same registry as the prerenderer and the sitemap, so a utility that
 * drops below the coverage bar leaves all three in the same build.
 */
export default function Utilities() {
  const utilities = getUtilities();
  const covered = utilities.reduce((sum, utility) => sum + utility.cities.length, 0);

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Utilities", url: "/utilities" },
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title={UTILITY_HUB.title}
        description={UTILITY_HUB.description}
        keywords="electricity utility, delivery charges, who delivers my electricity, utility vs supplier, electricity territory"
        canonical="/utilities"
        structuredData={breadcrumbData}
      />

      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <PageBreadcrumbs
              items={[{ name: "Home", url: "/" }, { name: "Utilities" }]}
              variant="light"
              className="mb-3"
            />
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              {UTILITY_HUB.heading}
            </h1>
            <p className="text-base sm:text-lg text-blue-100">
              Two companies appear on a deregulated electricity bill and they do very different
              jobs. The delivery utility owns the wires and cannot be changed. The supplier sells
              the energy and can be changed at any time, which is the whole reason this site
              exists.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery Territories We Cover</h2>
          <p className="text-gray-600 mb-6">
            {utilities.length} territories, {covered} cities. Rate spans are the average residential
            rates in the cities listed — not delivery charges, which are regulated and which we do
            not hold.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {utilities.map((utility) => (
              <Link key={utility.slug} to={utility.path} className="block group">
                <Card className="border-2 h-full hover:border-[#0A5C8C] hover:shadow-lg transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                        <Cable className="w-5 h-5 text-[#0A5C8C]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 group-hover:text-[#0A5C8C] transition-colors">
                          {utility.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {utility.stateCodes.map((code) => STATE_NAMES[code]).join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {utility.cities.length} cities
                      </span>
                      {utility.lowestCityRate != null && (
                        <span className="inline-flex items-center gap-1">
                          <Zap className="w-4 h-4 text-gray-400" />
                          {formatRate(utility.lowestCityRate)}–{formatRate(utility.highestCityRate)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section className="bg-white border-2 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Why the Distinction Matters</h2>
          <p className="text-gray-600 mb-5">
            Most people searching for their utility by name are trying to find out what they will
            pay, and are looking at the wrong company. The utility charge is regulated, identical
            across every supplier, and not something shopping can lower. The supply rate is none of
            those things — it varies by a factor of two between the cheapest and most expensive
            plans in some of the markets we track.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/compare-rates"
              className="inline-flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e85d2a] text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Compare supply rates <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/all-states"
              className="inline-flex items-center gap-2 border-2 border-gray-200 hover:border-[#0A5C8C] text-gray-700 font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              Rates by state
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
