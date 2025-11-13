import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Search, Zap, ArrowRight } from "lucide-react";

const steps = [
{
  number: "01",
  icon: MapPin,
  title: "Enter your ZIP code",
  description: "Enter Your Zip Code to view the best electricity rates in your area.",
  gradient: "from-blue-500 to-cyan-500"
},
{
  number: "02",
  icon: Search,
  title: "Shop and compare plans",
  description: "Shop & compare plans for one that fits your lifestyle.",
  gradient: "from-purple-500 to-pink-500"
},
{
  number: "03",
  icon: Zap,
  title: "Sign up in minutes",
  description: "Sign-up in minutes online or over the phone- it's that simple.",
  gradient: "from-orange-500 to-red-500"
}];


export default function HowItWorksSection() {
  return (
    <section className="py-16 lg:py-20 bg-gradient-to-b from-gray-50 via-white to-gray-50 relative overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="bg-slate-50 absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #000 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 rounded-full px-3 py-1.5 border border-purple-100 mb-4">
            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Simple 3-Step Process</span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            How It Works
          </h2>
          <p className="text-lg bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">
            Your Quest to Magical Savings
          </p>
        </div>

        {/* Steps with Connecting Lines */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute top-16 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-orange-200"></div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {steps.map((step, index) =>
            <div key={index} className="relative group">
                {/* Step Card */}
                <div className="relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-500"></div>
                  <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 transform hover:-translate-y-1">
                    {/* Number Badge */}
                    <div className={`absolute -top-4 left-6 w-12 h-12 bg-gradient-to-br ${step.gradient} rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-lg font-bold text-white">{step.number}</span>
                    </div>

                    {/* Icon */}
                    <div className="mt-6 mb-4">
                      <div className={`w-14 h-14 bg-gradient-to-br ${step.gradient} rounded-xl flex items-center justify-center mx-auto shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:rotate-6`}>
                        <step.icon className="w-7 h-7 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed text-center">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-10 shadow-xl">
          <h3 className="text-2xl font-bold text-white mb-2">Ready to Start Saving?</h3>
          <p className="text-base text-gray-300 mb-6">Compare rates and switch in minutes</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to={createPageUrl("CompareRates")}>
              <Button
                size="lg"
                className="group bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-semibold px-10 py-5 text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">

                Compare Rates Now
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <div className="flex items-center gap-2 text-white">
              <span className="text-sm text-gray-400">or call</span>
              <a href="tel:855-475-8315" className="text-base font-bold hover:text-orange-400 transition-colors underline">
                855-475-8315
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>);

}