import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Building, TrendingDown, Award, Shield, Users, CheckCircle, 
  ArrowRight, Calculator, Zap, Clock, DollarSign 
} from "lucide-react";
import BusinessTestimonials from "../components/business/BusinessTestimonials";
import BusinessComparison from "../components/business/BusinessComparison";
import SEOHead from "../components/SEOHead";

export default function BusinessHub() {
  const [zipCode, setZipCode] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Business Electricity Plans - Commercial Energy Solutions | Power Scouts"
        description="Compare commercial electricity rates for your business. Custom usage tiers, volume discounts, flexible contracts. Save up to 30% on business energy costs."
        keywords="business electricity, commercial electricity rates, business energy plans, commercial power, business electricity comparison"
        canonical="/business-hub"
      />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
                <Building className="w-4 h-4" />
                <span className="text-sm font-semibold">Business Solutions</span>
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-4">
                Power Your Business with Better Rates
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                Compare commercial electricity plans tailored for businesses. Save up to 30% with volume pricing and flexible contracts.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to={createPageUrl("BusinessCompareRates")}>
                  <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-12 px-8 text-base">
                    Compare Business Rates
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-12 px-8">
                  Request Custom Quote
                </Button>
              </div>
            </div>

            {/* Quick Calculator Widget */}
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Quick Savings Estimate
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Monthly Usage (kWh)
                    </Label>
                    <Input
                      type="number"
                      placeholder="e.g., 5000"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                      Business ZIP Code
                    </Label>
                    <Input
                      type="text"
                      maxLength={5}
                      placeholder="e.g., 75001"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                      className="h-11"
                    />
                  </div>
                  <Link to={createPageUrl("BusinessCompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                    <Button className="w-full bg-[#0A5C8C] hover:bg-[#084a6f] text-white h-11">
                      Get Instant Quote
                      <Calculator className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">30%</div>
              <div className="text-sm text-gray-600">Average Savings</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">5,000+</div>
              <div className="text-sm text-gray-600">Businesses Served</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">40+</div>
              <div className="text-sm text-gray-600">Provider Partners</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0A5C8C] mb-1">24/7</div>
              <div className="text-sm text-gray-600">Support Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Comparison Tool */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Business Electricity Comparison
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find the perfect plan for your business size and usage pattern
          </p>
        </div>
        <BusinessComparison />
      </div>

      {/* Business Benefits */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Why Businesses Choose Us
            </h2>
            <p className="text-lg text-gray-600">
              Tailored solutions for every business size
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-blue-100 hover:border-blue-300 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingDown className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Volume Discounts
                </h3>
                <p className="text-gray-600">
                  Higher usage businesses qualify for significant volume-based discounts from top providers.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-100 hover:border-green-300 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Price Protection
                </h3>
                <p className="text-gray-600">
                  Lock in rates with 12-36 month fixed contracts to protect against market volatility.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors">
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Dedicated Support
                </h3>
                <p className="text-gray-600">
                  Business account managers available to help manage your energy portfolio.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Business Testimonials */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Success Stories from Our Business Clients
          </h2>
          <p className="text-lg text-gray-600">
            See how businesses like yours are saving thousands annually
          </p>
        </div>
        <BusinessTestimonials />
      </div>

      {/* Business Sizes & Plans */}
      <div className="bg-gradient-to-br from-gray-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Plans for Every Business Size
            </h2>
            <p className="text-lg text-gray-600">
              From small offices to large facilities
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Small Business</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Up to 10,000 kWh/month</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Retail, offices, restaurants</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Save 15-20% on average</span>
                  </div>
                </div>
                <Link to={createPageUrl("BusinessCompareRates")}>
                  <Button variant="outline" className="w-full">
                    View Small Business Plans
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-blue-500">
              <CardContent className="p-6">
                <div className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full inline-block mb-3">
                  Most Popular
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Medium Business</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>10,000 - 50,000 kWh/month</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Warehouses, clinics, hotels</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Save 20-30% on average</span>
                  </div>
                </div>
                <Link to={createPageUrl("BusinessCompareRates")}>
                  <Button className="w-full bg-[#0A5C8C] hover:bg-[#084a6f]">
                    View Medium Business Plans
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Large Business</h3>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>50,000+ kWh/month</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Manufacturing, data centers</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Save 25-35% on average</span>
                  </div>
                </div>
                <Link to={createPageUrl("BusinessCompareRates")}>
                  <Button variant="outline" className="w-full">
                    View Large Business Plans
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Fast Switching</h4>
            <p className="text-sm text-gray-600">Switch providers in 2-3 business days</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">No Hidden Fees</h4>
            <p className="text-sm text-gray-600">Transparent pricing with no surprises</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Award className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Best Rates</h4>
            <p className="text-sm text-gray-600">Access to exclusive business rates</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Zap className="w-8 h-8 text-orange-600" />
            </div>
            <h4 className="font-bold text-gray-900 mb-2">Same-Day Support</h4>
            <p className="text-sm text-gray-600">Dedicated account managers</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <h2 className="text-3xl font-bold mb-3">
            Ready to Lower Your Business Energy Costs?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Get a custom quote in minutes. No obligation, completely free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("BusinessCompareRates")}>
              <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-14 px-10 text-lg">
                Compare Business Rates
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-14 px-10 text-lg">
              Speak to an Expert
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}