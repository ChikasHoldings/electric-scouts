import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, CheckCircle, Zap, DollarSign, Users, Award, TrendingDown, ChevronDown, ArrowRight, Building2, ExternalLink } from "lucide-react";
import SEOHead, { getBreadcrumbSchema, getServiceSchema, getFAQSchema } from "../components/SEOHead";
import { getProvidersForZipCode } from "../components/compare/providerAvailability";
import { FooterDisclaimer } from "../components/DataDisclaimer";

export default function TexasElectricity() {
  const [zipCode, setZipCode] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  // Fetch real plans from database
  const { data: allPlans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.ElectricityPlan.list(),
    initialData: [],
  });

  const stateData = {
    name: "Texas",
    fullName: "Texas",
    urlSlug: "texas-electricity",
    avgSavings: 800,
    providerCount: 45,
    avgRate: "9.2¢/kWh",
    avgMonthlyBill: "$132",
    topCities: [
      { name: "Houston", population: "2.3M" },
      { name: "Dallas", population: "1.3M" },
      { name: "Austin", population: "974K" },
      { name: "San Antonio", population: "1.5M" },
      { name: "Fort Worth", population: "942K" },
      { name: "El Paso", population: "678K" },
      { name: "Arlington", population: "398K" },
      { name: "Plano", population: "288K" }
    ],
    topProviders: ["TXU Energy", "Reliant Energy", "Gexa Energy", "Direct Energy", "Green Mountain Energy", "Frontier Utilities"],
    faqs: [
      {
        id: 1,
        question: "How does the Texas deregulated electricity market work?",
        answer: "Texas has the largest deregulated electricity market in the United States. Most areas of Texas, including Houston, Dallas, Fort Worth, and Austin, allow you to choose your electricity provider from over 45 competing companies. Your local utility (like Oncor, CenterPoint, or AEP Texas) still maintains the power lines and handles outages, but you choose who supplies your electricity."
      },
      {
        id: 2,
        question: "How much can I save on electricity in Texas?",
        answer: "Texas residents save an average of $800 per year by comparing rates and switching to better electricity plans. Savings vary based on your current rate, usage, and the plan you choose. With over 45 providers competing, Texas offers some of the most competitive electricity rates in the nation."
      },
      {
        id: 3,
        question: "What are the best electricity providers in Texas?",
        answer: "Top-rated Texas electricity providers include TXU Energy, Reliant Energy, Gexa Energy, Direct Energy, Green Mountain Energy, and Frontier Utilities. The best provider for you depends on your usage, preferred contract length, and whether you want renewable energy options."
      },
      {
        id: 4,
        question: "Can I get renewable energy in Texas?",
        answer: "Yes! Texas is a leader in wind energy production, and many providers offer 100% renewable energy plans at competitive rates. Companies like Green Mountain Energy, Gexa Energy, and Direct Energy offer green plans that support Texas wind and solar farms."
      }
    ]
  };

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "States", url: "/all-states" },
    { name: "Texas Electricity", url: "/texas-electricity" }
  ]);

  const serviceSchema = getServiceSchema("Texas");

  // Filter plans to only show those from providers in our database
  // This ensures data consistency and accuracy
  const validProviderNames = stateData.topProviders;
  const statePlans = allPlans.filter(plan => 
    validProviderNames.includes(plan.provider_name)
  );

  // Get featured plans (top 3 lowest rates from valid providers)
  const featuredPlans = statePlans
    .sort((a, b) => a.rate_per_kwh - b.rate_per_kwh)
    .slice(0, 3);

  // Get more plans (next 6 from valid providers)
  const morePlans = statePlans
    .sort((a, b) => a.rate_per_kwh - b.rate_per_kwh)
    .slice(3, 9);

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Texas Electricity Rates - Compare 45+ Providers & Save $800/Year | Power Scouts TX"
        description="Compare Texas electricity rates from TXU, Reliant, Gexa & 40+ providers. Serving Houston, Dallas, Austin, San Antonio. Find cheap electricity plans for your home. Fixed & variable rates. 100% renewable options. Switch in minutes & save up to $800 annually. Free comparison, instant results."
        keywords="Texas electricity rates, cheap electricity Texas, Houston electricity rates, Dallas electricity providers, Austin energy plans, Texas power companies, compare electricity Texas, TXU Energy rates, Reliant Energy, Gexa Energy, best electricity rates Texas, fixed rate electricity Texas, variable rate plans Texas, renewable energy Texas, deregulated electricity market Texas"
        canonical="/texas-electricity"
        structuredData={[breadcrumbData, serviceSchema, getFAQSchema(stateData.faqs)]}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <nav className="mb-4 text-sm">
              <Link to={createPageUrl("Home")} className="text-blue-200 hover:text-white">Home</Link>
              <span className="mx-2 text-blue-300">/</span>
              <Link to={createPageUrl("AllStates")} className="text-blue-200 hover:text-white">States</Link>
              <span className="mx-2 text-blue-300">/</span>
              <span className="text-white">Texas</span>
            </nav>

            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Texas Electricity Rates & Providers
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Compare rates from {stateData.providerCount}+ providers across Texas. Average savings of ${stateData.avgSavings}/year.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">{stateData.avgRate}</div>
                <div className="text-sm text-blue-100">Avg. Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">{stateData.providerCount}+</div>
                <div className="text-sm text-blue-100">Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">${stateData.avgSavings}</div>
                <div className="text-sm text-blue-100">Avg. Savings</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">{stateData.avgMonthlyBill}</div>
                <div className="text-sm text-blue-100">Avg. Bill</div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-white rounded-xl p-2 shadow-2xl max-w-2xl">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="Enter Texas ZIP code"
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
              Electricity Choice in {stateData.fullName}
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                As a Texas resident, you have the power to choose your electricity provider from over 45 competing companies. 
                Unlike regulated markets, Texas's competitive electricity market lets you compare plans based on price per kWh, 
                contract length, and estimated monthly bills—all in one place.
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">
                By comparing rates, Texas residents save an average of $800 per year on electricity bills. Whether you're 
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

        {/* Why Choose Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Why Compare Texas Electricity Rates?
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            <Card className="border hover:shadow-lg transition-all">
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Save $800/Year</h3>
                <p className="text-sm text-gray-600">
                  Average savings by comparing rates from 45+ providers
                </p>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-lg transition-all">
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Largest Market</h3>
                <p className="text-sm text-gray-600">
                  Texas has the largest competitive electricity market in the US
                </p>
              </CardContent>
            </Card>

            <Card className="border hover:shadow-lg transition-all">
              <CardContent className="p-5 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">More Options</h3>
                <p className="text-sm text-gray-600">
                  Choose from fixed, variable, and 100% renewable plans
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Top Cities Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-5">
            Top Cities in {stateData.fullName}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stateData.topCities.map((city, index) => (
              <Link 
                key={index}
                to={createPageUrl("CityRates") + `?city=${city.name}`}
                className="group"
              >
                <Card className="hover:shadow-lg hover:border-[#0A5C8C] transition-all border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                        <Building2 className="w-5 h-5 text-[#0A5C8C]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#0A5C8C] transition-colors">
                          {city.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Compare plans in {city.name}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#0A5C8C] transition-colors flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-5">
            <Link to={createPageUrl("AllCities")} className="text-sm text-[#FF6B35] hover:text-[#e55a2b] font-semibold transition-colors">
              View all Texas cities →
            </Link>
          </div>
        </section>

        {/* Featured Plans Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold text-gray-900">
              Recommended Plans for {stateData.fullName}
            </h2>
            <Link to={createPageUrl("CompareRates")}>
              <Button variant="outline" size="sm" className="text-sm">
                View All Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-gray-600">Loading plans...</div>
          ) : (
            <>
              {/* Featured Plans Cards */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {featuredPlans.map((plan, index) => (
                  <Card key={index} className="border-2 border-[#FF6B35] hover:shadow-xl transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#FF6B35] text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      Featured
                    </div>
                    <CardContent className="p-5">
                      <div className="mb-3">
                        <h3 className="text-sm font-bold text-gray-900 mb-1">{plan.provider_name}</h3>
                        <p className="text-xs text-gray-600">{plan.plan_name}</p>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-3 mb-3">
                        <div className="text-2xl font-bold text-[#0A5C8C] mb-1">
                          {plan.rate_per_kwh}¢/kWh
                        </div>
                        <div className="text-xs text-gray-600">
                          Est. ${plan.average_monthly_cost_1000 || Math.round(plan.rate_per_kwh * 10 + (plan.monthly_base_charge || 0))}/mo @ 1000 kWh
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div>
                          <div className="text-gray-500">Term</div>
                          <div className="font-semibold text-gray-900">{plan.contract_length || 'N/A'} months</div>
                        </div>
                        <div>
                          <div className="text-gray-500">Type</div>
                          <div className="font-semibold text-gray-900 capitalize">{plan.plan_type}</div>
                        </div>
                      </div>
                      <Link to={createPageUrl("CompareRates")}>
                        <Button size="sm" className="w-full bg-[#0A5C8C] hover:bg-[#084a6f] text-white text-xs">
                          Check Availability
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* More Plans Table */}
              {morePlans.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-gray-900 mb-3">More Available Plans</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-700 border-b uppercase">Provider</th>
                          <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-700 border-b uppercase">Plan Name</th>
                          <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-700 border-b uppercase">Rate</th>
                          <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-700 border-b uppercase">Est. Bill</th>
                          <th className="text-left px-4 py-2.5 text-xs font-bold text-gray-700 border-b uppercase">Term</th>
                          <th className="text-center px-4 py-2.5 text-xs font-bold text-gray-700 border-b uppercase">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {morePlans.map((plan, index) => (
                          <tr key={index} className="border-b last:border-b-0 hover:bg-blue-50/50 transition-colors group">
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">{plan.provider_name}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{plan.plan_name}</td>
                            <td className="px-4 py-3">
                              <div className="text-base font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                              <div className="text-xs text-gray-500">per kWh</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-bold text-gray-900">
                                ${plan.average_monthly_cost_1000 || Math.round(plan.rate_per_kwh * 10 + (plan.monthly_base_charge || 0))}
                              </div>
                              <div className="text-xs text-gray-500">@ 1000 kWh</div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700 font-semibold">{plan.contract_length || 'Variable'} mo</td>
                            <td className="px-4 py-3 text-center">
                              <Link to={createPageUrl("CompareRates")}>
                                <Button variant="outline" size="sm" className="text-xs hover:border-[#0A5C8C] hover:text-[#0A5C8C]">
                                  View
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* FAQ Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-5 text-center">
            Texas Electricity FAQs
          </h2>
          <div className="space-y-3 max-w-4xl mx-auto">
            {stateData.faqs.map((faq) => (
              <Card 
                key={faq.id} 
                className="border hover:border-[#0A5C8C] transition-all cursor-pointer overflow-hidden"
                onClick={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-5">
                    <h3 className="text-sm font-bold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown 
                      className={`w-4 h-4 text-[#0A5C8C] flex-shrink-0 transition-transform duration-300 ${
                        openFaq === faq.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      openFaq === faq.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-5 pb-5 pt-0">
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl lg:text-3xl font-bold mb-3">
            Ready to Save on Texas Electricity?
          </h2>
          <p className="text-base text-blue-100 mb-6 max-w-2xl mx-auto">
            Join thousands of Texans saving money with better electricity rates
          </p>
          
          <div className="bg-white rounded-xl p-1.5 shadow-2xl max-w-2xl mx-auto mb-5">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="flex-1 flex items-center gap-2.5 px-4 py-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-[#0A5C8C] flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="Enter your Texas ZIP code"
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

        {/* Disclaimer */}
        <div className="pb-8">
          <p className="text-xs text-gray-500 text-center max-w-4xl mx-auto leading-relaxed">
            <strong>Disclaimer:</strong> Electricity rates and plan details shown are for comparison purposes and based on publicly available data. 
            Actual rates vary by ZIP code, usage, credit score, and are subject to change. Verify all details with providers before enrolling. 
            Average savings estimates based on typical usage patterns. Power Scouts is a free comparison service.
          </p>
        </div>
      </div>

      <FooterDisclaimer />
    </div>
  );
}