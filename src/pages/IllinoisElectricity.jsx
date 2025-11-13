import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, CheckCircle, Zap, DollarSign, Users, Award, TrendingDown, ChevronDown, ArrowRight } from "lucide-react";
import SEOHead, { getBreadcrumbSchema, getServiceSchema, getFAQSchema } from "../components/SEOHead";
import { FooterDisclaimer } from "../components/DataDisclaimer";

export default function IllinoisElectricity() {
  const [zipCode, setZipCode] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const stateData = {
    name: "Illinois",
    avgSavings: 700,
    providerCount: 36,
    avgRate: "8.8¢/kWh",
    avgMonthlyBill: "$126",
    topCities: ["Chicago", "Aurora", "Naperville", "Joliet", "Rockford", "Springfield"],
    topProviders: ["Constellation", "Direct Energy", "Amigo Energy", "Cirro Energy", "IGS Energy", "Verde Energy"],
    faqs: [
      {
        id: 1,
        question: "How does electricity deregulation work in Illinois?",
        answer: "Illinois has a deregulated electricity market, allowing residents in most areas (especially around Chicago and northern Illinois) to choose their electricity supplier. ComEd and Ameren still deliver your power and maintain the grid, but you can shop among 36+ competitive suppliers for better rates and plan options."
      },
      {
        id: 2,
        question: "How much can I save on electricity in Illinois?",
        answer: "Illinois residents save an average of $700 per year by comparing electricity rates from competitive suppliers. Savings are especially significant in the Chicago area where competition among providers is strongest. Your actual savings depend on your current rate, usage patterns, and the plan you select."
      },
      {
        id: 3,
        question: "What's the difference between ComEd and alternative suppliers?",
        answer: "ComEd (or Ameren in central/southern Illinois) is your utility company that delivers electricity and maintains power lines. Alternative suppliers are retail electricity providers that compete to supply your power. You can choose any supplier, and ComEd/Ameren will still handle delivery, billing, and outages."
      },
      {
        id: 4,
        question: "Can I get renewable energy in Illinois?",
        answer: "Yes! Many Illinois electricity suppliers offer 100% renewable energy plans sourced from wind and solar. Companies like Verde Energy, Direct Energy, and Constellation offer green energy options that support Illinois' growing renewable energy sector while often matching or beating standard rates."
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
        title="Illinois Electricity Rates - Compare 36+ Providers & Save $700/Year | Power Scouts IL"
        description="Compare Illinois electricity rates from Constellation, Direct Energy & 35+ providers. Serving Chicago, Aurora, Naperville, Rockford. Find affordable electricity plans for your home. Fixed & variable rates. 100% green energy options. Switch easily & save up to $700 annually. Free IL electricity comparison."
        keywords="Illinois electricity rates, Chicago electricity providers, Illinois energy comparison, ComEd alternatives, Ameren alternatives, cheap electricity Illinois, compare electricity rates Illinois, Illinois power companies, best electricity rates Chicago, fixed rate electricity Illinois, renewable energy Illinois, green energy plans Illinois, deregulated electricity Illinois, Illinois electricity suppliers"
        canonical="/illinois-electricity"
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
              <span className="text-white">Illinois</span>
            </nav>

            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Illinois Electricity Rates & Providers
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Compare rates from {stateData.providerCount}+ providers across Illinois. Average savings of ${stateData.avgSavings}/year.
            </p>

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Compare Illinois Electricity Rates?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Save $700/Year</h3>
                <p className="text-gray-600">
                  Illinois residents save an average of $700 annually by comparing ComEd alternatives
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

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Top Illinois Electricity Providers
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
            Illinois Cities We Serve
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stateData.topCities.map((city, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium">{city}</span>
                </div>
              ))}
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

        <section className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Save on Illinois Electricity?
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
                  placeholder="Enter your Illinois ZIP code"
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

        {/* Disclaimer */}
        <div className="pb-8">
          <p className="text-xs text-gray-500 text-center max-w-4xl mx-auto leading-relaxed">
            <strong>Disclaimer:</strong> Rates and plan information shown are for comparison purposes based on publicly available data. 
            Actual rates vary by location, usage, and provider. Verify all details directly with electricity suppliers before enrollment.
          </p>
        </div>
      </div>

      <FooterDisclaimer />
    </div>
  );
}