import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, Star, CheckCircle, ArrowRight, Leaf, Phone,
  Award, Shield, DollarSign, Zap, Users, Clock, ChevronDown
} from "lucide-react";

// Provider-specific data for SEO
const providerData = {
  "TXU Energy": {
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/33e89f5a5_id7UEhjySO_1762886832466.png",
    rating: 4.5,
    reviews: 2340,
    description: "TXU Energy is Texas' largest electricity provider with over 100 years of experience serving residential and business customers across the state.",
    fullDescription: "As the largest electricity provider in Texas, TXU Energy has been powering homes and businesses since 1882. With a commitment to innovation and customer service, TXU offers a wide range of electricity plans including fixed-rate, variable-rate, and renewable energy options. Their extensive experience in the Texas energy market makes them a trusted choice for millions of customers.",
    founded: "1882",
    headquarters: "Dallas, TX",
    planCount: 25,
    customerCount: "1.7 million+",
    features: [
      "24/7 Customer Support",
      "Mobile App for Account Management",
      "Paperless Billing Options",
      "AutoPay Discounts Available",
      "Renewable Energy Plans",
      "Fixed & Variable Rate Options"
    ],
    cities: ["Houston", "Dallas", "Fort Worth", "Austin", "San Antonio", "Plano", "Arlington", "Irving", "Frisco", "McKinney", "Corpus Christi", "El Paso"],
    minRate: "8.8¢/kWh",
    website: "https://www.txu.com"
  },
  "Reliant Energy": {
    logo: "https://logo.clearbit.com/reliant.com",
    rating: 4.4,
    reviews: 1980,
    description: "Reliant Energy is one of Texas' leading retail electricity providers, serving over 1.5 million customers with innovative energy solutions.",
    fullDescription: "Reliant Energy has been a trusted name in Texas electricity for decades, offering competitive rates and innovative products. Known for their customer-centric approach and reliable service, Reliant provides a variety of plans to meet different energy needs, from straightforward fixed-rate plans to smart home solutions.",
    founded: "2000",
    headquarters: "Houston, TX",
    planCount: 30,
    customerCount: "1.5 million+",
    features: [
      "Award-Winning Customer Service",
      "Smart Thermostat Programs",
      "Renewable Energy Options",
      "Free Electricity Nights & Weekends Plans",
      "Online Account Management",
      "Mobile App with Usage Tracking"
    ],
    cities: ["Houston", "Dallas", "Fort Worth", "Austin", "San Antonio", "Plano", "Arlington", "Irving", "Frisco", "McKinney", "Corpus Christi"],
    minRate: "8.6¢/kWh",
    website: "https://www.reliant.com"
  },
  "Gexa Energy": {
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/81171c099_idcT-olPyu_1762886748078.png",
    rating: 4.4,
    reviews: 1560,
    description: "Gexa Energy specializes in 100% green electricity plans with transparent pricing and no hidden fees for Texas customers.",
    fullDescription: "Gexa Energy is committed to providing clean, renewable energy to Texas residents. As a leader in green energy solutions, all of Gexa's electricity is sourced from renewable sources including Texas wind and solar farms. Their transparent pricing model and commitment to sustainability make them a popular choice for environmentally conscious consumers.",
    founded: "2001",
    headquarters: "Houston, TX",
    planCount: 20,
    customerCount: "200,000+",
    features: [
      "100% Renewable Energy Plans",
      "No Deposit Plans Available",
      "Transparent Pricing",
      "Flexible Contract Terms",
      "Online Account Management",
      "Green Energy Certificates"
    ],
    cities: ["Houston", "Dallas", "Fort Worth", "Austin", "San Antonio", "Plano", "Arlington", "Corpus Christi"],
    minRate: "8.7¢/kWh",
    website: "https://www.gexaenergy.com"
  },
  "Green Mountain Energy": {
    logo: "https://logo.clearbit.com/greenmountainenergy.com",
    rating: 4.5,
    reviews: 1890,
    description: "Green Mountain Energy is the nation's longest-serving renewable energy retailer, providing 100% clean electricity to Texas homes and businesses.",
    fullDescription: "Since 1997, Green Mountain Energy has been a pioneer in renewable energy, offering 100% pollution-free electricity plans to Texas customers. As a certified B Corporation, they're committed to not just providing clean energy, but also supporting environmental initiatives and sustainability programs throughout Texas.",
    founded: "1997",
    headquarters: "Houston, TX",
    planCount: 18,
    customerCount: "250,000+",
    features: [
      "100% Pollution-Free Electricity",
      "Carbon Offset Programs",
      "Solar Buyback Plans",
      "Fixed Rate Plans",
      "Community Solar Options",
      "Environmental Education Programs"
    ],
    cities: ["Houston", "Dallas", "Fort Worth", "Austin", "San Antonio", "Plano", "Arlington", "Irving", "Frisco"],
    minRate: "9.6¢/kWh",
    website: "https://www.greenmountainenergy.com"
  },
  "Direct Energy": {
    logo: "https://logo.clearbit.com/directenergy.com",
    rating: 4.3,
    reviews: 1720,
    description: "Direct Energy offers competitive electricity rates and innovative energy solutions to residential and business customers across Texas.",
    fullDescription: "Direct Energy is a leading North American energy and services provider, serving Texas customers with a wide range of electricity plans. Known for their competitive pricing and excellent customer service, Direct Energy offers everything from simple fixed-rate plans to advanced smart home energy solutions.",
    founded: "1986",
    headquarters: "Houston, TX",
    planCount: 22,
    customerCount: "1 million+",
    features: [
      "Smart Home Integration",
      "Fixed & Variable Rate Plans",
      "Business Solutions",
      "24/7 Customer Support",
      "Online Account Tools",
      "Energy Efficiency Tips"
    ],
    cities: ["Houston", "Dallas", "Fort Worth", "Austin", "San Antonio", "Plano", "Arlington", "Irving", "Frisco", "McKinney"],
    minRate: "9.4¢/kWh",
    website: "https://www.directenergy.com"
  },
  "Discount Power": {
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/cbf862895_Screenshot46.png",
    rating: 4.3,
    reviews: 1150,
    description: "Discount Power provides simple, affordable electricity plans with no hidden fees and straightforward pricing for Texas residents.",
    fullDescription: "Discount Power is dedicated to offering straightforward, affordable electricity plans to Texas customers. With a focus on simplicity and value, they provide competitive rates without complicated terms or hidden fees. Their no-nonsense approach to electricity service has made them a popular choice for cost-conscious consumers.",
    founded: "2005",
    headquarters: "Garland, TX",
    planCount: 15,
    customerCount: "150,000+",
    features: [
      "Low Competitive Rates",
      "No Deposit Required",
      "Simple Plan Options",
      "Easy Online Signup",
      "Paperless Billing",
      "Responsive Customer Service"
    ],
    cities: ["Houston", "Dallas", "Fort Worth", "San Antonio", "Plano", "Arlington", "Irving", "Corpus Christi"],
    minRate: "8.4¢/kWh",
    website: "https://www.discountpower.com"
  },
  "Rhythm Energy": {
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/46a5a0738_id6k09mhoA_1762886791027.png",
    rating: 4.5,
    reviews: 1240,
    description: "Rhythm Energy offers modern, tech-forward electricity plans with smart home integration and 100% renewable energy options.",
    fullDescription: "Rhythm Energy is a next-generation electricity provider combining clean energy with smart technology. All of their plans are powered by 100% renewable energy from Texas wind and solar farms. Their innovative approach includes smart home integration, real-time usage tracking, and a user-friendly mobile app.",
    founded: "2014",
    headquarters: "Houston, TX",
    planCount: 12,
    customerCount: "100,000+",
    features: [
      "100% Renewable Energy",
      "Smart Thermostat Programs",
      "Real-Time Usage Tracking",
      "Modern Mobile App",
      "Free Smart Home Devices",
      "No Deposit Plans"
    ],
    cities: ["Houston", "Dallas", "Austin", "San Antonio", "Plano", "Frisco", "McKinney"],
    minRate: "9.1¢/kWh",
    website: "https://www.rhythmenergy.com"
  },
  "Frontier Utilities": {
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/e38feed2c_Screenshot45.png",
    rating: 4.1,
    reviews: 850,
    description: "Frontier Utilities provides customer-focused electricity service with competitive rates and flexible contract options for Texas homes and businesses.",
    fullDescription: "Frontier Utilities is committed to delivering reliable electricity service at competitive rates. With a focus on customer satisfaction and flexibility, they offer a range of plans to suit different needs and budgets. Their straightforward approach and responsive customer service have earned them a loyal customer base across Texas.",
    founded: "2006",
    headquarters: "Houston, TX",
    planCount: 16,
    customerCount: "120,000+",
    features: [
      "Competitive Fixed Rates",
      "Flexible Contract Terms",
      "Quick Activation",
      "No Hidden Fees",
      "Business Plans Available",
      "Online Account Management"
    ],
    cities: ["Houston", "Dallas", "Fort Worth", "San Antonio", "Plano", "Arlington", "Irving"],
    minRate: "8.8¢/kWh",
    website: "https://www.frontierutilities.com"
  }
};

export default function ProviderDetails() {
  const [zipCode, setZipCode] = useState("");
  const [usage] = useState(1000);
  const [providerName, setProviderName] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  // Get provider from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const provider = urlParams.get('provider') || 'TXU Energy';
    setProviderName(provider);
    
    // Set page title for SEO
    document.title = `${provider} Electricity Rates & Plans | Compare ${provider} Energy Plans in Texas`;
  }, []);

  const provider = providerData[providerName] || providerData["TXU Energy"];

  const { data: allPlans, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.ElectricityPlan.list(),
    initialData: [],
  });

  // Filter plans by provider
  const providerPlans = allPlans.filter(plan => plan.provider_name === providerName);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - SEO Optimized */}
      <div className="relative bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-gradient-to-br from-white to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-4xl">
            {/* Breadcrumb for SEO */}
            <nav className="mb-4 text-xs">
              <Link to={createPageUrl("Home")} className="text-blue-200 hover:text-white">Home</Link>
              <span className="mx-2 text-blue-300">/</span>
              <Link to={createPageUrl("AllProviders")} className="text-blue-200 hover:text-white">Providers</Link>
              <span className="mx-2 text-blue-300">/</span>
              <span className="text-white">{providerName}</span>
            </nav>

            <div className="grid lg:grid-cols-2 gap-6 items-center">
              <div>
                {/* Provider Logo */}
                <div className="bg-white rounded-xl px-6 py-3 inline-block mb-4 shadow-lg">
                  <img 
                    src={provider.logo} 
                    alt={`${providerName} logo`}
                    className="h-10 w-auto object-contain"
                  />
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold mb-3">
                  {providerName} Electricity Plans
                </h1>
                <p className="text-lg text-blue-100 mb-5">
                  {provider.description}
                </p>

                {/* Rating */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-xl font-bold">{provider.rating}</span>
                    <span className="text-blue-100 text-sm">({provider.reviews} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xl font-bold mb-1">{provider.minRate}</div>
                  <div className="text-xs text-blue-100">Starting Rate</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xl font-bold mb-1">{provider.planCount}+</div>
                  <div className="text-xs text-blue-100">Available Plans</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xl font-bold mb-1">{provider.customerCount}</div>
                  <div className="text-xs text-blue-100">Customers</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                  <div className="text-xl font-bold mb-1">{provider.cities.length}+</div>
                  <div className="text-xs text-blue-100">Texas Cities</div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-6 bg-white rounded-xl p-1.5 shadow-2xl max-w-2xl">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg">
                  <MapPin className="w-4 h-4 text-[#0A5C8C] flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="Enter your ZIP code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 text-base p-0 h-auto font-semibold"
                    maxLength={5}
                  />
                </div>
                <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                  <Button className="w-full sm:w-auto px-6 py-5 text-base font-bold rounded-lg bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full">
                    Compare Plans
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* About Provider Section - SEO Content */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            About {providerName}
          </h2>
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {provider.fullDescription}
              </p>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Founded</div>
                  <div className="text-xl font-bold text-gray-900">{provider.founded}</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-teal-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Headquarters</div>
                  <div className="text-xl font-bold text-gray-900">{provider.headquarters}</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">Customers</div>
                  <div className="text-xl font-bold text-gray-900">{provider.customerCount}</div>
                </div>
              </div>
            </div>

            <div>
              <Card className="border-2">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Key Features</h3>
                  <div className="space-y-3">
                    {provider.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Available Plans Table */}
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {providerName} Electricity Plans & Rates
              </h2>
              <p className="text-gray-600">
                Compare all available plans from {providerName}
              </p>
            </div>
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
          ) : providerPlans.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Plan Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">¢/kWh</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Est. Monthly Bill</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Contract Term</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {providerPlans.map((plan) => {
                        const monthlyBill = ((plan.rate_per_kwh / 100) * usage) + (plan.monthly_base_charge || 0);
                        return (
                          <tr key={plan.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="font-medium text-gray-900">{plan.plan_name}</div>
                              <div className="flex gap-2 mt-1">
                                {plan.renewable_percentage >= 50 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                    <Leaf className="w-3 h-3 mr-1" />
                                    {plan.renewable_percentage}% Green
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
                              <div className="text-gray-900 font-medium">{plan.contract_length || 'Variable'} months</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {plan.plan_type}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                                <Button size="sm" className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white whitespace-nowrap">
                                  Compare Plans
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
                {providerPlans.map((plan) => {
                  const monthlyBill = ((plan.rate_per_kwh / 100) * usage) + (plan.monthly_base_charge || 0);
                  return (
                    <Card key={plan.id} className="border-2 hover:border-[#FF6B35] transition-all">
                      <CardContent className="p-5">
                        <div className="mb-3">
                          <div className="font-bold text-gray-900 text-lg mb-1">{plan.plan_name}</div>
                          <div className="flex gap-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                              {plan.plan_type}
                            </span>
                            {plan.renewable_percentage >= 50 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                <Leaf className="w-3 h-3 mr-1" />
                                Green
                              </span>
                            )}
                          </div>
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
                            <div className="text-sm font-semibold text-gray-900">{plan.contract_length || 'Var'} mo</div>
                          </div>
                        </div>

                        <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                          <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white">
                            Compare Plans
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
              <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No plans available</h3>
              <p className="text-gray-600">Check back soon for new plans from {providerName}</p>
            </div>
          )}
        </section>

        {/* Service Areas Section - SEO Content */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            {providerName} Service Areas in Texas
          </h2>
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-8">
            <p className="text-gray-700 mb-6">
              {providerName} serves customers across {provider.cities.length}+ major cities and metropolitan areas in Texas. 
              Available in most deregulated electricity markets throughout the state.
            </p>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-3">
              {provider.cities.map((city, index) => (
                <Link 
                  key={index}
                  to={createPageUrl("CityRates") + `?city=${city}`}
                  className="flex items-center gap-2 text-gray-700 hover:text-[#0A5C8C] transition-colors bg-white rounded-lg px-4 py-3 hover:shadow-md"
                >
                  <MapPin className="w-4 h-4 text-[#0A5C8C] flex-shrink-0" />
                  <span className="font-medium">{city}</span>
                </Link>
              ))}
            </div>
            <p className="text-gray-600 mt-6 text-sm">
              Enter your ZIP code above to see if {providerName} serves your area and view available plans.
            </p>
          </div>
        </section>

        {/* Why Choose Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Why Choose {providerName}?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-2 hover:border-[#FF6B35] transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Trusted Provider</h3>
                <p className="text-gray-600">
                  Serving {provider.customerCount} satisfied customers with reliable electricity service
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-[#FF6B35] transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Competitive Rates</h3>
                <p className="text-gray-600">
                  Plans starting as low as {provider.minRate} with transparent pricing
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-[#FF6B35] transition-all">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Customer Support</h3>
                <p className="text-gray-600">
                  {provider.rating} star rating with award-winning customer service
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section - SEO Rich Content */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Frequently Asked Questions About {providerName}
          </h2>
          <div className="space-y-4">
            {[
              {
                id: 1,
                question: `What types of electricity plans does ${providerName} offer?`,
                answer: `${providerName} offers a variety of electricity plans including fixed-rate plans, variable-rate plans, and renewable energy options. With ${provider.planCount}+ plans available, you can find the perfect option for your home or business needs.`
              },
              {
                id: 2,
                question: `Where does ${providerName} provide electricity service?`,
                answer: `${providerName} serves customers across ${provider.cities.length}+ major Texas cities including ${provider.cities.slice(0, 3).join(", ")}, and more. They're available in most deregulated electricity markets throughout Texas.`
              },
              {
                id: 3,
                question: `How do I sign up for ${providerName} electricity?`,
                answer: `Signing up is easy! Compare ${providerName} plans using the comparison tool above, select your preferred plan, and complete the enrollment process online or by phone. Your new service can typically be activated within 1-3 business days.`
              },
              {
                id: 4,
                question: `Does ${providerName} offer renewable energy plans?`,
                answer: provider.features.some(f => f.toLowerCase().includes('renewable') || f.toLowerCase().includes('green')) 
                  ? `Yes! ${providerName} offers renewable energy plans powered by Texas wind and solar farms. These green energy options help reduce your carbon footprint while supporting clean energy development.`
                  : `${providerName} focuses on providing reliable electricity service. For renewable energy options, explore their plan details above or contact them directly.`
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
            Ready to Switch to {providerName}?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Compare {providerName} plans and start saving on your electricity bill today
          </p>
          
          <div className="bg-white rounded-2xl p-1.5 shadow-2xl max-w-2xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row items-stretch gap-2">
              <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-gray-50 rounded-xl">
                <MapPin className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
                <Input
                  type="text"
                  placeholder="Enter your ZIP code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-900 text-lg p-0 h-auto font-semibold"
                  maxLength={5}
                />
              </div>
              <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                <Button className="w-full sm:w-auto px-10 py-6 text-lg font-bold rounded-xl bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full">
                  View Plans
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
              <span>Quick Activation</span>
            </div>
          </div>
        </section>
      </div>

      {/* SEO Footer Content */}
      <div className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-sm max-w-none text-gray-600">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Compare {providerName} Electricity Plans in Texas
            </h2>
            <p>
              {providerName} has established itself as a leading electricity provider in Texas's deregulated energy market. 
              Founded in {provider.founded} and headquartered in {provider.headquarters}, they've built a reputation for 
              reliable service and competitive pricing. Whether you're looking for a fixed-rate plan for price stability, 
              a variable-rate plan for flexibility, or renewable energy options to reduce your environmental impact, 
              {providerName} offers solutions for every type of customer.
            </p>
            <p>
              With service available in {provider.cities.length}+ Texas cities and over {provider.customerCount} satisfied customers, 
              {providerName} combines local expertise with innovative energy solutions. Their {provider.planCount}+ available plans 
              ensure you can find the perfect match for your household or business needs. Use our free comparison tool to 
              explore {providerName} rates, read customer reviews, and sign up online in minutes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}