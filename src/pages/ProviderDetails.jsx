import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { generateProviderSlug, getProviderLogoUrl, getProviderPageUrl } from "@/utils/providerSlug";
import { ElectricityProvider, ElectricityPlan } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Star, MapPin, Zap, CheckCircle, ArrowRight, Leaf, ExternalLink, Award, TrendingUp, ThumbsUp } from "lucide-react";
import { calculateMonthlyBill } from "../components/compare/dataValidation";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";
import { useAffiliateLinks } from "@/hooks/useAffiliateLink";

export default function ProviderDetails() {
  const [zipCode, setZipCode] = useState("");
  const [providerName, setProviderName] = useState("");

  // Support both slug-based routing (/providers/:slug) and legacy query param (?provider=Name)
  const params = useParams();

  const { data: allPlans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => ElectricityPlan.list(),
    initialData: [],
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => ElectricityProvider.filter({ is_active: true }),
    initialData: [],
  });

  const { getAffiliateUrl } = useAffiliateLinks();

  // Resolve provider name from slug or query param
  useEffect(() => {
    if (params.slug) {
      // Find provider by matching slug
      const found = providers.find(p => generateProviderSlug(p.name) === params.slug);
      if (found) {
        setProviderName(found.name);
      }
    } else {
      // Legacy: use query param
      const urlParams = new URLSearchParams(window.location.search);
      const provider = urlParams.get('provider');
      if (provider) {
        setProviderName(provider);
      }
    }
  }, [params.slug, providers]);

  const providerFromDB = providers.find(p => p.name === providerName);
  const providerLogo = providerFromDB ? getProviderLogoUrl(providerFromDB) : null;
  
  const providerInfo = providerFromDB ? {
    name: providerFromDB.name,
    logo: providerLogo,
    website: getAffiliateUrl({
      providerId: providerFromDB.id,
      fallbackUrl: providerFromDB.affiliate_url || providerFromDB.website_url || "#"
    }),
    states: providerFromDB.supported_states || [],
    isRecommended: providerFromDB.is_recommended || false,
    features: Array.isArray(providerFromDB.features) && providerFromDB.features.length > 0
      ? providerFromDB.features
      : [],
    reviewCount: providerFromDB.review_count || 0,
    phone: providerFromDB.phone || null,
  } : null;

  const providerPlans = allPlans
    .filter(plan => {
      const planData = plan.data || plan;
      const planProviderName = planData.provider_name || plan.provider_name;
      return planProviderName === providerName;
    })
    .map(plan => {
      const planData = plan.data || plan;
      return {
        ...plan,
        provider_name: planData.provider_name || plan.provider_name,
        plan_name: planData.plan_name || plan.plan_name,
        rate_per_kwh: planData.rate_per_kwh || plan.rate_per_kwh,
        contract_length: planData.contract_length || plan.contract_length,
        plan_type: planData.plan_type || plan.plan_type,
        renewable_percentage: planData.renewable_percentage || plan.renewable_percentage,
        monthly_base_charge: planData.monthly_base_charge || plan.monthly_base_charge,
      };
    })
    .sort((a, b) => a.rate_per_kwh - b.rate_per_kwh);

  const popularPlans = providerPlans.slice(0, 3);
  const avgRate = providerPlans.length > 0 
    ? (providerPlans.reduce((acc, p) => acc + p.rate_per_kwh, 0) / providerPlans.length).toFixed(1)
    : 'N/A';

  const lowestRate = providerPlans.length > 0 ? providerPlans[0].rate_per_kwh : 'N/A';
  const renewablePlansCount = providerPlans.filter(p => p.renewable_percentage >= 50).length;

  // Sample reviews - in production, fetch from database
  const sampleReviews = [
    {
      author: "Sarah M.",
      location: "Houston, TX",
      rating: 5,
      date: "2025-11-15",
      text: "Great rates and excellent customer service. Switching was seamless and I'm saving $50+ per month!",
      verified: true
    },
    {
      author: "John D.",
      location: "Dallas, TX",
      rating: 4,
      date: "2025-11-10",
      text: "Competitive pricing and transparent billing. Very satisfied with my choice.",
      verified: true
    },
    {
      author: "Maria L.",
      location: "Austin, TX",
      rating: 5,
      date: "2025-11-05",
      text: "Love the renewable energy options. Highly recommend for anyone looking to go green.",
      verified: true
    }
  ];

  const providerSlug = generateProviderSlug(providerName);
  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Providers", url: "/all-providers" },
    { name: providerName, url: `/providers/${providerSlug}` }
  ]);

  if (!providerName || !providerInfo) {
    // Show loading state while providers are being fetched
    if (params.slug && providers.length === 0) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-[#0A5C8C] rounded-full animate-spin"></div>
        </div>
      );
    }
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
        title={`${providerName} Electricity Rates & Reviews - Compare Plans | ElectricScouts`}
        description={`Compare ${providerName} electricity rates and plans. Read reviews, check availability, find best ${providerName} deals. Serving multiple states with fixed, variable & renewable energy options. Starting at ${lowestRate}¢/kWh. Switch and save today.`}
        keywords={`${providerName} electricity rates, ${providerName} reviews, ${providerName} plans, ${providerName} energy, best ${providerName} deals, ${providerName} renewable energy, compare ${providerName} rates`}
        canonical={`/providers/${providerSlug}`}
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
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<div class="h-16 w-32 bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex items-center justify-center"><span class="text-xl font-bold text-[#0A5C8C]">${providerName.substring(0, 3).toUpperCase()}</span></div>`;
                    }}
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
                    <span className="font-semibold">{providerFromDB?.rating || 4.8}</span>
                  </div>
                  {providerInfo.reviewCount > 0 && (
                    <>
                      <span className="text-blue-200">•</span>
                      <span className="text-blue-100">{providerInfo.reviewCount.toLocaleString()} reviews</span>
                    </>
                  )}
                  <span className="text-blue-200">•</span>
                  <span className="text-blue-100">{providerPlans.length} Plans Available</span>
                </div>
                <p className="text-blue-100 text-base">
                  {providerFromDB?.description || `Competitive electricity rates serving ${providerInfo.states.join(", ")}`}
                </p>
                {providerInfo.phone && (
                  <p className="text-blue-200 text-sm mt-2">
                    Phone: {providerInfo.phone}
                  </p>
                )}
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
                {providerFromDB?.description || `${providerName} is a trusted electricity provider serving customers across ${providerInfo.states.join(", ")}.`}
                {providerPlans.length > 0 && ` With ${providerPlans.length} available plans ranging from ${lowestRate}¢/kWh to competitive variable rates, ${providerName} offers options for every household and business.`}
                {renewablePlansCount > 0 && ` They also offer ${renewablePlansCount} renewable energy plans for environmentally conscious customers.`}
              </p>

              {/* States Coverage */}
              {providerInfo.states && providerInfo.states.length > 0 && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-bold text-gray-900">Available in {providerInfo.states.length} State{providerInfo.states.length > 1 ? 's' : ''}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {providerInfo.states.map((state, i) => (
                      <span key={i} className="bg-white text-gray-900 text-sm font-medium px-3 py-1.5 rounded-md border border-blue-200">
                        {state}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Features from DB */}
              {providerInfo.features.length > 0 && (
                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-100">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Key Features</h3>
                  <div className="flex flex-wrap gap-2">
                    {providerInfo.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-green-200">
                        <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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

        {/* Popular Plans */}
        {popularPlans.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-6 h-6 text-[#FF6B35]" />
              <h2 className="text-2xl font-bold text-gray-900">
                Most Popular Plans
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              {popularPlans.map((plan, index) => (
                <Card key={plan.id} className="border-2 hover:border-[#FF6B35] hover:shadow-xl transition-all relative">
                  {index === 0 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF6B35] text-white px-3 py-1 rounded-full text-xs font-bold">
                      BEST RATE
                    </div>
                  )}
                  <CardContent className="p-5">
                    <h3 className="font-bold text-gray-900 mb-2 text-sm">{plan.plan_name}</h3>
                    <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-4 mb-3 text-center">
                      <div className="text-3xl font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                      <div className="text-xs text-gray-500">per kWh</div>
                    </div>
                    <div className="space-y-2 text-xs mb-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Est. Monthly:</span>
                        <span className="font-bold">${calculateMonthlyBill(plan, 1000)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Contract:</span>
                        <span className="font-semibold">{plan.contract_length || 'Variable'} mo</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium capitalize">{plan.plan_type}</span>
                      </div>
                    </div>
                    <a href={providerInfo.website} target="_blank" rel="noopener noreferrer">
                      <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm">
                        Get This Plan
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Customer Reviews */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ThumbsUp className="w-6 h-6 text-[#0A5C8C]" />
              <h2 className="text-2xl font-bold text-gray-900">
                Customer Reviews
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              <span className="font-bold text-lg">{providerFromDB?.rating || 4.8}</span>
              <span className="text-gray-500 text-sm">({sampleReviews.length} reviews)</span>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {sampleReviews.map((review, index) => (
              <Card key={index} className="border">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    {review.verified && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-3 leading-relaxed">"{review.text}"</p>
                  <div className="text-xs text-gray-500">
                    <div className="font-semibold text-gray-900">{review.author}</div>
                    <div>{review.location} • {new Date(review.date).toLocaleDateString()}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* All Available Plans */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              All Plans from {providerName}
            </h2>
            <a href={providerInfo.website} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm">
                Visit Provider Website
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
                        <a href={providerInfo.website} target="_blank" rel="noopener noreferrer">
                          <Button className="w-full md:w-auto bg-[#FF6B35] hover:bg-[#e55a2b] text-white">
                            Get This Plan
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </a>
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
        <section className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] rounded-2xl p-8 md:p-10 text-white">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-3">
                Ready to Switch to {providerName}?
              </h2>
              <p className="text-base text-blue-100 mb-2">
                Compare all {providerName} plans with 40+ other providers in your area
              </p>
              <p className="text-sm text-blue-200">
                Enter your ZIP code to see personalized rates and savings
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-1.5 shadow-2xl mb-6">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 flex items-center gap-2.5 px-4 py-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
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
                    Compare Rates Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a href={providerInfo.website} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 hover:text-white">
                  View All {providerName} Plans
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>

            <div className="flex items-center justify-center gap-5 flex-wrap text-xs mt-6 pt-6 border-t border-white/20">
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <span>100% Free Comparison</span>
              </div>
              <span className="text-blue-300">•</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <span>No Commitment</span>
              </div>
              <span className="text-blue-300">•</span>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                <span>Instant Results</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
