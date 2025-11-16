import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Building2, TrendingDown, Shield, Clock, MapPin, CheckCircle, 
  Users, Zap, DollarSign, Award, Mail, ArrowRight, ChevronDown
} from "lucide-react";
import SEOHead, { getBreadcrumbSchema, getServiceSchema, getFAQSchema } from "../components/SEOHead";

export default function BusinessRates() {
  const [zipCode, setZipCode] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const breadcrumbData = getBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Business Rates", url: "/business-rates" }
  ]);

  const faqSchema = getFAQSchema(faqs);

  const businessTypes = [
    {
      title: "Small Business",
      usage: "< 10,000 kWh/month",
      icon: Building2,
      color: "blue",
      examples: ["Retail Shops", "Small Offices", "Restaurants", "Salons", "Cafes"],
      features: ["Flexible month-to-month or fixed contracts", "Competitive rates tailored to small business needs", "Quick online enrollment and management"]
    },
    {
      title: "Medium Business",
      usage: "10,000 - 50,000 kWh/month",
      icon: Users,
      color: "green",
      examples: ["Warehouses", "Medical Offices", "Schools", "Gyms", "Hotels"],
      features: ["Volume discounts and custom pricing options", "Dedicated account manager for your business", "Demand response programs to reduce peak costs"]
    },
    {
      title: "Large Enterprise",
      usage: "> 50,000 kWh/month",
      icon: Award,
      color: "purple",
      examples: ["Manufacturing Facilities", "Data Centers", "Multi-Location Chains", "Hospitals"],
      features: ["Fully customized energy procurement strategies", "Advanced risk management and hedging options", "Real-time energy analytics and reporting tools"]
    }
  ];

  const benefits = [
    {
      icon: DollarSign,
      title: "Lower Rates",
      description: "Access competitive commercial pricing and volume discounts not available to residential customers. Save 15-30% on your energy costs with the right plan."
    },
    {
      icon: Shield,
      title: "Rate Protection",
      description: "Lock in fixed rates for 12, 24, or 36 months to budget accurately and protect your business against market volatility and unexpected price spikes."
    },
    {
      icon: Clock,
      title: "Fast Activation",
      description: "Get your business powered quickly with our streamlined commercial enrollment process. Most setups complete within 3-5 business days."
    },
    {
      icon: Users,
      title: "Expert Support",
      description: "Work with experienced energy specialists who understand commercial electricity needs and can optimize your energy procurement strategy."
    }
  ];

  const faqs = [
    {
      id: 1,
      question: "How are commercial electricity rates different from residential?",
      answer: "Commercial electricity rates are structured to accommodate business usage patterns and typically offer lower per-kWh pricing due to higher volume consumption. Businesses have access to specialized pricing structures including demand charges, time-of-use rates, and volume discounts not available to residential customers. Commercial plans also include features like load profiling, dedicated account management, and flexible contract terms designed for business operations."
    },
    {
      id: 2,
      question: "What information do I need to get a business electricity quote?",
      answer: "To receive an accurate commercial electricity quote, you'll need: your business ZIP code, estimated monthly usage (in kWh - found on your current bill), business type/industry, desired contract length, and your business name. Having your current electricity bill available helps us benchmark rates and identify savings opportunities. For larger businesses, we may also ask about peak demand periods and operating hours to optimize your plan."
    },
    {
      id: 3,
      question: "Can you help with electricity for multiple business locations?",
      answer: "Yes! We specialize in managing electricity for businesses with multiple locations across any of our 12 service states. Many providers offer multi-site account management, consolidated billing, portfolio-level volume discounts, and unified reporting. Our commercial team can create a coordinated energy procurement strategy across all your locations to maximize savings and simplify administration."
    },
    {
      id: 4,
      question: "Are there renewable energy options for businesses?",
      answer: "Absolutely! Many businesses are choosing 100% renewable energy plans to reduce their carbon footprint, meet corporate sustainability goals, and enhance their brand reputation. Green energy plans are competitively priced and can sometimes match or beat traditional electricity rates. We offer renewable options from multiple providers to fit any business size and budget."
    },
    {
      id: 5,
      question: "How do I get started with commercial electricity service?",
      answer: "Simply enter your business ZIP code above to browse available commercial rates, or email us at support@powerscouts.com with your business details including location, estimated monthly usage, and current electricity bill. Our team will research available commercial providers in your area and send you a customized comparison of the best rates and plans. The entire process is free with no obligations."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <SEOHead
        title="Commercial Electricity Rates 2026 - Business Energy Plans Comparison | Power Scouts"
        description="Compare business electricity rates from 40+ providers across 12 states. Save 15-30% on commercial power bills. Fixed & variable business energy plans. Volume discounts for warehouses, retail, offices, manufacturing. Multi-location billing. Dedicated account managers. Free quote."
        keywords="business electricity rates, commercial electricity, commercial power rates, business energy plans, small business electricity, multi-location electricity, warehouse electricity rates, retail electricity rates"
        canonical="/business-rates"
        structuredData={[breadcrumbData, faqSchema]}
      />
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Building2 className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Commercial Electricity Rates for Your Business
            </h1>
            <p className="text-xl text-blue-100 mb-2">
              Compare business electricity plans from 40+ providers nationwide. Save 15-30% on your energy costs.
            </p>
            <p className="text-base text-blue-200">
              Serving businesses in TX, IL, OH, PA, NY, NJ, MD, MA, ME, NH, RI, CT
            </p>
          </div>
        </div>
      </div>

      {/* Quick Quote Section */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Get a Free Commercial Electricity Quote</h2>
              <p className="text-gray-600">Enter your ZIP code or email us for personalized business rates</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-1.5 max-w-2xl mx-auto mb-4">
              <div className="flex flex-col sm:flex-row items-stretch gap-2">
                <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-gray-50 rounded-xl">
                  <MapPin className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder="Enter business ZIP code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, ''))}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg p-0 h-auto font-semibold"
                    maxLength={5}
                  />
                </div>
                <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                  <Button className="w-full sm:w-auto px-10 py-6 text-lg font-bold rounded-xl bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full">
                    Compare Rates
                  </Button>
                </Link>
              </div>
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-gray-600 mb-3">Need personalized assistance?</p>
              <a href="mailto:support@powerscouts.com?subject=Commercial Electricity Quote Request" className="inline-block">
                <Button className="bg-[#0A5C8C] hover:bg-[#084a6f] text-white px-6 py-3">
                  <Mail className="w-4 h-4 mr-2" />
                  Email Us: support@powerscouts.com
                </Button>
              </a>
            </div>

            <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Free Comparison</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>No Obligation</span>
              </div>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>Expert Guidance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Business Types Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Electricity Solutions for Every Business Size
            </h2>
            <p className="text-xl text-gray-600">
              From small startups to large enterprises, we have the right plan for you
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {businessTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <Card key={index} className="border-2 hover:border-[#0A5C8C] hover:shadow-xl transition-all">
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 bg-${type.color}-100 rounded-xl flex items-center justify-center mb-6`}>
                      <Icon className={`w-8 h-8 text-${type.color}-600`} />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{type.title}</h3>
                    <div className="text-[#0A5C8C] font-semibold mb-4">{type.usage}</div>
                    
                    <div className="mb-6">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Perfect for:</p>
                      <ul className="space-y-1">
                        {type.examples.map((example, i) => (
                          <li key={i} className="text-sm text-gray-600">• {example}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t pt-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Features:</p>
                      <ul className="space-y-2">
                        {type.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Power Scouts for Your Business?
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="border-2 hover:shadow-lg transition-all">
                  <CardContent className="p-8 flex gap-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-teal-50 to-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Icon className="w-7 h-7 text-[#0A5C8C]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* How It Works Section */}
        <section className="mb-20">
          <Card className="bg-gradient-to-br from-blue-50 to-green-50 border-0">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
                Simple Process to Switch Your Business Electricity
              </h2>
              
              <div className="grid md:grid-cols-4 gap-8">
                {[
                  { step: "1", title: "Get Quote", desc: "Enter your business info and usage" },
                  { step: "2", title: "Compare Plans", desc: "Review commercial rates from 40+ providers" },
                  { step: "3", title: "Choose Plan", desc: "Select the best plan for your business" },
                  { step: "4", title: "Start Saving", desc: "Service activated in 1-3 business days" }
                ].map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-[#0A5C8C] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* FAQ Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Business Electricity FAQs
          </h2>
          <div className="space-y-4 max-w-4xl mx-auto">
            {faqs.map((faq) => (
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

        {/* CTA Section */}
        <section>
          <Card className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white border-0">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">
                Ready to Lower Your Business Energy Costs?
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Let our commercial energy specialists find you the best rates and plans for your business
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="mailto:support@powerscouts.com?subject=Commercial Electricity Quote Request" className="inline-block">
                  <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-10 py-6 text-lg font-bold">
                    <Mail className="w-5 h-5 mr-2" />
                    Email: support@powerscouts.com
                  </Button>
                </a>
                <Link to={createPageUrl("CompareRates") + (zipCode ? `?zip=${zipCode}` : '')}>
                  <Button variant="outline" className="bg-white hover:bg-gray-100 text-[#0A5C8C] border-2 border-white px-10 py-6 text-lg font-bold">
                    Compare Rates Online
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>

              <div className="flex items-center justify-center gap-6 flex-wrap text-sm mt-8">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>100% Free Service</span>
                </div>
                <span className="text-blue-300">•</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>No Obligations</span>
                </div>
                <span className="text-blue-300">•</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Expert Guidance</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}