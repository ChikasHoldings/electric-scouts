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

export default function IllinoisElectricity() {
  const [zipCode, setZipCode] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  // Plan counts and supplier counts come from the checked-in market
  // snapshot, so this page and its prerendered twin quote the same figures.
  const stateMarket = getStateMarket("IL");
  // The suppliers with an active plan here, from the same snapshot the
  // prerendered page reads. The list this replaced was hand-kept and named
  // companies we carry no plans from, so "View Plans" led nowhere.
  const stateProviders = providersInState("IL").slice(0, 6);
  const renewableHere = renewableProvidersInState("IL");

  const stateData = {
    name: "Illinois",
    topCities: ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield"],
    faqs: [
      {
        id: 1,
        question: "How does electricity deregulation work in Illinois?",
        answer: "Illinois has a deregulated electricity market, allowing residents in most areas (especially around Chicago and northern Illinois) to choose their electricity supplier. ComEd and Ameren still deliver your power and maintain the grid, but you can shop among 36+ competitive suppliers for better rates and plan options."
      },
      {
        id: 2,
        question: "How much can I save on electricity in Illinois?",
        answer: "What you save depends on three things: the rate you are paying now, how much electricity you use, and the plan you switch to. Compare your current rate per kWh against the Illinois plans listed here — the difference between them, multiplied by your monthly usage, is your actual saving."
      },
      {
        id: 3,
        question: "What's the difference between ComEd and alternative suppliers?",
        answer: "ComEd (or Ameren in central/southern Illinois) is your utility company that delivers electricity and maintains power lines. Alternative suppliers are retail electricity providers that compete to supply your power. You can choose any supplier, and ComEd/Ameren will still handle delivery, billing, and outages."
      },
      {
        id: 4,
        question: "Can I get renewable energy in Illinois?",
        answer: `Yes. ${stateMarket?.renewablePlans ?? 0} of the ${stateMarket?.plans ?? 0} Illinois plans we track are backed by 100% renewable energy${renewableHere.length ? `, from suppliers including ${renewableHere.slice(0, 3).join(", ")}` : ""}. Renewable supply in a competitive market is normally matched with renewable energy certificates rather than a dedicated line to a wind farm.`
      }
    ]
  };

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "States", url: "/all-states" },
    { name: "Illinois Electricity", url: "/illinois-electricity" }
  ]);

  const serviceSchema = getServiceSchema("Illinois");

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Illinois Electricity Rates & Providers | Electric Scouts"
        description="Compare 25 Illinois electricity plans from 15 suppliers, 7.5¢/kWh–11.49¢/kWh. Rates by city, renewable options and how switching works."
        keywords="Illinois electricity rates, Chicago electricity providers, Illinois energy comparison, ComEd alternatives, Ameren alternatives, cheap electricity Illinois, compare electricity rates Illinois, Illinois power companies, best electricity rates Chicago, fixed rate electricity Illinois, renewable energy Illinois, green energy plans Illinois, deregulated electricity Illinois, Illinois electricity suppliers"
        canonical="/illinois-electricity"
        structuredData={[breadcrumbData, serviceSchema, getFAQSchema(stateData.faqs)]}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <PageBreadcrumbs
              items={[
                { name: "Home", url: "/" },
                { name: "States", url: "/all-states" },
                { name: "Illinois" }
              ]}
              variant="light"
              className="mb-4"
            />

            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Illinois Electricity Rates & Providers
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Compare plans from {stateMarket?.providers ?? "the"} suppliers with active Illinois plans. What you save depends on your current rate and usage.
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
                    placeholder="Enter Illinois ZIP code"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* State Overview Section */}
        <section className="mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Electricity Choice in Illinois
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                As an Illinois resident, you have the power to choose your electricity supplier from over 40 competing companies. 
                Unlike regulated markets, Illinois's competitive electricity market lets you compare plans based on price per kWh, 
                contract length, and estimated monthly bills—all in one place.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                Whether you're 
                looking for fixed-rate plans, month-to-month flexibility, or 100% renewable energy options, our comparison 
                tool makes it simple to find the perfect plan for your home or business.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                Start by entering your ZIP code above to see available plans in your area. Compare rates, read plan details, 
                and switch providers in minutes—all without any hidden fees or complicated paperwork.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Compare Illinois Electricity Rates?
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">See Every Rate</h3>
                <p className="text-gray-600">
                  Suppliers price the same Illinois power differently. We show what each one
                  charges, so you can compare it against the rate you pay now.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">36+ Providers</h3>
                <p className="text-gray-600">
                  Choose from dozens of competitive electricity suppliers in Illinois
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
                  Access 100% renewable energy plans from multiple providers
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* City Guides Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">
            Illinois City Electricity Guides
          </h2>
          <p className="text-sm text-gray-600 mb-5">
            Compare electricity rates and providers for major Illinois cities
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              { name: "Chicago" },
              { name: "Aurora" },
              { name: "Naperville" },
              { name: "Joliet" },
              { name: "Rockford" },
              { name: "Springfield" }
            ].map((city, index) => (
              <Link 
                key={index}
                to={getCityUrl(city.name, "IL")}
                className="group"
              >
                <Card className="hover:shadow-lg hover:border-[#0A5C8C] transition-all border h-full">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <MapPin className="w-5 h-5 text-[#0A5C8C]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#0A5C8C] transition-colors">
                          {city.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Compare rates →
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0A5C8C] transition-colors flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link to={createPageUrl("AllCities")} className="text-sm text-[#FF6B35] hover:text-[#e55a2b] font-semibold transition-colors">
              View all Illinois cities →
            </Link>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Top Illinois Electricity Providers
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
            Illinois Cities We Serve
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stateData.topCities.map((city, index) => (
                <Link 
                  key={index} 
                  to={getCityUrl(city, "IL")}
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
                  View All Illinois Cities
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Illinois Electricity FAQs
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
                    <h3 className="text-lg font-bold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown 
                      className={`w-5 h-5 text-[#0A5C8C] flex-shrink-0 transition-transform duration-300 ${
                        openFaq === faq.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      openFaq === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-6 pb-6 pt-0">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl lg:text-3xl font-bold mb-3">
            Ready to Save on Illinois Electricity?
          </h2>
          <p className="text-base text-blue-100 mb-6 max-w-2xl mx-auto">
            Compare rates now and start saving on your electricity bill
          </p>
          
          <div className="bg-white rounded-xl p-1.5 shadow-2xl max-w-2xl mx-auto mb-5">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="flex-1 flex items-center gap-2.5 px-4 py-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-[#0A5C8C] flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="Enter your Illinois ZIP code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                  className="border-0 bg-transparent focus-visible:ring-0 text-gray-900 text-base p-0 h-auto font-semibold"
                  maxLength={5}
                />
              </div>
              <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                <Button className="w-full sm:w-auto px-8 py-3 text-base font-bold rounded-lg bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full">
                  Compare Now
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center gap-5 flex-wrap text-xs">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>100% Free</span>
            </div>
            <span className="text-blue-300">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>No Credit Check</span>
            </div>
            <span className="text-blue-300">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              <span>Instant Results</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}