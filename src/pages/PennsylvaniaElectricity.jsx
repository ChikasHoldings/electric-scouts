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
import SEOHead, { getBreadcrumbSchema, getServiceSchema, getFAQSchema } from "../components/SEOHead";

export default function PennsylvaniaElectricity() {
  const [zipCode, setZipCode] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const stateData = {
    name: "Pennsylvania",
    avgSavings: 750,
    providerCount: 38,
    avgRate: "9.1¢/kWh",
    avgMonthlyBill: "$131",
    topCities: ["Philadelphia", "Pittsburgh", "Allentown", "Erie", "Reading", "Scranton", "Lancaster", "Bethlehem", "Harrisburg", "York", "State College", "Wilkes-Barre", "Chester", "Easton", "Norristown", "Lebanon", "Hazleton", "New Castle", "Johnstown", "McKeesport"],
    topProviders: ["Constellation", "Direct Energy", "Green Mountain Energy", "Champion Energy", "Verde Energy", "IGS Energy"],
    faqs: [
      {
        id: 1,
        question: "How does Pennsylvania's electricity deregulation work?",
        answer: "Pennsylvania has had a deregulated electricity market since 1997, making it one of the oldest competitive markets in the U.S. Residents can choose from 38+ electricity suppliers while PECO, PPL, or Duquesne Light continues to deliver your electricity and maintain the infrastructure. This competition has led to significant savings for Pennsylvania consumers."
      },
      {
        id: 2,
        question: "How much can I save on electricity in Pennsylvania?",
        answer: "Pennsylvania residents save an average of $750 per year by shopping for competitive electricity rates. Savings are particularly strong in the Philadelphia and Pittsburgh metro areas where competition is most intense. Your actual savings will depend on your current rate, usage, and the plan you select."
      },
      {
        id: 3,
        question: "What's the difference between PECO and alternative suppliers?",
        answer: "PECO, PPL, or Duquesne Light are utility companies that deliver electricity and maintain power lines in Pennsylvania. Alternative suppliers are retail electricity providers that compete to supply your power. You can switch suppliers anytime, and your utility will continue to handle delivery, emergencies, and meter reading."
      },
      {
        id: 4,
        question: "Can I get renewable energy in Pennsylvania?",
        answer: "Yes! Many Pennsylvania electricity suppliers offer 100% renewable energy plans. Companies like Verde Energy, Constellation, and Direct Energy provide green energy options sourced from Pennsylvania wind farms and solar installations, often at competitive prices with traditional power sources."
      }
    ]
  };

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "States", url: "/all-states" },
    { name: "Pennsylvania Electricity", url: "/pennsylvania-electricity" }
  ]);

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Pennsylvania Electricity Rates - Compare 38+ Suppliers & Save $750/Year | Electric Scouts PA"
        description="Compare Pennsylvania electricity rates from Constellation, Direct Energy, Champion Energy & 36+ suppliers. Serving Philadelphia, Pittsburgh, Allentown, Harrisburg. Find competitive electricity plans for your home. Fixed & variable rates. 100% green energy options. Switch easily & save up to $750 annually. Free PA electricity comparison."
        keywords="Pennsylvania electricity rates, Philadelphia electricity providers, Pittsburgh energy rates, PA power companies, compare electricity Pennsylvania, PECO alternatives, Duquesne Light alternatives, cheap electricity Pennsylvania, best electricity rates PA, Pennsylvania electricity suppliers, deregulated electricity Pennsylvania, fixed rate electricity PA, renewable energy Pennsylvania, green electricity plans PA, competitive electricity suppliers Pennsylvania"
        canonical="/pennsylvania-electricity"
        structuredData={[breadcrumbData, getServiceSchema("Pennsylvania"), getFAQSchema(stateData.faqs)]}
      />

      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <PageBreadcrumbs
              items={[
                { name: "Home", url: "/" },
                { name: "States", url: "/all-states" },
                { name: "Pennsylvania" }
              ]}
              variant="light"
              className="mb-4"
            />

            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Pennsylvania Electricity Rates & Providers
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Compare rates from {stateData.providerCount}+ providers across Pennsylvania. Average savings of ${stateData.avgSavings}/year.
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
                    placeholder="Enter Pennsylvania ZIP code"
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
            Pennsylvania Energy Market Information
          </h2>
          <Card className="border-2 mb-8">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Pennsylvania Utilities & Market</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Pennsylvania pioneered electricity deregulation in 1997. Your utility delivers power while you select from 38+ competitive suppliers for the best rates and service options.
              </p>
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">PA Electric Utilities</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• PECO (Philadelphia & suburbs)</li>
                    <li>• Duquesne Light (Pittsburgh area)</li>
                    <li>• PPL Electric (Central & Eastern PA)</li>
                    <li>• Met-Ed, Penelec, Penn Power (various)</li>
                  </ul>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-bold text-gray-900 mb-2">PA Money-Saving Tips</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Compare before contract expires</li>
                    <li>• Avoid auto-renewal penalties</li>
                    <li>• Check supplier licensing with PUC</li>
                    <li>• Bundle discounts sometimes available</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Compare Pennsylvania Electricity Rates?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Save $750/Year</h3>
                <p className="text-gray-600">
                  Pennsylvania residents save an average of $750 annually with competitive rates
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Established Market</h3>
                <p className="text-gray-600">
                  Deregulated since 1997 with mature competition and consumer protections
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">38+ Providers</h3>
                <p className="text-gray-600">
                  Wide selection of electricity suppliers across all regions
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Top Pennsylvania Electricity Providers
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
            Pennsylvania Cities We Serve
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stateData.topCities.map((city, index) => (
                <Link 
                  key={index} 
                  to={getCityUrl(city, "PA")}
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
                  View All Pennsylvania Cities
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Pennsylvania Electricity FAQs
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
            Ready to Save on Pennsylvania Electricity?
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
                  placeholder="Enter your Pennsylvania ZIP code"
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