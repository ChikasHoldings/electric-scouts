import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const steps = [
  {
    number: "1",
    title: "Enter ZIP Code",
    description: "Tell us where you live"
  },
  {
    number: "2",
    title: "Compare Plans",
    description: "View personalized rates"
  },
  {
    number: "3",
    title: "Start Saving",
    description: "Switch in minutes"
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600">
            Three simple steps to start saving on your electricity bill
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-[#0A5C8C] text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto">
                  {step.number}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to={createPageUrl("CompareRates")}>
            <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold px-10 py-3 text-lg rounded-lg transition-all duration-300">
              Get Started Now
            </Button>
          </Link>
        </div>
      </div>
    </section>);

}