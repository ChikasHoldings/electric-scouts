import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useParams } from "react-router-dom";
import { parseCityUrl, getCityUrl, getStatePageUrl } from "@/utils/cityUrls";
import { cityTitle, cityDescription } from "@/seo/routes.js";
import { getStateMarket } from "@/seo/market.js";
import PageBreadcrumbs from "@/components/PageBreadcrumbs";
import RelatedCities from "@/components/RelatedCities";
import ContextualLinks from "@/components/ContextualLinks";
import { ElectricityPlan } from "@/api/supabaseEntities";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap, CheckCircle, 
  ArrowRight, DollarSign, Shield, Star, Leaf, ChevronDown 
} from "lucide-react";
import { getProvidersForZipCode, getProviderDetails } from "../components/compare/providerAvailability";
import SEOHead, { getBreadcrumbSchema, getServiceSchema, getFAQSchema } from "../components/SEOHead";
import ValidatedZipInput from "../components/ValidatedZipInput";

// Comprehensive city data for all states
import { cityData } from "@/data/cityRatesData";

class CityRatesErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('CityRates crash:', error, info); }
  render() {
    if (this.state.hasError) return <div className="p-8 text-red-600"><h1>CityRates Error</h1><pre>{this.state.error?.toString()}</pre></div>;
    return this.props.children;
  }
}

function CityRatesInner() {
  const [zipCode, setZipCode] = useState("");
  const [usage, setUsage] = useState(1000);
  const [cityName, setCityName] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [isZipValid, setIsZipValid] = useState(false);
  // Support both clean URLs (/electricity-rates/texas/houston) and legacy query params (?city=Houston&state=TX)
  const { stateSlug, citySlug } = useParams();
  const [searchParams] = useSearchParams();
  const cityParam = searchParams.get('city');
  const stateParam = searchParams.get('state');

  // Get city and state from URL - update when URL changes
  useEffect(() => {
    if (stateSlug && citySlug) {
      // Clean URL: /electricity-rates/texas/houston
      const parsed = parseCityUrl(stateSlug, citySlug);
      if (parsed.stateCode) {
        setCityName(`${parsed.city}-${parsed.stateCode}`);
      } else {
        setCityName('Houston-TX');
      }
    } else if (cityParam && stateParam) {
      const cityKey = `${cityParam}-${stateParam}`;
      setCityName(cityKey);
    } else if (cityParam) {
      setCityName(cityParam);
    } else {
      setCityName('Houston-TX');
    }
  }, [stateSlug, citySlug, cityParam, stateParam]);

  // Always prioritize the full city-state key, generate generic data if city doesn't exist
  const cityKey = cityName;
  const displayCityName = cityName.split('-')[0];
  const stateCode = cityName.split('-')[1] || 'TX';
  
  // State-level defaults for when specific city isn't in database
  const stateDefaults = {
    'TX': { avgRate: "9.0¢/kWh", avgMonthlyBill: "$130", providers: 40, state: "Texas", county: "Local County" },
    'IL': { avgRate: "9.8¢/kWh", avgMonthlyBill: "$142", providers: 35, state: "Illinois", county: "Local County" },
    'OH': { avgRate: "9.6¢/kWh", avgMonthlyBill: "$139", providers: 36, state: "Ohio", county: "Local County" },
    'PA': { avgRate: "10.2¢/kWh", avgMonthlyBill: "$147", providers: 30, state: "Pennsylvania", county: "Local County" },
    'NY': { avgRate: "11.0¢/kWh", avgMonthlyBill: "$158", providers: 25, state: "New York", county: "Local County" },
    'NJ': { avgRate: "10.6¢/kWh", avgMonthlyBill: "$152", providers: 26, state: "New Jersey", county: "Local County" },
    'MD': { avgRate: "10.4¢/kWh", avgMonthlyBill: "$150", providers: 28, state: "Maryland", county: "Local County" },
    'MA': { avgRate: "11.3¢/kWh", avgMonthlyBill: "$162", providers: 21, state: "Massachusetts", county: "Local County" },
    'CT': { avgRate: "11.8¢/kWh", avgMonthlyBill: "$169", providers: 19, state: "Connecticut", county: "Local County" },
    'ME': { avgRate: "11.6¢/kWh", avgMonthlyBill: "$166", providers: 16, state: "Maine", county: "Local County" },
    'NH': { avgRate: "11.7¢/kWh", avgMonthlyBill: "$167", providers: 16, state: "New Hampshire", county: "Local County" },
    'RI': { avgRate: "12.0¢/kWh", avgMonthlyBill: "$171", providers: 15, state: "Rhode Island", county: "Local County" }
  };
  
  const city = cityData[cityKey] || {
    ...stateDefaults[stateCode],
    stateCode: stateCode,
    population: "Local residents",
    zipCodes: ["00000"],
    neighborhoods: [`Downtown ${displayCityName}`, `North ${displayCityName}`, `South ${displayCityName}`, `East ${displayCityName}`, `West ${displayCityName}`],
    description: `${displayCityName} residents have access to competitive electricity rates in the deregulated ${stateDefaults[stateCode]?.state || 'energy'} market.`,
    image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80"
  };

  // SEO metadata, mirroring src/seo/routes.js so the prerendered <head> and the
  // hydrated one agree. Generated from the same shape rather than hand-written:
  // the previous title hard-coded "2025", which every city page still carried
  // long after that year ended.
  const cityMarket = getStateMarket(city.stateCode);
  const seoTitle = cityTitle({ name: displayCityName, stateCode: city.stateCode });
  const seoDescription = cityDescription(
    {
      name: displayCityName,
      stateCode: city.stateCode,
      stateName: city.state,
      avgRate: city.avgRate,
      avgMonthlyBill: city.avgMonthlyBill,
      county: city.county,
    },
    cityMarket
  );
  const seoKeywords = `${displayCityName} electricity rates, ${displayCityName} ${city.stateCode} electricity providers, cheap electricity ${displayCityName}, ${displayCityName} power companies, electricity rates ${city.county}, best electricity rates ${displayCityName}, compare electricity ${displayCityName}, ${displayCityName} energy plans, ${displayCityName.toLowerCase()} electric rates, ${city.state.toLowerCase()} electricity, ${displayCityName} fixed rate electricity, ${displayCityName} variable rate plans, renewable energy ${displayCityName}, ${city.neighborhoods.slice(0, 3).join(' electricity, ')} electricity`;

  const cleanCityUrl = getCityUrl(displayCityName, city.stateCode);
  const statePageUrl = getStatePageUrl(city.stateCode);
  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: city.state, url: statePageUrl },
    { name: displayCityName }
  ];
  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: city.state, url: statePageUrl },
    { name: `${displayCityName}, ${city.stateCode}`, url: cleanCityUrl }
  ]);

  const serviceData = getServiceSchema(city.state);

  const cityFaqs = [
    {
      question: `What is the average electricity rate in ${displayCityName}, ${city.stateCode}?`,
      answer: `The average electricity rate in ${displayCityName} is approximately ${city.avgRate}, though rates vary by provider, plan type, and usage level. With Electric Scouts, you can compare the suppliers with active ${city.state} plans to find the best deal for your home.`
    },
    {
      question: `How do I switch electricity providers in ${displayCityName}?`,
      answer: `Switching electricity providers in ${displayCityName} is easy. Simply compare plans on Electric Scouts, select your preferred plan, and sign up online or by phone. Your new provider will handle the switch with your current provider, and your power will never be interrupted during the transition.`
    },
    {
      question: `Are there renewable energy options in ${displayCityName}?`,
      answer: `Yes! Many electricity providers in ${displayCityName} offer renewable energy plans sourced from wind and solar farms. Green energy plans are often competitively priced and help reduce your carbon footprint while supporting clean energy development in ${city.state}.`
    },
    {
      question: `What's the best electricity plan for ${displayCityName} residents?`,
      answer: `The best electricity plan depends on your usage, budget, and preferences. Fixed-rate plans offer price stability, while variable-rate plans may have lower rates but fluctuate monthly. For most ${displayCityName} residents, a 12 or 24-month fixed-rate plan provides the best balance of savings and predictability.`
    }
  ];
  
  const faqData = getFAQSchema(cityFaqs);
  // No LocalBusiness schema. It declared "Electric Scouts - <City> Electricity
  // Comparison" as a local business on all 144 city pages, but Electric Scouts
  // is a national online comparison service with no premises in any of them.
  // getServiceSchema already models this correctly: a service with an areaServed.

  // Defaulted to []: react-query only serves placeholderData while the query is
  // pending, so a failed Supabase request leaves `data` undefined and the next
  // .filter() throws — which blanked this page behind an error boundary for
  // users and crawlers alike whenever the database was unreachable.
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => ElectricityPlan.list(),
    placeholderData: [],
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Get available providers for first ZIP in city
  const cityZipCode = city.zipCodes[0];
  const [availableProviders, setAvailableProviders] = useState([]);
  
  useEffect(() => {
    let cancelled = false;
    getProvidersForZipCode(cityZipCode).then(providers => {
      if (!cancelled) setAvailableProviders(providers || []);
    }).catch(() => {
      if (!cancelled) setAvailableProviders([]);
    });
    return () => { cancelled = true; };
  }, [cityZipCode]);
  
  const availableProviderNames = availableProviders.map(p => p.name);
  
  // Filter plans by providers available in this city
  const cityPlans = plans.filter(plan => 
    availableProviderNames.includes(plan.provider_name)
  ).slice(0, 6);

  // Get provider logo
  const getProviderLogo = (providerName) => {
    const provider = getProviderDetails(providerName);
    return provider ? provider.logo : null;
  };

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={seoTitle}
        description={seoDescription}
        keywords={seoKeywords}
        canonical={cleanCityUrl}
        image={city.image}
        structuredData={[breadcrumbData, serviceData, faqData]}
      />

      {/* Hero Section - SEO Optimized */}
      <div className="relative bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white overflow-hidden">
        {/* Only rendered where the city has a photograph of its own. Two generic
            stock images used to be shared across 105 cities, each captioned as
            that city's skyline — one image claiming to be both Parma, Ohio and
            Sugar Land, Texas. A decorative gradient is better than a false
            caption, so cities without their own photo simply have none. */}
        {city.image && (
          <div className="absolute inset-0 opacity-10">
            <img
              src={city.image}
              alt={`${displayCityName}, ${city.state}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-3xl">
            {/* Breadcrumb Navigation */}
            <PageBreadcrumbs items={breadcrumbItems} variant="light" className="mb-4" />

            <h1 className="text-3xl lg:text-4xl font-bold mb-3">
              Cheap Electricity Rates in {displayCityName}, {city.state}
            </h1>
            <p className="text-lg text-blue-100 mb-5">
              Compare electricity plans from the suppliers serving {city.county}.
              The average residential rate here is {city.avgRate}.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl font-bold mb-1">{city.avgRate}</div>
                <div className="text-xs text-blue-100">Avg. Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl font-bold mb-1">{cityMarket?.providers ?? "—"}</div>
                <div className="text-xs text-blue-100">{city.state} Suppliers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl font-bold mb-1">{city.avgMonthlyBill}</div>
                <div className="text-xs text-blue-100">Avg. Bill</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl font-bold mb-1">{city.population}</div>
                <div className="text-xs text-blue-100">Population</div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-white rounded-xl p-1.5 shadow-2xl max-w-2xl">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 px-4 py-3 bg-gray-50 rounded-lg">
                  <ValidatedZipInput
                    value={zipCode}
                    onChange={setZipCode}
                    placeholder={`Enter ${displayCityName} ZIP code`}
                    className="text-base"
                    onValidationChange={setIsZipValid}
                  />
                </div>
                <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                  <Button 
                    className="w-full sm:w-auto px-6 py-5 text-base font-bold rounded-lg bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full"
                    disabled={!isZipValid && zipCode.length > 0}
                  >
                    Compare Rates
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* About Section - SEO Content */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Electricity Providers in {displayCityName}, {city.stateCode}
          </h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="text-lg leading-relaxed mb-4">
              {city.description} Finding the best electricity plan in {displayCityName} is easier than ever 
              with Electric Scouts' free comparison tool.
            </p>
            <p className="text-lg leading-relaxed">
              Whether you're moving to {displayCityName}, looking to switch providers, or simply want to reduce your 
              monthly electricity bill, our platform helps you compare plans from top-rated providers. We serve all neighborhoods in {city.county} 
              including {city.neighborhoods.slice(0, 3).join(", ")}, and beyond.
            </p>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Compare Electricity Plans in {displayCityName}?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-[#FF6B35] transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">See Every Rate</h3>
                <p className="text-gray-600">
                  Supply in {displayCityName} is sold by competing retailers at different rates. We show you
                  all of them for your address, so you can compare yours against what is on offer.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-[#FF6B35] transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">More Options</h3>
                <p className="text-gray-600">
                  Access suppliers offering fixed, variable, and renewable energy plans
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-[#FF6B35] transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">No Risk</h3>
                <p className="text-gray-600">
                  Free comparison service with no credit checks, hidden fees, or obligations
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Featured Plans */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Top Electricity Plans in {displayCityName}
              </h2>
              <p className="text-gray-600">
                Current rates available in {city.county}
              </p>
            </div>
            <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
              <Button variant="outline" className="hidden md:flex">
                View All Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-200 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Provider</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Plan</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Rate</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Est. Bill</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Term</th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-700 uppercase">Rating</th>
                        <th className="px-5 py-3 text-center text-xs font-bold text-gray-700 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cityPlans.map((plan) => {
                        const monthlyBill = ((plan.rate_per_kwh / 100) * usage) + (plan.monthly_base_charge || 0);
                        return (
                          <tr key={plan.id} className="hover:bg-blue-50/50 transition-colors group">
                            <td className="px-5 py-3.5">
                              <div className="font-bold text-gray-900 text-sm">{plan.provider_name}</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="font-semibold text-gray-900 text-sm mb-1">{plan.plan_name}</div>
                              <div className="flex gap-1.5">
                                {plan.plan_type === 'fixed' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                                    {plan.plan_type}
                                  </span>
                                )}
                                {plan.renewable_percentage >= 50 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                                    <Leaf className="w-3 h-3 mr-0.5" />
                                    Green
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="text-xl font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                              <div className="text-xs text-gray-500">per kWh</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="text-base font-bold text-gray-900">${monthlyBill.toFixed(0)}</div>
                              <div className="text-xs text-gray-500">@ {usage} kWh</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="text-sm text-gray-900 font-semibold">{plan.contract_length || 'Variable'} mo</div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold text-gray-900 text-sm">4.5</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                                <Button size="sm" className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-xs px-4 whitespace-nowrap shadow-sm">
                                  View Plan
                                </Button>
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-3">
                {cityPlans.map((plan) => {
                  const monthlyBill = ((plan.rate_per_kwh / 100) * usage) + (plan.monthly_base_charge || 0);
                  return (
                    <Card key={plan.id} className="border hover:border-[#0A5C8C] hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2.5">
                          <div>
                            <div className="font-bold text-gray-900 text-base">{plan.provider_name}</div>
                            <div className="text-sm text-gray-600">{plan.plan_name}</div>
                          </div>
                          <div className="flex items-center gap-0.5 bg-yellow-50 px-2 py-1 rounded">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-bold text-gray-900">4.5</span>
                          </div>
                        </div>

                        <div className="flex gap-1.5 mb-3">
                          {plan.plan_type === 'fixed' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 capitalize">
                              {plan.plan_type}
                            </span>
                          )}
                          {plan.renewable_percentage >= 50 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800">
                              <Leaf className="w-3 h-3 mr-0.5" />
                              Green
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-3 bg-gray-50 rounded-lg p-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Rate</div>
                            <div className="text-base font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Est. Bill</div>
                            <div className="text-base font-bold text-gray-900">${monthlyBill.toFixed(0)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-0.5">Term</div>
                            <div className="text-sm font-semibold text-gray-900">{plan.contract_length || 'Var'} mo</div>
                          </div>
                        </div>

                        <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                          <Button size="sm" className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white text-sm">
                            View Plan
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
              <Button variant="outline" className="lg:hidden w-full">
                View All Plans
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Neighborhoods Section - SEO Content */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {displayCityName} Neighborhoods We Serve
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8">
            <p className="text-gray-700 mb-4">
              Electric Scouts helps residents across all {displayCityName} neighborhoods find the best electricity rates:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {city.neighborhoods.map((neighborhood, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium">{neighborhood}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section - SEO Rich Content */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {displayCityName} Electricity FAQs
          </h2>
          <div className="space-y-4">
            {/* Identified by position. These FAQ objects carry no id, so
                key={faq.id} was undefined on every one of them — React saw a
                keyless list, and the open-state check compared undefined to
                undefined, so opening one question opened all four at once. */}
            {cityFaqs.map((faq, index) => (
              <Card
                key={index}
                className="border-2 hover:border-[#0A5C8C] transition-all cursor-pointer overflow-hidden"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-6">
                    <h3 className="text-lg font-bold text-gray-900 pr-4">
                      {faq.question}
                    </h3>
                    <ChevronDown 
                      className={`w-5 h-5 text-[#0A5C8C] flex-shrink-0 transition-transform duration-300 ${
                        openFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
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

        {/* Final CTA Section */}
        <section className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Save on Electricity in {displayCityName}?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of {displayCityName} residents who have saved money by comparing electricity rates
          </p>
          
          <div className="bg-white rounded-2xl p-1.5 shadow-2xl max-w-2xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="flex-1 px-5 py-4 bg-gray-50 rounded-xl">
                <ValidatedZipInput
                  value={zipCode}
                  onChange={setZipCode}
                  placeholder={`Enter your ${displayCityName} ZIP code`}
                  className="text-lg"
                  onValidationChange={setIsZipValid}
                />
              </div>
              <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                <Button 
                  className="w-full sm:w-auto px-10 py-6 text-lg font-bold rounded-xl bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full"
                  disabled={!isZipValid && zipCode.length > 0}
                >
                  Compare Now
                </Button>
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>100% Free Service</span>
            </div>
            <span className="text-blue-300">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>No Credit Check</span>
            </div>
            <span className="text-blue-300">•</span>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>Instant Comparison</span>
            </div>
          </div>
        </section>
      </div>

      {/* Related Cities & Internal Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RelatedCities
          currentCity={displayCityName}
          stateCode={city.stateCode}
          allCityKeys={Object.keys(cityData)}
        />
        <ContextualLinks pageType="city" context={{ zipCode }} className="mt-8" />
      </div>

      {/* SEO Footer Content */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-sm max-w-none text-gray-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              About Electricity Service in {displayCityName}, {city.state}
            </h2>
            <p>
              As a resident of {displayCityName}, {city.county}, you have the power to choose your electricity provider 
              thanks to {city.state}'s deregulated energy market. This means you're not stuck with one utility company – 
              you can shop around and find the electricity plan that best fits your needs and budget. Electric Scouts 
              makes this process simple by allowing you to compare the available plans in minutes.
            </p>
            <p>
              Whether you live in {city.neighborhoods[0]}, {city.neighborhoods[1]}, or any other {displayCityName} neighborhood, 
              you can access competitive rates, renewable energy options, and flexible contract terms. From short-term 
              month-to-month plans to long-term fixed-rate contracts, there's an electricity plan for every {displayCityName} 
              household. Start comparing today and see how much you could save on your electricity bill.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CityRates() {
  return <CityRatesErrorBoundary><CityRatesInner /></CityRatesErrorBoundary>;
}