import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Zap, CheckCircle, ArrowRight, Leaf, ExternalLink, Award } from "lucide-react";
import { getProviderDetails } from "../components/compare/providerAvailability";
import { calculateMonthlyBill } from "../components/compare/dataValidation";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";

export default function ProviderDetails() {
  const [zipCode, setZipCode] = useState("");
  const [providerName, setProviderName] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const provider = urlParams.get('provider');
    if (provider) {
      setProviderName(provider);
    }
  }, []);

  const { data: allPlans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.ElectricityPlan.list(),
    initialData: [],
  });

  const providerInfo = getProviderDetails(providerName);
  const providerPlans = allPlans
    .filter(plan => plan.provider_name === providerName)
    .sort((a, b) => a.rate_per_kwh - b.rate_per_kwh);

  const avgRate = providerPlans.length > 0 
    ? (providerPlans.reduce((acc, p) => acc + p.rate_per_kwh, 0) / providerPlans.length).toFixed(1)
    : 'N/A';

  const lowestRate = providerPlans.length > 0 ? providerPlans[0].rate_per_kwh : 'N/A';
  const renewablePlansCount = providerPlans.filter(p => p.renewable_percentage >= 50).length;

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Providers", url: "/all-providers" },
    { name: providerName, url: `/provider-details?provider=${providerName}` }
  ]);

  if (!providerName || !providerInfo) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Provider Not Found</h1>
          <Link to={createPageUrl("AllProviders")}>
            <Button>View All Providers</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title={`${providerName} Electricity Rates & Reviews - Compare Plans | Power Scouts`}
        description={`Compare ${providerName} electricity rates and plans. Read reviews, check availability, find best ${providerName} deals. Serving multiple states with fixed, variable & renewable energy options. Starting at ${lowestRate}¢/kWh. Switch and save today.`}
        keywords={`${providerName} electricity rates, ${providerName} reviews, ${providerName} plans, ${providerName} energy, best ${providerName} deals, ${providerName} renewable energy, compare ${providerName} rates`}
        canonical={`/provider-details?provider=${providerName}`}
        structuredData={breadcrumbData}
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <nav className="mb-4 text-sm">
              <Link to={createPageUrl("Home")} className="text-blue-200 hover:text-white">Home</Link>
              <span className="mx-2 text-blue-300">/</span>
              <Link to={createPageUrl("AllProviders")} className="text-blue-200 hover:text-white">Providers</Link>
              <span className="mx-2 text-blue-300">/</span>
              <span className="text-white">{providerName}</span>
            </nav>

            <div className="flex items-start gap-6 mb-6">
              <div className="bg-white rounded-xl p-4 shadow-lg">
                {providerInfo.logo ? (
                  <img 
                    src={providerInfo.logo} 
                    alt={`${providerName} logo`}
                    className="h-16 w-32 object-contain"
                  />
                ) : (
                  <div className="h-16 w-32 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl font-bold text-[#0A5C8C]">
                      {providerName.substring(0, 3).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{providerName}</h1>
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">4.5</span>
                  </div>
                  <span className="text-blue-200">•</span>
                  <span className="text-blue-100">{providerPlans.length} Plans Available</span>
                </div>
                <p className="text-blue-100 text-base">
                  Competitive electricity rates serving {providerInfo.states.join(", ")}
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">{lowestRate}¢</div>
                <div className="text-sm text-blue-100">Lowest Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">{avgRate}¢</div>
                <div className="text-sm text-blue-100">Avg. Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">{providerPlans.length}</div>
                <div className="text-sm text-blue-100">Total Plans</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="text-2xl font-bold mb-1">{renewablePlansCount}</div>
                <div className="text-sm text-blue-100">Green Plans</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* About Provider */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            About {providerName}
          </h2>
          <Card>
            <CardContent className="p-8">
              <p className="text-gray-700 leading-relaxed mb-6">
                {providerName} is a trusted electricity provider serving customers across {providerInfo.states.join(", ")}. 
                With {providerPlans.length} available plans ranging from {lowestRate}¢/kWh to competitive variable rates, 
                {providerName} offers options for every household and business. 
                {renewablePlansCount > 0 && ` They also offer ${renewablePlansCount} renewable energy plans for environmentally conscious customers.`}
              </p>
              <div className="flex flex-wrap gap-3">
                {renewablePlansCount > 0 && (
                  <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                    <Leaf className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">Renewable Options</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700">Multiple States</span>
                </div>
                <div className="flex items-center gap-2 bg-purple-50 px-4 py-2 rounded-full">
                  <Award className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-purple-700">Trusted Provider</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Available Plans */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Available Plans from {providerName}
            </h2>
            <a href={providerInfo.website} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Visit Website
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </a>
          </div>

          {providerPlans.length > 0 ? (
            <div className="space-y-4">
              {providerPlans.map((plan) => (
                <Card key={plan.id} className="border-2 hover:border-[#0A5C8C] hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1">{plan.plan_name}</h3>
                            <div className="flex gap-2">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                                {plan.plan_type}
                              </span>
                              {plan.renewable_percentage >= 50 && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                                  <Leaf className="w-3 h-3 mr-1" />
                                  {plan.renewable_percentage}% Green
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 mb-1">Rate</p>
                            <p className="font-bold text-[#0A5C8C] text-lg">{plan.rate_per_kwh}¢/kWh</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Est. Monthly</p>
                            <p className="font-bold text-gray-900">${calculateMonthlyBill(plan, 1000)}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 mb-1">Contract</p>
                            <p className="font-semibold text-gray-700">{plan.contract_length || 'Variable'} mo</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Link to={createPageUrl("CompareRates")}>
                          <Button className="w-full md:w-auto bg-[#FF6B35] hover:bg-[#e55a2b] text-white">
                            Check Availability
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-gray-600 mb-4">No plans currently available from this provider in our database.</p>
                <Link to={createPageUrl("AllProviders")}>
                  <Button variant="outline">Browse Other Providers</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl font-bold mb-3">
            Compare {providerName} with Other Providers
          </h2>
          <p className="text-base text-blue-100 mb-6 max-w-2xl mx-auto">
            See how {providerName} stacks up against 40+ other providers in your area
          </p>
          
          <div className="bg-white rounded-xl p-1.5 shadow-2xl max-w-2xl mx-auto mb-5">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="flex-1 flex items-center gap-2.5 px-4 py-3 bg-gray-50 rounded-lg">
                <MapPin className="w-4 h-4 text-[#0A5C8C] flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="Enter your ZIP code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                  className="border-0 bg-transparent focus-visible:ring-0 text-gray-900 text-base p-0 h-auto font-semibold"
                  maxLength={5}
                />
              </div>
              <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                <Button className="w-full sm:w-auto px-8 py-3 text-base font-bold rounded-lg bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full">
                  Compare All
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
              <span>All Providers</span>
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