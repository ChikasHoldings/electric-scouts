import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { getCityUrl } from "@/utils/cityUrls";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import ContextualLinks from "@/components/ContextualLinks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, CheckCircle, Zap, DollarSign, Users, Award, ChevronDown, ArrowRight } from "lucide-react";
import { getStateMarket } from "@/seo/market.js";
import SEOHead, { getBreadcrumbSchema, getServiceSchema, getFAQSchema } from "../components/SEOHead";

export default function OhioElectricity() {
  const [zipCode, setZipCode] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  // Plan counts and supplier counts come from the checked-in market
  // snapshot, so this page and its prerendered twin quote the same figures.
  const stateMarket = getStateMarket("OH");

  const stateData = {
    name: "Ohio",
    avgSavings: 760,
    providerCount: 40,
    avgRate: "8.6¢/kWh",
    avgMonthlyBill: "$124",
    topCities: ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Akron", "Dayton", "Parma", "Canton", "Youngstown", "Lorain", "Hamilton", "Springfield", "Kettering", "Elyria", "Lakewood", "Cuyahoga Falls", "Middletown", "Newark", "Mansfield", "Mentor"],
    topProviders: ["Constellation", "Direct Energy", "IGS Energy", "AEP Energy", "Energy Harbor", "Verde Energy"],
    faqs: [
      {
        id: 1,
        question: "How does Ohio's deregulated electricity market work?",
        answer: "Ohio has a fully deregulated electricity market where residents and businesses can choose their electricity supplier from over 40 competing providers. Your local utility company (AEP Ohio, Duke Energy, or FirstEnergy) still maintains the power grid and handles service issues, but you select who supplies your electricity and at what rate."
      },
      {
        id: 2,
        question: "How much can I save on electricity in Ohio?",
        answer: "What you save depends on three things: the rate you are paying now, how much electricity you use, and the plan you switch to. Compare your current rate per kWh against the Ohio plans listed here — the difference between them, multiplied by your monthly usage, is your actual saving."
      },
      {
        id: 3,
        question: "What are the best electricity providers in Ohio?",
        answer: "Top-rated Ohio electricity providers include AEP Energy, Constellation, Direct Energy, IGS Energy, and Verde Energy. The best provider depends on your specific needs, whether you prioritize the lowest rate, renewable energy options, or flexible contract terms."
      },
      {
        id: 4,
        question: "Can I get renewable energy in Ohio?",
        answer: "Yes! Many Ohio electricity suppliers offer 100% renewable energy plans. Companies like Verde Energy, IGS Energy, and AEP Energy provide green energy options that support wind and solar projects. These renewable plans are often competitively priced with traditional electricity sources."
      }
    ]
  };

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "States", url: "/all-states" },
    { name: "Ohio Electricity", url: "/ohio-electricity" }
  ]);

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Ohio Electricity Rates & Providers | Electric Scouts"
        description="Compare 27 Ohio electricity plans from 13 suppliers, 6.2¢/kWh–9.5¢/kWh. Rates by city, renewable options and how switching works."
        keywords="Ohio electricity rates, Cleveland electricity providers, Columbus energy rates, Cincinnati electricity comparison, Ohio power companies, compare electricity Ohio, AEP Ohio alternatives, Duke Energy Ohio alternatives, FirstEnergy alternatives, cheap electricity Ohio, best electricity rates Ohio, Ohio electricity suppliers, deregulated electricity Ohio, fixed rate electricity Ohio, green energy Ohio, renewable electricity plans Ohio"
        canonical="/ohio-electricity"
        structuredData={[breadcrumbData, getServiceSchema("Ohio"), getFAQSchema(stateData.faqs)]}
      />

      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <PageBreadcrumbs
              items={[
                { name: "Home", url: "/" },
                { name: "States", url: "/all-states" },
                { name: "Ohio" }
              ]}
              variant="light"
              className="mb-4"
            />

            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Ohio Electricity Rates & Providers
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Compare plans from {stateMarket?.providers ?? "the"} suppliers with active Ohio plans. What you save depends on your current rate and usage.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">{stateData.avgRate}</div>
                <div className="text-sm text-blue-100">Avg. Rate</div>
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
                <div className="text-2xl font-bold mb-1">{stateData.avgMonthlyBill}</div>
                <div className="text-sm text-blue-100">Avg. Bill</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-2 shadow-2xl max-w-2xl">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="Enter Ohio ZIP code"
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
            Ohio Energy Market Guide
          </h2>
          <Card className="border-2 mb-8">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Ohio Utility Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ohio's competitive electricity market allows you to choose from 40+ suppliers while your local utility continues to deliver power safely and reliably to your home or business.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Ohio Electric Utilities</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• AEP Ohio (Columbus, Southeast)</li>
                    <li>• Duke Energy Ohio (Cincinnati area)</li>
                    <li>• FirstEnergy (Cleveland, Toledo)</li>
                    <li>• Dayton Power & Light (Dayton region)</li>
                  </ul>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">Ohio Savings Strategies</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Shop rates annually for best deals</li>
                    <li>• Avoid utility's default rate</li>
                    <li>• Consider green energy options</li>
                    <li>• Lock rates during low market periods</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Compare Ohio Electricity Rates?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Save $760/Year</h3>
                <p className="text-gray-600">
                  Ohio residents save an average of $760 annually by comparing electricity rates
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">40+ Providers</h3>
                <p className="text-gray-600">
                  Access to one of the most competitive electricity markets in the U.S.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Flexible Plans</h3>
                <p className="text-gray-600">
                  Choose from fixed, variable, and renewable energy options
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Top Ohio Electricity Providers
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stateData.topProviders.map((provider, index) => (
              <Card key={index} className="hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{provider}</h3>
                    <Award className="w-6 h-6 text-[#FF6B35]" />
                  </div>
                  <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                    <Button variant="outline" className="w-full">
                      View Plans
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
            Ohio Cities We Serve
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stateData.topCities.map((city, index) => (
                <Link 
                  key={index} 
                  to={getCityUrl(city, "OH")}
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
                  View All Ohio Cities
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Ohio Electricity FAQs
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
            Ready to Save on Ohio Electricity?
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
                  placeholder="Enter your Ohio ZIP code"
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