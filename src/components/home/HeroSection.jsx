import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function HeroSection({ zipCode, setZipCode, onCompare }) {
  return (
    <section className="relative bg-gradient-to-b from-gray-50 to-white overflow-hidden py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Star Rating */}
            <div className="flex items-center gap-3">
              <img 
                src="https://www.powerwizard.com/wp-content/uploads/2025/04/star-rating.svg"
                alt="4.8 star rating"
                className="h-6"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
              <div className="hidden items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-gray-900 font-semibold text-lg">4.8</span>
              <span className="text-gray-600">•</span>
              <Link to={createPageUrl("Home")} className="text-blue-600 hover:text-blue-700 font-normal text-lg">
                1,200+ Reviews
              </Link>
            </div>

            {/* Main Headline */}
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6" style={{fontFamily: 'system-ui, -apple-system, sans-serif'}}>
                Compare the Best Electricity Rates
              </h1>
              <p className="text-xl text-gray-700 leading-relaxed">
                Finding the right electricity plan that fits your lifestyle has never been easier.
              </p>
            </div>

            {/* ZIP Code Input - Single line with border */}
            <div className="flex items-stretch border-2 border-gray-300 rounded-lg overflow-hidden max-w-2xl">
              <div className="flex-1 flex items-center gap-3 px-5 py-4 bg-white">
                <MapPin className="w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Enter ZIP code"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base p-0 h-auto placeholder:text-gray-400"
                  maxLength={5}
                />
              </div>
              <Button
                onClick={onCompare}
                className="px-10 py-4 text-base font-semibold rounded-none border-0"
                style={{backgroundColor: '#FF6B6B', color: 'white'}}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#FF5555'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#FF6B6B'}
              >
                Compare Rates
              </Button>
            </div>

            {/* Secondary CTA */}
            <div>
              <Link
                to={createPageUrl("BusinessRates")}
                className="text-blue-600 hover:text-blue-700 font-normal inline-flex items-center gap-2 text-base"
              >
                Shop Business Electricity Rates
                <span>›</span>
              </Link>
            </div>
          </div>

          {/* Right Illustration */}
          <div className="relative">
            <img 
              src="https://www.powerwizard.com/wp-content/uploads/2025/08/hero-house-4-600x435-1-e1755614726248.webp"
              alt="Smart home with electricity savings"
              className="w-full h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
}