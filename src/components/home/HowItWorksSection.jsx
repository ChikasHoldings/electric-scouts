import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const steps = [
  {
    number: "1",
    title: "Enter Your ZIP Code",
    description: "Enter your ZIP code to see available plans. We'll instantly show you personalized rates from trusted Texas providers."
  },
  {
    number: "2",
    title: "Compare & Choose",
    description: "Review side-by-side comparisons of electricity plans based on your usage. Filter by price, contract length, renewable energy, and more to find the perfect fit for your needs."
  },
  {
    number: "3",
    title: "Sign Up & Save",
    description: "Once you've found your ideal plan, sign up directly online in just minutes. Start saving on your electricity bill immediately with no hidden fees or surprises."
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-3">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Compare plans, switch providers, and start saving in three easy steps.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 mb-10">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              <div className="mb-4">
                <div className="w-14 h-14 bg-[#0A5C8C] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto">
                  {step.number}
                </div>
              </div>
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
        <div className="text-center">
          <Link to={createPageUrl("CompareRates")}>
            <Button className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white font-semibold px-10 py-3 text-lg rounded-lg transition-all duration-300">
              Compare Rates Now
            </Button>
          </Link>
        </div>
      </div>
    </section>);

}