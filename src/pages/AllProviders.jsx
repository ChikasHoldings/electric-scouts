import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, Zap, ArrowRight, CheckCircle, Leaf } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const providers = [
  {
    name: "TXU Energy",
    logo: "https://logo.clearbit.com/txu.com",
    rating: 4.5,
    reviews: 2340,
    description: "Texas' largest electricity provider with a wide range of plan options and competitive rates.",
    features: ["24/7 Customer Support", "Mobile App", "Renewable Options"],
    minRate: "8.9¢/kWh"
  },
  {
    name: "Reliant Energy",
    logo: "https://logo.clearbit.com/reliant.com",
    rating: 4.3,
    reviews: 1890,
    description: "Trusted provider offering flexible plans and excellent customer service since 2000.",
    features: ["Rewards Program", "Same-Day Service", "Smart Home Integration"],
    minRate: "9.2¢/kWh"
  },
  {
    name: "Gexa Energy",
    logo: "https://logo.clearbit.com/gexaenergy.com",
    rating: 4.4,
    reviews: 1560,
    description: "100% renewable energy plans with transparent pricing and no hidden fees.",
    features: ["100% Green Energy", "No Deposit Plans", "Flexible Terms"],
    minRate: "8.7¢/kWh"
  },
  {
    name: "Direct Energy",
    logo: "https://logo.clearbit.com/directenergy.com",
    rating: 4.2,
    reviews: 1420,
    description: "Nationwide provider with competitive rates and various plan lengths to fit your needs.",
    features: ["Price Protection", "Online Account Management", "Energy Efficiency Tips"],
    minRate: "9.5¢/kWh"
  },
  {
    name: "Green Mountain Energy",
    logo: "https://logo.clearbit.com/greenmountainenergy.com",
    rating: 4.6,
    reviews: 1780,
    description: "Leading renewable energy provider committed to sustainability and clean power.",
    features: ["100% Renewable", "Carbon Offset Programs", "Community Support"],
    minRate: "9.8¢/kWh"
  },
  {
    name: "4Change Energy",
    logo: "https://logo.clearbit.com/4changeenergy.com",
    rating: 4.3,
    reviews: 980,
    description: "Affordable electricity plans with straightforward pricing and no surprises.",
    features: ["Simple Plans", "Auto Pay Discount", "Paperless Billing"],
    minRate: "8.5¢/kWh"
  },
  {
    name: "Frontier Utilities",
    logo: "https://logo.clearbit.com/frontierutilities.com",
    rating: 4.1,
    reviews: 850,
    description: "Customer-focused provider with competitive rates for residential and business.",
    features: ["Low Rates", "Flexible Contracts", "Quick Activation"],
    minRate: "8.8¢/kWh"
  },
  {
    name: "Rhythm Energy",
    logo: "https://logo.clearbit.com/gotrhythm.com",
    rating: 4.5,
    reviews: 1240,
    description: "Modern energy provider with innovative plans and smart home technology support.",
    features: ["Smart Thermostat Programs", "Usage Tracking", "Green Energy Options"],
    minRate: "9.1¢/kWh"
  },
  {
    name: "Veteran Energy",
    logo: "https://logo.clearbit.com/veteranenergy.com",
    rating: 4.4,
    reviews: 670,
    description: "Veteran-owned company offering special rates and benefits for military families.",
    features: ["Military Discounts", "Patriotic Support", "Transparent Pricing"],
    minRate: "9.3¢/kWh"
  },
  {
    name: "Express Energy",
    logo: "https://logo.clearbit.com/expressenergy.com",
    rating: 4.2,
    reviews: 920,
    description: "Fast setup and competitive plans designed for today's busy lifestyle.",
    features: ["Quick Enrollment", "No Credit Check Options", "Prepaid Plans"],
    minRate: "9.6¢/kWh"
  },
  {
    name: "Payless Power",
    logo: "https://logo.clearbit.com/paylesspower.com",
    rating: 4.0,
    reviews: 1120,
    description: "Prepaid electricity with no deposit required and flexible payment options.",
    features: ["No Deposit", "Prepaid Options", "Daily Usage Alerts"],
    minRate: "10.2¢/kWh"
  },
  {
    name: "CleanSky Energy",
    logo: "https://logo.clearbit.com/cleanskyenergy.com",
    rating: 4.3,
    reviews: 780,
    description: "Committed to clean energy with competitive rates and eco-friendly initiatives.",
    features: ["Solar Programs", "Green Technology", "Community Projects"],
    minRate: "9.4¢/kWh"
  }
];

export default function AllProviders() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-4">
              Compare Texas Electricity Providers
            </h1>
            <p className="text-lg text-blue-100 mb-8">
              Explore plans from 40+ trusted electricity providers. Find the best rates and switch in minutes.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search providers..."
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
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">40+</div>
              <div className="text-sm text-gray-600">Providers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">15,000+</div>
              <div className="text-sm text-gray-600">Plans Available</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">$800</div>
              <div className="text-sm text-gray-600">Avg. Annual Savings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">100%</div>
              <div className="text-sm text-gray-600">Free Service</div>
            </div>
          </div>
        </div>
      </div>

      {/* Providers Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Featured Providers
          </h2>
          <p className="text-gray-600">
            {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} found
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map((provider, index) => (
            <Card key={index} className="hover:shadow-xl transition-all duration-300 border-2 hover:border-[#FF6B35] group">
              <CardContent className="p-6">
                {/* Provider Logo */}
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                    <img 
                      src={provider.logo} 
                      alt={`${provider.name} logo`}
                      className="h-8 w-auto object-contain"
                      loading="lazy"
                    />
                  </div>
                  {provider.features.some(f => f.includes("Green") || f.includes("Renewable")) && (
                    <div className="bg-green-100 p-2 rounded-full">
                      <Leaf className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-gray-900">{provider.rating}</span>
                  </div>
                  <span className="text-sm text-gray-500">({provider.reviews} reviews)</span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {provider.description}
                </p>

                {/* Starting Rate */}
                <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-3 mb-4">
                  <div className="text-xs text-gray-600 mb-1">Starting at</div>
                  <div className="text-2xl font-bold text-[#0A5C8C]">
                    {provider.minRate}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-4">
                  {provider.features.slice(0, 3).map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link to={createPageUrl("ProviderDetails") + `?provider=${provider.name}`}>
                  <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a2b] text-white group-hover:shadow-lg transition-all">
                    View Plans
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Zap className="w-12 h-12 text-[#FF6B35] mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Find Your Perfect Plan?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Enter your ZIP code to see personalized rates from all these providers instantly.
          </p>
          <Link to={createPageUrl("CompareRates")}>
            <Button size="lg" className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 py-6 text-lg font-semibold">
              Compare Rates Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-blue-200 mt-4">
            100% free • No credit card required • Instant results
          </p>
        </div>
      </div>
    </div>
  );
}