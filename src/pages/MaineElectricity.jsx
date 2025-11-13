import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, CheckCircle, Zap, DollarSign, Users, Award, ChevronDown, ArrowRight } from "lucide-react";
import SEOHead, { getBreadcrumbSchema, getServiceSchema } from "../components/SEOHead";

export default function MaineElectricity() {
  const [zipCode, setZipCode] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const stateData = {
    name: "Maine",
    avgSavings: 620,
    providerCount: 22,
    avgRate: "9.8¢/kWh",
    avgMonthlyBill: "$141",
    topCities: ["Portland", "Lewiston", "Bangor", "South Portland", "Auburn", "Biddeford"],
    topProviders: ["Constellation", "Direct Energy", "Verde Energy", "Residents Energy", "Liberty Power", "Think Energy"],
    faqs: [
      {
        id: 1,
        question: "How does Maine's electricity deregulation work?",
        answer: "Maine has a deregulated electricity market where residents can choose their competitive electricity provider from over 22 suppliers. Central Maine Power (CMP) or Versant Power continues to deliver your electricity and maintain the grid, but you can shop for competitive supply rates from alternative providers."
      },
      {
        id: 2,
        question: "How much can I save on electricity in Maine?",
        answer: "Maine residents save an average of $620 per year by comparing electricity rates from competitive suppliers. Savings vary by location and usage, but with multiple providers competing, there are opportunities to reduce your monthly electricity bills significantly."
      },
      {
        id: 3,
        question: "What's the difference between CMP and competitive suppliers?",
        answer: "Central Maine Power (CMP) or Versant Power are utility companies that deliver electricity and maintain infrastructure. Competitive suppliers are retail electricity providers that compete to supply your power. You can switch suppliers anytime while your utility continues to handle delivery and service."
      },
      {
        id: 4,
        question: "Can I get renewable energy in Maine?",
        answer: "Yes! Many Maine competitive suppliers offer 100% renewable energy plans. Companies like Verde Energy, Constellation, and Think Energy provide green energy options that support Maine's commitment to clean energy, often at competitive prices with traditional electricity sources."
      }
    ]
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title="Maine Electricity Rates - Compare Competitive Energy Providers"
        description="Compare electricity rates from 22+ competitive suppliers in Maine. Find the best plans in Portland, Bangor, and all ME areas. Save $620/year on average."
        keywords="Maine electricity rates, Portland electricity, CMP alternatives, Maine energy providers, competitive suppliers ME"
        canonical="/maine-electricity"
        structuredData={[getBreadcrumbSchema([
          { name: "Home", url: "/" },
          { name: "States", url: "/all-states" },
          { name: "Maine Electricity", url: "/maine-electricity" }
        ]), getServiceSchema("Maine")]}
      />

      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <nav className="mb-4 text-sm">
              <Link to={createPageUrl("Home")} className="text-blue-200 hover:text-white">Home</Link>
              <span className="mx-2 text-blue-300">/</span>
              <Link to={createPageUrl("AllStates")} className="text-blue-200 hover:text-white">States</Link>
              <span className="mx-2 text-blue-300">/</span>
              <span className="text-white">Maine</span>
            </nav>

            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Maine Electricity Rates & Providers
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Compare rates from {stateData.providerCount}+ competitive suppliers across Maine. Average savings of ${stateData.avgSavings}/year.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">{stateData.avgRate}</div>
                <div className="text-sm text-blue-100">Avg. Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">{stateData.providerCount}+</div>
                <div className="text-sm text-blue-100">Suppliers</div>
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
                    placeholder="Enter Maine ZIP code"
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
            Why Compare Maine Electricity Rates?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Save $620/Year</h3>
                <p className="text-gray-600">
                  Maine residents save an average of $620 annually with competitive suppliers
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-xl transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">22+ Suppliers</h3>
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
                <h3 className="text-xl font-bold text-gray-900 mb-3">Clean Energy</h3>
                <p className="text-gray-600">
                  Support renewable energy with green plan options
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Top Maine Electricity Providers
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
            Maine Cities We Serve
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
            Maine Electricity FAQs
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
            Ready to Save on Maine Electricity?
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
                  placeholder="Enter your Maine ZIP code"
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