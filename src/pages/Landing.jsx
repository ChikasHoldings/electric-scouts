import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  MapPin, CheckCircle, Zap, TrendingDown, Shield, 
  Clock, Star, Users, ArrowRight, Sparkles
} from "lucide-react";
import { 
  OrganizationSchema, 
  WebSiteSchema, 
  BreadcrumbSchema, 
  FAQPageSchema,
  HowToSchema 
} from "../components/seo/StructuredData";

export default function Landing() {
  const [zipCode, setZipCode] = useState("");

  const benefits = [
    { icon: DollarSign, text: "Save up to $800/year", color: "green" },
    { icon: Clock, text: "Compare in under 2 minutes", color: "blue" },
    { icon: Shield, text: "100% free, no obligation", color: "purple" },
    { icon: Zap, text: "Switch in 5 minutes online", color: "yellow" }
  ];

  const stats = [
    { number: "40+", label: "Providers" },
    { number: "10K+", label: "Happy Customers" },
    { number: "4.8★", label: "Rating" },
    { number: "$800", label: "Avg. Savings" }
  ];

  // Structured Data Schemas
  const howToSteps = [
    { name: "Enter Your ZIP", description: "Tell us where you live to see available plans in your area" },
    { name: "Compare Plans", description: "View rates from 40+ providers sorted by lowest price" },
    { name: "Start Saving", description: "Choose your plan and switch online in just 5 minutes" }
  ];

  const faqs = [
    {
      question: "How much can I save by switching electricity providers?",
      answer: "The average customer saves $67 per month, or up to $800 per year by comparing rates and switching to a better plan."
    },
    {
      question: "Is it really free to compare electricity rates?",
      answer: "Yes, our service is 100% free with no credit card required and no hidden fees. We show you all available options."
    },
    {
      question: "How long does it take to switch electricity providers?",
      answer: "The comparison takes under 2 minutes, and switching can be completed online in just 5 minutes. Your power stays on the entire time."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Structured Data for SEO */}
      <OrganizationSchema />
      <WebSiteSchema />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }]} />
      <HowToSchema 
        title="How to Compare Electricity Rates and Save Money"
        description="Learn how to compare electricity rates in 3 simple steps"
        steps={howToSteps}
      />
      <FAQPageSchema faqs={faqs} />

      {/* Hero Section - Above the Fold */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto text-center">
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full mb-4">
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span className="text-xs font-semibold">Trusted by 10,000+ Customers</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              Compare Electricity Rates & Save Up to $800/Year
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-blue-100 mb-6">
              Find the lowest electricity rates from 40+ trusted providers in under 2 minutes. Free, fast, and no obligations.
            </p>

            {/* Main CTA Form */}
            <div className="bg-white rounded-2xl shadow-2xl p-3 max-w-2xl mx-auto mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-[#0A5C8C]" />
                  <Input
                    type="text"
                    placeholder="Enter your ZIP code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                    className="pl-14 h-14 text-lg font-semibold border-2 border-gray-200 focus:border-[#0A5C8C]"
                    maxLength={5}
                  />
                </div>
                <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                  <Button 
                    disabled={zipCode.length !== 5}
                    className="h-14 px-10 text-base font-bold bg-[#FF6B35] hover:bg-[#e55a2b] text-white rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    Compare Rates
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>

            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>100% Free Service</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span>Takes 60 Seconds</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-y border-gray-200 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="text-3xl font-bold text-[#0A5C8C] mb-1">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Why Choose Power Scouts
            </h2>
            <p className="text-base text-gray-600">
              The fastest, easiest way to compare electricity rates and save money
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: TrendingDown,
                title: "Save Up to $800 Per Year",
                description: "Most Texans overpay for electricity. We help you find the lowest rates available in your area.",
                color: "green"
              },
              {
                icon: Clock,
                title: "Compare in Under 2 Minutes",
                description: "Enter your ZIP code once and instantly see rates from 40+ providers side-by-side.",
                color: "blue"
              },
              {
                icon: Shield,
                title: "100% Free & Unbiased",
                description: "Our service is completely free with no hidden fees. We show you all available options.",
                color: "purple"
              },
              {
                icon: Zap,
                title: "Switch in 5 Minutes",
                description: "Once you find a plan, switching is fast and easy. Your power stays on the entire time.",
                color: "orange"
              }
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="border-2 hover:border-[#FF6B35] hover:shadow-xl transition-all">
                  <CardContent className="p-8 flex gap-6">
                    <div className={`w-16 h-16 bg-${benefit.color}-100 rounded-2xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-8 h-8 text-${benefit.color}-600`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              How It Works
            </h2>
            <p className="text-base text-gray-600">
              Three simple steps to lower your electricity bill
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connection Lines */}
            <div className="hidden md:block absolute top-20 left-1/3 right-1/3 h-1 bg-gradient-to-r from-[#0A5C8C] to-[#FF6B35]" style={{ top: '80px' }}></div>

            {[
              {
                step: "1",
                title: "Enter Your ZIP",
                description: "Tell us where you live to see available plans in your area"
              },
              {
                step: "2",
                title: "Compare Plans",
                description: "View rates from 40+ providers sorted by lowest price"
              },
              {
                step: "3",
                title: "Start Saving",
                description: "Choose your plan and switch online in just 5 minutes"
              }
            ].map((item, index) => (
              <div key={index} className="text-center relative">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0A5C8C] to-[#084a6f] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4 shadow-lg relative z-10">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof - Testimonials */}
      <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Real Savings from Real Customers
            </h2>
            <div className="flex items-center justify-center gap-2 text-base text-gray-600">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="font-semibold">4.8/5</span>
              <span className="text-sm">from 1,200+ reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                name: "Jessica M.",
                location: "Houston, TX",
                text: "I was paying $180/month for electricity. After using Power Scouts, I'm now paying $115. That's $780 saved per year!",
                savings: "$780/year"
              },
              {
                name: "David R.",
                location: "Dallas, TX",
                text: "The comparison tool is so easy to use. Found a better plan in less than 5 minutes and switched the same day. Highly recommend!",
                savings: "$650/year"
              },
              {
                name: "Maria S.",
                location: "Austin, TX",
                text: "I had no idea I could get 100% renewable energy for less than what I was paying. Love that I'm saving money AND helping the environment!",
                savings: "$720/year"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="border-2 hover:shadow-xl transition-all">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 mb-4 italic leading-relaxed">"{testimonial.text}"</p>
                  <div className="flex items-center justify-between border-t pt-4">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{testimonial.name}</p>
                      <p className="text-xs text-gray-600">{testimonial.location}</p>
                    </div>
                    <div className="bg-green-100 px-2.5 py-1 rounded-full">
                      <span className="text-green-700 font-bold text-xs">Saved {testimonial.savings}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Urgency Section */}
      <section className="py-16 bg-gradient-to-r from-orange-50 to-red-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border-4 border-[#FF6B35]">
            <div className="inline-flex items-center gap-2 bg-[#FF6B35] text-white px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold">LIMITED TIME OFFER</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Start Saving Money Today
            </h2>
            <p className="text-base text-gray-600 mb-4">
              The average customer saves <span className="font-bold text-[#FF6B35]">$67 per month</span> by comparing rates. Don't leave money on the table.
            </p>
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-5 mb-4">
              <div className="text-4xl font-bold text-[#0A5C8C] mb-1">$2.23</div>
              <div className="text-sm text-gray-700">You could be saving every day</div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Compare rates now - it's 100% free and takes less than 2 minutes.
            </p>

            {/* CTA Form */}
            <div className="bg-white rounded-xl shadow-lg p-3 max-w-xl mx-auto border-2 border-[#FF6B35]">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0A5C8C]" />
                  <Input
                    type="text"
                    placeholder="Enter ZIP code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                    className="pl-12 h-14 text-lg font-semibold border-0"
                    maxLength={5}
                  />
                </div>
                <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                  <Button 
                    disabled={zipCode.length !== 5}
                    className="h-14 px-8 text-lg font-bold bg-[#FF6B35] hover:bg-[#e55a2b] text-white rounded-lg shadow-lg disabled:opacity-50"
                  >
                    Compare Now
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA - Sticky Bottom on Mobile */}
      <section className="py-12 bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-3">
                Ready to Lower Your Electricity Bill?
              </h2>
              <div className="space-y-2">
                {[
                  "Compare 40+ providers instantly",
                  "See lowest rates in your area",
                  "100% free, no obligations",
                  "Switch in 5 minutes online"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-base">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="bg-white rounded-xl shadow-2xl p-6">
                <p className="text-gray-900 font-semibold text-base mb-4 text-center">
                  Enter Your ZIP Code to Get Started
                </p>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#0A5C8C]" />
                    <Input
                      type="text"
                      placeholder="ZIP code"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                      className="pl-12 h-14 text-lg font-semibold border-2 border-gray-200"
                      maxLength={5}
                    />
                  </div>
                  <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                    <Button 
                      disabled={zipCode.length !== 5}
                      className="h-14 text-base font-bold bg-[#FF6B35] hover:bg-[#e55a2b] text-white w-full disabled:opacity-50"
                    >
                      Compare Rates Free
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
                <p className="text-gray-600 text-sm text-center mt-4">
                  ✓ Free • ✓ No credit card • ✓ Takes 60 seconds
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Footer */}
      <section className="py-8 bg-gray-50 border-t">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0A5C8C]" />
              <span>10,000+ Happy Customers</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#0A5C8C]" />
              <span>100% Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span>4.8/5 Rating (1,200+ Reviews)</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Helper component for missing import
function DollarSign(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}