import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const steps = [
  {
    title: "Enter your ZIP code.",
    description: "Enter Your Zip Code to view the best electricity rates in your area.",
    image: "https://www.powerwizard.com/wp-content/uploads/2025/04/dummy-img.png"
  },
  {
    title: "Shop and sort through plans.",
    description: "Shop & compare plans for one that fits your lifestyle.",
    image: "https://www.powerwizard.com/wp-content/uploads/2025/04/dummy-img.png"
  },
  {
    title: "Sign up in minutes!",
    description: "Sign-up in minutes online or over the phone- it's that simple.",
    image: "https://www.powerwizard.com/wp-content/uploads/2025/04/dummy-img.png"
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
            How It Works
          </h2>
          <p className="text-xl text-gray-700">
            Your Quest to Magical Savings
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          {steps.map((step, index) => (
            <div key={index} className="text-center">
              {/* Image placeholder */}
              <div className="w-full aspect-square bg-gray-100 rounded-2xl mb-6 overflow-hidden">
                <img 
                  src={step.image}
                  alt={step.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-2">
          <div>
            <Link to={createPageUrl("CompareRates")}>
              <Button 
                className="px-12 py-6 text-base font-semibold rounded-lg"
                style={{backgroundColor: '#FF6B6B', color: 'white'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#FF5555'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#FF6B6B'}
              >
                Compare Rates
              </Button>
            </Link>
          </div>
          <p className="text-gray-700">
            Or give us a call at{" "}
            <a href="tel:855-475-8315" className="text-blue-600 hover:text-blue-700 font-normal underline">
              855-475-8315
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}