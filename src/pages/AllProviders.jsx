import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { generateProviderSlug, getProviderLogoUrl, getProviderPageUrl } from "@/utils/providerSlug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, Zap, ArrowRight, CheckCircle, Leaf, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";
import { ElectricityProvider, ElectricityPlan } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { useAffiliateLinks } from "@/hooks/useAffiliateLink";

export default function AllProviders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [zipCode, setZipCode] = useState("");
  const { getAffiliateUrl } = useAffiliateLinks();

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: () => ElectricityProvider.filter({ is_active: true }),
    initialData: [],
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => ElectricityPlan.list(),
    initialData: [],
  });

  const providersWithStats = providers.map(provider => {
    const providerPlans = plans.filter(p => p.provider_name === provider.name);
    const minRate = providerPlans.length > 0 
      ? Math.min(...providerPlans.map(p => p.rate_per_kwh))
      : null;
    
    // Use real features from DB, with fallback
    const features = Array.isArray(provider.features) && provider.features.length > 0
      ? provider.features
      : ["Competitive Rates", "Flexible Plans", "Easy Signup"];

    // Use real review count from DB
    const reviewCount = provider.review_count || 0;

    return {
      id: provider.id,
      name: provider.name,
      logo: getProviderLogoUrl(provider),
      rating: provider.rating || 4.8,
      reviews: reviewCount,
      description: provider.description,
      features: features,
      minRate: minRate ? `${minRate}¢/kWh` : "Contact for rates",
      states: provider.supported_states || [],
      cities: [],
      planCount: providerPlans.length,
      customerCount: reviewCount > 0 ? `${(reviewCount / 1000).toFixed(0)}K+` : "New",
      slug: generateProviderSlug(provider.name),
      affiliate_url: provider.affiliate_url,
      website_url: provider.website_url,
    };
  });

  const filteredProviders = providersWithStats.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Electricity Providers", url: "/all-providers" }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Top Electricity Providers - Compare 40+ Companies | ElectricScouts"
        description="Compare electricity providers across 12 states. TXU Energy, Reliant, Gexa, Constellation, Direct Energy & 35+ more. Read reviews, compare rates, find best electricity company for your home. Fixed rates, renewable energy, flexible terms. Free provider comparison."
        keywords="electricity providers, energy companies, power companies, best electricity provider, TXU Energy, Reliant Energy, Gexa Energy, Constellation Energy, electricity company reviews, energy provider comparison, electric companies near me"
        canonical="/all-providers"
        structuredData={breadcrumbData}
      />
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-10 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
              Compare Top Electricity Providers
            </h1>
            <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8">
              Explore plans from trusted electricity providers across 12 states. Find the best rates and switch in minutes.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-11 sm:pl-12 h-11 sm:h-12 bg-white border-0 shadow-lg text-sm sm:text-base touch-manipulation text-gray-900 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 py-4 sm:py-5 lg:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0A5C8C] mb-1">{providers.length}</div>
              <div className="text-xs sm:text-sm text-gray-600">Providers</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0A5C8C] mb-1">{plans.length}</div>
              <div className="text-xs sm:text-sm text-gray-600">Plans Available</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0A5C8C] mb-1">$800</div>
              <div className="text-xs sm:text-sm text-gray-600">Avg. Annual Savings</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0A5C8C] mb-1">100%</div>
              <div className="text-xs sm:text-sm text-gray-600">Free Service</div>
            </div>
          </div>
        </div>
      </div>

      {/* Providers Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Featured Providers
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
          {filteredProviders.map((provider, index) => (
            <Card key={provider.id || index} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-[#FF6B35] group">
              <CardContent className="p-6">
                {/* Provider Logo */}
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                    {provider.logo ? (
                      <img 
                        src={provider.logo} 
                        alt={`${provider.name} logo`}
                        className="h-8 w-auto object-contain max-w-[120px]"
                        loading="lazy"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = `<span class="text-sm font-bold text-[#0A5C8C]">${provider.name.substring(0, 3).toUpperCase()}</span>`;
                        }}
                      />
                    ) : (
                      <span className="text-sm font-bold text-[#0A5C8C]">
                        {provider.name.substring(0, 3).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {provider.features.some(f => 
                    f.toLowerCase().includes("green") || 
                    f.toLowerCase().includes("renewable") || 
                    f.toLowerCase().includes("solar")
                  ) && (
                    <div className="bg-green-100 p-2 rounded-full">
                      <Leaf className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                </div>

                {/* Provider Name */}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{provider.name}</h3>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-gray-900">{provider.rating}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    ({provider.reviews > 0 ? `${provider.reviews.toLocaleString()} reviews` : 'New provider'})
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {provider.description}
                </p>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-blue-50 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-600 mb-0.5">Starting at</div>
                    <div className="text-sm font-bold text-[#0A5C8C]">{provider.minRate}</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-600 mb-0.5">Plans</div>
                    <div className="text-sm font-bold text-green-700">{provider.planCount}</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-2 text-center">
                    <div className="text-xs text-gray-600 mb-0.5">Customers</div>
                    <div className="text-xs font-bold text-purple-700">{provider.customerCount}</div>
                  </div>
                </div>

                {/* States Coverage */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Serves {provider.states.length} State{provider.states.length > 1 ? 's' : ''}:</div>
                  <div className="flex flex-wrap gap-1">
                    {provider.states.map((state, i) => (
                      <span key={i} className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-1 rounded">
                        {state}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Features */}
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Key Features:</div>
                  <div className="space-y-1">
                    {provider.features.slice(0, 3).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Link to={getProviderPageUrl(provider.name)}>
                    <Button variant="outline" className="w-full text-sm">
                      Learn More
                    </Button>
                  </Link>
                  <a href={getAffiliateUrl({ providerId: provider.id, fallbackUrl: provider.affiliate_url || provider.website_url || '#' })} target="_blank" rel="noopener noreferrer" className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm inline-flex items-center justify-center rounded-md px-4 py-2 font-medium no-underline">
                      View Plans
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-[#0A5C8C] to-[#084a6f] rounded-3xl shadow-2xl p-12 text-center overflow-hidden">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-3">
              Ready to Find Your Perfect Plan?
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Enter your ZIP code to see personalized rates from all these providers instantly.
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
