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

  // Filter plans by city ZIP codes and calculate dynamic statistics
  const cityPlans = plans.filter(plan => 
    plan.zip_codes?.some(zip => city.zipCodes.includes(zip)) || 
    plan.cities?.includes(cityName)
  );

  // Calculate dynamic city statistics from actual plan data
  const calculateCityStats = () => {
    if (cityPlans.length === 0) return null;

    const rates = cityPlans.map(p => p.rate_per_kwh).filter(r => r);
    const avgRate = rates.length > 0 ? (rates.reduce((a, b) => a + b, 0) / rates.length).toFixed(1) : city.avgRate;
    
    const fixedPlans = cityPlans.filter(p => p.plan_type === 'fixed').length;
    const variablePlans = cityPlans.filter(p => p.plan_type === 'variable').length;
    const renewablePlans = cityPlans.filter(p => p.renewable_percentage >= 50).length;
    
    const uniqueProviders = [...new Set(cityPlans.map(p => p.provider_name))];
    const topProviders = uniqueProviders.slice(0, 5);
    
    const lowestRate = Math.min(...rates);
    const avgMonthlyBill = ((avgRate / 100) * 1000).toFixed(0);
    
    return {
      avgRate: `${avgRate}¢/kWh`,
      lowestRate: `${lowestRate}¢/kWh`,
      avgMonthlyBill: `$${avgMonthlyBill}`,
      totalPlans: cityPlans.length,
      fixedPlans,
      variablePlans,
      renewablePlans,
      uniqueProviders: uniqueProviders.length,
      topProviders
    };
  };

  const dynamicStats = calculateCityStats();
  
  // Get top 6 plans sorted by rate for display
  const topPlans = [...cityPlans].sort((a, b) => a.rate_per_kwh - b.rate_per_kwh).slice(0, 6);

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

            {/* Quick Stats - Dynamic Data */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl font-bold mb-1">
                  {dynamicStats ? dynamicStats.lowestRate : city.avgRate}
                </div>
                <div className="text-xs text-blue-100">Lowest Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl font-bold mb-1">
                  {dynamicStats ? dynamicStats.uniqueProviders : city.providers}+
                </div>
                <div className="text-xs text-blue-100">Providers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl font-bold mb-1">
                  {dynamicStats ? dynamicStats.totalPlans : '100+'}
                </div>
                <div className="text-xs text-blue-100">Plans Available</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                <div className="text-xl font-bold mb-1">
                  {dynamicStats ? dynamicStats.avgMonthlyBill : city.avgMonthlyBill}
                </div>
                <div className="text-xs text-blue-100">Avg. Bill @ 1000kWh</div>
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

        {/* Plan Types Breakdown - Dynamic Data */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Plan Types Available in {cityName}
          </h2>
          {dynamicStats && (
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="border-2 hover:border-blue-500 transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600 mb-2">{dynamicStats.fixedPlans}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Fixed Rate Plans</h3>
                  <p className="text-sm text-gray-600">
                    Lock in your rate for predictable monthly bills
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-purple-500 transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingDown className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600 mb-2">{dynamicStats.variablePlans}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Variable Rate Plans</h3>
                  <p className="text-sm text-gray-600">
                    Flexible rates that change with market conditions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-green-500 transition-all">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Leaf className="w-8 h-8 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-600 mb-2">{dynamicStats.renewablePlans}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Renewable Energy</h3>
                  <p className="text-sm text-gray-600">
                    50%+ green energy from Texas wind & solar
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Top Providers in {cityName}
          </h2>
          {dynamicStats && dynamicStats.topProviders.length > 0 && (
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8 mb-12">
              <div className="grid md:grid-cols-5 gap-4">
                {dynamicStats.topProviders.map((provider, index) => (
                  <Link 
                    key={index}
                    to={createPageUrl("ProviderDetails") + `?provider=${provider}`}
                    className="bg-white rounded-lg p-4 text-center hover:shadow-lg transition-all border-2 border-transparent hover:border-[#FF6B35]"
                  >
                    <div className="font-semibold text-gray-900 text-sm mb-1">{provider}</div>
                    <div className="text-xs text-gray-600">View Plans →</div>
                  </Link>
                ))}
              </div>
              <div className="text-center mt-6">
                <Link to={createPageUrl("AllProviders")}>
                  <Button variant="outline" className="text-[#0A5C8C] border-[#0A5C8C]">
                    View All {dynamicStats.uniqueProviders} Providers
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Local Energy Insights
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{city.population}</div>
                    <div className="text-sm text-gray-600">Residents</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {cityName} is one of Texas's major energy markets with diverse electricity needs
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">1,000 kWh</div>
                    <div className="text-sm text-gray-600">Avg. Monthly Usage</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Typical household consumption in {city.county} varies by season
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">Deregulated</div>
                    <div className="text-sm text-gray-600">Market Status</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  {cityName} residents can choose from multiple competitive providers
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
              <div className="hidden lg:block bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Provider</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Plan</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">¢/kWh</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Est. Monthly Bill</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Term</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Rating</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {cityPlans.map((plan) => {
                        const monthlyBill = ((plan.rate_per_kwh / 100) * usage) + (plan.monthly_base_charge || 0);
                        return (
                          <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-semibold text-gray-900">{plan.provider_name}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{plan.plan_name}</div>
                              <div className="flex gap-2 mt-1">
                                {plan.plan_type === 'fixed' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    Fixed Rate
                                  </span>
                                )}
                                {plan.renewable_percentage >= 50 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    <Leaf className="w-3 h-3 mr-1" />
                                    Green
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xl font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-lg font-semibold text-gray-900">${monthlyBill.toFixed(0)}</div>
                              <div className="text-xs text-gray-500">@ {usage} kWh</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-gray-900 font-medium">{plan.contract_length || 'N/A'} months</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-semibold text-gray-900">4.5</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                                <Button size="sm" className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white whitespace-nowrap">
                                  Compare Rates
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
              <div className="lg:hidden space-y-4">
                {cityPlans.map((plan) => {
                  const monthlyBill = ((plan.rate_per_kwh / 100) * usage) + (plan.monthly_base_charge || 0);
                  return (
                    <Card key={plan.id} className="border-2 hover:border-[#FF6B35] transition-all">
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="font-bold text-gray-900 text-lg">{plan.provider_name}</div>
                            <div className="text-sm text-gray-600">{plan.plan_name}</div>
                          </div>
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold">4.5</span>
                          </div>
                        </div>

                        <div className="flex gap-2 mb-4">
                          {plan.plan_type === 'fixed' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Fixed Rate
                            </span>
                          )}
                          {plan.renewable_percentage >= 50 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              <Leaf className="w-3 h-3 mr-1" />
                              Green
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Rate</div>
                            <div className="text-lg font-bold text-[#0A5C8C]">{plan.rate_per_kwh}¢</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Est. Bill</div>
                            <div className="text-lg font-bold text-gray-900">${monthlyBill.toFixed(0)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Term</div>
                            <div className="text-sm font-semibold text-gray-900">{plan.contract_length || 'N/A'} mo</div>
                          </div>
                        </div>

                        <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                          <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white">
                            Compare Rates
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
    </div>
  );
}