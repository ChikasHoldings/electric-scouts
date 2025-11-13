import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, CheckCircle, Zap, TrendingDown, ArrowRight } from "lucide-react";
import { getAllDeregulatedStates } from "../components/compare/stateData";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";

export default function AllStates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [zipCode, setZipCode] = useState("");
  const states = getAllDeregulatedStates();

  const filteredStates = states.filter(state =>
    state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    state.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Deregulated States", url: "/all-states" }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Deregulated Electricity States - 12 States Comparison | Power Scouts"
        description="Discover which states have deregulated electricity markets. Compare rates across Texas, Illinois, Ohio, Pennsylvania, New York, New Jersey, Maryland, Massachusetts, Maine, New Hampshire, Rhode Island, and Connecticut. Find providers and savings in your area."
        keywords="deregulated electricity states, energy deregulation, electricity choice states, competitive energy markets, deregulated power markets"
        canonical="/all-states"
        structuredData={breadcrumbData}
      />
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">
              Deregulated Electricity States
            </h1>
            <p className="text-lg text-blue-100 mb-8">
              We serve 12 states with deregulated electricity markets. Find your state to compare rates and save.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search states..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 bg-white border-0 shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">12</div>
              <div className="text-sm text-gray-600">Deregulated States</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">100M+</div>
              <div className="text-sm text-gray-600">Potential Customers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">40+</div>
              <div className="text-sm text-gray-600">Providers Nationwide</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">$700</div>
              <div className="text-sm text-gray-600">Avg. Annual Savings</div>
            </div>
          </div>
        </div>
      </div>

      {/* States Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Service Areas by State
          </h2>
          <p className="text-gray-600">
            {filteredStates.length} state{filteredStates.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStates.map((state, index) => (
            <Card key={index} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-[#FF6B35] group">
              <CardContent className="p-6">
                {/* State Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-2xl font-bold text-gray-900">{state.fullName}</h3>
                    <div className="bg-green-100 px-3 py-1 rounded-full">
                      <span className="text-xs font-semibold text-green-700">Deregulated</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{state.marketType}</p>
                </div>

                {/* State Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Providers</div>
                    <div className="text-xl font-bold text-[#0A5C8C] flex items-center gap-1">
                      <Zap className="w-4 h-4" />
                      {state.providerCount}+
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-3">
                    <div className="text-xs text-gray-600 mb-1">Avg. Savings</div>
                    <div className="text-xl font-bold text-green-600 flex items-center gap-1">
                      <TrendingDown className="w-4 h-4" />
                      ${state.avgSavings}/yr
                    </div>
                  </div>
                </div>

                {/* Major Cities */}
                <div className="mb-4">
                  <p className="text-xs text-gray-600 mb-2 font-semibold">Major Cities:</p>
                  <div className="flex flex-wrap gap-1">
                    {state.cities.slice(0, 4).map((city, i) => (
                      <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {city}
                      </span>
                    ))}
                    {state.cities.length > 4 && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        +{state.cities.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <Link to={createPageUrl("CompareRates")}>
                  <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white group-hover:shadow-lg transition-all">
                    Compare Rates in {state.name}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* What is Deregulation Section */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            What is Electricity Deregulation?
          </h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="mb-4">
              Electricity deregulation allows consumers to choose their electricity supplier, creating competition 
              among providers. This competition typically results in lower rates, better customer service, and more 
              plan options compared to regulated markets.
            </p>
            <p className="mb-6">
              In deregulated states, your local utility still delivers the electricity and maintains the power lines, 
              but you can choose which company supplies your power. This separation of services has led to significant 
              savings for millions of Americans.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: "Lower Rates",
                  description: "Competition drives prices down, with average savings of $600-$800 per year"
                },
                {
                  title: "More Choices",
                  description: "Choose from fixed, variable, renewable energy, and prepaid plans"
                },
                {
                  title: "Better Service",
                  description: "Providers compete on customer service, not just price"
                }
              ].map((benefit, index) => (
                <div key={index} className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#0A5C8C] to-[#084a6f] rounded-3xl shadow-2xl p-12 text-center overflow-hidden">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
              Find the Best Rates in Your State
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Enter your ZIP code to compare electricity plans available in your area.
            </p>
            
            {/* ZIP Code Input */}
            <div className="max-w-lg mx-auto mb-6">
              <div className="bg-white rounded-2xl shadow-xl p-1.5">
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-gray-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
                    <Input
                      type="text"
                      placeholder="Enter ZIP code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg p-0 h-auto placeholder:text-gray-400 font-semibold"
                      maxLength={5}
                    />
                  </div>
                  <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                    <Button className="w-full sm:w-auto px-10 py-6 text-lg font-bold rounded-xl bg-[#FF6B35] hover:bg-[#e55a2b] text-white shadow-lg hover:shadow-xl transition-all h-full">
                      Compare Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-blue-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>100% Free</span>
              </div>
              <span className="text-blue-300">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No Credit Card</span>
              </div>
              <span className="text-blue-300">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Instant Results</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}