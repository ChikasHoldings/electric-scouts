import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getProviderPageUrl } from "@/utils/providerSlug";
import { getCityUrl } from "@/utils/cityUrls";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, CheckCircle, DollarSign, Users, Award, ChevronDown, ArrowRight } from "lucide-react";
import { formatRate, getStateMarket, providersInState, renewableProvidersInState } from "@/seo/market.js";
import SEOHead, { getBreadcrumbSchema, getServiceSchema, getFAQSchema } from "../components/SEOHead";

export default function ConnecticutElectricity() {
  const [zipCode, setZipCode] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  // Plan counts and supplier counts come from the checked-in market
  // snapshot, so this page and its prerendered twin quote the same figures.
  const stateMarket = getStateMarket("CT");
  // The suppliers with an active plan here, from the same snapshot the
  // prerendered page reads. The list this replaced was hand-kept and named
  // companies we carry no plans from, so "View Plans" led nowhere.
  const stateProviders = providersInState("CT").slice(0, 6);
  const renewableHere = renewableProvidersInState("CT");

  const stateData = {
    name: "Connecticut",
    topCities: ["Bridgeport", "New Haven", "Hartford", "Stamford", "Waterbury", "Norwalk", "Danbury", "New Britain", "West Hartford", "Greenwich", "Hamden", "Meriden", "Bristol", "Milford", "West Haven", "Stratford", "East Hartford", "Middletown", "Wallingford", "Norwich"],
    faqs: [
      {
        id: 1,
        question: "How does Connecticut's electricity deregulation work?",
        answer: "Connecticut has a deregulated electricity market where residents can choose their competitive electricity supplier from competing suppliers. Eversource or United Illuminating continues to deliver your electricity and maintain the grid, but you can shop for competitive supply rates from alternative providers."
      },
      {
        id: 2,
        question: "How much can I save on electricity in Connecticut?",
        answer: "What you save depends on three things: the rate you are paying now, how much electricity you use, and the plan you switch to. Compare your current rate per kWh against the Connecticut plans listed here — the difference between them, multiplied by your monthly usage, is your actual saving."
      },
      {
        id: 3,
        question: "What's the difference between Eversource and competitive suppliers?",
        answer: "Eversource or United Illuminating (UI) are utility companies that deliver electricity and maintain infrastructure. Competitive suppliers are retail electricity providers that compete to supply your power. You can switch suppliers anytime while your utility continues to handle delivery and service."
      },
      {
        id: 4,
        question: "Can I get renewable energy in Connecticut?",
        answer: `Yes. ${stateMarket?.renewablePlans ?? 0} of the ${stateMarket?.plans ?? 0} Connecticut plans we track are backed by 100% renewable energy${renewableHere.length ? `, from suppliers including ${renewableHere.slice(0, 3).join(", ")}` : ""}. Renewable supply in a competitive market is normally matched with renewable energy certificates rather than a dedicated line to a wind farm.`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Connecticut Electricity Rates & Providers | Electric Scouts"
        description="Compare 26 Connecticut electricity plans from 15 suppliers, 9.8¢/kWh–14.49¢/kWh. Rates by city, renewable options and how switching works."
        keywords="Connecticut electricity rates, Hartford electricity providers, Bridgeport energy rates, Eversource CT alternatives, United Illuminating alternatives, compare electricity Connecticut, cheap electricity CT, Connecticut energy suppliers, best electricity rates Connecticut, competitive electricity CT, deregulated electricity Connecticut, fixed rate electricity CT, renewable energy Connecticut, green energy plans CT, Connecticut power companies"
        canonical="/connecticut-electricity"
        structuredData={[
          getBreadcrumbSchema([
            { name: "Home", url: "/" },
            { name: "States", url: "/all-states" },
            { name: "Connecticut Electricity", url: "/connecticut-electricity" }
          ]), 
          getServiceSchema("Connecticut"),
          getFAQSchema(stateData.faqs)
        ]}
      />

      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <PageBreadcrumbs
              items={[
                { name: "Home", url: "/" },
                { name: "States", url: "/all-states" },
                { name: "Connecticut" }
              ]}
              variant="light"
              className="mb-4"
            />

            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Connecticut Electricity Rates & Providers
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Compare plans from {stateMarket?.providers ?? "the"} suppliers with active Connecticut plans. What you save depends on your current rate and usage.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">{stateMarket?.medianRate != null ? formatRate(stateMarket.medianRate) : "—"}</div>
                <div className="text-sm text-blue-100">Median Plan Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">{stateMarket?.providers ?? "—"}</div>
                <div className="text-sm text-blue-100">Suppliers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">{stateMarket?.plans ?? "—"}</div>
                <div className="text-sm text-blue-100">Plans Tracked</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">{stateMarket?.minRate != null ? formatRate(stateMarket.minRate) : "—"}</div>
                <div className="text-sm text-blue-100">Cheapest Plan</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-2 shadow-2xl max-w-2xl">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="Enter Connecticut ZIP code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                    className="border-0 bg-transparent focus-visible:ring-0 text-gray-900 text-lg p-0 h-auto font-semibold"
                    maxLength={5}
                  />
                </div>
                <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                  <Button className="w-full sm:w-auto px-8 py-5 text-lg font-bold rounded-lg bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full">
                    Compare Rates
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Connecticut Energy Market Overview
          </h2>
          <Card className="border-2 mb-8">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">CT Competitive Electric Suppliers</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Connecticut's established competitive market offers 30+ electricity suppliers statewide. Eversource or United Illuminating maintains grid infrastructure while you select the best supply rates.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">CT Electric Utilities</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Eversource (Northern & Eastern CT)</li>
                    <li>• United Illuminating (New Haven area)</li>
                    <li>• Municipal utilities (select cities)</li>
                  </ul>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">CT Energy Saving Tips</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Compare vs. standard service rate</li>
                    <li>• Winter heating costs add up quickly</li>
                    <li>• Energize CT efficiency programs</li>
                    <li>• Fixed rates protect your budget</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Compare Connecticut Electricity Rates?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Save $690/Year</h3>
                <p className="text-gray-600">
                  Connecticut residents save an average of $690 annually
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">30+ Suppliers</h3>
                <p className="text-gray-600">
                  Competitive electricity suppliers statewide
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Green Options</h3>
                <p className="text-gray-600">
                  100% renewable energy plans available
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Top Connecticut Electricity Providers
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stateProviders.map((provider, index) => (
              <Card key={index} className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{provider}</h3>
                    <Award className="w-6 h-6 text-[#FF6B35]" />
                  </div>
                  {/* Straight to the supplier's own page. The card used to send
                      everyone to the generic comparison regardless of which
                      supplier they clicked, which threw away the intent. */}
                  <Link to={getProviderPageUrl(provider)}>
                    <Button variant="outline" className="w-full">
                      View {provider} plans
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Connecticut Cities We Serve
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stateData.topCities.map((city, index) => (
                <Link 
                  key={index} 
                  to={getCityUrl(city, "CT")}
                  className="flex items-center gap-2 text-gray-700 hover:text-[#0A5C8C] transition-colors"
                >
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium">{city}</span>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link to={createPageUrl("AllCities")}>
                <Button variant="outline" className="rounded-lg">
                  View All Connecticut Cities
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Connecticut Electricity FAQs
          </h2>
          <div className="space-y-4 max-w-4xl mx-auto">
            {stateData.faqs.map((faq) => (
              <Card 
                key={faq.id} 
                className="border-2 hover:border-[#0A5C8C] transition-all cursor-pointer overflow-hidden"
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-6">
                    <h3 className="text-lg font-bold text-gray-900 pr-4">{faq.question}</h3>
                    <ChevronDown 
                      className={`w-5 h-5 text-[#0A5C8C] flex-shrink-0 transition-transform duration-300 ${
                        openFaq === faq.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <div className={`transition-all duration-300 ease-in-out ${
                      openFaq === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Save on Connecticut Electricity?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Compare rates now and start saving on your electricity bill
          </p>
          
          <div className="bg-white rounded-xl p-2 shadow-2xl max-w-2xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="Enter your Connecticut ZIP code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                  className="border-0 bg-transparent focus-visible:ring-0 text-gray-900 text-lg p-0 h-auto font-semibold"
                  maxLength={5}
                />
              </div>
              <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                <Button className="w-full sm:w-auto px-10 py-6 text-lg font-bold rounded-lg bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full">
                  Compare Now
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>100% Free</span>
            </div>
            <span className="text-blue-300">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>No Credit Check</span>
            </div>
            <span className="text-blue-300">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Instant Results</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}