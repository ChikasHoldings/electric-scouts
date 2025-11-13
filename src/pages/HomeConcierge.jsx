import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, Zap, Wifi, Droplet, Phone, CheckCircle, 
  Clock, Shield, Users, Star, ChevronDown, PhoneCall, ArrowRight
} from "lucide-react";

export default function HomeConcierge() {
  const [openFaq, setOpenFaq] = useState(null);

  const services = [
    { 
      icon: Zap, 
      name: "Electricity", 
      color: "from-yellow-500 to-orange-500",
      description: "Compare and set up electricity from 40+ Texas providers"
    },
    { 
      icon: Wifi, 
      name: "Internet", 
      color: "from-blue-500 to-cyan-500",
      description: "Find the best internet speeds and plans for your home"
    },
    { 
      icon: Droplet, 
      name: "Water", 
      color: "from-cyan-500 to-teal-500",
      description: "Set up water service with your local utility company"
    },
    { 
      icon: Phone, 
      name: "Phone", 
      color: "from-purple-500 to-pink-500",
      description: "Get connected with phone service providers in your area"
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Save Time",
      description: "One call handles all your utilities. No need to contact multiple companies or wait on hold."
    },
    {
      icon: Shield,
      title: "Expert Guidance",
      description: "Our specialists know which providers offer the best service and rates in your area."
    },
    {
      icon: Users,
      title: "Personalized Service",
      description: "We understand your needs and recommend plans that fit your lifestyle and budget."
    },
    {
      icon: Star,
      title: "Seamless Coordination",
      description: "We schedule everything to ensure your utilities are ready when you move in."
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Call Us",
      description: "Contact our concierge team with your new address and move-in date"
    },
    {
      step: "2",
      title: "We Research",
      description: "We compare providers and plans to find the best options for you"
    },
    {
      step: "3",
      title: "You Choose",
      description: "We present your options and you select what works best"
    },
    {
      step: "4",
      title: "We Setup",
      description: "We handle all the setup and scheduling - you're done!"
    }
  ];

  const faqs = [
    {
      id: 1,
      question: "What utilities does the concierge service cover?",
      answer: "We help you set up electricity, internet, water, and phone service for your new home. Our team coordinates with all the necessary providers to ensure everything is ready when you move in. For electricity, we compare rates from 40+ Texas providers to find you the best deal."
    },
    {
      id: 2,
      question: "How much does the concierge service cost?",
      answer: "Our concierge service is completely free! We're compensated by the service providers, so you pay nothing extra for our assistance. In fact, we often help you save money by finding better rates than you'd find on your own."
    },
    {
      id: 3,
      question: "How far in advance should I contact you before moving?",
      answer: "We recommend contacting us 2-3 weeks before your move-in date. This gives us time to compare providers, get you the best rates, and schedule everything properly. However, we can also help with last-minute moves if needed."
    },
    {
      id: 4,
      question: "What if I'm only interested in setting up one utility?",
      answer: "That's perfectly fine! While we offer comprehensive service for all utilities, you're welcome to use our help for just one service. Many customers start with electricity since Texas has a deregulated market with many provider options."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Home className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl lg:text-4xl font-bold mb-3">
              Home Concierge Service
            </h1>
            <p className="text-lg text-blue-100">
              One call to set up all your home utilities. We handle the hassle, you enjoy your new home.
            </p>
          </div>
        </div>
      </div>

      {/* Quick CTA Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-lg font-semibold text-gray-900">Ready to simplify your move?</p>
              <p className="text-gray-600">Call now and we'll handle all your utility setup</p>
            </div>
            <a href="tel:855-475-8315">
              <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 py-6 text-lg font-bold whitespace-nowrap">
                <PhoneCall className="w-5 h-5 mr-2" />
                Call 855-475-8315
              </Button>
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Services Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              We Handle Everything
            </h2>
            <p className="text-xl text-gray-600">
              From electricity to internet, we coordinate all your essential home services
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => {
              const Icon = service.icon;
              return (
                <Card key={index} className="border-2 hover:border-[#0A5C8C] hover:shadow-xl transition-all">
                  <CardContent className="p-8 text-center">
                    <div className={`w-20 h-20 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                      <Icon className="w-10 h-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.name}</h3>
                    <p className="text-gray-600">{service.description}</p>
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
              Why Use Our Concierge Service?
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
                How It Works
              </h2>
              
              <div className="grid md:grid-cols-4 gap-8">
                {howItWorks.map((item, index) => (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-[#0A5C8C] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600">{item.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Testimonial Section */}
        <section className="mb-20">
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-white border-2">
              <CardContent className="p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4">
                  "Moving to Texas was stressful enough. Having Power Scouts handle all my utility setup was a lifesaver. They got me great electricity rates and had everything ready when I moved in!"
                </p>
                <p className="font-semibold text-gray-900">- Sarah M., Houston</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-2">
              <CardContent className="p-8">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 italic mb-4">
                  "I didn't know where to start with setting up utilities in a new state. The concierge service walked me through everything and saved me hours of research and phone calls."
                </p>
                <p className="font-semibold text-gray-900">- Mike T., Dallas</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Frequently Asked Questions
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

        {/* Final CTA Section */}
        <section>
          <Card className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white border-0">
            <CardContent className="p-12 text-center">
              <Home className="w-16 h-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">
                Moving to Texas? Let Us Help!
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Focus on settling into your new home while we handle all the utility details
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="tel:855-475-8315">
                  <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 py-6 text-lg font-bold">
                    <PhoneCall className="w-5 h-5 mr-2" />
                    Call 855-475-8315
                  </Button>
                </a>
                <Link to={createPageUrl("CompareRates")}>
                  <Button variant="outline" className="bg-white hover:bg-gray-100 text-[#0A5C8C] border-2 border-white px-8 py-6 text-lg font-bold">
                    Compare Electricity Rates
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
                  <span>No Hidden Fees</span>
                </div>
                <span className="text-blue-300">•</span>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Expert Assistance</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}