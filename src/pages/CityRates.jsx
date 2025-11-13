import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, Zap, Users, Building2, TrendingDown, CheckCircle, 
  ArrowRight, DollarSign, Clock, Shield, Star, Leaf, ChevronDown 
} from "lucide-react";
import PlanCard from "../components/compare/PlanCard";
import { getProvidersForZipCode, getProviderDetails } from "../components/compare/providerAvailability";
import DataDisclaimer, { FooterDisclaimer } from "../components/DataDisclaimer";

// City-specific data for SEO
const cityData = {
  "Houston": {
    county: "Harris County",
    population: "2,300,000+",
    zipCodes: ["77002", "77019", "77024", "77027", "77056", "77063", "77098"],
    avgRate: "8.9¢/kWh",
    avgMonthlyBill: "$128",
    providers: 45,
    neighborhoods: ["Downtown Houston", "The Heights", "Montrose", "River Oaks", "Midtown", "Galleria", "Memorial"],
    description: "Houston, the largest city in Texas and the energy capital of the world, offers residents access to over 45 electricity providers in the deregulated market.",
    image: "https://images.unsplash.com/photo-1577894947058-fccf5cf3f8ac?w=1200&h=600&fit=crop"
  },
  "Dallas": {
    county: "Dallas County",
    population: "1,300,000+",
    zipCodes: ["75201", "75202", "75204", "75205", "75214", "75219", "75230"],
    avgRate: "9.1¢/kWh",
    avgMonthlyBill: "$132",
    providers: 42,
    neighborhoods: ["Downtown Dallas", "Uptown", "Deep Ellum", "Highland Park", "Oak Lawn", "Lake Highlands", "North Dallas"],
    description: "Dallas residents benefit from competitive electricity rates with access to over 42 providers offering a wide range of fixed and variable rate plans.",
    image: "https://images.unsplash.com/photo-1552083974-186346191183?w=1200&h=600&fit=crop"
  },
  "Austin": {
    county: "Travis County",
    population: "978,000+",
    zipCodes: ["78701", "78702", "78703", "78704", "78731", "78745", "78757"],
    avgRate: "9.3¢/kWh",
    avgMonthlyBill: "$135",
    providers: 38,
    neighborhoods: ["Downtown Austin", "South Congress", "East Austin", "West Lake Hills", "Hyde Park", "Zilker", "Mueller"],
    description: "Austin, the state capital and tech hub, provides residents with competitive electricity rates and numerous green energy options from 38+ providers.",
    image: "https://images.unsplash.com/photo-1587166287897-57569859d3fe?w=1200&h=600&fit=crop"
  },
  "San Antonio": {
    county: "Bexar County",
    population: "1,500,000+",
    zipCodes: ["78201", "78209", "78212", "78216", "78232", "78249", "78258"],
    avgRate: "8.8¢/kWh",
    avgMonthlyBill: "$127",
    providers: 40,
    neighborhoods: ["Downtown San Antonio", "Alamo Heights", "Stone Oak", "The Dominion", "Southtown", "King William", "Medical Center"],
    description: "San Antonio offers some of the most competitive electricity rates in Texas, with 40+ providers serving the area's residential and commercial customers.",
    image: "https://images.unsplash.com/photo-1583582183923-4cf85c286e8f?w=1200&h=600&fit=crop"
  },
  "Fort Worth": {
    county: "Tarrant County",
    population: "927,000+",
    zipCodes: ["76102", "76104", "76107", "76109", "76116", "76132", "76244"],
    avgRate: "9.0¢/kWh",
    avgMonthlyBill: "$130",
    providers: 41,
    neighborhoods: ["Downtown Fort Worth", "Cultural District", "Sundance Square", "West 7th", "Ridglea", "Tanglewood", "Alliance"],
    description: "Fort Worth residents enjoy access to competitive electricity rates from 41+ providers in the deregulated Texas energy market.",
    image: "https://images.unsplash.com/photo-1580853039160-f0376b92f928?w=1200&h=600&fit=crop"
  },
  "Plano": {
    county: "Collin County",
    population: "286,000+",
    zipCodes: ["75023", "75024", "75025", "75074", "75075", "75093", "75094"],
    avgRate: "9.2¢/kWh",
    avgMonthlyBill: "$133",
    providers: 43,
    neighborhoods: ["West Plano", "East Plano", "Legacy West", "Willow Bend", "Parker Road Corridor", "Downtown Plano", "Haggard Park"],
    description: "Plano residents enjoy access to competitive electricity rates from 43+ providers in the Collin County deregulated market.",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop"
  },
  "Arlington": {
    county: "Tarrant County",
    population: "398,000+",
    zipCodes: ["76001", "76010", "76011", "76012", "76013", "76015", "76016"],
    avgRate: "9.1¢/kWh",
    avgMonthlyBill: "$131",
    providers: 40,
    neighborhoods: ["Downtown Arlington", "Pantego", "Dalworthington Gardens", "Entertainment District", "North Arlington", "South Arlington", "West Arlington"],
    description: "Arlington offers residents competitive electricity rates with 40+ providers serving the area between Dallas and Fort Worth.",
    image: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&h=600&fit=crop"
  },
  "Corpus Christi": {
    county: "Nueces County",
    population: "326,000+",
    zipCodes: ["78401", "78404", "78405", "78411", "78412", "78413", "78414"],
    avgRate: "8.7¢/kWh",
    avgMonthlyBill: "$125",
    providers: 37,
    neighborhoods: ["Downtown Corpus Christi", "Ocean Drive", "Flour Bluff", "Padre Island", "Southside", "Calallen", "Bay Area"],
    description: "Corpus Christi coastal residents benefit from competitive electricity rates with 37+ providers in the Gulf Coast region.",
    image: "https://images.unsplash.com/photo-1580071413131-47c7f6760f6a?w=1200&h=600&fit=crop"
  },
  "El Paso": {
    county: "El Paso County",
    population: "679,000+",
    zipCodes: ["79901", "79902", "79903", "79904", "79912", "79924", "79936"],
    avgRate: "9.4¢/kWh",
    avgMonthlyBill: "$136",
    providers: 35,
    neighborhoods: ["Downtown El Paso", "West Side", "East Side", "Northeast", "Central", "Mission Valley", "Cielo Vista"],
    description: "El Paso residents have access to competitive electricity rates from 35+ providers serving the westernmost Texas market.",
    image: "https://images.unsplash.com/photo-1583321500900-82807e458f3c?w=1200&h=600&fit=crop"
  },
  "Irving": {
    county: "Dallas County",
    population: "239,000+",
    zipCodes: ["75038", "75039", "75060", "75061", "75062", "75063", "75039"],
    avgRate: "9.0¢/kWh",
    avgMonthlyBill: "$130",
    providers: 42,
    neighborhoods: ["Las Colinas", "Valley Ranch", "Downtown Irving", "North Irving", "South Irving", "Heritage District", "Lake Carolyn"],
    description: "Irving residents benefit from competitive electricity rates with 42+ providers in the Dallas-Fort Worth metroplex.",
    image: "https://images.unsplash.com/photo-1605648916361-9bc12352f964?w=1200&h=600&fit=crop"
  },
  "Frisco": {
    county: "Collin County",
    population: "200,000+",
    zipCodes: ["75033", "75034", "75035", "75068"],
    avgRate: "9.2¢/kWh",
    avgMonthlyBill: "$133",
    providers: 43,
    neighborhoods: ["Downtown Frisco", "Frisco Square", "The Star", "Stonebriar", "West Frisco", "East Frisco", "Phillips Creek Ranch"],
    description: "Frisco, one of the fastest-growing cities in Texas, offers residents competitive electricity rates from 43+ providers.",
    image: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=1200&h=600&fit=crop"
  },
  "McKinney": {
    county: "Collin County",
    population: "195,000+",
    zipCodes: ["75069", "75070", "75071", "75072"],
    avgRate: "9.1¢/kWh",
    avgMonthlyBill: "$131",
    providers: 42,
    neighborhoods: ["Historic Downtown McKinney", "Craig Ranch", "Stonebridge Ranch", "Eldorado", "Tucker Hill", "Adriatica Village"],
    description: "McKinney residents enjoy competitive electricity rates with 42+ providers in the rapidly growing Collin County area.",
    image: "https://images.unsplash.com/photo-1494548162494-384bba4ab999?w=1200&h=600&fit=crop"
  }
};

export default function CityRates() {
  const [zipCode, setZipCode] = useState("");
  const [usage, setUsage] = useState(1000);
  const [cityName, setCityName] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  // Get city from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const city = urlParams.get('city') || 'Houston';
    setCityName(city);
    
    // Set page title for SEO
    document.title = `Cheap Electricity Rates in ${city}, TX | Compare ${city} Energy Plans`;
  }, []);

  const city = cityData[cityName] || cityData["Houston"];

  const { data: plans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.ElectricityPlan.list(),
    initialData: [],
  });

  // Get available providers for first ZIP in city
  const cityZipCode = city.zipCodes[0];
  const availableProviders = getProvidersForZipCode(cityZipCode);
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
      {/* Hero Section - SEO Optimized */}
      <div className="relative bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img src={city.image} alt={`${cityName} skyline`} className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-3xl">
            {/* Breadcrumb for SEO */}
            <nav className="mb-4 text-xs">
              <Link to={createPageUrl("Home")} className="text-blue-200 hover:text-white">Home</Link>
              <span className="mx-2 text-blue-300">/</span>
              <Link to={createPageUrl("AllCities")} className="text-blue-200 hover:text-white">Service Areas</Link>
              <span className="mx-2 text-blue-300">/</span>
              <span className="text-white">{cityName}</span>
            </nav>

            <h1 className="text-3xl lg:text-4xl font-bold mb-3">
              Cheap Electricity Rates in {cityName}, Texas
            </h1>
            <p className="text-lg text-blue-100 mb-5">
              Compare electricity plans from {city.providers}+ providers serving {city.county}. 
              Average rates starting at {city.avgRate} with potential savings up to $800/year.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl font-bold mb-1">{city.avgRate}</div>
                <div className="text-xs text-blue-100">Avg. Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl font-bold mb-1">{city.providers}+</div>
                <div className="text-xs text-blue-100">Providers</div>
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
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-[#0A5C8C] flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder={`Enter ${cityName} ZIP code`}
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 text-base p-0 h-auto font-semibold"
                    maxLength={5}
                  />
                </div>
                <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                  <Button className="w-full sm:w-auto px-6 py-5 text-base font-bold rounded-lg bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full">
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
            Electricity Providers in {cityName}, TX
          </h2>
          <div className="prose prose-lg max-w-none text-gray-600">
            <p className="text-lg leading-relaxed mb-4">
              {city.description} Finding the best electricity plan in {cityName} is easier than ever 
              with Power Scouts' free comparison tool.
            </p>
            <p className="text-lg leading-relaxed">
              Whether you're moving to {cityName}, looking to switch providers, or simply want to reduce your 
              monthly electricity bill, our platform helps you compare plans from top-rated providers including 
              TXU Energy, Reliant, Gexa Energy, and many more. We serve all neighborhoods in {city.county} 
              including {city.neighborhoods.slice(0, 3).join(", ")}, and beyond.
            </p>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Compare Electricity Plans in {cityName}?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-[#FF6B35] transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Save Money</h3>
                <p className="text-gray-600">
                  {cityName} residents can save up to $800 per year by switching to a better electricity plan
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
                  Access {city.providers}+ providers with fixed, variable, and renewable energy plans
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
                Top Electricity Plans in {cityName}
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
            {cityName} Neighborhoods We Serve
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8">
            <p className="text-gray-700 mb-4">
              Power Scouts helps residents across all {cityName} neighborhoods find the best electricity rates:
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {city.neighborhoods.map((neighborhood, index) => (
                <div key={index} className="flex items-center gap-2 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="font-medium">{neighborhood}</span>
                </div>
              ))}
            </div>
            <p className="text-gray-600 mt-6 text-sm">
              Common ZIP codes: {city.zipCodes.join(", ")}, and more
            </p>
          </div>
        </section>

        {/* FAQ Section - SEO Rich Content */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            {cityName} Electricity FAQs
          </h2>
          <div className="space-y-4">
            {[
              {
                id: 1,
                question: `What is the average electricity rate in ${cityName}, TX?`,
                answer: `The average electricity rate in ${cityName} is approximately ${city.avgRate}, though rates vary by provider, plan type, and usage level. With Power Scouts, you can compare rates from all ${city.providers}+ providers serving ${city.county} to find the best deal for your home.`
              },
              {
                id: 2,
                question: `How do I switch electricity providers in ${cityName}?`,
                answer: `Switching electricity providers in ${cityName} is easy. Simply compare plans on Power Scouts, select your preferred plan, and sign up online or by phone. Your new provider will handle the switch with your current provider, and your power will never be interrupted during the transition.`
              },
              {
                id: 3,
                question: `Are there renewable energy options in ${cityName}?`,
                answer: `Yes! Many electricity providers in ${cityName} offer 100% renewable energy plans sourced from Texas wind and solar farms. Green energy plans are often competitively priced and help reduce your carbon footprint while supporting clean energy development in Texas.`
              },
              {
                id: 4,
                question: `What's the best electricity plan for ${cityName} residents?`,
                answer: `The best electricity plan depends on your usage, budget, and preferences. Fixed-rate plans offer price stability, while variable-rate plans may have lower rates but fluctuate monthly. For most ${cityName} residents, a 12 or 24-month fixed-rate plan provides the best balance of savings and predictability.`
              }
            ].map((faq) => (
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

        {/* Final CTA Section */}
        <section className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">
            Ready to Save on Electricity in {cityName}?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of {cityName} residents who have saved money by comparing electricity rates
          </p>
          
          <div className="bg-white rounded-2xl p-1.5 shadow-2xl max-w-2xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-gray-50 rounded-xl">
                <MapPin className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
                <Input
                  type="text"
                  placeholder={`Enter your ${cityName} ZIP code`}
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 text-lg p-0 h-auto font-semibold"
                  maxLength={5}
                />
              </div>
              <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                <Button className="w-full sm:w-auto px-10 py-6 text-lg font-bold rounded-xl bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full">
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

        {/* Data Disclaimer */}
        <div className="mb-12">
          <DataDisclaimer variant="compact" />
        </div>
      </div>

      {/* SEO Footer Content */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-sm max-w-none text-gray-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              About Electricity Service in {cityName}, Texas
            </h2>
            <p>
              As a resident of {cityName}, {city.county}, you have the power to choose your electricity provider 
              thanks to Texas's deregulated energy market. This means you're not stuck with one utility company – 
              you can shop around and find the electricity plan that best fits your needs and budget. Power Scouts 
              makes this process simple by allowing you to compare rates from {city.providers}+ providers in minutes.
            </p>
            <p>
              Whether you live in {city.neighborhoods[0]}, {city.neighborhoods[1]}, or any other {cityName} neighborhood, 
              you can access competitive rates, renewable energy options, and flexible contract terms. From short-term 
              month-to-month plans to long-term fixed-rate contracts, there's an electricity plan for every {cityName} 
              household. Start comparing today and see how much you could save on your electricity bill.
            </p>
          </div>
        </div>
      </div>

      <FooterDisclaimer />
    </div>
  );
}