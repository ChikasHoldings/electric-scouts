import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Star, Zap, ArrowRight, CheckCircle, Leaf, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead, { getBreadcrumbSchema } from "../components/SEOHead";

const providers = [
  {
    name: "TXU Energy",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/33e89f5a5_id7UEhjySO_1762886832466.png",
    rating: 4.5,
    reviews: 2340,
    description: "Texas' largest electricity provider with a wide range of plan options and competitive rates.",
    features: ["24/7 Customer Support", "Mobile App", "Renewable Options"],
    minRate: "8.9¢/kWh"
  },
  {
    name: "Gexa Energy",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/81171c099_idcT-olPyu_1762886748078.png",
    rating: 4.4,
    reviews: 1560,
    description: "100% renewable energy plans with transparent pricing and no hidden fees.",
    features: ["100% Green Energy", "No Deposit Plans", "Flexible Terms"],
    minRate: "8.7¢/kWh"
  },
  {
    name: "Frontier Utilities",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/e38feed2c_Screenshot45.png",
    rating: 4.1,
    reviews: 850,
    description: "Customer-focused provider with competitive rates for residential and business.",
    features: ["Low Rates", "Flexible Contracts", "Quick Activation"],
    minRate: "8.8¢/kWh"
  },
  {
    name: "Rhythm Energy",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/46a5a0738_id6k09mhoA_1762886791027.png",
    rating: 4.5,
    reviews: 1240,
    description: "Modern energy provider with innovative plans and smart home technology support.",
    features: ["Smart Thermostat Programs", "Usage Tracking", "Green Energy Options"],
    minRate: "9.1¢/kWh"
  },
  {
    name: "Express Energy",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/5f35b8e44_idy542OFcd_logos.png",
    rating: 4.2,
    reviews: 920,
    description: "Fast setup and competitive plans designed for today's busy lifestyle.",
    features: ["Quick Enrollment", "No Credit Check Options", "Prepaid Plans"],
    minRate: "9.6¢/kWh"
  },
  {
    name: "Discount Power",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/cbf862895_Screenshot46.png",
    rating: 4.3,
    reviews: 1150,
    description: "Simple and affordable electricity plans with no hidden fees or surprises.",
    features: ["Low Rates", "No Deposit Required", "Easy Signup"],
    minRate: "8.4¢/kWh"
  },
  {
    name: "Ambit Energy",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/eb7ecacc8_idT9p2RC1n_1762848661994.png",
    rating: 4.2,
    reviews: 980,
    description: "Reliable energy provider with competitive rates and excellent customer rewards.",
    features: ["Customer Rewards", "Fixed Rate Plans", "Online Management"],
    minRate: "9.3¢/kWh"
  },
  {
    name: "Constellation Energy",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/de83cbefc_idvO6_xjIY_logos.png",
    rating: 4.4,
    reviews: 1680,
    description: "National leader in clean energy with innovative plans for homes and businesses.",
    features: ["Renewable Options", "Smart Energy Tools", "Flexible Plans"],
    minRate: "9.2¢/kWh"
  },
  {
    name: "Chariot Energy",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/1f7bec713_idEK1dDtu1_logos.png",
    rating: 4.5,
    reviews: 1320,
    description: "100% renewable energy provider with transparent pricing and local solar options.",
    features: ["100% Solar", "Smart Technology", "Local Support"],
    minRate: "9.5¢/kWh"
  },
  {
    name: "Champion Energy",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/c489ac96d_idabZcuDLC_1762848446410.png",
    rating: 4.3,
    reviews: 1050,
    description: "Texas-based provider offering straightforward plans with reliable service.",
    features: ["Fixed & Variable Plans", "No Surprises", "Quick Setup"],
    minRate: "8.9¢/kWh"
  },
  {
    name: "BKV Energy",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/208618693_idecUVsTjb_logos.png",
    rating: 4.4,
    reviews: 890,
    description: "Innovative energy solutions with competitive rates and renewable options.",
    features: ["Green Energy", "Competitive Rates", "Modern Platform"],
    minRate: "9.0¢/kWh"
  },
  {
    name: "APG&E",
    logo: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69141a7199585b6c94026f23/ab225f2ac_idy5Qy7KTo_1762848313421.png",
    rating: 4.2,
    reviews: 760,
    description: "Affordable and sustainable energy plans with excellent customer service.",
    features: ["Low Rates", "Green Options", "24/7 Support"],
    minRate: "8.6¢/kWh"
  }
];

export default function AllProviders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [zipCode, setZipCode] = useState("");

  const filteredProviders = providers.filter(provider =>
    provider.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Electricity Providers", url: "/all-providers" }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Top Electricity Providers - Compare 40+ Companies | Power Scouts"
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
              Explore plans from 40+ trusted electricity providers across 12 states. Find the best rates and switch in minutes.
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
              <div className="text-2xl sm:text-3xl font-bold text-[#0A5C8C] mb-1">40+</div>
              <div className="text-xs sm:text-sm text-gray-600">Providers</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-[#0A5C8C] mb-1">15,000+</div>
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