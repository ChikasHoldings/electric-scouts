import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, Zap, Wifi, Droplet, Phone, CheckCircle, 
  Clock, Shield, Users, Star, ChevronDown, Mail, ArrowRight
} from "lucide-react";
import SEOHead, { getOrganizationSchema } from "@/components/SEOHead";

export default function HomeConcierge() {
  const [openFaq, setOpenFaq] = useState(null);
  const [userEmail, setUserEmail] = useState("");

  const services = [
    { 
      icon: Zap, 
      name: "Electricity", 
      color: "from-yellow-500 to-orange-500",
      description: "Compare and set up electricity from 40+ providers in deregulated markets"
    },
    { 
      icon: Wifi, 
      name: "Internet", 
      color: "from-blue-500 to-cyan-500",
      description: "Find the best internet speeds and plans from cable, fiber, and wireless providers"
    },
    { 
      icon: Droplet, 
      name: "Water & Gas", 
      color: "from-cyan-500 to-teal-500",
      description: "Coordinate setup with your local water and natural gas utility companies"
    },
    { 
      icon: Phone, 
      name: "Phone & TV", 
      color: "from-purple-500 to-pink-500",
      description: "Get connected with phone and TV service providers in your area"
    }
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Save Hours of Time",
      description: "One simple request handles all your utility needs. No need to contact multiple companies, compare confusing plans, or wait on hold for hours."
    },
    {
      icon: Shield,
      title: "Expert Guidance",
      description: "Our utility specialists have deep knowledge of providers, rates, and service quality in your area. We recommend only the best options."
    },
    {
      icon: Users,
      title: "Personalized Recommendations",
      description: "We take time to understand your household size, usage habits, and budget to recommend plans perfectly suited to your lifestyle."
    },
    {
      icon: Star,
      title: "Seamless Coordination",
      description: "We handle all scheduling and coordination to ensure every utility is active and ready when you move into your new home."
    }
  ];

  const howItWorks = [
    {
      step: "1",
      title: "Contact Us",
      description: "Email us with your new address, move-in date, and any specific utility needs or preferences"
    },
    {
      step: "2",
      title: "We Research",
      description: "Our team compares all available providers and plans in your area to find the best rates and service options"
    },
    {
      step: "3",
      title: "You Decide",
      description: "We send you a personalized report with our top recommendations and you choose what works best for your home"
    },
    {
      step: "4",
      title: "We Handle Setup",
      description: "We complete all enrollment, coordinate activation dates, and ensure everything is ready when you arrive"
    }
  ];

  const faqs = [
    {
      id: 1,
      question: "What utilities does the concierge service cover?",
      answer: "We help you set up all essential home utilities including electricity, internet (cable/fiber/wireless), water, natural gas, phone, and TV service. Our team coordinates with all necessary providers to ensure everything is scheduled and ready when you move in. For electricity in deregulated markets, we compare rates from 40+ providers across multiple states to find you the best deal."
    },
    {
      id: 2,
      question: "How much does the concierge service cost?",
      answer: "Our Home Concierge service is completely free! We're compensated by service providers when you choose their plans, so you pay nothing extra for our assistance. In fact, we often help you save money by finding better rates and avoiding common pitfalls that cost new movers hundreds of dollars."
    },
    {
      id: 3,
      question: "How far in advance should I contact you before moving?",
      answer: "We recommend reaching out 2-3 weeks before your move-in date. This gives us adequate time to research providers, compare rates, negotiate on your behalf if applicable, and schedule all services properly. However, we understand moves can be sudden and we're happy to assist with last-minute requests when possible. The earlier you contact us, the more options we can explore for you."
    },
    {
      id: 4,
      question: "What if I only need help with one or two utilities?",
      answer: "That's absolutely fine! While we offer comprehensive service for all home utilities, you're welcome to use our assistance for just the services you need. Many customers use us specifically for electricity since deregulated markets have dozens of provider options that can be overwhelming to compare. Whatever level of help you need, we're here to assist at no cost to you."
    },
    {
      id: 5,
      question: "Which states and cities do you serve?",
      answer: "We serve all deregulated electricity markets including Texas, Illinois, Ohio, Pennsylvania, New York, New Jersey, Maryland, Massachusetts, Maine, New Hampshire, Rhode Island, and Connecticut. For other utilities like internet, water, and phone, we can assist with setup nationwide. Simply email us your moving address and we'll let you know exactly how we can help in your area."
    }
  ];

  return (
    <>
    <SEOHead
      title="Home Concierge | Set Up All Utilities in One Place | ElectricScouts"
      description="Let ElectricScouts handle your electricity, internet, water, and phone setup. One-stop home concierge service for new movers and homeowners."
      canonical="/home-concierge"
      keywords="home concierge, utility setup, new home utilities, electricity setup service"
      structuredData={getOrganizationSchema()}
    />
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[#0A5C8C] to-[#084a6f] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Home className="w-16 h-16 mx-auto mb-4 opacity-90" />
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Home Concierge Service
            </h1>
            <p className="text-xl text-blue-100 mb-2">
              Moving? We'll handle all your utility setup so you can focus on settling in.
            </p>
            <p className="text-base text-blue-200">
              Electricity • Internet • Water • Gas • Phone • TV - All Coordinated for You
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
              <p className="text-gray-600">Email us with your move details and we'll handle everything</p>
            </div>
            <a href="mailto:support@electricscouts.com?subject=Home Concierge Service Request" className="inline-block">
              <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-8 py-6 text-lg font-bold whitespace-nowrap">
                <Mail className="w-5 h-5 mr-2" />
                Email: support@electricscouts.com
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
                  "Moving to Texas was stressful enough. Having ElectricScouts handle all my utility setup was a lifesaver. They got me great electricity rates and had everything ready when I moved in!"
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
                Moving Soon? Let Us Simplify Your Utility Setup!
              </h2>
              <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Focus on settling into your new home while we handle all the utility coordination and setup
              </p>
              
              <div className="bg-white rounded-xl shadow-lg p-2 max-w-2xl mx-auto mb-6">
                <div className="flex flex-col sm:flex-row items-stretch gap-2">
                  <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-gray-50 rounded-lg">
                    <Mail className="w-5 h-5 text-[#0A5C8C] flex-shrink-0" />
                    <Input
                      type="email"
                      placeholder="Enter your email address"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="border-0 bg-transparent focus-visible:ring-0 text-gray-900 text-lg p-0 h-auto font-semibold"
                    />
                  </div>
                  <a href={`mailto:support@electricscouts.com?subject=Home Concierge Request&body=My email: ${userEmail}%0D%0A%0D%0ANew Address:%0D%0AMove-in Date:%0D%0AUtilities Needed:%0D%0A`} className="inline-block">
                    <Button className="w-full sm:w-auto px-10 py-6 text-lg font-bold rounded-lg bg-[#FF6B35] hover:bg-[#e55a2b] text-white h-full">
                      Request Service
                    </Button>
                  </a>
                </div>
              </div>

              <p className="text-sm text-blue-200 mb-6">
                Or email us directly at <a href="mailto:support@electricscouts.com" className="underline font-semibold hover:text-white">support@electricscouts.com</a>
              </p>

              <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
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
    </>
  );
}