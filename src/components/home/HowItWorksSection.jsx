import React from "react";
import { MapPin, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const steps = [
  {
    number: "1",
    icon: MapPin,
    title: "Enter your ZIP code.",
    description: "Enter Your Zip Code to view the best electricity rates in your area."
  },
  {
    number: "2",
    icon: Search,
    title: "Shop and sort through plans.",
    description: "Shop & compare plans for one that fits your lifestyle."
  },
  {
    number: "3",
    icon: CheckCircle,
    title: "Sign up in minutes!",
    description: "Sign-up in minutes online or over the phone- it's that simple."
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-2xl text-gray-600 font-normal">
            Your Quest to Magical Savings
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              {/* Icon Circle */}
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <step.icon className="w-16 h-16 text-teal-500" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <Link to={createPageUrl("CompareRates")}>
            <Button 
              size="lg" 
              className="bg-coral-500 hover:bg-coral-600 text-white px-12 py-6 text-lg font-semibold rounded-lg"
            >
              Compare Rates
            </Button>
          </Link>
          <p className="text-gray-600">
            Or give us a call at{" "}
            <a href="tel:855-475-8315" className="text-teal-600 font-normal hover:text-teal-700 underline">
              855-475-8315
            </a>
          </p>
        </div>
      </div>

      <style>{`
        .bg-coral-500 { background-color: #FF6B5B; }
        .hover\\:bg-coral-600:hover { background-color: #E95A4A; }
      `}</style>
    </section>
  );
}